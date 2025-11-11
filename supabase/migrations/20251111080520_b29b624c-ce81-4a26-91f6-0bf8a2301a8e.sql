-- Reset stuck application 133e67fa-f33d-4114-843a-f84ecb967833 to queued status
UPDATE applications
SET 
  status = 'queued',
  status_rev = 0,
  attempts = 0,
  next_run_at = now(),
  error_code = NULL,
  status_percent = 0,
  enrichment_status = 'pending'
WHERE id = '133e67fa-f33d-4114-843a-f84ecb967833';

-- Verify the reset
SELECT 
  id, 
  status, 
  error_code, 
  attempts,
  formatted_address,
  city,
  county
FROM applications 
WHERE id = '133e67fa-f33d-4114-843a-f84ecb967833';