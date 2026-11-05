import { readFile, readdir, writeFile } from 'node:fs/promises';
const bundled = ['@zxing/browser', '@zxing/library', '@zxing/text-encoding', 'ts-custom-error', 'jsbarcode', 'qrcode', 'dijkstrajs'];
const notices = [];
for (const name of bundled) {
  const dir = `node_modules/${name}`;
  const pkg = JSON.parse(await readFile(`${dir}/package.json`, 'utf8'));
  const files = (await readdir(dir)).filter(file => /^(licen[cs]e|copying|notice)(\.|-|$)/i.test(file));
  notices.push(`${name} ${pkg.version}\nLicense: ${pkg.license}\n${'-'.repeat(72)}`);
  for (const file of files) notices.push(await readFile(`${dir}/${file}`, 'utf8'));
}
await writeFile('public/THIRD-PARTY-LICENSES.txt', notices.join('\n\n'));
