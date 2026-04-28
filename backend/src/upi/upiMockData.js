/**
 * upiMockData.js
 * ─────────────────────────────────────────────────────────────
 * Generates 6 months of realistic mock UPI transaction history
 * based on selected personas. Designed to mimic the structure 
 * of Account Aggregator (AA) UPI data.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/**
 * Helper to generate a random 12-digit UPI reference number.
 */
function generateUPIRef() {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

/**
 * Helper to get a random date within a specific month and year.
 * @param {number} year 
 * @param {number} month (0-11)
 * @param {boolean} isWeekendOnly 
 */
function getRandomDateInMonth(year, month, isWeekendOnly = false) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let day = Math.floor(Math.random() * daysInMonth) + 1;
    let date = new Date(year, month, day);

    if (isWeekendOnly) {
        // Find a weekend day
        while (date.getDay() !== 0 && date.getDay() !== 6) {
            day = Math.floor(Math.random() * daysInMonth) + 1;
            date = new Date(year, month, day);
        }
    }

    // Add random time during the day (8 AM to 10 PM)
    const hours = Math.floor(Math.random() * 15) + 8;
    const minutes = Math.floor(Math.random() * 60);
    date.setHours(hours, minutes, 0, 0);

    return date.toISOString();
}

/**
 * Generates mock transaction history for a Gig Worker.
 * - 25-40 inbound/month (Zomato/Swiggy/Ola)
 * - ₹400-₹800 per trans
 * - Spikes on weekends
 * - Regular outflows: phone (₹299), electricity (₹800)
 */
function generateGigWorkerHistory(startDate) {
    const transactions = [];
    const platforms = ['ZOMATO PAYMENT', 'SWIGGY PAYOUT', 'OLA CAB SETTLEMENT'];

    for (let i = 0; i < 6; i++) {
        const currentYear = startDate.getFullYear();
        const currentMonth = startDate.getMonth() - i;
        
        // Handle year wrap-around properly
        const targetDate = new Date(currentYear, currentMonth, 1);
        const y = targetDate.getFullYear();
        const m = targetDate.getMonth();

        // 25-40 credits
        const numCredits = Math.floor(Math.random() * 16) + 25; 
        for (let j = 0; j < numCredits; j++) {
            // 70% chance of weekend spike
            const isWeekend = Math.random() > 0.3;
            transactions.push({
                date: getRandomDateInMonth(y, m, isWeekend),
                type: 'credit',
                amount: Math.floor(Math.random() * 401) + 400, // 400-800
                description: platforms[Math.floor(Math.random() * platforms.length)],
                upi_ref: generateUPIRef()
            });
        }

        // Regular Outflows (Once a month)
        transactions.push({
            date: getRandomDateInMonth(y, m, false),
            type: 'debit',
            amount: 299,
            description: 'JIO PREPAID RECHARGE',
            upi_ref: generateUPIRef()
        });

        transactions.push({
            date: getRandomDateInMonth(y, m, false),
            type: 'debit',
            amount: 800 + Math.floor(Math.random() * 150), // 800-950
            description: 'ELECTRICITY BILL PAYMENT',
            upi_ref: generateUPIRef()
        });
        
        // Random daily expenses
        const numDebits = Math.floor(Math.random() * 10) + 5;
        for (let j = 0; j < numDebits; j++) {
            transactions.push({
                date: getRandomDateInMonth(y, m, false),
                type: 'debit',
                amount: Math.floor(Math.random() * 150) + 50,
                description: 'KIRANA STORE / TEA STALL',
                upi_ref: generateUPIRef()
            });
        }
    }
    return transactions;
}

/**
 * Generates mock transaction history for a Farmer.
 * - 2-4 large inbound/month (APMC)
 * - Seasonal: high Oct-Dec, near zero May-July
 * - Regular outflows: fertilizer, electricity
 */
function generateFarmerHistory(startDate) {
    const transactions = [];

    for (let i = 0; i < 6; i++) {
        const currentYear = startDate.getFullYear();
        const currentMonth = startDate.getMonth() - i;
        
        const targetDate = new Date(currentYear, currentMonth, 1);
        const y = targetDate.getFullYear();
        const m = targetDate.getMonth();

        // Check seasonality (Months are 0-indexed: Oct=9, Nov=10, Dec=11, May=4, Jun=5, Jul=6)
        let isHighSeason = [9, 10, 11].includes(m);
        let isLowSeason = [4, 5, 6].includes(m);

        let numCredits = 0;
        let amountBase = 0;

        if (isHighSeason) {
            numCredits = Math.floor(Math.random() * 3) + 3; // 3-5
            amountBase = 8000;
        } else if (isLowSeason) {
            numCredits = Math.random() > 0.5 ? 1 : 0; // 0-1
            amountBase = 2000;
        } else {
            numCredits = Math.floor(Math.random() * 3) + 1; // 1-3
            amountBase = 4000;
        }

        for (let j = 0; j < numCredits; j++) {
            transactions.push({
                date: getRandomDateInMonth(y, m, false),
                type: 'credit',
                amount: amountBase + Math.floor(Math.random() * 5000), 
                description: 'APMC MANDI SETTLEMENT',
                upi_ref: generateUPIRef()
            });
        }

        // Outflows
        transactions.push({
            date: getRandomDateInMonth(y, m, false),
            type: 'debit',
            amount: 1500 + Math.floor(Math.random() * 1000),
            description: 'FERTILIZER & SEED SHOP',
            upi_ref: generateUPIRef()
        });

        transactions.push({
            date: getRandomDateInMonth(y, m, false),
            type: 'debit',
            amount: 600 + Math.floor(Math.random() * 200),
            description: 'ELECTRICITY BILL PAYMENT',
            upi_ref: generateUPIRef()
        });
    }
    return transactions;
}

/**
 * Generates mock transaction history for a Kirana Owner.
 * - 50-80 small inbound/month (PhonePe/GPay) ₹50-₹500
 * - Steady daily pattern
 */
function generateKiranaOwnerHistory(startDate) {
    const transactions = [];
    const descriptions = ['PHONEPE MERCHANT SETTLEMENT', 'BHARATPE QR PAYMENT', 'GPAY CUSTOMER'];

    for (let i = 0; i < 6; i++) {
        const currentYear = startDate.getFullYear();
        const currentMonth = startDate.getMonth() - i;
        
        const targetDate = new Date(currentYear, currentMonth, 1);
        const y = targetDate.getFullYear();
        const m = targetDate.getMonth();

        // 50-80 credits
        const numCredits = Math.floor(Math.random() * 31) + 50; 
        for (let j = 0; j < numCredits; j++) {
            transactions.push({
                date: getRandomDateInMonth(y, m, false),
                type: 'credit',
                amount: Math.floor(Math.random() * 451) + 50, // 50-500
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                upi_ref: generateUPIRef()
            });
        }

        // Supplier debits
        const numDebits = Math.floor(Math.random() * 4) + 2;
        for (let j = 0; j < numDebits; j++) {
            transactions.push({
                date: getRandomDateInMonth(y, m, false),
                type: 'debit',
                amount: Math.floor(Math.random() * 5000) + 3000,
                description: 'WHOLESALE DISTRIBUTOR PAYMENT',
                upi_ref: generateUPIRef()
            });
        }
        
        // Utility
        transactions.push({
            date: getRandomDateInMonth(y, m, false),
            type: 'debit',
            amount: 1200 + Math.floor(Math.random() * 300),
            description: 'ELECTRICITY BILL PAYMENT',
            upi_ref: generateUPIRef()
        });
    }
    return transactions;
}

/**
 * Main export function to generate 6 months of data for a given persona.
 * @param {'gig_worker'|'farmer'|'kirana_owner'} persona 
 */
function generateMockUPIHistory(persona) {
    const startDate = new Date();
    let transactions = [];

    switch (persona) {
        case 'gig_worker':
            transactions = generateGigWorkerHistory(startDate);
            break;
        case 'farmer':
            transactions = generateFarmerHistory(startDate);
            break;
        case 'kirana_owner':
            transactions = generateKiranaOwnerHistory(startDate);
            break;
        default:
            transactions = generateGigWorkerHistory(startDate);
    }

    // Sort by date ascending (oldest to newest)
    return transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
}

module.exports = {
    generateMockUPIHistory
};
