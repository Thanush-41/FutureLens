'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Eye, Sparkles, BarChart3, Workflow, TrendingUp, TrendingDown, Calendar, Target, Shield, ChevronRight, AlertTriangle, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

        {/* CTA */}
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
