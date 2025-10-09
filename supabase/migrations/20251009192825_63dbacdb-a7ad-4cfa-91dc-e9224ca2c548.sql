-- Add missing HCAD fields to applications table
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS acct_num TEXT,
ADD COLUMN IF NOT EXISTS legal_dscr_1 TEXT,
ADD COLUMN IF NOT EXISTS legal_dscr_2 TEXT,
ADD COLUMN IF NOT EXISTS legal_dscr_3 TEXT,
ADD COLUMN IF NOT EXISTS legal_dscr_4 TEXT,
ADD COLUMN IF NOT EXISTS bldg_style_cd TEXT,
ADD COLUMN IF NOT EXISTS ag_use BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS homestead BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fema_firm_panel TEXT,
ADD COLUMN IF NOT EXISTS base_flood_elevation_source TEXT;

-- Add helpful comment
COMMENT ON COLUMN public.applications.acct_num IS 'HCAD account number for property tax lookup';
COMMENT ON COLUMN public.applications.legal_dscr_1 IS 'Legal description part 1 from HCAD';
COMMENT ON COLUMN public.applications.legal_dscr_2 IS 'Legal description part 2 from HCAD';
COMMENT ON COLUMN public.applications.legal_dscr_3 IS 'Legal description part 3 from HCAD';
COMMENT ON COLUMN public.applications.legal_dscr_4 IS 'Legal description part 4 from HCAD';
COMMENT ON COLUMN public.applications.bldg_style_cd IS 'Building style code from HCAD (e.g., residential, commercial)';
COMMENT ON COLUMN public.applications.ag_use IS 'Agricultural use exemption flag from HCAD';
COMMENT ON COLUMN public.applications.homestead IS 'Homestead exemption flag from HCAD';
COMMENT ON COLUMN public.applications.fema_firm_panel IS 'FEMA FIRM Panel ID from NFHL';
COMMENT ON COLUMN public.applications.base_flood_elevation_source IS 'Source of BFE data (e.g., FEMA NFHL)';