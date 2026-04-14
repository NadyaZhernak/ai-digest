# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Команды разработки

```bash
npm run dev        # dev-сервер на http://localhost:4321
npm run build      # продакшн-сборка
npm run preview    # предпросмотр сборки
npm run pipeline   # запуск AI-пайплайна публикации
```

Для пайплайна обязателен `REPLICATE_API_TOKEN` (генерация обложек через Replicate).

### Сайт

- `src/content.config.ts` — схема frontmatter для коллекции `blog` (title, description, pubDate, tags, heroImage?, source?)
- `src/pages/` — маршруты: главная (`index.astro`), блог (`blog/`), RSS (`rss.xml.js`)
- `src/assets/` — обложки статей (`{slug}.webp`)

### Пайплайн публикации (`npm run pipeline`)

Точка входа: `src/scripts/pipeline/index.ts`. Выполняет 6 шагов последовательно:

1. **search.ts** — читает существующие статьи из `src/content/blog/` (чтобы не дублировать темы)
2. **search.ts** — перебирает темы из `digest.config.json`, находит первую без дубля (`searchNews` — пока STUB, вернёт Tavily в Step 5)
3. **write.ts** — загружает тематический промпт из `docs/prompts/` или использует `STYLE_DEFAULT`
4. **cover.ts** — генерирует обложку через Replicate (`flux-schnell`, 16:9 webp), сохраняет в `src/assets/{slug}.webp`
5. **write.ts** — строит заглушку статьи (`buildStubArticle` — реальный вызов Claude API будет в Step 5)
6. **publish.ts** — пишет `.md` в `src/content/blog/` и создаёт PR (`createPullRequest` — пока STUB, запишет файл локально)

### Конфигурация пайплайна

`digest.config.json` — 6 тем (yarn_trends, color_trends, social_microtrends, techniques_crochet, techniques_knitting, season_forecast). Каждая тема содержит `search_query`, `image_prompt` и ссылку на файл промпта в `docs/prompts/`.

