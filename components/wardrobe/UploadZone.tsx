'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { resizeImageFile } from '@/lib/image-utils'

type UploadState = 'idle' | 'resizing' | 'uploading' | 'tagging' | 'done' | 'error'

export function UploadZone() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setError('')
    setState('resizing')

    try {
      const resized = await resizeImageFile(file)
      setState('uploading')

      const form = new FormData()
      form.append('image', resized)

      const res = await fetch('/api/wardrobe/upload', { method: 'POST', body: form })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Upload failed')
      }

      setState('done')
      router.refresh()
      setState('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const busy = state !== 'idle' && state !== 'error' && state !== 'done'
  const statusMap: Partial<Record<UploadState, string>> = {
    resizing: 'Optimising image…',
    uploading: 'Uploading…',
    tagging: 'AI tagging…',
    done: 'Added!',
  }
  const statusText = statusMap[state]

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />

      <button
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        disabled={busy}
        className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center gap-3 text-gray-400 hover:border-slate-300 hover:text-slate-500 transition-colors disabled:opacity-60"
        aria-label="Upload clothing photo"
      >
        {busy ? (
          <>
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
            <span className="text-sm">{statusText}</span>
          </>
        ) : (
          <>
            <CameraIcon />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Add clothing item</p>
              <p className="text-xs mt-0.5">Tap to take a photo or pick from gallery</p>
            </div>
          </>
        )}
      </button>

      {error && (
        <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
      )}
    </div>
  )
}

function CameraIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
