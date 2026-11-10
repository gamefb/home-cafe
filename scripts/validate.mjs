#!/usr/bin/env node
// Checks menu.yml for mistakes. Runs on every push (GitHub Actions) and locally:
//   docker compose run --rm validate      (no Node needed)
//   npm run validate                      (if you have Node)
// Exits with code 1 when there are errors, which stops the site from publishing.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildMenu } from '../assets/menu.js';

const file = fileURLToPath(new URL('../menu.yml', import.meta.url));
const inActions = Boolean(process.env.GITHUB_ACTIONS);

let source;
try {
  source = await readFile(file, 'utf8');
} catch {
  console.error(`✖ Couldn't find menu.yml at ${file}`);
  process.exit(1);
}

const { menu, errors, warnings } = buildMenu(source);

for (const w of warnings) {
  console.warn(inActions ? `::warning file=menu.yml::${w}` : `⚠ ${w}`);
}
for (const e of errors) {
  console.error(inActions ? `::error file=menu.yml::${e}` : `✖ ${e}`);
}

if (errors.length) {
  console.error(`\nmenu.yml has ${errors.length} error${errors.length === 1 ? '' : 's'}. Fix them and try again.`);
  process.exit(1);
}

const { sections, drinks, out } = menu.stats;
console.log(
  `✔ menu.yml looks good: ${sections} section${sections === 1 ? '' : 's'}, ` +
    `${drinks} drink${drinks === 1 ? '' : 's'}${out ? `, ${out} faded (out today)` : ''}` +
    `${warnings.length ? `, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}` : ''}.`
);
