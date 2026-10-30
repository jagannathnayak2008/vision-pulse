-- ==============================================================================
-- OPTIGUARD AI — SUPABASE PRODUCTION DATABASE SCHEMA & RLS DEFINITIONS
-- Run this complete script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
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

-- ------------------------------------------------------------------------------
-- 2. INSPECTION REPORTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inspection_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- ------------------------------------------------------------------------------
-- 3. DETECTED ANOMALIES TABLE (Child of inspection_reports)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.detected_anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- ------------------------------------------------------------------------------
-- 4. VISUAL COMPARISONS TABLE (Before / After Delta Analysis)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.visual_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- ------------------------------------------------------------------------------
-- 5. INSPECTION CHAT MESSAGES TABLE (Visual Copilot History)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inspection_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('USER', 'AI')),
    message_text TEXT NOT NULL,
    suggested_followups JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. PERFORMANCE & QUERY INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_inspections_user_created ON public.inspection_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_domain ON public.inspection_reports(user_id, domain);
CREATE INDEX IF NOT EXISTS idx_inspections_verdict ON public.inspection_reports(user_id, verdict);
CREATE INDEX IF NOT EXISTS idx_anomalies_inspection ON public.detected_anomalies(inspection_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_user ON public.detected_anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_user ON public.visual_comparisons(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_inspection ON public.inspection_chat_messages(inspection_id, created_at ASC);

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE BUCKET FOR HIGH-RES INSPECTION IMAGES
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'optiguard-inspections',
    'optiguard-inspections',
    true,
    10485760, -- 10 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Public Storage Read Policy
CREATE POLICY "Public Read Access for Inspection Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'optiguard-inspections');

-- Authenticated / Service Role Upload Policy
CREATE POLICY "Service Role & Authenticated Upload to Inspections"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'optiguard-inspections');

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow full access for backend service_role (Node.js API using SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service Role Full Access Users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Reports" ON public.inspection_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Anomalies" ON public.detected_anomalies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Comparisons" ON public.visual_comparisons FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Chat" ON public.inspection_chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow public / anon read and insert where appropriate
CREATE POLICY "Allow All Users Operations for Demo" ON public.users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Reports Operations for Demo" ON public.inspection_reports FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Anomalies Operations for Demo" ON public.detected_anomalies FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Comparisons Operations for Demo" ON public.visual_comparisons FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Chat Operations for Demo" ON public.inspection_chat_messages FOR ALL TO anon USING (true) WITH CHECK (true);

