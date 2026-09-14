const http = require('http');

function checkPort(port) {
  return new Promise(resolve => {
    const req = http.get(`http://localhost:${port}`, res => {
      resolve({ port, status: res.statusCode });
    });
    req.on('error', err => resolve({ port, error: err.message }));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve({ port, timeout: true });
    });
  });
}

async function run() {
  const r3000 = await checkPort(3000);
  console.log('Port 3000 (Next.js):', r3000);
  const r8080 = await checkPort(8080);
  console.log('Port 8080 (Flutter Web):', r8080);
}

run();
