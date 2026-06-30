import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { anthropic, MODEL, COMPATIBILITY_PROMPT, OUTFIT_REVIEW_PROMPT } from '@/lib/anthropic'
import { STORAGE_BUCKET as BUCKET, MAX_UPLOAD_BYTES, ALLOWED_MIME_TYPES } from '@/lib/constants'

type ImageInput = { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }

async function imageFromFile(file: File): Promise<ImageInput> {
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mediaType =
    file.type === 'image/png' ? 'image/png'
    : file.type === 'image/webp' ? 'image/webp'
    : 'image/jpeg'
  return { base64, mediaType }
}

async function imageFromItemId(itemId: string, userId: string, supabase: Awaited<ReturnType<typeof createClient>>): Promise<ImageInput | null> {
  const { data: item } = await supabase
    .from('wardrobe_items')
    .select('image_url')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single()

  if (!item) return null

  const ext = item.image_url.split('.').pop()?.toLowerCase()
  const mediaType: 'image/jpeg' | 'image/png' | 'image/webp' =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  const admin = createAdminClient()
  const { data: blob, error } = await admin.storage.from(BUCKET).download(item.image_url)
  if (error || !blob) return null

  const buffer = await blob.arrayBuffer()
  return { base64: Buffer.from(buffer).toString('base64'), mediaType }
}

const DEFAULT_RESULT = {
  compatible: false,
  verdict: 'Unable to analyse this outfit.',
  reason: 'Something went wrong with the analysis. Please try again.',
  missing: '',
  occasion_fit: [],
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const form = await request.formData()
    const image1File = form.get('image1') as File | null
    const image2File = form.get('image2') as File | null
    const item1Id = form.get('item1Id') as string | null
    const item2Id = form.get('item2Id') as string | null

    for (const file of [image1File, image2File]) {
      if (!file) continue
      if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 413 })
      if (!ALLOWED_MIME_TYPES.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 415 })
    }

    const images: ImageInput[] = []

    const src1 = image1File ? await imageFromFile(image1File)
      : item1Id ? await imageFromItemId(item1Id, user.id, supabase)
      : null
    if (src1) images.push(src1)

    const src2 = image2File ? await imageFromFile(image2File)
      : item2Id ? await imageFromItemId(item2Id, user.id, supabase)
      : null
    if (src2) images.push(src2)

    if (images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    const prompt = images.length === 1 ? OUTFIT_REVIEW_PROMPT : COMPATIBILITY_PROMPT

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            ...images.map((img) => ({
              type: 'image' as const,
              source: { type: 'base64' as const, media_type: img.mediaType, data: img.base64 },
            })),
            { type: 'text' as const, text: prompt },
          ],
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let result
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      result = JSON.parse(cleaned)
    } catch {
      result = DEFAULT_RESULT
    }

    return NextResponse.json({ ...DEFAULT_RESULT, ...result })
  } catch (err) {
    console.error('Check error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
