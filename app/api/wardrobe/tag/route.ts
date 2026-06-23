import { NextRequest, NextResponse } from 'next/server'
import { anthropic, MODEL, TAGGING_PROMPT } from '@/lib/anthropic'
import type { ClothingTag } from '@/types'

const DEFAULT_TAG: ClothingTag = {
  name: 'Clothing item',
  type: 'tops',
  color: 'unknown',
  colors: [],
  style: 'casual',
  occasion: 'casual',
  season: 'all',
  notes: '',
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const image = form.get('image') as File | null

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mediaType = (image.type as 'image/jpeg' | 'image/png' | 'image/webp') || 'image/jpeg'

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: TAGGING_PROMPT },
          ],
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let tag: ClothingTag
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      tag = JSON.parse(cleaned)
    } catch {
      tag = DEFAULT_TAG
    }

    tag = { ...DEFAULT_TAG, ...tag }

    return NextResponse.json(tag)
  } catch (err) {
    console.error('Tag error:', err)
    return NextResponse.json({ error: 'Tagging failed' }, { status: 500 })
  }
}
