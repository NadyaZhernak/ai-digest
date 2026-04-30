import fs from 'fs';
import path from 'path';
import { slugify } from './search.js';

export function writeArticle(
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

  console.log(`Article written to ${destPath}`);
  console.log(`Cover at: ${imagePath}`);

  return destPath;
}
