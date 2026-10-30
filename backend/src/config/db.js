import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import crypto from "crypto";

dotenv.config();

const { Pool } = pg;

export const DDL_QUERY = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    organization VARCHAR(150) NOT NULL DEFAULT 'Enterprise Operations',
    role VARCHAR(60) NOT NULL DEFAULT 'Lead Quality Inspector',
    default_domain VARCHAR(50) NOT NULL DEFAULT 'MANUFACTURING_QC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. INSPECTION REPORTS TABLE
CREATE TABLE IF NOT EXISTS inspection_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    domain VARCHAR(50) NOT NULL CHECK (domain IN ('MANUFACTURING_QC', 'INFRASTRUCTURE_CIVIL', 'WORKPLACE_SAFETY_EHS', 'DOCUMENT_GAUGE_OCR')),
    asset_identifier VARCHAR(100) NOT NULL,
    facility_location VARCHAR(150) NOT NULL,
    compliance_standard VARCHAR(100) DEFAULT 'ISO-9001',
    sensitivity_level VARCHAR(40) NOT NULL DEFAULT 'HIGH_PRECISION',
    operator_notes TEXT,
    image_mime_type VARCHAR(50) NOT NULL,
    image_data_url TEXT NOT NULL,
    verdict VARCHAR(40) NOT NULL CHECK (verdict IN ('PASS', 'CONDITIONAL_WARNING', 'FAIL_CRITICAL')),
    health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    confidence_score NUMERIC(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    scene_summary TEXT NOT NULL,
    extracted_text_ocr TEXT,
    environmental_lighting VARCHAR(80),
    operational_risk_summary TEXT NOT NULL,
    remediation_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
    workflow_status VARCHAR(40) NOT NULL DEFAULT 'OPEN' CHECK (workflow_status IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DETECTED ANOMALIES TABLE
CREATE TABLE IF NOT EXISTS detected_anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES inspection_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(140) NOT NULL,
    category VARCHAR(100) NOT NULL,
    severity VARCHAR(30) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
    confidence NUMERIC(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    box_ymin INTEGER NOT NULL CHECK (box_ymin >= 0 AND box_ymin <= 1000),
    box_xmin INTEGER NOT NULL CHECK (box_xmin >= 0 AND box_xmin <= 1000),
    box_ymax INTEGER NOT NULL CHECK (box_ymax >= 0 AND box_ymax <= 1000),
    box_xmax INTEGER NOT NULL CHECK (box_xmax >= 0 AND box_xmax <= 1000),
    description TEXT NOT NULL,
    root_cause_hypothesis TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. VISUAL COMPARISONS TABLE
CREATE TABLE IF NOT EXISTS visual_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    asset_identifier VARCHAR(100) NOT NULL,
    comparison_objective VARCHAR(60) NOT NULL,
    baseline_image_data_url TEXT NOT NULL,
    current_image_data_url TEXT NOT NULL,
    change_verdict VARCHAR(50) NOT NULL CHECK (change_verdict IN ('IMPROVED', 'UNCHANGED', 'DEGRADED', 'CRITICAL_REGRESSION')),
    delta_score INTEGER NOT NULL CHECK (delta_score >= -100 AND delta_score <= 100),
    executive_comparison_summary TEXT NOT NULL,
    key_differences JSONB NOT NULL DEFAULT '[]'::jsonb,
    next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. INSPECTION CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS inspection_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES inspection_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('USER', 'AI')),
    message_text TEXT NOT NULL,
    suggested_followups JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_inspections_user_created ON inspection_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_domain ON inspection_reports(user_id, domain);
CREATE INDEX IF NOT EXISTS idx_inspections_verdict ON inspection_reports(user_id, verdict);
CREATE INDEX IF NOT EXISTS idx_anomalies_inspection ON detected_anomalies(inspection_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_user ON visual_comparisons(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_inspection ON inspection_chat_messages(inspection_id, created_at ASC);
`;

let pool = null;
let useMemoryFallback = false;

// In-memory data store for resilient zero-config execution
const memoryStore = {
  users: [],
  inspection_reports: [],
  detected_anomalies: [],
  visual_comparisons: [],
  inspection_chat_messages: [],
};

// Initialize PostgreSQL Pool
if (process.env.DATABASE_URL) {
  const isSslRequired = process.env.DATABASE_URL.includes("sslmode=require") ||
    process.env.DATABASE_URL.includes("neon.tech") ||
    process.env.DATABASE_URL.includes("supabase.co");

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isSslRequired ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 4000,
  });

  pool.on("error", (err) => {
    console.error("[PostgreSQL Pool Error]", err.message);
  });
}

/**
 * Universal Query Executor
 * Routes queries to PostgreSQL Pool when available, or executes against in-memory store
 */
export async function query(text, params = []) {
  if (pool && !useMemoryFallback) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      if (err.code === "ECONNREFUSED" || err.message?.includes("connect")) {
        console.warn("[OptiGuard DB] PostgreSQL connection unavailable. Falling back to in-memory store.");
        useMemoryFallback = true;
        return executeMemoryQuery(text, params);
      }
      throw err;
    }
  }

  return executeMemoryQuery(text, params);
}

/**
 * Transaction Client helper
 */
export async function getClient() {
  if (pool && !useMemoryFallback) {
    try {
      const client = await pool.connect();
      return client;
    } catch (err) {
      console.warn("[OptiGuard DB] Transaction connection failed, falling back to memory client.");
      useMemoryFallback = true;
    }
  }

  return {
    query: async (text, params) => executeMemoryQuery(text, params),
    release: () => {},
  };
}

/**
 * In-memory SQL emulator for zero-dependency local testing
 */
function executeMemoryQuery(sql, params = []) {
  const trimmed = sql.trim().replace(/\s+/g, " ");

  // DDL queries (CREATE TABLE, EXTENSION, INDEX)
  if (
    trimmed.startsWith("CREATE ") ||
    trimmed.startsWith("ALTER ") ||
    trimmed.startsWith("DROP ")
  ) {
    return { rows: [], rowCount: 0 };
  }

  // BEGIN / COMMIT / ROLLBACK
  if (trimmed === "BEGIN" || trimmed === "COMMIT" || trimmed === "ROLLBACK") {
    return { rows: [], rowCount: 0 };
  }

  // 1. INSERT INTO users
  if (trimmed.includes("INSERT INTO users")) {
    const id = crypto.randomUUID();
    const [fullName, email, passwordHash, organization, role, defaultDomain] = params;
    const now = new Date();
    const user = {
      id,
      full_name: fullName,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      organization: organization || "Enterprise Operations",
      role: role || "Lead Quality Inspector",
      default_domain: defaultDomain || "MANUFACTURING_QC",
      created_at: now,
      updated_at: now,
    };
    memoryStore.users.push(user);
    return { rows: [user], rowCount: 1 };
  }

  // 2. SELECT FROM users
  if (trimmed.includes("FROM users")) {
    if (trimmed.includes("WHERE email = $1")) {
      const user = memoryStore.users.find(u => u.email.toLowerCase() === String(params[0]).toLowerCase());
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    if (trimmed.includes("WHERE id = $1")) {
      const user = memoryStore.users.find(u => u.id === params[0]);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    return { rows: [...memoryStore.users], rowCount: memoryStore.users.length };
  }

  // 3. UPDATE users
  if (trimmed.includes("UPDATE users")) {
    const [fullName, organization, role, defaultDomain, id] = params;
    const user = memoryStore.users.find(u => u.id === id);
    if (user) {
      if (fullName) user.full_name = fullName;
      if (organization) user.organization = organization;
      if (role) user.role = role;
      if (defaultDomain) user.default_domain = defaultDomain;
      user.updated_at = new Date();
      return { rows: [user], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 4. INSERT INTO inspection_reports
  if (trimmed.includes("INSERT INTO inspection_reports")) {
    const id = crypto.randomUUID();
    const [
      userId, title, domain, assetIdentifier, facilityLocation,
      complianceStandard, sensitivityLevel, operatorNotes,
      imageMimeType, imageDataUrl, verdict, healthScore,
      confidenceScore, sceneSummary, extractedTextOcr,
      environmentalLighting, operationalRiskSummary, remediationPlan, workflowStatus
    ] = params;

    const report = {
      id,
      user_id: userId,
      title,
      domain,
      asset_identifier: assetIdentifier,
      facility_location: facilityLocation,
      compliance_standard: complianceStandard || "ISO-9001",
      sensitivity_level: sensitivityLevel || "HIGH_PRECISION",
      operator_notes: operatorNotes || "",
      image_mime_type: imageMimeType,
      image_data_url: imageDataUrl,
      verdict,
      health_score: Number(healthScore),
      confidence_score: Number(confidenceScore),
      scene_summary: sceneSummary,
      extracted_text_ocr: extractedTextOcr || "None detected",
      environmental_lighting: environmentalLighting || "Standard",
      operational_risk_summary: operationalRiskSummary,
      remediation_plan: typeof remediationPlan === "string" ? JSON.parse(remediationPlan) : remediationPlan,
      workflow_status: workflowStatus || "OPEN",
      created_at: new Date(),
      updated_at: new Date(),
    };
    memoryStore.inspection_reports.unshift(report);
    return { rows: [report], rowCount: 1 };
  }

  // 5. INSERT INTO detected_anomalies
  if (trimmed.includes("INSERT INTO detected_anomalies")) {
    const id = crypto.randomUUID();
    const [
      inspectionId, userId, label, category, severity, confidence,
      boxYmin, boxXmin, boxYmax, boxXmax, description,
      rootCauseHypothesis, recommendedAction
    ] = params;

    const anomaly = {
      id,
      inspection_id: inspectionId,
      user_id: userId,
      label,
      category,
      severity,
      confidence: Number(confidence),
      box_ymin: Number(boxYmin),
      box_xmin: Number(boxXmin),
      box_ymax: Number(boxYmax),
      box_xmax: Number(boxXmax),
      description,
      root_cause_hypothesis: rootCauseHypothesis,
      recommended_action: recommendedAction,
      is_acknowledged: false,
      created_at: new Date(),
    };
    memoryStore.detected_anomalies.push(anomaly);
    return { rows: [anomaly], rowCount: 1 };
  }

  // 6. SELECT FROM inspection_reports
  if (trimmed.includes("FROM inspection_reports")) {
    let results = memoryStore.inspection_reports.filter(r => r.user_id === params[0]);

    if (trimmed.includes("WHERE id = $1 AND user_id = $2") || trimmed.includes("WHERE id = $2 AND user_id = $1")) {
      const targetId = trimmed.includes("WHERE id = $1") ? params[0] : params[1];
      const targetUser = trimmed.includes("WHERE id = $1") ? params[1] : params[0];
      const match = memoryStore.inspection_reports.find(r => r.id === targetId && r.user_id === targetUser);
      return { rows: match ? [match] : [], rowCount: match ? 1 : 0 };
    }

    if (params[1]) {
      // filters like domain, verdict, etc.
      if (trimmed.includes("domain =")) {
        results = results.filter(r => r.domain === params[1]);
      }
    }

    return { rows: results, rowCount: results.length };
  }

  // 7. SELECT FROM detected_anomalies
  if (trimmed.includes("FROM detected_anomalies")) {
    if (trimmed.includes("WHERE user_id = $1")) {
      const userId = params[0];
      const anomalies = memoryStore.detected_anomalies.filter(a => a.user_id === userId);
      return { rows: anomalies, rowCount: anomalies.length };
    }
    const inspectionId = params[0];
    const anomalies = memoryStore.detected_anomalies.filter(a => a.inspection_id === inspectionId);
    return { rows: anomalies, rowCount: anomalies.length };
  }

  // 8. UPDATE inspection_reports
  if (trimmed.includes("UPDATE inspection_reports")) {
    if (trimmed.includes("workflow_status = $1")) {
      const [status, id, userId] = params;
      const report = memoryStore.inspection_reports.find(r => r.id === id && r.user_id === userId);
      if (report) {
        report.workflow_status = status;
        report.updated_at = new Date();
        return { rows: [report], rowCount: 1 };
      }
    }
    return { rows: [], rowCount: 0 };
  }

  // 9. UPDATE detected_anomalies (toggle acknowledged)
  if (trimmed.includes("UPDATE detected_anomalies")) {
    const [anomalyId, userId] = params;
    const anomaly = memoryStore.detected_anomalies.find(a => a.id === anomalyId && a.user_id === userId);
    if (anomaly) {
      anomaly.is_acknowledged = !anomaly.is_acknowledged;
      return { rows: [anomaly], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 10. DELETE FROM inspection_reports
  if (trimmed.includes("DELETE FROM inspection_reports")) {
    const [id, userId] = params;
    const initialLen = memoryStore.inspection_reports.length;
    memoryStore.inspection_reports = memoryStore.inspection_reports.filter(r => !(r.id === id && r.user_id === userId));
    memoryStore.detected_anomalies = memoryStore.detected_anomalies.filter(a => a.inspection_id !== id);
    memoryStore.inspection_chat_messages = memoryStore.inspection_chat_messages.filter(m => m.inspection_id !== id);
    return { rows: [], rowCount: initialLen - memoryStore.inspection_reports.length };
  }

  // 11. INSERT INTO visual_comparisons
  if (trimmed.includes("INSERT INTO visual_comparisons")) {
    const id = crypto.randomUUID();
    const [
      userId, title, domain, assetIdentifier, comparisonObjective,
      baselineImageDataUrl, currentImageDataUrl, changeVerdict,
      deltaScore, executiveComparisonSummary, keyDifferences, nextSteps
    ] = params;

    const comp = {
      id,
      user_id: userId,
      title,
      domain,
      asset_identifier: assetIdentifier,
      comparison_objective: comparisonObjective,
      baseline_image_data_url: baselineImageDataUrl,
      current_image_data_url: currentImageDataUrl,
      change_verdict: changeVerdict,
      delta_score: Number(deltaScore),
      executive_comparison_summary: executiveComparisonSummary,
      key_differences: typeof keyDifferences === "string" ? JSON.parse(keyDifferences) : keyDifferences,
      next_steps: typeof nextSteps === "string" ? JSON.parse(nextSteps) : nextSteps,
      created_at: new Date(),
    };
    memoryStore.visual_comparisons.unshift(comp);
    return { rows: [comp], rowCount: 1 };
  }

  // 12. SELECT FROM visual_comparisons
  if (trimmed.includes("FROM visual_comparisons")) {
    const userId = params[0];
    const comparisons = memoryStore.visual_comparisons.filter(c => c.user_id === userId);
    if (trimmed.includes("COUNT(")) {
      return { rows: [{ count: comparisons.length }], rowCount: 1 };
    }
    return { rows: comparisons, rowCount: comparisons.length };
  }

  // 13. INSERT INTO inspection_chat_messages
  if (trimmed.includes("INSERT INTO inspection_chat_messages")) {
    const id = crypto.randomUUID();
    const [inspectionId, userId, sender, messageText, suggestedFollowups] = params;
    const msg = {
      id,
      inspection_id: inspectionId,
      user_id: userId,
      sender,
      message_text: messageText,
      suggested_followups: typeof suggestedFollowups === "string" ? JSON.parse(suggestedFollowups) : (suggestedFollowups || []),
      created_at: new Date(),
    };
    memoryStore.inspection_chat_messages.push(msg);
    return { rows: [msg], rowCount: 1 };
  }

  // 14. SELECT FROM inspection_chat_messages
  if (trimmed.includes("FROM inspection_chat_messages")) {
    const inspectionId = params[0];
    const msgs = memoryStore.inspection_chat_messages.filter(m => m.inspection_id === inspectionId);
    return { rows: msgs, rowCount: msgs.length };
  }

  // 15. Analytics / Counts
  if (trimmed.includes("COUNT(")) {
    const userId = params[0];
    const userReports = memoryStore.inspection_reports.filter(r => r.user_id === userId);
    const total = userReports.length;
    const pass = userReports.filter(r => r.verdict === "PASS").length;
    const warning = userReports.filter(r => r.verdict === "CONDITIONAL_WARNING").length;
    const fail = userReports.filter(r => r.verdict === "FAIL_CRITICAL").length;
    const avgHealth = total > 0 ? userReports.reduce((s, r) => s + r.health_score, 0) / total : 0;
    const avgConf = total > 0 ? userReports.reduce((s, r) => s + r.confidence_score, 0) / total : 0;

    return {
      rows: [{
        total_inspections: total,
        pass_count: pass,
        warning_count: warning,
        critical_count: fail,
        avg_health_score: Math.round(avgHealth),
        avg_confidence_score: Number(avgConf.toFixed(2)),
      }],
      rowCount: 1,
    };
  }

  return { rows: [], rowCount: 0 };
}

/**
 * Bootstrap database DDL and pre-seeded Demo user
 */
export async function initDb() {
  console.log("[OptiGuard DB] Checking database connectivity and schema...");

  try {
    if (pool) {
      await pool.query("SELECT 1;");
      console.log("[OptiGuard DB] Connected to PostgreSQL successfully.");

      // Run DDL script
      await pool.query(DDL_QUERY);
      console.log("[OptiGuard DB] PostgreSQL tables and indexes verified.");
    }
  } catch (err) {
    console.warn(`[OptiGuard DB] PostgreSQL unavailable (${err.message}). Using in-memory store.`);
    useMemoryFallback = true;
  }

  // Pre-seed Demo Inspector user: demo@optiguard.ai / DemoPass123!
  const demoEmail = "demo@optiguard.ai";
  const demoPassword = "DemoPass123!";

  try {
    const existing = await query("SELECT id FROM users WHERE email = $1", [demoEmail]);
    if (existing.rows.length === 0) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(demoPassword, salt);

      const res = await query(
        `INSERT INTO users (full_name, email, password_hash, organization, role, default_domain)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          "Dr. Elena Vance (Demo Lead)",
          demoEmail,
          passwordHash,
          "OptiGuard Industrial Systems",
          "Principal Inspection Specialist",
          "MANUFACTURING_QC",
        ]
      );
      const demoUserId = res.rows[0].id;
      console.log(`[OptiGuard DB] Demo Inspector account created: ${demoEmail} / ${demoPassword}`);

      // Seed benchmark inspection reports for the demo account
      await seedDemoInspections(demoUserId);
    } else {
      console.log(`[OptiGuard DB] Demo Inspector account ready: ${demoEmail}`);
    }
  } catch (seedErr) {
    console.error("[OptiGuard DB] Error initializing demo user:", seedErr.message);
  }
}

/**
 * Pre-populate demo inspections for immediate high-fidelity testing
 */
async function seedDemoInspections(userId) {
  try {
    // 1. PCB Solder Bridge Inspection
    const r1 = await query(
      `INSERT INTO inspection_reports (
        user_id, title, domain, asset_identifier, facility_location,
        compliance_standard, sensitivity_level, operator_notes,
        image_mime_type, image_data_url, verdict, health_score,
        confidence_score, scene_summary, extracted_text_ocr,
        environmental_lighting, operationalRiskSummary, remediation_plan, workflow_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
      [
        userId,
        "High-Density SMT PCB Micro-Inspection - Rev 4.2",
        "MANUFACTURING_QC",
        "PCB-SMT-44091-B",
        "Austin Advanced Fab, Cleanroom 2",
        "IPC-A-610 Class 3",
        "HIGH_PRECISION",
        "Automated optical check detected potential solder bridging on IC pin header.",
        "image/png",
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='800' height='600' fill='%230f2b1d'/><rect x='100' y='100' width='600' height='400' fill='%2314532d' rx='12' stroke='%2322c55e' stroke-width='2'/><circle cx='180' cy='180' r='18' fill='%23eab308'/><circle cx='240' cy='180' r='18' fill='%23eab308'/><circle cx='300' cy='180' r='18' fill='%23eab308'/><rect x='380' y='160' width='220' height='120' fill='%231e293b' stroke='%2394a3b8' stroke-width='2'/><text x='420' y='225' fill='%23f8fafc' font-family='monospace' font-size='16'>ARM Cortex M7</text><rect x='380' y='275' width='14' height='20' fill='%23cbd5e1'/><rect x='410' y='275' width='14' height='20' fill='%23cbd5e1'/><rect x='440' y='275' width='14' height='20' fill='%23ef4444'/><rect x='470' y='275' width='14' height='20' fill='%23ef4444'/><path d='M450 285 L474 285' stroke='%23ef4444' stroke-width='6'/><text x='150' y='460' fill='%2322c55e' font-family='monospace' font-size='20'>PCB-SMT-44091-B // LOT: 2026-X</text></svg>",
        "FAIL_CRITICAL",
        42,
        96.5,
        "High-density multi-layer surface mount circuit board showing dual IC packages, SMD passives, and gold-plated test pads. Excessive solder flow observed between pins 14 and 15 on IC-2.",
        "ARM Cortex M7, PCB-SMT-44091-B, LOT: 2026-X, TEST_PAD_01_OK",
        "Direct diffuse ring illumination, low glare, optimal contrast.",
        "Short circuit hazard on 3.3V power bus. Powering this unit will destroy IC-2 and cause downstream MCU failure.",
        JSON.stringify([
          {
            stepNumber: 1,
            actionTitle: "Quarantine Batch Lot",
            detailedInstruction: "Isolate unit PCB-SMT-44091-B and tag assembly line 3 for reflow profile calibration.",
            priority: "IMMEDIATE",
            estimatedTimeMinutes: 15,
            requiredToolsOrPpe: "ESD Wrist Strap, Anti-Static Bin",
          },
          {
            stepNumber: 2,
            actionTitle: "Hot-Air Desoldering & Wick Wick-Off",
            detailedInstruction: "Use fine copper solder wick with mild RMA flux under microscope magnification to remove excess solder bridge.",
            priority: "IMMEDIATE",
            estimatedTimeMinutes: 20,
            requiredToolsOrPpe: "Microscope, Desoldering Iron, Flux Pen, IPC-A-610 Guide",
          },
          {
            stepNumber: 3,
            actionTitle: "Impedance & Continuity Verification",
            detailedInstruction: "Measure resistance across Pin 14-15 to ensure open circuit > 500k Ohm before re-testing.",
            priority: "SHORT_TERM",
            estimatedTimeMinutes: 10,
            requiredToolsOrPpe: "Digital Multimeter, Microprobes",
          }
        ]),
        "OPEN",
      ]
    );

    const reportId1 = r1.rows[0].id;

    // Anomalies for PCB
    await query(
      `INSERT INTO detected_anomalies (
        inspection_id, user_id, label, category, severity, confidence,
        box_ymin, box_xmin, box_ymax, box_xmax, description,
        root_cause_hypothesis, recommended_action
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        reportId1,
        userId,
        "Micro Solder Bridge Short (Pins 14-15)",
        "Solder Bridge",
        "CRITICAL",
        98.4,
        450,
        540,
        520,
        615,
        "Direct conductive tin-lead solder bridge short-circuiting pin 14 (VDD) to pin 15 (GPIO).",
        "Excessive solder paste deposition in stencil aperture or thermal over-dwell during reflow cycle.",
        "Perform precision desoldering wick rework and calibrate stencil paste thickness.",
      ]
    );

    await query(
      `INSERT INTO detected_anomalies (
        inspection_id, user_id, label, category, severity, confidence,
        box_ymin, box_xmin, box_ymax, box_xmax, description,
        root_cause_hypothesis, recommended_action
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        reportId1,
        userId,
        "Flux Residue Contamination",
        "Chemical Residue",
        "LOW",
        88.2,
        420,
        470,
        470,
        530,
        "Mild amber flux puddle around IC ground pad.",
        "Incomplete ultrasonic wash cycle in pre-bake phase.",
        "Clean surface with 99% isopropyl alcohol and anti-static swab.",
      ]
    );

    // Initial Chat Message
    await query(
      `INSERT INTO inspection_chat_messages (inspection_id, user_id, sender, message_text, suggested_followups)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        reportId1,
        userId,
        "AI",
        "OptiGuard AI analysis complete. I detected a CRITICAL solder bridge across pins 14 and 15 of the ARM microcontroller, along with minor flux residue. IPC-A-610 Class 3 mandates immediate rework prior to power-on. How can I assist you with this unit?",
        JSON.stringify([
          "What is the risk of board delamination during rework?",
          "How can we adjust the solder paste stencil to prevent this?",
          "Show IPC-A-610 tolerance limits for solder bridging."
        ])
      ]
    );

    // 2. Civil Infrastructure Concrete Bridge Crack
    const r2 = await query(
      `INSERT INTO inspection_reports (
        user_id, title, domain, asset_identifier, facility_location,
        compliance_standard, sensitivity_level, operator_notes,
        image_mime_type, image_data_url, verdict, health_score,
        confidence_score, scene_summary, extracted_text_ocr,
        environmental_lighting, operationalRiskSummary, remediation_plan, workflow_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
      [
        userId,
        "Concrete Pier 7 Sub-Structure Structural Integrity Audit",
        "INFRASTRUCTURE_CIVIL",
        "ASSET-BRG-PIER-07",
        "Interstate 35 Overpass, Section 4",
        "ASTM-E284 / ACI-224.1R",
        "ZERO_TOLERANCE",
        "Annual drone inspection survey of highway bridge support piers.",
        "image/png",
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='800' height='600' fill='%2364748b'/><rect x='150' y='50' width='500' height='500' fill='%2394a3b8' stroke='%23334155' stroke-width='4'/><path d='M250 150 Q320 280 290 380 T370 500' stroke='%231e293b' stroke-width='8' fill='none'/><path d='M290 280 Q360 300 410 320' stroke='%231e293b' stroke-width='4' fill='none'/><rect x='170' y='70' width='140' height='40' fill='%230f172a' rx='4'/><text x='180' y='95' fill='%2338bdf8' font-family='monospace' font-size='14'>PIER-07-NORTH</text></svg>",
        "CONDITIONAL_WARNING",
        64,
        94.1,
        "Reinforced concrete support column showing longitudinal diagonal shear crack propagating downward across 350mm of surface. No exposed rebar detected yet.",
        "PIER-07-NORTH, INSP-DATE: 2026-Q1",
        "Natural overcast daylight, no severe shadows, high surface detail.",
        "Potential freeze-thaw water intrusion leading to internal rebar corrosion and loss of compressive strength if unsealed before winter.",
        JSON.stringify([
          {
            stepNumber: 1,
            actionTitle: "Crack Depth Ultrasonic Measurement",
            detailedInstruction: "Deploy ultrasonic pulse velocity (UPV) tester to measure crack depth penetration into core concrete.",
            priority: "IMMEDIATE",
            estimatedTimeMinutes: 45,
            requiredToolsOrPpe: "UPV Device, Safety Harness, Hardhat",
          },
          {
            stepNumber: 2,
            actionTitle: "Epoxy Pressure Injection Sealing",
            detailedInstruction: "Install injection ports every 150mm along the fracture and inject low-viscosity structural epoxy under 100 psi.",
            priority: "SHORT_TERM",
            estimatedTimeMinutes: 180,
            requiredToolsOrPpe: "Epoxy Injection Pump, Safety Goggles, Respirator",
          }
        ]),
        "IN_REVIEW",
      ]
    );

    const reportId2 = r2.rows[0].id;

    await query(
      `INSERT INTO detected_anomalies (
        inspection_id, user_id, label, category, severity, confidence,
        box_ymin, box_xmin, box_ymax, box_xmax, description,
        root_cause_hypothesis, recommended_action
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        reportId2,
        userId,
        "Structural Diagonal Shear Crack",
        "Structural Crack",
        "HIGH",
        95.8,
        240,
        340,
        830,
        530,
        "Continuous diagonal crack measuring approximately 1.8mm width at apex with branch fissure.",
        "Cyclic heavy vehicle vibration combined with thermal expansion stress.",
        "Apply structural epoxy injection and install acoustic vibration monitoring sensor.",
      ]
    );

    // Visual Comparison seed
    await query(
      `INSERT INTO visual_comparisons (
        user_id, title, domain, asset_identifier, comparison_objective,
        baseline_image_data_url, current_image_data_url, change_verdict,
        delta_score, executive_comparison_summary, key_differences, next_steps
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        userId,
        "Turbine Blade T-44 Thermal Coating Degradation Delta",
        "INFRASTRUCTURE_CIVIL",
        "TRB-BLD-T44",
        "DEGRADATION_MONITORING",
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%231e293b'/><path d='M80 250 L200 40 L320 250 Z' fill='%2394a3b8'/><text x='20' y='30' fill='%2338bdf8' font-family='sans-serif' font-size='14'>BASELINE: Month 0 (Clean)</text></svg>",
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%231e293b'/><path d='M80 250 L200 40 L320 250 Z' fill='%2394a3b8'/><circle cx='200' cy='140' r='25' fill='%23b45309'/><text x='20' y='30' fill='%23f59e0b' font-family='sans-serif' font-size='14'>CURRENT: Month 12 (Spalling Area)</text></svg>",
        "DEGRADED",
        -38,
        "Asset shows 12% thermal barrier coating loss centered at mid-span leading edge. Oxidation discoloration has progressed 25mm since baseline inspection.",
        JSON.stringify([
          {
            featureArea: "Leading Edge Thermal Barrier",
            baselineState: "Uniform ceramic thermal barrier coating with 0% flaking",
            currentState: "25mm diameter circular spalling zone with exposed superalloy",
            impactAssessment: "Increased thermal conduction to substrate blade core",
            significance: "HIGH"
          },
          {
            featureArea: "Root Fastener Fillet",
            baselineState: "Clean, zero micro-fissures detected",
            currentState: "Normal discoloration, no structural cracking",
            impactAssessment: "Safe mechanical retention",
            significance: "LOW"
          }
        ]),
        JSON.stringify([
          "Schedule boroscope non-destructive testing at 500 operating hours",
          "Order replacement thermal barrier coating spray kit",
          "Recalibrate combustor nozzle temperature distribution"
        ])
      ]
    );

    console.log("[OptiGuard DB] Sample benchmark inspection reports and visual comparison seeded.");
  } catch (err) {
    console.error("[OptiGuard DB] Error seeding demo data:", err.message);
  }
}
