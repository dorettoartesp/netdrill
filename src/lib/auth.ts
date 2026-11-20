import crypto from 'crypto';

/**
 * Default fallback secret used when SESSION_SECRET is not configured.
 */
const DEFAULT_SECRET = 'netdrill-default-secure-secret-key-2026';

/**
 * Verifies whether a user-submitted password matches the configured access password.
 * Comparison is case-insensitive and trims external whitespace.
 *
 * @param input - The raw password entered by the user.
 * @param expected - Optional expected password string (defaults to APP_PASSWORD env var or 'havaianas').
 * @returns True if the password matches, false otherwise.
 *
 * @example
 * ```ts
 * const isValid = verifyPassword('havaianas');
 * expect(isValid).toBe(true);
 * ```
 */
export function verifyPassword(input: string, expected?: string): boolean {
  const target = (expected || process.env.APP_PASSWORD || 'havaianas').trim().toLowerCase();
  const candidate = (input || '').trim().toLowerCase();

  if (!candidate || candidate.length !== target.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(target));
}

/**
 * Generates an HMAC-signed session token containing expiration timestamp.
 *
 * @param secret - Optional secret key used for signing (defaults to SESSION_SECRET env var).
 * @param validityDays - Number of days the token remains valid (defaults to 30).
 * @returns Base64 encoded signed session token string.
 */
export function generateSessionToken(secret?: string, validityDays = 30): string {
  const key = secret || process.env.SESSION_SECRET || DEFAULT_SECRET;
  const expiresAt = Date.now() + validityDays * 24 * 60 * 60 * 1000;
  const payload = `netdrill:${expiresAt}`;
  const signature = crypto.createHmac('sha256', key).update(payload).digest('hex');

  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

/**
 * Validates whether a provided session token is well-formed, authentic, and not expired.
 *
 * @param token - Base64 encoded signed session token to validate.
 * @param secret - Optional secret key used to verify the HMAC signature.
 * @returns True if the token signature is valid and timestamp has not expired.
 */
export function isValidSessionToken(token: string, secret?: string): boolean {
  if (!token) return false;

  try {
    const key = secret || process.env.SESSION_SECRET || DEFAULT_SECRET;
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length !== 3) return false;

    const [prefix, expiresStr, signature] = parts;
    if (prefix !== 'netdrill') return false;

    const expiresAt = parseInt(expiresStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return false; // Expired
    }

    const payload = `${prefix}:${expiresStr}`;
    const expectedSignature = crypto.createHmac('sha256', key).update(payload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}
