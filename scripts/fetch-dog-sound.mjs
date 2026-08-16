import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'sounds');
const outFile = path.join(outDir, 'dog-maltese.mp3');

const url = 'https://taira-komori.net/sound_os2/animals01/maltese_dog4.mp3';

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
