import { Router } from "express";
import { query, getClient } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadSingle, uploadComparison } from "../middleware/uploadMiddleware.js";
import {
  AnalyzeInspectionRequestSchema,
  CompareInspectionRequestSchema,
  UpdateStatusSchema,
  ChatRequestSchema,
} from "../validators/schemas.js";
import {
  analyzeVisualInspection,
  compareVisualStates,
  askVisualCopilot,
} from "../services/geminiService.js";

const router = Router();

// Apply authMiddleware to all inspection routes
router.use(authMiddleware);

// POST /api/inspections/analyze
router.post("/analyze", (req, res, next) => {
  uploadSingle(req, res, async (uploadErr) => {
    if (uploadErr) {
      return next(uploadErr);
    }

    const client = await getClient();
    try {
      // Validate incoming metadata
      const validatedData = AnalyzeInspectionRequestSchema.parse(req.body);

      let imageMimeType = "image/jpeg";
      let imageDataUrl = "";
      let imageBufferOrBase64 = null;

      if (req.file) {
        imageMimeType = req.file.mimetype;
        const base64 = req.file.buffer.toString("base64");
        imageDataUrl = `data:${imageMimeType};base64,${base64}`;
        imageBufferOrBase64 = req.file.buffer;
      } else if (validatedData.sampleImageBase64) {
        imageMimeType = validatedData.sampleMimeType || "image/png";
        imageDataUrl = validatedData.sampleImageBase64.startsWith("data:")
          ? validatedData.sampleImageBase64
          : `data:${imageMimeType};base64,${validatedData.sampleImageBase64}`;
        imageBufferOrBase64 = validatedData.sampleImageBase64;
      } else {
        return res.status(400).json({
          success: false,
          message: "An image file (imageFile) or benchmark sample (sampleImageBase64) is required.",
        });
      }

      // Execute Multimodal AI Visual Inspection via Gemini Vision
      const aiAnalysis = await analyzeVisualInspection(imageBufferOrBase64, imageMimeType, {
        title: validatedData.title,
        domain: validatedData.domain,
        assetIdentifier: validatedData.assetIdentifier,
        facilityLocation: validatedData.facilityLocation,
        complianceStandard: validatedData.complianceStandard,
        sensitivityLevel: validatedData.sensitivityLevel,
        operatorNotes: validatedData.operatorNotes,
      });

      // Begin Transaction
      await client.query("BEGIN");

      // Insert Inspection Report
      const reportInsertSql = `
        INSERT INTO inspection_reports (
          user_id, title, domain, asset_identifier, facility_location,
          compliance_standard, sensitivity_level, operator_notes,
          image_mime_type, image_data_url, verdict, health_score,
          confidence_score, scene_summary, extracted_text_ocr,
          environmental_lighting, operational_risk_summary, remediation_plan, workflow_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *;
      `;

      const reportValues = [
        req.user.id,
        validatedData.title,
        validatedData.domain,
        validatedData.assetIdentifier,
        validatedData.facilityLocation,
        validatedData.complianceStandard,
        validatedData.sensitivityLevel,
        validatedData.operatorNotes,
        imageMimeType,
        imageDataUrl,
        aiAnalysis.verdict,
        aiAnalysis.healthScore,
        aiAnalysis.confidenceScore,
        aiAnalysis.sceneSummary,
        aiAnalysis.extractedTextOcr,
        aiAnalysis.environmentalLighting,
        aiAnalysis.operationalRiskSummary,
        JSON.stringify(aiAnalysis.remediationPlan),
        "OPEN",
      ];

      const reportResult = await client.query(reportInsertSql, reportValues);
      const savedReport = reportResult.rows[0];

      // Insert itemized anomalies
      const savedAnomalies = [];
      for (const anomaly of aiAnalysis.anomalies) {
        const anomalyInsertSql = `
          INSERT INTO detected_anomalies (
            inspection_id, user_id, label, category, severity, confidence,
            box_ymin, box_xmin, box_ymax, box_xmax, description,
            root_cause_hypothesis, recommended_action
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *;
        `;
        const anomalyValues = [
          savedReport.id,
          req.user.id,
          anomaly.label,
          anomaly.category,
          anomaly.severity,
          anomaly.confidence,
          anomaly.box_ymin,
          anomaly.box_xmin,
          anomaly.box_ymax,
          anomaly.box_xmax,
          anomaly.description,
          anomaly.rootCauseHypothesis,
          anomaly.recommendedAction,
        ];
        const anomalyResult = await client.query(anomalyInsertSql, anomalyValues);
        savedAnomalies.push(anomalyResult.rows[0]);
      }

      // Initial AI Copilot Welcome Message
      const initialMessageText = `Inspection completed for "${savedReport.title}". Overall verdict: ${savedReport.verdict} with Health Score ${savedReport.health_score}/100. ${savedAnomalies.length} anomaly regions localized. How can I assist you with this asset?`;
      const initialFollowups = [
        "What is the recommended priority order for fixing these defects?",
        "Explain the root-cause hypothesis in more detail.",
        "Generate a compliance audit certificate summary for this scan.",
      ];

      await client.query(
        `INSERT INTO inspection_chat_messages (inspection_id, user_id, sender, message_text, suggested_followups)
         VALUES ($1, $2, $3, $4, $5)`,
        [savedReport.id, req.user.id, "AI", initialMessageText, JSON.stringify(initialFollowups)]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message: "Visual inspection completed and stored successfully.",
        report: {
          ...savedReport,
          remediation_plan: typeof savedReport.remediation_plan === "string"
            ? JSON.parse(savedReport.remediation_plan)
            : savedReport.remediation_plan,
          anomalies: savedAnomalies,
        },
      });
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      client.release();
    }
  });
});

// GET /api/inspections (List with filters)
router.get("/", async (req, res, next) => {
  try {
    const { domain, verdict, status, search, limit = 50, offset = 0 } = req.query;

    let queryText = "SELECT * FROM inspection_reports WHERE user_id = $1";
    const queryParams = [req.user.id];
    let paramIndex = 2;

    if (domain) {
      queryText += ` AND domain = $${paramIndex++}`;
      queryParams.push(domain);
    }

    if (verdict) {
      queryText += ` AND verdict = $${paramIndex++}`;
      queryParams.push(verdict);
    }

    if (status) {
      queryText += ` AND workflow_status = $${paramIndex++}`;
      queryParams.push(status);
    }

    if (search) {
      queryText += ` AND (title ILIKE $${paramIndex} OR asset_identifier ILIKE $${paramIndex} OR facility_location ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    queryParams.push(Number(limit), Number(offset));

    const result = await query(queryText, queryParams);

    // Attach anomaly count to each report
    const reportsWithCounts = await Promise.all(
      result.rows.map(async (rep) => {
        const anomalyRes = await query(
          "SELECT COUNT(*) as count FROM detected_anomalies WHERE inspection_id = $1",
          [rep.id]
        );
        return {
          ...rep,
          anomaly_count: parseInt(anomalyRes.rows[0]?.count || 0, 10),
          remediation_plan: typeof rep.remediation_plan === "string"
            ? JSON.parse(rep.remediation_plan)
            : rep.remediation_plan,
        };
      })
    );

    return res.json({
      success: true,
      count: reportsWithCounts.length,
      inspections: reportsWithCounts,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/inspections/:id (Detail view with anomalies and chat history)
router.get("/:id", async (req, res, next) => {
  try {
    const reportResult = await query(
      "SELECT * FROM inspection_reports WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inspection report not found or access denied.",
      });
    }

    const report = reportResult.rows[0];

    // Fetch anomalies
    const anomaliesResult = await query(
      "SELECT * FROM detected_anomalies WHERE inspection_id = $1 ORDER BY severity = 'CRITICAL' DESC, severity = 'HIGH' DESC, created_at ASC",
      [report.id]
    );

    // Fetch chat history
    const chatResult = await query(
      "SELECT * FROM inspection_chat_messages WHERE inspection_id = $1 ORDER BY created_at ASC",
      [report.id]
    );

    return res.json({
      success: true,
      report: {
        ...report,
        remediation_plan: typeof report.remediation_plan === "string"
          ? JSON.parse(report.remediation_plan)
          : report.remediation_plan,
        anomalies: anomaliesResult.rows,
        chat_messages: chatResult.rows.map((m) => ({
          ...m,
          suggested_followups: typeof m.suggested_followups === "string"
            ? JSON.parse(m.suggested_followups)
            : m.suggested_followups,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/inspections/:id/status (Update status or toggle anomaly acknowledged)
router.patch("/:id/status", async (req, res, next) => {
  try {
    const validated = UpdateStatusSchema.parse(req.body);

    // Verify ownership
    const reportCheck = await query(
      "SELECT id FROM inspection_reports WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    if (reportCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inspection report not found or access denied.",
      });
    }

    if (validated.workflowStatus) {
      await query(
        "UPDATE inspection_reports SET workflow_status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3",
        [validated.workflowStatus, req.params.id, req.user.id]
      );
    }

    if (validated.acknowledgeAnomalyId) {
      await query(
        "UPDATE detected_anomalies SET is_acknowledged = NOT is_acknowledged WHERE id = $1 AND user_id = $2",
        [validated.acknowledgeAnomalyId, req.user.id]
      );
    }

    return res.json({
      success: true,
      message: "Inspection status updated successfully.",
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/inspections/:id (Delete inspection report)
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await query(
      "DELETE FROM inspection_reports WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Inspection report not found or access denied.",
      });
    }

    return res.json({
      success: true,
      message: "Inspection report deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/inspections/:id/chat (Visual Copilot follow-up interaction)
router.post("/:id/chat", async (req, res, next) => {
  try {
    const validated = ChatRequestSchema.parse(req.body);

    const reportRes = await query(
      "SELECT * FROM inspection_reports WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    if (reportRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inspection report not found or access denied.",
      });
    }

    const report = reportRes.rows[0];

    const anomaliesRes = await query(
      "SELECT label, category, severity, description FROM detected_anomalies WHERE inspection_id = $1",
      [report.id]
    );

    // Save User Message
    await query(
      `INSERT INTO inspection_chat_messages (inspection_id, user_id, sender, message_text, suggested_followups)
       VALUES ($1, $2, $3, $4, $5)`,
      [report.id, req.user.id, "USER", validated.message, JSON.stringify([])]
    );

    // Call Copilot
    const copilotAnswer = await askVisualCopilot(
      report.image_data_url,
      report.image_mime_type,
      {
        title: report.title,
        asset_identifier: report.asset_identifier,
        domain: report.domain,
        verdict: report.verdict,
        anomalies: anomaliesRes.rows,
      },
      validated.message
    );

    // Save AI Response
    const aiMsgRes = await query(
      `INSERT INTO inspection_chat_messages (inspection_id, user_id, sender, message_text, suggested_followups)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        report.id,
        req.user.id,
        "AI",
        copilotAnswer.answer,
        JSON.stringify(copilotAnswer.suggestedFollowups || []),
      ]
    );

    return res.json({
      success: true,
      reply: {
        ...aiMsgRes.rows[0],
        suggested_followups: copilotAnswer.suggestedFollowups,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/inspections/compare (Before / After Delta Analysis)
router.post("/compare", (req, res, next) => {
  uploadComparison(req, res, async (uploadErr) => {
    if (uploadErr) {
      return next(uploadErr);
    }

    try {
      const validated = CompareInspectionRequestSchema.parse(req.body);

      let baselineMime = "image/jpeg";
      let baselineDataUrl = "";
      let currentMime = "image/jpeg";
      let currentDataUrl = "";

      if (req.files && req.files.baselineImage && req.files.currentImage) {
        const bFile = req.files.baselineImage[0];
        const cFile = req.files.currentImage[0];
        baselineMime = bFile.mimetype;
        currentMime = cFile.mimetype;
        baselineDataUrl = `data:${baselineMime};base64,${bFile.buffer.toString("base64")}`;
        currentDataUrl = `data:${currentMime};base64,${cFile.buffer.toString("base64")}`;
      } else if (validated.baselineImageBase64 && validated.currentImageBase64) {
        baselineMime = validated.baselineMimeType || "image/png";
        currentMime = validated.currentMimeType || "image/png";
        baselineDataUrl = validated.baselineImageBase64.startsWith("data:")
          ? validated.baselineImageBase64
          : `data:${baselineMime};base64,${validated.baselineImageBase64}`;
        currentDataUrl = validated.currentImageBase64.startsWith("data:")
          ? validated.currentImageBase64
          : `data:${currentMime};base64,${validated.currentImageBase64}`;
      } else {
        return res.status(400).json({
          success: false,
          message: "Both baselineImage and currentImage are required for comparison.",
        });
      }

      // Execute AI Delta Comparison
      const deltaResult = await compareVisualStates(
        baselineDataUrl,
        baselineMime,
        currentDataUrl,
        currentMime,
        {
          title: validated.title,
          domain: validated.domain,
          assetIdentifier: validated.assetIdentifier,
          comparisonObjective: validated.comparisonObjective,
        }
      );

      // Save to visual_comparisons
      const insertSql = `
        INSERT INTO visual_comparisons (
          user_id, title, domain, asset_identifier, comparison_objective,
          baseline_image_data_url, current_image_data_url, change_verdict,
          delta_score, executive_comparison_summary, key_differences, next_steps
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `;

      const values = [
        req.user.id,
        validated.title,
        validated.domain,
        validated.assetIdentifier,
        validated.comparisonObjective,
        baselineDataUrl,
        currentDataUrl,
        deltaResult.changeVerdict,
        deltaResult.deltaScore,
        deltaResult.executiveComparisonSummary,
        JSON.stringify(deltaResult.keyDifferences),
        JSON.stringify(deltaResult.nextSteps),
      ];

      const saveRes = await query(insertSql, values);
      const saved = saveRes.rows[0];

      return res.status(201).json({
        success: true,
        message: "Visual delta comparison analyzed and saved.",
        comparison: {
          ...saved,
          key_differences: typeof saved.key_differences === "string"
            ? JSON.parse(saved.key_differences)
            : saved.key_differences,
          next_steps: typeof saved.next_steps === "string"
            ? JSON.parse(saved.next_steps)
            : saved.next_steps,
        },
      });
    } catch (err) {
      next(err);
    }
  });
});

// GET /api/inspections/comparisons/list
router.get("/comparisons/list", async (req, res, next) => {
  try {
    const result = await query(
      "SELECT * FROM visual_comparisons WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );

    const comparisons = result.rows.map((c) => ({
      ...c,
      key_differences: typeof c.key_differences === "string"
        ? JSON.parse(c.key_differences)
        : c.key_differences,
      next_steps: typeof c.next_steps === "string"
        ? JSON.parse(c.next_steps)
        : c.next_steps,
    }));

    return res.json({
      success: true,
      comparisons,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
