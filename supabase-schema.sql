-- ==============================================
-- Briefify — Supabase SQL Schema
-- Запусти это в Supabase → SQL Editor
-- ==============================================

-- Таблица брифов
CREATE TABLE briefs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,          -- короткий ID для URL: /brief/aB3kR9mQ
  data         JSONB NOT NULL,                -- все поля брифа в JSON
  owner_email  TEXT,                          -- email дизайнера (опционально)
  ai_summary   TEXT,                          -- кэш AI-саммари
  view_count   INTEGER DEFAULT 0,             -- сколько раз открывали
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX briefs_slug_idx ON briefs(slug);
CREATE INDEX briefs_owner_email_idx ON briefs(owner_email);
CREATE INDEX briefs_created_at_idx ON briefs(created_at DESC);

-- Автообновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER briefs_updated_at
  BEFORE UPDATE ON briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ==============================================
-- Row Level Security (RLS)
-- ==============================================

ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

-- Читать бриф может кто угодно (по slug — это как приватная ссылка)
CREATE POLICY "Anyone can read brief by slug"
  ON briefs FOR SELECT
  USING (true);

-- Создавать брифы может кто угодно (анонимные пользователи тоже)
CREATE POLICY "Anyone can create a brief"
  ON briefs FOR INSERT
  WITH CHECK (true);

-- Обновлять бриф может только владелец (по email, если авторизован)
-- Пока оставим открытым — добавишь auth позже
CREATE POLICY "Owner can update brief"
  ON briefs FOR UPDATE
  USING (true);


-- ==============================================
-- Пример данных для теста
-- ==============================================

-- INSERT INTO briefs (slug, data, owner_email) VALUES (
--   'test1234',
--   '{
--     "name": "Delivery app redesign",
--     "task": "Redesign of an existing food delivery mobile app.",
--     "audience": "Urban professionals, 25-38 years old",
--     "goal": "Complete a food order in under 2 minutes",
--     "style": ["Minimal", "Modern"],
--     "budget": "$1,200 – $3,000",
--     "deadline": "End of June 2026"
--   }',
--   'daria@example.com'
-- );
