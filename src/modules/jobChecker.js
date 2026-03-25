// ─── jobChecker.js ────────────────────────────────────────────────────────────
// Now powered by Google Gemini API via Express backend (/api/analyze)

export async function analyzeJob(text) {
  if (!text || !text.trim()) {
    throw new Error('No text provided for analysis.');
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: "Job Posting Analysis: " + text.trim() }),
  });

  if (!response.ok) {
    let errMsg = `Server error ${response.status}`;
    try {
      const errData = await response.json();
      errMsg = errData.error || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    verdict: data.verdict,
    confidence: data.confidence,
    explanation: data.explanation,
    summary: data.verdict === 'FAKE' ? 'Fraud signals found — this job posting shows signs of being a scam or AI generated.' : 'No major fraud signals detected.',
    reasons: [data.explanation],
    data_points: data.data_points || null,
    engine: 'gemini',
  };
}
