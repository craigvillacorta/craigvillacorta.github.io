import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const checkout = process.argv[2];
if (!checkout) throw new Error('Usage: node scripts/prepare-pages.mjs /absolute/path/to/clean/pages-checkout');
const root = resolve(checkout);
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
if (git('remote', 'get-url', 'origin') !== 'https://github.com/craigvillacorta/craigvillacorta.github.io.git') throw new Error('Unexpected repository; nothing changed.');
if (git('status', '--porcelain')) throw new Error('Deployment checkout must be clean; nothing changed.');
await readFile('dist/sw.js');
await rm(`${root}/barcode-tools`, { recursive: true, force: true });
await cp('dist', `${root}/barcode-tools`, { recursive: true });
await rm(`${root}/_barcode-tools`, { recursive: true, force: true });
await mkdir(`${root}/_barcode-tools`, { recursive: true });
for (const name of ['src', 'public', 'scripts', 'tests', 'index.html', 'package.json', 'package-lock.json', 'vite.config.js', 'README.md', '.gitignore']) {
  await cp(name, `${root}/_barcode-tools/${name}`, { recursive: true });
}
const homepage = `${root}/index.html`;
let content = await readFile(homepage, 'utf8');
if (!content.includes('href="barcode-tools/"')) {
  if (!content.includes('</html>')) throw new Error('Homepage closing tag not found; add the link manually.');
  content = content.replace('</html>', '<a href="barcode-tools/">Barcode Tools</a>\n</html>');
  await writeFile(homepage, content);
}
console.log(git('diff', '--stat'));
console.log(git('status', '--short'));
console.log('Prepared; review and commit before publishing. No remote changes were made.');
