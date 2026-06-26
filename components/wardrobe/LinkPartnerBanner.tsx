'use client'

import { useState } from 'react'

type State = 'idle' | 'loading' | 'generated'

export function LinkPartnerBanner() {
  const [state, setState] = useState<State>('idle')
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setState('loading')
    const res = await fetch('/api/partner/invite', { method: 'POST' })
    const data = await res.json()
    if (data.code) {
      setLink(`${window.location.origin}/invite/${data.code}`)
      setState('generated')
    } else {
      setState('idle')
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (state === 'idle') {
    return (
      <button
        onClick={handleGenerate}
        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100 group"
      >
        <span className="text-sm text-indigo-700 font-medium">Link with partner</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    )
  }

  if (state === 'loading') {
    return (
      <div className="px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100">
        <p className="text-sm text-indigo-400">Generating link…</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
      <p className="text-xs font-medium text-indigo-600">Share this link with your partner:</p>
      <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
        <p className="text-xs font-mono text-gray-600 flex-1 truncate min-w-0">{link}</p>
        <button
          onClick={handleCopy}
          className="text-xs font-medium text-indigo-700 hover:text-indigo-800 flex-shrink-0 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
