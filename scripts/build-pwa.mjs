import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? walk(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]));
  return nested.flat();
}
const files = (await walk('dist')).filter(file => !file.endsWith('.map') && !file.endsWith('/sw.js')).sort();
const hash = createHash('sha256');
for (const file of files) { hash.update(file); hash.update(await readFile(file)); }
const source = await readFile('public/sw.js', 'utf8');
const version = hash.update(source).digest('hex').slice(0, 16);
await writeFile('dist/sw.js', source.replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(files.map(file => file.slice(4)))));
console.log(`PWA: ${files.length} assets precached, version ${version}`);
