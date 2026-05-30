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
// AGENT 1: User Context Agent (structuring + validation)
// =====================================================
// Schema validation only; takes raw form data and returns structured profile.
function buildProfile(input) {
  const p = {
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
    risk_tolerance: input.risk_tolerance || 'medium', // low | medium | high
    createdAt: new Date().toISOString(),
  }
  return p
}

function profileToContext(profile) {
  if (!profile) return ''
  return `USER PROFILE:
- Age: ${profile.age || 'unspecified'}
- Occupation: ${profile.occupation || 'unspecified'}
- Location: ${profile.location || 'unspecified'}
- Annual income: ${profile.currency || 'USD'} ${profile.annual_income?.toLocaleString() || 'unspecified'}
- Savings: ${profile.currency || 'USD'} ${profile.savings?.toLocaleString() || 'unspecified'}
- Education: ${profile.education || 'unspecified'}
- Relationship: ${profile.relationship_status || 'unspecified'}
- Career goals: ${profile.career_goals || 'unspecified'}
- Personal goals: ${profile.personal_goals || 'unspecified'}
- Risk tolerance: ${profile.risk_tolerance || 'medium'}`
}

// =====================================================
// AGENT 2: Scenario Generator (Conservative / Balanced / Aggressive)
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
          title: { type: 'string', description: 'Short evocative headline title (5-8 words)' },
          summary: { type: 'string', description: 'One-sentence summary of this path' },
          narrative: { type: 'string', description: '3-5 sentences vividly describing how the future unfolds on this path' },
          key_assumptions: { type: 'array', items: { type: 'string' } },
          benefits: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number', description: '0 to 1 confidence in this path playing out' },
          timeline: {
            type: 'array',
            description: '4-6 milestones with year offset from today',
            items: {
              type: 'object',
              properties: {
                year: { type: 'integer', description: 'Years from now (1-N)' },
                milestone: { type: 'string' },
              },
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

Given a user profile and a decision question, produce EXACTLY 3 distinct future paths over a 5-year horizon:
1. CONSERVATIVE — the cautious, safe, status-quo-preserving path
2. BALANCED — the pragmatic, moderate-risk middle path
3. AGGRESSIVE — the bold, ambitious, high-risk-high-reward path

Each path must be:
- Grounded in the user's actual profile (age, income, location, goals, risk tolerance)
- Specific and vivid (use real numbers, places, role titles when possible)
- Internally consistent
- Different from the other two paths in meaningful ways

Use short evocative titles, like newspaper headlines.
Timeline milestones should be concrete (e.g., 'Promoted to Senior PM at ₹45 LPA', 'Bought 2BHK in Whitefield').
Return ONLY the JSON conforming to schema. No prose outside.`

async function runScenarios({ profile, decision }) {
  const prompt = `${profileToContext(profile)}

DECISION QUESTION: ${decision}

Generate the 3 future paths.`
  return generateJSON({
    system: SCENARIO_SYSTEM,
    prompt,
    schema: scenarioSchema,
    temperature: 0.85,
    maxOutputTokens: 6144,
  })
}

// =====================================================
// AGENT 3: Financial Impact Agent
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
          financial_score: { type: 'integer', description: '0-100 overall financial health score for this path' },
          income_growth_pct: { type: 'number', description: 'Estimated total income growth percent over horizon (e.g. 45 means +45%)' },
          ending_annual_income: { type: 'integer', description: 'Estimated annual income at end of horizon' },
          ending_savings: { type: 'integer', description: 'Estimated savings/net liquid wealth at end of horizon' },
          cost_of_living_impact: { type: 'string', description: 'Short description of cost of living change e.g. +20% due to relocation' },
          wealth_accumulation: { type: 'integer', description: 'Estimated total net worth at end of horizon' },
          financial_risk_score: { type: 'integer', description: '0-100 where higher = more risk' },
          opportunities: { type: 'array', items: { type: 'string' } },
          risks: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string', description: '2-3 sentence financial summary for this path' },
          yearly_projection: {
            type: 'array',
            description: 'Year-by-year projection of income and savings',
            items: {
              type: 'object',
              properties: {
                year: { type: 'integer' },
                income: { type: 'integer' },
                savings: { type: 'integer' },
                net_worth: { type: 'integer' },
              },
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

Given a user profile and 3 future scenario paths (conservative, balanced, aggressive) for a decision, estimate the financial consequences of each path over 5 years.

Ground your numbers in the user's CURRENT income, savings, location, and the realistic delta of each path. Use the user's stated currency. Be specific.

For each path:
- income_growth_pct: total percent change over horizon
- ending_annual_income, ending_savings, wealth_accumulation: integers in user's currency
- financial_score (0-100): combines wealth growth, stability, opportunity
- financial_risk_score (0-100): higher = riskier
- yearly_projection: 5 entries (year 1..5) with realistic income, savings, net_worth numbers
- opportunities and risks: 2-4 each, concrete and specific

Return ONLY valid JSON conforming to the schema.`

async function runFinancial({ profile, decision, scenarios }) {
  const pathsSummary = scenarios.paths.map(p => `\n[${p.type.toUpperCase()}] ${p.title}\nSummary: ${p.summary}\nKey assumptions: ${(p.key_assumptions || []).join('; ')}`).join('\n')

  const prompt = `${profileToContext(profile)}

DECISION QUESTION: ${decision}

SCENARIO PATHS TO ANALYZE FINANCIALLY:${pathsSummary}

Estimate the 5-year financial impact for each path.`
  return generateJSON({
    system: FINANCIAL_SYSTEM,
    prompt,
    schema: financialSchema,
    temperature: 0.5,
    maxOutputTokens: 8192,
  })
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
      try {
        const db = await getDb()
        await db.collection('profiles').insertOne({ ...profile })
      } catch (e) { console.error('Mongo profile insert error:', e.message) }
      return NextResponse.json(profile)
    }

    if (path === 'simulate') {
      const body = await req.json()
      const { decision, profile } = body
      if (!decision || decision.length < 8) {
        return NextResponse.json({ error: 'Decision must be at least 8 characters.' }, { status: 400 })
      }
      if (!profile) {
        return NextResponse.json({ error: 'Profile is required. Please complete onboarding.' }, { status: 400 })
      }

      // Agent 2: Generate scenarios
      const scenarios = await runScenarios({ profile, decision })
      // Agent 3: Financial analysis
      const financial = await runFinancial({ profile, decision, scenarios })

      const id = uuidv4()
      const doc = {
        id,
        decision,
        profile_snapshot: profile,
        scenarios,
        financial,
        createdAt: new Date().toISOString(),
      }
      try {
        const db = await getDb()
        await db.collection('simulations').insertOne({ ...doc })
      } catch (e) { console.error('Mongo sim insert error:', e.message) }

      return NextResponse.json(doc)
    }

    if (path === 'simulate/scenarios') {
      const body = await req.json()
      const { decision, profile } = body
      const scenarios = await runScenarios({ profile, decision })
      return NextResponse.json(scenarios)
    }

    if (path === 'simulate/financial') {
      const body = await req.json()
      const { decision, profile, scenarios } = body
      const financial = await runFinancial({ profile, decision, scenarios })
      return NextResponse.json(financial)
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
    if (segs[0] === 'health') {
      return NextResponse.json({ status: 'ok', model: process.env.GEMINI_MODEL || 'gemini-flash-latest', has_key: !!process.env.GEMINI_API_KEY })
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
