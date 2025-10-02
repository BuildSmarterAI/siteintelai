-- Make desired_budget column nullable
ALTER TABLE applications 
ALTER COLUMN desired_budget DROP NOT NULL;