import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// ── Helper: get auth headers (JWT preferred, wallet fallback) ────────────────
const getToken = () => localStorage.getItem('microlend_token');

const authHeaders = (walletAddress) => {
    const token = getToken();
    if (token) return { headers: { Authorization: `Bearer ${token}` } };
    if (walletAddress) return { headers: { 'x-wallet-address': walletAddress } };
    return {};
};

// ─── Auth APIs ───────────────────────────────────────────────────────────────

/** Legacy wallet login (kept for MetaMask compat) */
export const apiLoginUser = async (walletAddress) => {
    const res = await axios.post(`${API_BASE}/auth/wallet`, { walletAddress });
    return res.data;
};

/** Signup new user with email/password + KYC */
export const apiSignupUser = async (userData) => {
    const res = await axios.post(`${API_BASE}/auth/register`, userData);
    return res.data;
};

/** Email + password login */
export const apiEmailLogin = async (email, password) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    return res.data;
};

/** Simulated Google login */
export const apiGoogleLogin = async (googleData) => {
    const res = await axios.post(`${API_BASE}/auth/google`, googleData);
    return res.data;
};

/** Get current authenticated user */
export const apiGetMe = async () => {
    const token = getToken();
    if (!token) throw new Error('No token');
    const res = await axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
};

// ─── Loan APIs ───────────────────────────────────────────────────────────────

/** Create a new loan application — requires auth */
export const apiCreateLoan = async (walletAddress, loanData) => {
    const res = await axios.post(`${API_BASE}/loans`, loanData, authHeaders(walletAddress));
    return res.data;
};

/** Get the current user's loans (borrower dashboard) — requires auth */
export const apiGetMyLoans = async (walletAddress) => {
    const res = await axios.get(`${API_BASE}/loans/my`, authHeaders(walletAddress));
    return res.data;
};

/** Get all pending loans for the marketplace (lender dashboard) — requires auth */
export const apiGetPendingLoans = async (walletAddress) => {
    const res = await axios.get(`${API_BASE}/loans/pending`, authHeaders(walletAddress));
    return res.data;
};

/** Get loans this lender has funded — requires auth */
export const apiGetFundedLoans = async (walletAddress) => {
    const res = await axios.get(`${API_BASE}/loans/funded`, authHeaders(walletAddress));
    return res.data;
};

/** Fund a pending loan — requires auth */
export const apiFundLoan = async (walletAddress, loanId) => {
    const res = await axios.put(`${API_BASE}/loans/${loanId}/fund`, {}, authHeaders(walletAddress));
    return res.data;
};

/** Repay a loan — requires auth */
export const apiRepayLoan = async (walletAddress, loanId) => {
    const res = await axios.put(`${API_BASE}/loans/${loanId}/repay`, {}, authHeaders(walletAddress));
    return res.data;
};

/** Mark a loan as defaulted — requires auth */
export const apiDefaultLoan = async (walletAddress, loanId) => {
    const res = await axios.put(`${API_BASE}/loans/${loanId}/default`, {}, authHeaders(walletAddress));
    return res.data;
};

/** Get protocol-wide stats — PUBLIC */
export const apiGetStats = async () => {
    const res = await axios.get(`${API_BASE}/loans/stats`);
    return res.data;
};
