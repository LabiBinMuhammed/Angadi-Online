const https = require('https');

const URLS = {
  pomegranate: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500&auto=format&fit=crop&q=80',
  pomegranate2: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=500&auto=format&fit=crop&q=80',
  coconut1: 'https://images.unsplash.com/photo-1544378730-8b5104b18790?w=500&auto=format&fit=crop&q=80',
  coconut2: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&auto=format&fit=crop&q=80'
};

async function test() {
  for (const [k, u] of Object.entries(URLS)) {
    const res = await new Promise(resolve => {
      https.get(u, r => resolve({ status: r.statusCode })).on('error', e => resolve({ status: e.message }));
    });
    console.log(`${k}: ${res.status}`);
  }
}
test();
