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
// AGENT 6: Personal Board of Directors
// =====================================================
const boardSchema = {
  type: 'object',
  properties: {
    board: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          advisor_id: { type: 'string', enum: ['elon', 'buffett', 'jobs', 'naval', 'huberman', 'mukund'] },
          overall_opinion: { type: 'string', description: '2-3 sentences in this advisor\'s authentic voice and philosophy' },
          biggest_opportunity: { type: 'string', description: '1 sentence on what excites them most about the decision' },
          biggest_risk: { type: 'string', description: '1 sentence on what concerns them most' },
          preferred_path: { type: 'string', enum: ['conservative', 'balanced', 'aggressive'] },
          confidence: { type: 'integer', description: '0-100' },
          one_line_advice: { type: 'string', description: 'A memorable, quote-worthy single sentence representing their philosophy' },
        },
        required: ['advisor_id', 'overall_opinion', 'biggest_opportunity', 'biggest_risk', 'preferred_path', 'confidence', 'one_line_advice'],
      },
    },
    consensus: {
      type: 'object',
      properties: {
        conservative_votes: { type: 'integer' },
        balanced_votes: { type: 'integer' },
        aggressive_votes: { type: 'integer' },
        majority_path: { type: 'string', enum: ['conservative', 'balanced', 'aggressive'] },
        key_disagreement: { type: 'string', description: '2 sentences summarizing where the board most disagrees' },
      },
      required: ['conservative_votes', 'balanced_votes', 'aggressive_votes', 'majority_path', 'key_disagreement'],
    },
  },
  required: ['board', 'consensus'],
}

const BOARD_SYSTEM = `You are simulating a Personal Board of Directors meeting for FutureLens. Six legendary advisors weigh in on the user's decision. Each must speak authentically in their own voice and philosophy. They MUST disagree naturally — consensus is NOT the goal; revealing trade-offs IS.

THE ADVISORS:

1. elon — ELON MUSK (Visionary Innovator)
   Philosophy: First principles. Civilization-scale impact. Optimize for breakthrough outcomes. Accept short-term pain for long-term transformation.
   Evaluates: magnitude of opportunity, potential for innovation, long-term impact, competitive advantage, speed of execution.
   Asks: "Does this create something important? What if constraints were removed? Is the upside worth the risk? Can this become 10x bigger?"
   Style: Direct, ambitious, first-principles driven.
   Bias: tolerates extreme risk; can underestimate personal stress.

2. buffett — WARREN BUFFETT (Value Investor)
   Philosophy: Never lose money. Protect downside before upside. Long-term compounding. Avoid unnecessary risk.
   Evaluates: financial stability, opportunity cost, risk-adjusted return, probability of success, sustainability.
   Asks: "What if everything goes wrong? Can the downside be survived? Worth the risk? Would I still make this in 10 years?"
   Style: Calm, logical, probability-based.
   Bias: can be overly conservative.

3. jobs — STEVE JOBS (Product Visionary)
   Philosophy: Build something people love. Craftsmanship. Meaning over money. Simplicity equals excellence.
   Evaluates: quality, user experience, purpose, creativity, differentiation.
   Asks: "Does this create something remarkable? Is this meaningful work? Will people truly care?"
   Style: Passionate, opinionated, product-focused.
   Bias: can ignore practical constraints.

4. naval — NAVAL RAVIKANT (Leverage & Freedom Advisor)
   Philosophy: Seek ownership, not income. Build leverage through code, capital, media, people. Optimize for freedom. Think in decades.
   Evaluates: ownership, leverage, scalability, long-term wealth, freedom.
   Asks: "Does this increase leverage? Freedom? Wealth while you sleep? Is this compounding?"
   Style: Philosophical, concise, strategic.
   Bias: can undervalue short-term stability.

5. huberman — ANDREW HUBERMAN (Human Performance Coach)
   Philosophy: Sustainable success needs sustainable biology. Energy is the foundation. Performance depends on health.
   Evaluates: stress, sleep, physical health, mental health, sustainability.
   Asks: "Can you sustain this for years? What happens to sleep? Stress? Does this improve or damage performance?"
   Style: Scientific, evidence-based, practical.
   Bias: too cautious about aggressive opportunities.

6. mukund — MUKUND JHA (Product & Growth Strategist)
   Philosophy: Customer truth beats assumptions. Execution beats ideas. Validation before scale.
   Evaluates: product-market fit, customer demand, growth, execution, timing.
   Asks: "Have you validated? What evidence supports demand? Can this scale? What are customers saying?"
   Style: Practical, customer-focused, execution-oriented.
   Bias: may prioritize validation over bold experimentation.

RULES:
- Each advisor MUST have a distinct voice and pick a preferred_path that authentically reflects their philosophy.
- Force disagreement: at least 2 different preferred_paths must appear across the 6 advisors. Ideally 3.
- one_line_advice must be quote-worthy and feel like the advisor actually said it.
- Confidence is the advisor's confidence in THEIR own recommendation, not the decision quality.
- Compute consensus votes accurately based on preferred_path choices.
- Return ONLY valid JSON conforming to the schema.`

async function runBoard({ profile, decision, scenarios }) {
  const pathsSummary = scenarios.paths.map(p => `\n[${p.type.toUpperCase()}] ${p.title}\nSummary: ${p.summary}\nNarrative: ${p.narrative}`).join('\n')
  const prompt = `${profileToContext(profile)}\n\nDECISION: ${decision}\n\nSCENARIOS UNDER DISCUSSION:${pathsSummary}\n\nConvene the board meeting. All 6 advisors must weigh in. Disagreement encouraged.`
  return generateJSON({ system: BOARD_SYSTEM, prompt, schema: boardSchema, temperature: 0.85, maxOutputTokens: 4096 })
}

// =====================================================
// CUSTOM ADVISOR (single arbitrary person)
// =====================================================
const singleAdvisorSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    role: { type: 'string', description: 'A 2-4 word tagline describing the advisor (e.g. "Tech Entrepreneur", "Investor & Philanthropist")' },
    overall_opinion: { type: 'string', description: '2-3 sentences in this person\'s authentic voice and worldview' },
    biggest_opportunity: { type: 'string' },
    biggest_risk: { type: 'string' },
    preferred_path: { type: 'string', enum: ['conservative', 'balanced', 'aggressive'] },
    confidence: { type: 'integer' },
    one_line_advice: { type: 'string', description: 'A quote-worthy, memorable sentence representing their philosophy' },
  },
  required: ['name', 'role', 'overall_opinion', 'biggest_opportunity', 'biggest_risk', 'preferred_path', 'confidence', 'one_line_advice'],
}

const ADVISOR_SYSTEM = `You are simulating a single famous (or family/personal) advisor weighing in on a user's life decision in FutureLens.

Given the advisor's NAME, embody their authentic public voice, philosophy, life experience, and worldview. If the name is a famous person, reflect their known thinking style and values accurately. If it's a generic family role ("my grandmother", "my mentor", "a wise CFO"), invent a believable archetype.

Each response MUST include:
- A short role/tagline (2-4 words) that captures their identity
- An authentic 2-3 sentence opinion in their voice
- Their honest biggest_opportunity and biggest_risk view on the decision
- Which scenario path they'd choose (conservative / balanced / aggressive)
- A confidence score 0-100
- A quote-worthy one-line advice that sounds like something they'd actually say

Be true to the person — don't sanitize. If they would push toward aggression, push hard. If they would urge caution, do so. JSON only.`

async function runSingleAdvisor({ name, profile, decision, scenarios }) {
  const pathsSummary = (scenarios?.paths || []).map(p => `\n[${p.type.toUpperCase()}] ${p.title}: ${p.summary}`).join('\n')
  const prompt = `ADVISOR NAME: ${name}\n\n${profileToContext(profile)}\n\nDECISION: ${decision}\n\nSCENARIOS:${pathsSummary}\n\nProvide ${name}'s perspective.`
  return generateJSON({ system: ADVISOR_SYSTEM, prompt, schema: singleAdvisorSchema, temperature: 0.85, maxOutputTokens: 2048 })
}

// =====================================================
// AGENT 7: Consensus & Dissent Analysis
// =====================================================
const consensusSchema = {
  type: 'object',
  properties: {
    recommendation: {
      type: 'object',
      properties: {
        recommended_path: { type: 'string', enum: ['conservative', 'balanced', 'aggressive'] },
        confidence: { type: 'integer', description: '0-100 overall confidence in recommendation' },
        headline: { type: 'string', description: 'A punchy 10-15 word executive headline summarizing the final recommendation' },
        executive_summary: { type: 'string', description: '3-4 sentence McKinsey-style executive summary stating the verdict and primary reasoning' },
        top_opportunities: {
          type: 'array',
          description: '3-4 top opportunities synthesized from all agents',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: '3-6 word punchy title' },
              description: { type: 'string', description: '1-2 sentence detail' },
            },
            required: ['title', 'description'],
          },
        },
        top_risks: {
          type: 'array',
          description: '3-4 top risks synthesized from all agents',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: '3-6 word punchy title' },
              description: { type: 'string', description: '1-2 sentence detail' },
              severity: { type: 'string', enum: ['low', 'medium', 'high'] },
            },
            required: ['title', 'description', 'severity'],
          },
        },
        supporting_reasons: {
          type: 'array',
          description: '4-6 specific reasons. Each cites which agent the insight came from.',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string', enum: ['financial', 'career', 'lifestyle', 'board'] },
              point: { type: 'string', description: '1 sentence specific insight' },
            },
            required: ['source', 'point'],
          },
        },
        action_items: {
          type: 'array',
          description: '3-5 concrete next steps the user should take this month',
          items: { type: 'string' },
        },
      },
      required: ['recommended_path', 'confidence', 'headline', 'executive_summary', 'top_opportunities', 'top_risks', 'supporting_reasons', 'action_items'],
    },
    dissent: {
      type: 'object',
      properties: {
        agreements: {
          type: 'array',
          description: '2-3 things ALL board members and analytical agents agree on',
          items: { type: 'string' },
        },
        disagreements: {
          type: 'array',
          description: '2-3 specific points where the board fundamentally disagrees',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string', description: '2-4 word topic name e.g. "Risk Appetite", "Time Horizon"' },
              stance_a: { type: 'string', description: 'One side\'s position in 1 sentence' },
              stance_b: { type: 'string', description: 'The opposing position in 1 sentence' },
              advisors_a: { type: 'array', items: { type: 'string' }, description: 'advisor_ids on side A' },
              advisors_b: { type: 'array', items: { type: 'string' }, description: 'advisor_ids on side B' },
              tradeoff: { type: 'string', description: '1 sentence on the underlying tradeoff' },
            },
            required: ['topic', 'stance_a', 'stance_b', 'advisors_a', 'advisors_b', 'tradeoff'],
          },
        },
        key_tradeoffs: {
          type: 'array',
          description: '3 key tradeoffs the user is implicitly making',
          items: {
            type: 'object',
            properties: {
              gain: { type: 'string', description: 'What is gained' },
              cost: { type: 'string', description: 'What is sacrificed' },
            },
            required: ['gain', 'cost'],
          },
        },
      },
      required: ['agreements', 'disagreements', 'key_tradeoffs'],
    },
  },
  required: ['recommendation', 'dissent'],
}

const CONSENSUS_SYSTEM = `You are Agent 7: the Consensus & Dissent Analyst for FutureLens. You synthesize the work of all other agents into a single executive recommendation, AND surface where the board genuinely disagrees.

INPUTS YOU RECEIVE:
- The user profile and decision
- 3 scenario paths (conservative, balanced, aggressive)
- Financial agent: per-path projections and risk
- Career agent: per-path career outcomes
- Lifestyle agent: per-path lifestyle scores
- Board of Directors: 6 advisors with their preferred path and opinions

YOUR JOB:

1) RECOMMENDATION — Produce a McKinsey-style executive summary:
   - A bold but specific recommendation (which path and why)
   - 3-4 top opportunities and 3-4 top risks distilled across all agents
   - 4-6 supporting reasons, EACH citing which agent provided the insight (financial / career / lifestyle / board)
   - 3-5 action items the user can act on this month
   - Punchy headline (10-15 words)

2) DISSENT ANALYSIS — Reveal trade-offs:
   - 2-3 strong agreements across the board and analytical agents
   - 2-3 genuine disagreements with both sides, the specific advisors on each side, and the underlying tradeoff
   - 3 key tradeoffs the user is implicitly accepting (gain vs cost)

TONE: Confident, precise, slightly understated. Like a senior strategy consultant briefing a CEO. No fluff. JSON only.`

async function runConsensus({ profile, decision, scenarios, financial, career, lifestyle, board }) {
  const pathsSum = scenarios.paths.map(p => `[${p.type}] ${p.title} — ${p.summary}`).join('\n')
  const finSum = (financial?.paths || []).map(f => `[${f.path_type}] score=${f.financial_score} risk=${f.financial_risk_score} ending_savings=${f.ending_savings} growth=${f.income_growth_pct}% summary=${f.summary}`).join('\n')
  const carSum = (career?.paths || []).map(c => `[${c.path_type}] career=${c.career_score} growth=${c.growth_score} opp=${c.opportunity_score} note=${c.explanation}`).join('\n')
  const lifeSum = (lifestyle?.paths || []).map(l => `[${l.path_type}] lifestyle=${l.lifestyle_score} stress=${l.stress_level} happy=${l.happiness_index} wlb=${l.work_life_balance} note=${l.explanation}`).join('\n')
  const boardSum = (board?.board || []).map(b => `[${b.advisor_id}] votes=${b.preferred_path} (${b.confidence}%) | "${b.one_line_advice}" | ${b.overall_opinion}`).join('\n')
  const cons = board?.consensus
  const consSum = cons ? `Board votes: conservative=${cons.conservative_votes}, balanced=${cons.balanced_votes}, aggressive=${cons.aggressive_votes} (majority: ${cons.majority_path})` : ''

  const prompt = `${profileToContext(profile)}\n\nDECISION: ${decision}\n\nSCENARIO PATHS:\n${pathsSum}\n\nFINANCIAL AGENT:\n${finSum}\n\nCAREER AGENT:\n${carSum}\n\nLIFESTYLE AGENT:\n${lifeSum}\n\nBOARD ADVISORS:\n${boardSum}\n\n${consSum}\n\nProduce the executive recommendation and dissent analysis.`
  return generateJSON({ system: CONSENSUS_SYSTEM, prompt, schema: consensusSchema, temperature: 0.6, maxOutputTokens: 6144 })
}

// =====================================================
// FUTURE SELF CHAT
// =====================================================
async function runFutureSelfChat({ profile, decision, scenarios, recommendation, years_ahead, history = [], message }) {
  const path = recommendation?.recommended_path || 'balanced'
  const chosenScenario = scenarios?.paths?.find(p => p.type === path)
  const pathContext = chosenScenario ? `THE PATH YOU CHOSE (${path}): ${chosenScenario.title}\n${chosenScenario.narrative}\nTimeline: ${(chosenScenario.timeline||[]).map(t => `Y${t.year}: ${t.milestone}`).join(' | ')}` : ''

  const system = `You are the USER themselves, ${years_ahead} years in the future, having lived through the consequences of the decision they're currently making.

WHO YOU ARE NOW (${years_ahead} years from today):
- Today they are ${profile.age}, you are ${(profile.age || 30) + years_ahead}. ${years_ahead === 10 ? 'You\'ve had a full decade to live with this choice.' : 'You\'ve had 5 years to see how this played out.'}
- Original location: ${profile.location || 'unknown'}. Today's occupation: ${profile.occupation || 'unknown'}
- Decision they faced: "${decision}"
- They chose the ${path.toUpperCase()} path.

${pathContext}

EXECUTIVE SUMMARY THAT WAS GIVEN TO THEM:
${recommendation?.executive_summary || ''}

TOP OPPORTUNITIES TO REFLECT ON: ${(recommendation?.top_opportunities || []).map(o => o.title).join(', ')}
TOP RISKS THAT WERE FLAGGED: ${(recommendation?.top_risks || []).map(o => o.title).join(', ')}

HOW TO SPEAK:
- First person, warm but honest, like talking to your younger self.
- Be SPECIFIC: invent realistic details about what happened (companies, names, milestones, regrets, victories).
- Reference concrete years/moments. Mention 1-2 mistakes you wish you avoided.
- Each response should be 2-5 sentences. Don't be preachy. Sound human.
- Avoid generic platitudes. Reference details from the actual scenario.
- Never break character. Never say "as an AI". Never disclaim.

If the user (your past self) asks a question, answer it directly from your future vantage point.
If they have not asked anything yet (opening message), share a warm opening reflection of 3-4 short sentences that includes: where you are now, 1 thing that went right, 1 thing you wish you'd done differently.

Respond as plain text. No JSON, no markdown headers.`

  const turns = []
  for (const h of history) {
    turns.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] })
  }
  if (message && message.trim()) {
    turns.push({ role: 'user', parts: [{ text: message }] })
  } else if (turns.length === 0) {
    turns.push({ role: 'user', parts: [{ text: '(no question yet — share your opening reflection)' }] })
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-flash-latest'}:generateContent`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: turns,
      generationConfig: { temperature: 0.9, maxOutputTokens: 600 },
    }),
  })
  if (!res.ok) throw new Error('Future-self ' + res.status + ': ' + (await res.text()).slice(0, 200))
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('').trim() || ''
  if (!text) throw new Error('Empty future-self response')
  return { text }
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

      // Persist a session log entry first
      try {
        const dbS = await getDb()
        await dbS.collection('sessions').insertOne({
          session_id: uuidv4(),
          profile_id: profile.id || null,
          decision,
          started_at: new Date().toISOString(),
        })
      } catch (e) { console.error('Mongo session err:', e.message) }

      // Agent 2: Scenarios
      const scenarios = await runScenarios({ profile, decision })

      // Agents 3, 4, 5, 6 in PARALLEL
      const [financial, career, lifestyle, board] = await Promise.all([
        runFinancial({ profile, decision, scenarios }).catch(e => ({ error: e.message })),
        runCareer({ profile, decision, scenarios }).catch(e => ({ error: e.message })),
        runLifestyle({ profile, decision, scenarios }).catch(e => ({ error: e.message })),
        runBoard({ profile, decision, scenarios }).catch(e => ({ error: e.message })),
      ])

      // Agent 7: Consensus & Dissent — synthesizes all of the above
      const consensus = await runConsensus({ profile, decision, scenarios, financial, career, lifestyle, board }).catch(e => ({ error: e.message }))

      const id = uuidv4()
      const doc = {
        id, decision, profile_snapshot: profile,
        scenarios, financial, career, lifestyle, board, consensus,
        createdAt: new Date().toISOString(),
      }
      try { const db = await getDb(); await db.collection('simulations').insertOne({ ...doc }) } catch (e) { console.error('Mongo sim err:', e.message) }
      return NextResponse.json(doc)
    }

    if (path === 'simulate/advisor') {
      const body = await req.json()
      const { name, decision, profile, scenarios, simulation_id } = body
      if (!name || !name.trim()) return NextResponse.json({ error: 'Advisor name is required.' }, { status: 400 })
      if (!decision || !profile || !scenarios) return NextResponse.json({ error: 'Missing decision/profile/scenarios.' }, { status: 400 })
      const result = await runSingleAdvisor({ name: name.trim(), profile, decision, scenarios })
      // Persist custom advisor
      try {
        const db = await getDb()
        await db.collection('custom_advisors').insertOne({
          id: uuidv4(),
          simulation_id: simulation_id || null,
          asked_name: name.trim(),
          response: result,
          createdAt: new Date().toISOString(),
        })
      } catch (e) { console.error('Mongo advisor err:', e.message) }
      return NextResponse.json(result)
    }

    if (path === 'simulate/future-chat') {
      const body = await req.json()
      const { profile, decision, scenarios, recommendation, years_ahead, history, message, simulation_id } = body
      if (!profile || !decision || !scenarios || !recommendation) return NextResponse.json({ error: 'Missing context for future-chat.' }, { status: 400 })
      const ya = parseInt(years_ahead) === 10 ? 10 : 5
      const result = await runFutureSelfChat({ profile, decision, scenarios, recommendation, years_ahead: ya, history: history || [], message: message || '' })
      // Persist message exchange
      try {
        const db = await getDb()
        await db.collection('future_chats').insertOne({
          id: uuidv4(),
          simulation_id: simulation_id || null,
          years_ahead: ya,
          user_message: message || null,
          assistant_message: result.text,
          createdAt: new Date().toISOString(),
        })
      } catch (e) { console.error('Mongo future-chat err:', e.message) }
      return NextResponse.json(result)
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
    if (segs[0] === 'simulations') {
      // List simulations
      const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get('limit')) || 20)
      const db = await getDb()
      const items = await db.collection('simulations')
        .find({}, { projection: { _id: 0, id: 1, decision: 1, createdAt: 1, profile_snapshot: 1, 'consensus.recommendation.recommended_path': 1, 'consensus.recommendation.confidence': 1, 'consensus.recommendation.headline': 1 } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()
      return NextResponse.json({ items })
    }
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
