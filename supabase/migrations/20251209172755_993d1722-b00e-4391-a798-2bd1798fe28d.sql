-- =====================================================
-- SiteIntel Data Source Registry - Schema Enhancement
-- =====================================================

-- 1. Enhance map_servers table with additional fields
ALTER TABLE map_servers 
ADD COLUMN IF NOT EXISTS dataset_family text,
ADD COLUMN IF NOT EXISTS agency text,
ADD COLUMN IF NOT EXISTS update_frequency text,
ADD COLUMN IF NOT EXISTS accuracy_tier text,
ADD COLUMN IF NOT EXISTS reliability_score integer DEFAULT 80,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS ingestion_run_id uuid;

-- Add check constraint for accuracy_tier
ALTER TABLE map_servers 
ADD CONSTRAINT map_servers_accuracy_tier_check 
CHECK (accuracy_tier IS NULL OR accuracy_tier IN ('T1', 'T2', 'T3'));

-- Add check constraint for reliability_score
ALTER TABLE map_servers 
ADD CONSTRAINT map_servers_reliability_score_check 
CHECK (reliability_score IS NULL OR (reliability_score >= 0 AND reliability_score <= 100));

-- Add check constraint for update_frequency
ALTER TABLE map_servers 
ADD CONSTRAINT map_servers_update_frequency_check 
CHECK (update_frequency IS NULL OR update_frequency IN ('continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annually', 'unknown'));

-- 2. Create data_source_versions table for version tracking
CREATE TABLE IF NOT EXISTS data_source_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_server_id uuid NOT NULL REFERENCES map_servers(id) ON DELETE CASCADE,
  dataset_version text NOT NULL,
  schema_hash text,
  field_schema jsonb,
  ingested_at timestamptz DEFAULT now(),
  ingestion_run_id uuid,
  diff_from_previous jsonb,
  record_count integer,
  created_at timestamptz DEFAULT now()
);

-- 3. Create data_source_errors table for error logging
CREATE TABLE IF NOT EXISTS data_source_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_server_id uuid NOT NULL REFERENCES map_servers(id) ON DELETE CASCADE,
  error_type text NOT NULL,
  error_message text,
  status_code integer,
  layer_id integer,
  endpoint_url text,
  occurred_at timestamptz DEFAULT now()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_source_versions_map_server_id 
ON data_source_versions(map_server_id);

CREATE INDEX IF NOT EXISTS idx_data_source_versions_ingested_at 
ON data_source_versions(ingested_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_source_errors_map_server_id 
ON data_source_errors(map_server_id);

CREATE INDEX IF NOT EXISTS idx_data_source_errors_occurred_at 
ON data_source_errors(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_map_servers_dataset_family 
ON map_servers(dataset_family);

CREATE INDEX IF NOT EXISTS idx_map_servers_jurisdiction 
ON map_servers(jurisdiction);

CREATE INDEX IF NOT EXISTS idx_map_servers_is_active 
ON map_servers(is_active);

-- 5. Enable RLS on new tables
ALTER TABLE data_source_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_source_errors ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for data_source_versions
CREATE POLICY "Admins can manage data_source_versions"
ON data_source_versions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read access to data_source_versions"
ON data_source_versions FOR SELECT
USING (true);

-- 7. RLS policies for data_source_errors
CREATE POLICY "Admins can manage data_source_errors"
ON data_source_errors FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert errors"
ON data_source_errors FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view errors"
ON data_source_errors FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Seed existing map_servers with dataset_family and agency values
UPDATE map_servers SET 
  dataset_family = 'utilities',
  agency = 'Houston Water',
  accuracy_tier = 'T2',
  reliability_score = 85
WHERE server_key IN ('houston_water_lines', 'houston_sewer_lines', 'houston_storm_lines');

UPDATE map_servers SET 
  dataset_family = 'utilities',
  agency = 'PUCT',
  accuracy_tier = 'T1',
  reliability_score = 90
WHERE server_key IN ('harris_ccn_water', 'harris_ccn_sewer');

UPDATE map_servers SET 
  dataset_family = 'utilities',
  agency = 'Texas RRC',
  accuracy_tier = 'T2',
  reliability_score = 85
WHERE server_key = 'rrc_pipelines';

UPDATE map_servers SET 
  dataset_family = 'parcels',
  agency = 'Harris County Appraisal District',
  accuracy_tier = 'T1',
  reliability_score = 95
WHERE server_key = 'harris_parcels';

UPDATE map_servers SET 
  dataset_family = 'flood',
  agency = 'FEMA',
  accuracy_tier = 'T1',
  reliability_score = 90
WHERE server_key ILIKE '%fema%' OR server_key ILIKE '%flood%';

UPDATE map_servers SET 
  dataset_family = 'wetlands',
  agency = 'USFWS',
  accuracy_tier = 'T1',
  reliability_score = 88
WHERE server_key ILIKE '%wetland%' OR server_key ILIKE '%nwi%';

UPDATE map_servers SET 
  dataset_family = 'traffic',
  agency = 'TxDOT',
  accuracy_tier = 'T2',
  reliability_score = 85
WHERE server_key ILIKE '%txdot%' OR server_key ILIKE '%aadt%' OR server_key ILIKE '%traffic%';

UPDATE map_servers SET 
  dataset_family = 'zoning',
  agency = 'City Planning Department',
  accuracy_tier = 'T1',
  reliability_score = 90
WHERE server_key ILIKE '%zoning%';

-- Set defaults for any remaining without classification
UPDATE map_servers SET 
  dataset_family = COALESCE(dataset_family, 'other'),
  agency = COALESCE(agency, 'Unknown'),
  accuracy_tier = COALESCE(accuracy_tier, 'T3'),
  reliability_score = COALESCE(reliability_score, 70)
WHERE dataset_family IS NULL;