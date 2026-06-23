import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import type { WardrobeItem } from '@/types'

type ItemCardProps = {
  item: WardrobeItem & { signed_url: string }
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link href={`/wardrobe/${item.id}`} className="group block">
      <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-gray-50">
        <Image
          src={item.signed_url}
          alt={item.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          <Badge variant={item.type === 'ethnic' ? 'ethnic' : 'default'}>
            {item.type === 'ethnic' && item.ethnic_subtype ? item.ethnic_subtype : item.type}
          </Badge>
          {item.color && (
            <Badge variant="muted">{item.color}</Badge>
          )}
        </div>
      </div>
    </Link>
  )
}

export function ItemCardSkeleton() {
  return (
    <div className="block">
      <div className="aspect-[3/4] rounded-xl bg-gray-100 animate-pulse" />
      <div className="mt-2 space-y-1.5 px-0.5">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
        <div className="h-3.5 bg-gray-100 rounded animate-pulse w-1/2" />
      </div>
    </div>
  )
}
