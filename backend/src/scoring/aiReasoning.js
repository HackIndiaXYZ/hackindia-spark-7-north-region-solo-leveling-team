/**
 * aiReasoning.js
 * ─────────────────────────────────────────────────────────────
 * LLM Reasoning Layer — receives a COMPLETED deterministic score
 * and asks the LLM ONLY for human-readable reasoning.
 *
 * The LLM NEVER generates or modifies the score number.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const SYSTEM_PROMPT = `You are a financial risk analyst reviewing a credit application.
You will receive a pre-calculated credit score (computed by a deterministic rule engine) 
and the raw scoring data behind it.

Your ONLY job is to:
1. Identify the 2 strongest positive signals in this profile
2. Identify the 2 biggest risk factors  
3. Write a 2-sentence plain-English explanation for why this person was approved or rejected

STRICT RULES:
- Do NOT change the score. Do NOT suggest a different score number.
- Do NOT add any disclaimers or caveats outside the JSON fields.
- Do NOT include names, phone numbers, addresses, or any PII.
- Return ONLY valid JSON with exactly this schema:

{
  "positive_signals": ["<signal 1>", "<signal 2>"],
  "risk_factors": ["<factor 1>", "<factor 2>"],
  "reason": "<2 sentences max, plain English, outcome-focused>"
}`;

/**
 * Build the user prompt from scored data.
 * Strips any PII — only sends statistical signals.
 *
 * @param {Object} scoredInput   - Normalised scoring input (no PII)
 * @param {Object} breakdown     - ScoreBreakdown from scoreEngine
 * @returns {string}
 */
function buildPrompt(scoredInput, breakdown) {
    const { finalScore, fieldScores } = breakdown;
    const approved = finalScore >= 600;

    return `CREDIT SCORE RESULT: ${finalScore} (${approved ? 'APPROVED' : 'REJECTED'})

FIELD-BY-FIELD BREAKDOWN (scores out of 100):
- Monthly Income Signal:       ${fieldScores.monthly_income}/100
- Employment Stability:        ${fieldScores.employment_type}/100  
- Existing Debt Burden:        ${fieldScores.existing_debt_load}/100
- Repayment Track Record:      ${fieldScores.past_repayment_history}/100
- Utility Payment Regularity:  ${fieldScores.phone_bill_regularity}/100
- Loan Purpose Risk Profile:   ${fieldScores.loan_purpose}/100
- Residential Stability:       ${fieldScores.residential_stability}/100

RAW INPUT SIGNALS (no PII):
- Employment Type: ${scoredInput.employment_type ?? scoredInput.employmentType ?? 'unknown'}
- Debt Load: ${scoredInput.existing_debt_load ?? scoredInput.existingDebt ?? 'unknown'}
- Repayment History: ${scoredInput.past_repayment_history ?? scoredInput.repaymentHistory ?? 'unknown'}
- Loan Purpose: ${scoredInput.loan_purpose ?? scoredInput.loanPurpose ?? 'unknown'}

Provide reasoning for this ${approved ? 'APPROVAL' : 'REJECTION'} decision.`;
}

/**
 * Parse LLM response text into structured object.
 * Handles markdown code blocks and partial JSON.
 *
 * @param {string} text
 * @returns {{ positive_signals: string[], risk_factors: string[], reason: string }|null}
 */
function parseReasoningResponse(text) {
    try {
        // Strip markdown code fences
        const cleaned = text
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();

        // Find first { ... } block
        const start = cleaned.indexOf('{');
        const end   = cleaned.lastIndexOf('}');
        if (start === -1 || end === -1) return null;

        const parsed = JSON.parse(cleaned.slice(start, end + 1));

        // Validate required fields
        if (
            Array.isArray(parsed.positive_signals) &&
            Array.isArray(parsed.risk_factors) &&
            typeof parsed.reason === 'string'
        ) {
            return {
                positive_signals: parsed.positive_signals.slice(0, 2),
                risk_factors:     parsed.risk_factors.slice(0, 2),
                reason:           parsed.reason,
            };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Enrich the deterministic score result with AI reasoning.
 *
 * @param {Object} scoredInput    - Original input (no PII)
 * @param {Object} breakdown      - ScoreBreakdown from scoreEngine
 * @param {Function} llmCaller    - async (systemPrompt, userPrompt) => string
 * @returns {Promise<{ positive_signals: string[], risk_factors: string[], reason: string, confidence: string }>}
 */
async function getAIReasoning(scoredInput, breakdown, llmCaller) {
    const userPrompt = buildPrompt(scoredInput, breakdown);

    const fallbackReasoning = buildFallbackReasoning(breakdown);

    try {
        const raw = await llmCaller(SYSTEM_PROMPT, userPrompt);
        const parsed = parseReasoningResponse(raw);

        if (parsed) {
            return { ...parsed, confidence: 'ai_enhanced' };
        }

        // Parse failed — use rule-based fallback
        return { ...fallbackReasoning, confidence: 'rule_based' };
    } catch {
        return { ...fallbackReasoning, confidence: 'rule_based' };
    }
}

/**
 * Generate deterministic reasoning when LLM is unavailable.
 * Picks the best and worst field scores automatically.
 *
 * @param {Object} breakdown - ScoreBreakdown
 * @returns {{ positive_signals: string[], risk_factors: string[], reason: string }}
 */
function buildFallbackReasoning(breakdown) {
    const { fieldScores, finalScore } = breakdown;
    const approved = finalScore >= 600;

    const FIELD_LABELS = {
        monthly_income:         'Monthly income level',
        employment_type:        'Employment stability',
        existing_debt_load:     'Current debt burden',
        past_repayment_history: 'Past repayment track record',
        phone_bill_regularity:  'Utility payment consistency',
        loan_purpose:           'Stated loan purpose',
        residential_stability:  'Residential stability',
    };

    const sorted = Object.entries(fieldScores)
        .sort(([, a], [, b]) => b - a);

    const positive_signals = sorted
        .slice(0, 2)
        .map(([k, v]) => `${FIELD_LABELS[k]} scored ${v}/100`);

    const risk_factors = sorted
        .slice(-2)
        .reverse()
        .map(([k, v]) => `${FIELD_LABELS[k]} scored only ${v}/100`);

    const outcome = approved
        ? `The applicant meets the minimum credit threshold of 600 with a score of ${finalScore}.`
        : `The applicant's score of ${finalScore} falls below the required threshold of 600.`;

    const action = approved
        ? 'Risk profile supports loan approval at standard terms.'
        : 'Applicant should focus on improving income stability and repayment history before reapplying.';

    return {
        positive_signals,
        risk_factors,
        reason: `${outcome} ${action}`,
    };
}

module.exports = { getAIReasoning, buildFallbackReasoning, buildPrompt };
