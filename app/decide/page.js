'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, ArrowLeft, Eye, Sparkles, Loader2, TrendingUp, Compass, Shield, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'

const presets = [
  { icon: '💼', label: 'Career', text: 'Should I accept the senior product manager role at the early-stage startup, leaving my stable role at a Fortune 500?' },
  { icon: '🎓', label: 'Education', text: 'Should I pursue a Master\'s in Computer Science full-time, or keep working and learn on the job?' },
  { icon: '🌍', label: 'Relocation', text: 'Should I move from New York to Lisbon for a better quality of life, even though my career network is in NYC?' },
  { icon: '🚀', label: 'Startup', text: 'Should I leave my corporate job and start my own fintech company with two co-founders?' },
  { icon: '🏠', label: 'Housing', text: 'Should I buy my first home at current interest rates, or continue renting and invest the difference?' },
  { icon: '💰', label: 'Finance', text: 'Should I cash out my company stock options now, or hold them for the long term?' },
]

function DecideContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [decision, setDecision] = useState(initialQ)
  const [horizon, setHorizon] = useState([5])
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stage, setStage] = useState(0)

  const stages = [
    'Imagining 5 plausible futures...',
    'Consulting the Financial Advisor...',
    'Consulting the Life Coach...',
    'Consulting the Risk Analyst...',
    'Consulting the Visionary...',
    'Synthesizing the final recommendation...',
  ]

  useEffect(() => {
    if (!loading) return
    const t = setInterval(() => setStage(s => (s + 1) % stages.length), 1800)
    return () => clearInterval(t)
  }, [loading])

  const charCount = decision.length
  const canSubmit = charCount >= 20 && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    setStage(0)
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, context, horizonYears: horizon[0] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Simulation failed')
      // Save to sessionStorage and route
      sessionStorage.setItem('futurelens_result_' + data.id, JSON.stringify(data))
      router.push('/results/' + data.id)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
      <div className="fixed inset-0 bg-radial-fade pointer-events-none" />
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] glow-purple pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-50 px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <button onClick={() => router.push('/')} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Eye className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold tracking-tight">FutureLens</span>
        </button>
        <button onClick={() => router.push('/')} className="text-sm text-white/50 hover:text-white flex items-center gap-1.5 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </button>
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
                Be specific. The more context you give, the sharper the simulation.
              </p>
            </div>

            {/* Presets */}
            <div className="mt-10 animate-fade-up delay-100">
              <div className="text-xs uppercase tracking-widest text-white/30 mb-3 font-mono">Or start from a template</div>
              <div className="flex flex-wrap gap-2">
                {presets.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setDecision(p.text)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 text-xs text-white/70 transition"
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Decision */}
            <div className="mt-10 animate-fade-up delay-200">
              <label className="block text-sm font-medium mb-3">Your decision</label>
              <div className="gradient-border rounded-2xl p-1">
                <Textarea
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  placeholder="e.g. Should I accept the senior PM role at the AI startup, leaving my Fortune 500 role of 6 years?"
                  rows={5}
                  className="resize-none bg-transparent border-0 text-base leading-relaxed focus-visible:ring-0 placeholder:text-white/25 p-5"
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-white/40 font-mono">
                <span>{charCount < 20 ? `${20 - charCount} more characters needed` : 'Ready to simulate'}</span>
                <span>{charCount} chars</span>
              </div>
            </div>

            {/* Context */}
            <div className="mt-8 animate-fade-up delay-300">
              <label className="block text-sm font-medium mb-3">Optional context</label>
              <div className="gradient-border rounded-2xl p-1">
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Your age, income, family, goals, constraints, what success looks like..."
                  rows={3}
                  className="resize-none bg-transparent border-0 text-sm leading-relaxed focus-visible:ring-0 placeholder:text-white/25 p-5"
                />
              </div>
            </div>

            {/* Horizon */}
            <div className="mt-8 animate-fade-up delay-400">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium">Time horizon</label>
                <span className="text-sm font-mono text-violet-400">{horizon[0]} years</span>
              </div>
              <div className="px-1">
                <Slider
                  value={horizon}
                  onValueChange={setHorizon}
                  min={1}
                  max={15}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-white/30 font-mono">
                <span>1y</span><span>5y</span><span>10y</span><span>15y</span>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="mt-10 animate-fade-up delay-500">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full h-14 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed text-base font-medium"
              >
                Run simulation
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <p className="text-xs text-center text-white/30 mt-4 font-mono">Takes ~20-40 seconds · Gemini 3.5 Flash · 4 AI advisors</p>
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
  const advisors = [
    { icon: TrendingUp, name: 'Financial', color: 'emerald' },
    { icon: Compass, name: 'Life Coach', color: 'blue' },
    { icon: Shield, name: 'Risk', color: 'amber' },
    { icon: Lightbulb, name: 'Visionary', color: 'violet' },
  ]
  return (
    <div className="pt-12 animate-fade-up">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 mb-6 relative">
          <Loader2 className="w-7 h-7 text-violet-300 animate-spin" />
          <div className="absolute inset-0 rounded-2xl glow-purple" />
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-gradient">Simulating your future...</h2>
        <p className="mt-3 text-white/55 max-w-md mx-auto text-sm">{decision.slice(0, 120)}{decision.length > 120 ? '…' : ''}</p>
      </div>

      <div className="mt-12 gradient-border rounded-2xl p-6">
        <div className="space-y-3">
          {stages.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm transition-all ${i <= stage ? 'text-white' : 'text-white/25'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${i < stage ? 'bg-emerald-400' : i === stage ? 'bg-violet-400 animate-pulse' : 'bg-white/15'}`} />
              <span className="font-mono text-xs">{s}</span>
              {i === stage && <Loader2 className="w-3 h-3 animate-spin ml-auto text-violet-400" />}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2">
        {advisors.map((a, i) => (
          <div key={i} className={`gradient-border rounded-xl p-4 text-center transition-all ${stage >= i + 1 ? 'opacity-100' : 'opacity-30'}`}>
            <a.icon className={`w-4 h-4 mx-auto mb-2 text-${a.color}-400`} />
            <div className="text-xs text-white/70">{a.name}</div>
          </div>
        ))}
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
