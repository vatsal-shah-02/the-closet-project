import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { anthropic, MODEL, TAGGING_PROMPT } from '@/lib/anthropic'
import type { ClothingTag } from '@/types'

const BUCKET = 'wardrobe-images'
const SIGNED_URL_TTL = 3600

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await request.formData()
    const image = form.get('image') as File | null

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mediaType = (image.type as 'image/jpeg' | 'image/png' | 'image/webp') || 'image/jpeg'
    const ext = image.type.includes('png') ? 'png' : 'jpg'

    const itemId = crypto.randomUUID()
    const storagePath = `${user.id}/${itemId}.${ext}`

    const admin = createAdminClient()
    const { error: storageError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: image.type, upsert: false })

    if (storageError) {
      console.error('Storage error:', storageError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    let tag: ClothingTag = DEFAULT_TAG
    try {
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
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)
      tag = { ...DEFAULT_TAG, ...parsed }
    } catch (err) {
      console.error('Tagging error (using default):', err)
    }

    const { data: item, error: dbError } = await supabase
      .from('wardrobe_items')
      .insert({
        id: itemId,
        user_id: user.id,
        name: tag.name,
        image_url: storagePath,
        image_thumbnail_url: storagePath,
        type: tag.type,
        ethnic_subtype: tag.ethnic_subtype ?? null,
        color: tag.color,
        colors: tag.colors,
        style: tag.style,
        occasion: tag.occasion,
        season: tag.season,
        notes: tag.notes,
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB error:', dbError)
      await admin.storage.from(BUCKET).remove([storagePath])
      return NextResponse.json({ error: 'Save failed' }, { status: 500 })
    }

    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL)

    return NextResponse.json({ ...item, signed_url: signed?.signedUrl ?? '' }, { status: 201 })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
