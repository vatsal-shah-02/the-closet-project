'use client'

import Image from 'next/image'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import type { WardrobeItem } from '@/types'

type WardrobePickerProps = {
  open: boolean
  onClose: () => void
  items: (WardrobeItem & { signed_url: string })[]
  onSelect: (item: WardrobeItem & { signed_url: string }) => void
  selectedId?: string
  currentUserId?: string
  partnerName?: string
}

export function WardrobePicker({
  open, onClose, items, onSelect, selectedId, currentUserId, partnerName,
}: WardrobePickerProps) {
  const myItems = currentUserId ? items.filter((i) => i.user_id === currentUserId) : items
  const partnerItems = currentUserId ? items.filter((i) => i.user_id !== currentUserId) : []
  const hasPartner = partnerItems.length > 0

  return (
    <Modal open={open} onClose={onClose} title="Pick from wardrobe">
      {items.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">No items in your wardrobe yet</p>
      ) : (
        <div className="space-y-5">
          {hasPartner && (
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide -mb-2">Your items</p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {myItems.map((item) => (
              <PickerItem
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onSelect={() => { onSelect(item); onClose() }}
              />
            ))}
          </div>

          {hasPartner && (
            <>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide -mb-2">
                {partnerName || 'Partner'}&apos;s items
              </p>
              <div className="grid grid-cols-3 gap-2">
                {partnerItems.map((item) => (
                  <PickerItem
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    onSelect={() => { onSelect(item); onClose() }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}

function PickerItem({
  item, selected, onSelect,
}: {
  item: WardrobeItem & { signed_url: string }
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 ring-2 transition-all',
        selected ? 'ring-indigo-700' : 'ring-transparent'
      )}
    >
      <Image
        src={item.signed_url}
        alt={item.name}
        fill
        className="object-cover"
        sizes="33vw"
      />
      {selected && (
        <div className="absolute inset-0 bg-indigo-700/20 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      )}
    </button>
  )
}
