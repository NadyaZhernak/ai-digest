import fs from 'fs';
import path from 'path';

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
