import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
const key = process.env.GEMINI_API_KEY_1;
const MODEL = 'gemini-2.5-flash';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

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

const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="; // 1x1 transparent png

const body = {
  contents: [{
    parts: [
      { inlineData: { mimeType: 'image/png', data: base64 } },
      { text: PROMPT }
    ]
  }],
  generationConfig: { temperature: 0.1, maxOutputTokens: 2048, responseMimeType: 'application/json' }
};

fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  .then(r => r.json())
  .then(t => console.log(JSON.stringify(t, null, 2)))
  .catch(console.error);
