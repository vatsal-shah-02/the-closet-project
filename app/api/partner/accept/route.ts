import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { code } = await request.json()
    if (!code) return NextResponse.json({ error: 'No invite code' }, { status: 400 })

    const { data: existingLink } = await supabase
      .from('partner_links')
      .select('id')
      .eq('status', 'accepted')
      .maybeSingle()

    if (existingLink) return NextResponse.json({ error: 'You are already linked with a partner' }, { status: 400 })

    const admin = createAdminClient()

    // Atomic conditional UPDATE — eliminates the check-then-act race condition.
    // Only one concurrent request can match status='pending' AND partner_id IS NULL.
    const { data: updated, error } = await admin
      .from('partner_links')
      .update({ partner_id: user.id, status: 'accepted' })
      .eq('invite_code', code)
      .eq('status', 'pending')
      .neq('requester_id', user.id)
      .is('partner_id', null)
      .select()
      .single()

    if (error || !updated) {
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Partner accept error:', err)
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 })
  }
}
