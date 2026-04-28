const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

// POST /api/auth/login
// Check if user exists. If so, return user. If not, return 404 to trigger KYC sign up.
router.post('/login', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress) {
            return res.status(400).json({ message: 'Wallet address required' });
        }

        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found, please sign up with KYC' });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// POST /api/auth/signup
// Register a new user with KYC details
router.post('/signup', async (req, res) => {
    try {
        const { walletAddress, role, panCard, aadharCard } = req.body;
        
        if (!walletAddress || !role || !panCard || !aadharCard) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Simulate secure encryption of KYC data
        // In real life, we would use AES encryption or KMS to be able to decrypt and verify
        // For this demo, hashing demonstrates that plain-text data isn't stored.
        const salt = await bcrypt.genSalt(10);
        const panCardHash = await bcrypt.hash(panCard, salt);
        const aadharCardHash = await bcrypt.hash(aadharCard, salt);

        const newUser = new User({
            walletAddress: walletAddress.toLowerCase(),
            role,
            panCardHash,
            aadharCardHash
        });

        await newUser.save();
        res.status(201).json(newUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

module.exports = router;
