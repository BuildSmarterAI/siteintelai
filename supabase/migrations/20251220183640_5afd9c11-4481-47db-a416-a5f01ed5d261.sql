-- Clean corrupted Census sentinel values from applications table
UPDATE applications 
SET median_home_value = NULL 
WHERE median_home_value IS NOT NULL 
  AND (median_home_value < 0 OR median_home_value > 50000000);

UPDATE applications 
SET median_rent = NULL 
WHERE median_rent IS NOT NULL 
  AND (median_rent < 0 OR median_rent > 25000);

UPDATE applications 
SET median_income = NULL 
WHERE median_income IS NOT NULL 
  AND (median_income < 0 OR median_income > 10000000);

UPDATE applications 
SET mean_household_income = NULL 
WHERE mean_household_income IS NOT NULL 
  AND (mean_household_income < 0 OR mean_household_income > 10000000);

UPDATE applications 
SET per_capita_income = NULL 
WHERE per_capita_income IS NOT NULL 
  AND (per_capita_income < 0 OR per_capita_income > 10000000);

-- Fix unrealistic percentage values
UPDATE applications 
SET unemployment_rate = NULL 
WHERE unemployment_rate IS NOT NULL 
  AND (unemployment_rate < 0 OR unemployment_rate > 100);

UPDATE applications 
SET poverty_rate = NULL 
WHERE poverty_rate IS NOT NULL 
  AND (poverty_rate < 0 OR poverty_rate > 100);

-- Clean corrupted values from canonical_demographics table
UPDATE canonical_demographics 
SET median_home_value = NULL 
WHERE median_home_value IS NOT NULL 
  AND (median_home_value < 0 OR median_home_value > 50000000);

UPDATE canonical_demographics 
SET median_rent = NULL 
WHERE median_rent IS NOT NULL 
  AND (median_rent < 0 OR median_rent > 25000);

UPDATE canonical_demographics 
SET median_household_income = NULL 
WHERE median_household_income IS NOT NULL 
  AND (median_household_income < 0 OR median_household_income > 10000000);

UPDATE canonical_demographics 
SET mean_household_income = NULL 
WHERE mean_household_income IS NOT NULL 
  AND (mean_household_income < 0 OR mean_household_income > 10000000);

UPDATE canonical_demographics 
SET per_capita_income = NULL 
WHERE per_capita_income IS NOT NULL 
  AND (per_capita_income < 0 OR per_capita_income > 10000000);

UPDATE canonical_demographics 
SET unemployment_rate = NULL 
WHERE unemployment_rate IS NOT NULL 
  AND (unemployment_rate < 0 OR unemployment_rate > 100);

UPDATE canonical_demographics 
SET poverty_rate = NULL 
WHERE poverty_rate IS NOT NULL 
  AND (poverty_rate < 0 OR poverty_rate > 100);