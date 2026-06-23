'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { TagEditor } from '@/components/wardrobe/TagEditor'
import type { WardrobeItem } from '@/types'

export function EditButton({ item }: { item: WardrobeItem }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-slate-600 font-medium hover:text-slate-800"
      >
        Edit
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit item">
        <TagEditor item={item} onClose={() => setOpen(false)} />
      </Modal>
    </>
  )
}
