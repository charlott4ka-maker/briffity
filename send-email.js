// api/send-email.js
// Отправка брифа на email через Resend (3000 писем/месяц бесплатно)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { toEmail, projectName, briefUrl, aiSummary } = req.body;

  if (!toEmail || !briefUrl) {
    return res.status(400).json({ error: 'toEmail and briefUrl are required' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Briefify <briefs@yourdomain.com>', // ← замени на свой домен
        to: [toEmail],
        subject: `Design brief ready: ${projectName}`,
        html: `
          <div style="font-family: 'DM Sans', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1A1814;">
            <h1 style="font-size: 24px; margin-bottom: 8px;">📋 Your design brief is ready</h1>
            <p style="color: #6B6760; margin-bottom: 32px;">Project: <strong>${projectName}</strong></p>

            ${aiSummary ? `
            <div style="background: #EBF0FD; border-radius: 10px; padding: 16px 20px; margin-bottom: 28px;">
              <p style="font-size: 12px; font-weight: 600; color: #2D5BE3; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px;">✦ AI Summary</p>
              <p style="color: #1A1814; line-height: 1.65; margin: 0;">${aiSummary}</p>
            </div>
            ` : ''}

            <a href="${briefUrl}" style="display: inline-block; background: #2D5BE3; color: white; padding: 12px 24px; border-radius: 100px; text-decoration: none; font-weight: 500; margin-bottom: 32px;">
              View full brief →
            </a>

            <p style="font-size: 13px; color: #A8A49E;">
              Powered by <a href="https://briefify.com" style="color: #2D5BE3;">Briefify</a>
            </p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Resend error:', err);
      return res.status(502).json({ error: 'Email send failed' });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
