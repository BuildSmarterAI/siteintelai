-- Create applications table to store form submissions
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Step 1: Contact Information
  full_name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Step 2: Property Information
  property_address JSONB, -- {street, city, state, zip}
  parcel_id_apn TEXT,
  lot_size_value NUMERIC,
  lot_size_unit TEXT,
  existing_improvements TEXT NOT NULL,
  zoning_classification TEXT,
  ownership_status TEXT NOT NULL,
  
  -- Step 3: Project Intent & Building Parameters
  project_type TEXT[] NOT NULL,
  building_size_value NUMERIC,
  building_size_unit TEXT,
  stories_height TEXT NOT NULL,
  prototype_requirements TEXT,
  quality_level TEXT NOT NULL,
  desired_budget NUMERIC NOT NULL,
  
  -- Step 4: Market & Risks
  submarket TEXT NOT NULL,
  access_priorities TEXT[],
  known_risks TEXT[],
  utility_access TEXT[],
  environmental_constraints TEXT[],
  tenant_requirements TEXT,
  
  -- Step 5: Final Questions
  heard_about TEXT NOT NULL,
  preferred_contact TEXT,
  best_time TEXT,
  additional_notes TEXT,
  attachments JSONB, -- File metadata
  
  -- Consent & Legal
  nda_confidentiality BOOLEAN NOT NULL DEFAULT true,
  consent_contact BOOLEAN NOT NULL DEFAULT true,
  consent_terms_privacy BOOLEAN NOT NULL DEFAULT true,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  
  -- Tracking Fields
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  page_url TEXT,
  submission_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Report Generation
  report_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (since this is a lead form)
CREATE POLICY "Allow public insert on applications" 
ON public.applications 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Create policy for authenticated users to view all applications
CREATE POLICY "Allow authenticated users to view applications" 
ON public.applications 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy for authenticated users to update applications (for report URLs)
CREATE POLICY "Allow authenticated users to update applications" 
ON public.applications 
FOR UPDATE 
TO authenticated 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for email lookups
CREATE INDEX idx_applications_email ON public.applications(email);

-- Create index for created_at for chronological queries
CREATE INDEX idx_applications_created_at ON public.applications(created_at DESC);