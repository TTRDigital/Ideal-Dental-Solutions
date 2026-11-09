import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
const root = new URL('../public/', import.meta.url).pathname;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
createServer(async (q, s) => {
  let p = new URL(q.url, 'http://x').pathname; if (p === '/') p = '/start/'; if (p.endsWith('/')) p += 'index.html';
  try { s.setHeader('content-type', types[extname(p)] || 'text/plain'); s.end(await readFile(join(root, p))); } catch { s.statusCode = 404; s.end('404'); }
}).listen(Number(process.env.PORT) || 4173, () => console.log('http://localhost:' + (process.env.PORT || 4173)));
