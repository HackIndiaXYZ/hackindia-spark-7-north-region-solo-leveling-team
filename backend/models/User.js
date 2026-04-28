const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['lender', 'borrower'],
        required: true
    },
    // In a real production app, this would be encrypted securely via KMS or similar
    // For this simulation, we will store hashed representations of the IDs to demonstrate security
    panCardHash: {
        type: String,
        required: true
    },
    aadharCardHash: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
