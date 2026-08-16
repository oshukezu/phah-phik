import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'sounds');
const outFile = path.join(outDir, 'goose-zh-tw.mp3');

const text = encodeURIComponent('鵝');
const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-TW&q=${text}`;

const response = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; phah-phik/1.0)',
  },
});

if (!response.ok) {
  console.error(`fetch failed: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const buffer = Buffer.from(await response.arrayBuffer());
await mkdir(outDir, { recursive: true });
await writeFile(outFile, buffer);
console.log(`saved ${outFile} (${buffer.length} bytes)`);
