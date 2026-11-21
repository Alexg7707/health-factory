import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.argv[2] ?? fileURLToPath(new URL('../public/', import.meta.url));
const origin = 'https://health-factory.invalid';
const required = ['index', 'nutrition', 'relationships', 'hobbies', 'running', 'events', 'journal'];
const files = new Set();
const pages = new Map();
const errors = [];

async function inventory(directory = '') {
  for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
    const name = directory ? `${directory}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await inventory(name);
    if (entry.isFile()) files.add(name);
  }
}

function attributes(markup) {
  const result = new Map();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const [, name, double, single, bare] of markup.matchAll(pattern)) {
    const value = (double ?? single ?? bare ?? '').replace(/&amp;/gi, '&');
    result.set(name.toLowerCase(), value);
  }
  return result;
}

function inspect(page, html) {
  const ids = new Set();
  const references = [];
  // Keep opening script/style tags (they can have a src), but skip their raw text.
  const markup = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<(script|style)\b[^>]*>)[\s\S]*?<\/\2\s*>/gi, '$1');
  const tags = /<[a-z][\w:-]*\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi;
  for (const [, source] of markup.matchAll(tags)) {
    const attrs = attributes(source);
    if (attrs.has('id')) {
      const id = attrs.get('id');
      if (ids.has(id)) errors.push(`${page}: duplicate id "${id}"`);
      ids.add(id);
    }
    for (const name of ['href', 'src']) {
      if (attrs.has(name)) references.push([name, attrs.get(name)]);
    }
  }
  return { ids, references };
}

function checkReference(page, raw) {
  const value = raw.trim();
  if (!value || value === '#' || /^javascript:/i.test(value)) return 'placeholder';
  const url = new URL(value, new URL(page.split('/').map(encodeURIComponent).join('/'), origin));
  if (url.origin !== origin) {
    if (url.protocol === 'file:') return 'local filesystem URL';
    return;
  }

  let target = decodeURIComponent(url.pathname.slice(1));
  if (!target || target.endsWith('/')) target += 'index.html';
  if (!files.has(target) && files.has(`${target}/index.html`)) target += '/index.html';
  if (!files.has(target)) return 'missing file';
  const fragment = decodeURIComponent(url.hash.slice(1));
  if (fragment && pages.has(target) && !pages.get(target).ids.has(fragment)) {
    return 'missing fragment';
  }
}

await inventory();
for (const entry of required) {
  if (!files.has(`${entry}.html`)) errors.push(`Missing entry point: ${entry}.html`);
}
for (const file of [...files].sort()) {
  if (/\.html?$/i.test(file)) pages.set(file, inspect(file, await readFile(join(root, file), 'utf8')));
}
for (const [file, { references }] of pages) {
  for (const [attribute, value] of references) {
    let problem;
    try {
      problem = checkReference(file, value);
    } catch (error) {
      if (!(error instanceof URIError || error instanceof TypeError)) throw error;
      problem = 'invalid URL';
    }
    if (problem) errors.push(`${file}: ${attribute}="${value}" (${problem})`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Site check passed for ${pages.size} HTML pages.`);
}
