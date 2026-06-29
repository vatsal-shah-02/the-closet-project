import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL, TRIP_PROMPT } from '@/lib/anthropic'
import type { WardrobeItem } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { destination, days, tripType, month, activities } = await request.json()
    if (!destination || !days) {
      return NextResponse.json({ error: 'Destination and duration required' }, { status: 400 })
    }

    const { data: items } = await supabase
      .from('wardrobe_items')
      .select('id, name, type, ethnic_subtype, color, style, occasion, season, notes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No wardrobe items found' }, { status: 400 })
    }

    const itemList = (items as WardrobeItem[])
      .map((item) => {
        const subtype = item.ethnic_subtype ? ` (${item.ethnic_subtype})` : ''
        return `[${item.id}] ${item.name} — type: ${item.type}${subtype}, color: ${item.color}, style: ${item.style}, season: ${item.season}`
      })
      .join('\n')

    const tripContext = [
      `Destination: ${destination}`,
      `Travel month: ${month || 'unspecified'}`,
      `Duration: ${days} day${days === 1 ? '' : 's'}`,
      tripType ? `Trip type: ${tripType}` : '',
      activities ? `Specific activities: ${activities}` : '',
    ].filter(Boolean).join('\n')

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `${TRIP_PROMPT}\n\nTrip details:\n${tripContext}\n\nWardrobe:\n${itemList}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let result
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      result = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Failed to parse plan' }, { status: 500 })
    }

    return NextResponse.json({
      summary: result.summary ?? '',
      packs: result.packs ?? [],
      outfits: result.outfits ?? [],
      gaps: result.gaps ?? [],
    })
  } catch (err) {
    console.error('Trip plan error:', err)
    return NextResponse.json({ error: 'Planning failed' }, { status: 500 })
  }
}
