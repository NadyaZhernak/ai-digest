// Tool type defined inline — Anthropic SDK will be imported in Step 5
export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, { type: string; description: string }>;
  required: string[];
}

export interface Tool {
  name: string;
  description: string;
  input_schema: ToolInputSchema;
}

export const SYSTEM_PROMPT = `
Ты — главный редактор AI-дайджеста о современном вязании.

## Твоя задача
Написать одну статью для дайджеста, используя инструменты в следующем порядке:
1. Прочитай существующие статьи (read_existing_articles) — запомни заголовки и теги.
2. Поищи свежие новости по каждой теме (search_news).
3. Выбери тему, которая НЕ дублирует существующие статьи.
4. Если уникальной темы нет — завершись с сообщением, не создавай PR.
5. Напиши статью (300–500 слов, русский язык).
6. Сгенерируй обложку (generate_cover_image) — промпт составь на основе готовой статьи.
7. Создай PR (create_pull_request).

## Стиль статьи
{{ARTICLE_STYLE_INSTRUCTION}}

## Формат статьи (обязательный frontmatter)
\`\`\`
---
title: 'Цепляющий заголовок'
description: 'Краткое описание (2-3 предложения)'
pubDate: 'YYYY-MM-DD'
tags: ['knitting', 'yarn', 'trends']
cover: 'src/assets/<slug>.webp'
---
\`\`\`

## Редакционная политика
- Статья публикуется только вместе с обложкой.
- Нет уникальной темы — пайплайн завершается без публикации.
- Объём: 300–500 слов (SVG-код не считается).
`.trim();

/** Use when a topic-specific prompt file is available */
export function buildStyleWithPrompt(articlePrompt: string): string {
  return `Используй следующий промпт как точное руководство по написанию статьи:\n\n${articlePrompt}`;
}

/** Fallback: casual style matching CLAUDE.md */
export const STYLE_DEFAULT = `
Пиши в разговорном стиле, обращайся к читателю на "ты".
Голос — подружка-эксперт: объясняет просто, с юмором, снимает страх перед сложными техниками.
Заголовки — разговорные, как будто советуешь подруге.
Вступление — как сообщение в мессенджер, без пафоса.
Финал — короткий, без пафоса, можно с лёгкой иронией.
`.trim();

export const TOOLS: Tool[] = [
  {
    name: 'read_existing_articles',
    description: 'Reads existing blog articles to avoid duplicating topics. Returns list of titles and tags.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'search_news',
    description: 'Searches for recent news on a given topic.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string (in English for best results)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'generate_cover_image',
    description: 'Generates a cover image. Call AFTER writing the article so the prompt reflects its content.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Image generation prompt in English, based on article topic, key imagery, and mood.',
        },
        slug: {
          type: 'string',
          description: 'URL-safe article slug, e.g. "boucle-yarn-trend-2026"',
        },
      },
      required: ['prompt', 'slug'],
    },
  },
  {
    name: 'create_pull_request',
    description: 'Creates a pull request with the article and cover image.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Article title',
        },
        content: {
          type: 'string',
          description: 'Full article in Markdown with frontmatter',
        },
        image_path: {
          type: 'string',
          description: 'Path returned by generate_cover_image',
        },
      },
      required: ['title', 'content', 'image_path'],
    },
  },
];
