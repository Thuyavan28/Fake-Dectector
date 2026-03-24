async function test() {
  const mimeType = 'image/png';
  const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  const PROMPT = `You are an expert AI image forensics analyst. Analyze this image thoroughly.

TASK 1 — AI GENERATION DETECTION:
Look for: unnaturally perfect skin, merged hair strands, inconsistent background, glassy eyes, wrong finger count, garbled text, perfect/inconsistent lighting, smooth plastic-like edges, repeating patterns, impossible fabric folds, missing reflections, dreamlike quality.

TASK 2 — CONTENT SAFETY:
Check for: adult/NSFW content, violence/gore, deepfake persons, hate symbols, misleading/propaganda content, dangerous activities.

TASK 3 — IMAGE QUALITY SIGNALS:
Rate: face naturalness, background consistency, lighting coherence, texture realism.

Return ONLY this exact JSON, no markdown:
{
  "ai_verdict": "AI_GENERATED or HUMAN_CREATED",
  "ai_confidence": integer 0-100,
  "ai_indicators": ["artifact 1", "artifact 2", "artifact 3"],
  "ai_explanation": "2-3 sentence explanation",
  "content_safety": {
    "adult_content": boolean,
    "violence": boolean,
    "fake_person": boolean,
    "hate_content": boolean,
    "misleading": boolean,
    "overall_safe": boolean
  },
  "content_flags": ["flag1"],
  "image_scores": {
    "labels": ["Face Naturalness", "Background Consistency", "Lighting Coherence", "Texture Realism"],
    "values": [score1, score2, score3, score4]
  },
  "summary": "one sentence overall assessment"
}`;

  const body = {
    contents: [{
      parts: [
        { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } },
        { text: PROMPT }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024, responseMimeType: 'application/json' }
  };

  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyALVcfpZirHMv19dSITKcPxTk_-CDGkg6w', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  console.log(res.status);
  const data = await res.text();
  console.log("Response body:");
  console.log(data);
}
test();
