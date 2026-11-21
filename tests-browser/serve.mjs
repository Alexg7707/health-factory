import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicRoot = fileURLToPath(new URL('../public', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg' };

async function serveFile(request, response) {
  try {
    const { pathname } = new URL(request.url, 'http://127.0.0.1');
    const file = resolve(publicRoot, '.' + (pathname === '/' ? '/index.html' : decodeURIComponent(pathname)));
    if (!file.startsWith(publicRoot + sep)) {
      response.writeHead(404).end();
      return;
    }
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(content);
  } catch {
    response.writeHead(404).end();
  }
}

export default async function startPreview() {
  const server = createServer(serveFile);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  process.env.HEALTH_FACTORY_TEST_URL = 'http://127.0.0.1:' + server.address().port;
  return async () => {
    server.close();
    await once(server, 'close');
  };
}
