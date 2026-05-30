'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Eye, Sparkles, Calendar, TrendingUp, Loader2, Plus, History as HistoryIcon, Share2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

const pathStyle = {
  conservative: { label: 'Conservative', color: 'blue' },
  balanced:     { label: 'Balanced',     color: 'violet' },
  aggressive:   { label: 'Aggressive',   color: 'amber' },
}

function timeAgo(iso) {
  try {
    const d = new Date(iso)
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return iso }
}

export default function HistoryPage() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    fetch('/api/simulations?limit=50')
      .then(r => r.json())
      .then(j => {
        if (j.error) throw new Error(j.error)
        setItems(j.items || [])
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const copyShare = async (id) => {
    const url = `${window.location.origin}/r/${id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1800)
    } catch {}
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="fixed inset-0 bg-radial-fade pointer-events-none" />
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] glow-purple pointer-events-none" />

      <nav className="relative z-50 px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/')} className="h-9 px-3 rounded-full border border-white/10 hover:bg-white/5 text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
          </Button>
          <button onClick={() => router.push('/')} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Eye className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold tracking-tight hidden sm:inline">FutureLens</span>
          </button>
        </div>
        <Button onClick={() => router.push('/decide')} className="h-9 px-4 rounded-full bg-white text-black hover:bg-white/90 text-xs font-medium">
          <Plus className="w-3.5 h-3.5 mr-1" /> New simulation
        </Button>
      </nav>

      <main className="relative max-w-5xl mx-auto px-6 pt-12 pb-32">
        <div className="animate-fade-up">
          <div className="text-xs uppercase tracking-widest text-violet-400 mb-3 font-mono flex items-center gap-2">
            <HistoryIcon className="w-3 h-3" /> Your decision archive
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gradient leading-tight">
            Every decision,<br />remembered.
          </h1>
          <p className="mt-4 text-white/55 max-w-lg">
            All your past simulations are saved. Revisit them anytime, or share a public link with anyone.
          </p>
        </div>

        {loading && (
          <div className="mt-16 flex items-center justify-center gap-3 text-white/40 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading your archive...</span>
          </div>
        )}

        {error && (
          <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">{error}</div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="mt-16 gradient-border rounded-2xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mx-auto mb-5">
              <HistoryIcon className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No simulations yet</h3>
            <p className="text-sm text-white/55 mb-6 max-w-md mx-auto">Run your first decision simulation — it&apos;ll appear here forever.</p>
            <Button onClick={() => router.push('/decide')} className="h-10 px-5 rounded-full bg-white text-black hover:bg-white/90 text-sm font-medium">
              Start your first simulation <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="mt-12 space-y-3">
            {items.map((sim, idx) => {
              const path = sim?.consensus?.recommendation?.recommended_path
              const conf = sim?.consensus?.recommendation?.confidence
              const headline = sim?.consensus?.recommendation?.headline
              const ps = pathStyle[path]
              const profile = sim.profile_snapshot || {}
              return (
                <div key={sim.id} className="gradient-border rounded-2xl p-5 md:p-6 group transition-all hover:bg-white/[0.02] animate-fade-up" style={{ animationDelay: `${Math.min(idx * 50, 400)}ms` }}>
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{timeAgo(sim.createdAt)}</span>
                      {profile.age && <><span className="text-white/20">·</span><span>{profile.age}y</span></>}
                      {profile.location && <><span className="text-white/20">·</span><span>{profile.location}</span></>}
                    </div>
                    {ps && (
                      <div className={`px-2.5 py-1 rounded-full bg-${ps.color}-500/10 border border-${ps.color}-500/30 text-${ps.color}-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-${ps.color}-400`} />
                        {ps.label} · {conf}%
                      </div>
                    )}
                  </div>

                  <button onClick={() => router.push(`/results/${sim.id}`)} className="block text-left w-full">
                    <h3 className="text-lg md:text-xl font-semibold tracking-tight text-gradient leading-snug group-hover:translate-x-0.5 transition">
                      {sim.decision}
                    </h3>
                    {headline && (
                      <p className="text-sm text-white/55 mt-2 leading-relaxed">{headline}</p>
                    )}
                  </button>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                    <button onClick={() => copyShare(sim.id)}
                      className="text-xs text-white/55 hover:text-white flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition">
                      {copiedId === sim.id ? <><span className="text-emerald-400">✓</span> Copied!</> : <><Share2 className="w-3 h-3" /> Copy share link</>}
                    </button>
                    <Button onClick={() => router.push(`/results/${sim.id}`)} variant="ghost" className="text-xs h-8 px-3 rounded-full hover:bg-white/5">
                      Open dossier <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
