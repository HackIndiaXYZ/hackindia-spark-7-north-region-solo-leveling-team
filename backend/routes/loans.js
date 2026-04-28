const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');

// ─── Middleware: require wallet address in header ──────────────────────────────
const requireWallet = (req, res, next) => {
    const wallet = req.headers['x-wallet-address'];
    if (!wallet) {
        return res.status(401).json({ error: 'Wallet address required. Connect your wallet first.' });
    }
    req.walletAddress = wallet.toLowerCase();
    next();
};

// ─── POST /api/loans — Create a new loan application ──────────────────────────
router.post('/', requireWallet, async (req, res) => {
    try {
        const { amount, creditScore, purpose, duration, interestRateBps, txHash, collateralAsset, collateralValue } = req.body;

        const loan = new Loan({
            borrower: req.walletAddress,
            amount,
            creditScore,
            purpose,
            duration: Number(duration),
            interestRateBps: interestRateBps || 800,
            txHash: txHash || null,
            collateralAsset: collateralAsset || 'None',
            collateralValue: collateralValue ? Number(collateralValue) : 0,
        });

        await loan.save();
        res.status(201).json(loan);
    } catch (err) {
        console.error('Create loan error:', err);
        res.status(500).json({ error: 'Failed to create loan.' });
    }
});

// ─── GET /api/loans/my — Borrower's own loans only ────────────────────────────
router.get('/my', requireWallet, async (req, res) => {
    try {
        const loans = await Loan.find({ borrower: req.walletAddress }).sort({ createdAt: -1 });
        res.json(loans);
    } catch (err) {
        console.error('Fetch my loans error:', err);
        res.status(500).json({ error: 'Failed to fetch loans.' });
    }
});

// ─── GET /api/loans/pending — Marketplace: all pending loans (for lenders) ────
// Requires wallet so unauthenticated users can't browse
router.get('/pending', requireWallet, async (req, res) => {
    try {
        // Show all pending loans EXCEPT the lender's own
        const loans = await Loan.find({
            status: 0,
            borrower: { $ne: req.walletAddress }
        }).sort({ createdAt: -1 });
        res.json(loans);
    } catch (err) {
        console.error('Fetch pending loans error:', err);
        res.status(500).json({ error: 'Failed to fetch pending loans.' });
    }
});

// ─── GET /api/loans/funded — Loans this lender has funded ─────────────────────
router.get('/funded', requireWallet, async (req, res) => {
    try {
        const loans = await Loan.find({ lender: req.walletAddress }).sort({ createdAt: -1 });
        res.json(loans);
    } catch (err) {
        console.error('Fetch funded loans error:', err);
        res.status(500).json({ error: 'Failed to fetch funded loans.' });
    }
});

// ─── PUT /api/loans/:id/fund — Lender funds a pending loan ───────────────────
router.put('/:id/fund', requireWallet, async (req, res) => {
    try {
        const loan = await Loan.findOne({ loanId: Number(req.params.id), status: 0 });
        if (!loan) return res.status(404).json({ error: 'Loan not found or already funded.' });
        if (loan.borrower === req.walletAddress) {
            return res.status(400).json({ error: 'Cannot fund your own loan.' });
        }

        loan.lender = req.walletAddress;
        loan.status = 1; // Active / Funded
        loan.repayBy = Math.floor(Date.now() / 1000) + (loan.duration * 86400);
        await loan.save();
        res.json(loan);
    } catch (err) {
        console.error('Fund loan error:', err);
        res.status(500).json({ error: 'Failed to fund loan.' });
    }
});

// ─── PUT /api/loans/:id/repay — Borrower repays their loan ───────────────────
router.put('/:id/repay', requireWallet, async (req, res) => {
    try {
        const loan = await Loan.findOne({ loanId: Number(req.params.id), borrower: req.walletAddress, status: 1 });
        if (!loan) return res.status(404).json({ error: 'Active loan not found.' });

        loan.status = 2;
        loan.repaid = true;
        await loan.save();
        res.json(loan);
    } catch (err) {
        console.error('Repay loan error:', err);
        res.status(500).json({ error: 'Failed to repay loan.' });
    }
});

// ─── PUT /api/loans/:id/default — Mark loan as defaulted ─────────────────────
router.put('/:id/default', requireWallet, async (req, res) => {
    try {
        const loan = await Loan.findOne({ loanId: Number(req.params.id), borrower: req.walletAddress, status: 1 });
        if (!loan) return res.status(404).json({ error: 'Loan not found.' });

        loan.status = 3;
        await loan.save();
        res.json(loan);
    } catch (err) {
        console.error('Default loan error:', err);
        res.status(500).json({ error: 'Failed to mark loan as defaulted.' });
    }
});

// ─── GET /api/loans/stats — Protocol-wide statistics ─────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const totalLoans = await Loan.countDocuments();
        const pipeline = await Loan.aggregate([
            { $group: { _id: null, tvl: { $sum: '$amount' } } }
        ]);
        const tvl = pipeline.length > 0 ? pipeline[0].tvl : 0;
        res.json({ totalLoans, tvl });
    } catch (err) {
        console.error('Stats error:', err);
        res.json({ totalLoans: 0, tvl: 0 });
    }
});

module.exports = router;
