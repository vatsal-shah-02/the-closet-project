import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL, SUGGEST_PROMPT } from '@/lib/anthropic'
import type { WardrobeItem } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { occasion, month } = await request.json()
    if (!occasion) return NextResponse.json({ error: 'No occasion provided' }, { status: 400 })

    const { data: items } = await supabase
      .from('wardrobe_items')
      .select('id, name, type, ethnic_subtype, color, style, occasion, notes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!items || items.length === 0) {
      return NextResponse.json({ outfits: [] })
    }

    const itemList = (items as WardrobeItem[])
      .map((item) => {
        const subtype = item.ethnic_subtype ? ` (${item.ethnic_subtype})` : ''
        const occ = item.occasion && item.occasion !== 'all' ? `, occasion: ${item.occasion}` : ''
        return `[${item.id}] ${item.name} — type: ${item.type}${subtype}, color: ${item.color}, style: ${item.style}${occ}`
      })
      .join('\n')

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${SUGGEST_PROMPT}\n\nCurrent month: ${month || 'unknown'}\nOccasion: ${occasion}\n\nWardrobe:\n${itemList}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let result
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      result = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ outfits: [] })
    }

    return NextResponse.json({ outfits: result.outfits ?? [] })
  } catch (err) {
    console.error('Suggest error:', err)
    return NextResponse.json({ error: 'Suggestion failed' }, { status: 500 })
  }
}
