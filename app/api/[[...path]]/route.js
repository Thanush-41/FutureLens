import { NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'

// --- DB ---
let cachedClient = null
async function getDb() {
  if (cachedClient) return cachedClient.db(process.env.DB_NAME || 'futurelens')
  const client = new MongoClient(process.env.MONGO_URL)
  await client.connect()
  cachedClient = client
  return client.db(process.env.DB_NAME || 'futurelens')
}

// --- Gemini ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const MODEL = 'gemini-2.5-flash'

// JSON Schema for FutureLens structured output
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    decision: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        horizon_years: { type: Type.INTEGER },
      },
      required: ['text', 'horizon_years'],
    },
    scenarios: {
      type: Type.ARRAY,
      minItems: 5,
      maxItems: 5,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING, description: 'Short evocative title for this future scenario, like a headline' },
          year: { type: Type.INTEGER, description: 'The year within the horizon where this scenario plays out' },
          likelihood: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          description: { type: Type.STRING, description: '2-3 sentence vivid narrative of how this scenario unfolds' },
          key_drivers: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3-5 key factors that shape this scenario' },
          upside: { type: Type.STRING, description: 'One sentence on the best part of this scenario' },
          downside: { type: Type.STRING, description: 'One sentence on the worst part of this scenario' },
        },
        required: ['id', 'title', 'year', 'likelihood', 'description', 'key_drivers', 'upside', 'downside'],
      },
    },
    advisors: {
      type: Type.ARRAY,
      minItems: 4,
      maxItems: 4,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING, enum: ['financial_advisor', 'life_coach', 'risk_analyst', 'visionary'] },
          summary: { type: Type.STRING, description: '2-3 sentence summary of this advisor\'s point of view' },
          pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3 specific pros from this advisor\'s angle' },
          cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3 specific cons from this advisor\'s angle' },
          recommendation: { type: Type.STRING, enum: ['proceed', 'proceed_with_conditions', 'delay', 'do_not_proceed'] },
          confidence: { type: Type.NUMBER, description: 'Confidence score 0 to 1' },
        },
        required: ['role', 'summary', 'pros', 'cons', 'recommendation', 'confidence'],
      },
    },
    overall_recommendation: {
      type: Type.OBJECT,
      properties: {
        final_decision: { type: Type.STRING, enum: ['proceed', 'adjust', 'do_not_proceed', 'uncertain'] },
        headline: { type: Type.STRING, description: 'A single punchy sentence summarizing the final verdict (12-20 words max)' },
        rationale: { type: Type.STRING, description: '3-4 sentence narrative synthesizing the board\'s view' },
        top_pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: '4 most important pros across all advisors' },
        top_cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: '4 most important cons across all advisors' },
      },
      required: ['final_decision', 'headline', 'rationale', 'top_pros', 'top_cons'],
    },
  },
  required: ['decision', 'scenarios', 'advisors', 'overall_recommendation'],
}

const SYSTEM = `You are FutureLens, a world-class AI decision-simulation engine, modeled after the strategic clarity of Linear, Stripe, and Perplexity.

When given a major life decision and a time horizon, you do TWO things:

1) SCENARIOS — Imagine exactly 5 plausible distinct future scenarios over the horizon. Each must be vivid, specific, and grounded in the user's context. Mix likelihoods (some high, some medium, some low). Years should span the horizon (don't put them all at the end). Avoid clichés.

2) ADVISOR BOARD — Have exactly 4 advisor personas analyze the decision:
   - financial_advisor: focuses on money, income, wealth, cash flow, ROI
   - life_coach: focuses on meaning, fulfillment, relationships, growth
   - risk_analyst: focuses on threats, downside, volatility, what could go wrong
   - visionary: focuses on bold upside, possibilities, what could go incredibly right

Each advisor MUST have a distinct perspective. Their pros/cons should be concrete and non-overlapping. Confidence scores should be calibrated (0.5 = unsure, 0.8 = strong opinion).

3) FINAL VERDICT — Synthesize a single overall recommendation (proceed / adjust / do_not_proceed / uncertain) with a punchy headline and clear rationale.

TONE: Premium, precise, slightly bold. Like a senior strategist briefing a CEO. No fluff. No disclaimers. No 'as an AI' language.`

async function runSimulation({ decision, context, horizonYears }) {
  const userPrompt = `DECISION: ${decision}

${context ? `CONTEXT: ${context}\n\n` : ''}TIME HORIZON: ${horizonYears} years

Produce the FutureLens structured analysis now.`

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.75,
      maxOutputTokens: 8192,
    },
  })

  const text = response.text
  if (!text) throw new Error('Empty response from Gemini')
  return JSON.parse(text)
}

// --- Routes ---
export async function POST(req, { params }) {
  const path = (params?.path || []).join('/')
  try {
    if (path === 'simulate') {
      const body = await req.json()
      const { decision, context, horizonYears } = body
      if (!decision || decision.length < 10) {
        return NextResponse.json({ error: 'Decision must be at least 10 characters.' }, { status: 400 })
      }
      const horizon = Math.max(1, Math.min(15, parseInt(horizonYears) || 5))

      const result = await runSimulation({ decision, context: context || '', horizonYears: horizon })
      const id = uuidv4()
      const doc = {
        id,
        decision_input: decision,
        context_input: context || '',
        horizon_years: horizon,
        model: MODEL,
        ...result,
        createdAt: new Date().toISOString(),
      }
      try {
        const db = await getDb()
        await db.collection('simulations').insertOne(doc)
      } catch (e) {
        console.error('Mongo insert failed (continuing):', e.message)
      }
      const { _id, ...returnable } = doc
      return NextResponse.json(returnable)
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
      return NextResponse.json({ status: 'ok', model: MODEL })
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
