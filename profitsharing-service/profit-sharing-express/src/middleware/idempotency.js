// Simple in-memory idempotency cache with TTL (sufficient for hackathon)
const cache = new Map();

function idempotencyMiddleware(req, res, next) {
  const key = req.header('Idempotency-Key');
  if (!key) return next();
  const now = Date.now();
  const ttl = Number(process.env.IDEMPOTENCY_TTL_MS || 10 * 60 * 1000);
  const entry = cache.get(key);
  if (entry && entry.expiresAt > now && entry.method === req.method && entry.path === req.path) {
    // Replay the stored response
    return res.status(entry.status).json(entry.body);
  }
  // Intercept res.json to store response
  const origJson = res.json.bind(res);
  res.json = (body) => {
    const result = origJson(body);
    const status = res.statusCode;
    cache.set(key, { method: req.method, path: req.path, status, body, expiresAt: now + ttl });
    return result;
  };
  next();
}

module.exports = { idempotencyMiddleware };
