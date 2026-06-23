import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ItemGrid } from '@/components/wardrobe/ItemGrid'
import { UploadZone } from '@/components/wardrobe/UploadZone'
import type { WardrobeItem } from '@/types'

const BUCKET = 'wardrobe-images'
const SIGNED_URL_TTL = 3600

export default async function WardrobePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: items } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const wardrobeItems = (items ?? []) as WardrobeItem[]

  const admin = createAdminClient()
  const signedItems = await Promise.all(
    wardrobeItems.map(async (item) => {
      const { data } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(item.image_url, SIGNED_URL_TTL)
      return { ...item, signed_url: data?.signedUrl ?? '' }
    })
  )

  return (
    <div>
      <header className="px-4 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Wardrobe</h1>
        <span className="text-sm text-gray-400">{wardrobeItems.length} items</span>
      </header>

      <div className="px-4 mb-6">
        <UploadZone />
      </div>

      {wardrobeItems.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-gray-400 text-sm">Your wardrobe is empty.</p>
          <p className="text-gray-400 text-sm">Add your first item above.</p>
        </div>
      ) : (
        <ItemGrid items={signedItems} />
      )}
    </div>
  )
}
