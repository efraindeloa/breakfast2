-- Ajustar CHECK de status para que acepte los valores que usa la app
ALTER TABLE assistance_requests
  DROP CONSTRAINT IF EXISTS assistance_requests_status_check;

ALTER TABLE assistance_requests
  ADD CONSTRAINT assistance_requests_status_check
  CHECK (status IN ('pending', 'attended', 'cancelled'));
