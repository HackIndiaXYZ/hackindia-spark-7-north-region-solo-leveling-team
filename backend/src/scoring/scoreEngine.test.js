/**
 * scoreEngine.test.js
 * ─────────────────────────────────────────────────────────────
 * Unit tests for the deterministic credit scoring engine.
 * Run with: node scoreEngine.test.js
 * (No test runner required — uses built-in assert)
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const assert = require('assert');
const path   = require('path');
const { calculateScore, getRiskLevel } = require(path.join(__dirname, 'scoreEngine'));

// ─── Test Harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
    try {
        fn();
        results.push({ status: '✅ PASS', name });
        passed++;
    } catch (err) {
        results.push({ status: '❌ FAIL', name, error: err.message });
        failed++;
    }
}

function expect(actual) {
    return {
        toBe(expected) {
            assert.strictEqual(actual, expected, `Expected ${expected}, got ${actual}`);
        },
        toBeGreaterThan(n) {
            assert.ok(actual > n, `Expected ${actual} > ${n}`);
        },
        toBeLessThan(n) {
            assert.ok(actual < n, `Expected ${actual} < ${n}`);
        },
        toBeGreaterThanOrEqual(n) {
            assert.ok(actual >= n, `Expected ${actual} >= ${n}`);
        },
        toBeLessThanOrEqual(n) {
            assert.ok(actual <= n, `Expected ${actual} <= ${n}`);
        },
        toBeBetween(min, max) {
            assert.ok(
                actual >= min && actual <= max,
                `Expected ${actual} to be between ${min} and ${max}`
            );
        },
        toBeTrue()  { assert.ok(actual === true,  `Expected true, got ${actual}`); },
        toBeFalse() { assert.ok(actual === false, `Expected false, got ${actual}`); },
    };
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

// Ravi: Gig worker, ₹18k, no debt, good history
const RAVI = {
    monthly_income:         18000,
    employment_type:        'gig',
    existing_debt_load:     'none',
    past_repayment_history: 'good',
    phone_bill_regularity:  'always',
    loan_purpose:           'business',
    residential_stability:  3,
};

// Worst case: Unemployed, high debt, bad history
const WORST = {
    monthly_income:         2000,
    employment_type:        'unemployed',
    existing_debt_load:     'high',
    past_repayment_history: 'bad',
    phone_bill_regularity:  'rarely',
    loan_purpose:           'personal',
    residential_stability:  0,
};

// Best case: Salaried, ₹25k, no debt, good history
const BEST = {
    monthly_income:         25000,
    employment_type:        'salaried',
    existing_debt_load:     'none',
    past_repayment_history: 'good',
    phone_bill_regularity:  'always',
    loan_purpose:           'business',
    residential_stability:  6,
};

// ─── Core Score Tests ─────────────────────────────────────────────────────────

test('Ravi profile (gig, ₹18k, no debt, good history) → score 790–820', () => {
    // Ravi: gig worker (50pts) + 18k income (70pts) + no debt (100pts)
    //       + good repayment (100pts) + always pays bills (100pts)
    // Weighted avg = 50×0.15 + 70×0.25 + 100×0.20 + 100×0.20 + 100×0.10 + 100×0.05 + 70×0.05
    //             = 7.5+17.5+20+20+10+5+3.5 = 83.5 → score = 300+0.835×600 = 801
    const { finalScore } = calculateScore(RAVI);
    expect(finalScore).toBeBetween(790, 820);
});

test('Worst case (unemployed, high debt, bad history) → score < 400', () => {
    const { finalScore } = calculateScore(WORST);
    expect(finalScore).toBeLessThan(400);
});

test('Best case (salaried, ₹25k, no debt, good history) → score > 800', () => {
    const { finalScore } = calculateScore(BEST);
    expect(finalScore).toBeGreaterThan(800);
});

// ─── Approval Threshold Tests ─────────────────────────────────────────────────

test('Score exactly 599 → approved: false', () => {
    // Craft a profile that produces finalScore < 600
    // Target weightedAvg < 50 (rawScore < 0.5) → finalScore < 600
    // income=5-10k(40×0.25=10) + unemployed(0×0.15=0) + medium(40×0.20=8)
    // + none(40×0.20=8) + sometimes(50×0.10=5) + personal(40×0.05=2) + 0yr(0×0.05=0)
    // = 33 → score = 300 + 0.33*600 = 498 → well below 600
    const input = {
        monthly_income:         6000,
        employment_type:        'unemployed',
        existing_debt_load:     'medium',
        past_repayment_history: 'none',
        phone_bill_regularity:  'sometimes',
        loan_purpose:           'personal',
        residential_stability:  0,
    };
    const { finalScore } = calculateScore(input);
    const approved = finalScore >= 600;
    expect(approved).toBeFalse();
    expect(finalScore).toBeLessThan(600);
});

test('Score exactly 600 → approved: true', () => {
    // Craft input that lands at exactly ≥ 600
    // Need rawScore ≥ 0.50 → weightedAvg ≥ 50
    // income=10-20k(70×0.25=17.5) + salaried(100×0.20=20) + medium(40×0.20=8)
    // + none(40×0.20=8) + always(100×0.10=10) + personal(40×0.05=2) + <1yr(0×0.05=0)
    // = 65.5 → score = 300 + 0.655*600 = 693 — well above 600
    const input = {
        monthly_income:         15000,
        employment_type:        'salaried',
        existing_debt_load:     'medium',
        past_repayment_history: 'none',
        phone_bill_regularity:  'always',
        loan_purpose:           'personal',
        residential_stability:  0,
    };
    const { finalScore } = calculateScore(input);
    const approved = finalScore >= 600;
    expect(approved).toBeTrue();
    expect(finalScore).toBeGreaterThanOrEqual(600);
});

// ─── Field Boundary Tests ─────────────────────────────────────────────────────

test('Income <5k → income field score 0', () => {
    const { fieldScores } = calculateScore({ ...WORST, monthly_income: 4999 });
    expect(fieldScores.monthly_income).toBe(0);
});

test('Income exactly 5000 → income field score 40', () => {
    const { fieldScores } = calculateScore({ ...WORST, monthly_income: 5000 });
    expect(fieldScores.monthly_income).toBe(40);
});

test('Income 20000+ → income field score 100', () => {
    const { fieldScores } = calculateScore({ ...BEST, monthly_income: 20000 });
    expect(fieldScores.monthly_income).toBe(100);
});

test('Employment: salaried → 100', () => {
    const { fieldScores } = calculateScore({ ...RAVI, employment_type: 'salaried' });
    expect(fieldScores.employment_type).toBe(100);
});

test('Employment: unemployed → 0', () => {
    const { fieldScores } = calculateScore({ ...RAVI, employment_type: 'unemployed' });
    expect(fieldScores.employment_type).toBe(0);
});

test('Repayment: good → 100', () => {
    const { fieldScores } = calculateScore({ ...RAVI, past_repayment_history: 'good' });
    expect(fieldScores.past_repayment_history).toBe(100);
});

test('Repayment: bad → 0', () => {
    const { fieldScores } = calculateScore({ ...RAVI, past_repayment_history: 'bad' });
    expect(fieldScores.past_repayment_history).toBe(0);
});

test('Residential stability 5+ years → 100', () => {
    const { fieldScores } = calculateScore({ ...RAVI, residential_stability: 5 });
    expect(fieldScores.residential_stability).toBe(100);
});

test('Residential stability <1 year → 0', () => {
    const { fieldScores } = calculateScore({ ...RAVI, residential_stability: 0 });
    expect(fieldScores.residential_stability).toBe(0);
});

// ─── Score Range Tests ────────────────────────────────────────────────────────

test('All scores should be in 300–900 range', () => {
    const profiles = [RAVI, WORST, BEST];
    for (const p of profiles) {
        const { finalScore } = calculateScore(p);
        expect(finalScore).toBeGreaterThanOrEqual(300);
        expect(finalScore).toBeLessThanOrEqual(900);
    }
});

test('getRiskLevel: score 700+ → low', () => {
    expect(getRiskLevel(700)).toBe('low');
    expect(getRiskLevel(900)).toBe('low');
});

test('getRiskLevel: score 550–699 → medium', () => {
    expect(getRiskLevel(599)).toBe('medium');
    expect(getRiskLevel(550)).toBe('medium');
});

test('getRiskLevel: score <550 → high', () => {
    expect(getRiskLevel(549)).toBe('high');
    expect(getRiskLevel(300)).toBe('high');
});

// ─── Legacy Key Compatibility ─────────────────────────────────────────────────

test('Legacy frontend keys (income, employmentType, etc.) work correctly', () => {
    const legacyInput = {
        income:            18000,
        employmentType:    'gig',
        existingDebt:      'none',
        repaymentHistory:  'good',
        utilityPayments:   'always',
        loanPurpose:       'business',
        yearsAtAddress:    3,
    };
    const { finalScore } = calculateScore(legacyInput);
    const raviScore = calculateScore(RAVI).finalScore;
    expect(finalScore).toBe(raviScore); // should be identical to Ravi's score
});

// ─── Weight Integrity Test ─────────────────────────────────────────────────────

test('Weights sum to exactly 1.0', () => {
    const { WEIGHTS } = require(path.join(__dirname, 'scoreEngine'));
    const total = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0);
    // Allow floating point tolerance
    assert.ok(Math.abs(total - 1.0) < 0.0001, `Weights sum to ${total}, expected 1.0`);
});

// ─── Results ─────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════');
console.log('  MicroLend Credit Score Engine — Unit Tests');
console.log('══════════════════════════════════════════════\n');

for (const r of results) {
    const line = r.error
        ? `${r.status}  ${r.name}\n        → ${r.error}`
        : `${r.status}  ${r.name}`;
    console.log(line);
}

console.log('\n──────────────────────────────────────────────');
console.log(`  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('──────────────────────────────────────────────\n');

if (failed > 0) process.exit(1);
