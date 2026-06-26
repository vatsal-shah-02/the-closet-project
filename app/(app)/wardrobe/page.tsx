import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ItemGrid } from '@/components/wardrobe/ItemGrid'
import { UploadZone } from '@/components/wardrobe/UploadZone'
import { LinkPartnerBanner } from '@/components/wardrobe/LinkPartnerBanner'
import { STORAGE_BUCKET, SIGNED_URL_TTL } from '@/lib/constants'
import type { WardrobeItem } from '@/types'

export default async function WardrobePage({
  searchParams,
}: {
  searchParams: { view?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user!.id)
    .single()

  const displayName = profileData?.name || user?.user_metadata?.full_name || user?.email || ''
  const initial = displayName.charAt(0).toUpperCase() || '?'

  const { data: partnerLink } = await supabase
    .from('partner_links')
    .select('*')
    .eq('status', 'accepted')
    .maybeSingle()

  let partnerId = ''
  let partnerName = ''

  if (partnerLink) {
    partnerId = partnerLink.requester_id === user!.id ? partnerLink.partner_id! : partnerLink.requester_id
    const admin = createAdminClient()
    const { data: pp } = await admin.from('profiles').select('name').eq('id', partnerId).maybeSingle()
    partnerName = pp?.name || 'Partner'
  }

  const viewPartner = searchParams.view === 'partner' && !!partnerLink
  const targetUserId = viewPartner ? partnerId : user!.id

  const { data: items } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })

  const wardrobeItems = (items ?? []) as WardrobeItem[]

  let signedItems: (WardrobeItem & { signed_url: string })[] = []

  if (wardrobeItems.length > 0) {
    const admin = createAdminClient()
    const paths = wardrobeItems.map((item) => item.image_url)
    const { data: signedUrls } = await admin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL)

    const urlMap = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]))
    signedItems = wardrobeItems.map((item) => ({
      ...item,
      signed_url: urlMap.get(item.image_url) ?? '',
    }))
  }

  return (
    <div>
      <header className="px-4 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Wardrobe</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{wardrobeItems.length} items</span>
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center hover:bg-indigo-100 transition-colors"
            aria-label="Profile"
          >
            <span className="text-sm font-semibold text-indigo-700">{initial}</span>
          </Link>
        </div>
      </header>

      {partnerLink ? (
        <div className="flex gap-2 px-4 mb-4">
          <Link
            href="/wardrobe"
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              !viewPartner ? 'bg-indigo-700 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Mine
          </Link>
          <Link
            href="/wardrobe?view=partner"
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              viewPartner ? 'bg-indigo-700 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {partnerName}&apos;s
          </Link>
        </div>
      ) : (
        <div className="mx-4 mb-4">
          <LinkPartnerBanner />
        </div>
      )}

      {!viewPartner && (
        <div className="px-4 mb-6">
          <UploadZone />
        </div>
      )}

      {wardrobeItems.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-gray-400 text-sm">
            {viewPartner ? `${partnerName}'s wardrobe is empty.` : 'Your wardrobe is empty.'}
          </p>
          {!viewPartner && <p className="text-gray-400 text-sm">Add your first item above.</p>}
        </div>
      ) : (
        <ItemGrid items={signedItems} />
      )}
    </div>
  )
}
