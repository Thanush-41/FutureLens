'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles, Eye, Brain, Compass, TrendingUp, Users, BarChart3, Lightbulb, Check, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'

const examples = [
  'Should I accept this job offer at the startup?',
  'Should I move to Bangalore for a new role?',
  'Should I pursue a Master\'s next year?',
  'Should I start my own business?',
  'Should I buy a house or keep renting?',
]

export default function LandingPage() {
  const router = useRouter()
  const [exampleIdx, setExampleIdx] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setExampleIdx(i => (i + 1) % examples.length), 2800)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const startFlow = () => {
    // If profile exists, go straight to decide. Else go to onboarding.
    if (typeof window !== 'undefined') {
      const profile = sessionStorage.getItem('futurelens_profile')
      router.push(profile ? '/decide' : '/onboarding')
    } else router.push('/onboarding')
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-60" />
      <div className="fixed inset-0 bg-radial-fade pointer-events-none" />
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] glow-purple pointer-events-none" />

      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'backdrop-blur-xl bg-black/40 border-b border-white/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Eye className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold tracking-tight">FutureLens</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#how" className="hover:text-white transition">How it works</a>
            <a href="#agents" className="hover:text-white transition">AI Agents</a>
            <a href="#examples" className="hover:text-white transition">Examples</a>
          </div>
          <Button onClick={startFlow} className="bg-white text-black hover:bg-white/90 h-9 px-4 rounded-full text-sm font-medium">
            Start now <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs text-white/70 mb-8 animate-fade-up">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span>3 specialized AI agents · Powered by Gemini</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[88px] font-semibold tracking-[-0.04em] leading-[1.02] text-gradient animate-fade-up delay-100">
            See the future<br />
            <span className="text-gradient-purple">consequences</span> of<br />
            today&apos;s decisions.
          </h1>

          <p className="mt-7 text-lg md:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed animate-fade-up delay-200">
            FutureLens simulates Conservative, Balanced, and Aggressive futures for any decision — then projects the financial impact, year by year.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center animate-fade-up delay-300">
            <Button onClick={startFlow} className="h-12 px-6 rounded-full bg-white text-black hover:bg-white/90 text-sm font-medium shadow-2xl shadow-white/10">
              Run your first simulation
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={() => document.getElementById('how')?.scrollIntoView({behavior:'smooth'})} className="h-12 px-6 rounded-full border border-white/10 hover:bg-white/5 text-sm font-medium">
              See how it works
            </Button>
          </div>

          <div className="mt-16 animate-fade-up delay-400">
            <p className="text-xs uppercase tracking-widest text-white/30 mb-3">Try simulating</p>
            <div className="h-7 relative overflow-hidden">
              {examples.map((ex, i) => (
                <div key={i} className={`absolute inset-0 transition-all duration-700 ${i === exampleIdx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  <span className="font-mono text-sm text-white/70">&ldquo;{ex}&rdquo;</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hero card */}
        <div className="mt-24 max-w-5xl mx-auto relative animate-fade-up delay-500">
          <div className="absolute inset-0 glow-purple" />
          <div className="relative gradient-border rounded-2xl p-1.5">
            <div className="rounded-[14px] bg-[#0d0d10] p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs text-white/40 font-mono mb-1">SIMULATION_4827</div>
                  <div className="text-base text-white/90">Should I move to Bangalore for a new PM role?</div>
                </div>
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-mono text-emerald-400">3 PATHS · ANALYZED</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Conservative', color: 'from-blue-500/20 to-blue-500/5', dot: 'bg-blue-400', sub: 'Safe · ₹29L by Y5' },
                  { label: 'Balanced', color: 'from-violet-500/20 to-violet-500/5', dot: 'bg-violet-400', sub: 'Pragmatic · ₹42L by Y5' },
                  { label: 'Aggressive', color: 'from-amber-500/20 to-amber-500/5', dot: 'bg-amber-400', sub: 'Bold · ₹65L by Y5' },
                ].map((a, i) => (
                  <div key={i} className={`rounded-xl p-4 border border-white/5 bg-gradient-to-br ${a.color}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-white/80">{a.label}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                    </div>
                    <div className="text-[11px] text-white/45 font-mono">{a.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-widest text-violet-400 mb-3 font-mono">How it works</div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gradient">Three agents. One decision.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { num: '01', title: 'You provide context', desc: 'Quick onboarding captures your age, income, savings, goals, and risk tolerance — the foundation for accurate simulations.' },
              { num: '02', title: 'Scenarios are generated', desc: 'Agent 2 imagines Conservative, Balanced, and Aggressive 5-year futures — each with a vivid timeline, assumptions, and confidence.' },
              { num: '03', title: 'Financial impact projected', desc: 'Agent 3 quantifies wealth, income, and risk for each path — with year-by-year projections in your own currency.' },
            ].map((s, i) => (
              <div key={i} className="gradient-border rounded-2xl p-7">
                <div className="text-xs font-mono text-white/30 mb-4">{s.num}</div>
                <h3 className="text-lg font-medium mb-2">{s.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-widest text-violet-400 mb-3 font-mono">Your AI agents</div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gradient">A coordinated brain for every decision.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Users, name: 'Context Agent', tagline: 'Knows you', desc: 'Captures your profile so every projection is tailored to your real life.', color: 'blue' },
              { icon: Workflow, name: 'Scenario Agent', tagline: 'Imagines futures', desc: 'Generates three distinct 5-year paths — Conservative, Balanced, Aggressive.', color: 'violet' },
              { icon: BarChart3, name: 'Financial Agent', tagline: 'Crunches numbers', desc: 'Projects wealth, income, savings, and risk for each path, year by year.', color: 'emerald' },
            ].map((a, i) => (
              <div key={i} className="gradient-border rounded-2xl p-6 hover:bg-white/[0.02] transition">
                <div className={`w-10 h-10 rounded-lg bg-${a.color}-500/10 border border-${a.color}-500/20 flex items-center justify-center mb-5`}>
                  <a.icon className={`w-5 h-5 text-${a.color}-400`} />
                </div>
                <h3 className="font-medium mb-1">{a.name}</h3>
                <p className="text-xs text-white/40 mb-4 font-mono">{a.tagline}</p>
                <p className="text-sm text-white/55 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Examples */}
      <section id="examples" className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest text-violet-400 mb-3 font-mono">Real decisions</div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gradient">What can FutureLens simulate?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              'Should I accept this job offer?',
              'Should I pursue a master\'s degree?',
              'Should I move to another city?',
              'Should I start a business?',
              'Should I buy a house or keep renting?',
              'Should I leave my secure career for a startup?',
            ].map((q, i) => (
              <div key={i} className="gradient-border rounded-xl p-5 flex items-center gap-3 group cursor-pointer hover:bg-white/[0.03] transition" onClick={() => { sessionStorage.setItem('futurelens_pending_question', q); startFlow() }}>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white/60" />
                </div>
                <span className="text-sm text-white/80">{q}</span>
                <ArrowRight className="w-4 h-4 text-white/30 ml-auto group-hover:text-white group-hover:translate-x-0.5 transition" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-32 px-6">
        <div className="max-w-3xl mx-auto text-center gradient-border rounded-3xl p-12 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 glow-purple opacity-50" />
          <div className="relative">
            <Brain className="w-10 h-10 mx-auto mb-6 text-violet-400" />
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient mb-5">Stop wondering.<br />Start simulating.</h2>
            <p className="text-white/55 max-w-md mx-auto mb-8">Run your first decision simulation now. Takes ~90 seconds.</p>
            <Button onClick={startFlow} className="h-12 px-7 rounded-full bg-white text-black hover:bg-white/90 text-sm font-medium">
              Open FutureLens <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center">
              <Eye className="w-3 h-3 text-white" />
            </div>
            <span>FutureLens · See further.</span>
          </div>
          <div>© 2025 FutureLens. Powered by Gemini.</div>
        </div>
      </footer>
    </div>
  )
}
