const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aadutygzgrbexxuznqlr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHV0eWd6Z3JiZXh4dXpucWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNTU3MiwiZXhwIjoyMDkzNjgxNTcyfQ.omCGKMc8gneLLbPM5_D0oyQgPgaBE3szA7WGmm8rfaQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getRpcSource() {
  console.log("Querying create_shop_item_transaction source...");
  
  // We can query pg_proc and pg_namespace
  const { data, error } = await supabase.from('_pg_proc_fallback_query').select('*').limit(1); // Wait, this fallback query might not exist.
  // Instead, let's call a query on information_schema or pg_proc via PostgREST if it is exposed.
  // But standard tables aren't exposed in PostgREST by default unless we use a supabase sql query? No, we don't have sql endpoint.
  // Wait, let's see if we can query pg_catalog.pg_proc using standard select.
  const { data: procData, error: procErr } = await supabase
    .from('pg_proc')
    .select('proname, prosrc')
    .eq('proname', 'create_shop_item_transaction');
    
  if (procErr) {
    console.error("Error querying pg_proc:", procErr.message);
  } else {
    console.log("pg_proc data:", procData);
  }
}

getRpcSource();
