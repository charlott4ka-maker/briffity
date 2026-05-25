// api/auth-config.js
// Возвращает публичные Supabase ключи из Environment Variables
// Anon key безопасен для фронтенда — секретность обеспечивается через RLS

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return res.status(500).json({ error: 'Supabase env vars not configured' });
  }

  // Cache на 1 час — ключи не меняются
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).json({ url, anonKey });
};
