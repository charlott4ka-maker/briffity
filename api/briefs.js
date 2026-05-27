// api/briefs.js
// Полный CRUD для брифов (Сохранение, Чтение, Обновление, Удаление)

const { createClient } = require('@supabase/supabase-js');
const { randomBytes } = require('crypto');

const nanoid = (size = 8) => randomBytes(size).toString('base64url').slice(0, size);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ============================================================
  // POST: СОХРАНИТЬ НОВЫЙ БРИФ
  // ============================================================
  if (req.method === 'POST') {
    const { data: briefData, ownerEmail, user_id } = req.body;

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
        user_id: user_id || null
      })
      .select('slug')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save brief' });
    }

    // ИСКУССТВЕННЫЙ ИСПРАВЛЕННЫЙ БЛОК: Безопасное формирование URL без url.parse()
    let appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      const host = req.headers.host || 'localhost';
      const protocol = host.startsWith('localhost') ? 'http:' : 'https:';
      appUrl = `${protocol}//${host}`;
    }
    
    // Гарантируем валидность через современный конструктор URL
    const finalUrl = new URL(`/brief/${data.slug}`, appUrl).toString();

    return res.status(200).json({
      slug: data.slug,
      url: finalUrl
    });
  }

  // ============================================================
  // GET: ПОЛУЧИТЬ БРИФ(Ы)
  // ============================================================
  if (req.method === 'GET') {
    const { slug, user_id } = req.query;

    if (user_id) {
      const { data, error } = await supabase
        .from('briefs')
        .select('id, slug, data, created_at')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch dashboard error:', error);
        return res.status(500).json({ error: 'Failed to fetch briefs' });
      }

      return res.status(200).json({ data });
    }

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

  // ============================================================
  // PATCH: ОБНОВИТЬ СУЩЕСТВУЮЩИЙ БРИФ (AI САММАРИ ИЛИ СТАТУС)
  // ============================================================
  if (req.method === 'PATCH') {
    const { slug, ai_summary, status } = req.body;

    if (!slug) {
      return res.status(400).json({ error: 'slug is required' });
    }

    const updateData = {};
    if (ai_summary !== undefined) updateData.ai_summary = ai_summary;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from('briefs')
      .update(updateData)
      .eq('slug', slug)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: 'Failed to update brief' });
    }

    return res.status(200).json({ success: true, data });
  }

  // ============================================================
  // DELETE: УДАЛИТЬ БРИФ ИЗ ДАШБОРДА
  // ============================================================
  if (req.method === 'DELETE') {
    const { slug, user_id } = req.body;

    if (!slug || !user_id) {
      return res.status(400).json({ error: 'slug and user_id are required' });
    }

    const { error } = await supabase
      .from('briefs')
      .delete()
      .eq('slug', slug)
      .eq('user_id', user_id);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: 'Failed to delete brief' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
