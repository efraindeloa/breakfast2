/**
 * Utilidades para hashear y verificar contraseñas usando Web Crypto API
 */

/**
 * Hashea una contraseña usando SHA-256 (simple, no es lo más seguro pero funciona)
 * Para producción, deberías usar bcrypt o argon2 en el servidor
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verifica si una contraseña coincide con un hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
