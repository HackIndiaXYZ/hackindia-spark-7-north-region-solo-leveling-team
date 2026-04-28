import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { getAllPendingLoans, fundLoan } from '../utils/web3Service';
import { toastPending, toastError, toastTx } from '../components/ToastProvider';
import { Search, Sliders, SortAsc, Zap, DollarSign, Tag, ChevronDown, TrendingUp, ShieldOff, Wallet, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../context/CurrencyContext';

const PURPOSES = ['All', 'Business Capital', 'Medical Emergency', 'Agriculture', 'Education', 'Home Repair'];
const SCORE_RANGES = [
    { label: 'All Scores', min: 0, max: 1000 },
    { label: '600–649', min: 600, max: 649 },
    { label: '650–699', min: 650, max: 699 },
    { label: '700–749', min: 700, max: 749 },
    { label: '750–799', min: 750, max: 799 },
    { label: '800+', min: 800, max: 1000 },
];
const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'score_desc', label: 'Score: High → Low' },
    { value: 'score_asc', label: 'Score: Low → High' },
    { value: 'amount_desc', label: 'Amount: Large → Small' },
    { value: 'amount_asc', label: 'Amount: Small → Large' },
];

const ScoreBadge = ({ score }) => {
    const color = score >= 800 ? '#4ADE80' : score >= 700 ? '#818CF8' : score >= 650 ? '#FACC15' : '#FF6E84';
    return (
        <div className="flex items-center space-x-1.5">
            <Zap size={11} style={{ color }} />
            <span className="font-bold text-sm" style={{ color }}>{score}</span>
        </div>
    );
};

const PurposePill = ({ purpose }) => {
    const colors = {
        'Business Capital': 'bg-primary/10 text-primary border-primary/20',
        'Medical Emergency': 'bg-error/10 text-error border-error/20',
        'Agriculture': 'bg-success/10 text-success border-success/20',
        'Education': 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
        'Home Repair': 'bg-orange-400/10 text-orange-400 border-orange-400/20',
    };
    return (
        <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${colors[purpose] || 'bg-white/5 text-on-surface-variant border-white/10'}`}>
            {purpose}
        </span>
    );
};

const LoanMarketCard = ({ loan, onFund, funding }) => {
    const { displayAmount } = useCurrency();
    const daysLeft = loan.duration;
    const scoreColor = loan.creditScore >= 750 ? 'text-success' : loan.creditScore >= 700 ? 'text-primary' : 'text-yellow-400';
    const expectedReturn = (loan.amount * 1.08).toFixed(4);

    return (
        <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="tonal-card rounded-3xl ghost-border p-7 flex flex-col gap-5 hover:scale-[1.01] transition-transform group">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                        #{loan.id.toString().padStart(4, '0')}
                    </p>
                    <PurposePill purpose={loan.purpose} />
                </div>
                <div className="text-right">
                    <p className="text-2xl font-display font-black text-on-surface">{displayAmount(loan.amount)}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">8% APR · {daysLeft}d term</p>
                </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-white/5" />

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">AI Score</p>
                    <ScoreBadge score={loan.creditScore} />
                </div>
                <div>
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Returns</p>
                    <p className="text-sm font-bold text-success">{displayAmount(expectedReturn)}</p>
                </div>
                <div>
                    <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Duration</p>
                    <p className="text-sm font-bold text-on-surface">{daysLeft} days</p>
                </div>
            </div>

            {/* Collateral row */}
            {loan.collateralAsset && loan.collateralAsset !== 'None' && (
                <div className="bg-surface-low border border-primary/20 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-primary">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Collateralized</span>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-on-surface">{loan.collateralAsset}</p>
                        <p className="text-[10px] text-on-surface-variant">Est. ₹{loan.collateralValue?.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            )}

            {/* Borrower address */}
            <p className="text-[10px] font-mono text-on-surface-variant/50 truncate">
                {loan.borrower}
            </p>

            {/* CTA */}
            <button
                onClick={() => onFund(loan)}
                disabled={funding === loan.id}
                className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary font-bold py-3 px-6 rounded-2xl text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
                {funding === loan.id ? (
                    <>
                        <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span>Processing...</span>
                    </>
                ) : (
                    <>
                        <TrendingUp size={14} />
                        <span>Fund This Loan</span>
                    </>
                )}
            </button>
        </motion.div>
    );
};

const LenderDashboard = () => {
    const { contract, signer, walletAddress, isDemoMode, isConnected } = useWeb3();
    const { currency, setCurrency } = useCurrency();
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fundingId, setFundingId] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filters & sort state
    const [search, setSearch] = useState('');
    const [purpose, setPurpose] = useState('All');
    const [scoreRange, setScoreRange] = useState(SCORE_RANGES[0]);
    const [sort, setSort] = useState('newest');
    const [maxAmount, setMaxAmount] = useState(5);

    // ─── Auth Guard ────────────────────────────────────────────────────────────
    const isAuthed = isConnected || isDemoMode;

    useEffect(() => {
        if (!isAuthed) {
            setLoading(false);
            return;
        }
        (async () => {
            setLoading(true);
            const address = isDemoMode ? "0xdemo_lender" : walletAddress;
            const data = await getAllPendingLoans(contract, isDemoMode, address);
            setLoans(data);
            setLoading(false);
        })();
    }, [contract, isDemoMode, walletAddress, isAuthed]);

    const filtered = useMemo(() => {
        let result = [...loans];
        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(l =>
                l.purpose.toLowerCase().includes(q) ||
                l.borrower.toLowerCase().includes(q) ||
                l.creditScore.toString().includes(q)
            );
        }
        // Purpose filter
        if (purpose !== 'All') result = result.filter(l => l.purpose === purpose);
        // Score filter
        result = result.filter(l => l.creditScore >= scoreRange.min && l.creditScore <= scoreRange.max);
        // Max amount filter
        result = result.filter(l => l.amount <= maxAmount);
        // Sort
        switch (sort) {
            case 'score_desc': result.sort((a, b) => b.creditScore - a.creditScore); break;
            case 'score_asc': result.sort((a, b) => a.creditScore - b.creditScore); break;
            case 'amount_desc': result.sort((a, b) => b.amount - a.amount); break;
            case 'amount_asc': result.sort((a, b) => a.amount - b.amount); break;
            default: result.sort((a, b) => b.createdAt - a.createdAt); break;
        }
        return result;
    }, [loans, search, purpose, scoreRange, sort, maxAmount]);

    const handleFund = async (loan) => {
        setFundingId(loan.id);
        toastPending("Broadcasting funding transaction...");
        const address = isDemoMode ? "0xdemo_lender" : walletAddress;
        const res = await fundLoan(contract, signer, loan.borrower, loan.id, loan.amount, isDemoMode, address);
        if (res.success) {
            toastTx(res.txHash);
            setLoans(prev => prev.filter(l => l.id !== loan.id));
        } else {
            toastError("Transaction failed. Check wallet balance.");
        }
        setFundingId(null);
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
                        Connect your wallet to browse the lending marketplace. Only authenticated lenders can view and fund loan requests.
                    </p>
                    <button onClick={() => navigate('/login')} className="bg-primary hover:bg-primary-dim text-white font-bold py-4 px-10 rounded-2xl transition-all flex items-center justify-center mx-auto space-x-2">
                        <Wallet size={20} />
                        <span>Connect Wallet</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="py-12 px-6 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            <header className="mb-10">
                <div className="flex items-center space-x-3 text-primary mb-2">
                    <DollarSign size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">P2P Lending Marketplace</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold">
                            Loan <span className="text-primary">Marketplace</span>
                        </h1>
                        <p className="text-on-surface-variant mt-2 text-sm">
                            Browse, filter, and fund verified micro-loans at 8% APR.
                        </p>
                    </div>
                    {/* Currency Toggle */}
                    <div className="flex items-center bg-surface-low ghost-border rounded-xl p-1 space-x-1">
                        {['MATIC', 'USD', 'INR'].map(c => (
                            <button key={c} onClick={() => setCurrency(c)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${currency === c ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Search + Filter Bar */}
            <div className="mb-8 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by purpose, borrower, or score..."
                            className="w-full bg-surface-low ghost-border rounded-xl pl-11 pr-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/40 transition"
                        />
                    </div>
                    {/* Sort */}
                    <div className="relative">
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value)}
                            className="appearance-none bg-surface-low ghost-border rounded-xl pl-4 pr-10 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/40 transition cursor-pointer"
                        >
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <SortAsc size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    </div>
                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(f => !f)}
                        className={`flex items-center space-x-2 px-5 py-3 rounded-xl ghost-border text-sm font-bold transition-all ${showFilters ? 'bg-primary/10 text-primary border-primary/30' : 'bg-surface-low text-on-surface-variant hover:text-on-surface'}`}
                    >
                        <Sliders size={15} />
                        <span>Filters</span>
                        <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Expandable Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="tonal-card rounded-2xl ghost-border p-6 grid md:grid-cols-3 gap-6">
                                {/* Purpose Filter */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">
                                        <Tag size={10} className="inline mr-1" /> Loan Purpose
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {PURPOSES.map(p => (
                                            <button key={p} onClick={() => setPurpose(p)}
                                                className={`text-[9px] px-3 py-1.5 rounded-full font-bold border transition-all ${purpose === p ? 'bg-primary/15 text-primary border-primary/30' : 'border-white/10 text-on-surface-variant hover:border-white/20'}`}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Score Range */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">
                                        <Zap size={10} className="inline mr-1" /> AI Credit Score
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {SCORE_RANGES.map(r => (
                                            <button key={r.label} onClick={() => setScoreRange(r)}
                                                className={`text-[9px] px-3 py-1.5 rounded-full font-bold border transition-all ${scoreRange.label === r.label ? 'bg-primary/15 text-primary border-primary/30' : 'border-white/10 text-on-surface-variant hover:border-white/20'}`}>
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Max Amount Slider */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">
                                        Max Amount: <span className="text-primary">{maxAmount} MATIC</span>
                                    </label>
                                    <input type="range" min="0.1" max="10" step="0.1" value={maxAmount}
                                        onChange={e => setMaxAmount(parseFloat(e.target.value))}
                                        className="w-full accent-primary" />
                                    <div className="flex justify-between text-[9px] text-on-surface-variant mt-1">
                                        <span>0.1</span><span>5</span><span>10 MATIC</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Result Count */}
                <div className="flex items-center space-x-2 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                    <span>{filtered.length} opportunities found</span>
                    {search && (
                        <button onClick={() => setSearch('')} className="text-primary hover:underline">Clear Search</button>
                    )}
                </div>
            </div>

            {/* Loan Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-32 space-x-3">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-[10px] font-bold tracking-widest text-on-surface-variant animate-pulse">LOADING MARKET FEED</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="tonal-card rounded-3xl ghost-border p-20 text-center">
                    <p className="text-4xl mb-4">🔍</p>
                    <h3 className="text-xl font-display font-bold">No Matches Found</h3>
                    <p className="text-on-surface-variant text-sm mt-2">Try adjusting your filters or search query.</p>
                </div>
            ) : (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filtered.map(loan => (
                            <LoanMarketCard key={loan.id} loan={loan} onFund={handleFund} funding={fundingId} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
};
export default LenderDashboard;
