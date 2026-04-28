/**
 * scoreEngine.js
 * ─────────────────────────────────────────────────────────────
 * Deterministic, weighted credit scoring calculator.
 * PURE SYNC — no async, no LLM, no randomness.
 * Maps a weighted average to the 300–900 CIBIL-style range.
 *
 * Formula: finalScore = 300 + (weightedAverage * 600)
 * ─────────────────────────────────────────────────────────────
 *
 * @typedef {Object} ScoringInput
 * @property {number}  monthly_income          - Monthly income in INR
 * @property {'salaried'|'gig'|'self_employed'|'unemployed'} employment_type
 * @property {'none'|'low'|'medium'|'high'} existing_debt_load
 * @property {'none'|'good'|'bad'} past_repayment_history
 * @property {'always'|'sometimes'|'rarely'} phone_bill_regularity
 * @property {'medical'|'business'|'education'|'personal'} loan_purpose
 * @property {number}  residential_stability   - Years at current address
 *
 * @typedef {Object} ScoreBreakdown
 * @property {number} rawScore          - 0–1 weighted average
 * @property {number} finalScore        - 300–900 mapped score
 * @property {Object} fieldScores       - Per-field 0–100 scores
 * @property {Object} fieldWeights      - Per-field weight (sums to 1.0)
 * @property {Object} weightedContrib   - Per-field contribution to rawScore
 */

'use strict';

// ─── Field Weights (must sum to 1.0) ─────────────────────────────────────────
// Spec weights: income=25%, employment=15%, debt=20%, repayment=20%,
// phone=10%, purpose=5%, stability=5%  → total = 100%
const WEIGHTS = {
    monthly_income:         0.25,  // Highest: core ability to repay
    employment_type:        0.15,  // Stability of income source
    existing_debt_load:     0.20,  // Liability load
    past_repayment_history: 0.20,  // Track record
    phone_bill_regularity:  0.10,  // Proxy for payment discipline
    loan_purpose:           0.05,  // Risk of loan use
    residential_stability:  0.05,  // Address stability
    // TOTAL: 1.00
};

// ─── Individual Field Scorers (each returns 0–100) ───────────────────────────

/**
 * Monthly income scoring
 * <5k=0, 5–10k=40, 10–20k=70, 20k+=100
 * @param {number} income
 * @returns {number}
 */
function scoreIncome(income) {
    const n = Number(income) || 0;
    if (n < 5000)  return 0;
    if (n < 10000) return 40;
    if (n < 20000) return 70;
    return 100;
}

/**
 * Employment type scoring
 * unemployed=0, gig=50, self_employed=70, salaried=100
 * @param {string} type
 * @returns {number}
 */
function scoreEmployment(type) {
    const map = {
        unemployed:    0,
        gig:           50,
        self_employed: 70,
        salaried:      100,
    };
    return map[type] ?? 0;
}

/**
 * Existing debt load scoring
 * high=0, medium=40, low=70, none=100
 * @param {string} debt
 * @returns {number}
 */
function scoreDebt(debt) {
    const map = {
        high:   0,
        medium: 40,
        low:    70,
        none:   100,
    };
    return map[debt] ?? 0;
}

/**
 * Past repayment history scoring
 * bad=0, none=40, good=100
 * @param {string} history
 * @returns {number}
 */
function scoreRepayment(history) {
    // Handle the frontend's verbose strings
    if (typeof history === 'string') {
        const h = history.toLowerCase();
        if (h.includes('good') || h.includes('always')) return 100;
        if (h.includes('bad') || h.includes('miss'))    return 0;
    }
    const map = { good: 100, none: 40, bad: 0 };
    return map[history] ?? 40;
}

/**
 * Phone bill / utility payment regularity scoring
 * rarely=0, sometimes=50, always=100
 * @param {string} regularity
 * @returns {number}
 */
function scorePhoneBill(regularity) {
    // Handle frontend field "utilityPayments"
    if (typeof regularity === 'string') {
        const r = regularity.toLowerCase();
        if (r.includes('always') || r.includes('time')) return 100;
        if (r.includes('sometimes') || r.includes('late')) return 50;
        if (r.includes('rarely') || r.includes('never')) return 0;
    }
    const map = { always: 100, sometimes: 50, rarely: 0 };
    return map[regularity] ?? 50;
}

/**
 * Loan purpose scoring
 * personal=40, medical=80, education=90, business=100
 * @param {string} purpose
 * @returns {number}
 */
function scorePurpose(purpose) {
    if (typeof purpose === 'string') {
        const p = purpose.toLowerCase();
        if (p.includes('business') || p.includes('capital')) return 100;
        if (p.includes('education'))                          return 90;
        if (p.includes('medical') || p.includes('health'))   return 80;
        if (p.includes('agriculture') || p.includes('farm')) return 85;
        if (p.includes('home') || p.includes('repair'))      return 70;
    }
    const map = { business: 100, education: 90, medical: 80, personal: 40 };
    return map[purpose] ?? 40;
}

/**
 * Residential stability scoring
 * <1yr=0, 1–2yr=40, 2–5yr=70, 5+yr=100
 * @param {number} years
 * @returns {number}
 */
function scoreStability(years) {
    const y = Number(years) || 0;
    if (y < 1) return 0;
    if (y < 2) return 40;
    if (y < 5) return 70;
    return 100;
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

/**
 * Calculate deterministic credit score.
 * Accepts both the new API field names and the legacy frontend field names.
 *
 * @param {Object} input - Raw form/API input
 * @returns {ScoreBreakdown}
 */
function calculateScore(input) {
    // Normalise — support both new API keys and legacy frontend keys
    const income      = input.monthly_income       ?? input.income           ?? 0;
    const employment  = input.employment_type      ?? input.employmentType   ?? 'unemployed';
    const debt        = input.existing_debt_load   ?? input.existingDebt     ?? 'high';
    const repayment   = input.past_repayment_history ?? input.repaymentHistory ?? 'none';
    const phoneBill   = input.phone_bill_regularity  ?? input.utilityPayments  ?? 'sometimes';
    const purpose     = input.loan_purpose         ?? input.loanPurpose      ?? 'personal';
    const stability   = input.residential_stability ?? input.yearsAtAddress  ?? 0;

    // Per-field 0–100 scores
    const fieldScores = {
        monthly_income:         scoreIncome(income),
        employment_type:        scoreEmployment(employment),
        existing_debt_load:     scoreDebt(debt),
        past_repayment_history: scoreRepayment(repayment),
        phone_bill_regularity:  scorePhoneBill(phoneBill),
        loan_purpose:           scorePurpose(purpose),
        residential_stability:  scoreStability(stability),
    };

    // Weighted sum → 0–100
    let weightedSum = 0;
    const weightedContrib = {};
    for (const [field, weight] of Object.entries(WEIGHTS)) {
        const contrib = (fieldScores[field] * weight);
        weightedContrib[field] = parseFloat(contrib.toFixed(3));
        weightedSum += contrib;
    }

    // Map 0–100 → 300–900
    const rawScore   = weightedSum / 100;            // normalise to 0–1
    let finalScore = Math.round(300 + rawScore * 600);

    // Apply SBT reputation modifiers
    if (input.badges && Array.isArray(input.badges)) {
        if (input.badges.includes('DEFAULTER') || input.badges.includes(2)) { // Support enum or string
            finalScore -= 100;
        } else if (input.badges.includes('GOOD_BORROWER') || input.badges.includes(1)) {
            finalScore += 60;
        }
    }

    finalScore = Math.min(900, Math.max(300, finalScore));

    return {
        rawScore:      parseFloat(rawScore.toFixed(4)),
        finalScore:    Math.min(900, Math.max(300, finalScore)),
        fieldScores,
        fieldWeights:  WEIGHTS,
        weightedContrib,
    };
}

/**
 * Derive risk level from a 300–900 score.
 * @param {number} score
 * @returns {'low'|'medium'|'high'}
 */
function getRiskLevel(score) {
    if (score >= 700) return 'low';
    if (score >= 550) return 'medium';
    return 'high';
}

module.exports = { calculateScore, getRiskLevel, WEIGHTS };
