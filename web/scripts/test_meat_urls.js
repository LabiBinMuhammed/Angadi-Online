const https = require('https');

const MEAT_IMAGES = {
  white_eggs: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop&q=80',
  brown_eggs: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&auto=format&fit=crop&q=80',
  chicken: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&auto=format&fit=crop&q=80',
  fish: 'https://images.unsplash.com/photo-1534043464124-3be32fe00099?w=500&auto=format&fit=crop&q=80',
  meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&auto=format&fit=crop&q=80'
};

async function test() {
  for (const [key, url] of Object.entries(MEAT_IMAGES)) {
    try {
      const res = await new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (resp) => {
          resolve({ status: resp.statusCode, type: resp.headers['content-type'] });
        }).on('error', reject);
      });
      console.log(`${key.padEnd(15)}: ${res.status} (${res.type})`);
    } catch (e) {
      console.log(`${key.padEnd(15)}: ERROR (${e.message})`);
    }
  }
}

test();
