const fs = require('fs');
const path = require('path');
const { createClient } = require(path.join(__dirname, '../web/node_modules/@supabase/supabase-js'));

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

async function run() {
  console.log('=== CHECKING / CREATING PERSONAL CARE CATEGORY ===');

  const { data: existing } = await supabase
    .from('categories')
    .select('*')
    .ilike('name', '%Personal Care%')
    .maybeSingle();

  let catId;
  if (existing) {
    catId = existing.id;
    console.log(`Personal Care category already exists: [${catId}] ${existing.name}`);
  } else {
    // Get max display order
    const { data: allCats } = await supabase
      .from('categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (allCats && allCats[0] && allCats[0].display_order ? allCats[0].display_order : 14) + 1;

    const { data: inserted, error: insErr } = await supabase
      .from('categories')
      .insert({
        name: 'Personal Care & Hygiene',
        description: 'Bathing soaps, body wash, hair oils, skincare, talcs, and deodorants',
        is_active: true,
        display_order: nextOrder
      })
      .select()
      .single();

    if (insErr) {
      console.error('Error inserting category:', insErr);
      return;
    }
    catId = inserted.id;
    console.log(`Created new category: [${catId}] ${inserted.name} (order: ${nextOrder})`);
  }

  // Check category translations if table exists
  try {
    const { data: trans } = await supabase
      .from('category_translations')
      .select('*')
      .eq('category_id', catId)
      .eq('language_code', 'ml')
      .maybeSingle();

    if (!trans) {
      await supabase
        .from('category_translations')
        .insert({
          category_id: catId,
          language_code: 'ml',
          name: 'വ്യക്തിഗത പരിചരണവും ശുചിത്വവും'
        });
      console.log('Added Malayalam translation for Personal Care category.');
    }
  } catch (e) {
    console.log('Note on category_translations:', e.message);
  }
}

run();
