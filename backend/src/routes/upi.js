const express = require('express');
const router = express.Router();
const { generateMockUPIHistory } = require('../upi/upiMockData');
const { analyzeUPIData } = require('../upi/upiAnalyzer');

/**
 * @route POST /api/upi/analyze
 * @desc Generate and analyze mock UPI data for a persona
 * @access Public (for hackathon demo)
 */
router.post('/analyze', async (req, res) => {
    try {
        const { persona = 'gig_worker' } = req.body;

        // 1. Generate Mock Data
        const transactions = generateMockUPIHistory(persona);

        // 2. Analyze the Data
        const metrics = analyzeUPIData(transactions);

        // 3. Return both the derived metrics and the raw mock transactions
        return res.status(200).json({
            success: true,
            data: {
                metrics,
                // transactions: transactions // Un-comment if frontend needs raw data
            }
        });

    } catch (error) {
        console.error('UPI Analysis Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to analyze UPI transactions.',
            error: error.message
        });
    }
});

module.exports = router;
