'use client'

import { useState } from 'react'
import { ItemCard } from './ItemCard'
import { cn } from '@/lib/utils'
import type { WardrobeItem, FilterState } from '@/types'

type TypeFilter = WardrobeItem['type'] | 'all'
const TYPE_FILTERS: { label: string; value: TypeFilter }[] = [
  { label: 'All', value: 'all' as TypeFilter },
  { label: 'Tops', value: 'tops' },
  { label: 'Bottoms', value: 'bottoms' },
  { label: 'Dresses', value: 'dresses' },
  { label: 'Ethnic', value: 'ethnic' },
  { label: 'Outerwear', value: 'outerwear' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Accessories', value: 'accessories' },
]

const OCCASION_FILTERS: { label: string; value: WardrobeItem['occasion'] | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Casual', value: 'casual' },
  { label: 'Work', value: 'work' },
  { label: 'Formal', value: 'formal' },
  { label: 'Party', value: 'party' },
  { label: 'Ethnic', value: 'ethnic' },
]

type ItemGridProps = {
  items: (WardrobeItem & { signed_url: string })[]
}

export function ItemGrid({ items }: ItemGridProps) {
  const [filter, setFilter] = useState<FilterState>({})
  const [activeTab, setActiveTab] = useState<'type' | 'occasion'>('type')

  const filtered = items.filter((item) => {
    if (filter.type && item.type !== filter.type) return false
    if (filter.occasion && item.occasion !== filter.occasion) return false
    return true
  })

  return (
    <div>
      <div className="flex gap-1.5 px-4 overflow-x-auto scrollbar-hide pb-1">
        {activeTab === 'type'
          ? TYPE_FILTERS.map((f) => (
              <FilterChip
                key={f.value}
                label={f.label}
                active={(!filter.type && f.value === 'all') || (filter.type !== undefined && filter.type === f.value)}
                onClick={() => setFilter((prev) => ({ ...prev, type: f.value === 'all' ? undefined : f.value as WardrobeItem['type'] }))}
              />
            ))
          : OCCASION_FILTERS.map((f) => (
              <FilterChip
                key={f.value}
                label={f.label}
                active={(!filter.occasion && f.value === 'all') || filter.occasion === f.value}
                onClick={() => setFilter((prev) => ({ ...prev, occasion: f.value === 'all' ? undefined : f.value as WardrobeItem['occasion'] }))}
              />
            ))}
      </div>

      <div className="flex gap-2 px-4 mt-2">
        <button
          onClick={() => setActiveTab('type')}
          className={cn(
            'text-xs font-medium px-2.5 py-1 rounded-full transition-colors',
            activeTab === 'type' ? 'text-slate-800 bg-slate-100' : 'text-gray-400'
          )}
        >
          By type
        </button>
        <button
          onClick={() => setActiveTab('occasion')}
          className={cn(
            'text-xs font-medium px-2.5 py-1 rounded-full transition-colors',
            activeTab === 'occasion' ? 'text-slate-800 bg-slate-100' : 'text-gray-400'
          )}
        >
          By occasion
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No items match this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 mt-2">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
        active
          ? 'bg-slate-800 text-white border-slate-800'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
      )}
    >
      {label}
    </button>
  )
}
