// api/summarize.js
// Vercel Serverless Function — проксирует запрос к Anthropic API
// Ключ хранится в Vercel Environment Variables, а не во фронтенде

export default async function handler(req, res) {
  // Только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { briefText } = req.body;

  if (!briefText) {
    return res.status(400).json({ error: 'briefText is required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY, // ← из Vercel Environment Variables
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a senior UX designer reviewing a client brief. Write a concise professional summary (3–4 sentences) of this design brief that a designer would read first. Highlight the core goal, audience, key constraints, and one thing to watch out for. Be direct and useful — no fluff.\n\nBrief:\n${briefText}`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', data);
      return res.status(502).json({ error: 'Anthropic API error', details: data });
    }

    const summary = data.content?.[0]?.text || '';
    return res.status(200).json({ summary });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
