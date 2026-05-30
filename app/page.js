'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles, Eye, Brain, Compass, TrendingUp, Shield, Lightbulb, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const examples = [
  'Should I accept this job offer at the startup?',
  'Should I pursue a Master\'s degree next year?',
  'Should I move from NYC to Lisbon?',
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background layers */}
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
            <a href="#advisors" className="hover:text-white transition">AI Advisors</a>
            <a href="#examples" className="hover:text-white transition">Examples</a>
          </div>
          <Button onClick={() => router.push('/decide')} className="bg-white text-black hover:bg-white/90 h-9 px-4 rounded-full text-sm font-medium">
            Start now <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs text-white/70 mb-8 animate-fade-up">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span>Powered by Gemini 3.5 · A board of 4 AI advisors</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[88px] font-semibold tracking-[-0.04em] leading-[1.02] text-gradient animate-fade-up delay-100">
            See the future<br />
            <span className="text-gradient-purple">consequences</span> of<br />
            today&apos;s decisions.
          </h1>

          <p className="mt-7 text-lg md:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed animate-fade-up delay-200">
            FutureLens simulates multiple 5-year futures from any decision you face — analyzed by an AI board of advisors. Clarity in minutes, not months.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center animate-fade-up delay-300">
            <Button onClick={() => router.push('/decide')} className="h-12 px-6 rounded-full bg-white text-black hover:bg-white/90 text-sm font-medium shadow-2xl shadow-white/10">
              Run your first simulation
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={() => document.getElementById('how')?.scrollIntoView({behavior:'smooth'})} className="h-12 px-6 rounded-full border border-white/10 hover:bg-white/5 text-sm font-medium">
              See how it works
            </Button>
          </div>

          {/* Rotating example */}
          <div className="mt-16 animate-fade-up delay-400">
            <p className="text-xs uppercase tracking-widest text-white/30 mb-3">Try simulating</p>
            <div className="h-7 relative overflow-hidden">
              {examples.map((ex, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 transition-all duration-700 ${i === exampleIdx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                >
                  <span className="font-mono text-sm text-white/70">&ldquo;{ex}&rdquo;</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hero visual: floating advisor cards preview */}
        <div className="mt-24 max-w-5xl mx-auto relative animate-fade-up delay-500">
          <div className="absolute inset-0 glow-purple" />
          <div className="relative gradient-border rounded-2xl p-1.5">
            <div className="rounded-[14px] bg-[#0d0d10] p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs text-white/40 font-mono mb-1">SIMULATION_4827</div>
                  <div className="text-base text-white/90">Should I accept the senior engineer role at the startup?</div>
                </div>
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-mono text-emerald-400">PROCEED</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: TrendingUp, label: 'Financial', color: 'from-emerald-500/20 to-emerald-500/5', dot: 'bg-emerald-400' },
                  { icon: Compass, label: 'Life Coach', color: 'from-blue-500/20 to-blue-500/5', dot: 'bg-blue-400' },
                  { icon: Shield, label: 'Risk', color: 'from-amber-500/20 to-amber-500/5', dot: 'bg-amber-400' },
                  { icon: Lightbulb, label: 'Visionary', color: 'from-violet-500/20 to-violet-500/5', dot: 'bg-violet-400' },
                ].map((a, i) => (
                  <div key={i} className={`rounded-xl p-4 border border-white/5 bg-gradient-to-br ${a.color}`}>
                    <div className="flex items-center justify-between mb-3">
                      <a.icon className="w-4 h-4 text-white/70" />
                      <div className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                    </div>
                    <div className="text-xs font-medium text-white/80">{a.label}</div>
                    <div className="text-[10px] text-white/40 mt-1 font-mono">advisor.online</div>
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
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gradient">Three steps from doubt to clarity.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { num: '01', title: 'Describe your decision', desc: 'Tell FutureLens what you\'re weighing — context, options, and what success means to you.' },
              { num: '02', title: 'AI simulates multiple futures', desc: 'Gemini 3.5 generates 5 plausible 5-year scenarios with likelihoods, drivers, and consequences.' },
              { num: '03', title: 'Get advisor analysis', desc: 'A board of 4 AI advisors — Financial, Life Coach, Risk, and Visionary — weigh in with pros, cons, and a verdict.' },
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

      {/* Advisors */}
      <section id="advisors" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-widest text-violet-400 mb-3 font-mono">Your AI Board</div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gradient">Four perspectives. One decision.</h2>
            <p className="mt-5 text-white/55 max-w-xl mx-auto">Every simulation is reviewed by four distinct advisor personas, each trained to focus on a different dimension of your decision.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, name: 'Financial Advisor', tagline: 'Money. Income. Wealth.', desc: 'Evaluates the economic impact across short, medium, and long horizons.', color: 'emerald' },
              { icon: Compass, name: 'Life Coach', tagline: 'Meaning. Fulfillment. Growth.', desc: 'Looks at your values, relationships, and personal growth trajectory.', color: 'blue' },
              { icon: Shield, name: 'Risk Analyst', tagline: 'Threats. Volatility. Downside.', desc: 'Surfaces hidden risks, worst-case scenarios, and mitigation strategies.', color: 'amber' },
              { icon: Lightbulb, name: 'Visionary', tagline: 'Possibilities. Bold bets.', desc: 'Imagines the most ambitious outcomes if everything goes right.', color: 'violet' },
            ].map((a, i) => (
              <div key={i} className="gradient-border rounded-2xl p-6 group hover:bg-white/[0.02] transition">
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
              <div key={i} className="gradient-border rounded-xl p-5 flex items-center gap-3 group cursor-pointer hover:bg-white/[0.03] transition" onClick={() => router.push('/decide?q=' + encodeURIComponent(q))}>
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

      {/* CTA */}
      <section className="relative py-32 px-6">
        <div className="max-w-3xl mx-auto text-center gradient-border rounded-3xl p-12 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 glow-purple opacity-50" />
          <div className="relative">
            <Brain className="w-10 h-10 mx-auto mb-6 text-violet-400" />
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient mb-5">Stop wondering.<br />Start simulating.</h2>
            <p className="text-white/55 max-w-md mx-auto mb-8">Run your first decision simulation now. Free. Takes 30 seconds.</p>
            <Button onClick={() => router.push('/decide')} className="h-12 px-7 rounded-full bg-white text-black hover:bg-white/90 text-sm font-medium">
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
