import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function test() {
  const { data, error } = await supabase.from('items').select('id, name, status, shop_id')
  console.log("ITEMS:")
  console.log(data)
  if (error) console.error(error)
}

test()
