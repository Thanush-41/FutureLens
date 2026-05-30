'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Eye, Check, User, Briefcase, MapPin, DollarSign, GraduationCap, Heart, Target, TrendingUp, Loader2, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const steps = [
  { id: 'age',          icon: User,         title: 'How old are you?',   sub: 'Quick tap or enter your age.',                           required: true  },
  { id: 'occupation',   icon: Briefcase,    title: 'What do you do?',     sub: 'Pick a role or skip if it doesn\'t fit.',                required: false },
  { id: 'location',     icon: MapPin,       title: 'Where do you live?',  sub: 'City and country shape projections.',                    required: false },
  { id: 'income',       icon: DollarSign,   title: 'Money snapshot',      sub: 'Tap a range, optional. Used only for projections.',      required: false },
  { id: 'education',    icon: GraduationCap,title: 'Highest education',   sub: 'Optional.',                                              required: false },
  { id: 'relationship', icon: Heart,        title: 'Relationship status', sub: 'Optional.',                                              required: false },
  { id: 'goals',        icon: Target,       title: 'Your goals',          sub: 'Skip or share — in your own words.',                     required: false },
  { id: 'risk',         icon: TrendingUp,   title: 'Risk tolerance',      sub: 'How bold are you with major life moves?',                required: true  },
]

const ageChips = ['18-24', '25-29', '30-34', '35-39', '40-49', '50+']
const occupationChips = ['Software Engineer', 'Product Manager', 'Designer', 'Founder', 'Marketing', 'Sales', 'Finance', 'Doctor', 'Teacher', 'Student', 'Consultant', 'Other']
const locationChips = ['Bangalore, India', 'Mumbai, India', 'Delhi, India', 'New York, USA', 'San Francisco, USA', 'London, UK', 'Singapore', 'Dubai, UAE', 'Berlin, Germany', 'Toronto, Canada']
const currencyOpts = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'AED']
const incomeChipsByCurrency = {
  INR: [
    { label: '< 5L', value: 400000 }, { label: '5-15L', value: 1000000 }, { label: '15-30L', value: 2200000 },
    { label: '30-60L', value: 4500000 }, { label: '60L-1Cr', value: 8000000 }, { label: '1Cr+', value: 15000000 },
  ],
  USD: [
    { label: '< $30K', value: 20000 }, { label: '$30-60K', value: 45000 }, { label: '$60-100K', value: 80000 },
    { label: '$100-200K', value: 150000 }, { label: '$200-400K', value: 300000 }, { label: '$400K+', value: 600000 },
  ],
}
const savingsChipsByCurrency = {
  INR: [
    { label: '< 1L', value: 50000 }, { label: '1-5L', value: 300000 }, { label: '5-20L', value: 1200000 },
    { label: '20-50L', value: 3500000 }, { label: '50L-1Cr', value: 7500000 }, { label: '1Cr+', value: 15000000 },
  ],
  USD: [
    { label: '< $5K', value: 2500 }, { label: '$5-25K', value: 15000 }, { label: '$25-100K', value: 60000 },
    { label: '$100-300K', value: 200000 }, { label: '$300K-1M', value: 600000 }, { label: '$1M+', value: 1500000 },
  ],
}
const educationOpts = ['High school', 'Diploma', "Bachelor's", "Master's", 'PhD', 'Self-taught', 'Other']
const relationshipOpts = ['Single', 'Dating', 'Engaged', 'Married', 'Divorced', 'Prefer not to say']
const riskOpts = [
  { value: 'low',    label: 'Cautious', desc: 'Prefers stability and predictability' },
  { value: 'medium', label: 'Balanced', desc: 'Comfortable with calculated risks' },
  { value: 'high',   label: 'Bold',     desc: 'Willing to bet big for big upside' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [data, setData] = useState({
    age: '', occupation: '', location: '',
    annual_income: '', savings: '', currency: 'INR',
    education: '', relationship_status: '',
    career_goals: '', personal_goals: '',
    risk_tolerance: 'medium',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const existing = sessionStorage.getItem('futurelens_profile')
    if (existing) { try { setData(prev => ({ ...prev, ...JSON.parse(existing) })) } catch {} }
  }, [])

  const total = steps.length
  const progress = ((step + 1) / total) * 100
  const current = steps[step]

  const canContinue = () => {
    if (current.id === 'age')  return Number(data.age) >= 13 && Number(data.age) <= 99
    if (current.id === 'risk') return !!data.risk_tolerance
    return true // others optional
  }

  const incomeChips = incomeChipsByCurrency[data.currency] || incomeChipsByCurrency.USD
  const savingsChips = savingsChipsByCurrency[data.currency] || savingsChipsByCurrency.USD

  const goNext = async (skip = false) => {
    // If user is skipping an optional step, clear that step's data
    if (skip) {
      const reset = { ...data }
      if (current.id === 'occupation') reset.occupation = ''
      if (current.id === 'location')   reset.location = ''
      if (current.id === 'income')     { reset.annual_income = ''; reset.savings = '' }
      if (current.id === 'education')  reset.education = ''
      if (current.id === 'relationship') reset.relationship_status = ''
      if (current.id === 'goals')      { reset.career_goals = ''; reset.personal_goals = '' }
      setData(reset)
    }
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
    } catch {
      sessionStorage.setItem('futurelens_profile', JSON.stringify({ ...data, id: 'local-' + Date.now(), createdAt: new Date().toISOString() }))
      router.push('/decide')
    }
  }
  const back = () => { if (step > 0) setStep(step - 1) }

  const ageFromChip = (chip) => {
    if (chip === '18-24') return 21
    if (chip === '25-29') return 27
    if (chip === '30-34') return 32
    if (chip === '35-39') return 37
    if (chip === '40-49') return 44
    if (chip === '50+')   return 55
    return ''
  }

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
        <div className="flex items-center gap-3">
          <div className="text-xs text-white/40 font-mono">Step {step + 1} / {total}</div>
          {!current.required && (
            <button onClick={() => goNext(true)} className="text-xs text-white/50 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition">
              <SkipForward className="w-3 h-3" /> Skip
            </button>
          )}
        </div>
      </nav>

      <div className="relative max-w-2xl mx-auto px-6 mt-2">
        <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <main className="relative max-w-2xl mx-auto px-6 pt-12 pb-32">
        <div key={current.id} className="animate-fade-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <current.icon className="w-5 h-5 text-violet-400" />
            </div>
            <div className="text-xs uppercase tracking-widest text-violet-400 font-mono">
              Onboarding · {current.id}
              {!current.required && <span className="text-white/40 ml-2 normal-case tracking-normal">(optional)</span>}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gradient leading-tight">{current.title}</h1>
          <p className="mt-3 text-white/55 max-w-lg">{current.sub}</p>

          <div className="mt-10">
            {current.id === 'age' && (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {ageChips.map(c => (
                    <button key={c} onClick={() => setData({ ...data, age: ageFromChip(c) })}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium border transition ${Number(data.age) === ageFromChip(c) ? 'bg-white text-black border-white' : 'border-white/10 text-white/70 hover:bg-white/5'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="gradient-border rounded-2xl p-1">
                  <Input type="number" min={13} max={99} placeholder="or type exact age" value={data.age}
                    onChange={e => setData({ ...data, age: e.target.value })}
                    className="bg-transparent border-0 text-lg h-14 px-5 focus-visible:ring-0 placeholder:text-white/25"
                    onKeyDown={e => e.key === 'Enter' && canContinue() && goNext()} />
                </div>
              </div>
            )}

            {current.id === 'occupation' && (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {occupationChips.map(o => (
                    <button key={o} onClick={() => setData({ ...data, occupation: o })}
                      className={`px-3.5 py-2 rounded-full text-xs font-medium border transition ${data.occupation === o ? 'bg-white text-black border-white' : 'border-white/10 text-white/70 hover:bg-white/5'}`}>{o}</button>
                  ))}
                </div>
                <div className="gradient-border rounded-2xl p-1">
                  <Input placeholder="or type your role (e.g. Senior Backend Engineer)" value={data.occupation}
                    onChange={e => setData({ ...data, occupation: e.target.value })}
                    className="bg-transparent border-0 text-base h-14 px-5 focus-visible:ring-0 placeholder:text-white/25"
                    onKeyDown={e => e.key === 'Enter' && goNext()} />
                </div>
              </div>
            )}

            {current.id === 'location' && (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {locationChips.map(o => (
                    <button key={o} onClick={() => setData({ ...data, location: o })}
                      className={`px-3.5 py-2 rounded-full text-xs font-medium border transition ${data.location === o ? 'bg-white text-black border-white' : 'border-white/10 text-white/70 hover:bg-white/5'}`}>{o}</button>
                  ))}
                </div>
                <div className="gradient-border rounded-2xl p-1">
                  <Input placeholder="or type your city, country" value={data.location}
                    onChange={e => setData({ ...data, location: e.target.value })}
                    className="bg-transparent border-0 text-base h-14 px-5 focus-visible:ring-0 placeholder:text-white/25"
                    onKeyDown={e => e.key === 'Enter' && goNext()} />
                </div>
              </div>
            )}

            {current.id === 'income' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2 block">Currency</label>
                  <div className="flex flex-wrap gap-2">
                    {currencyOpts.map(c => (
                      <button key={c} onClick={() => setData({ ...data, currency: c })}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono border transition ${data.currency === c ? 'bg-white text-black border-white' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2 block">Annual income</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {incomeChips.map(c => (
                      <button key={c.label} onClick={() => setData({ ...data, annual_income: c.value })}
                        className={`px-3 py-2 rounded-full text-xs font-medium border transition ${Number(data.annual_income) === c.value ? 'bg-white text-black border-white' : 'border-white/10 text-white/70 hover:bg-white/5'}`}>{c.label}</button>
                    ))}
                  </div>
                  <div className="gradient-border rounded-2xl p-1">
                    <Input type="number" placeholder={`or exact (${data.currency})`} value={data.annual_income}
                      onChange={e => setData({ ...data, annual_income: e.target.value })}
                      className="bg-transparent border-0 text-base h-12 px-5 focus-visible:ring-0 placeholder:text-white/25" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2 block">Current savings</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {savingsChips.map(c => (
                      <button key={c.label} onClick={() => setData({ ...data, savings: c.value })}
                        className={`px-3 py-2 rounded-full text-xs font-medium border transition ${Number(data.savings) === c.value ? 'bg-white text-black border-white' : 'border-white/10 text-white/70 hover:bg-white/5'}`}>{c.label}</button>
                    ))}
                  </div>
                  <div className="gradient-border rounded-2xl p-1">
                    <Input type="number" placeholder={`or exact (${data.currency})`} value={data.savings}
                      onChange={e => setData({ ...data, savings: e.target.value })}
                      className="bg-transparent border-0 text-base h-12 px-5 focus-visible:ring-0 placeholder:text-white/25" />
                  </div>
                </div>
              </div>
            )}

            {current.id === 'education' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {educationOpts.map(o => (
                  <button key={o} onClick={() => setData({ ...data, education: o })}
                    className={`px-4 py-3.5 rounded-xl text-sm font-medium border transition text-left ${data.education === o ? 'bg-white text-black border-white' : 'border-white/10 text-white/80 hover:bg-white/5'}`}>{o}</button>
                ))}
              </div>
            )}

            {current.id === 'relationship' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {relationshipOpts.map(o => (
                  <button key={o} onClick={() => setData({ ...data, relationship_status: o })}
                    className={`px-4 py-3.5 rounded-xl text-sm font-medium border transition text-left ${data.relationship_status === o ? 'bg-white text-black border-white' : 'border-white/10 text-white/80 hover:bg-white/5'}`}>{o}</button>
                ))}
              </div>
            )}

            {current.id === 'goals' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2 block">Career goals</label>
                  <div className="gradient-border rounded-2xl p-1">
                    <Textarea placeholder="e.g. Become VP of Product within 7 years" value={data.career_goals}
                      onChange={e => setData({ ...data, career_goals: e.target.value })} rows={3}
                      className="resize-none bg-transparent border-0 text-sm leading-relaxed p-4 focus-visible:ring-0 placeholder:text-white/25" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2 block">Personal goals</label>
                  <div className="gradient-border rounded-2xl p-1">
                    <Textarea placeholder="e.g. Own a home, start a family, travel" value={data.personal_goals}
                      onChange={e => setData({ ...data, personal_goals: e.target.value })} rows={3}
                      className="resize-none bg-transparent border-0 text-sm leading-relaxed p-4 focus-visible:ring-0 placeholder:text-white/25" />
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
            <Button onClick={() => goNext(false)} disabled={!canContinue() || submitting}
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
