const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // ─── Identity ──────────────────────────────────────────────────────────────
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    age: {
        type: Number,
        min: 18,
        max: 120
    },

    // ─── Auth Providers ────────────────────────────────────────────────────────
    authProvider: {
        type: String,
        enum: ['email', 'google', 'wallet'],
        default: 'email'
    },
    passwordHash: {
        type: String
        // Required only for email auth provider
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    walletAddress: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },

    // ─── Role ─────────────────────────────────────────────────────────────────
    role: {
        type: String,
        enum: ['lender', 'borrower'],
        required: true
    },

    // ─── Encrypted KYC Fields ─────────────────────────────────────────────────
    // Stored as bcrypt hashes — cannot be reversed, demonstrates privacy-first design
    panCardHash: {
        type: String
    },
    aadharCardHash: {
        type: String
    },
    // Encrypted phone/address (AES-256 simulation via hash for demo)
    phoneHash: {
        type: String
    },
    addressHash: {
        type: String
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
