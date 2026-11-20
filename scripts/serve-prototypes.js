#!/usr/bin/env node
/**
 * Zero-dependency local prototypes server and visual gallery.
 * Conforms to AGENTS.md Section 3 OpenDesign protocol.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const PROTOTYPES_DIR = path.join(__dirname, '..', 'prototypes');

function getPrototypes() {
  if (!fs.existsSync(PROTOTYPES_DIR)) {
    return [];
  }
  return fs.readdirSync(PROTOTYPES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

function serveGalleryHtml(prototypes) {
  const links = prototypes.map(p => `
    <li class="mb-2">
      <a href="/${p}/" class="flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-green-400 font-mono transition">
        <span>📁 ${p}</span>
        <span class="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">Ver Protótipo →</span>
      </a>
    </li>
  `).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NetDrill — Galeria de Protótipos (OpenDesign)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { background-color: #0c0e14; color: #e2e8f0; font-family: monospace; }</style>
</head>
<body class="p-6 max-w-4xl mx-auto">
  <header class="border-b border-gray-800 pb-4 mb-6">
    <h1 class="text-2xl font-bold text-green-400">NetDrill — Galeria de Protótipos</h1>
    <p class="text-sm text-gray-400 mt-1">Servidor local de validação visual e responsiva (AGENTS.md Seção 3)</p>
  </header>
  <main>
    <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Telas e Fluxos Disponíveis</h2>
    <ul>${links.length ? links : '<p class="text-gray-500">Nenhum protótipo encontrado em prototypes/</p>'}</ul>
  </main>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/' || url === '/index.html') {
    const prototypes = getPrototypes();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(serveGalleryHtml(prototypes));
  }

  // Serve static files from prototypes/
  const safePath = path.normalize(url).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(PROTOTYPES_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    return fs.createReadStream(filePath).pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Protótipo não encontrado');
});

server.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`  NetDrill Prototypes Gallery Server running at:`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`========================================================\n`);
});
