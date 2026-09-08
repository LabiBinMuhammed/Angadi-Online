const https = require('https');

const CANDIDATES = {
  watermelon1: 'https://images.unsplash.com/photo-1589984662646-e7b2e4959493?w=500&auto=format&fit=crop&q=80',
  watermelon2: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=500&auto=format&fit=crop&q=80',
  watermelon3: 'https://images.unsplash.com/photo-1582281298055-e25b84a30b0b?w=500&auto=format&fit=crop&q=80',
  pomegranate_seeds: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=500&auto=format&fit=crop&q=80',
  pomegranate1: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=500&auto=format&fit=crop&q=80',
  passion_fruit: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80',
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80',
  strawberry: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&auto=format&fit=crop&q=80'
};

async function test() {
  for (const [key, url] of Object.entries(CANDIDATES)) {
    try {
      const res = await new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (resp) => {
          resolve({ status: resp.statusCode, type: resp.headers['content-type'] });
        }).on('error', reject);
      });
      console.log(`${key.padEnd(20)}: ${res.status} (${res.type})`);
    } catch (e) {
      console.log(`${key.padEnd(20)}: ERROR (${e.message})`);
    }
  }
}

test();
