import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { getBorrowerLoans, repayLoan, markLoanAsDefaulted, isLoanOverdue, daysOverdue } from '../utils/web3Service';
import LoanCard from '../components/LoanCard';
import ReputationBadge from '../components/ReputationBadge';
import { toastPending, toastError, toastTx } from '../components/ToastProvider';
import { User, History, Wallet, AlertTriangle, ExternalLink, ShieldOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BorrowerDashboard = () => {
    const { contract, signer, walletAddress, isDemoMode, isConnected } = useWeb3();
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [defaultingId, setDefaultingId] = useState(null);

    // ─── Auth Guard: redirect if not connected ────────────────────────────────
    const isAuthed = isConnected || isDemoMode;

    useEffect(() => {
        if (!isAuthed) {
            setLoading(false);
            return;
        }
        const fetchLoans = async () => {
            setLoading(true);
            const address = isDemoMode ? "0xdemo_borrower" : walletAddress;
            const data = await getBorrowerLoans(contract, address, isDemoMode);
            setLoans(data);
            setLoading(false);
        };
        fetchLoans();
    }, [contract, walletAddress, isDemoMode, isAuthed]);

    const handleRepay = async (loanId, amount, interestRate) => {
        toastPending("Executing repayment transaction...");
        const address = isDemoMode ? "0xdemo_borrower" : walletAddress;
        const res = await repayLoan(contract, signer, loanId, amount, interestRate, isDemoMode, address);
        if (res.success) {
            toastTx(res.txHash);
            setLoans(loans.map(l => l.id === loanId ? { ...l, status: 2, repaid: true } : l));
        } else {
            toastError("Transaction failed. Check balance.");
        }
    };

    const handleMarkDefault = async (loan) => {
        setDefaultingId(loan.id);
        toastPending("Marking loan as defaulted on-chain...");
        const borrower = isDemoMode ? "0xdemo_borrower" : walletAddress;
        const res = await markLoanAsDefaulted(contract, borrower, loan.id, isDemoMode, borrower);
        if (res.success) {
            toastTx(res.txHash);
            setLoans(loans.map(l => l.id === loan.id ? { ...l, status: 3 } : l));
        } else {
            toastError("Could not mark as defaulted.");
        }
        setDefaultingId(null);
    };

    // ─── Not Connected State ──────────────────────────────────────────────────
    if (!isAuthed) {
        return (
            <div className="py-32 px-6 max-w-2xl mx-auto text-center min-h-screen">
                <div className="tonal-card p-16 rounded-3xl ghost-border">
                    <div className="text-on-surface-variant mb-6 flex justify-center opacity-20">
                        <ShieldOff size={64} />
                    </div>
                    <h2 className="text-3xl font-display font-bold mb-4">Wallet Not Connected</h2>
                    <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
                        Connect your wallet to view your personal loan dashboard. Each wallet has its own isolated data — your loans are private to you.
                    </p>
                    <button onClick={() => navigate('/login')} className="bg-primary hover:bg-primary-dim text-white font-bold py-4 px-10 rounded-2xl transition-all flex items-center justify-center mx-auto space-x-2">
                        <Wallet size={20} />
                        <span>Connect Wallet</span>
                    </button>
                </div>
            </div>
        );
    }

    const activeLoans = loans.filter(l => l.status === 1 && !isLoanOverdue(l));
    const overdueLoans = loans.filter(l => isLoanOverdue(l));
    const historyLoans = loans.filter(l => l.status !== 1 || (!isLoanOverdue(l) && l.status !== 0));

    return (
        <div className="py-12 px-6 max-w-7xl mx-auto min-h-screen">
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-3 text-primary mb-2">
                        <User size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Personal Portfolio</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-bold">
                        Borrower <span className="text-primary">Console</span>
                    </h1>
                </div>
                <div className="bg-surface-low ghost-border rounded-xl px-4 py-3 flex items-center space-x-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Signer Identity</span>
                        <span className="text-sm font-mono text-primary font-bold">
                            {isDemoMode ? "0xDemo...1234" : (walletAddress ? `${walletAddress.substring(0,8)}...${walletAddress.slice(-8)}` : 'Not Connected')}
                        </span>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Total Loans</span>
                        <span className="text-sm font-display font-bold text-on-surface">{loans.length}</span>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center py-32 space-x-3">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-[10px] font-bold tracking-widest text-on-surface-variant animate-pulse">SYNCHRONIZING WITH DATABASE</span>
                </div>
            ) : (
                <>
                    {/* Feature 1: Reputation Badge */}
                    <section className="mb-12">
                        <ReputationBadge loans={loans} />
                    </section>

                    {/* Feature 4: Overdue Loans Warning */}
                    <AnimatePresence>
                        {overdueLoans.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-10"
                            >
                                <div className="bg-error/5 border border-error/20 rounded-2xl p-6">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <AlertTriangle size={20} className="text-error" />
                                        <h2 className="text-lg font-display font-bold text-error">
                                            Overdue Obligations ({overdueLoans.length})
                                        </h2>
                                    </div>
                                    <p className="text-sm text-on-surface-variant mb-5">
                                        These loans have passed their repayment deadline + 7-day grace period.
                                        They can now be marked as defaulted on-chain, which will affect your credit score.
                                    </p>
                                    <div className="space-y-3">
                                        {overdueLoans.map(loan => (
                                            <div key={loan.id} className="flex items-center justify-between bg-error/5 border border-error/10 rounded-xl p-4">
                                                <div>
                                                    <span className="text-sm font-bold text-on-surface">
                                                        Loan #{loan.id.toString().padStart(4, '0')} — {loan.amount} MATIC
                                                    </span>
                                                    <p className="text-xs text-error mt-0.5">
                                                        {daysOverdue(loan)} days overdue
                                                    </p>
                                                </div>
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleRepay(loan.id, loan.amount, loan.interestRate)}
                                                        className="bg-success/10 hover:bg-success/20 text-success border border-success/20 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                                    >
                                                        Repay Now
                                                    </button>
                                                    <button
                                                        onClick={() => handleMarkDefault(loan)}
                                                        disabled={defaultingId === loan.id}
                                                        className="bg-error/10 hover:bg-error/20 text-error border border-error/20 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                                    >
                                                        {defaultingId === loan.id ? 'Processing...' : 'Mark Defaulted'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>

                    {/* Active Loans */}
                    <section className="mb-20">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-display font-bold">Active Obligations</h2>
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface-high px-3 py-1 rounded-full ghost-border">
                                {activeLoans.length} Active
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {activeLoans.map(loan => (
                                <LoanCard key={loan.id} loan={loan} isBorrower={true} onRepay={handleRepay} />
                            ))}
                            {activeLoans.length === 0 && (
                                <div className="col-span-full tonal-card p-16 rounded-3xl ghost-border text-center">
                                    <div className="text-on-surface-variant mb-4 opacity-10 flex justify-center">
                                        <Wallet size={48} />
                                    </div>
                                    <h3 className="text-lg font-display font-bold">No Active Liabilities</h3>
                                    <p className="text-on-surface-variant font-light text-sm max-w-xs mx-auto mt-2">
                                        Your credit profile is clear. Apply for a new precision loan to build your on-chain reputation.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* History */}
                    <section>
                        <div className="flex items-center space-x-3 mb-8">
                            <History size={20} className="text-primary" />
                            <h2 className="text-2xl font-display font-bold">Protocol History</h2>
                        </div>
                        <div className="tonal-card rounded-3xl overflow-hidden ghost-border">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                            <th className="p-6">Amount</th>
                                            <th className="p-6">AI Score</th>
                                            <th className="p-6">Purpose</th>
                                            <th className="p-6 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {loans.filter(l => l.status !== 1 || l.status === 0).length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="p-12 text-center text-on-surface-variant font-light italic">
                                                    No historical records found.
                                                </td>
                                            </tr>
                                        )}
                                        {loans.filter(l => l.status !== 1 || l.repaid).map(loan => (
                                            <tr key={loan.id} className="group hover:bg-white/2 transition-colors border-b border-white/5 last:border-0">
                                                <td className="p-6 font-display font-bold">
                                                    {loan.amount} <span className="text-[10px] text-on-surface-variant">MATIC</span>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`font-bold ${loan.creditScore >= 700 ? 'text-success' : 'text-on-surface'}`}>
                                                        {loan.creditScore}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-on-surface-variant font-light">{loan.purpose}</td>
                                                <td className="p-6 text-right">
                                                    <span className={`text-[9px] px-3 py-1 rounded-full font-bold tracking-widest border border-white/5 ${
                                                        loan.status === 2 ? 'bg-success/10 text-success' :
                                                        loan.status === 3 ? 'bg-error/10 text-error' : 'bg-yellow-400/10 text-yellow-400'
                                                    }`}>
                                                        {loan.status === 2 ? 'REPAID' : loan.status === 3 ? 'DEFAULTED' : 'PENDING'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};
export default BorrowerDashboard;
