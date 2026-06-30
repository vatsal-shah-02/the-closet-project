import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: existing } = await supabase
      .from('partner_links')
      .select('id')
      .eq('status', 'accepted')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already linked with a partner' }, { status: 400 })
    }

    const admin = createAdminClient()

    await admin
      .from('partner_links')
      .delete()
      .eq('requester_id', user.id)
      .eq('status', 'pending')

    const { data: link, error } = await supabase
      .from('partner_links')
      .insert({ requester_id: user.id, invite_code: generateCode() })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ code: link.invite_code })
  } catch (err) {
    console.error('Partner invite error:', err)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}
