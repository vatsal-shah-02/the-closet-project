'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { WardrobeItem } from '@/types'

type EditableFields = Pick<
  WardrobeItem,
  'name' | 'type' | 'ethnic_subtype' | 'color' | 'style' | 'occasion' | 'season'
>

type TagEditorProps = {
  item: WardrobeItem
  onClose: () => void
}

export function TagEditor({ item, onClose }: TagEditorProps) {
  const router = useRouter()
  const [fields, setFields] = useState<EditableFields>({
    name: item.name,
    type: item.type,
    ethnic_subtype: item.ethnic_subtype,
    color: item.color,
    style: item.style,
    occasion: item.occasion,
    season: item.season,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update<K extends keyof EditableFields>(key: K, value: EditableFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase
      .from('wardrobe_items')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', item.id)

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      router.refresh()
      onClose()
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Name">
        <input
          value={fields.name}
          onChange={(e) => update('name', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Type">
        <select
          value={fields.type}
          onChange={(e) => update('type', e.target.value as WardrobeItem['type'])}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          {['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'ethnic'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Field>

      {fields.type === 'ethnic' && (
        <Field label="Ethnic subtype">
          <select
            value={fields.ethnic_subtype ?? ''}
            onChange={(e) => update('ethnic_subtype', e.target.value as WardrobeItem['ethnic_subtype'])}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select</option>
            {['saree', 'kurti', 'salwar', 'lehenga', 'kurta-set', 'dupatta', 'other'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Primary color">
        <input
          value={fields.color}
          onChange={(e) => update('color', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Style">
        <select
          value={fields.style}
          onChange={(e) => update('style', e.target.value as WardrobeItem['style'])}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          {['casual', 'smart-casual', 'formal', 'ethnic', 'party', 'work', 'athleisure'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <Field label="Occasion">
        <select
          value={fields.occasion}
          onChange={(e) => update('occasion', e.target.value as WardrobeItem['occasion'])}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          {['casual', 'work', 'formal', 'party', 'ethnic', 'vacation', 'all'].map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </Field>

      <Field label="Season">
        <select
          value={fields.season}
          onChange={(e) => update('season', e.target.value as WardrobeItem['season'])}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          {['all', 'summer', 'winter', 'monsoon'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}
