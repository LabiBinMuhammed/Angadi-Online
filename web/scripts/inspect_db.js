const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    if (k) env[k] = v;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspect() {
  const tables = [
    'users', 'user_addresses', 'order_addresses', 'shops', 'shop_owners',
    'locations', 'categories', 'unit_groups', 'units', 'category_unit_groups',
    'demo_items', 'demo_item_variants', 'items', 'item_sell_configs', 'item_variants', 'item_images',
    'orders', 'order_items', 'shop_user_credits', 'order_replacements', 'order_item_replacements',
    'order_reviews', 'user_favorites', 'user_pinned_shops', 'shop_commissions', 'vendor_commissions',
    'vendor_commission_settings', 'vendor_commission_reports', 'vendor_rewards', 'shop_billing_plans',
    'shop_commission_plans', 'admin_logs', 'system_notifications', 'feedbacks', 'disputes', 'translations',
    'commission_invoices', 'delivery_batches'
  ];

  console.log('=== VERIFYING DATABASE TABLES & SCHEMAS ===');
  const results = {};
  for (const t of tables) {
    try {
      const { data, error, count } = await supabase.from(t).select('*', { count: 'exact' }).limit(1);
      if (!error) {
        const sampleKeys = (data && data.length > 0) ? Object.keys(data[0]) : [];
        results[t] = { exists: true, count, sampleKeys };
        console.log(`✓ [${t}] - count: ${count}, columns: ${sampleKeys.length ? sampleKeys.join(', ') : '(empty table)'}`);
      } else {
        results[t] = { exists: false, error: error.message, code: error.code };
        if (error.code !== '42P01') {
          console.log(`! [${t}] - accessible with error: ${error.message} (${error.code})`);
        } else {
          console.log(`✗ [${t}] - does not exist`);
        }
      }
    } catch (e) {
      console.log(`ERR on ${t}:`, e.message);
    }
  }

  // Also check RPCs and distinct roles
  const { data: usersData } = await supabase.from('users').select('role, is_active, language');
  console.log('\n=== USERS SUMMARY ===');
  console.log('Total users:', usersData ? usersData.length : 0);
  if (usersData) {
    const roles = {};
    usersData.forEach(u => {
      roles[u.role] = (roles[u.role] || 0) + 1;
    });
    console.log('Roles breakdown:', roles);
  }
}

inspect().catch(console.error);
