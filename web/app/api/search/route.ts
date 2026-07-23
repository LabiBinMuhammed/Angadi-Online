import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aadutygzgrbexxuznqlr.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHV0eWd6Z3JiZXh4dXpucWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNTU3MiwiZXhwIjoyMDkzNjgxNTcyfQ.omCGKMc8gneLLbPM5_D0oyQgPgaBE3szA7WGmm8rfaQ';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

// Cache for database items to optimize performance and prevent rate limiting
interface CacheData {
  items: any[];
  timestamp: number;
}

let dbCache: CacheData | null = null;
const CACHE_TTL = 300000; // 5 minutes

// Custom search terms / synonyms dictionary
const CUSTOM_SYNONYMS: Record<string, string[]> = {
  // Onion (savala/savola/ulli/pyaz)
  'onion': ['onion', 'onions', 'ulli', 'savala', 'savola', 'sawala', 'സവാള', 'ഉള്ളി', 'pyaz', 'pyaaz', 'प्याज', 'بصل', 'onoin', 'onoinn', 'oni'],
  // Tomato (thakkali/tamatar)
  'tomato': ['tomato', 'tomatoes', 'thakkali', 'തക്കാളി', 'tamatar', 'टमाटर', 'طماطم', 'tomat', 'tomatos'],
  // Chicken (kozhi/murgi)
  'chicken': ['chicken', 'chiken', 'kozhi', 'കോഴി', 'murgi', 'मुर्गी', 'دجاج', 'kozhi ഇറച്ചി'],
  // Watermelon (vatakka/thannimathan)
  'water melon': ['watermelon', 'water melon', 'whater melon', 'watamelon', 'vatakka', 'തണ്ണിമത്തൻ', 'വതക്ക']
};

function normalizeSearchQuery(input: string): string {
  let val = input.toLowerCase();
  // Strip punctuation, keeping all Unicode letters and numbers
  val = val.replace(/[^\p{L}\p{N}]/gu, '');
  return val;
}

function generatePhoneticKey(input: string): string {
  let val = input.toLowerCase();
  // Strip punctuation, keeping all Unicode letters, numbers, and spaces
  val = val.replace(/[^\p{L}\p{N}\s]/gu, '');
  
  if (/[a-z]/.test(val)) {
    // Keep only Latin letters
    val = val.replace(/[^a-z]/g, '');
    
    // Transliteration variants for Malayalam/Hindi in Manglish/Hinglish
    val = val.replace(/zh/g, 'l');   // kozhi -> koli
    val = val.replace(/w/g, 'v');    // sawala -> savala
    val = val.replace(/oo/g, 'u');
    val = val.replace(/ee/g, 'i');
    val = val.replace(/ea/g, 'i');
    val = val.replace(/aa/g, 'a');
    val = val.replace(/o/g, 'a');    // savola -> savala
    val = val.replace(/sh/g, 's');
    val = val.replace(/ph/g, 'f');
    val = val.replace(/y/g, 'i');    // pyaz -> piaz
    
    // Collapse duplicate letters
    val = val.replace(/([a-z0-9])\1+/g, '$1');
  } else {
    // Collapse spaces and duplicate characters for native scripts
    val = val.replace(/\s+/g, '');
    val = val.replace(/(.)\1+/g, '$1');
  }
  
  return val;
}

// Helper to compute trigram similarity
function getTrigrams(str: string): string[] {
  const s = '  ' + str + '  '; // pad
  const trigrams: string[] = [];
  for (let i = 0; i < s.length - 2; i++) {
    trigrams.push(s.substring(i, i + 3));
  }
  return trigrams;
}

function getSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const trigrams1 = getTrigrams(str1);
  const trigrams2 = getTrigrams(str2);
  const set2 = new Set(trigrams2);
  let intersection = 0;
  for (const t of trigrams1) {
    if (set2.has(t)) {
      intersection++;
    }
  }
  const union = trigrams1.length + trigrams2.length - intersection;
  return union > 0 ? intersection / union : 0;
}

async function fetchDatabaseData(): Promise<CacheData> {
  const now = Date.now();
  if (dbCache && now - dbCache.timestamp < CACHE_TTL) {
    return dbCache;
  }

  console.log("Fetching fresh search data from Supabase REST...");
  const { data, error } = await supabase
    .from('items')
    .select(`
      id, shop_id, category_id, name, description, image_url, is_active, deleted_at, status,
      item_translations(item_id, language_code, name, description),
      item_sell_config(item_id, sell_mode, price_per_base_unit),
      item_variants(item_id, price, is_active),
      shops:shop_id(id, name, type),
      categories:category_id(id, name, is_active, category_translations(category_id, language_code, name))
    `)
    .eq('is_active', true)
    .is('deleted_at', null)
    .eq('status', 'published');

  if (error) {
    console.error("Supabase search seed load error:", error.message);
  }

  dbCache = {
    items: data || [],
    timestamp: now
  };

  return dbCache;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const shopId = searchParams.get('shopId');
  const categoryId = searchParams.get('categoryId');
  const lang = searchParams.get('lang') || 'en';

  if (!query) {
    return NextResponse.json([], { headers: corsHeaders });
  }

  try {
    const data = await fetchDatabaseData();
    const normQ = normalizeSearchQuery(query);
    const phoneQ = generatePhoneticKey(query);

    // Filter items that are active and belong to active shops
    let matchedItems = data.items.filter(item => {
      const shop = item.shops;
      const category = item.categories;
      if (!shop || shop.type?.includes('_inactive')) return false;
      if (item.category_id && (!category || !category.is_active)) return false;
      if (shopId && item.shop_id !== shopId) return false;
      if (categoryId && item.category_id !== categoryId) return false;
      return true;
    });

    const results = matchedItems.map(item => {
      const itemTrans = item.item_translations || [];
      const activeTrans = itemTrans.find((t: any) => t.language_code === lang);
      const enTrans = itemTrans.find((t: any) => t.language_code === 'en');

      const displayName = activeTrans?.name || enTrans?.name || item.name;
      const displayDesc = activeTrans?.description || enTrans?.description || item.description || '';

      // Compile search terms for this item
      const searchTerms: Array<{ term: string; priority: number }> = [];

      // 1. Base name (priority 10)
      searchTerms.push({ term: item.name, priority: 10 });
      if (displayName !== item.name) {
        searchTerms.push({ term: displayName, priority: 10 });
      }
      if (item.name.includes(' ')) {
        item.name.split(/\s+/).forEach((w: string) => {
          if (w.length >= 2) searchTerms.push({ term: w, priority: 6 });
        });
      }

      // 2. Base description words (priority 2)
      if (item.description) {
        item.description.replace(/[^\w\s]/g, ' ').split(/\s+/).forEach((w: string) => {
          if (w.length >= 3) searchTerms.push({ term: w, priority: 2 });
        });
      }

      // 3. Translations (priority 8 for name, 1 for desc)
      itemTrans.forEach((t: any) => {
        searchTerms.push({ term: t.name, priority: 8 });
        if (t.name.includes(' ')) {
          t.name.split(/\s+/).forEach((w: string) => {
            if (w.length >= 2) searchTerms.push({ term: w, priority: 5 });
          });
        }
        if (t.description) {
          t.description.replace(/[^\w\s]/g, ' ').split(/\s+/).forEach((w: string) => {
            if (w.length >= 3) searchTerms.push({ term: w, priority: 1 });
          });
        }
      });

      // 4. Category (priority 5)
      const category = item.categories;
      if (category) {
        searchTerms.push({ term: category.name, priority: 5 });
        const catTrans = category.category_translations || [];
        catTrans.forEach((ct: any) => {
          searchTerms.push({ term: ct.name, priority: 4 });
        });
      }

      // 5. Custom synonyms mapping
      const lowerName = item.name.toLowerCase();
      for (const [key, synonyms] of Object.entries(CUSTOM_SYNONYMS)) {
        if (lowerName.includes(key)) {
          synonyms.forEach(syn => {
            searchTerms.push({ term: syn, priority: 9 });
          });
        }
      }

      // Score the query against all compiled search terms
      let maxScore = 0;
      let matchedTerm = '';

      for (const st of searchTerms) {
        const normTerm = normalizeSearchQuery(st.term);
        const phoneTerm = generatePhoneticKey(st.term);

        let termScore = 0;

        // A. Exact Match (10x)
        if (normTerm === normQ) {
          termScore = 10.0 * st.priority;
        }
        // B. Prefix Match (7x)
        else if (normQ && normTerm.startsWith(normQ)) {
          termScore = 7.0 * st.priority;
        }
        // C. Phonetic Match (5x)
        else if (phoneQ && phoneTerm === phoneQ) {
          termScore = 5.0 * st.priority;
        }
        // D. Fuzzy Match (4x similarity)
        else {
          const sim = getSimilarity(normTerm, normQ);
          if (sim >= 0.3) {
            termScore = 4.0 * sim * st.priority;
          }
        }

        // E. Partial Match fallback (2x)
        if (termScore === 0 && normQ && normTerm.includes(normQ)) {
          termScore = 2.0 * st.priority;
        }

        if (termScore > maxScore) {
          maxScore = termScore;
          matchedTerm = st.term;
        }
      }

      // Price resolution: check variants first, then config
      const activeVariants = (item.item_variants || []).filter((v: any) => v.is_active);
      let price = 0;
      if (activeVariants.length > 0) {
        price = Math.min(...activeVariants.map((v: any) => v.price));
      } else {
        const config = item.item_sell_config;
        price = config ? config.price_per_base_unit : 0;
      }

      const sellConfig = item.item_sell_config;
      const sellMode = sellConfig ? sellConfig.sell_mode : 'Manual';

      const shop = item.shops;
      const catTrans = category?.category_translations || [];
      const activeCatTrans = catTrans.find((t: any) => t.language_code === lang);
      const categoryName = activeCatTrans?.name || category?.name || '';

      return {
        id: item.id,
        name: displayName,
        description: displayDesc,
        item_id: item.id,
        item_name: displayName,
        item_description: displayDesc,
        image_url: item.image_url || '',
        category_id: item.category_id || '',
        category_name: categoryName,
        shop_id: item.shop_id,
        shop_name: shop ? shop.name : '',
        relevance_score: maxScore,
        matched_term: matchedTerm,
        price,
        sell_mode: sellMode,
        has_variants: item.has_variants || false,
        is_active: item.is_active || true,
        item_translations: itemTrans,
        item_images: item.image_url ? [{ image_url: item.image_url, is_primary: true }] : []
      };
    });

    // Filter out items that did not match (relevance score 0)
    let filteredResults = results.filter(r => r.relevance_score > 0);

    // Fallback to broader fuzzy search if no results found
    if (filteredResults.length === 0) {
      const fallbackResults = results.map(r => {
        let maxFuzzy = 0;
        let matchedTerm = '';
        const itemTrans = r.item_translations || [];
        const allTerms = [r.item_name, r.item_description, ...itemTrans.map((t: any) => t.name)];

        for (const term of allTerms) {
          if (!term) continue;
          const sim = getSimilarity(normalizeSearchQuery(term), normQ);
          if (sim >= 0.15) {
            const score = 3.0 * sim * 10; // priority fallback defaults to 10
            if (score > maxFuzzy) {
              maxFuzzy = score;
              matchedTerm = term;
            }
          }
        }
        return { ...r, relevance_score: maxFuzzy, matched_term: matchedTerm };
      }).filter(r => r.relevance_score > 0);

      filteredResults = fallbackResults;
    }

    // Sort by relevance score descending
    filteredResults.sort((a, b) => b.relevance_score - a.relevance_score);

    // Limit to 20 results
    const finalResults = filteredResults.slice(0, 20);

    return NextResponse.json(finalResults, { headers: corsHeaders });
  } catch (err: any) {
    console.error("Search API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
