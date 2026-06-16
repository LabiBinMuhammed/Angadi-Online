import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const targetLanguages = ['ml', 'hi', 'ar']

async function translateText(texts: string[], targetLanguage: string, apiKey: string): Promise<string[]> {
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: texts,
        target: targetLanguage,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Google Translate API error: ${errText}`)
    }

    const data = await response.json()
    return data.data.translations.map((t: any) => t.translatedText)
  } catch (err) {
    console.error(`Error translating to ${targetLanguage}:`, err)
    // Return original texts as fallback
    return texts
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, id, fields } = await request.json()

    if (!type || !id || !fields) {
      return NextResponse.json({ error: 'Missing type, id, or fields' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const apiKey = process.env.GOOGLE_TRANSLATION_API_KEY

    const keys = Object.keys(fields)
    const values = Object.values(fields) as string[]

    const results: Record<string, Record<string, string>> = {}

    // Translate for each target language (Malayalam, Hindi, Arabic)
    for (const lang of targetLanguages) {
      let translatedValues = [...values]

      if (apiKey) {
        translatedValues = await translateText(values, lang, apiKey)
      } else {
        console.warn(`[API Translate] GOOGLE_TRANSLATION_API_KEY is not defined. Falling back to original English text for ${lang}.`)
      }

      const translatedObj: Record<string, string> = {}
      keys.forEach((key, idx) => {
        translatedObj[key] = translatedValues[idx] || values[idx]
      });

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
        const { error } = await supabase
          .from('item_translations')
          .upsert({
            item_id: id,
            language_code: lang,
            name: translatedObj.name,
            description: translatedObj.description || ''
          }, {
            onConflict: 'item_id,language_code'
          })
        if (error) console.error(`Failed to save item translation for ${lang}:`, error.message)
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

    return NextResponse.json({ success: true, translations: results })
  } catch (err: any) {
    console.error('Translation route failed:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
