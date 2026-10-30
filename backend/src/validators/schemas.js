import { z } from "zod";

export const RegisterSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  organization: z.string().min(2).max(150).optional().default("Enterprise Operations"),
  role: z.string().min(2).max(60).optional().default("Lead Quality Inspector"),
  defaultDomain: z
    .enum(["MANUFACTURING_QC", "INFRASTRUCTURE_CIVIL", "WORKPLACE_SAFETY_EHS", "DOCUMENT_GAUGE_OCR"])
    .optional()
    .default("MANUFACTURING_QC"),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ProfileUpdateSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  organization: z.string().min(2).max(150).optional(),
  role: z.string().min(2).max(60).optional(),
  defaultDomain: z
    .enum(["MANUFACTURING_QC", "INFRASTRUCTURE_CIVIL", "WORKPLACE_SAFETY_EHS", "DOCUMENT_GAUGE_OCR"])
    .optional(),
});

export const AnalyzeInspectionRequestSchema = z.object({
  title: z.string().min(3).max(160),
  domain: z.enum(["MANUFACTURING_QC", "INFRASTRUCTURE_CIVIL", "WORKPLACE_SAFETY_EHS", "DOCUMENT_GAUGE_OCR"]),
  assetIdentifier: z.string().min(1).max(100),
  facilityLocation: z.string().min(2).max(150),
  complianceStandard: z.string().max(100).optional().default("ISO-9001"),
  sensitivityLevel: z.enum(["STANDARD", "HIGH_PRECISION", "ZERO_TOLERANCE"]).optional().default("HIGH_PRECISION"),
  operatorNotes: z.string().max(2000).optional().default(""),
  sampleImageBase64: z.string().optional(),
  sampleMimeType: z.string().optional(),
});

export const CompareInspectionRequestSchema = z.object({
  title: z.string().min(3).max(160),
  domain: z.enum(["MANUFACTURING_QC", "INFRASTRUCTURE_CIVIL", "WORKPLACE_SAFETY_EHS", "DOCUMENT_GAUGE_OCR"]),
  assetIdentifier: z.string().min(1).max(100),
  comparisonObjective: z.enum(["REPAIR_VERIFICATION", "DEGRADATION_MONITORING", "ASSEMBLY_COMPLETION"]),
  baselineImageBase64: z.string().optional(),
  baselineMimeType: z.string().optional(),
  currentImageBase64: z.string().optional(),
  currentMimeType: z.string().optional(),
});

export const UpdateStatusSchema = z.object({
  workflowStatus: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "ARCHIVED"]).optional(),
  acknowledgeAnomalyId: z.string().uuid().optional(),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(2).max(1500),
});

export const AIInspectionOutputValidator = z.object({
  verdict: z.enum(["PASS", "CONDITIONAL_WARNING", "FAIL_CRITICAL"]),
  healthScore: z.number().int().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
  sceneSummary: z.string(),
  extractedTextOcr: z.string(),
  environmentalLighting: z.string(),
  operationalRiskSummary: z.string(),
  anomalies: z.array(
    z.object({
      label: z.string(),
      category: z.string(),
      severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]),
      confidence: z.number().min(0).max(100),
      box_ymin: z.number().int().min(0).max(1000),
      box_xmin: z.number().int().min(0).max(1000),
      box_ymax: z.number().int().min(0).max(1000),
      box_xmax: z.number().int().min(0).max(1000),
      description: z.string(),
      rootCauseHypothesis: z.string(),
      recommendedAction: z.string(),
    })
  ),
  remediationPlan: z.array(
    z.object({
      stepNumber: z.number().int(),
      actionTitle: z.string(),
      detailedInstruction: z.string(),
      priority: z.enum(["IMMEDIATE", "SHORT_TERM", "ROUTINE"]),
      estimatedTimeMinutes: z.number().int(),
      requiredToolsOrPpe: z.string(),
    })
  ),
});

export const ComparisonAnalysisValidator = z.object({
  changeVerdict: z.enum(["IMPROVED", "UNCHANGED", "DEGRADED", "CRITICAL_REGRESSION"]),
  deltaScore: z.number().int().min(-100).max(100),
  executiveComparisonSummary: z.string(),
  keyDifferences: z.array(
    z.object({
      featureArea: z.string(),
      baselineState: z.string(),
      currentState: z.string(),
      impactAssessment: z.string(),
      significance: z.enum(["HIGH", "MEDIUM", "LOW"]),
    })
  ),
  nextSteps: z.array(z.string()),
});

export const VisualCopilotValidator = z.object({
  answer: z.string(),
  suggestedFollowups: z.array(z.string()),
});

