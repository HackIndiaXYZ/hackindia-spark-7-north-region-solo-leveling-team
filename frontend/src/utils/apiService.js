import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Helper: attach the wallet address as a header for server-side auth
const authHeaders = (walletAddress) => ({
    headers: { 'x-wallet-address': walletAddress }
});

// ─── Auth APIs ──────────────────────────────────────────────────────────────────

/** Login to check if user exists */
export const apiLoginUser = async (walletAddress) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { walletAddress });
    return res.data;
};

/** Signup new user with KYC */
export const apiSignupUser = async (userData) => {
    const res = await axios.post(`${API_BASE}/auth/signup`, userData);
    return res.data;
};

// ─── Loan APIs ──────────────────────────────────────────────────────────────────

/** Create a new loan application */
export const apiCreateLoan = async (walletAddress, loanData) => {
    const res = await axios.post(`${API_BASE}/loans`, loanData, authHeaders(walletAddress));
    return res.data;
};

/** Get the current user's loans (borrower dashboard) */
export const apiGetMyLoans = async (walletAddress) => {
    const res = await axios.get(`${API_BASE}/loans/my`, authHeaders(walletAddress));
    return res.data;
};

/** Get all pending loans for the marketplace (lender dashboard) */
export const apiGetPendingLoans = async (walletAddress) => {
    const res = await axios.get(`${API_BASE}/loans/pending`, authHeaders(walletAddress));
    return res.data;
};

/** Get loans this lender has funded */
export const apiGetFundedLoans = async (walletAddress) => {
    const res = await axios.get(`${API_BASE}/loans/funded`, authHeaders(walletAddress));
    return res.data;
};

/** Fund a pending loan */
export const apiFundLoan = async (walletAddress, loanId) => {
    const res = await axios.put(`${API_BASE}/loans/${loanId}/fund`, {}, authHeaders(walletAddress));
    return res.data;
};

/** Repay a loan */
export const apiRepayLoan = async (walletAddress, loanId) => {
    const res = await axios.put(`${API_BASE}/loans/${loanId}/repay`, {}, authHeaders(walletAddress));
    return res.data;
};

/** Mark a loan as defaulted */
export const apiDefaultLoan = async (walletAddress, loanId) => {
    const res = await axios.put(`${API_BASE}/loans/${loanId}/default`, {}, authHeaders(walletAddress));
    return res.data;
};

/** Get protocol-wide stats */
export const apiGetStats = async () => {
    const res = await axios.get(`${API_BASE}/loans/stats`);
    return res.data;
};
