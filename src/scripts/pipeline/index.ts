import fs from 'fs';
import path from 'path';
import { readExistingArticles, searchNews, slugify, type Topic } from './search.js';
import { buildStubArticle, buildStyleWithPrompt, loadArticlePrompt, STYLE_DEFAULT } from './write.js';
import { generateCoverImage } from './cover.js';
import { writeArticle } from './publish.js';
import { processSvgPlaceholders } from '../svg-gen/index.js';

interface DigestConfig {
  topics: Topic[];
  article: { language: string; word_count: string };
}

function loadConfig(): DigestConfig {
  const configPath = path.join(process.cwd(), 'digest.config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
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
  let selectedNews = [];

  const shuffledTopics = config.topics.slice().sort(() => Math.random() - 0.5);

  for (const topic of shuffledTopics) {
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

  // Step 4: Generate cover image
  const slug = slugify(`${selectedTopic.name}-${new Date().toISOString().split('T')[0]}`);
  console.log('\nStep 4: Generating cover image...');
  const imagePath = await generateCoverImage(selectedTopic.image_prompt, slug);

  // Step 5: Build stub article
  console.log('\nStep 5: Building stub article...');
  const articleContent = buildStubArticle(selectedTopic, selectedNews, imagePath);

  // Step 5b: Process SVG diagram placeholders
  console.log('\nStep 5b: Generating SVG diagrams...');
  const articleWithSvg = processSvgPlaceholders(articleContent);

  // Step 6: Write article
  console.log('\nStep 6: Writing article...');
  const articlePath = writeArticle(
    `Дайджест: ${selectedTopic.name}`,
    articleWithSvg,
    imagePath
  );

  console.log('\n=== Pipeline complete ===');
  console.log(`Article: ${articlePath}`);
}

run().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
