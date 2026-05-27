// api/briefs.js
// Сохранение и загрузка брифов из Supabase с поддержкой авторизации пользователей

const { createClient } = require('@supabase/supabase-js');
const { randomBytes } = require('crypto');

// Генерация безопасного и короткого slug для ссылок
const nanoid = (size = 8) => randomBytes(size).toString('base64url').slice(0, size);

// Инициализация Supabase клиента с правами Service Role для обхода RLS на бэкенде
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  // Настройка базовых CORS заголовков для бесперебойного общения с фронтендом
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обработка предварительных CORS-запросов браузера
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ============================================================
  // POST: СОХРАНЕНИЕ НОВОГО БРИФА
  // ============================================================
  if (req.method === 'POST') {
    const { data: briefData, ownerEmail, user_id } = req.body;

    if (!briefData) {
      return res.status(400).json({ error: 'data is required' });
    }

    const slug = nanoid(8);

    // Записываем бриф, привязывая его к UUID пользователя, если он авторизован
    const { data, error } = await supabase
      .from('briefs')
      .insert({
        slug,
        data: briefData,
        owner_email: ownerEmail || null,
        user_id: user_id || null // Привязка к аккаунту для вкладки "Мої брифи"
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

  // ============================================================
  // GET: ПОЛУЧЕНИЕ ДАННЫХ (БРИФ ИЛИ ДАШБОРД)
  // ============================================================
  if (req.method === 'GET') {
    const { slug, user_id } = req.query;

    // Сценарий 1: Загрузка списка брифов для Личного Кабинета
    if (user_id) {
      const { data, error } = await supabase
        .from('briefs')
        .select('id, slug, data, created_at') // Безопасный выбор существующих колонок
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch dashboard error:', error);
        return res.status(500).json({ error: 'Failed to fetch briefs' });
      }

      return res.status(200).json({ data });
    }

    // Сценарий 2: Загрузка одиночного брифа по прямой ссылке для клиента/дизайнера
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

  // От ворот поворот для всех остальных HTTP-методов (PUT и т.д.)
  return res.status(405).json({ error: 'Method not allowed' });
};
