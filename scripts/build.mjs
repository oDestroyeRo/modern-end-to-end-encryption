import { mkdir, copyFile } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
await mkdir(output, { recursive: true });
await copyFile(new URL('../index.html', import.meta.url), new URL('index.html', output));
console.log('Built dist/index.html. Open it directly or serve it with any static host.');
