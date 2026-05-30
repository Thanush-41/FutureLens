'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Eye, Check, User, Briefcase, MapPin, DollarSign, GraduationCap, Heart, Target, Sparkles, TrendingUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const steps = [
  { id: 'age',           icon: User,         title: 'How old are you?',           sub: 'Helps tailor the time horizon and decisions.' },
  { id: 'occupation',    icon: Briefcase,    title: 'What do you do?',             sub: 'Your current role and industry context.' },
  { id: 'location',      icon: MapPin,       title: 'Where do you live?',          sub: 'City and country shape cost of living and opportunities.' },
  { id: 'income',        icon: DollarSign,   title: 'Income & savings',            sub: 'A rough estimate is fine. Used only for projections.' },
  { id: 'education',     icon: GraduationCap,title: 'Education level',             sub: 'Highest qualification completed.' },
  { id: 'relationship',  icon: Heart,        title: 'Relationship status',         sub: 'Affects life decisions in subtle ways.' },
  { id: 'goals',         icon: Target,       title: 'Your goals',                  sub: 'Where you want to be in 5–10 years.' },
  { id: 'risk',          icon: TrendingUp,   title: 'Risk tolerance',              sub: 'How bold are you with major life moves?' },
]

const educationOpts = ['High school', 'Diploma', "Bachelor's", "Master's", 'PhD', 'Other']
const relationshipOpts = ['Single', 'Dating', 'Engaged', 'Married', 'Divorced', 'Prefer not to say']
const riskOpts = [
  { value: 'low', label: 'Cautious', desc: 'Prefers stability and predictability' },
  { value: 'medium', label: 'Balanced', desc: 'Comfortable with calculated risks' },
  { value: 'high', label: 'Bold', desc: 'Willing to bet big for big upside' },
]
const currencyOpts = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'AED']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [data, setData] = useState({
    age: '', occupation: '', location: '',
    annual_income: '', savings: '', currency: 'USD',
    education: '', relationship_status: '',
    career_goals: '', personal_goals: '',
    risk_tolerance: 'medium',
  })

  useEffect(() => {
    // Preload if exists
    if (typeof window === 'undefined') return
    const existing = sessionStorage.getItem('futurelens_profile')
    if (existing) {
      try { setData(prev => ({ ...prev, ...JSON.parse(existing) })) } catch {}
    }
  }, [])

  const total = steps.length
  const progress = ((step + 1) / total) * 100
  const current = steps[step]

  const canNext = () => {
    switch (current.id) {
      case 'age': return Number(data.age) >= 13 && Number(data.age) <= 99
      case 'occupation': return data.occupation.trim().length >= 2
      case 'location': return data.location.trim().length >= 2
      case 'income': return data.annual_income !== '' && data.savings !== ''
      case 'education': return !!data.education
      case 'relationship': return !!data.relationship_status
      case 'goals': return data.career_goals.trim().length >= 10 && data.personal_goals.trim().length >= 10
      case 'risk': return !!data.risk_tolerance
      default: return true
    }
  }

  const next = async () => {
    if (step < total - 1) { setStep(step + 1); return }
    // Submit
    setSubmitting(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const profile = await res.json()
      sessionStorage.setItem('futurelens_profile', JSON.stringify(profile))
      router.push('/decide')
    } catch (e) {
      // Even if backend fails, store locally and continue
      sessionStorage.setItem('futurelens_profile', JSON.stringify({ ...data, id: 'local-' + Date.now(), createdAt: new Date().toISOString() }))
      router.push('/decide')
    }
  }

  const back = () => { if (step > 0) setStep(step - 1) }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="fixed inset-0 bg-radial-fade pointer-events-none" />
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] glow-purple pointer-events-none" />

      <nav className="relative z-50 px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
        <button onClick={() => router.push('/')} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Eye className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold tracking-tight">FutureLens</span>
        </button>
        <div className="text-xs text-white/40 font-mono">Step {step + 1} / {total}</div>
      </nav>

      {/* Progress bar */}
      <div className="relative max-w-2xl mx-auto px-6 mt-2">
        <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <main className="relative max-w-2xl mx-auto px-6 pt-12 pb-32">
        <div key={current.id} className="animate-fade-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <current.icon className="w-5 h-5 text-violet-400" />
            </div>
            <div className="text-xs uppercase tracking-widest text-violet-400 font-mono">Onboarding · {current.id}</div>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gradient leading-tight">{current.title}</h1>
          <p className="mt-3 text-white/55 max-w-lg">{current.sub}</p>

          <div className="mt-10">
            {current.id === 'age' && (
              <div className="gradient-border rounded-2xl p-1">
                <Input type="number" min={13} max={99} placeholder="29" value={data.age}
                  onChange={e => setData({ ...data, age: e.target.value })}
                  className="bg-transparent border-0 text-2xl h-16 px-5 focus-visible:ring-0 placeholder:text-white/20"
                  onKeyDown={e => e.key === 'Enter' && canNext() && next()}
                />
              </div>
            )}

            {current.id === 'occupation' && (
              <div className="gradient-border rounded-2xl p-1">
                <Input placeholder="e.g. Senior Software Engineer at a fintech" value={data.occupation}
                  onChange={e => setData({ ...data, occupation: e.target.value })}
                  className="bg-transparent border-0 text-lg h-14 px-5 focus-visible:ring-0 placeholder:text-white/20"
                  onKeyDown={e => e.key === 'Enter' && canNext() && next()}
                />
              </div>
            )}

            {current.id === 'location' && (
              <div className="gradient-border rounded-2xl p-1">
                <Input placeholder="e.g. Bangalore, India" value={data.location}
                  onChange={e => setData({ ...data, location: e.target.value })}
                  className="bg-transparent border-0 text-lg h-14 px-5 focus-visible:ring-0 placeholder:text-white/20"
                  onKeyDown={e => e.key === 'Enter' && canNext() && next()}
                />
              </div>
            )}

            {current.id === 'income' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2 block">Currency</label>
                  <div className="flex flex-wrap gap-2">
                    {currencyOpts.map(c => (
                      <button key={c} onClick={() => setData({ ...data, currency: c })}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono border transition ${data.currency === c ? 'bg-white text-black border-white' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2 block">Annual income ({data.currency})</label>
                  <div className="gradient-border rounded-2xl p-1">
                    <Input type="number" placeholder="e.g. 1200000" value={data.annual_income}
                      onChange={e => setData({ ...data, annual_income: e.target.value })}
                      className="bg-transparent border-0 text-lg h-14 px-5 focus-visible:ring-0 placeholder:text-white/20" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2 block">Current savings ({data.currency})</label>
                  <div className="gradient-border rounded-2xl p-1">
                    <Input type="number" placeholder="e.g. 800000" value={data.savings}
                      onChange={e => setData({ ...data, savings: e.target.value })}
                      className="bg-transparent border-0 text-lg h-14 px-5 focus-visible:ring-0 placeholder:text-white/20" />
                  </div>
                </div>
              </div>
            )}

            {current.id === 'education' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {educationOpts.map(o => (
                  <button key={o} onClick={() => setData({ ...data, education: o })}
                    className={`px-4 py-3.5 rounded-xl text-sm font-medium border transition text-left ${data.education === o ? 'bg-white text-black border-white' : 'border-white/10 text-white/80 hover:bg-white/5'}`}>
                    {o}
                  </button>
                ))}
              </div>
            )}

            {current.id === 'relationship' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {relationshipOpts.map(o => (
                  <button key={o} onClick={() => setData({ ...data, relationship_status: o })}
                    className={`px-4 py-3.5 rounded-xl text-sm font-medium border transition text-left ${data.relationship_status === o ? 'bg-white text-black border-white' : 'border-white/10 text-white/80 hover:bg-white/5'}`}>
                    {o}
                  </button>
                ))}
              </div>
            )}

            {current.id === 'goals' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2 block">Career goals</label>
                  <div className="gradient-border rounded-2xl p-1">
                    <Textarea placeholder="e.g. Become a VP of Product at a high-growth SaaS company within 7 years" value={data.career_goals}
                      onChange={e => setData({ ...data, career_goals: e.target.value })} rows={3}
                      className="resize-none bg-transparent border-0 text-sm leading-relaxed p-4 focus-visible:ring-0 placeholder:text-white/20" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2 block">Personal goals</label>
                  <div className="gradient-border rounded-2xl p-1">
                    <Textarea placeholder="e.g. Own a home, start a family, travel internationally twice a year" value={data.personal_goals}
                      onChange={e => setData({ ...data, personal_goals: e.target.value })} rows={3}
                      className="resize-none bg-transparent border-0 text-sm leading-relaxed p-4 focus-visible:ring-0 placeholder:text-white/20" />
                  </div>
                </div>
              </div>
            )}

            {current.id === 'risk' && (
              <div className="space-y-2">
                {riskOpts.map(o => (
                  <button key={o.value} onClick={() => setData({ ...data, risk_tolerance: o.value })}
                    className={`w-full text-left px-5 py-4 rounded-2xl border transition flex items-center justify-between ${data.risk_tolerance === o.value ? 'bg-white text-black border-white' : 'border-white/10 text-white/80 hover:bg-white/5'}`}>
                    <div>
                      <div className="font-medium">{o.label}</div>
                      <div className={`text-xs mt-0.5 ${data.risk_tolerance === o.value ? 'text-black/60' : 'text-white/45'}`}>{o.desc}</div>
                    </div>
                    {data.risk_tolerance === o.value && <Check className="w-5 h-5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-10 flex items-center gap-3">
            {step > 0 && (
              <Button variant="ghost" onClick={back} className="h-12 px-5 rounded-full border border-white/10 hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
            )}
            <Button onClick={next} disabled={!canNext() || submitting}
              className="flex-1 h-12 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed font-medium">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : (step === total - 1 ? 'Complete profile' : 'Continue')}
              {!submitting && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
