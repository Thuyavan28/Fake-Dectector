import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── API Key Rotation ─────────────────────────────────────────────────────────
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean); // remove any undefined keys

const MODEL = 'gemini-2.5-flash';

function geminiUrl(key) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
}

// Try each API key in order until one succeeds (not 429/400/expired)
async function callGeminiWithKeyRotation(body) {
  let lastError = null;

  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];
    console.log(`🔑 Trying API key ${i + 1}/${API_KEYS.length}...`);

    try {
      const res = await fetch(geminiUrl(key), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        console.log(`✅ Key ${i + 1} succeeded.`);
        return { res, ok: true };
      }

      const status = res.status;
      const errText = await res.text();

      // 429 = quota/rate limit, 400 with API_KEY_INVALID = expired key → try next
      if (status === 429 || (status === 400 && errText.includes('API_KEY_INVALID'))) {
        console.log(`⚠️  Key ${i + 1} failed (${status}) — trying next key...`);
        lastError = { status, errText };
        continue;
      }

      // Any other error — return it directly, no point trying other keys
      return { res: null, ok: false, status, errText };

    } catch (err) {
      console.log(`⚠️  Key ${i + 1} threw error: ${err.message} — trying next key...`);
      lastError = { status: 500, errText: err.message };
      continue;
    }
  }

  // All keys exhausted
  return {
    ok: false,
    status: 429,
    errText: lastError?.errText || 'All API keys exhausted. Please try again in a few minutes.'
  };
}

// ─── Parse Gemini JSON response safely ───────────────────────────────────────
async function parseGeminiResponse(res) {
  const geminiData = await res.json();
  let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    const finishReason = geminiData?.candidates?.[0]?.finishReason;
    if (finishReason) {
      console.error("❌ Gemini blocked request. Reason:", finishReason);
      return { error: `Gemini API blocked request: ${finishReason}` };
    }
    return { error: 'Empty response from Gemini API.' };
  }

  rawText = rawText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  const textToParse = jsonMatch ? jsonMatch[0] : rawText;

  try {
    const parsed = JSON.parse(textToParse);
    return { parsed };
  } catch (err) {
    console.error("❌ Strict parse failed, trying lax parse. Error:", err.message);
    try {
      // Clean up common JSON errors like trailing commas
      let cleanText = textToParse.replace(/,\s*([\]}])/g, '$1');
      
      const parsed = JSON.parse(cleanText);
      return { parsed };
    } catch (err2) {
      try {
        // Last resort: eval to allow unquoted keys or single quotes
        const evalParsed = (new Function(`return ${textToParse}`))();
        return { parsed: evalParsed };
      } catch (err3) {
        console.error("❌ All parsing failed. Raw output from Gemini was:", rawText);
        return { error: 'Failed to parse Gemini response.' };
      }
    }
  }
}

// ─── Warmup endpoint ──────────────────────────────────────────────────────────
app.get('/api/warmup', (req, res) => {
  res.json({ warmed: true, keys: API_KEYS.length, model: MODEL });
});

// ─── POST /api/analyze — Fake news detection ──────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided.' });
  }

  if (API_KEYS.length === 0) {
    return res.status(500).json({ error: 'No API keys configured.' });
  }

  const PROMPT = `Your knowledge includes events up to late 2024.
India won ICC T20 World Cup June 2024 defeating South Africa. Use this when fact-checking.

You are a strict fake news detection AI.
Return ONLY valid JSON, no markdown:
{
  "verdict": "REAL or FAKE",
  "confidence": number (0-100),
  "explanation": "clear reason",
  "corrected_fact": "only if FAKE, provide real fact",
  "data_points": {
     "labels": ["Truthfulness", "Source Credibility", "Evidence Quality", "Logic"],
     "values": [number, number, number, number]
  }
}`;

  const body = {
    contents: [{ parts: [{ text: PROMPT + '\n\nNews: ' + text.trim() }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' }
  };

  try {
    console.log('📡 Calling Gemini API...');
    const { res: gemRes, ok, status, errText } = await callGeminiWithKeyRotation(body);

    if (!ok) {
      console.error(`❌ All keys failed. Last status: ${status}`);
      return res.status(200).json({
        verdict: 'UNKNOWN',
        confidence: 0,
        explanation: 'Service temporarily unavailable. All API keys are rate-limited. Please wait 1-2 minutes and try again.',
        corrected_fact: '',
        data_points: { labels: ['Truthfulness', 'Source Credibility', 'Evidence Quality', 'Logic'], values: [0, 0, 0, 0] },
        engine: 'gemini',
        error_hint: 'quota_exceeded'
      });
    }

    const { parsed, error: parseError } = await parseGeminiResponse(gemRes);
    if (parseError) return res.status(502).json({ error: parseError });

    const verdict = parsed.verdict === 'FAKE' ? 'FAKE' : 'REAL';
    let confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 0));
    const explanation = typeof parsed.explanation === 'string' ? parsed.explanation : 'No explanation provided.';
    const corrected_fact = verdict === 'FAKE' && typeof parsed.corrected_fact === 'string' ? parsed.corrected_fact : '';
    let data_points = { labels: [], values: [] };
    if (parsed.data_points && Array.isArray(parsed.data_points.labels) && Array.isArray(parsed.data_points.values)) {
      data_points = { labels: parsed.data_points.labels, values: parsed.data_points.values };
    }

    console.log(`✅ Result: ${verdict} (${confidence}%)`);
    return res.json({ verdict, confidence, explanation, corrected_fact, data_points, engine: 'gemini' });

  } catch (err) {
    console.error(`❌ Unexpected error: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// ─── POST /api/analyze-image — Legacy image endpoint ─────────────────────────
app.post('/api/analyze-image', async (req, res) => {
  const { base64, mimeType } = req.body;
  if (!base64) return res.status(400).json({ error: 'No image provided.' });
  if (API_KEYS.length === 0) return res.status(500).json({ error: 'No API keys configured.' });

  const PROMPT = `You are a strict AI image analysis expert. Analyze the image.
1. Determine if it is AI-generated or captured by a human.
2. Check for adult/NSFW content.
3. Check for fake/deepfake content.

Return ONLY valid JSON format:
{
  "verdict": "REAL",
  "generated_by": "Human",
  "confidence": 95,
  "adult_content": false,
  "fake_content": false,
  "explanation": "Clear reason.",
  "data_points": {
     "labels": ["AI Indicators", "Human Generation", "Adult Content Risk", "Fake Content Risk"],
     "values": [5, 95, 0, 0]
  }
}`;

  const body = {
    contents: [{ parts: [{ text: PROMPT }, { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64 } }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' }
  };

  try {
    const { res: gemRes, ok, status } = await callGeminiWithKeyRotation(body);

    if (!ok) {
      return res.status(200).json({
        verdict: 'UNKNOWN', confidence: 0,
        explanation: 'Service temporarily unavailable. Please wait 1-2 minutes and try again.',
        engine: 'gemini', error_hint: 'quota_exceeded'
      });
    }

    const { parsed, error: parseError } = await parseGeminiResponse(gemRes);
    if (parseError) return res.status(502).json({ error: parseError });

    const verdict = (parsed.verdict === 'FAKE' || parsed.generated_by === 'AI' || parsed.fake_content) ? 'FAKE' : 'REAL';
    let confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 0));
    const generated_by = parsed.generated_by === 'AI' ? 'AI' : 'Human';
    const customTitle = generated_by === 'AI' ? 'Generated by AI' : 'Generated by Human!';
    const explanation = typeof parsed.explanation === 'string' ? parsed.explanation : 'No explanation.';
    const combined = explanation + '\n\n' + (parsed.adult_content ? '⚠️ Adult Content Detected!' : '✅ No Adult Content') + '\n' + (parsed.fake_content ? '⚠️ Fake Content Detected!' : '✅ Authentic Content');
    let data_points = { labels: [], values: [] };
    if (parsed.data_points && Array.isArray(parsed.data_points.labels)) data_points = parsed.data_points;

    return res.json({ verdict, confidence, explanation: combined, customTitle, adult_content: !!parsed.adult_content, fake_content: !!parsed.fake_content, data_points, engine: 'gemini' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// ─── POST /api/analyze/image — Full forensics image analysis ─────────────────
app.post('/api/analyze/image', async (req, res) => {
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No imageBase64 provided.' });
  if (API_KEYS.length === 0) return res.status(500).json({ error: 'No API keys configured.' });

  const PROMPT = `Analyze this image. Return ONLY this JSON:
{
  "ai_verdict": "AI_GENERATED or HUMAN_CREATED",
  "ai_confidence": "0-100",
  "ai_indicators": ["indicator1", "indicator2"],
  "ai_explanation": "2 sentence explanation",
  "content_safety": {
    "adult_content": false,
    "violence": false,
    "fake_person": false,
    "hate_content": false,
    "misleading": false,
    "overall_safe": true
  },
  "content_flags": [],
  "image_scores": {
    "labels": ["Face Naturalness", "Background", "Lighting", "Texture"],
    "values": [80, 80, 80, 80]
  },
  "summary": "one sentence"
}
Rules: AI_GENERATED if Midjourney/DALL-E style. HUMAN_CREATED if real photograph. Return ONLY JSON. Nothing else.`;

  const body = {
    contents: [{
      parts: [
        { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } },
        { text: PROMPT }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' }
  };

  try {
    console.log('📡 Calling Gemini Vision API...');
    const { res: gemRes, ok, status, errText } = await callGeminiWithKeyRotation(body);

    if (!ok) {
      console.error(`❌ All keys failed for image analysis.`);
      return res.status(200).json({
        ai_verdict: 'UNKNOWN', ai_confidence: 0,
        ai_indicators: [],
        ai_explanation: 'Service temporarily unavailable. All API keys are rate-limited. Please wait 1-2 minutes and try again.',
        content_safety: { adult_content: false, violence: false, fake_person: false, hate_content: false, misleading: false, overall_safe: true },
        content_flags: [],
        image_scores: { labels: ['Face Naturalness', 'Background Consistency', 'Lighting Coherence', 'Texture Realism'], values: [50, 50, 50, 50] },
        summary: 'Analysis unavailable — API quota exceeded.',
        engine: 'gemini', error_hint: 'quota_exceeded'
      });
    }

    const { parsed, error: parseError } = await parseGeminiResponse(gemRes);
    if (parseError) return res.status(502).json({ error: parseError });

    const ai_verdict = parsed.ai_verdict === 'AI_GENERATED' ? 'AI_GENERATED' : 'HUMAN_CREATED';
    let ai_confidence = Math.max(0, Math.min(100, Number(parsed.ai_confidence) || 50));
    const ai_indicators = Array.isArray(parsed.ai_indicators) ? parsed.ai_indicators : [];
    const ai_explanation = typeof parsed.ai_explanation === 'string' ? parsed.ai_explanation : 'Analysis complete.';
    const cs = parsed.content_safety || {};
    const content_safety = {
      adult_content: !!cs.adult_content, violence: !!cs.violence,
      fake_person: !!cs.fake_person, hate_content: !!cs.hate_content,
      misleading: !!cs.misleading, overall_safe: cs.overall_safe !== undefined ? !!cs.overall_safe : true
    };
    const content_flags = Array.isArray(parsed.content_flags) ? parsed.content_flags : [];
    let image_scores = { labels: ['Face Naturalness', 'Background Consistency', 'Lighting Coherence', 'Texture Realism'], values: [50, 50, 50, 50] };
    if (parsed.image_scores && Array.isArray(parsed.image_scores.values)) {
      image_scores = { labels: parsed.image_scores.labels, values: parsed.image_scores.values.map(v => Math.max(1, Math.min(100, Number(v) || 50))) };
    }
    const summary = typeof parsed.summary === 'string' ? parsed.summary : `${ai_verdict.replace('_', ' ')}.`;

    console.log(`✅ Forensics Result: ${ai_verdict} (${ai_confidence}% confidence)`);
    return res.json({ ai_verdict, ai_confidence, ai_indicators, ai_explanation, content_safety, content_flags, image_scores, summary, engine: 'gemini' });

  } catch (err) {
    console.error(`❌ Unexpected error: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', model: MODEL, keys: API_KEYS.length, keyLoaded: API_KEYS.length > 0 });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 TruthGuard running on http://localhost:${PORT}`);
  console.log(`🔑 Keys loaded: ${API_KEYS.length}/3`);
  console.log(`🤖 Model: ${MODEL}`);
  console.log('✅ Server ready!');
});
