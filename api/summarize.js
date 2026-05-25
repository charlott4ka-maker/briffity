// api/summarize.js
// Vercel Serverless Function — проксирует запрос к OpenRouter API
// Ключ хранится в Vercel Environment Variables: OPENROUTER_API_KEY

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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Briffity',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',,  // бесплатная модель, можно заменить на любую из openrouter.ai/models
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a senior UX designer reviewing a client brief. Write a concise professional summary (3–4 sentences) of this design brief that a designer would read first. Highlight the core goal, audience, key constraints, and one thing to watch out for. Be direct and useful — no fluff.\n\nBrief:\n${briefText}`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter error:', data);
      return res.status(502).json({ error: 'OpenRouter API error', details: data });
    }

    const summary = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ summary });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
