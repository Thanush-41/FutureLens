// Lightweight fetch-based Gemini client using X-goog-api-key header auth
// (Replaces @google/genai SDK because the proxy key requires header auth)

const API_KEY = process.env.GEMINI_API_KEY
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export async function generateJSON({ system, prompt, schema, temperature = 0.7, maxOutputTokens = 4096, model = MODEL }) {
  if (!API_KEY) throw new Error('GEMINI_API_KEY not configured')

  const url = `${BASE}/${model}:generateContent`
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: 'application/json',
      ...(schema ? { responseSchema: schema } : {}),
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': API_KEY,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini API ${res.status}: ${text.slice(0, 400)}`)
  }

  const data = await res.json()
  const txt = data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('') || ''
  const finishReason = data?.candidates?.[0]?.finishReason
  if (!txt) throw new Error('Empty response from Gemini. finishReason=' + finishReason)
  try {
    return JSON.parse(txt)
  } catch (e) {
    // Attempt repair: clip to last complete brace
    try {
      let s = txt.trim()
      if (!s.startsWith('{')) {
        const m = s.match(/\{[\s\S]*/)
        if (m) s = m[0]
      }
      // Walk and find last balanced position
      let depth = 0, inStr = false, esc = false, lastGood = -1
      for (let i = 0; i < s.length; i++) {
        const c = s[i]
        if (esc) { esc = false; continue }
        if (c === '\\') { esc = true; continue }
        if (c === '"') { inStr = !inStr; continue }
        if (inStr) continue
        if (c === '{' || c === '[') depth++
        else if (c === '}' || c === ']') { depth--; if (depth === 0) lastGood = i }
      }
      if (lastGood > 0) return JSON.parse(s.slice(0, lastGood + 1))
    } catch {}
    throw new Error('Failed to parse Gemini JSON (finishReason=' + finishReason + '): ' + txt.slice(0, 300))
  }
}
