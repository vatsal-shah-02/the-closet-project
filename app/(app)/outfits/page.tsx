import { createClient, createAdminClient } from '@/lib/supabase/server'
import { OutfitSuggesterClient } from './OutfitSuggesterClient'
import { STORAGE_BUCKET, SIGNED_URL_TTL } from '@/lib/constants'
import type { WardrobeItem } from '@/types'

export default async function OutfitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: items } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', user!.id)
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
    <div className="pt-12 pb-24">
      <header className="px-4 mb-6">
        <h1 className="text-xl font-semibold">Outfit ideas</h1>
        <p className="text-sm text-gray-400 mt-0.5">Pick an occasion, get AI-styled looks</p>
      </header>
      <OutfitSuggesterClient items={signedItems} />
    </div>
  )
}
