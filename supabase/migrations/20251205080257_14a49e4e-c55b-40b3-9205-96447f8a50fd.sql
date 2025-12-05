-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Cron Job History table for monitoring job executions
CREATE TABLE IF NOT EXISTS public.cron_job_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'success', 'error')),
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  execution_time_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cron_job_history ENABLE ROW LEVEL SECURITY;

-- Admin-only access for cron history
CREATE POLICY "Admins can view cron job history"
ON public.cron_job_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Service role can insert/update
CREATE POLICY "Service role can manage cron history"
ON public.cron_job_history
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Indexes for cron_job_history
CREATE INDEX IF NOT EXISTS idx_cron_history_job_name ON public.cron_job_history(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_history_started ON public.cron_job_history(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_history_status ON public.cron_job_history(status);

-- System Metrics table for tracking operational metrics
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metric_unit TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  dimensions JSONB
);

-- Enable RLS
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Admin-only access for metrics
CREATE POLICY "Admins can view system metrics"
ON public.system_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Service role can insert metrics
CREATE POLICY "Service role can manage metrics"
ON public.system_metrics
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Indexes for system_metrics
CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON public.system_metrics(metric_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_recorded ON public.system_metrics(recorded_at DESC);

-- System Alerts table for operational alerts
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  source TEXT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- Admin-only access for alerts
CREATE POLICY "Admins can view system alerts"
ON public.system_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admin can acknowledge alerts
CREATE POLICY "Admins can update alerts"
ON public.system_alerts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Service role can manage alerts
CREATE POLICY "Service role can manage alerts"
ON public.system_alerts
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Indexes for system_alerts
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON public.system_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON public.system_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.system_alerts(alert_type);