'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { WardrobeItem } from '@/types'

const OCCASIONS = [
  { id: 'casual', label: 'Casual' },
  { id: 'work', label: 'Work' },
  { id: 'date night', label: 'Date Night' },
  { id: 'party', label: 'Party' },
  { id: 'ethnic / festive', label: 'Festive' },
  { id: 'vacation', label: 'Vacation' },
  { id: 'formal', label: 'Formal' },
]

const CURRENT_MONTH = new Date().toLocaleString('en', { month: 'long' })

type Outfit = {
  title: string
  items: string[]
  note: string
}

type Props = {
  items: (WardrobeItem & { signed_url: string })[]
}

export function OutfitSuggesterClient({ items }: Props) {
  const [occasion, setOccasion] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [outfits, setOutfits] = useState<Outfit[] | null>(null)
  const [error, setError] = useState('')

  const itemMap = new Map(items.map((i) => [i.id, i]))

  async function handleSuggest() {
    if (!occasion) return
    setLoading(true)
    setError('')
    setOutfits(null)

    try {
      const res = await fetch('/api/outfits/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occasion, month: CURRENT_MONTH }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setOutfits(data.outfits ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="px-4 text-center py-16">
        <p className="text-gray-400 text-sm mb-2">Your wardrobe is empty.</p>
        <Link href="/wardrobe" className="text-sm font-medium text-indigo-700 underline underline-offset-2">
          Add some items first
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 space-y-5">
      <div className="flex flex-wrap gap-2">
        {OCCASIONS.map((occ) => (
          <button
            key={occ.id}
            onClick={() => { setOccasion(occ.id); setOutfits(null) }}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              occasion === occ.id
                ? 'bg-indigo-700 text-white border-indigo-700'
                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {occ.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleSuggest}
        disabled={!occasion || loading}
        className="w-full py-3.5 rounded-xl font-medium text-sm transition-all bg-indigo-700 text-white hover:bg-indigo-800 active:bg-indigo-900 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Styling your look…
          </span>
        ) : 'Suggest outfits'}
      </button>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      {outfits !== null && (
        outfits.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">
            Not enough items to build an outfit — add more to your wardrobe.
          </p>
        ) : (
          <div className="space-y-4 pb-4">
            {outfits.map((outfit, i) => {
              const outfitItems = outfit.items
                .map((id) => itemMap.get(id))
                .filter((item): item is WardrobeItem & { signed_url: string } => !!item)

              if (outfitItems.length === 0) return null

              return (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-0.5">
                    {outfitItems.map((item) => (
                      <div
                        key={item.id}
                        className="relative w-[72px] flex-shrink-0 aspect-[3/4] rounded-xl overflow-hidden bg-gray-50"
                      >
                        <Image
                          src={item.signed_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="72px"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="font-semibold text-sm text-gray-900">{outfit.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{outfit.note}</p>
                </div>
              )
            })}

            <button
              onClick={handleSuggest}
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium text-sm border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 transition-colors disabled:opacity-40"
            >
              {loading ? 'Regenerating…' : 'Try different outfits'}
            </button>
          </div>
        )
      )}
    </div>
  )
}
