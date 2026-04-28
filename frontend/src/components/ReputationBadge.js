import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, Zap, Crown, Award } from 'lucide-react';

const TIERS = [
    {
        name: 'NEW',
        label: 'New Member',
        minLoans: 0,
        color: '#A6ABBB',
        glow: 'rgba(166,171,187,0.3)',
        bg: 'rgba(166,171,187,0.08)',
        border: 'rgba(166,171,187,0.2)',
        Icon: Shield,
        desc: 'Building credit history on-chain'
    },
    {
        name: 'TRUSTED',
        label: 'Trusted',
        minLoans: 1,
        color: '#818CF8',
        glow: 'rgba(129,140,248,0.4)',
        bg: 'rgba(129,140,248,0.08)',
        border: 'rgba(129,140,248,0.25)',
        Icon: Star,
        desc: 'Verified repayment record'
    },
    {
        name: 'ELITE',
        label: 'Elite',
        minLoans: 3,
        color: '#9333EA',
        glow: 'rgba(147,51,234,0.5)',
        bg: 'rgba(147,51,234,0.1)',
        border: 'rgba(147,51,234,0.3)',
        Icon: Zap,
        desc: 'Consistently punctual borrower'
    },
    {
        name: 'LEGEND',
        label: 'Legend',
        minLoans: 7,
        color: '#FACC15',
        glow: 'rgba(250,204,21,0.5)',
        bg: 'rgba(250,204,21,0.08)',
        border: 'rgba(250,204,21,0.25)',
        Icon: Crown,
        desc: 'Top 1% repayment performance'
    }
];

const getTier = (repaidCount) => {
    let tier = TIERS[0];
    for (const t of TIERS) {
        if (repaidCount >= t.minLoans) tier = t;
    }
    return tier;
};

const ReputationBadge = ({ loans = [], compact = false }) => {
    const repaidCount = loans.filter(l => l.status === 2 || l.repaid).length;
    const nextTierIndex = TIERS.findIndex(t => t.minLoans > repaidCount);
    const nextTier = nextTierIndex !== -1 ? TIERS[nextTierIndex] : null;
    const tier = getTier(repaidCount);
    const { Icon } = tier;

    const progress = nextTier
        ? ((repaidCount - tier.minLoans) / (nextTier.minLoans - tier.minLoans)) * 100
        : 100;

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    background: tier.bg,
                    border: `1px solid ${tier.border}`,
                    boxShadow: `0 0 12px ${tier.glow}`
                }}
                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full"
            >
                <Icon size={12} style={{ color: tier.color }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: tier.color }}>
                    {tier.label}
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                background: tier.bg,
                border: `1px solid ${tier.border}`,
                boxShadow: `0 0 40px ${tier.glow}`
            }}
            className="rounded-3xl p-8 relative overflow-hidden"
        >
            {/* Background glow orb */}
            <div
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
                style={{ background: tier.glow }}
            />

            <div className="flex items-start justify-between mb-6 relative z-10">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                        On-Chain Reputation
                    </p>
                    <h3 className="text-2xl font-display font-bold text-on-surface">{tier.label} Profile</h3>
                    <p className="text-sm text-on-surface-variant mt-1">{tier.desc}</p>
                </div>
                <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex items-center justify-center w-16 h-16 rounded-2xl"
                    style={{ background: tier.bg, border: `1px solid ${tier.border}` }}
                >
                    <Icon size={32} style={{ color: tier.color }} />
                </motion.div>
            </div>

            {/* Tier badges row */}
            <div className="flex space-x-2 mb-6 relative z-10">
                {TIERS.map((t, i) => {
                    const isActive = repaidCount >= t.minLoans;
                    const TIcon = t.Icon;
                    return (
                        <div
                            key={t.name}
                            className="flex flex-col items-center space-y-1"
                            title={`${t.label} — ${t.minLoans} repaid loans`}
                        >
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                                style={{
                                    background: isActive ? t.bg : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${isActive ? t.border : 'rgba(255,255,255,0.05)'}`,
                                    boxShadow: isActive ? `0 0 10px ${t.glow}` : 'none'
                                }}
                            >
                                <TIcon size={14} style={{ color: isActive ? t.color : '#374151' }} />
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-wider"
                                style={{ color: isActive ? t.color : '#374151' }}>
                                {t.name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Progress to next tier */}
            {nextTier && (
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                            Progress to {nextTier.label}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: tier.color }}>
                            {repaidCount} / {nextTier.minLoans} repaid
                        </span>
                    </div>
                    <div className="w-full bg-surface-low h-1.5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.2, delay: 0.3, ease: 'circOut' }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(to right, ${tier.color}, ${nextTier?.color || tier.color})` }}
                        />
                    </div>
                </div>
            )}

            {!nextTier && (
                <div className="relative z-10 flex items-center space-x-2">
                    <Award size={14} style={{ color: tier.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: tier.color }}>
                        Maximum Tier Achieved
                    </span>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-4 relative z-10">
                <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Total Loans</p>
                    <p className="text-xl font-display font-bold text-on-surface">{loans.length}</p>
                </div>
                <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Repaid</p>
                    <p className="text-xl font-display font-bold text-success">{repaidCount}</p>
                </div>
                <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Success Rate</p>
                    <p className="text-xl font-display font-bold text-on-surface">
                        {loans.length > 0 ? Math.round((repaidCount / loans.length) * 100) : 0}%
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default ReputationBadge;
