const fs = require('fs');
const https = require('https');
const path = require('path');
const { createClient } = require('../web/node_modules/@supabase/supabase-js');

const envText = fs.readFileSync('web/.env.local', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const cookie = '_twpid=tw.1789089867100.714936989112722336; _ga=GA1.2.1592606572.1789089867; _gid=GA1.2.432244517.1789089867; _fbp=fb.1.1789089868093.611310810962318690; BPC=364665efca4eae1459e33ac0b1d3d01a; PHPSESSID=33959b585ce914eae98ff833b8f8559a; _gat_UA-54659473-1=1; _twsid=1789139712874-794844181.3.1789139712874; _ga_WMWV4D5ZB8=GS2.2.s1789139713$o3$g0$t1789139713$j60$l0$h0';

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Cookie': cookie,
        'Referer': 'https://eastern.in/products/?prophazecheck=1',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      timeout: 15000
    }, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || 'image/jpeg';
        resolve({ buffer, contentType });
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('1. Fetching all Eastern items from Supabase demo_items...');
  const { data: dbItems, error } = await supabase
    .from('demo_items')
    .select('id, code, name, default_image')
    .ilike('name', '%Eastern%')
    .order('code');

  if (error) {
    console.error('Error fetching items:', error);
    process.exit(1);
  }

  console.log(`Found ${dbItems.length} Eastern demo items in database.`);

  // Collect unique image URLs
  const urlMap = new Map(); // originalUrl -> supabaseUrl
  const uniqueUrls = [...new Set(dbItems.map(i => i.default_image).filter(Boolean))];
  console.log(`Unique image URLs to download & upload: ${uniqueUrls.length}`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < uniqueUrls.length; i++) {
    const origUrl = uniqueUrls[i];
    const urlObj = new URL(origUrl);
    const basename = path.basename(urlObj.pathname);
    const cleanBasename = basename.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
    const storagePath = `eastern/${cleanBasename}`;

    process.stdout.write(`[${i + 1}/${uniqueUrls.length}] Processing ${basename}... `);

    try {
      // Download
      const { buffer, contentType } = await downloadImage(origUrl);

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('item-images')
        .upload(storagePath, buffer, {
          upsert: true,
          contentType: contentType
        });

      if (uploadErr) {
        console.error(`Upload error: ${uploadErr.message}`);
        failCount++;
        continue;
      }

      // Get public URL
      const { data: pub } = supabase.storage.from('item-images').getPublicUrl(storagePath);
      urlMap.set(origUrl, pub.publicUrl);
      successCount++;
      console.log(`Uploaded (${(buffer.length / 1024).toFixed(1)} KB) -> ${pub.publicUrl}`);
    } catch(e) {
      console.error(`Error: ${e.message}`);
      failCount++;
    }
  }

  console.log(`\nUpload complete: ${successCount} succeeded, ${failCount} failed.`);

  // Now update demo_items in Supabase
  console.log('\n2. Updating Supabase demo_items with new Supabase Storage URLs...');
  let updatedItems = 0;

  for (const item of dbItems) {
    const newUrl = urlMap.get(item.default_image);
    if (newUrl && newUrl !== item.default_image) {
      const { error: upErr } = await supabase
        .from('demo_items')
        .update({ default_image: newUrl })
        .eq('id', item.id);

      if (upErr) {
        console.error(`Error updating ${item.code}:`, upErr.message);
      } else {
        updatedItems++;
      }
    }
  }

  console.log(`\nUpdated ${updatedItems} / ${dbItems.length} demo_items in Supabase!`);

  // Verification
  console.log('\n3. Verifying updated database entries...');
  const { data: verifyData } = await supabase
    .from('demo_items')
    .select('id, code, name, default_image')
    .ilike('name', '%Eastern%')
    .order('code');

  const supabaseHosted = verifyData.filter(d => d.default_image && d.default_image.includes('supabase.co/storage'));
  console.log(`Total Eastern items: ${verifyData.length}`);
  console.log(`Items hosted on Supabase Storage CDN: ${supabaseHosted.length} / ${verifyData.length}`);
  console.log('Sample updated items:');
  verifyData.slice(0, 5).forEach(d => console.log(`  [${d.code}] ${d.name} -> ${d.default_image}`));
}

run();
