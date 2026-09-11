const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const WEB_DIR = path.join(__dirname, 'mobile', 'build', 'web');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/proxy?url=')) {
    try {
      const targetUrl = decodeURIComponent(req.url.slice('/proxy?url='.length));
      const client = targetUrl.startsWith('https') ? require('https') : require('http');
      client.get(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
          'Content-Type': proxyRes.headers['content-type'] || 'image/jpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400'
        });
        proxyRes.pipe(res);
      }).on('error', (err) => {
        res.writeHead(500);
        res.end('Proxy error: ' + err.message);
      });
      return;
    } catch (e) {
      res.writeHead(400);
      res.end('Bad URL');
      return;
    }
  }

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  let filePath = path.join(WEB_DIR, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(WEB_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Error loading file');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Flutter Web Server running at http://localhost:${PORT}`);
});
