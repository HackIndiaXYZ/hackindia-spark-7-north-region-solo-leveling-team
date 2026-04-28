const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    // Auto-incrementing human-readable ID (set in pre-save hook)
    loanId: { type: Number, unique: true },

    // The borrower's wallet address – primary key for data isolation
    borrower: { type: String, required: true, index: true },

    // Who funded this loan (lender wallet address)
    lender: { type: String, default: null },

    amount: { type: Number, required: true },
    creditScore: { type: Number, required: true },
    interestRateBps: { type: Number, default: 800 }, // 8% = 800 bps
    duration: { type: Number, required: true },       // days
    purpose: { type: String, required: true },

    // 0 = Pending, 1 = Funded/Active, 2 = Repaid, 3 = Defaulted
    status: { type: Number, default: 0 },

    repaid: { type: Boolean, default: false },

    // Real World Asset (RWA) Collateral
    collateralAsset: { type: String, default: 'None' },
    collateralValue: { type: Number, default: 0 },

    // Timestamps (epoch seconds to match on-chain convention)
    createdAt: { type: Number, default: () => Math.floor(Date.now() / 1000) },
    repayBy:   { type: Number, default: 0 },

    // Optional on-chain tx hash reference
    txHash: { type: String, default: null },
}, {
    timestamps: false  // we manage our own timestamps
});

// Auto-increment loanId
loanSchema.pre('save', async function () {
    if (this.isNew && !this.loanId) {
        const last = await mongoose.model('Loan').findOne().sort({ loanId: -1 });
        this.loanId = last ? last.loanId + 1 : 1;
    }
});

module.exports = mongoose.model('Loan', loanSchema);
