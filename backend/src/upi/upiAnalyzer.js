/**
 * upiAnalyzer.js
 * ─────────────────────────────────────────────────────────────
 * Analyzes raw UPI transactions to derive verifiable metrics
 * that can be fed directly into the score engine.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/**
 * Analyzes an array of UPI transactions and returns derived credit metrics.
 * 
 * @param {Array} transactions 
 * @returns {Object} Extracted metrics
 */
function analyzeUPIData(transactions) {
    if (!transactions || transactions.length === 0) {
        throw new Error("No transactions provided for analysis.");
    }

    // 1. Separate credits and debits
    const credits = transactions.filter(t => t.type === 'credit');
    const debits = transactions.filter(t => t.type === 'debit');

    // 2. Calculate Monthly Average Income
    // Group credits by month-year
    const monthlyCredits = {};
    credits.forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthlyCredits[key]) monthlyCredits[key] = 0;
        monthlyCredits[key] += t.amount;
    });

    const monthsActive = Object.keys(monthlyCredits).length || 1;
    let totalIncome = 0;
    const monthlyIncomes = [];
    
    for (const key in monthlyCredits) {
        totalIncome += monthlyCredits[key];
        monthlyIncomes.push(monthlyCredits[key]);
    }
    
    const avgMonthlyIncome = Math.round(totalIncome / monthsActive);

    // Calculate stability (Variance)
    // For simplicity, just use max vs min diff ratio
    let income_stability_score = 'low';
    if (monthlyIncomes.length > 0) {
        const min = Math.min(...monthlyIncomes);
        const max = Math.max(...monthlyIncomes);
        const varianceRatio = max > 0 ? (max - min) / max : 0;

        if (varianceRatio < 0.2) income_stability_score = 'high';
        else if (varianceRatio < 0.5) income_stability_score = 'medium';
        else income_stability_score = 'low';
    }

    // 3. Derive Employment Type
    let employment_type_detected = 'unemployed';
    const gigKeywords = ['zomato', 'swiggy', 'ola', 'uber', 'dunzo'];
    const farmerKeywords = ['apmc', 'mandi', 'kisan'];
    const businessKeywords = ['merchant', 'bharatpe', 'qr', 'customer', 'distributor'];
    const salaryKeywords = ['salary', 'payroll', 'wages'];

    let counts = { gig: 0, farmer: 0, business: 0, salaried: 0 };

    credits.forEach(t => {
        const desc = t.description.toLowerCase();
        if (gigKeywords.some(k => desc.includes(k))) counts.gig++;
        else if (farmerKeywords.some(k => desc.includes(k))) counts.farmer++;
        else if (businessKeywords.some(k => desc.includes(k))) counts.business++;
        else if (salaryKeywords.some(k => desc.includes(k))) counts.salaried++;
    });

    const maxCount = Math.max(counts.gig, counts.farmer, counts.business, counts.salaried);
    
    if (maxCount > 0) {
        if (counts.salaried === maxCount) employment_type_detected = 'salaried';
        else if (counts.business === maxCount) employment_type_detected = 'self_employed'; // self_employed/business
        else if (counts.gig === maxCount) employment_type_detected = 'gig';
        else if (counts.farmer === maxCount) employment_type_detected = 'self_employed'; // Treat farmer as self-employed
    }

    // 4. Derive Bill Regularity
    // Check how many distinct months have utility/phone bill payments
    const utilityKeywords = ['electricity', 'water', 'recharge', 'prepaid', 'postpaid', 'broadband', 'gas'];
    const utilityMonths = new Set();
    
    debits.forEach(t => {
        const desc = t.description.toLowerCase();
        if (utilityKeywords.some(k => desc.includes(k))) {
            const d = new Date(t.date);
            utilityMonths.add(`${d.getFullYear()}-${d.getMonth()}`);
        }
    });

    let bill_regularity = 'rarely';
    if (utilityMonths.size >= monthsActive - 1 && monthsActive > 1) {
        bill_regularity = 'always';
    } else if (utilityMonths.size >= Math.floor(monthsActive / 2)) {
        bill_regularity = 'sometimes';
    }

    // 5. Debt Signals
    const debtKeywords = ['loan', 'emi', 'repayment', 'bajaj', 'muthoot'];
    let debtTransactions = 0;
    debits.forEach(t => {
        const desc = t.description.toLowerCase();
        if (debtKeywords.some(k => desc.includes(k))) {
            debtTransactions++;
        }
    });

    let existing_debt_load = 'none';
    if (debtTransactions > 3) existing_debt_load = 'high';
    else if (debtTransactions > 1) existing_debt_load = 'medium';
    else if (debtTransactions === 1) existing_debt_load = 'low';

    return {
        avg_monthly_income: avgMonthlyIncome,
        income_stability_score,
        employment_type_detected,
        bill_regularity,
        existing_debt_load,
        total_transactions_analyzed: transactions.length,
        months_active: monthsActive
    };
}

module.exports = {
    analyzeUPIData
};
