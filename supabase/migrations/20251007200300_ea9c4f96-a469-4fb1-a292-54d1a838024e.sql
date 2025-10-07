-- Create jobs_enrichment audit log table
create table if not exists public.jobs_enrichment (
  id bigserial primary key,
  started_at timestamptz default now(),
  finished_at timestamptz,
  application_id uuid not null references public.applications(id) on delete cascade,
  job_status text check (job_status in ('success','error')),
  provider_calls jsonb,
  error_message text
);

create index if not exists jobs_enrichment_app_idx on public.jobs_enrichment(application_id);
create index if not exists jobs_enrichment_started_idx on public.jobs_enrichment(started_at desc);

-- Enable RLS
alter table public.jobs_enrichment enable row level security;

-- Admins can view all job logs
create policy "Admins can view all job logs"
on public.jobs_enrichment
for select
using (has_role(auth.uid(), 'admin'::app_role));