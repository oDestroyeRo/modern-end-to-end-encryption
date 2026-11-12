import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const page = fileURLToPath(new URL('../index.html', import.meta.url));
const port = Number(process.env.PORT || 5173);
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path !== '/' && path !== '/index.html') {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const html = await readFile(page);
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html);
  } catch {
    response.writeHead(500).end('Unable to read the presentation');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`MLS Explained: http://localhost:${port}`));
