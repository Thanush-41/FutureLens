'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { Eye, Sparkles, BarChart3, Workflow, TrendingUp, TrendingDown, Calendar, Target, Shield, ChevronRight, AlertTriangle, Check, Loader2, Briefcase, Heart, Activity, Smile, Clock, MapPin, Quote, Users2, Gavel, Brain, X, Plus, Send, FileText, Scale, Swords, ArrowRight, ArrowLeft, Award, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

// Hash a string to pick a gradient for custom advisors
function pickGradient(name) {
  const palettes = [
    { from: 'from-cyan-500',    to: 'to-blue-600',    ring: 'ring-cyan-500/40',    text: 'text-cyan-300',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' },
    { from: 'from-rose-500',    to: 'to-pink-600',    ring: 'ring-rose-500/40',    text: 'text-rose-300',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
    { from: 'from-orange-500',  to: 'to-red-600',     ring: 'ring-orange-500/40',  text: 'text-orange-300',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
    { from: 'from-lime-500',    to: 'to-green-600',   ring: 'ring-lime-500/40',    text: 'text-lime-300',    bg: 'bg-lime-500/10',    border: 'border-lime-500/20' },
    { from: 'from-fuchsia-500', to: 'to-purple-600',  ring: 'ring-fuchsia-500/40', text: 'text-fuchsia-300', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20' },
    { from: 'from-teal-500',    to: 'to-emerald-600', ring: 'ring-teal-500/40',    text: 'text-teal-300',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20' },
    { from: 'from-indigo-500',  to: 'to-violet-600',  ring: 'ring-indigo-500/40',  text: 'text-indigo-300',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20' },
    { from: 'from-yellow-500',  to: 'to-amber-600',   ring: 'ring-yellow-500/40',  text: 'text-yellow-300',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
  ]
  let h = 0
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return palettes[Math.abs(h) % palettes.length]
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const advisorMeta = {
  elon:     { name: 'Elon Musk',        role: 'Visionary Innovator',     initials: 'EM', from: 'from-violet-500',  to: 'to-fuchsia-600',  ring: 'ring-violet-500/40',  text: 'text-violet-300',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20'  },
  buffett:  { name: 'Warren Buffett',   role: 'Value Investor',          initials: 'WB', from: 'from-emerald-500', to: 'to-teal-600',     ring: 'ring-emerald-500/40', text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  jobs:     { name: 'Steve Jobs',       role: 'Product Visionary',       initials: 'SJ', from: 'from-zinc-300',    to: 'to-zinc-500',     ring: 'ring-zinc-300/40',    text: 'text-zinc-200',    bg: 'bg-zinc-500/10',    border: 'border-zinc-400/20'    },
  naval:    { name: 'Naval Ravikant',   role: 'Leverage & Freedom',      initials: 'NR', from: 'from-blue-500',    to: 'to-indigo-600',   ring: 'ring-blue-500/40',    text: 'text-blue-300',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
  huberman: { name: 'Andrew Huberman',  role: 'Human Performance',       initials: 'AH', from: 'from-pink-500',    to: 'to-rose-600',     ring: 'ring-pink-500/40',    text: 'text-pink-300',    bg: 'bg-pink-500/10',    border: 'border-pink-500/20'    },
  mukund:   { name: 'Mukund Jha',       role: 'Product & Growth',        initials: 'MJ', from: 'from-amber-500',   to: 'to-orange-600',   ring: 'ring-amber-500/40',   text: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
}

const pathStyle = {
  conservative: { label: 'Conservative', color: 'blue',  accent: 'from-blue-500/20 to-blue-500/0' },
  balanced:     { label: 'Balanced',     color: 'violet',accent: 'from-violet-500/20 to-violet-500/0' },
  aggressive:   { label: 'Aggressive',   color: 'amber', accent: 'from-amber-500/20 to-amber-500/0' },
}

function formatMoney(n, ccy = 'USD') {
  if (n == null || isNaN(n)) return '—'
  if (Math.abs(n) >= 1e7) return `${ccy} ${(n / 1e7).toFixed(1)}Cr`
  if (Math.abs(n) >= 1e5) return `${ccy} ${(n / 1e5).toFixed(1)}L`
  if (Math.abs(n) >= 1e3) return `${ccy} ${(n / 1e3).toFixed(0)}K`
  return `${ccy} ${n}`
}

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const isShareRoute = (pathname || '').startsWith('/r/')
  const [data, setData] = useState(null)
  const [activePath, setActivePath] = useState('balanced')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const id = params.id
    if (!id) return
    const cached = sessionStorage.getItem('futurelens_result_' + id)
    if (cached) {
      try {
        setData(JSON.parse(cached))
        setLoading(false)
        return
      } catch {}
    }
    fetch('/api/simulate/' + id).then(r => r.json()).then(d => {
      if (d.error) throw new Error(d.error)
      setData(d); setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false) })
  }, [params.id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <div className="text-red-400 mb-4">{error || 'Simulation not found'}</div>
        <Button onClick={() => router.push('/decide')} className="bg-white text-black">Start a new simulation</Button>
      </div>
    </div>
  )

  const profile = data.profile_snapshot || {}
  const ccy = profile.currency || 'USD'
  const paths = data.scenarios?.paths || []
  const financialPaths = data.financial?.paths || []

  const findFin = (type) => financialPaths.find(f => f.path_type === type)

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="fixed inset-0 bg-radial-fade pointer-events-none" />

      <nav className="relative z-50 px-6 h-16 flex items-center justify-between max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push(isShareRoute ? '/' : '/decide')} className="h-9 px-3 rounded-full border border-white/10 hover:bg-white/5 text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
          </Button>
          <button onClick={() => router.push('/')} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Eye className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold tracking-tight hidden sm:inline">FutureLens</span>
          </button>
          {isShareRoute && (
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[10px] font-mono uppercase tracking-widest ml-1">
              <Share2 className="w-2.5 h-2.5" /> Shared dossier
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <BoardButton data={data} />
          {isShareRoute ? (
            <Button onClick={() => router.push('/onboarding')} className="text-sm h-9 px-4 rounded-full bg-white text-black hover:bg-white/90 font-medium">
              Try FutureLens
            </Button>
          ) : (
            <Button onClick={() => router.push('/decide')} variant="ghost" className="text-sm h-9 rounded-full border border-white/10 hover:bg-white/5">
              New simulation
            </Button>
          )}
        </div>
      </nav>

      <main className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="animate-fade-up">
          <div className="text-xs uppercase tracking-widest text-violet-400 mb-3 font-mono flex items-center gap-2 flex-wrap">
            <Sparkles className="w-3 h-3" />
            <span>Simulation complete</span>
            <span className="text-white/30">·</span>
            <span className="text-white/40">5-year horizon</span>
            <span className="text-white/30">·</span>
            <span className="text-white/40">{profile.age}y · {profile.location}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gradient leading-tight max-w-3xl">
            {data.decision}
          </h1>
        </div>

        {/* Paths overview — 3 timeline cards */}
        <section className="mt-12 animate-fade-up delay-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-violet-400 mb-1 font-mono flex items-center gap-2">
                <Workflow className="w-3 h-3" /> Agent 2 · Scenarios
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">3 possible futures</h2>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {paths.map((p) => {
              const ps = pathStyle[p.type] || pathStyle.balanced
              const fin = findFin(p.type)
              const isActive = activePath === p.type
              return (
                <button key={p.type} onClick={() => setActivePath(p.type)}
                  className={`text-left gradient-border rounded-2xl p-6 transition-all relative overflow-hidden ${isActive ? 'ring-2 ring-violet-500/40 shadow-2xl shadow-violet-500/10' : 'hover:bg-white/[0.02]'}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${ps.accent} pointer-events-none opacity-60`} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-mono uppercase tracking-widest text-${ps.color}-400`}>{ps.label} Path</span>
                      <span className="text-[10px] text-white/40 font-mono">{Math.round((p.confidence||0)*100)}% conf</span>
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight leading-snug mb-2">{p.title}</h3>
                    <p className="text-xs text-white/55 leading-relaxed">{p.summary}</p>

                    {fin && (
                      <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[9px] uppercase tracking-widest text-white/40 font-mono mb-0.5">Net worth Y5</div>
                          <div className="text-sm font-semibold">{formatMoney(fin.wealth_accumulation, ccy)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase tracking-widest text-white/40 font-mono mb-0.5">Risk score</div>
                          <div className="text-sm font-semibold">{fin.financial_risk_score}<span className="text-white/30 text-xs">/100</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Executive Summary (Agent 7) - PRIME REAL ESTATE */}
        {data.consensus?.recommendation && (
          <ExecutiveSummary consensus={data.consensus} />
        )}

        {/* Board of Directors CTA card */}
        <BoardCTA data={data} />

        {/* Active path detail */}
        {paths.length > 0 && (() => {
          const p = paths.find(x => x.type === activePath) || paths[0]
          const ps = pathStyle[p.type] || pathStyle.balanced
          const fin = findFin(p.type)
          return (
            <section className="mt-10 animate-fade-up delay-200">
              <div className="gradient-border rounded-2xl p-7 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${ps.accent} pointer-events-none opacity-30`} />
                <div className="relative">
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div>
                      <div className={`text-[10px] font-mono uppercase tracking-widest text-${ps.color}-400`}>{ps.label} Path · Deep dive</div>
                      <h3 className="text-2xl font-semibold tracking-tight text-gradient mt-1">{p.title}</h3>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full bg-${ps.color}-500/10 border border-${ps.color}-500/20 text-${ps.color}-400 text-xs font-mono uppercase tracking-wider`}>
                      {Math.round((p.confidence||0)*100)}% confidence
                    </div>
                  </div>

                  <p className="text-white/70 leading-relaxed">{p.narrative}</p>

                  {/* Timeline */}
                  <div className="mt-7">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-3 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> Timeline
                    </div>
                    <div className="relative pl-6">
                      <div className={`absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-${ps.color}-500/40 via-${ps.color}-500/20 to-transparent`} />
                      <div className="space-y-4">
                        {(p.timeline || []).map((t, i) => (
                          <div key={i} className="relative">
                            <div className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-${ps.color}-500/30 border-2 border-${ps.color}-400`} />
                            <div className="text-xs text-white/40 font-mono">Year {t.year}</div>
                            <div className="text-sm text-white/85 leading-snug">{t.milestone}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-7 grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-2">Key assumptions</div>
                      <ul className="space-y-1.5">
                        {(p.key_assumptions||[]).map((k,i)=>(<li key={i} className="text-xs text-white/65 flex gap-1.5"><span className="text-white/30">·</span>{k}</li>))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono mb-2 flex items-center gap-1"><Check className="w-2.5 h-2.5" /> Benefits</div>
                      <ul className="space-y-1.5">
                        {(p.benefits||[]).map((k,i)=>(<li key={i} className="text-xs text-white/65 flex gap-1.5"><span className="text-emerald-400">+</span>{k}</li>))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-red-400 font-mono mb-2 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> Risks</div>
                      <ul className="space-y-1.5">
                        {(p.risks||[]).map((k,i)=>(<li key={i} className="text-xs text-white/65 flex gap-1.5"><span className="text-red-400">!</span>{k}</li>))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )
        })()}

        {/* Dissent Analysis (from Agent 7) */}
        {data.consensus?.dissent && (
          <DissentAnalysis dissent={data.consensus.dissent} board={data.board} />
        )}

        {/* Financial Dashboard */}
        <section className="mt-14 animate-fade-up delay-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-violet-400 mb-1 font-mono flex items-center gap-2">
                <BarChart3 className="w-3 h-3" /> Agent 3 · Financial Impact
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Money, in 5 years</h2>
            </div>
          </div>

          {/* Scorecards */}
          <div className="grid md:grid-cols-3 gap-4">
            {paths.map(p => {
              const ps = pathStyle[p.type]
              const fin = findFin(p.type)
              if (!fin) return null
              return (
                <div key={p.type} className="gradient-border rounded-2xl p-6 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${ps.accent} pointer-events-none opacity-40`} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-mono uppercase tracking-widest text-${ps.color}-400`}>{ps.label}</span>
                      <span className="text-[10px] font-mono text-white/40">SCORE</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-semibold tracking-tight text-gradient">{fin.financial_score}</span>
                      <span className="text-white/30 text-sm">/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-3">
                      <div className={`h-full bg-${ps.color}-400 rounded-full transition-all`} style={{ width: `${fin.financial_score}%` }} />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-white/40 font-mono mb-0.5">Income Y5</div>
                        <div className="text-white/90 font-medium">{formatMoney(fin.ending_annual_income, ccy)}</div>
                      </div>
                      <div>
                        <div className="text-white/40 font-mono mb-0.5">Growth</div>
                        <div className="text-emerald-400 font-medium flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> +{fin.income_growth_pct}%
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 font-mono mb-0.5">Savings Y5</div>
                        <div className="text-white/90 font-medium">{formatMoney(fin.ending_savings, ccy)}</div>
                      </div>
                      <div>
                        <div className="text-white/40 font-mono mb-0.5">Risk</div>
                        <div className={`font-medium flex items-center gap-1 ${fin.financial_risk_score > 65 ? 'text-red-400' : fin.financial_risk_score > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          <Shield className="w-3 h-3" /> {fin.financial_risk_score}/100
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Year-by-year chart */}
          <div className="mt-6 gradient-border rounded-2xl p-7">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <div>
                <div className="text-xs uppercase tracking-widest text-violet-400 font-mono">Net worth trajectory</div>
                <div className="text-sm text-white/55 mt-1">All 3 paths projected, year by year</div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {['conservative','balanced','aggressive'].map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full bg-${pathStyle[t].color}-400`} />
                    <span className="text-white/60 capitalize">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <NetWorthChart financialPaths={financialPaths} ccy={ccy} />
          </div>

          {/* Per-scenario detail */}
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {financialPaths.map(fin => {
              const ps = pathStyle[fin.path_type]
              return (
                <div key={fin.path_type} className="gradient-border rounded-2xl p-5">
                  <div className={`text-[10px] font-mono uppercase tracking-widest text-${ps.color}-400 mb-3`}>{ps.label}</div>
                  <p className="text-xs text-white/70 leading-relaxed mb-4">{fin.summary}</p>
                  <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono mb-1.5">Opportunities</div>
                  <ul className="space-y-1 mb-4">
                    {fin.opportunities?.slice(0,3).map((o,i)=>(<li key={i} className="text-xs text-white/65 flex gap-1.5"><span className="text-emerald-400 mt-0.5">+</span>{o}</li>))}
                  </ul>
                  <div className="text-[10px] uppercase tracking-widest text-red-400 font-mono mb-1.5">Risks</div>
                  <ul className="space-y-1">
                    {fin.risks?.slice(0,3).map((o,i)=>(<li key={i} className="text-xs text-white/65 flex gap-1.5"><span className="text-red-400 mt-0.5">!</span>{o}</li>))}
                  </ul>
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">Cost of living</div>
                    <div className="text-xs text-white/70">{fin.cost_of_living_impact}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Career Impact (Agent 4) */}
        {data.career?.paths?.length > 0 && (
          <section className="mt-14 animate-fade-up delay-400">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-violet-400 mb-1 font-mono flex items-center gap-2">
                  <Briefcase className="w-3 h-3" /> Agent 4 · Career Impact
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">Career outcomes, side by side</h2>
              </div>
            </div>

            {/* Comparison bars across paths */}
            <div className="gradient-border rounded-2xl p-7">
              <CareerComparison careerPaths={data.career.paths} />
            </div>

            {/* Per-scenario detail */}
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {data.career.paths.map(c => {
                const ps = pathStyle[c.path_type]
                return (
                  <div key={c.path_type} className="gradient-border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-mono uppercase tracking-widest text-${ps.color}-400`}>{ps.label}</span>
                      <span className="text-[10px] font-mono text-white/40">CAREER</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-semibold tracking-tight text-gradient">{c.career_score}</span>
                      <span className="text-white/30 text-sm">/100</span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed mb-4">{c.explanation}</p>
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono mb-1">Skills developed</div>
                        <div className="flex flex-wrap gap-1">
                          {c.skill_development?.map((s,i) => <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/65 text-[10px]">{s}</span>)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-blue-400 font-mono mb-1">Network</div>
                        <ul className="space-y-1">
                          {c.network_opportunities?.map((n,i) => <li key={i} className="text-white/65 flex gap-1.5"><span className="text-blue-400">·</span>{n}</li>)}
                        </ul>
                      </div>
                      <div className="pt-2 border-t border-white/5">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">Industry exposure</div>
                        <div className="text-white/70">{c.industry_exposure}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1">Future employability</div>
                        <div className="text-white/70">{c.future_employability}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Lifestyle Impact (Agent 5) */}
        {data.lifestyle?.paths?.length > 0 && (
          <section className="mt-14 animate-fade-up delay-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-violet-400 mb-1 font-mono flex items-center gap-2">
                  <Heart className="w-3 h-3" /> Agent 5 · Lifestyle Impact
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">How your life will feel</h2>
              </div>
            </div>

            {/* Lifestyle dashboard cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {data.lifestyle.paths.map(l => {
                const ps = pathStyle[l.path_type]
                const dims = [
                  { key: 'work_life_balance', label: 'Work-Life Balance', icon: Activity, invert: false },
                  { key: 'stress_level',      label: 'Stress',             icon: AlertTriangle, invert: true },
                  { key: 'family_impact',     label: 'Family Impact',      icon: Heart, invert: false },
                  { key: 'time_freedom',      label: 'Time Freedom',       icon: Clock, invert: false },
                  { key: 'location_advantage',label: 'Location',           icon: MapPin, invert: false },
                  { key: 'happiness_index',   label: 'Happiness',          icon: Smile, invert: false },
                ]
                return (
                  <div key={l.path_type} className="gradient-border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-mono uppercase tracking-widest text-${ps.color}-400`}>{ps.label}</span>
                      <span className="text-[10px] font-mono text-white/40">LIFESTYLE</span>
                    </div>
                    {/* Big lifestyle score */}
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-semibold tracking-tight text-gradient">{l.lifestyle_score}</span>
                      <span className="text-white/30 text-sm">/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2 mb-5">
                      <div className={`h-full bg-${ps.color}-400 rounded-full`} style={{ width: `${l.lifestyle_score}%` }} />
                    </div>

                    {/* 6 dim bars */}
                    <div className="space-y-2.5 mb-4">
                      {dims.map(d => {
                        const raw = l[d.key] || 0
                        const display = d.invert ? raw : raw
                        const colorBar = d.invert ? (raw > 65 ? 'bg-red-400' : raw > 40 ? 'bg-amber-400' : 'bg-emerald-400')
                                                  : (raw < 40 ? 'bg-red-400' : raw < 65 ? 'bg-amber-400' : 'bg-emerald-400')
                        const Icon = d.icon
                        return (
                          <div key={d.key}>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <div className="flex items-center gap-1.5 text-white/55">
                                <Icon className="w-2.5 h-2.5" />
                                <span>{d.label}{d.invert && <span className="text-white/30"> (lower=better)</span>}</span>
                              </div>
                              <span className="font-mono text-white/70">{display}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full ${colorBar} rounded-full transition-all`} style={{ width: `${raw}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <p className="text-xs text-white/70 leading-relaxed mb-3">{l.explanation}</p>

                    <div className="pt-3 border-t border-white/5">
                      <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono mb-1">Benefits</div>
                      <ul className="space-y-1 mb-3">
                        {l.benefits?.slice(0,3).map((b,i) => <li key={i} className="text-xs text-white/65 flex gap-1.5"><span className="text-emerald-400 mt-0.5">+</span>{b}</li>)}
                      </ul>
                      <div className="text-[10px] uppercase tracking-widest text-red-400 font-mono mb-1">Risk factors</div>
                      <ul className="space-y-1">
                        {l.risk_factors?.slice(0,3).map((b,i) => <li key={i} className="text-xs text-white/65 flex gap-1.5"><span className="text-red-400 mt-0.5">!</span>{b}</li>)}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Future Self Simulator */}
        {data.consensus?.recommendation && <FutureSelfSection data={data} />}

        {/* Final Report card */}
        <FinalReport data={data} router={router} />

        <div className="mt-14 gradient-border rounded-2xl p-8 text-center animate-fade-up delay-400 relative overflow-hidden">
          <div className="absolute inset-0 glow-purple opacity-40" />
          <div className="relative">
            <h3 className="text-2xl font-semibold tracking-tight text-gradient mb-3">Have another decision in mind?</h3>
            <p className="text-white/55 mb-6 max-w-md mx-auto text-sm">Every decision deserves a board. Run as many simulations as you need.</p>
            <Button onClick={() => router.push('/decide')} className="h-11 px-6 rounded-full bg-white text-black hover:bg-white/90">
              Simulate another <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

// =====================================================
// BOARD ROOM (rendered inside a Dialog)
// =====================================================
function BoardButton({ data }) {
  if (!data?.board?.board?.length) return null
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="relative h-9 px-3.5 rounded-full bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-indigo-500/20 border border-violet-500/30 text-violet-200 text-xs font-medium hover:from-violet-500/30 hover:to-indigo-500/30 transition flex items-center gap-1.5 group">
          <Brain className="w-3.5 h-3.5 group-hover:scale-110 transition" />
          <span>Ask the Board</span>
          <span className="hidden sm:inline text-violet-300/60 font-mono">6+</span>
        </button>
      </DialogTrigger>
      <BoardDialogContent data={data} />
    </Dialog>
  )
}

function BoardCTA({ data }) {
  if (!data?.board?.board?.length) return null
  const consensus = data.board.consensus || {}
  return (
    <div className="mt-10 animate-fade-up delay-150">
      <Dialog>
        <DialogTrigger asChild>
          <button className="w-full text-left gradient-border rounded-2xl p-5 md:p-6 group hover:bg-white/[0.02] transition relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 opacity-10 blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-4 md:gap-5">
              {/* Animated brain icon */}
              <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0 group-hover:scale-105 transition">
                <Brain className="w-6 h-6 md:w-7 md:h-7 text-white" strokeWidth={2} />
                <div className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/5 transition" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-violet-400 font-mono mb-1">Personal Board of Directors</div>
                <div className="text-base md:text-lg font-semibold text-gradient leading-tight">Ask Elon, Buffett, Jobs, Naval & more</div>
                <div className="text-xs text-white/55 mt-1 hidden md:block">
                  Six legendary minds debate this decision · {consensus.balanced_votes || 0}·{consensus.aggressive_votes || 0}·{consensus.conservative_votes || 0} split · plus add your own
                </div>
              </div>
              {/* Mini advisor avatars stack */}
              <div className="hidden md:flex items-center -space-x-2 flex-shrink-0">
                {['elon','buffett','jobs','naval','huberman','mukund'].map((id, i) => {
                  const m = advisorMeta[id]
                  return (
                    <div key={id} className={`w-8 h-8 rounded-full bg-gradient-to-br ${m.from} ${m.to} flex items-center justify-center text-white text-[10px] font-semibold border-2 border-[#0a0a0b]`} style={{ zIndex: 6 - i }}>
                      {m.initials}
                    </div>
                  )
                })}
              </div>
              <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition flex-shrink-0" />
            </div>
          </button>
        </DialogTrigger>
        <BoardDialogContent data={data} />
      </Dialog>
    </div>
  )
}

function BoardDialogContent({ data }) {
  const board = data.board
  const [customAdvisors, setCustomAdvisors] = useState([])
  const [askName, setAskName] = useState('')
  const [asking, setAsking] = useState(false)
  const [askError, setAskError] = useState(null)
  const advisors = board.board || []
  const consensus = board.consensus || {}
  const order = ['elon', 'buffett', 'jobs', 'naval', 'huberman', 'mukund']
  const sorted = order.map(id => advisors.find(a => a.advisor_id === id)).filter(Boolean)

  const totalVotes = (consensus.conservative_votes || 0) + (consensus.balanced_votes || 0) + (consensus.aggressive_votes || 0)
  const votePct = (n) => totalVotes ? (n / totalVotes) * 100 : 0

  const askAdvisor = async (name) => {
    const trimmed = (name || askName).trim()
    if (!trimmed || asking) return
    setAsking(true)
    setAskError(null)
    try {
      const res = await fetch('/api/simulate/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          decision: data.decision,
          profile: data.profile_snapshot,
          scenarios: data.scenarios,
          simulation_id: data.id,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Failed')
      setCustomAdvisors(prev => [...prev, { id: 'c-' + Date.now(), ...j }])
      setAskName('')
    } catch (e) {
      setAskError(e.message)
    } finally {
      setAsking(false)
    }
  }

  const suggestions = ['Sam Altman', 'Oprah Winfrey', 'Jeff Bezos', 'Sundar Pichai', 'Ratan Tata', 'MrBeast', 'Sheryl Sandberg']

  return (
    <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto bg-[#0a0a0b] border border-white/10 p-0 rounded-2xl">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#0a0a0b]/90 border-b border-white/5 px-6 md:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Brain className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-violet-400 font-mono">Board Room</div>
            <h2 className="text-xl font-semibold tracking-tight">Six minds. One decision.</h2>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Decision recap */}
        <div className="mb-6 text-sm text-white/55">
          <span className="text-white/40 font-mono text-xs uppercase tracking-widest">Re: </span>
          <span className="italic">&ldquo;{data.decision}&rdquo;</span>
        </div>

        {/* Consensus vote bar */}
        <div className="gradient-border rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 glow-purple opacity-30 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">The board votes</div>
              <div className="text-xs font-mono">
                <span className="text-white/40">Majority: </span>
                <span className={`text-${pathStyle[consensus.majority_path]?.color}-400 capitalize font-medium`}>{consensus.majority_path}</span>
              </div>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-white/5 mb-3">
              {consensus.conservative_votes > 0 && <div className="bg-blue-400 flex items-center justify-center text-[10px] font-mono text-black/70" style={{ width: `${votePct(consensus.conservative_votes)}%` }}>{consensus.conservative_votes}</div>}
              {consensus.balanced_votes > 0 && <div className="bg-violet-400 flex items-center justify-center text-[10px] font-mono text-black/70" style={{ width: `${votePct(consensus.balanced_votes)}%` }}>{consensus.balanced_votes}</div>}
              {consensus.aggressive_votes > 0 && <div className="bg-amber-400 flex items-center justify-center text-[10px] font-mono text-black/70" style={{ width: `${votePct(consensus.aggressive_votes)}%` }}>{consensus.aggressive_votes}</div>}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400" /><span className="text-white/55">Conservative · {consensus.conservative_votes}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-violet-400" /><span className="text-white/55">Balanced · {consensus.balanced_votes}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-white/55">Aggressive · {consensus.aggressive_votes}</span></div>
            </div>
            {consensus.key_disagreement && (
              <div className="mt-5 pt-4 border-t border-white/5">
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1.5 flex items-center gap-1.5"><AlertTriangle className="w-2.5 h-2.5" /> Where the board disagrees</div>
                <p className="text-sm text-white/70 leading-relaxed italic">&ldquo;{consensus.key_disagreement}&rdquo;</p>
              </div>
            )}
          </div>
        </div>

        {/* Advisor cards (6 default + customs) */}
        <div className="grid md:grid-cols-2 gap-4">
          {sorted.map(a => {
            const meta = advisorMeta[a.advisor_id]
            return <AdvisorCard key={a.advisor_id} advisor={a} meta={meta} />
          })}
          {customAdvisors.map(a => {
            const grad = pickGradient(a.name)
            const meta = { name: a.name, role: a.role || 'Custom advisor', initials: getInitials(a.name), ...grad }
            return <AdvisorCard key={a.id} advisor={{ ...a, advisor_id: a.id }} meta={meta} custom />
          })}
        </div>

        {/* Ask another voice */}
        <div className="mt-8 gradient-border rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 opacity-10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-4 h-4 text-violet-400" />
              <div className="text-[10px] uppercase tracking-widest text-violet-400 font-mono">Add another voice</div>
            </div>
            <h3 className="text-lg font-semibold mb-1">Want a different perspective?</h3>
            <p className="text-sm text-white/55 mb-4">Type any name — founder, athlete, philosopher, family member — and they&apos;ll weigh in.</p>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 gradient-border rounded-full p-1">
                <Input value={askName} onChange={e => setAskName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askAdvisor()}
                  placeholder="e.g. Sam Altman, your grandmother, a CFO..."
                  className="bg-transparent border-0 h-10 px-4 focus-visible:ring-0 placeholder:text-white/25 text-sm" />
              </div>
              <Button onClick={() => askAdvisor()} disabled={!askName.trim() || asking}
                className="h-12 px-5 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-40 font-medium">
                {asking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Convening...</> : <><Send className="w-3.5 h-3.5 mr-1.5" /> Ask</>}
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono mr-1 self-center">Try:</span>
              {suggestions.map(s => (
                <button key={s} onClick={() => askAdvisor(s)} disabled={asking}
                  className="px-2.5 py-1 rounded-full text-[11px] border border-white/10 text-white/65 hover:bg-white/5 hover:border-white/20 transition disabled:opacity-40">
                  {s}
                </button>
              ))}
            </div>

            {askError && <div className="mt-3 text-xs text-red-400">{askError}</div>}
          </div>
        </div>
      </div>
    </DialogContent>
  )
}

function AdvisorCard({ advisor: a, meta, custom = false }) {
  const pathPs = pathStyle[a.preferred_path] || pathStyle.balanced
  return (
    <div className="gradient-border rounded-2xl p-6 transition-all relative overflow-hidden">
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${meta.from} ${meta.to} opacity-10 blur-2xl pointer-events-none`} />
      <div className="relative">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${meta.from} ${meta.to} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-lg`}>
            {meta.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-medium leading-tight flex items-center gap-1.5">
                {meta.name}
                {custom && <span className="text-[9px] uppercase tracking-widest font-mono text-violet-400 px-1.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">guest</span>}
              </h3>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${meta.bg} ${meta.text} border ${meta.border}`}>
                {a.confidence}% sure
              </div>
            </div>
            <p className={`text-xs ${meta.text} font-mono mt-0.5`}>{meta.role}</p>
          </div>
        </div>

        <div className="relative pl-5 mb-5">
          <Quote className={`absolute left-0 top-0 w-3.5 h-3.5 ${meta.text}`} />
          <p className="text-base text-white/90 leading-snug italic font-medium">
            {a.one_line_advice}
          </p>
        </div>

        <p className="text-sm text-white/70 leading-relaxed mb-4">{a.overall_opinion}</p>

        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-emerald-400 font-mono mb-1 flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" /> Biggest opportunity</div>
            <p className="text-white/70 leading-snug">{a.biggest_opportunity}</p>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-red-400 font-mono mb-1 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> Biggest risk</div>
            <p className="text-white/70 leading-snug">{a.biggest_risk}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          <span className="text-white/40 font-mono">VOTES FOR</span>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-${pathPs.color}-500/10 border border-${pathPs.color}-500/20 text-${pathPs.color}-400`}>
            {a.preferred_path} Path
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// EXECUTIVE SUMMARY (Agent 7 - Consensus)
// =====================================================
function ExecutiveSummary({ consensus }) {
  const r = consensus.recommendation || {}
  const ps = pathStyle[r.recommended_path] || pathStyle.balanced
  const sourceMeta = {
    financial: { label: 'Financial', icon: BarChart3, color: 'emerald' },
    career:    { label: 'Career',    icon: Briefcase, color: 'blue' },
    lifestyle: { label: 'Lifestyle', icon: Heart, color: 'pink' },
    board:     { label: 'Board',     icon: Users2, color: 'violet' },
  }
  const sevColor = { high: 'red', medium: 'amber', low: 'emerald' }

  return (
    <section className="mt-10 animate-fade-up delay-100">
      <div className="gradient-border rounded-2xl p-7 md:p-9 relative overflow-hidden">
        {/* Glow accent */}
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full bg-${ps.color}-500/30 opacity-30 blur-3xl pointer-events-none`} />
        <div className="absolute inset-0 glow-purple opacity-20 pointer-events-none" />

        <div className="relative">
          {/* Label */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-violet-400 font-mono">
              <FileText className="w-3 h-3" />
              <span>Executive Summary</span>
              <span className="text-white/30">·</span>
              <span className="text-white/40">Agent 7 · Consensus</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full bg-${ps.color}-500/10 border border-${ps.color}-500/30 text-${ps.color}-400 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5`}>
                <Award className="w-3 h-3" /> {ps.label} Path
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-mono">
                {r.confidence}% confidence
              </div>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-gradient leading-tight max-w-4xl">
            {r.headline}
          </h2>

          {/* Executive summary paragraph */}
          <p className="mt-5 text-white/70 leading-relaxed max-w-4xl text-base">
            {r.executive_summary}
          </p>

          {/* Confidence meter */}
          <div className="mt-7 max-w-md">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/40 font-mono mb-1.5">
              <span>Conviction</span>
              <span>{r.confidence}/100</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r from-${ps.color}-500 to-${ps.color}-300 rounded-full transition-all`} style={{ width: `${r.confidence}%` }} />
            </div>
          </div>

          {/* 4-quadrant grid */}
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Top Opportunities */}
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5">
              <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Top Opportunities
              </div>
              <ul className="space-y-3">
                {(r.top_opportunities || []).map((o, i) => (
                  <li key={i}>
                    <div className="text-sm text-white/90 font-medium leading-snug">{o.title}</div>
                    <p className="text-xs text-white/55 leading-relaxed mt-1">{o.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Risks */}
            <div className="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-5">
              <div className="text-[10px] uppercase tracking-widest text-red-400 font-mono mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> Top Risks
              </div>
              <ul className="space-y-3">
                {(r.top_risks || []).map((o, i) => {
                  const sc = sevColor[o.severity] || 'amber'
                  return (
                    <li key={i}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm text-white/90 font-medium leading-snug flex-1">{o.title}</div>
                        <span className={`text-[9px] font-mono uppercase tracking-widest text-${sc}-400 px-1.5 py-0.5 rounded-full bg-${sc}-500/10 border border-${sc}-500/20 flex-shrink-0`}>{o.severity}</span>
                      </div>
                      <p className="text-xs text-white/55 leading-relaxed mt-1">{o.description}</p>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Supporting Reasons */}
            <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.03] p-5">
              <div className="text-[10px] uppercase tracking-widest text-violet-400 font-mono mb-3 flex items-center gap-1.5">
                <Scale className="w-3 h-3" /> Supporting Reasons
              </div>
              <ul className="space-y-3">
                {(r.supporting_reasons || []).map((o, i) => {
                  const m = sourceMeta[o.source] || sourceMeta.financial
                  const Icon = m.icon
                  return (
                    <li key={i} className="flex gap-2">
                      <div className={`w-5 h-5 rounded-md bg-${m.color}-500/10 border border-${m.color}-500/20 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-2.5 h-2.5 text-${m.color}-400`} />
                      </div>
                      <div>
                        <div className={`text-[9px] uppercase tracking-widest font-mono text-${m.color}-400`}>{m.label}</div>
                        <div className="text-xs text-white/75 leading-snug">{o.point}</div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Action Items */}
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-5">
              <div className="text-[10px] uppercase tracking-widest text-amber-400 font-mono mb-3 flex items-center gap-1.5">
                <Target className="w-3 h-3" /> Action Items
              </div>
              <ul className="space-y-2.5">
                {(r.action_items || []).map((a, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <div className="w-4 h-4 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-mono text-amber-400">{i + 1}</span>
                    </div>
                    <span className="text-white/75 leading-snug">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// =====================================================
// DISSENT ANALYSIS
// =====================================================
function DissentAnalysis({ dissent, board }) {
  // Helper to find advisor meta by id (default or custom)
  const allBoard = board?.board || []
  const findAdvisor = (id) => allBoard.find(a => a.advisor_id === id)
  const getMeta = (id) => advisorMeta[id]

  return (
    <section className="mt-14 animate-fade-up delay-200">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-violet-400 mb-1 font-mono flex items-center gap-2">
            <Swords className="w-3 h-3" /> Dissent Analysis
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Where the board agrees — and clashes</h2>
        </div>
        <div className="text-xs text-white/40 font-mono">Trade-offs over single answers</div>
      </div>

      {/* Agreements */}
      {dissent.agreements?.length > 0 && (
        <div className="gradient-border rounded-2xl p-6 mb-5">
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono mb-4 flex items-center gap-1.5">
            <Check className="w-3 h-3" /> Strong Agreement Across the Board
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {dissent.agreements.map((a, i) => (
              <div key={i} className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/15 p-4 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disagreements - split-view cards */}
      {dissent.disagreements?.length > 0 && (
        <div className="space-y-4 mb-5">
          {dissent.disagreements.map((dg, i) => (
            <div key={i} className="gradient-border rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.04] via-transparent to-amber-500/[0.04] pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-center mb-5">
                  <div className="px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[11px] font-mono uppercase tracking-widest">
                    {dg.topic}
                  </div>
                </div>

                <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
                  {/* Side A */}
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-5">
                    <p className="text-sm text-white/85 leading-relaxed mb-4 italic">&ldquo;{dg.stance_a}&rdquo;</p>
                    <div className="text-[10px] uppercase tracking-widest text-blue-400 font-mono mb-2">Supported by</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(dg.advisors_a || []).map(id => {
                        const m = getMeta(id)
                        if (!m) return <span key={id} className="text-xs text-white/60 capitalize">{id}</span>
                        return (
                          <div key={id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${m.from} ${m.to} flex items-center justify-center text-white text-[9px] font-semibold`}>{m.initials}</div>
                            <span className="text-[11px] text-white/75">{m.name.split(' ')[0]}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* VS divider */}
                  <div className="flex md:flex-col items-center justify-center px-2 py-2 md:py-0">
                    <div className="h-px md:h-full md:w-px w-full bg-gradient-to-r md:bg-gradient-to-b from-transparent via-white/15 to-transparent flex-1" />
                    <div className="px-3 py-1.5 rounded-full bg-[#0a0a0b] border border-white/15 text-[10px] font-mono uppercase tracking-widest text-white/60 my-2">vs</div>
                    <div className="h-px md:h-full md:w-px w-full bg-gradient-to-r md:bg-gradient-to-b from-transparent via-white/15 to-transparent flex-1" />
                  </div>

                  {/* Side B */}
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
                    <p className="text-sm text-white/85 leading-relaxed mb-4 italic">&ldquo;{dg.stance_b}&rdquo;</p>
                    <div className="text-[10px] uppercase tracking-widest text-amber-400 font-mono mb-2">Supported by</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(dg.advisors_b || []).map(id => {
                        const m = getMeta(id)
                        if (!m) return <span key={id} className="text-xs text-white/60 capitalize">{id}</span>
                        return (
                          <div key={id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${m.from} ${m.to} flex items-center justify-center text-white text-[9px] font-semibold`}>{m.initials}</div>
                            <span className="text-[11px] text-white/75">{m.name.split(' ')[0]}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Tradeoff line */}
                {dg.tradeoff && (
                  <div className="mt-5 pt-4 border-t border-white/5 flex items-start gap-2">
                    <Scale className="w-3.5 h-3.5 text-white/40 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/55 leading-relaxed">
                      <span className="text-white/40 font-mono uppercase tracking-widest text-[9px] mr-1.5">THE REAL TRADEOFF:</span>
                      {dg.tradeoff}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key tradeoffs */}
      {dissent.key_tradeoffs?.length > 0 && (
        <div className="gradient-border rounded-2xl p-6">
          <div className="text-[10px] uppercase tracking-widest text-amber-400 font-mono mb-4 flex items-center gap-1.5">
            <Scale className="w-3 h-3" /> Trade-offs You&apos;re Implicitly Accepting
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {dissent.key_tradeoffs.map((t, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono mb-1.5">You gain</div>
                <p className="text-sm text-white/85 leading-snug mb-3">{t.gain}</p>
                <div className="flex items-center gap-2 text-white/30 mb-2">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-red-400 font-mono mb-1.5">You give up</div>
                <p className="text-sm text-white/85 leading-snug">{t.cost}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// =====================================================
// FUTURE SELF SIMULATOR
// =====================================================
function FutureSelfSection({ data }) {
  const [tab, setTab] = useState(5)
  const [threads, setThreads] = useState({ 5: [], 10: [] })
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadedTabs, setLoadedTabs] = useState({})
  const path = data.consensus?.recommendation?.recommended_path || 'balanced'
  const pathStyleCur = pathStyle[path] || pathStyle.balanced

  const ageNow = data.profile_snapshot?.age || 30
  const futureAge = ageNow + tab

  // Auto-load opening reflection on first tab visit
  useEffect(() => {
    if (loadedTabs[tab]) return
    setLoadedTabs(prev => ({ ...prev, [tab]: true }))
    fetchReply(tab, '', [])
  }, [tab])

  async function fetchReply(yearsAhead, message, history) {
    setLoading(true)
    try {
      const res = await fetch('/api/simulate/future-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: data.profile_snapshot,
          decision: data.decision,
          scenarios: data.scenarios,
          recommendation: data.consensus.recommendation,
          years_ahead: yearsAhead,
          history,
          message,
          simulation_id: data.id,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Failed')
      setThreads(prev => ({ ...prev, [yearsAhead]: [...history, ...(message ? [{ role: 'user', text: message }] : []), { role: 'assistant', text: j.text }] }))
    } catch (e) {
      setThreads(prev => ({ ...prev, [yearsAhead]: [...history, ...(message ? [{ role: 'user', text: message }] : []), { role: 'assistant', text: '(could not reach future self: ' + e.message + ')' }] }))
    } finally {
      setLoading(false)
    }
  }

  const send = () => {
    if (!draft.trim() || loading) return
    const msg = draft.trim()
    setDraft('')
    fetchReply(tab, msg, threads[tab])
  }

  const messages = threads[tab] || []
  const initials = 'YOU'
  const quickAsks = tab === 5
    ? ['What surprised you most?', 'What would you do differently?', 'How is your family handling it?']
    : ['Looking back, was it worth it?', 'What was the biggest mistake?', 'What lesson defines this decade?']

  return (
    <section className="mt-14 animate-fade-up">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-violet-400 mb-1 font-mono flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Future Self Simulator
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Talk to your future self</h2>
          <p className="text-sm text-white/55 mt-1">A simulated version of you, having lived the chosen path. Ask anything.</p>
        </div>
        {/* Tabs */}
        <div className="inline-flex gap-1 p-1 rounded-full border border-white/10 bg-white/[0.02]">
          {[5, 10].map(y => (
            <button key={y} onClick={() => setTab(y)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${tab === y ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}>
              +{y} years
            </button>
          ))}
        </div>
      </div>

      <div className="gradient-border rounded-2xl overflow-hidden relative">
        {/* Header strip */}
        <div className={`px-6 py-4 border-b border-white/5 flex items-center gap-4 bg-gradient-to-r from-${pathStyleCur.color}-500/[0.08] to-transparent`}>
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-${pathStyleCur.color}-400 to-${pathStyleCur.color}-600 flex items-center justify-center text-white text-xs font-bold relative shadow-lg`}>
            +{tab}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0a0a0b]`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">You, age {futureAge}</div>
            <div className="text-xs text-white/45 font-mono">
              {tab} years into the {pathStyleCur.label.toLowerCase()} path · {data.profile_snapshot?.location || 'somewhere'}
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            simulated
          </div>
        </div>

        {/* Messages */}
        <div className="px-6 py-6 space-y-4 min-h-[280px] max-h-[480px] overflow-y-auto bg-[#0a0a0b]/40">
          {messages.length === 0 && loading && (
            <div className="flex items-center gap-3 text-white/40 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Your future self is gathering their thoughts...</span>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${m.role === 'user' ? 'bg-white/10 text-white/70' : `bg-gradient-to-br from-${pathStyleCur.color}-400 to-${pathStyleCur.color}-600 text-white`}`}>
                {m.role === 'user' ? 'NOW' : '+' + tab}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-white/8 text-white/85' : `bg-${pathStyleCur.color}-500/10 border border-${pathStyleCur.color}-500/20 text-white/90`}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && messages.length > 0 && (
            <div className="flex gap-3">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-${pathStyleCur.color}-400 to-${pathStyleCur.color}-600 flex items-center justify-center text-[10px] text-white font-semibold flex-shrink-0`}>+{tab}</div>
              <div className={`bg-${pathStyleCur.color}-500/10 border border-${pathStyleCur.color}-500/20 rounded-2xl px-4 py-3 inline-flex gap-1`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Quick asks + input */}
        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {quickAsks.map(q => (
              <button key={q} onClick={() => { setDraft(q); setTimeout(() => fetchReply(tab, q, threads[tab]), 50) }}
                disabled={loading}
                className="px-2.5 py-1 rounded-full text-[11px] border border-white/10 text-white/65 hover:bg-white/5 hover:border-white/20 transition disabled:opacity-40">
                {q}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 gradient-border rounded-full p-1">
              <Input value={draft} onChange={e => setDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={`Ask your +${tab}-year self anything...`}
                className="bg-transparent border-0 h-10 px-4 focus-visible:ring-0 placeholder:text-white/25 text-sm" />
            </div>
            <Button onClick={send} disabled={!draft.trim() || loading}
              className="h-12 w-12 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-40 p-0 flex items-center justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// =====================================================
// FINAL REPORT CARD (the 11th step)
// =====================================================
function FinalReport({ data, router }) {
  const r = data.consensus?.recommendation
  const path = r?.recommended_path || 'balanced'
  const ps = pathStyle[path] || pathStyle.balanced
  const [copied, setCopied] = useState(false)

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }
  const handleCopy = async () => {
    try {
      const url = `${window.location.origin}/r/${data.id}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <section className="mt-14 animate-fade-up">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-violet-400 mb-1 font-mono flex items-center gap-2">
            <FileText className="w-3 h-3" /> Final Report
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Your decision dossier is ready</h2>
        </div>
      </div>

      <div className="gradient-border rounded-2xl p-7 md:p-8 relative overflow-hidden">
        <div className={`absolute -top-24 -right-24 w-80 h-80 rounded-full bg-${ps.color}-500/20 opacity-30 blur-3xl pointer-events-none`} />
        <div className="relative">
          {/* Stamp */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono uppercase tracking-widest mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            7 agents completed · 11 steps
          </div>

          <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-gradient leading-tight max-w-3xl">
            {r?.headline || 'Recommendation ready'}
          </h3>

          {/* Stat row */}
          <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Recommended</div>
              <div className={`text-base font-medium text-${ps.color}-300 capitalize mt-1`}>{path} Path</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Conviction</div>
              <div className="text-base font-medium mt-1">{r?.confidence}<span className="text-white/30 text-xs">/100</span></div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Scenarios</div>
              <div className="text-base font-medium mt-1">{data.scenarios?.paths?.length || 0}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Voices</div>
              <div className="text-base font-medium mt-1">{(data.board?.board?.length || 0)} advisors</div>
            </div>
          </div>

          {/* The 11 steps timeline */}
          <div className="mt-8">
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-3">The 11 steps that produced this report</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Question', 'Profile', 'Scenarios', 'Financial', 'Career', 'Lifestyle',
                'Board', 'Dissent', 'Consensus', 'Future Self', 'Report'
              ].map((s, i) => (
                <div key={s} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/15">
                  <div className="w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-2 h-2 text-emerald-400" strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-mono text-white/65">{i + 1}. {s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-2">
            <Button onClick={handlePrint} className="h-10 px-4 rounded-full bg-white text-black hover:bg-white/90 text-sm font-medium">
              <FileText className="w-3.5 h-3.5 mr-1.5" /> Save / Print PDF
            </Button>
            <Button onClick={handleCopy} variant="ghost" className="h-10 px-4 rounded-full border border-white/10 hover:bg-white/5 text-sm">
              {copied ? <><span className="text-emerald-400 mr-1">✓</span> Copied!</> : <><Share2 className="w-3.5 h-3.5 mr-1.5" /> Copy share link</>}
            </Button>
            <Button onClick={() => router.push('/decide')} variant="ghost" className="h-10 px-4 rounded-full border border-white/10 hover:bg-white/5 text-sm">
              New simulation <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function CareerComparison({ careerPaths }) {
  const dims = [
    { key: 'career_score', label: 'Career outcome' },
    { key: 'growth_score', label: 'Growth potential' },
    { key: 'opportunity_score', label: 'Opportunity quality' },
  ]
  const colorMap = { conservative: 'bg-blue-400', balanced: 'bg-violet-400', aggressive: 'bg-amber-400' }
  const ordered = ['conservative','balanced','aggressive'].map(t => careerPaths.find(c => c.path_type === t)).filter(Boolean)

  return (
    <div className="space-y-6">
      {dims.map(d => (
        <div key={d.key}>
          <div className="text-[10px] uppercase tracking-widest text-violet-400 font-mono mb-3">{d.label}</div>
          <div className="space-y-2">
            {ordered.map(c => (
              <div key={c.path_type} className="flex items-center gap-3">
                <div className="w-24 text-xs text-white/60 capitalize">{c.path_type}</div>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${colorMap[c.path_type]} rounded-full transition-all`} style={{ width: `${c[d.key] || 0}%` }} />
                </div>
                <div className="w-10 text-right text-sm font-mono text-white/85">{c[d.key]}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function NetWorthChart({ financialPaths, ccy }) {
  // Build year-by-year data
  if (!financialPaths || financialPaths.length === 0) return null
  const types = ['conservative', 'balanced', 'aggressive']
  const series = types.map(t => {
    const f = financialPaths.find(x => x.path_type === t)
    return { type: t, data: f?.yearly_projection || [] }
  })
  const allValues = series.flatMap(s => s.data.map(d => d.net_worth || 0))
  const max = Math.max(...allValues, 1)
  const min = Math.min(...allValues, 0)

  const W = 800, H = 220, pad = 30
  const years = series[0]?.data.map(d => d.year) || [1,2,3,4,5]
  const xStep = (W - pad * 2) / Math.max(1, years.length - 1)
  const yScale = v => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2)

  const colorMap = { conservative: '#60a5fa', balanced: '#a78bfa', aggressive: '#fbbf24' }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px] min-w-[600px]">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line key={i} x1={pad} x2={W-pad} y1={pad + p*(H-pad*2)} y2={pad + p*(H-pad*2)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        {/* Y labels */}
        {[0, 0.5, 1].map((p, i) => {
          const val = max - p*(max-min)
          return <text key={i} x={4} y={pad + p*(H-pad*2) + 4} fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="JetBrains Mono">{formatMoney(val, ccy)}</text>
        })}
        {/* X labels */}
        {years.map((y, i) => (
          <text key={i} x={pad + i*xStep} y={H-8} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">Y{y}</text>
        ))}
        {/* Lines */}
        {series.map(s => {
          if (s.data.length === 0) return null
          const path = s.data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${pad + i*xStep} ${yScale(d.net_worth || 0)}`).join(' ')
          const areaPath = path + ` L ${pad + (s.data.length-1)*xStep} ${H-pad} L ${pad} ${H-pad} Z`
          return (
            <g key={s.type}>
              <path d={areaPath} fill={colorMap[s.type]} opacity="0.08" />
              <path d={path} stroke={colorMap[s.type]} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {s.data.map((d, i) => (
                <circle key={i} cx={pad + i*xStep} cy={yScale(d.net_worth || 0)} r="3" fill="#0a0a0b" stroke={colorMap[s.type]} strokeWidth="2" />
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
