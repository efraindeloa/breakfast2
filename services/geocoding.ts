/**
 * Geocodificación usando Nominatim (OpenStreetMap).
 * Política de uso: máx. 1 petición por segundo, User-Agent obligatorio.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'BreakfastApp/1.0 (contacto@ejemplo.com)';

export interface GeocodeResult {
  lat: number;
  lng: number;
}

/**
 * Obtiene latitud y longitud a partir de una dirección (domicilio, ciudad, país, etc.).
 * Devuelve null si no se encuentra o hay error.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const trimmed = address?.trim();
  if (!trimmed) return null;

  try {
    const params = new URLSearchParams({
      q: trimmed,
      format: 'json',
      limit: '1',
    });
    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0];
    const lat = parseFloat(first.lat);
    const lon = parseFloat(first.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { lat, lng: lon };
  } catch {
    return null;
  }
}

/**
 * Construye una cadena de dirección a partir de los campos del restaurante.
 */
export function buildAddressString(parts: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
}): string {
  const { address, city, state, country, postal_code } = parts;
  const arr = [address, city, state, postal_code, country].filter(Boolean) as string[];
  return arr.join(', ');
}
