import { notFound } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { AcceptButton } from './AcceptButton'

export default async function InvitePage({ params }: { params: { code: string } }) {
  const admin = createAdminClient()

  const { data: link } = await admin
    .from('partner_links')
    .select('*')
    .eq('invite_code', params.code)
    .eq('status', 'pending')
    .maybeSingle()

  if (!link) notFound()

  const { data: requesterProfile } = await admin
    .from('profiles')
    .select('name')
    .eq('id', link.requester_id)
    .maybeSingle()

  const requesterName = requesterProfile?.name || 'Someone'
  const initial = requesterName.charAt(0).toUpperCase()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isOwnInvite = user?.id === link.requester_id

  const { data: existingLink } = await supabase
    .from('partner_links')
    .select('id')
    .eq('status', 'accepted')
    .maybeSingle()

  const alreadyLinked = !!existingLink

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5">
          <span className="text-xl font-semibold text-indigo-700">{initial}</span>
        </div>

        <h1 className="text-xl font-semibold mb-2">{requesterName} invited you</h1>
        <p className="text-gray-500 text-sm mb-8">
          Link wardrobes on Closet to see each other&apos;s items and get outfit suggestions together.
        </p>

        {isOwnInvite ? (
          <p className="text-sm text-gray-400">This is your own invite link.</p>
        ) : alreadyLinked ? (
          <p className="text-sm text-gray-400">
            You&apos;re already linked with a partner. Unlink from your profile first to accept this invite.
          </p>
        ) : (
          <AcceptButton code={params.code} />
        )}
      </div>
    </div>
  )
}
