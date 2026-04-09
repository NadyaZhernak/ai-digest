import fs from 'fs';
import path from 'path';
import type { Topic, NewsItem } from './search.js';

export const STYLE_DEFAULT = `
Пиши в разговорном стиле, обращайся к читателю на "ты".
Голос — подружка-эксперт: объясняет просто, с юмором, снимает страх перед сложными техниками.
Заголовки — разговорные, как будто советуешь подруге.
Вступление — как сообщение в мессенджер, без пафоса.
Финал — короткий, без пафоса, можно с лёгкой иронией.
`.trim();

/** Use when a topic-specific prompt file is available */
export function buildStyleWithPrompt(articlePrompt: string): string {
  return `Используй следующий промпт как точное руководство по написанию статьи:\n\n${articlePrompt}`;
}

/** Loads a topic-specific prompt file if specified. */
export function loadArticlePrompt(topic: Topic): string | null {
  if (!topic.article_prompt_file) return null;
  const promptPath = path.join(process.cwd(), topic.article_prompt_file);
  if (!fs.existsSync(promptPath)) {
    console.warn(`[WARN] Prompt file not found: ${promptPath}`);
    return null;
  }
  return fs.readFileSync(promptPath, 'utf-8');
}

/** STUB: builds a placeholder article. Will call Claude API in Step 5. */
export function buildStubArticle(topic: Topic, newsItems: NewsItem[], imagePath: string): string {
  const date = new Date().toISOString().split('T')[0];
  const firstNews = newsItems[0];

  return `---
title: '[STUB] Дайджест: ${topic.name}'
description: 'Заглушка пайплайна (Step 3). Тема: ${topic.name}. Источник: ${firstNews?.title ?? 'нет новостей'}'
pubDate: '${date}'
tags: ['knitting', 'trends', '${topic.name}']
cover: '${imagePath}'
---

> ⚠️ Это заглушка Step 3. Реальный текст будет генерировать Claude в Step 5.

## Тема: ${topic.name}

**Поисковый запрос:** \`${topic.search_query}\`

### Найденные новости

${newsItems.map((n, i) => `${i + 1}. [${n.title}](${n.url})\n   ${n.description}`).join('\n\n')}
`;
}
