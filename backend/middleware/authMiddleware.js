const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'microlend_super_secret_key_2024';

/**
 * Middleware: Verify JWT token from Authorization header.
 * Populates req.user with decoded payload.
 */
const requireAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { userId, email, walletAddress, role }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    }
};

/**
 * Middleware: Works with BOTH JWT token AND legacy x-wallet-address header.
 * Allows backward compatibility with existing wallet-based requests.
 */
const requireWalletOrAuth = (req, res, next) => {
    // Try JWT first
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            req.walletAddress = decoded.walletAddress || decoded.email;
            return next();
        } catch (err) {
            return res.status(401).json({ error: 'Session expired. Please log in again.' });
        }
    }

    // Fallback to wallet address header
    const wallet = req.headers['x-wallet-address'];
    if (wallet) {
        req.walletAddress = wallet.toLowerCase();
        return next();
    }

    return res.status(401).json({ error: 'Authentication required.' });
};

module.exports = { requireAuth, requireWalletOrAuth };
