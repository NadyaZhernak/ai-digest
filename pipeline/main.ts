import fs from 'fs';
import path from 'path';
import {
  readExistingArticles,
  searchNews,
  generateCoverImage,
  createPullRequest,
  slugify,
  type NewsItem,
} from './tools.js';
import { buildStyleWithPrompt, STYLE_DEFAULT } from './prompts.js';

interface Topic {
  name: string;
  search_query: string;
  image_prompt: string;
  article_prompt_file?: string;
}

interface DigestConfig {
  topics: Topic[];
  article: { language: string; word_count: string };
}

function loadConfig(): DigestConfig {
  const configPath = path.join(process.cwd(), 'digest.config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function loadArticlePrompt(topic: Topic): string | null {
  if (!topic.article_prompt_file) return null;
  const promptPath = path.join(process.cwd(), topic.article_prompt_file);
  if (!fs.existsSync(promptPath)) {
    console.warn(`[WARN] Prompt file not found: ${promptPath}`);
    return null;
  }
  return fs.readFileSync(promptPath, 'utf-8');
}

function buildStubArticle(topic: Topic, newsItems: NewsItem[], imagePath: string): string {
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

async function run() {
  console.log('=== AI Digest Pipeline (Step 3 — stubs) ===\n');

  const config = loadConfig();

  // Step 1: Read existing articles
  console.log('Step 1: Reading existing articles...');
  const existingArticles = readExistingArticles();
  const existingTitles = existingArticles.map(a => a.title.toLowerCase());
  console.log(`  Found ${existingArticles.length} existing articles.\n`);

  // Step 2: Search news and pick a unique topic
  console.log('Step 2: Searching for news...');
  let selectedTopic: Topic | null = null;
  let selectedNews: NewsItem[] = [];

  for (const topic of config.topics) {
    const news = searchNews(topic.search_query);

    if (news.length === 0) {
      console.log(`  [${topic.name}] No news found, skipping.`);
      continue;
    }

    const isDuplicate = existingTitles.some(existing =>
      news.some(n => n.title.toLowerCase().includes(existing.slice(0, 20)))
    );

    if (isDuplicate) {
      console.log(`  [${topic.name}] Likely duplicates existing articles, skipping.`);
      continue;
    }

    selectedTopic = topic;
    selectedNews = news;
    console.log(`  [${topic.name}] Selected — ${news.length} news items.\n`);
    break;
  }

  if (!selectedTopic) {
    console.log('No unique topic found. Pipeline finished without publishing.');
    process.exit(0);
  }

  // Step 3: Load article prompt (or use default style)
  console.log('Step 3: Loading article prompt...');
  const articlePrompt = loadArticlePrompt(selectedTopic);
  const _styleInstruction = articlePrompt
    ? buildStyleWithPrompt(articlePrompt)
    : STYLE_DEFAULT;
  console.log(articlePrompt ? '  Prompt file loaded.' : '  No prompt file — using default casual style.');

  // Step 4: Generate cover image (uses topic image_prompt in stub mode)
  // In Step 5, Claude will build a richer prompt from the article content itself.
  const slug = slugify(`${selectedTopic.name}-${new Date().toISOString().split('T')[0]}`);
  console.log('\nStep 4: Generating cover image...');
  const imagePath = generateCoverImage(selectedTopic.image_prompt, slug);

  // Step 5: Build stub article
  console.log('\nStep 5: Building stub article...');
  const articleContent = buildStubArticle(selectedTopic, selectedNews, imagePath);

  // Step 6: Create PR
  console.log('\nStep 6: Creating pull request...');
  const prUrl = createPullRequest(
    `[STUB] Дайджест: ${selectedTopic.name}`,
    articleContent,
    imagePath
  );

  console.log('\n=== Pipeline complete ===');
  console.log(`PR: ${prUrl}`);
}

run().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
