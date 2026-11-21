import { copyFile, cp, mkdtemp, readdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'public');
const staging = await mkdtemp(join(root, '.public-build-'));

try {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isFile() && /\.(html|css)$/.test(entry.name)) {
      await copyFile(join(root, entry.name), join(staging, entry.name));
    }
  }
  await cp(join(root, 'images'), join(staging, 'images'), { recursive: true });
  await cp(join(root, 'dist'), staging, { recursive: true });

  // Replace the previous output only after all sources have copied successfully.
  await rm(output, { recursive: true, force: true });
  await rename(staging, output);
} finally {
  await rm(staging, { recursive: true, force: true });
}
