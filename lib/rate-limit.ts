/**
 * Rate Limiting general por IP - Módulo de seguridad (solo servidor)
 *
 * Implementa una ventana temporal por recurso e IP para limitar la
 * cantidad de peticiones que un mismo cliente puede hacer en un período.
 *
 * Es el segundo mecanismo de seguridad de la app:
 *  - Bloquea fuerza bruta y scraping automatizado.
 *  - Complementa al slider puzzle (lib/captcha.ts).
 *  - Devuelve 429 + "Retry-After" cuando se supera el umbral.
 *
 * NOTA: el estado vive en memoria (por proceso). Para un despliegue
 * serverless multi-instancia real se necesitaría Redis o similar.
 *
 * NUNCA importar este archivo desde componentes cliente.
 */
import { logSecurityEvent } from "./logger";

export interface RateLimitOptions {
  limit: number; // peticiones permitidas dentro de la ventana
  windowMs: number; // duración de la ventana en ms
}

// Ventanas por endpoint (valores bajos a propósito para la demo).
// En producción se ajustan por variable de entorno.
export const RATE_LIMITS: Record<string, RateLimitOptions> = {
  "/api/captcha": { limit: 15, windowMs: 60_000 },
  "/api/captcha/status": { limit: 20, windowMs: 60_000 },
  "/api/captcha/verify": { limit: 5, windowMs: 60_000 },
  "/api/sessionLogin": { limit: 5, windowMs: 60_000 },
};

interface WindowState {
  count: number;
  windowStart: number;
}

// Estado por clave: `${ip}|${recurso}`
const windows = new Map<string, WindowState>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number; // segundos que debe esperar el cliente
  count: number; // peticiones registradas dentro de la ventana actual
}

function getOrCreateWindow(key: string, windowMs: number, now: number): WindowState {
  let state = windows.get(key);
  if (!state || now - state.windowStart >= windowMs) {
    state = { count: 0, windowStart: now };
  }
  return state;
}

// ─── Evaluación de límite ────────────────────────────────────────────────
export function rateLimit(
  ip: string,
  resource: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const key = `${ip}|${resource}`;

  const state = getOrCreateWindow(key, options.windowMs, now);
  state.count += 1;
  windows.set(key, state);

  // Segundos que restan para que la ventana actual se reinicie
  const remainingMs = Math.max(0, state.windowStart + options.windowMs - now);
  const allowed = state.count <= options.limit;

  if (!allowed) {
    logSecurityEvent(
      "rate_limit_exceeded",
      ip,
      `Límite de peticiones excedido en ${resource} (intento ${state.count}/${options.limit})`,
      { resource, count: state.count, limit: options.limit },
      429
    );
  }

  return {
    allowed,
    retryAfter: remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0,
    count: state.count,
  };
}

export function resetRateLimits(): void {
  windows.clear();
}