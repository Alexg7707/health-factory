import { copyFile, cp, mkdir, readdir } from 'node:fs/promises';

await mkdir('public', { recursive: true });
for (const entry of await readdir('.', { withFileTypes: true })) {
  if (entry.isFile() && /\.(html|css)$/.test(entry.name)) {
    await copyFile(entry.name, `public/${entry.name}`);
  }
}
await cp('images', 'public/images', { recursive: true });
await cp('dist', 'public', { recursive: true });
