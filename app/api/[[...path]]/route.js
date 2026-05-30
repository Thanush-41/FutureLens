import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { generateJSON } from '@/lib/gemini'

// --- DB ---
let cachedClient = null
async function getDb() {
  if (cachedClient) return cachedClient.db(process.env.DB_NAME || 'futurelens')
  const client = new MongoClient(process.env.MONGO_URL)
  await client.connect()
  cachedClient = client
  return client.db(process.env.DB_NAME || 'futurelens')
}

// =====================================================
// AGENT 1: User Context Agent
// =====================================================
function buildProfile(input) {
  return {
    id: input.id || uuidv4(),
    age: parseInt(input.age) || null,
    occupation: (input.occupation || '').trim(),
    location: (input.location || '').trim(),
    annual_income: parseInt(input.annual_income) || 0,
    savings: parseInt(input.savings) || 0,
    currency: input.currency || 'USD',
    education: input.education || '',
    relationship_status: input.relationship_status || '',
    career_goals: (input.career_goals || '').trim(),
    personal_goals: (input.personal_goals || '').trim(),
    risk_tolerance: input.risk_tolerance || 'medium',
    createdAt: new Date().toISOString(),
  }
}

function profileToContext(profile) {
  if (!profile) return ''
  const fields = [
    ['Age', profile.age],
    ['Occupation', profile.occupation],
    ['Location', profile.location],
    ['Annual income', profile.annual_income ? `${profile.currency || 'USD'} ${profile.annual_income.toLocaleString()}` : null],
    ['Savings', profile.savings ? `${profile.currency || 'USD'} ${profile.savings.toLocaleString()}` : null],
    ['Education', profile.education],
    ['Relationship', profile.relationship_status],
    ['Career goals', profile.career_goals],
    ['Personal goals', profile.personal_goals],
    ['Risk tolerance', profile.risk_tolerance],
  ].filter(([, v]) => v != null && v !== '')
  return 'USER PROFILE:\n' + fields.map(([k, v]) => `- ${k}: ${v}`).join('\n')
}

// =====================================================
// AGENT 2: Scenario Generator
// =====================================================
const scenarioSchema = {
  type: 'object',
  properties: {
    decision_question: { type: 'string' },
    paths: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['conservative', 'balanced', 'aggressive'] },
          title: { type: 'string', description: 'Evocative headline title (5-8 words)' },
          summary: { type: 'string' },
          narrative: { type: 'string', description: '3-5 sentences vividly describing how the future unfolds' },
          key_assumptions: { type: 'array', items: { type: 'string' } },
          benefits: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number' },
          timeline: {
            type: 'array',
            items: {
              type: 'object',
              properties: { year: { type: 'integer' }, milestone: { type: 'string' } },
              required: ['year', 'milestone'],
            },
          },
        },
        required: ['type', 'title', 'summary', 'narrative', 'key_assumptions', 'benefits', 'risks', 'confidence', 'timeline'],
      },
    },
  },
  required: ['decision_question', 'paths'],
}

const SCENARIO_SYSTEM = `You are the Scenario Generator Agent for FutureLens.

Given a user profile and decision question, produce EXACTLY 3 distinct future paths over a 5-year horizon:
1. CONSERVATIVE — cautious, safe, status-quo-preserving
2. BALANCED — pragmatic, moderate-risk
3. AGGRESSIVE — bold, ambitious, high-risk-high-reward

Each path: grounded in user profile, specific & vivid (real numbers/places/titles when possible), internally consistent, meaningfully different from the others. Short evocative titles. Concrete timeline milestones. JSON only.`

async function runScenarios({ profile, decision }) {
  const prompt = `${profileToContext(profile)}\n\nDECISION QUESTION: ${decision}\n\nGenerate the 3 future paths.`
  return generateJSON({ system: SCENARIO_SYSTEM, prompt, schema: scenarioSchema, temperature: 0.85, maxOutputTokens: 6144 })
}

// =====================================================
// AGENT 3: Financial Impact
// =====================================================
const financialSchema = {
  type: 'object',
  properties: {
    currency: { type: 'string' },
    horizon_years: { type: 'integer' },
    paths: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path_type: { type: 'string', enum: ['conservative', 'balanced', 'aggressive'] },
          financial_score: { type: 'integer' },
          income_growth_pct: { type: 'number' },
          ending_annual_income: { type: 'integer' },
          ending_savings: { type: 'integer' },
          cost_of_living_impact: { type: 'string' },
          wealth_accumulation: { type: 'integer' },
          financial_risk_score: { type: 'integer' },
          opportunities: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
          yearly_projection: {
            type: 'array',
            items: {
              type: 'object',
              properties: { year: { type: 'integer' }, income: { type: 'integer' }, savings: { type: 'integer' }, net_worth: { type: 'integer' } },
              required: ['year', 'income', 'savings', 'net_worth'],
            },
          },
        },
        required: ['path_type', 'financial_score', 'income_growth_pct', 'ending_annual_income', 'ending_savings', 'cost_of_living_impact', 'wealth_accumulation', 'financial_risk_score', 'opportunities', 'risks', 'summary', 'yearly_projection'],
      },
    },
  },
  required: ['currency', 'horizon_years', 'paths'],
}

const FINANCIAL_SYSTEM = `You are the Financial Impact Agent for FutureLens.

Given a user profile and 3 future scenarios, estimate 5-year financial impact for each path. Ground numbers in user's actual income, savings, location, currency. For each path: yearly_projection (years 1-5), opportunities, risks, scores. JSON only.`

async function runFinancial({ profile, decision, scenarios }) {
  const pathsSummary = scenarios.paths.map(p => `\n[${p.type.toUpperCase()}] ${p.title}\nSummary: ${p.summary}\nAssumptions: ${(p.key_assumptions || []).join('; ')}`).join('\n')
  const prompt = `${profileToContext(profile)}\n\nDECISION: ${decision}\n\nSCENARIOS:${pathsSummary}\n\nProject 5-year financial impact for each.`
  return generateJSON({ system: FINANCIAL_SYSTEM, prompt, schema: financialSchema, temperature: 0.5, maxOutputTokens: 8192 })
}

// =====================================================
// AGENT 4: Career Impact
// =====================================================
const careerSchema = {
  type: 'object',
  properties: {
    paths: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path_type: { type: 'string', enum: ['conservative', 'balanced', 'aggressive'] },
          career_score: { type: 'integer', description: 'Overall 5-year career outcome score 0-100' },
          growth_score: { type: 'integer', description: '0-100 career growth potential' },
          opportunity_score: { type: 'integer', description: '0-100 opportunity quality' },
          skill_development: { type: 'array', items: { type: 'string' }, description: '3 key skills developed' },
          network_opportunities: { type: 'array', items: { type: 'string' }, description: '2-3 network opportunities' },
          industry_exposure: { type: 'string', description: '1-2 sentences on industry exposure' },
          future_employability: { type: 'string', description: '1-2 sentences on employability in 5 years' },
          explanation: { type: 'string', description: '2-3 sentence summary of career outcome' },
        },
        required: ['path_type', 'career_score', 'growth_score', 'opportunity_score', 'skill_development', 'network_opportunities', 'industry_exposure', 'future_employability', 'explanation'],
      },
    },
  },
  required: ['paths'],
}

const CAREER_SYSTEM = `You are the Career Impact Agent for FutureLens.

Evaluate the 5-year CAREER outcomes of each scenario path. Analyze: career growth potential, skill development, network opportunities, industry exposure, future employability. Provide career_score, growth_score, opportunity_score (each 0-100). Be specific and grounded in the user's profile and the scenario. JSON only.`

async function runCareer({ profile, decision, scenarios }) {
  const pathsSummary = scenarios.paths.map(p => `\n[${p.type.toUpperCase()}] ${p.title}\nNarrative: ${p.narrative}`).join('\n')
  const prompt = `${profileToContext(profile)}\n\nDECISION: ${decision}\n\nSCENARIOS:${pathsSummary}\n\nEvaluate career impact for each path.`
  return generateJSON({ system: CAREER_SYSTEM, prompt, schema: careerSchema, temperature: 0.5, maxOutputTokens: 4096 })
}

// =====================================================
// AGENT 5: Lifestyle Impact
// =====================================================
const lifestyleSchema = {
  type: 'object',
  properties: {
    paths: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path_type: { type: 'string', enum: ['conservative', 'balanced', 'aggressive'] },
          lifestyle_score: { type: 'integer', description: 'Overall lifestyle quality 0-100' },
          work_life_balance: { type: 'integer', description: '0-100' },
          stress_level: { type: 'integer', description: '0-100 where higher = more stressful' },
          family_impact: { type: 'integer', description: '0-100 positive impact on family' },
          time_freedom: { type: 'integer', description: '0-100' },
          location_advantage: { type: 'integer', description: '0-100 location desirability' },
          happiness_index: { type: 'integer', description: '0-100 predicted happiness' },
          benefits: { type: 'array', items: { type: 'string' } },
          risk_factors: { type: 'array', items: { type: 'string' } },
          explanation: { type: 'string', description: '2-3 sentence lifestyle summary' },
        },
        required: ['path_type', 'lifestyle_score', 'work_life_balance', 'stress_level', 'family_impact', 'time_freedom', 'location_advantage', 'happiness_index', 'benefits', 'risk_factors', 'explanation'],
      },
    },
  },
  required: ['paths'],
}

const LIFESTYLE_SYSTEM = `You are the Lifestyle Impact Agent for FutureLens.

Evaluate the 5-year LIFESTYLE quality of each scenario path. Score (0-100): work_life_balance, stress_level (higher = MORE stressful), family_impact, time_freedom, location_advantage, happiness_index, overall lifestyle_score. List specific benefits and risk_factors. JSON only.`

async function runLifestyle({ profile, decision, scenarios }) {
  const pathsSummary = scenarios.paths.map(p => `\n[${p.type.toUpperCase()}] ${p.title}\nNarrative: ${p.narrative}`).join('\n')
  const prompt = `${profileToContext(profile)}\n\nDECISION: ${decision}\n\nSCENARIOS:${pathsSummary}\n\nEvaluate lifestyle impact for each path.`
  return generateJSON({ system: LIFESTYLE_SYSTEM, prompt, schema: lifestyleSchema, temperature: 0.5, maxOutputTokens: 4096 })
}

// =====================================================
// ROUTES
// =====================================================
export async function POST(req, { params }) {
  const segs = params?.path || []
  const path = segs.join('/')
  try {
    if (path === 'profile') {
      const body = await req.json()
      const profile = buildProfile(body)
      try { const db = await getDb(); await db.collection('profiles').insertOne({ ...profile }) } catch (e) { console.error('Mongo profile err:', e.message) }
      return NextResponse.json(profile)
    }

    if (path === 'simulate') {
      const body = await req.json()
      const { decision, profile } = body
      if (!decision || decision.length < 8) return NextResponse.json({ error: 'Decision must be at least 8 characters.' }, { status: 400 })
      if (!profile) return NextResponse.json({ error: 'Profile is required.' }, { status: 400 })

      // Agent 2: Scenarios
      const scenarios = await runScenarios({ profile, decision })

      // Agents 3, 4, 5 in PARALLEL (all depend on scenarios but not each other)
      const [financial, career, lifestyle] = await Promise.all([
        runFinancial({ profile, decision, scenarios }).catch(e => ({ error: e.message })),
        runCareer({ profile, decision, scenarios }).catch(e => ({ error: e.message })),
        runLifestyle({ profile, decision, scenarios }).catch(e => ({ error: e.message })),
      ])

      const id = uuidv4()
      const doc = {
        id, decision, profile_snapshot: profile,
        scenarios, financial, career, lifestyle,
        createdAt: new Date().toISOString(),
      }
      try { const db = await getDb(); await db.collection('simulations').insertOne({ ...doc }) } catch (e) { console.error('Mongo sim err:', e.message) }
      return NextResponse.json(doc)
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (e) {
    console.error('POST error:', e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}

export async function GET(req, { params }) {
  const segs = params?.path || []
  try {
    if (segs[0] === 'simulate' && segs[1]) {
      const id = segs[1]
      const db = await getDb()
      const doc = await db.collection('simulations').findOne({ id })
      if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const { _id, ...returnable } = doc
      return NextResponse.json(returnable)
    }
    if (segs[0] === 'health') return NextResponse.json({ status: 'ok', model: process.env.GEMINI_MODEL || 'gemini-flash-latest', has_key: !!process.env.GEMINI_API_KEY })
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
