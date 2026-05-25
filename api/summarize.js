// api/summarize.js
const { randomBytes } = require('crypto');

// Rate limit: 5 AI requests per IP per minute (costs money)
const rateLimitMap = new Map();
function checkRateLimit(ip, max = 5, windowMs = 60_000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count <= max;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  const { briefText } = req.body;

  if (!briefText || typeof briefText !== 'string') {
    return res.status(400).json({ error: 'briefText is required' });
  }

  // Cap input to prevent huge/expensive requests
  const trimmed = briefText.slice(0, 3000);

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'AI summarization is not configured' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a senior UX designer reviewing a client brief. Write a concise professional summary (3–4 sentences) of this design brief that a designer would read first. Highlight the core goal, audience, key constraints, and one thing to watch out for. Be direct and useful — no fluff.\n\nBrief:\n${trimmed}`
            }]
          }],
          generationConfig: { maxOutputTokens: 300 }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini error:', data);
      return res.status(502).json({ error: 'AI service error' });
    }

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ summary });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
