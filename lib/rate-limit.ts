// In-memory sliding window rate limiter

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number
): { success: boolean; remaining: number; resetInSeconds: number } {
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const existing = rateLimitMap.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetInSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: limit - existing.count,
    resetInSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}
