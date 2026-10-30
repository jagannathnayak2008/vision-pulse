import { Router } from "express";
import { query } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

// GET /api/analytics/summary
router.get("/summary", async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Overall counts and averages
    const reportsResult = await query(
      "SELECT id, domain, verdict, health_score, confidence_score, created_at FROM inspection_reports WHERE user_id = $1",
      [userId]
    );

    const reports = reportsResult.rows;
    const totalInspections = reports.length;

    let passCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let totalHealth = 0;
    let totalConfidence = 0;

    const domainCounts = {
      MANUFACTURING_QC: 0,
      INFRASTRUCTURE_CIVIL: 0,
      WORKPLACE_SAFETY_EHS: 0,
      DOCUMENT_GAUGE_OCR: 0,
    };

    for (const r of reports) {
      if (r.verdict === "PASS") passCount++;
      else if (r.verdict === "CONDITIONAL_WARNING") warningCount++;
      else if (r.verdict === "FAIL_CRITICAL") criticalCount++;

      totalHealth += Number(r.health_score || 0);
      totalConfidence += Number(r.confidence_score || 0);

      if (domainCounts[r.domain] !== undefined) {
        domainCounts[r.domain]++;
      }
    }

    const averageHealthScore = totalInspections > 0 ? Math.round(totalHealth / totalInspections) : 0;
    const averageConfidence = totalInspections > 0 ? Number((totalConfidence / totalInspections).toFixed(1)) : 0;
    const criticalFailureRate = totalInspections > 0 ? Number(((criticalCount / totalInspections) * 100).toFixed(1)) : 0;

    // 2. Fetch all anomalies for category and severity distribution
    const anomaliesResult = await query(
      "SELECT category, severity, is_acknowledged FROM detected_anomalies WHERE user_id = $1",
      [userId]
    );

    const anomalies = anomaliesResult.rows;
    const totalAnomalies = anomalies.length;

    const severityCounts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFO: 0,
    };

    const categoryMap = {};

    for (const a of anomalies) {
      if (severityCounts[a.severity] !== undefined) {
        severityCounts[a.severity]++;
      }

      const cat = a.category || "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    }

    const topCategories = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 3. Comparisons count
    const compResult = await query(
      "SELECT COUNT(*) as count FROM visual_comparisons WHERE user_id = $1",
      [userId]
    );
    const totalComparisons = parseInt(compResult.rows[0]?.count || 0, 10);

    return res.json({
      success: true,
      metrics: {
        totalInspections,
        totalAnomalies,
        totalComparisons,
        criticalFailureRate,
        averageHealthScore,
        averageConfidence,
        verdictBreakdown: {
          PASS: passCount,
          CONDITIONAL_WARNING: warningCount,
          FAIL_CRITICAL: criticalCount,
        },
        severityDistribution: severityCounts,
        domainBreakdown: domainCounts,
        topDefectCategories: topCategories,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

