'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AcceptButton({ code }: { code: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAccept() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/partner/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to accept invite')
      setLoading(false)
      return
    }

    router.push('/wardrobe')
    router.refresh()
  }

  return (
    <div>
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full bg-indigo-700 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-800 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Linking wardrobes…' : 'Accept & link wardrobes'}
      </button>
      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
    </div>
  )
}
