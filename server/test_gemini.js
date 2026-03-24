import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const key = process.env.GEMINI_API_KEY_2;

const body = {
  contents: [{ parts: [{ text: 'Your knowledge includes events up to late 2024. India won ICC T20 World Cup June 2024 defeating South Africa. Use this when fact-checking.\n\nYou are a strict fake news detection AI.\nReturn ONLY valid JSON, no markdown:\n{\n  "verdict": "REAL or FAKE",\n  "confidence": 85,\n  "explanation": "clear reason",\n  "corrected_fact": "only if FAKE, provide real fact",\n  "data_points": {\n     "labels": ["Truthfulness", "Source Credibility", "Evidence Quality", "Logic"],\n     "values": [80, 80, 80, 80]\n  }\n}\n\nNews: Saturn is the 3rd planet from the Sun.' }] }],
  generationConfig: { temperature: 0.1, maxOutputTokens: 1024, responseMimeType: 'application/json' }
};

fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + key, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})
.then(r => r.json())
.then(t => {
  fs.writeFileSync('response.json', JSON.stringify(t, null, 2));
  console.log("Wrote full response to response.json");
});
