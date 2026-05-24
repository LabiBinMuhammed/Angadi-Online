const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aadutygzgrbexxuznqlr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHV0eWd6Z3JiZXh4dXpucWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNTU3MiwiZXhwIjoyMDkzNjgxNTcyfQ.omCGKMc8gneLLbPM5_D0oyQgPgaBE3szA7WGmm8rfaQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Items table keys:", Object.keys(data[0] || {}));
    console.log("Items table sample:", data[0]);
  }
}

checkColumns();
