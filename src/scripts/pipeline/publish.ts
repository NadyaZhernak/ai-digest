import fs from 'fs';
import path from 'path';
import { slugify } from './search.js';

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
