import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { code } = await request.json()
    if (!code) return NextResponse.json({ error: 'No invite code' }, { status: 400 })

    const admin = createAdminClient()

    const { data: link } = await admin
      .from('partner_links')
      .select('*')
      .eq('invite_code', code)
      .eq('status', 'pending')
      .maybeSingle()

    if (!link) return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 })
    if (link.requester_id === user.id) return NextResponse.json({ error: 'Cannot accept your own invite' }, { status: 400 })

    const { data: existingLink } = await supabase
      .from('partner_links')
      .select('id')
      .eq('status', 'accepted')
      .maybeSingle()

    if (existingLink) return NextResponse.json({ error: 'You are already linked with a partner' }, { status: 400 })

    const { error } = await admin
      .from('partner_links')
      .update({ partner_id: user.id, status: 'accepted' })
      .eq('id', link.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Partner accept error:', err)
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 })
  }
}
