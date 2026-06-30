'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { WardrobeItem } from '@/types'

const TRIP_TYPES = [
  { id: 'beach', label: 'Beach' },
  { id: 'city trip', label: 'City' },
  { id: 'business', label: 'Business' },
  { id: 'hiking / outdoors', label: 'Outdoors' },
  { id: 'festival / wedding', label: 'Festival' },
  { id: 'family / casual', label: 'Family' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CURRENT_MONTH_IDX = new Date().getMonth()

type PackItem = { id: string; reason: string }
type Outfit = { label: string; items: string[]; note: string }

type TripPlan = {
  summary: string
  packs: PackItem[]
  outfits: Outfit[]
  gaps: string[]
}

type Props = {
  items: (WardrobeItem & { signed_url: string })[]
}

export function TripPlannerClient({ items }: Props) {
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState(5)
  const [monthIdx, setMonthIdx] = useState(CURRENT_MONTH_IDX)
  const [tripType, setTripType] = useState<string | null>(null)
  const [activities, setActivities] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<TripPlan | null>(null)
  const [error, setError] = useState('')

  const itemMap = new Map(items.map((i) => [i.id, i]))

  async function handlePlan() {
    if (!destination.trim()) return
    setLoading(true)
    setError('')
    setPlan(null)

    try {
      const res = await fetch('/api/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.trim(),
          days,
          month: MONTHS[monthIdx],
          tripType,
          activities: activities.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setPlan(data)
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
      {/* Destination */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
          Where are you going?
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => { setDestination(e.target.value); setPlan(null) }}
          placeholder="Goa, London, New York…"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
        />
      </div>

      {/* Month */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
          When are you travelling?
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          {MONTHS.map((m, i) => (
            <button
              key={m}
              onClick={() => { setMonthIdx(i); setPlan(null) }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                monthIdx === i
                  ? 'bg-indigo-700 text-white border-indigo-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
          How many days?
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDays((d) => Math.max(1, d - 1))}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-indigo-300 transition-colors text-lg"
          >
            −
          </button>
          <span className="text-2xl font-semibold text-gray-900 w-8 text-center tabular-nums">{days}</span>
          <button
            onClick={() => setDays((d) => Math.min(30, d + 1))}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-indigo-300 transition-colors text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Trip type */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
          Trip type (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {TRIP_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTripType(tripType === t.id ? null : t.id); setPlan(null) }}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                tripType === t.id
                  ? 'bg-indigo-700 text-white border-indigo-700'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activities */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
          Any specific activities? (optional)
        </label>
        <input
          type="text"
          value={activities}
          onChange={(e) => { setActivities(e.target.value); setPlan(null) }}
          placeholder="e.g. formal dinner, beach days, hiking, wedding…"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
        />
      </div>

      {/* Plan button */}
      <button
        onClick={handlePlan}
        disabled={!destination.trim() || loading}
        className="w-full py-3.5 rounded-xl font-medium text-sm transition-all bg-indigo-700 text-white hover:bg-indigo-800 active:bg-indigo-900 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Planning your trip…
          </span>
        ) : 'Plan my trip'}
      </button>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      {/* Results */}
      {plan && (
        <div className="space-y-6 pb-4">
          {/* Summary */}
          {plan.summary && (
            <div className="bg-indigo-50 rounded-2xl px-4 py-3 border border-indigo-100">
              <p className="text-sm text-indigo-800 leading-relaxed">{plan.summary}</p>
            </div>
          )}

          {/* Empty state — Claude returned IDs not in wardrobe */}
          {plan.packs.every(({ id }) => !itemMap.get(id)) && plan.packs.length > 0 && (
            <p className="text-center text-gray-400 text-sm py-4">
              Plan generated but items weren&apos;t matched to your wardrobe. Try adding more items and planning again.
            </p>
          )}

          {/* What to pack */}
          {plan.packs.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                What to pack ({plan.packs.length} items)
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {plan.packs.map(({ id, reason }) => {
                  const item = itemMap.get(id)
                  if (!item) return null
                  return (
                    <div key={id} className="flex flex-col gap-1.5">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-50">
                        <Image
                          src={item.signed_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="33vw"
                        />
                      </div>
                      <p className="text-[11px] font-medium text-gray-700 leading-tight line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">{reason}</p>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Outfit ideas */}
          {plan.outfits.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Outfit ideas for the trip
              </h2>
              <div className="space-y-3">
                {plan.outfits.map((outfit) => {
                  const outfitItems = outfit.items
                    .map((id) => itemMap.get(id))
                    .filter((item): item is WardrobeItem & { signed_url: string } => !!item)
                  if (outfitItems.length === 0) return null
                  return (
                    <div key={outfit.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
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
                      <p className="text-xs font-semibold text-indigo-600 mb-0.5">{outfit.label}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{outfit.note}</p>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Gaps — items to buy */}
          {plan.gaps.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Consider picking up
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {plan.gaps.map((gap, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{gap}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <button
            onClick={() => { setPlan(null); setDestination(''); setTripType(null); setActivities('') }}
            className="w-full py-3 rounded-xl font-medium text-sm border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 transition-colors"
          >
            Plan again
          </button>
        </div>
      )}
    </div>
  )
}
