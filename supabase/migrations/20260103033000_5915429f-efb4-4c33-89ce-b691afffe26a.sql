-- Change selected_parcel_id from uuid to text to support synthetic live query IDs
ALTER TABLE survey_uploads 
  ALTER COLUMN selected_parcel_id TYPE text;

-- Add comment for clarity
COMMENT ON COLUMN survey_uploads.selected_parcel_id IS 
  'Parcel ID - can be UUID from canonical_parcels or synthetic ID from live query (e.g., live_HARRIS_...)';