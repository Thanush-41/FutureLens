'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Eye, TrendingUp, Compass, Shield, Lightbulb, Check, X, AlertTriangle, Sparkles, ChevronRight, Calendar, BarChart3, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

const advisorMeta = {
  financial_advisor: { icon: TrendingUp, name: 'Financial Advisor', color: 'emerald', tagline: 'Money. Income. Wealth.' },
  life_coach: { icon: Compass, name: 'Life Coach', color: 'blue', tagline: 'Meaning. Fulfillment. Growth.' },
  risk_analyst: { icon: Shield, name: 'Risk Analyst', color: 'amber', tagline: 'Threats. Volatility. Downside.' },
  visionary: { icon: Lightbulb, name: 'Visionary', color: 'violet', tagline: 'Possibilities. Bold bets.' },
}

const decisionColors = {
  proceed: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  adjust: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' },
  do_not_proceed: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-400' },
  uncertain: { bg: 'bg-white/5', border: 'border-white/15', text: 'text-white/60', dot: 'bg-white/40' },
}

const likelihoodMeta = {
  high: { label: 'High likelihood', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  medium: { label: 'Medium likelihood', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  low: { label: 'Low likelihood', color: 'text-white/50', bg: 'bg-white/5', border: 'border-white/15' },
}

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const [data, setData] = useState(null)
  const [activeAdvisor, setActiveAdvisor] = useState(null)
  const [activeScenario, setActiveScenario] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const id = params.id
    if (!id) return
    // Try sessionStorage first
    const cached = sessionStorage.getItem('futurelens_result_' + id)
    if (cached) {
      try {
        setData(JSON.parse(cached))
        setLoading(false)
        return
      } catch {}
    }
    // Fetch from API
    fetch('/api/simulate/' + id)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40 text-sm font-mono">Loading simulation...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error || 'Simulation not found'}</div>
          <Button onClick={() => router.push('/decide')} className="bg-white text-black">Start a new simulation</Button>
        </div>
      </div>
    )
  }

  const finalDecision = data.overall_recommendation?.final_decision || 'uncertain'
  const dColors = decisionColors[finalDecision] || decisionColors.uncertain
  const scenario = data.scenarios?.[activeScenario]

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
      <div className="fixed inset-0 bg-radial-fade pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-50 px-6 h-16 flex items-center justify-between max-w-7xl mx-auto border-b border-white/5">
        <button onClick={() => router.push('/')} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Eye className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold tracking-tight">FutureLens</span>
        </button>
        <Button onClick={() => router.push('/decide')} variant="ghost" className="text-sm h-9 rounded-full border border-white/10 hover:bg-white/5">
          New simulation
        </Button>
      </nav>

      <main className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="animate-fade-up">
          <div className="text-xs uppercase tracking-widest text-violet-400 mb-3 font-mono flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            <span>Simulation complete</span>
            <span className="text-white/30">·</span>
            <span className="text-white/40">{data.decision?.horizon_years || 5}-year horizon</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gradient leading-tight max-w-3xl">
            {data.decision?.text}
          </h1>
        </div>

        {/* Final Verdict */}
        <div className={`mt-10 rounded-2xl border ${dColors.border} ${dColors.bg} p-6 md:p-8 animate-fade-up delay-100 relative overflow-hidden`}>
          <div className="absolute inset-0 glow-purple opacity-30" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${dColors.dot} animate-pulse`} />
                <div className={`text-xs font-mono uppercase tracking-widest ${dColors.text}`}>Final verdict</div>
              </div>
              <div className={`px-4 py-1.5 rounded-full ${dColors.bg} border ${dColors.border} text-sm font-mono uppercase tracking-wider ${dColors.text}`}>
                {finalDecision.replace(/_/g, ' ')}
              </div>
            </div>
            <h2 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight text-gradient leading-tight">
              {data.overall_recommendation?.headline || data.overall_recommendation?.rationale?.slice(0, 100)}
            </h2>
            <p className="mt-4 text-white/65 leading-relaxed max-w-3xl">
              {data.overall_recommendation?.rationale}
            </p>

            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-emerald-400 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Check className="w-3 h-3" /> Top reasons in favor
                </div>
                <ul className="space-y-1.5">
                  {data.overall_recommendation?.top_pros?.map((p, i) => (
                    <li key={i} className="text-sm text-white/75 flex gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs text-red-400 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" /> Top reasons against
                </div>
                <ul className="space-y-1.5">
                  {data.overall_recommendation?.top_cons?.map((c, i) => (
                    <li key={i} className="text-sm text-white/75 flex gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Scenarios */}
        <div className="mt-14 animate-fade-up delay-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-violet-400 mb-1 font-mono flex items-center gap-2">
                <BarChart3 className="w-3 h-3" /> Future scenarios
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">{data.scenarios?.length || 5} ways this could unfold</h2>
            </div>
          </div>

          {/* Scenario tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {data.scenarios?.map((s, i) => {
              const lm = likelihoodMeta[s.likelihood] || likelihoodMeta.medium
              return (
                <button
                  key={i}
                  onClick={() => setActiveScenario(i)}
                  className={`px-4 py-2 rounded-full text-xs font-medium border transition ${activeScenario === i ? 'bg-white text-black border-white' : `${lm.bg} ${lm.border} ${lm.color} hover:bg-white/[0.06]`}`}
                >
                  Scenario {i + 1} · {s.likelihood}
                </button>
              )
            })}
          </div>

          {scenario && (
            <div className="gradient-border rounded-2xl p-7">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-white/40 font-mono mb-2">
                    <Calendar className="w-3 h-3" /> Year {scenario.year} · {likelihoodMeta[scenario.likelihood]?.label}
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight text-gradient">{scenario.title}</h3>
                </div>
              </div>
              <p className="text-white/70 leading-relaxed">{scenario.description}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {scenario.key_drivers?.map((d, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 font-mono">{d}</span>
                ))}
              </div>

              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="text-xs text-emerald-400 font-mono uppercase tracking-wider mb-2">Upside</div>
                  <p className="text-sm text-white/80">{scenario.upside}</p>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="text-xs text-red-400 font-mono uppercase tracking-wider mb-2">Downside</div>
                  <p className="text-sm text-white/80">{scenario.downside}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Advisor Board */}
        <div className="mt-14 animate-fade-up delay-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-violet-400 mb-1 font-mono flex items-center gap-2">
                <Target className="w-3 h-3" /> AI Board of Advisors
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">What the board thinks</h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {data.advisors?.map((a, i) => {
              const meta = advisorMeta[a.role] || advisorMeta.financial_advisor
              const Icon = meta.icon
              const isOpen = activeAdvisor === i
              return (
                <div key={i} className="gradient-border rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-${meta.color}-500/10 border border-${meta.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 text-${meta.color}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium">{meta.name}</h3>
                        <div className="text-xs font-mono text-white/40">{Math.round((a.confidence || 0) * 100)}%</div>
                      </div>
                      <p className="text-xs text-white/40 font-mono mb-3">{meta.tagline}</p>
                      <p className="text-sm text-white/70 leading-relaxed">{a.summary}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider mb-1.5">Pros</div>
                      <ul className="space-y-1">
                        {a.pros?.slice(0, 3).map((p, j) => (
                          <li key={j} className="text-xs text-white/65 flex gap-1.5">
                            <Check className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[10px] text-red-400 font-mono uppercase tracking-wider mb-1.5">Cons</div>
                      <ul className="space-y-1">
                        {a.cons?.slice(0, 3).map((c, j) => (
                          <li key={j} className="text-xs text-white/65 flex gap-1.5">
                            <X className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="text-xs text-white/40 font-mono">VERDICT</div>
                    <div className={`text-xs font-mono px-2.5 py-1 rounded-full bg-${meta.color}-500/10 border border-${meta.color}-500/20 text-${meta.color}-400 uppercase tracking-wider`}>
                      {a.recommendation?.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 gradient-border rounded-2xl p-8 text-center animate-fade-up delay-400 relative overflow-hidden">
          <div className="absolute inset-0 glow-purple opacity-40" />
          <div className="relative">
            <h3 className="text-2xl font-semibold tracking-tight text-gradient mb-3">Have another decision in mind?</h3>
            <p className="text-white/55 mb-6 max-w-md mx-auto text-sm">Run as many simulations as you need. Every decision deserves a board.</p>
            <Button onClick={() => router.push('/decide')} className="h-11 px-6 rounded-full bg-white text-black hover:bg-white/90">
              Simulate another <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
