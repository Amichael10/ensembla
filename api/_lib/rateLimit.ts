// In-memory store — resets on cold starts, first layer of defense only.
const requests = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export function checkRateLimit(req: any): boolean {
  try {
    const headers = req.headers;
    if (!headers) return false;

    let forwarded = typeof headers.get === 'function' 
      ? headers.get('x-forwarded-for') 
      : headers['x-forwarded-for'];

    if (Array.isArray(forwarded)) forwarded = forwarded[0];
    const ip = (forwarded ?? '').split(',')[0].trim() || 'unknown';

    const now = Date.now();
    const entry = requests.get(ip);

    if (!entry || now >= entry.resetAt) {
      requests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return false;
    }

    entry.count += 1;
    return entry.count > MAX_REQUESTS;
  } catch (err) {
    console.error('Rate limit check error:', err);
    return false; // Fail open - better to allow some requests than to crash the site
  }
}
