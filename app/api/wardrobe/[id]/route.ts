import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { STORAGE_BUCKET } from '@/lib/constants'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: item } = await supabase
      .from('wardrobe_items')
      .select('image_url')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { error: dbError } = await supabase
      .from('wardrobe_items')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (dbError) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

    const admin = createAdminClient()
    await admin.storage.from(STORAGE_BUCKET).remove([item.image_url])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
