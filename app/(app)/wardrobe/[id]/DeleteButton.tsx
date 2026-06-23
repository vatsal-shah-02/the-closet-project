'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export function DeleteButton({ itemId }: { itemId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('wardrobe_items').delete().eq('id', itemId)
    router.push('/wardrobe')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setConfirming(false)} className="flex-1">
          Keep it
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={deleting} className="flex-1">
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </Button>
      </div>
    )
  }

  return (
    <Button variant="ghost" onClick={() => setConfirming(true)} className="w-full text-red-500 hover:text-red-700 hover:bg-red-50">
      Delete item
    </Button>
  )
}
