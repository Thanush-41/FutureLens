'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, ArrowLeft, Eye, Sparkles, Loader2, Users, Workflow, BarChart3, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const presets = [
  { icon: '💼', label: 'Career', text: 'Should I accept the senior product manager role at the early-stage startup, leaving my stable role at a Fortune 500?' },
  { icon: '🎓', label: 'Education', text: 'Should I pursue a Master\'s in Computer Science full-time, or keep working and learn on the job?' },
  { icon: '🌍', label: 'Relocation', text: 'Should I move to Bangalore for a senior PM role, or stay in my current city?' },
  { icon: '🚀', label: 'Startup', text: 'Should I leave my corporate job and start my own fintech company with two co-founders?' },
  { icon: '🏠', label: 'Housing', text: 'Should I buy my first home at current interest rates, or continue renting and invest the difference?' },
  { icon: '💰', label: 'Finance', text: 'Should I cash out my company stock options now, or hold them for the long term?' },
]

function DecideContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [decision, setDecision] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stage, setStage] = useState(0)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const p = sessionStorage.getItem('futurelens_profile')
    if (!p) {
      router.push('/onboarding')
      return
    }
    try { setProfile(JSON.parse(p)) } catch { router.push('/onboarding') }

    const pending = sessionStorage.getItem('futurelens_pending_question')
    if (pending) {
      setDecision(pending)
      sessionStorage.removeItem('futurelens_pending_question')
    } else if (searchParams.get('q')) {
      setDecision(searchParams.get('q'))
    }
  }, [])

  const stages = [
    { agent: 'Context Agent', text: 'Loading your profile...', icon: Users, color: 'blue' },
    { agent: 'Scenario Agent', text: 'Imagining Conservative, Balanced & Aggressive paths...', icon: Workflow, color: 'violet' },
    { agent: 'Financial Agent', text: 'Projecting income, savings & net worth...', icon: BarChart3, color: 'emerald' },
    { agent: 'Career Agent', text: 'Evaluating career growth & employability...', icon: Workflow, color: 'blue' },
    { agent: 'Lifestyle Agent', text: 'Analyzing work-life, stress & happiness...', icon: Sparkles, color: 'amber' },
    { agent: 'Board of Directors', text: 'Convening Musk, Buffett, Jobs, Naval, Huberman & Mukund...', icon: Sparkles, color: 'violet' },
    { agent: 'Consensus Agent', text: 'Synthesizing executive recommendation & dissent analysis...', icon: Sparkles, color: 'violet' },
    { agent: 'FutureLens', text: 'Finalizing your decision dossier...', icon: Sparkles, color: 'violet' },
  ]

  useEffect(() => {
    if (!loading) return
    const t = setInterval(() => setStage(s => Math.min(s + 1, stages.length - 1)), 8500)
    return () => clearInterval(t)
  }, [loading])

  const charCount = decision.length
  const canSubmit = charCount >= 15 && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    setStage(0)
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, profile }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Simulation failed')
      sessionStorage.setItem('futurelens_result_' + data.id, JSON.stringify(data))
      router.push('/results/' + data.id)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  if (!profile) return null

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
      <div className="fixed inset-0 bg-radial-fade pointer-events-none" />
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] glow-purple pointer-events-none" />

      <nav className="relative z-50 px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <button onClick={() => router.push('/')} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Eye className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold tracking-tight">FutureLens</span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/onboarding')} className="text-xs text-white/50 hover:text-white flex items-center gap-1.5 transition px-3 py-1.5 rounded-full border border-white/10">
            <User className="w-3 h-3" /> {profile.age}y · {profile.location}
          </button>
        </div>
      </nav>

      <main className="relative max-w-3xl mx-auto px-6 pt-12 pb-32">
        {!loading ? (
          <>
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/70 mb-6">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>New simulation</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gradient leading-tight">
                What decision<br />are you weighing?
              </h1>
              <p className="mt-4 text-white/55 max-w-lg">
                Be specific. The agents will generate 3 distinct futures — Conservative, Balanced, Aggressive — and project the financial impact of each.
              </p>
            </div>

            <div className="mt-10 animate-fade-up delay-100">
              <div className="text-xs uppercase tracking-widest text-white/30 mb-3 font-mono">Or start from a template</div>
              <div className="flex flex-wrap gap-2">
                {presets.map((p, i) => (
                  <button key={i} onClick={() => setDecision(p.text)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 text-xs text-white/70 transition">
                    <span>{p.icon}</span><span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 animate-fade-up delay-200">
              <label className="block text-sm font-medium mb-3">Your decision</label>
              <div className="gradient-border rounded-2xl p-1">
                <Textarea value={decision} onChange={(e) => setDecision(e.target.value)}
                  placeholder="e.g. Should I move to Bangalore for the senior PM role at the AI startup?" rows={5}
                  className="resize-none bg-transparent border-0 text-base leading-relaxed focus-visible:ring-0 placeholder:text-white/25 p-5" />
              </div>
              <div className="flex justify-between mt-2 text-xs text-white/40 font-mono">
                <span>{charCount < 15 ? `${15 - charCount} more characters needed` : 'Ready to simulate'}</span>
                <span>{charCount} chars</span>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">{error}</div>
            )}

            <div className="mt-10 animate-fade-up delay-300">
              <Button onClick={handleSubmit} disabled={!canSubmit}
                className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed text-base font-medium">
                Run simulation <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <p className="text-xs text-center text-white/30 mt-4 font-mono">3 agents · ~60 seconds · Gemini Flash</p>
            </div>
          </>
        ) : (
          <LoadingView stage={stage} stages={stages} decision={decision} />
        )}
      </main>
    </div>
  )
}

function LoadingView({ stage, stages, decision }) {
  return (
    <div className="pt-12 animate-fade-up">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 mb-6 relative">
          <Loader2 className="w-7 h-7 text-violet-300 animate-spin" />
          <div className="absolute inset-0 rounded-2xl glow-purple" />
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-gradient">Simulating your future...</h2>
        <p className="mt-3 text-white/55 max-w-md mx-auto text-sm">{decision.slice(0, 140)}{decision.length > 140 ? '…' : ''}</p>
      </div>

      <div className="mt-12 gradient-border rounded-2xl p-6">
        <div className="space-y-3">
          {stages.map((s, i) => {
            const Icon = s.icon
            const active = i === stage
            const done = i < stage
            return (
              <div key={i} className={`flex items-center gap-3 text-sm transition-all py-1.5 ${i <= stage ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-500/10 border border-emerald-500/30' : active ? `bg-${s.color}-500/10 border border-${s.color}-500/30` : 'bg-white/5 border border-white/10'}`}>
                  {done ? (
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 8 L7 12 L13 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <Icon className={`w-3.5 h-3.5 text-${s.color}-400 ${active ? 'animate-pulse' : ''}`} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-widest font-mono text-white/40">{s.agent}</div>
                  <div className={`text-sm ${active ? 'text-white' : done ? 'text-white/60' : 'text-white/40'}`}>{s.text}</div>
                </div>
                {active && <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function DecidePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0b]" />}>
      <DecideContent />
    </Suspense>
  )
}
