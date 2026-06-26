'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { resizeImageFile } from '@/lib/image-utils'

type UploadState = 'idle' | 'uploading' | 'error'

export function UploadZone() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState('')

  async function uploadFile(file: File): Promise<void> {
    const resized = await resizeImageFile(file)
    const form = new FormData()
    form.append('image', resized)

    const res = await fetch('/api/wardrobe/upload', { method: 'POST', body: form })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Upload failed')
    }
  }

  async function handleFiles(files: File[]) {
    const images = files.filter(
      (f) =>
        f.type.startsWith('image/') ||
        f.name.toLowerCase().endsWith('.heic') ||
        f.name.toLowerCase().endsWith('.heif')
    )
    if (images.length === 0) return

    setError('')
    setState('uploading')
    setProgress({ done: 0, total: images.length })

    let failed = 0
    for (const file of images) {
      try {
        await uploadFile(file)
        setProgress((p) => ({ ...p, done: p.done + 1 }))
      } catch {
        failed++
      }
    }

    router.refresh()
    setState('idle')
    setProgress({ done: 0, total: 0 })

    if (failed > 0) {
      setError(`${failed} photo${failed > 1 ? 's' : ''} failed to upload`)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) handleFiles(files)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length) handleFiles(files)
  }

  const busy = state === 'uploading'

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <button
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        disabled={busy}
        className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center gap-3 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors disabled:opacity-60"
        aria-label="Upload clothing photos"
      >
        {busy ? (
          <>
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-700 rounded-full animate-spin" />
            <span className="text-sm">
              {progress.total > 1
                ? `Uploading ${progress.done + 1} of ${progress.total}…`
                : 'Uploading…'}
            </span>
          </>
        ) : (
          <>
            <CameraIcon />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Add clothing items</p>
              <p className="text-xs mt-0.5">Tap to pick photos — select multiple at once</p>
            </div>
          </>
        )}
      </button>

      {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
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
