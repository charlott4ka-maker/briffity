# Briefify — Гайд по деплою

Всё бесплатно. Займёт ~30 минут.

---

## Стек

| Сервис | Зачем | Бесплатный лимит |
|--------|-------|-----------------|
| **Vercel** | Хостинг + serverless functions | 100GB трафик, 100K вызовов/мес |
| **Supabase** | PostgreSQL база данных | 500MB, 50K запросов/мес |
| **Anthropic** | AI-саммари | Платно, ~$0.003 за бриф |
| **Resend** | Email отправка | 3 000 писем/месяц |

---

## Шаг 1 — Supabase (база данных)

1. Зайди на [supabase.com](https://supabase.com) → Create new project
2. Запомни **Project URL** и **service_role key** (Settings → API)
3. Открой **SQL Editor** и вставь содержимое `supabase-schema.sql` → Run

---

## Шаг 2 — Resend (email)

1. Зайди на [resend.com](https://resend.com) → Create API Key
2. Добавь свой домен или используй `onboarding@resend.dev` для теста
3. В файле `api/send-email.js` замени `briefs@yourdomain.com` на свой адрес

---

## Шаг 3 — Vercel (деплой)

```bash
# 1. Установи Vercel CLI
npm i -g vercel

# 2. Залогинься
vercel login

# 3. Перейди в папку проекта
cd briefify

# 4. Задеплой (первый раз — создаст проект)
vercel

# 5. Добавь переменные окружения
vercel env add ANTHROPIC_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add RESEND_API_KEY
vercel env add NEXT_PUBLIC_APP_URL

# 6. Задеплой в прод
vercel --prod
```

Или через UI: vercel.com → New Project → Import Git Repo → добавь env vars в Settings.

---

## Шаг 4 — Обновить фронтенд (brief-generator-v2.html)

Найди в HTML вызов Anthropic API и замени на свою serverless функцию:

```javascript
// БЫЛО (небезопасно — ключ во фронтенде):
const resp = await fetch('https://api.anthropic.com/v1/messages', {
  headers: { 'x-api-key': 'sk-ant-...' },
  ...
})

// СТАЛО (безопасно):
const resp = await fetch('/api/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ briefText })
})
const { summary } = await resp.json()
```

Добавь сохранение брифа после генерации:

```javascript
// После buildResult() добавь:
async function saveBrief(briefData) {
  const resp = await fetch('/api/briefs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: briefData })
  })
  const { slug, url } = await resp.json()
  // покажи url пользователю для копирования
  return url
}
```

---

## Структура файлов

```
briefify/
├── public/
│   ├── index.html          ← твой brief-generator-v2.html (переименуй)
│   └── brief.html          ← страница просмотра чужого брифа (опционально)
├── api/
│   ├── summarize.js        ← прокси к Anthropic API
│   ├── briefs.js           ← сохранение/загрузка из Supabase
│   └── send-email.js       ← отправка через Resend
├── supabase-schema.sql     ← схема БД (запустить один раз)
├── vercel.json             ← конфиг Vercel
├── package.json
└── .env.example            ← шаблон переменных (скопируй в .env.local)
```

---

## Локальная разработка

```bash
# Установи зависимости
npm install

# Скопируй env
cp .env.example .env.local
# Заполни .env.local реальными ключами

# Запусти локально (эмулирует Vercel serverless)
npm run dev
# → http://localhost:3000
```

---

## Что добавить потом

- [ ] Авторизация дизайнера (Supabase Auth → magic link)
- [ ] Список брифов в личном кабинете
- [ ] Статус брифа (draft / sent / approved)
- [ ] Комментарии к брифу от дизайнера
- [ ] Кастомный домен в Vercel (бесплатно)
