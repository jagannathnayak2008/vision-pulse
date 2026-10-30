-- ==============================================================================
-- OPTIGUARD AI — SUPABASE DEMO SEED DATA
-- Run in Supabase SQL Editor after executing schema.sql
-- ==============================================================================

-- 1. Insert Demo Inspector User
INSERT INTO public.users (
    id,
    full_name,
    email,
    password_hash,
    organization,
    role,
    default_domain
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Dr. Elena Vance (Demo Lead)',
    'demo@optiguard.ai',
    '$2a$12$KkQ4qI9V3u7y6z7gJ3kKKeO.6h8vYp7vH9bT9lM5zKj4VwX6qYy2C', -- DemoPass123!
    'OptiGuard Industrial Systems',
    'Principal Inspection Specialist',
    'MANUFACTURING_QC'
)
ON CONFLICT (email) DO NOTHING;

-- 2. Insert Seed Report 1 (PCB Solder Bridge Defect)
INSERT INTO public.inspection_reports (
    id,
    user_id,
    title,
    domain,
    asset_identifier,
    facility_location,
    compliance_standard,
    sensitivity_level,
    operator_notes,
    image_mime_type,
    image_data_url,
    verdict,
    health_score,
    confidence_score,
    scene_summary,
    extracted_text_ocr,
    environmental_lighting,
    operational_risk_summary,
    remediation_plan,
    workflow_status
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'High-Density SMT PCB Micro-Inspection - Rev 4.2',
    'MANUFACTURING_QC',
    'PCB-SMT-44091-B',
    'Austin Advanced Fab, Cleanroom 2',
    'IPC-A-610 Class 3',
    'HIGH_PRECISION',
    'Automated optical check detected potential solder bridging on IC pin header.',
    'image/svg+xml',
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%230b1b14"/><rect x="60" y="60" width="680" height="480" fill="%23064e3b" rx="16" stroke="%2310b981" stroke-width="3"/></svg>',
    'FAIL_CRITICAL',
    42,
    96.5,
    'High-density multi-layer surface mount circuit board showing dual IC packages, SMD passives, and gold-plated test pads. Excessive solder flow observed between pins 14 and 15 on IC-2.',
    'ARM Cortex M7, PCB-SMT-44091-B, LOT: 2026-X, TEST_PAD_01_OK',
    'Direct diffuse ring illumination, low glare, optimal contrast.',
    'Short circuit hazard on 3.3V power bus. Powering this unit will destroy IC-2 and cause downstream MCU failure.',
    '[{"stepNumber":1,"actionTitle":"Quarantine Batch Lot","detailedInstruction":"Isolate unit PCB-SMT-44091-B and tag assembly line 3 for reflow profile calibration.","priority":"IMMEDIATE","estimatedTimeMinutes":15,"requiredToolsOrPpe":"ESD Wrist Strap, Anti-Static Bin"},{"stepNumber":2,"actionTitle":"Hot-Air Desoldering & Wick Off","detailedInstruction":"Use fine copper solder wick with mild RMA flux under microscope magnification to remove excess solder bridge.","priority":"IMMEDIATE","estimatedTimeMinutes":20,"requiredToolsOrPpe":"Microscope, Desoldering Iron, Flux Pen, IPC-A-610 Guide"}]'::jsonb,
    'OPEN'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Anomaly for PCB
INSERT INTO public.detected_anomalies (
    id,
    inspection_id,
    user_id,
    label,
    category,
    severity,
    confidence,
    box_ymin,
    box_xmin,
    box_ymax,
    box_xmax,
    description,
    root_cause_hypothesis,
    recommended_action
) VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Micro Solder Bridge Short (Pins 14-15)',
    'Solder Bridge',
    'CRITICAL',
    98.4,
    450,
    540,
    520,
    615,
    'Direct conductive tin-lead solder bridge short-circuiting pin 14 (VDD) to pin 15 (GPIO).',
    'Excessive solder paste deposition in stencil aperture or thermal over-dwell during reflow cycle.',
    'Perform precision desoldering wick rework and calibrate stencil paste thickness.'
)
ON CONFLICT (id) DO NOTHING;

