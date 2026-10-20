/**
 * Slider Puzzle CAPTCHA - Módulo de seguridad (solo servidor)
 *
 * Implementa un desafío visual tipo "slider puzzle":
 * el usuario debe deslizar una pieza hasta encajar en el hueco.
 *
 * Mecanismos de seguridad:
 * - Reto firmado con HMAC-SHA256 (no se puede fabricar desde el cliente).
 * - Expiración temporal del reto.
 * - Nonce de un solo uso (evita reutilizar el mismo reto).
 * - Bloqueo temporal por IP tras varios intentos fallidos.
 *
 * NUNCA importar este archivo desde componentes cliente.
 */
import crypto from "node:crypto";

// ─── Dimensiones y tolerancias del puzzle ───────────────────────────────────
export const PUZZLE = {
  WIDTH: 320,
  HEIGHT: 160,
  PIECE: 48,
  PADDING: 16,
  TOLERANCE: 10,
} as const;

const EXP_MS = 5 * 60 * 1000; // El reto dura 5 minutos
const MAX_FAILURES = 3; // Intentos fallidos antes de bloquear
const BLOCK_MS = 60 * 1000; // Duración del bloqueo (60 s)
const FAIL_WINDOW_MS = 5 * 60 * 1000; // Ventana para acumular fallos

export interface SliderChallenge {
  token: string;
  gapX: number;
  gapY: number;
  width: number;
  height: number;
  pieceSize: number;
  pieceStartX: number;
  expiresAt: number;
}

export interface VerifyResult {
  ok: boolean;
  reason?:
    | "missing"
    | "malformed"
    | "signature"
    | "expired"
    | "reused"
    | "mismatch"
    | "error";
}

interface ChallengePayload {
  gx: number;
  gy: number;
  n: string;
  exp: number;
}

// ─── utilidades base64url y firma ───────────────────────────────────────────
function getSecret(): string {
  const secret = process.env.CAPTCHA_SECRET;
  if (!secret) {
    throw new Error("Falta la variable de entorno CAPTCHA_SECRET");
  }
  return secret;
}

function toBase64Url(input: Buffer | string): string {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padding = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + padding;
  return Buffer.from(normalized, "base64").toString("utf8");
}

function sign(body: string): string {
  return toBase64Url(
    crypto.createHmac("sha256", getSecret()).update(body).digest()
  );
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Generación del reto ────────────────────────────────────────────────────
export function createSliderChallenge(): SliderChallenge {
  const { WIDTH, HEIGHT, PIECE, PADDING } = PUZZLE;

  // Posición (esquina superior izquierda) del hueco donde debe encajar la pieza
  const gapX = randomInt(PADDING, WIDTH - PIECE - PADDING);
  const gapY = randomInt(PADDING, HEIGHT - PIECE - PADDING);

  const expiresAt = Date.now() + EXP_MS;
  const payload: ChallengePayload = {
    gx: gapX,
    gy: gapY,
    n: crypto.randomBytes(16).toString("hex"),
    exp: expiresAt,
  };

  const body = toBase64Url(JSON.stringify(payload));
  const token = `${body}.${sign(body)}`;

  return {
    token,
    gapX,
    gapY,
    width: WIDTH,
    height: HEIGHT,
    pieceSize: PIECE,
    pieceStartX: PADDING,
    expiresAt,
  };
}

// ─── Nonces usados (evita reutilización dentro de la misma instancia) ────────
const usedNonces = new Map<string, number>();

function cleanupNonces(): void {
  const now = Date.now();
  for (const [nonce, exp] of usedNonces) {
    if (exp < now) usedNonces.delete(nonce);
  }
}

// ─── Verificación del reto ──────────────────────────────────────────────────
export function verifySlider(
  token: string,
  offsetX: number,
  offsetY: number
): VerifyResult {
  try {
    if (!token || typeof token !== "string") return { ok: false, reason: "missing" };
    if (typeof offsetX !== "number" || typeof offsetY !== "number") {
      return { ok: false, reason: "malformed" };
    }

    const [body, signature] = token.split(".");
    if (!body || !signature) return { ok: false, reason: "malformed" };

    const expected = sign(body);
    const provided = Buffer.from(signature);
    const computed = Buffer.from(expected);
    if (
      provided.length !== computed.length ||
      !crypto.timingSafeEqual(provided, computed)
    ) {
      return { ok: false, reason: "signature" };
    }

    const payload = JSON.parse(fromBase64Url(body)) as ChallengePayload;

    if (Date.now() > payload.exp) return { ok: false, reason: "expired" };

    cleanupNonces();
    if (usedNonces.has(payload.n)) return { ok: false, reason: "reused" };

    const okX = Math.abs(offsetX - payload.gx) <= PUZZLE.TOLERANCE;
    const okY = Math.abs(offsetY - payload.gy) <= PUZZLE.TOLERANCE;
    if (!okX || !okY) return { ok: false, reason: "mismatch" };

    // Reto consumido: ya no puede reutilizarse
    usedNonces.set(payload.n, payload.exp);
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}

// ─── Cookie de acceso firmada (Método 5: integridad HMAC) ──────────────────
interface CaptchaPassPayload {
  exp: number;
}

/**
 * Crea el valor firmado para la cookie captcha_pass.
 * Formato: base64url(payload).hmac-sha256 — el mismo patrón que el token
 * del reto. Sin la firma correcta el valor es inútil.
 */
export function createCaptchaPassCookie(maxAgeSeconds: number): string {
  const payload: CaptchaPassPayload = {
    exp: Date.now() + maxAgeSeconds * 1000,
  };
  const body = toBase64Url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

/**
 * Verifica la integridad y expiración de la cookie captcha_pass.
 * Comparación en tiempo constante (timingSafeEqual) para evitar
 * ataques de timing sobre la firma. Devuelve false ante cualquier
 * valor fabricado, manipulado o vencido.
 */
export function verifyCaptchaPassCookie(value: string | undefined): boolean {
  try {
    if (!value || typeof value !== "string") return false;

    const [body, signature] = value.split(".");
    if (!body || !signature) return false;

    const expected = sign(body);
    const provided = Buffer.from(signature);
    const computed = Buffer.from(expected);
    if (
      provided.length !== computed.length ||
      !crypto.timingSafeEqual(provided, computed)
    ) {
      return false;
    }

    const payload = JSON.parse(fromBase64Url(body)) as CaptchaPassPayload;
    if (typeof payload.exp !== "number") return false;

    return Date.now() <= payload.exp;
  } catch {
    return false;
  }
}

// ─── Identificación del cliente ─────────────────────────────────────────────
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// ─── Control de intentos fallidos por IP ────────────────────────────────────
interface FailureState {
  count: number;
  firstAt: number;
  blockedUntil: number;
}

const failures = new Map<string, FailureState>();

export function isBlocked(ip: string): { blocked: boolean; retryAfter: number } {
  const state = failures.get(ip);
  if (!state) return { blocked: false, retryAfter: 0 };
  const remaining = state.blockedUntil - Date.now();
  if (remaining > 0) {
    return { blocked: true, retryAfter: Math.ceil(remaining / 1000) };
  }
  return { blocked: false, retryAfter: 0 };
}

export function registerFailure(ip: string): {
  blocked: boolean;
  retryAfter: number;
  count: number;
} {
  const now = Date.now();
  let state = failures.get(ip);

  if (!state || now - state.firstAt > FAIL_WINDOW_MS) {
    state = { count: 0, firstAt: now, blockedUntil: 0 };
  }

  state.count += 1;

  if (state.count >= MAX_FAILURES) {
    state.blockedUntil = now + BLOCK_MS;
    state.count = 0;
    state.firstAt = now;
  }

  failures.set(ip, state);

  const remaining = state.blockedUntil - now;
  return {
    blocked: remaining > 0,
    retryAfter: remaining > 0 ? Math.ceil(remaining / 1000) : 0,
    count: state.count,
  };
}

export function resetFailures(ip: string): void {
  failures.delete(ip);
}
