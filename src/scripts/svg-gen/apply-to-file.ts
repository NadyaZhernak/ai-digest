/**
 * CLI helper: process `<!--svg:... -->` placeholders in a markdown file
 * and write the result back in-place.
 *
 * Usage: npx tsx src/scripts/svg-gen/apply-to-file.ts <path>
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { processSvgPlaceholders } from './index.js';

const path = process.argv[2];
if (!path) {
  console.error('Usage: tsx src/scripts/svg-gen/apply-to-file.ts <path-to-md>');
  process.exit(1);
}

const content = readFileSync(path, 'utf8');
const result = processSvgPlaceholders(content);

if (result === content) {
  console.log(`[svg-gen] No placeholders found in ${path} (or none changed).`);
} else {
  writeFileSync(path, result);
  console.log(`[svg-gen] Processed ${path}`);
}
