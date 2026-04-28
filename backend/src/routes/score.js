/**
 * score.js  (POST /api/score)
 * ─────────────────────────────────────────────────────────────
 * Production-grade credit scoring API endpoint.
 *
 * Pipeline:
 *   1. Validate request body
 *   2. Run deterministic scoreEngine (sync, no LLM)
 *   3. Run fallbackChain to get LLM reasoning
 *   4. Merge into final response
 *   5. Log: inputs (no PII), score, tier used, response time
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const express = require('express');
const router  = express.Router();

const { calculateScore, getRiskLevel } = require('../scoring/scoreEngine');
const { getAIReasoning, buildFallbackReasoning } = require('../scoring/aiReasoning');
const { buildLLMCaller } = require('../scoring/fallbackChain');

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID = {
    employment_type:        ['salaried', 'gig', 'self_employed', 'unemployed'],
    existing_debt_load:     ['none', 'low', 'medium', 'high'],
    past_repayment_history: ['none', 'good', 'bad'],
    phone_bill_regularity:  ['always', 'sometimes', 'rarely'],
    loan_purpose:           ['medical', 'business', 'education', 'personal'],
};

/**
 * Validate and normalise request body.
 * Returns { data, errors } — errors is empty array on success.
 *
 * @param {Object} body
 * @returns {{ data: Object|null, errors: string[] }}
 */
function validateRequest(body) {
    const errors = [];
    const data   = {};

    // monthly_income — required, positive number
    const income = Number(body.monthly_income ?? body.income);
    if (!income || income <= 0) {
        errors.push('monthly_income must be a positive number (INR)');
    } else {
        data.monthly_income = income;
    }

    // residential_stability — required, non-negative number
    const stability = Number(body.residential_stability ?? body.yearsAtAddress ?? 0);
    if (stability < 0 || isNaN(stability)) {
        errors.push('residential_stability must be a non-negative number (years)');
    } else {
        data.residential_stability = stability;
    }

    // Enum fields — accept legacy frontend keys too
    const enumFields = [
        ['employment_type',        body.employment_type      ?? body.employmentType],
        ['existing_debt_load',     body.existing_debt_load   ?? body.existingDebt],
        ['past_repayment_history', body.past_repayment_history ?? body.repaymentHistory],
        ['phone_bill_regularity',  body.phone_bill_regularity  ?? body.utilityPayments],
        ['loan_purpose',           body.loan_purpose          ?? body.loanPurpose],
    ];

    for (const [field, value] of enumFields) {
        if (!value) {
            errors.push(`${field} is required`);
            continue;
        }

        // Attempt fuzzy match for legacy string values
        const normalised = normaliseLegacyValue(field, value);
        if (VALID[field] && !VALID[field].includes(normalised)) {
            errors.push(`${field} must be one of: ${VALID[field].join(', ')} (got: "${value}")`);
        } else {
            data[field] = normalised;
        }
    }

    return { data: errors.length === 0 ? data : null, errors };
}

/**
 * Map legacy frontend values to new API enum values.
 * Keeps backward compatibility with the old creditScore endpoint.
 *
 * @param {string} field
 * @param {string} value
 * @returns {string}
 */
function normaliseLegacyValue(field, value) {
    const v = String(value).toLowerCase().trim();

    if (field === 'existing_debt_load') {
        if (v.includes('none') || v === 'no debt') return 'none';
        if (v.includes('low'))    return 'low';
        if (v.includes('medium') || v.includes('moderate')) return 'medium';
        if (v.includes('high'))   return 'high';
    }

    if (field === 'past_repayment_history') {
        if (v.includes('always') || v.includes('good') || v.includes('on time')) return 'good';
        if (v.includes('bad') || v.includes('miss') || v.includes('default'))    return 'bad';
        if (v.includes('none') || v.includes('no history')) return 'none';
    }

    if (field === 'phone_bill_regularity') {
        if (v.includes('always') || v.includes('on time')) return 'always';
        if (v.includes('sometimes') || v.includes('late')) return 'sometimes';
        if (v.includes('rarely') || v.includes('never'))   return 'rarely';
    }

    if (field === 'employment_type') {
        if (v.includes('salaried') || v.includes('employed')) return 'salaried';
        if (v.includes('gig') || v.includes('freelance'))     return 'gig';
        if (v.includes('self'))                                return 'self_employed';
        if (v.includes('unemployed') || v.includes('daily'))  return 'unemployed';
    }

    if (field === 'loan_purpose') {
        if (v.includes('medical') || v.includes('health'))    return 'medical';
        if (v.includes('business') || v.includes('capital'))  return 'business';
        if (v.includes('education') || v.includes('study'))   return 'education';
    }

    return v; // pass through, validation will catch invalid values
}

// ─── Route: POST /api/score ────────────────────────────────────────────────────

router.post('/', async (req, res) => {
    const startTime = Date.now();

    // ── 1. Validate ───────────────────────────────────────────────────────────
    const { data, errors } = validateRequest(req.body);
    if (!data) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors,
        });
    }

    // ── 2. Deterministic Score (sync — always runs, always correct) ───────────
    const breakdown = calculateScore(data);
    const { finalScore } = breakdown;
    const risk     = getRiskLevel(finalScore);
    const approved = finalScore >= 600;

    // ── 3. LLM Reasoning (async — adds explanation only) ─────────────────────
    let reasoning;
    let tierUsed = 'rule_based';
    let confidence = 'rule_based';

    try {
        const { caller, getTierUsed } = buildLLMCaller();

        reasoning = await getAIReasoning(data, breakdown, caller);
        tierUsed  = getTierUsed();
        confidence = reasoning.confidence;
    } catch {
        // LLM completely unavailable — use deterministic fallback reasoning
        reasoning = {
            ...buildFallbackReasoning(breakdown),
            confidence: 'rule_based',
        };
        tierUsed = 'rule_based';
    }

    const responseTimeMs = Date.now() - startTime;

    // ── 4. Build Response ─────────────────────────────────────────────────────
    const scoreResult = {
        score:            finalScore,
        risk,
        approved,
        positive_signals: reasoning.positive_signals,
        risk_factors:     reasoning.risk_factors,
        reason:           reasoning.reason,
        confidence,
        // Extended breakdown for UI display
        breakdown: {
            fieldScores:     breakdown.fieldScores,
            weightedContrib: breakdown.weightedContrib,
        },
        meta: {
            tier_used:       tierUsed,
            response_time_ms: responseTimeMs,
            score_version:   '2.0.0',  // bump when weights change
        },
    };

    // ── 5. Structured Request Log (no PII) ────────────────────────────────────
    console.log(JSON.stringify({
        event: 'credit_score_request',
        timestamp: new Date().toISOString(),
        inputs: {
            employment_type:        data.employment_type,
            existing_debt_load:     data.existing_debt_load,
            past_repayment_history: data.past_repayment_history,
            phone_bill_regularity:  data.phone_bill_regularity,
            loan_purpose:           data.loan_purpose,
            income_bucket:          getIncomeBucket(data.monthly_income),
            stability_bucket:       getStabilityBucket(data.residential_stability),
            // NOTE: raw income and address years are intentionally omitted
        },
        output: {
            score:      finalScore,
            risk,
            approved,
            confidence,
        },
        perf: {
            tier_used:        tierUsed,
            response_time_ms: responseTimeMs,
        },
    }));

    res.json(scoreResult);
});

// ─── Legacy Compatibility: keep /api/credit-score working ────────────────────
// Maps old field names to new ones and re-uses the same logic.
router.post('/legacy', async (req, res) => {
    // Remap old keys → new keys and forward to same handler
    req.body = {
        monthly_income:         req.body.income,
        employment_type:        req.body.employmentType,
        existing_debt_load:     req.body.existingDebt,
        past_repayment_history: req.body.repaymentHistory,
        phone_bill_regularity:  req.body.utilityPayments,
        loan_purpose:           req.body.loanPurpose,
        residential_stability:  req.body.yearsAtAddress,
    };
    // Hand off to the main handler by re-invoking the router
    // (simpler: just call the logic inline)
    return router.handle({ ...req, url: '/', method: 'POST' }, res, () => {});
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getIncomeBucket(income) {
    if (income < 5000)  return '<5k';
    if (income < 10000) return '5-10k';
    if (income < 20000) return '10-20k';
    return '20k+';
}

function getStabilityBucket(years) {
    if (years < 1) return '<1yr';
    if (years < 2) return '1-2yr';
    if (years < 5) return '2-5yr';
    return '5yr+';
}

module.exports = router;
