import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';

const imageDirectory = new URL('../images/', import.meta.url);
const images = [
  {"name":"relationships.jpg","url":"https://images.pexels.com/photos/8415610/pexels-photo-8415610.jpeg?auto=compress&cs=tinysrgb&w=1000&q=82","sha256":"892ba101969af8c3fc7e39e1ed60f7558deb455eb2131444416ad3da89cf6099"},
  {"name":"hobbies.jpg","url":"https://images.pexels.com/photos/6925031/pexels-photo-6925031.jpeg?auto=compress&cs=tinysrgb&w=1000&q=82","sha256":"801b4544567bf2132480c2b5118c6e9fea939102184144dba6d562c3fb08023a"},
  {"name":"running.jpg","url":"https://images.pexels.com/photos/19708518/pexels-photo-19708518.jpeg?auto=compress&cs=tinysrgb&w=1000&q=82","sha256":"f8e17c3486c93ee8f955cd614a17a2ca26cbb9db9c6c186cf40df0ce90e32852"},
  {
    name: 'hero.jpg',
    url: 'https://images.pexels.com/photos/20844844/pexels-photo-20844844.jpeg?auto=compress&cs=tinysrgb&w=1250&q=83',
    sha256: 'ae5612c9f7cc4133a7bd6eddd6f2c862f5adbdaf95c6d51a2e0b4f45ef02dc02',
  },
  {
    name: 'lunch.jpg',
    url: 'https://images.pexels.com/photos/8286751/pexels-photo-8286751.jpeg?auto=compress&cs=tinysrgb&w=940&q=83',
    sha256: 'd4574e47a4a761ac2c4576e0e115bd4ed47dad271f140552650435eeb570c0e9',
  },
];

function verify(image, bytes) {
  if (createHash('sha256').update(bytes).digest('hex') !== image.sha256) {
    throw new Error(`SHA-256 mismatch for ${image.name}. See images/SOURCES.md for its source.`);
  }
}

async function prepare(image) {
  const destination = new URL(image.name, imageDirectory);
  try {
    verify(image, await readFile(destination));
    return;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const response = await fetch(image.url, {
    headers: { Accept: 'image/jpeg' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Could not fetch ${image.name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  verify(image, bytes);
  const temporary = new URL(`.${image.name}.${randomUUID()}.tmp`, imageDirectory);
  try {
    await writeFile(temporary, bytes, { flag: 'wx' });
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
}

await mkdir(imageDirectory, { recursive: true });
await Promise.all(images.map(prepare));
