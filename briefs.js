// api/briefs.js
// Сохранение и загрузка брифов из Supabase

import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service_role ключ — только на сервере!
);

export default async function handler(req, res) {

  // POST /api/briefs — сохранить бриф
  if (req.method === 'POST') {
    const { data: briefData, ownerEmail } = req.body;

    if (!briefData) {
      return res.status(400).json({ error: 'data is required' });
    }

    const slug = nanoid(8); // e.g. "aB3kR9mQ"

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

    return res.status(200).json({
      slug: data.slug,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/brief/${data.slug}`
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
