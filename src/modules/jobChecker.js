// ─── jobChecker.js ────────────────────────────────────────────────────────────
// Primary: Claude API  |  Fallback: Pure JS rule engine (zero dependencies)

import { normalizeConfidence } from './newsDetector.js';

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const SIGNALS = {
  personalEmail: { rx: /(gmail|yahoo|hotmail|outlook|aol|rediffmail|ymail)\.com/i, weight: 22, flag: 'Personal email used', reason: 'Contact email is a personal account (Gmail/Yahoo) — real companies use their own domain email' },
  urgency: { rx: /urgent|immediate|asap|limited time|apply now|hurry|last chance|today only|slots filling/i, weight: 18, flag: 'Urgency/pressure language', reason: 'The posting uses urgent pressure language ("Apply NOW!", "Last chance!") to rush you — a classic scam tactic' },
  moneyUpfront: { rx: /registration fee|processing fee|training fee|security deposit|pay.*join|fee.*apply|investment required/i, weight: 40, flag: 'Upfront payment demanded', reason: 'Asks you to pay a fee to apply or join — NO legitimate employer ever asks candidates to pay money' },
  unrealisticSalary: { rx: /\$[5-9]\d{4,}|\$[1-9]\d{5,}|earn \$\d{3,}.*day|₹[5-9]\d{5,}.*month/i, weight: 25, flag: 'Unrealistic salary promise', reason: 'The salary being offered is unrealistically high — real job offers match market rates' },
  vagueCompany: { rx: /leading company|top mnc|international firm|confidential company|anonymous employer|secret company/i, weight: 15, flag: 'Vague company identity', reason: 'The company is described vaguely — real companies are transparent about who they are' },
  wfhScam: { rx: /work from home.*earn \$|earn.*per (day|week).*home|घर बैठे.*कमाए/i, weight: 28, flag: 'Work-from-home income scam', reason: '"Earn money from home" with high daily earnings is a well-known online job scam pattern' },
  guaranteed: { rx: /guaranteed (income|salary|earning|job|placement)|assured (income|salary)/i, weight: 30, flag: 'Guaranteed income claim', reason: 'No legitimate employer can guarantee income — this is a manipulation tactic used in job scams' },
  noExperience: { rx: /no experience (needed|required|necessary).*(\$[1-9]|₹[5-9])|fresher.*earn.*\d{4,}/i, weight: 20, flag: 'No experience + high salary', reason: 'Offering very high pay for zero experience is unrealistic and a common bait tactic in fraud postings' },
  grammarIssues: { rx: /kindly revert|do the needful|we are looking forward your|please send your cv on/i, weight: 12, flag: 'Suspicious phrasing', reason: 'Contains phrases commonly found in fraudulent job postings from non-professional sources' },
  multiLevel: { rx: /refer.*earn|mlm|network marketing|downline|pyramid|direct selling/i, weight: 35, flag: 'MLM / pyramid scheme', reason: 'References a referral-based earning structure — a common indicator of MLM or pyramid schemes' },
};

async function callClaude(text, apiKey) {
  const sys = `You are an HR fraud detection expert. Analyze this job posting for fraud signals. Explain every finding in simple, clear language that any job-seeker can understand. Return ONLY valid JSON: {"verdict":"FAKE"|"REAL","confidence":0-100,"reasons":["plain English reason 1","reason 2","reason 3"],"riskFlags":["flag1"],"summary":"one sentence plain English conclusion"}`;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 700, system: sys, messages: [{ role: 'user', content: text }] }),
  });
  if (!res.ok) throw new Error(`Claude HTTP ${res.status}`);
  const data = await res.json();
  const raw = data.content[0].text.trim();
  const m = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(m ? m[0] : raw);
  parsed.confidence = normalizeConfidence(parsed.verdict, parsed.confidence);
  const fakeScore = parsed.verdict === 'FAKE' ? parsed.confidence : 100 - parsed.confidence;
  return { ...parsed, fakeScore, realScore: 100 - fakeScore, engine: 'claude' };
}

export async function analyzeJob(text, apiKey) {
  if (apiKey) {
    try { return await callClaude(text, apiKey); } catch (_) {}
  }

  let rawScore = 0;
  const flags = [], reasons = [];
  Object.values(SIGNALS).forEach(({ rx, weight, flag, reason }) => {
    if (rx.test(text)) { rawScore += weight; flags.push(flag); reasons.push(reason); }
  });

  const verdict = rawScore >= 40 ? 'FAKE' : 'REAL';
  const confidence = normalizeConfidence(verdict, Math.min(99, rawScore));
  const fakeScore = verdict === 'FAKE' ? confidence : 100 - confidence;

  return {
    verdict,
    confidence,
    fakeScore,
    realScore: 100 - fakeScore,
    reasons: reasons.length
      ? reasons
      : [
          'No fraudulent signals detected in the job posting',
          'Company contact information appears professional',
          'Salary and requirements seem realistic for the role',
        ],
    riskFlags: flags.length ? flags : ['No fraud signals detected'],
    summary: verdict === 'FAKE'
      ? `${flags.length} fraud signals found — this job posting shows signs of being a scam.`
      : 'No major fraud signals detected — this job posting appears legitimate.',
    engine: 'rule-based',
  };
}
