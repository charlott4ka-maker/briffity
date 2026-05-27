// api/briefs.js
// Сохранение и загрузка брифов из Supabase

const { createClient } = require('@supabase/supabase-js');
// Убрать: const { nanoid } = require('nanoid');
const { randomBytes } = require('crypto');
const nanoid = (size = 8) => randomBytes(size).toString('base64url').slice(0, size);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // <-- Добавили _ROLE_
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
 // GET /api/briefs — загрузить бриф (или список брифов для дашборда)
  if (req.method === 'GET') {
    const { slug, user_id } = req.query;

    // Сценарий 1: Загрузка списка брифов для дашборда
    if (user_id) {
      const { data, error } = await supabase
        .from('briefs')
        .select('id, slug, data, created_at') // Запрашиваем только те колонки, которые точно есть в базе
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch dashboard error:', error);
        return res.status(500).json({ error: 'Failed to fetch briefs' });
      }

      return res.status(200).json({ data });
    }

    // Сценарий 2: Загрузка одиночного брифа по slug
    if (slug) {
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

    return res.status(400).json({ error: 'Either slug or user_id is required' });
  }
