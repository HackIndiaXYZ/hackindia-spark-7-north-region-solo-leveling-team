const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'microlend_super_secret_key_2024';
const JWT_EXPIRES = '7d';

const generateToken = (user) => jwt.sign(
    {
        userId: user._id,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        name: user.name,
        authProvider: user.authProvider
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
);

// Helper: hash sensitive data (PAN, Aadhaar, phone, address)
const hashField = async (value) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(value, salt);
};

// Sanitized user object to send back (no hashes exposed)
const safeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    age: user.age,
    role: user.role,
    walletAddress: user.walletAddress,
    authProvider: user.authProvider,
    createdAt: user.createdAt
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register — Full sign-up with profile + KYC
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, address, age, role, panCard, aadharCard } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Name, email, password, and role are required.' });
        }
        if (!['lender', 'borrower'].includes(role)) {
            return res.status(400).json({ message: 'Role must be lender or borrower.' });
        }
        if (age && (age < 18 || age > 120)) {
            return res.status(400).json({ message: 'Age must be between 18 and 120.' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const panCardHash   = panCard    ? await hashField(panCard)    : undefined;
        const aadharCardHash = aadharCard ? await hashField(aadharCard) : undefined;
        const phoneHash     = phone      ? await hashField(phone)      : undefined;
        const addressHash   = address    ? await hashField(address)    : undefined;

        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            phone,
            phoneHash,
            address,
            addressHash,
            age: age ? Number(age) : undefined,
            role,
            panCardHash,
            aadharCardHash,
            authProvider: 'email'
        });

        await newUser.save();

        const token = generateToken(newUser);
        res.status(201).json({ token, user: safeUser(newUser) });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login — Email + Password login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email.' });
        }
        if (!user.passwordHash) {
            return res.status(400).json({ message: 'This account uses a different sign-in method.' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        const token = generateToken(user);
        res.json({ token, user: safeUser(user) });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/google — Simulated Google SSO (demo / hackathon)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
    try {
        const { googleId, name, email, role } = req.body;

        if (!googleId || !email || !name) {
            return res.status(400).json({ message: 'Google auth data is incomplete.' });
        }
        if (role && !['lender', 'borrower'].includes(role)) {
            return res.status(400).json({ message: 'Role must be lender or borrower.' });
        }

        let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

        if (!user) {
            // New Google user — create account
            if (!role) return res.status(400).json({ message: 'Please select a role to complete sign-up.' });

            user = new User({
                name,
                email: email.toLowerCase(),
                googleId,
                role,
                authProvider: 'google'
            });
            await user.save();
        } else if (!user.googleId) {
            // Existing email user — link Google account
            user.googleId = googleId;
            user.authProvider = 'google';
            await user.save();
        }

        const token = generateToken(user);
        res.json({ token, user: safeUser(user), isNewUser: !user.panCardHash });
    } catch (err) {
        console.error('Google auth error:', err);
        res.status(500).json({ message: 'Server error during Google sign-in.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/wallet — Legacy MetaMask wallet-based login/signup
// ─────────────────────────────────────────────────────────────────────────────
router.post('/wallet', async (req, res) => {
    try {
        const { walletAddress, role, panCard, aadharCard, name, phone, address, age } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ message: 'Wallet address required.' });
        }

        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (user) {
            // Existing user — return token
            const token = generateToken(user);
            return res.json({ token, user: safeUser(user), isExisting: true });
        }

        // New user — requires role and KYC
        if (!role || !panCard || !aadharCard) {
            return res.status(404).json({ message: 'New user — please complete KYC.' });
        }

        const panCardHash    = await hashField(panCard);
        const aadharCardHash = await hashField(aadharCard);
        const phoneHash      = phone    ? await hashField(phone)    : undefined;
        const addressHash    = address  ? await hashField(address)  : undefined;

        const newUser = new User({
            name: name || `User_${walletAddress.substring(2, 8)}`,
            walletAddress: walletAddress.toLowerCase(),
            role,
            panCardHash,
            aadharCardHash,
            phone,
            phoneHash,
            address,
            addressHash,
            age: age ? Number(age) : undefined,
            authProvider: 'wallet'
        });

        await newUser.save();
        const token = generateToken(newUser);
        res.status(201).json({ token, user: safeUser(newUser), isExisting: false });
    } catch (err) {
        console.error('Wallet auth error:', err);
        res.status(500).json({ message: 'Server error during wallet login.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me — Get current user from JWT
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authenticated.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json(safeUser(user));
    } catch (err) {
        res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
});

module.exports = router;
