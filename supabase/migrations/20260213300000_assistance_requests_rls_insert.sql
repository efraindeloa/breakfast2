-- Permitir que cualquier cliente (anon, authenticated, etc.) pueda insertar
-- solicitudes de asistencia. Los comensales pueden ser invitados o auth.
DROP POLICY IF EXISTS "Allow insert assistance_requests for authenticated" ON assistance_requests;
DROP POLICY IF EXISTS "Allow insert assistance_requests for anon" ON assistance_requests;

CREATE POLICY "Allow insert assistance_requests for authenticated"
  ON assistance_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow insert assistance_requests for anon"
  ON assistance_requests FOR INSERT
  TO anon
  WITH CHECK (true);

-- Por si la app usa otra identidad (ej. guest/simple auth): permitir insert a public
CREATE POLICY "Allow insert assistance_requests for public"
  ON assistance_requests FOR INSERT
  TO public
  WITH CHECK (true);
