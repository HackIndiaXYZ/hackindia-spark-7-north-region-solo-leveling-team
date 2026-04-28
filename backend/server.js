require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const creditScoreRoute = require('./routes/creditScore');
const loansRoute = require('./routes/loans');
const authRoute = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MongoDB Connection ────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/microlend';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('⚠️  Server will run without database — demo data only');
    });

// ─── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/credit-score', creditScoreRoute);
app.use('/api/loans', loansRoute);
app.use('/api/auth', authRoute);

app.get('/', (req, res) => {
    res.send('MicroLend Backend API is running...');
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
