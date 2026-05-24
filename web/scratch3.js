const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://aadutygzgrbexxuznqlr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHV0eWd6Z3JiZXh4dXpucWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDU1NzIsImV4cCI6MjA5MzY4MTU3Mn0.ylfcruECm7WSM4Lgs0pJ8kDj8MFT8CfVhGtWorSOEMY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking if items with has_variants = false exist...");
  const { data: items, error } = await supabase
    .from('items')
    .select('id, name, has_variants, item_variants:vw_item_variants_with_fallback(id, label, image_url)')
    .eq('has_variants', false);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Found ${items?.length} items with has_variants = false.`);
    if (items && items.length > 0) {
      console.log("Sample items:", items.slice(0, 5));
    }
  }
}
check();
