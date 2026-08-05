import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const targetLanguages = ['ml', 'hi', 'ar']

function normalizeSearchQuery(input: string): string {
  let val = input.toLowerCase();
  val = val.replace(/[^\p{L}\p{N}]/gu, '');
  return val;
}

async function translateWithGemini(
  fields: Record<string, string>,
  targetLang: string,
  apiKey: string,
  type: string
): Promise<{ translatedFields: Record<string, string>; keywords: string[] }> {
  const languageNames: Record<string, string> = {
    ml: 'Malayalam',
    hi: 'Hindi',
    ar: 'Arabic'
  };
  const langName = languageNames[targetLang] || targetLang;

  const prompt = `
You are a helpful localization assistant.
Translate the following fields to the language: ${langName} (code: ${targetLang}).
If the field is empty or undefined, keep it empty.

Fields to translate:
${JSON.stringify(fields, null, 2)}

${type === 'item' ? `Also generate a list of 5 to 8 highly relevant, localized search terms, tags, or synonyms for this product in ${langName}. Include common local names, native script spellings, and their English transliterated spellings (e.g., for "Tomato" in Malayalam, include both native "തക്കാളി" and transliterated "thakkali").` : ''}

You MUST return the output ONLY as a valid JSON object matching the following TypeScript interface, with no markdown formatting wrapper (do not wrap in \`\`\`json ... \`\`\`):
{
  "translatedFields": {
    // translated key-value pairs matching the exact keys provided in the input fields
  }${type === 'item' ? ',\n  "keywords": [\n    // array of generated search terms/keywords in the target language and transliterations\n  ]' : ''}
}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${errText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    const result = JSON.parse(rawText);

    return {
      translatedFields: result.translatedFields || fields,
      keywords: result.keywords || []
    };
  } catch (err) {
    console.error(`[Gemini Translate] Error translating to ${targetLang}:`, err);
    return { translatedFields: fields, keywords: [] };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, id, fields } = await request.json()

    if (!type || !id || !fields) {
      return NextResponse.json({ error: 'Missing type, id, or fields' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const geminiKey = process.env.GEMINI_API_KEY
    const googleKey = process.env.GOOGLE_TRANSLATION_API_KEY
    const apiKey = geminiKey || googleKey

    const results: Record<string, Record<string, string>> = {}

    const cleanFields = { ...fields }
    if (cleanFields.description && typeof cleanFields.description === 'string') {
      cleanFields.description = cleanFields.description.split(/\n+Keywords:/i)[0].trim()
    }

    // Translate for each target language (Malayalam, Hindi, Arabic)
    for (const lang of targetLanguages) {
      let translatedObj: Record<string, string> = { ...cleanFields }
      let keywords: string[] = []

      if (apiKey) {
        const geminiRes = await translateWithGemini(cleanFields, lang, apiKey, type)
        translatedObj = geminiRes.translatedFields
        keywords = geminiRes.keywords
      } else {
        console.warn(`[API Translate] No translation API key (GEMINI_API_KEY or GOOGLE_TRANSLATION_API_KEY) is defined. Falling back to original English text for ${lang}.`)
      }

      results[lang] = translatedObj

      // Save translation to Supabase table based on type
      if (type === 'category') {
        const { error } = await supabase
          .from('category_translations')
          .upsert({
            category_id: id,
            language_code: lang,
            name: translatedObj.name
          }, {
            onConflict: 'category_id,language_code'
          })
        if (error) console.error(`Failed to save category translation for ${lang}:`, error.message)
      } else if (type === 'demo_item') {
        const { error } = await supabase
          .from('demo_item_translations')
          .upsert({
            demo_item_id: id,
            language_code: lang,
            name: translatedObj.name
          }, {
            onConflict: 'demo_item_id,language_code'
          })
        if (error) console.error(`Failed to save demo_item translation for ${lang}:`, error.message)
      } else if (type === 'item') {
        let finalDescription = translatedObj.description || ''
        if (keywords && keywords.length > 0) {
          finalDescription = [
            finalDescription,
            `Keywords: ${keywords.join(', ')}`
          ].filter(Boolean).join('\n\n')
        }

        const { error } = await supabase
          .from('item_translations')
          .upsert({
            item_id: id,
            language_code: lang,
            name: translatedObj.name,
            description: finalDescription
          }, {
            onConflict: 'item_id,language_code'
          })
        if (error) {
          console.error(`Failed to save item translation for ${lang}:`, error.message)
        } else {
          // Attempt to save keywords to search terms table as a database fallback if the table is available
          if (keywords && keywords.length > 0) {
            for (const kw of keywords) {
              if (!kw || kw.trim() === '') continue;
              const normKw = normalizeSearchQuery(kw);
              try {
                const { data: existing } = await supabase
                  .from('item_search_terms')
                  .select('id')
                  .eq('item_id', id)
                  .eq('language_code', lang)
                  .eq('term', kw.trim())
                  .maybeSingle();

                if (!existing) {
                  await supabase
                    .from('item_search_terms')
                    .insert({
                      item_id: id,
                      language_code: lang,
                      term: kw.trim(),
                      normalized_term: normKw,
                      priority: 7,
                      is_custom: true
                    });
                }
              } catch (e) {
                // Fail silently or log if DB table is missing, since we've already saved it in description!
              }
            }
          }
        }
      } else if (type === 'variant') {
        const { error } = await supabase
          .from('variant_translations')
          .upsert({
            variant_id: id,
            language_code: lang,
            label: translatedObj.label
          }, {
            onConflict: 'variant_id,language_code'
          })
        if (error) console.error(`Failed to save variant translation for ${lang}:`, error.message)
      }
    }

    return NextResponse.json({ success: true, translations: results }, { headers: corsHeaders })
  } catch (err: any) {
    console.error('Translation route failed:', err)
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  })
}
