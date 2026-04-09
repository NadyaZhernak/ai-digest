import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface Article {
  title: string;
  tags: string[];
  slug: string;
}

export interface NewsItem {
  title: string;
  url: string;
  description: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/** Reads existing articles from src/content/blog/ to avoid duplicate topics. */
export function readExistingArticles(): Article[] {
  const blogDir = path.join(process.cwd(), 'src/content/blog');
  if (!fs.existsSync(blogDir)) return [];

  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
  const articles: Article[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(blogDir, file), 'utf-8');
    const match = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;

    try {
      const fm = yaml.load(match[1]) as Record<string, unknown>;
      articles.push({
        title: String(fm.title ?? ''),
        tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
        slug: file.replace(/\.md$/, ''),
      });
    } catch {
      // skip malformed frontmatter
    }
  }

  return articles;
}

/** STUB: returns hardcoded news items. Will call Tavily API in Step 5. */
export function searchNews(_query: string): NewsItem[] {
  console.log(`[STUB] searchNews("${_query}")`);
  return [
    {
      title: 'Букле снова в тренде: что нужно знать в 2026',
      url: 'https://example.com/boucle-trend-2026',
      description: 'Текстурная пряжа букле возвращается в коллекции ведущих брендов. Разбираем, как с ней работать.',
    },
    {
      title: 'Цвета сезона осень-зима 2026: земляные тона и мхи',
      url: 'https://example.com/aw2026-colors',
      description: 'Pantone и WGSN опубликовали прогноз цветов. Собрали самые вязательные из них.',
    },
    {
      title: 'TikTok-тренд: вязаные балаклавы и шапки-чулки',
      url: 'https://example.com/tiktok-balaklava',
      description: 'Вязаные балаклавы набирают миллионы просмотров. Показываем простую схему.',
    },
  ];
}

/** STUB: copies placeholder cover. Will call Replicate API in Step 5. */
export function generateCoverImage(prompt: string, slug: string): string {
  console.log(`[STUB] generateCoverImage(slug="${slug}")`);
  console.log(`[STUB] image prompt: ${prompt}`);

  const assetsDir = path.join(process.cwd(), 'src/assets');
  const placeholder = path.join(assetsDir, 'placeholder-cover.jpg');
  const dest = path.join(assetsDir, `${slug}.webp`);

  if (fs.existsSync(placeholder)) {
    fs.copyFileSync(placeholder, dest);
  } else {
    fs.writeFileSync(dest, '');
    console.log(`[STUB] No placeholder found, created empty file at ${dest}`);
  }

  return `src/assets/${slug}.webp`;
}

/** STUB: writes article .md locally. Will create GitHub PR in Step 5. */
export function createPullRequest(
  title: string,
  content: string,
  imagePath: string
): string {
  const slug = slugify(title);
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-${slug}.md`;
  const destDir = path.join(process.cwd(), 'src/content/blog');
  const destPath = path.join(destDir, filename);

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(destPath, content, 'utf-8');

  const prLabel = `[STUB] Would create PR: "digest: ${title}"`;
  console.log(`[STUB] Article written to ${destPath}`);
  console.log(`[STUB] Cover at: ${imagePath}`);
  console.log(prLabel);

  return prLabel;
}
