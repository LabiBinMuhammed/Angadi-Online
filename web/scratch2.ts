import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aadutygzgrbexxuznqlr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHV0eWd6Z3JiZXh4dXpucWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNTU3MiwiZXhwIjoyMDkzNjgxNTcyfQ.omCGKMc8gneLLbPM5_D0oyQgPgaBE3szA7WGmm8rfaQ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { error } = await supabase.from('items').update({ is_active: true }).ilike('name', '%mathan%')
  console.log("Error:", error || "Success updated mathan to active")
}
run()
