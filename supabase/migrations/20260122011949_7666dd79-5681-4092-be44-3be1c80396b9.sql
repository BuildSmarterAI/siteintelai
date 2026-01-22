-- Fix Security Definer Views (Part 1)
-- Addresses 4 ERROR level linter issues

-- ============================================================
-- Recreate v_reports_sanitized with SECURITY INVOKER
-- ============================================================

DROP VIEW IF EXISTS public.v_reports_sanitized;

CREATE VIEW public.v_reports_sanitized
WITH (security_invoker = true)
AS
SELECT 
    id,
    application_id,
    user_id,
    report_type,
    feasibility_score,
    score_band,
    status,
    validation_status,
    error_message,
    pdf_url,
    ai_prompt_tokens,
    ai_completion_tokens,
    created_at,
    updated_at,
    sanitize_report_json(json_data, auth.uid()) AS json_data
FROM reports;

GRANT SELECT ON public.v_reports_sanitized TO authenticated;

-- ============================================================
-- Set search_path on update_updated_at_column trigger function
-- (This was the only critical function missing search_path)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Updates updated_at timestamp on row modification. search_path set to public for security.';