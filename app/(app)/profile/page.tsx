'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ProfileData = {
  name: string
  email: string
  initial: string
}

type PartnerState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'pending'; code: string }
  | { status: 'accepted'; partnerName: string }

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [partner, setPartner] = useState<PartnerState>({ status: 'loading' })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [unlinkLoading, setUnlinkLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      const name = data?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'You'
      setProfile({ name, email: user.email ?? '', initial: name.charAt(0).toUpperCase() })

      const res = await fetch('/api/partner')
      const json = await res.json()

      if (!json.link) {
        setPartner({ status: 'none' })
      } else if (json.link.status === 'accepted') {
        setPartner({ status: 'accepted', partnerName: json.partnerName })
      } else {
        setPartner({ status: 'pending', code: json.link.invite_code })
      }
    }
    load()
  }, [])

  async function handleGenerateInvite() {
    setInviteLoading(true)
    const res = await fetch('/api/partner/invite', { method: 'POST' })
    const data = await res.json()
    setInviteLoading(false)
    if (data.code) setPartner({ status: 'pending', code: data.code })
  }

  async function handleUnlink() {
    setUnlinkLoading(true)
    await fetch('/api/partner', { method: 'DELETE' })
    setUnlinkLoading(false)
    setPartner({ status: 'none' })
    router.refresh()
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(`${origin}/invite/${code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="px-4 pt-12 pb-8">
      <h1 className="text-xl font-semibold mb-6">Profile</h1>

      <div className="bg-white rounded-2xl p-5 flex items-center gap-4 mb-3">
        <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-semibold text-indigo-700">{profile?.initial ?? '…'}</span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{profile?.name ?? ''}</p>
          <p className="text-sm text-gray-400 truncate">{profile?.email ?? ''}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 mb-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Partner</p>

        {partner.status === 'loading' && (
          <p className="text-sm text-gray-400">Loading…</p>
        )}

        {partner.status === 'none' && (
          <button
            onClick={handleGenerateInvite}
            disabled={inviteLoading}
            className="w-full text-sm font-medium text-indigo-700 bg-indigo-50 rounded-xl py-3 hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {inviteLoading ? 'Generating link…' : 'Link with partner'}
          </button>
        )}

        {partner.status === 'pending' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Share this link with your partner:</p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
              <p className="text-xs text-gray-600 font-mono flex-1 truncate min-w-0">
                {origin}/invite/{partner.code}
              </p>
              <button
                onClick={() => handleCopy(partner.code)}
                className="text-xs font-medium text-indigo-700 hover:text-indigo-800 flex-shrink-0 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={handleUnlink}
              disabled={unlinkLoading}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Cancel invite
            </button>
          </div>
        )}

        {partner.status === 'accepted' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-indigo-700">
                  {partner.partnerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{partner.partnerName}</p>
                <p className="text-xs text-gray-400">Linked</p>
              </div>
            </div>
            <button
              onClick={handleUnlink}
              disabled={unlinkLoading}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              {unlinkLoading ? 'Unlinking…' : 'Unlink'}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleSignOut}
        className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-3 text-sm text-gray-500 hover:text-red-600 transition-colors text-left"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sign out
      </button>
    </div>
  )
}
