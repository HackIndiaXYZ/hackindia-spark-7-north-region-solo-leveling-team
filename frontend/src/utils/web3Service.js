/* global BigInt */
import { parseEther } from 'ethers';
import { apiCreateLoan, apiGetMyLoans, apiGetPendingLoans, apiFundLoan, apiRepayLoan, apiDefaultLoan, apiGetStats } from './apiService';

export const applyForLoan = async (contract, signer, amount, creditScore, purpose, duration, isDemoMode, walletAddress, collateralAsset, collateralValue) => {
    // Always persist to MongoDB
    try {
        await apiCreateLoan(walletAddress, {
            amount: Number(amount),
            creditScore,
            purpose,
            duration: Number(duration),
            interestRateBps: 800,
            collateralAsset,
            collateralValue: Number(collateralValue)
        });
    } catch (err) {
        console.error('API create loan error:', err);
    }

    if (isDemoMode) {
        return new Promise(resolve => setTimeout(() =>
            resolve({ success: true, txHash: "0xMockTxHash...Apply", loanId: Math.floor(Math.random() * 1000) })
        , 1500));
    }
    try {
        const amountWei = parseEther(amount.toString());
        const tx = await contract.applyForLoan(amountWei, creditScore, purpose, duration, collateralAsset, collateralValue);
        await tx.wait();
        return { success: true, txHash: tx.hash, loanId: 0 };
    } catch (e) {
        console.error(e);
        return { success: false, error: e };
    }
};

export const fundLoan = async (contract, signer, borrowerAddress, loanId, amount, isDemoMode, walletAddress) => {
    // Update DB
    try {
        await apiFundLoan(walletAddress, loanId);
    } catch (err) {
        console.error('API fund loan error:', err);
    }

    if (isDemoMode) {
        return new Promise(resolve => setTimeout(() =>
            resolve({ success: true, txHash: "0xMockTxHash...Fund" })
        , 1500));
    }
    try {
        const amountWei = parseEther(amount.toString());
        const tx = await contract.fundLoan(borrowerAddress, loanId, { value: amountWei });
        await tx.wait();
        return { success: true, txHash: tx.hash };
    } catch (e) {
        console.error(e);
        return { success: false, error: e };
    }
};

export const repayLoan = async (contract, signer, loanId, principalAmount, interestRate, isDemoMode, walletAddress) => {
    // Update DB
    try {
        await apiRepayLoan(walletAddress, loanId);
    } catch (err) {
        console.error('API repay loan error:', err);
    }

    if (isDemoMode) {
        return new Promise(resolve => setTimeout(() =>
            resolve({ success: true, txHash: "0xMockTxHash...Repay" })
        , 1500));
    }
    try {
        const amountWei = parseEther(principalAmount.toString());
        const interestRateBps = BigInt(Math.floor(interestRate * 100));
        const interestWei = (amountWei * interestRateBps) / 10000n;
        const totalRepaymentWei = amountWei + interestWei;
        const tx = await contract.repayLoan(loanId, { value: totalRepaymentWei });
        await tx.wait();
        return { success: true, txHash: tx.hash };
    } catch (e) {
        console.error(e);
        return { success: false, error: e };
    }
};

// Feature 4: Mark overdue loan as defaulted
export const markLoanAsDefaulted = async (contract, borrowerAddress, loanId, isDemoMode, walletAddress) => {
    // Update DB
    try {
        await apiDefaultLoan(walletAddress || borrowerAddress, loanId);
    } catch (err) {
        console.error('API default loan error:', err);
    }

    if (isDemoMode) {
        return new Promise(resolve => setTimeout(() =>
            resolve({ success: true, txHash: "0xMockTxHash...Default" })
        , 1500));
    }
    try {
        const tx = await contract.markAsDefaulted(borrowerAddress, loanId);
        await tx.wait();
        return { success: true, txHash: tx.hash };
    } catch (e) {
        console.error(e);
        return { success: false, error: e };
    }
};

// ─── Data Fetching (now via API) ─────────────────────────────────────────────

export const getBorrowerLoans = async (contract, address, isDemoMode) => {
    try {
        const loans = await apiGetMyLoans(address);
        return loans.map(normalizeLoan);
    } catch (err) {
        console.error('getBorrowerLoans API error:', err);
        return [];
    }
};

export const getAllPendingLoans = async (contract, isDemoMode, walletAddress) => {
    try {
        const loans = await apiGetPendingLoans(walletAddress);
        return loans.map(normalizeLoan);
    } catch (err) {
        console.error('getAllPendingLoans API error:', err);
        return [];
    }
};

export const getProtocolStats = async (contract, isDemoMode) => {
    try {
        const stats = await apiGetStats();
        return stats;
    } catch (err) {
        console.error('getProtocolStats API error:', err);
        return { totalLoans: 0, tvl: 0 };
    }
};

// Normalize DB loan to the shape the frontend expects
const normalizeLoan = (l) => ({
    id: l.loanId,
    borrower: l.borrower,
    lender: l.lender,
    amount: l.amount,
    creditScore: l.creditScore,
    interestRate: (l.interestRateBps || 800) / 100,
    interestRateBps: l.interestRateBps || 800,
    duration: l.duration,
    purpose: l.purpose,
    status: l.status,
    createdAt: l.createdAt,
    repayBy: l.repayBy,
    repaid: l.repaid,
    collateralAsset: l.collateralAsset,
    collateralValue: l.collateralValue
});

// Utility: check if a funded loan is overdue past grace period (7 days)
export const isLoanOverdue = (loan) => {
    if (loan.status !== 1 || loan.repaid) return false;
    if (!loan.repayBy || loan.repayBy === 0) return false;
    const gracePeriodSeconds = 7 * 24 * 60 * 60;
    return Math.floor(Date.now() / 1000) > loan.repayBy + gracePeriodSeconds;
};

// Utility: days overdue
export const daysOverdue = (loan) => {
    if (!isLoanOverdue(loan)) return 0;
    const nowSec = Math.floor(Date.now() / 1000);
    return Math.floor((nowSec - loan.repayBy) / 86400);
};
