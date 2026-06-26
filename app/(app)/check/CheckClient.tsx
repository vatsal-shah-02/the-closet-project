'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { WardrobePicker } from '@/components/wardrobe/WardrobePicker'
import { CompatibilityResult } from '@/components/outfits/CompatibilityResult'
import { Button } from '@/components/ui/Button'
import { resizeImageFile } from '@/lib/image-utils'
import type { WardrobeItem } from '@/types'

type SlotSource =
  | { kind: 'file'; file: File; previewUrl: string }
  | { kind: 'wardrobe'; item: WardrobeItem & { signed_url: string } }

type CheckResult = {
  compatible: boolean
  verdict: string
  reason: string
  missing: string
  occasion_fit: string[]
}

type Props = {
  wardrobeItems: (WardrobeItem & { signed_url: string })[]
  currentUserId: string
  partnerName: string
}

export function CheckClient({ wardrobeItems, currentUserId, partnerName }: Props) {
  const [slots, setSlots] = useState<(SlotSource | null)[]>([null, null])
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef1 = useRef<HTMLInputElement>(null)
  const fileInputRef2 = useRef<HTMLInputElement>(null)
  const fileInputRefs = [fileInputRef1, fileInputRef2]

  function setSlot(index: number, value: SlotSource | null) {
    setSlots((prev) => {
      const old = prev[index]
      if (old?.kind === 'file') URL.revokeObjectURL(old.previewUrl)
      const next = [...prev]
      next[index] = value
      return next
    })
    setResult(null)
  }

  async function handleFileChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const resized = await resizeImageFile(file)
    const previewUrl = URL.createObjectURL(resized)
    setSlot(index, { kind: 'file', file: resized, previewUrl })
  }

  async function handleCheck() {
    const filled = slots.filter(Boolean)
    if (filled.length === 0) return

    setLoading(true)
    setError('')
    setResult(null)

    const form = new FormData()
    slots.forEach((slot, i) => {
      if (!slot) return
      const key = i === 0 ? '1' : '2'
      if (slot.kind === 'file') form.append(`image${key}`, slot.file)
      else form.append(`item${key}Id`, slot.item.id)
    })

    try {
      const res = await fetch('/api/outfits/check', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const hasAnySlot = slots.some(Boolean)

  if (wardrobeItems.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-sm mb-3">Your wardrobe is empty.</p>
        <Link href="/wardrobe" className="text-sm font-medium text-indigo-700 underline underline-offset-2">
          Add some items first
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <ImageSlot
          slot={slots[0]}
          label="Outfit or item 1"
          onUpload={() => fileInputRefs[0].current?.click()}
          onPick={() => setPickerSlot(0)}
          onClear={() => setSlot(0, null)}
        />
        <ImageSlot
          slot={slots[1]}
          label="Item 2 (optional)"
          onUpload={() => fileInputRefs[1].current?.click()}
          onPick={() => setPickerSlot(1)}
          onClear={() => setSlot(1, null)}
        />
      </div>

      <input ref={fileInputRef1} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => handleFileChange(0, e)} />
      <input ref={fileInputRef2} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => handleFileChange(1, e)} />

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      <Button onClick={handleCheck} disabled={!hasAnySlot || loading} className="w-full" size="lg">
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Analysing…
          </span>
        ) : 'Check outfit'}
      </Button>

      {result && <CompatibilityResult result={result} />}

      <WardrobePicker
        open={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        items={wardrobeItems}
        selectedId={
          pickerSlot !== null && slots[pickerSlot]?.kind === 'wardrobe'
            ? (slots[pickerSlot] as Extract<SlotSource, { kind: 'wardrobe' }>).item.id
            : undefined
        }
        onSelect={(item) => {
          if (pickerSlot !== null) setSlot(pickerSlot, { kind: 'wardrobe', item })
        }}
        currentUserId={currentUserId}
        partnerName={partnerName}
      />
    </div>
  )
}

function ImageSlot({
  slot, label, onUpload, onPick, onClear,
}: {
  slot: SlotSource | null
  label: string
  onUpload: () => void
  onPick: () => void
  onClear: () => void
}) {
  const [showOptions, setShowOptions] = useState(false)
  const imageUrl = slot?.kind === 'file' ? slot.previewUrl : slot?.kind === 'wardrobe' ? slot.item.signed_url : null

  if (imageUrl) {
    return (
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-50">
        <Image src={imageUrl} alt="Selected" fill className="object-cover" sizes="50vw" />
        <button
          onClick={onClear}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
          aria-label="Remove"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {showOptions ? (
        <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 p-3">
          <p className="text-xs text-gray-400 text-center mb-1">{label}</p>
          <button
            onClick={() => { setShowOptions(false); onUpload() }}
            className="w-full text-xs font-medium text-gray-700 bg-gray-50 rounded-lg py-2 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            Upload photo
          </button>
          <button
            onClick={() => { setShowOptions(false); onPick() }}
            className="w-full text-xs font-medium text-gray-700 bg-gray-50 rounded-lg py-2 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            From wardrobe
          </button>
          <button onClick={() => setShowOptions(false)} className="text-xs text-gray-400 mt-1">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowOptions(true)}
          className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="text-xs text-center px-2">{label}</span>
        </button>
      )}
    </div>
  )
}
