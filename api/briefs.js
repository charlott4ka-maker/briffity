// api/briefs.js
// Сохранение и загрузка брифов из Supabase

const { createClient } = require('@supabase/supabase-js');
// Убрать: const { nanoid } = require('nanoid');
const { randomBytes } = require('crypto');
const nanoid = (size = 8) => randomBytes(size).toString('base64url').slice(0, size);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function handler(req, res) {

  // POST /api/briefs — сохранить бриф
  if (req.method === 'POST') {
    const { data: briefData, ownerEmail } = req.body;

    if (!briefData) {
      return res.status(400).json({ error: 'data is required' });
    }

    const slug = nanoid(8);

    const { data, error } = await supabase
      .from('briefs')
      .insert({
        slug,
        data: briefData,
        owner_email: ownerEmail || null,
      })
      .select('slug')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save brief' });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`;

    return res.status(200).json({
      slug: data.slug,
      url: `${appUrl}/brief/${data.slug}`
    });
  }

  // GET /api/briefs?slug=aB3kR9mQ — загрузить бриф
  if (req.method === 'GET') {
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({ error: 'slug is required' });
    }

    const { data, error } = await supabase
      .from('briefs')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Brief not found' });
    }

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
