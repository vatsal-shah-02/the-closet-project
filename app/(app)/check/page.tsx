import { createClient, createAdminClient } from '@/lib/supabase/server'
import { CheckClient } from './CheckClient'
import { STORAGE_BUCKET, SIGNED_URL_TTL } from '@/lib/constants'
import type { WardrobeItem } from '@/types'

export default async function CheckPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: partnerLink } = await supabase
    .from('partner_links')
    .select('*')
    .eq('status', 'accepted')
    .maybeSingle()

  let partnerName = ''

  if (partnerLink) {
    const partnerId = partnerLink.requester_id === user!.id ? partnerLink.partner_id! : partnerLink.requester_id
    const admin = createAdminClient()
    const { data: pp } = await admin.from('profiles').select('name').eq('id', partnerId).maybeSingle()
    partnerName = pp?.name || 'Partner'
  }

  const { data: items } = await supabase
    .from('wardrobe_items')
    .select('*')
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
    <div className="px-4 pt-12 pb-8">
      <h1 className="text-xl font-semibold mb-1">Check outfit</h1>
      <p className="text-gray-400 text-sm mb-6">
        Upload an outfit photo or pick items from your wardrobe
      </p>
      <CheckClient
        wardrobeItems={signedItems}
        currentUserId={user!.id}
        partnerName={partnerName}
      />
    </div>
  )
}
