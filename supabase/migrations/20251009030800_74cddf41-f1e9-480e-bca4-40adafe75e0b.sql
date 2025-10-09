-- Add HCAD valuation and building characteristics fields to applications table

-- Valuation Fields
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS tot_appr_val NUMERIC;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS tot_market_val NUMERIC;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS land_val NUMERIC;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS imprv_val NUMERIC;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS taxable_value NUMERIC;

-- Building Characteristics
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS bldg_sqft NUMERIC;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS effective_yr INTEGER;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS num_stories INTEGER;

-- Property Classification
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS state_class TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS prop_type TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS land_use_code TEXT;

-- Tax Information
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS exemption_code TEXT;

-- Location Details
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS subdivision TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS block TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS lot TEXT;

COMMENT ON COLUMN public.applications.tot_appr_val IS 'Total appraised value from HCAD official assessment';
COMMENT ON COLUMN public.applications.tot_market_val IS 'Total market value from HCAD';
COMMENT ON COLUMN public.applications.land_val IS 'Land value only (excluding improvements)';
COMMENT ON COLUMN public.applications.imprv_val IS 'Improvement/building value only';
COMMENT ON COLUMN public.applications.taxable_value IS 'Actual taxable value after exemptions';
COMMENT ON COLUMN public.applications.bldg_sqft IS 'Total building square footage';
COMMENT ON COLUMN public.applications.year_built IS 'Original construction year';
COMMENT ON COLUMN public.applications.effective_yr IS 'Effective age after renovations';
COMMENT ON COLUMN public.applications.num_stories IS 'Number of building stories';
COMMENT ON COLUMN public.applications.state_class IS 'Texas Property Tax Code classification';
COMMENT ON COLUMN public.applications.prop_type IS 'Property type descriptor from HCAD';
COMMENT ON COLUMN public.applications.land_use_code IS 'Detailed land use code';
COMMENT ON COLUMN public.applications.exemption_code IS 'Tax exemption codes if applicable';
COMMENT ON COLUMN public.applications.subdivision IS 'Subdivision name';
COMMENT ON COLUMN public.applications.block IS 'Block identifier within subdivision';
COMMENT ON COLUMN public.applications.lot IS 'Lot identifier within block';