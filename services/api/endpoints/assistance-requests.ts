/**
 * Endpoints de la API de solicitudes de asistencia.
 * Contrato REST que puede consumirse por HTTP (Edge Functions) o por el cliente Supabase (actual).
 */

export const ASSISTANCE_REQUESTS_BASE = '/assistance-requests';

export const assistanceRequestsEndpoints = {
  /** POST - Crear solicitud (comensal) */
  create: ASSISTANCE_REQUESTS_BASE,
  /** GET - Listar por restaurante (mesero): ?restaurant_id=...&status=...&limit=... */
  list: ASSISTANCE_REQUESTS_BASE,
  /** PATCH - Actualizar estado (mesero): body { id, status } */
  update: ASSISTANCE_REQUESTS_BASE,
  /** Realtime: canal por restaurante (no HTTP) */
  channel: (restaurantId: string) => `assistance_requests:${restaurantId}`,
} as const;

export type AssistanceRequestsEndpointKey = keyof typeof assistanceRequestsEndpoints;
