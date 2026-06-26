import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: link } = await supabase
      .from('partner_links')
      .select('*')
      .maybeSingle()

    if (!link) return NextResponse.json({ link: null })

    if (link.status === 'accepted' && link.partner_id) {
      const partnerId = link.requester_id === user.id ? link.partner_id : link.requester_id
      const admin = createAdminClient()
      const { data: partnerProfile } = await admin
        .from('profiles')
        .select('name')
        .eq('id', partnerId)
        .maybeSingle()

      return NextResponse.json({
        link,
        partnerName: partnerProfile?.name || 'Your partner',
        partnerId,
      })
    }

    return NextResponse.json({ link })
  } catch (err) {
    console.error('Partner status error:', err)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    await admin
      .from('partner_links')
      .delete()
      .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Partner unlink error:', err)
    return NextResponse.json({ error: 'Failed to unlink' }, { status: 500 })
  }
}
