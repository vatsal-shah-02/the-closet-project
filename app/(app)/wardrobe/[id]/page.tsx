import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { DeleteButton } from './DeleteButton'
import { EditButton } from './EditButton'
import type { WardrobeItem } from '@/types'

const BUCKET = 'wardrobe-images'

export default async function ItemDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user!.id)
    .single()

  if (!data) notFound()

  const item = data as WardrobeItem

  const admin = createAdminClient()
  const { data: signed } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(item.image_url, 3600)

  const signedUrl = signed?.signedUrl ?? ''

  return (
    <div className="min-h-screen">
      <header className="px-4 pt-12 pb-4 flex items-center gap-3">
        <Link href="/wardrobe" className="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold flex-1 truncate">{item.name}</h1>
        <EditButton item={item} />
      </header>

      <div className="aspect-[3/4] relative mx-4 rounded-2xl overflow-hidden bg-gray-50">
        {signedUrl ? (
          <Image
            src={signedUrl}
            alt={item.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={item.type === 'ethnic' ? 'ethnic' : 'default'}>
            {item.type === 'ethnic' && item.ethnic_subtype ? item.ethnic_subtype : item.type}
          </Badge>
          <Badge>{item.style}</Badge>
          <Badge>{item.occasion}</Badge>
          <Badge>{item.season}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoRow label="Primary color" value={item.color} />
          <InfoRow label="All colors" value={item.colors?.join(', ') || item.color} />
          <InfoRow label="Worn" value={`${item.wear_count} time${item.wear_count === 1 ? '' : 's'}`} />
          {item.last_worn_at && (
            <InfoRow label="Last worn" value={new Date(item.last_worn_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
          )}
        </div>

        {item.notes && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Styling note</p>
            <p className="text-sm text-gray-700">{item.notes}</p>
          </div>
        )}

        <DeleteButton itemId={item.id} />
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5 capitalize">{value}</p>
    </div>
  )
}
