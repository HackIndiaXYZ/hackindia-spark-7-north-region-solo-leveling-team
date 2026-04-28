import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';

const FACTOR_CONFIG = {
    income: {
        label: 'Income Stability',
        weight: 25,
        icon: '💰',
        tip: 'Consistent monthly income above ₹15,000 improves your score by up to 80 points.'
    },
    employment: {
        label: 'Employment Type',
        weight: 20,
        icon: '💼',
        tip: 'Salaried employment scores highest. Gig workers can boost score by showing 6+ months of consistent earnings.'
    },
    repayment: {
        label: 'Repayment History',
        weight: 30,
        icon: '✅',
        tip: 'Each on-time repayment adds to your on-chain credit profile, increasing future loan limits.'
    },
    utility: {
        label: 'Utility Bill Consistency',
        weight: 10,
        icon: '🏠',
        tip: 'Timely utility payments signal financial responsibility and stability.'
    },
    debt: {
        label: 'Existing Debt Load',
        weight: 10,
        icon: '⚖️',
        tip: 'Lower existing debt ratios significantly improve creditworthiness assessments.'
    },
    residence: {
        label: 'Residential Stability',
        weight: 5,
        icon: '📍',
        tip: 'Living at the same address for 2+ years is a strong positive signal for lenders.'
    }
};

const getFactorScore = (formData, factor) => {
    switch (factor) {
        case 'income':
            const inc = Number(formData.income) || 0;
            if (inc >= 50000) return 95;
            if (inc >= 25000) return 80;
            if (inc >= 15000) return 60;
            if (inc >= 8000) return 40;
            return 20;
        case 'employment':
            const empMap = { 'Salaried': 95, 'Self-Employed': 70, 'Gig Worker': 55, 'Farmer': 50, 'Daily Wage': 35 };
            return empMap[formData.employmentType] || 50;
        case 'repayment':
            const repMap = {
                'Good - Always paid on time': 95,
                'Occasional delays': 60,
                'No History': 45,
                'Poor - Frequent delays': 20
            };
            return repMap[formData.repaymentHistory] || 45;
        case 'utility':
            const utilMap = { 'Always on time': 90, 'Occasional delays': 55, 'Frequently late': 20 };
            return utilMap[formData.utilityPayments] || 55;
        case 'debt':
            const debtMap = { 'None': 95, 'Low': 75, 'Medium': 50, 'High': 25 };
            return debtMap[formData.existingDebt] || 70;
        case 'residence':
            const years = Number(formData.yearsAtAddress) || 0;
            if (years >= 5) return 95;
            if (years >= 2) return 75;
            if (years >= 1) return 55;
            return 30;
        default:
            return 50;
    }
};

const ScoreBreakdown = ({ score, risk, approved, reason, formData }) => {
    const [showTips, setShowTips] = useState(false);

    const factors = Object.entries(FACTOR_CONFIG).map(([key, config]) => ({
        key,
        ...config,
        score: getFactorScore(formData, key),
        positive: getFactorScore(formData, key) >= 60
    }));

    const positiveFactors = factors.filter(f => f.positive);
    const negativeFactors = factors.filter(f => !f.positive);

    const getRiskColor = () => {
        if (risk === 'low') return '#4ADE80';
        if (risk === 'medium') return '#FACC15';
        return '#FF6E84';
    };

    const getScoreGradient = () => {
        if (score >= 750) return 'from-emerald-400 to-cyan-400';
        if (score >= 650) return 'from-violet-400 to-indigo-400';
        if (score >= 600) return 'from-yellow-400 to-orange-400';
        return 'from-red-400 to-pink-400';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full space-y-6"
        >
            {/* Score Hero */}
            <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Circular score display */}
                <div className="relative flex-shrink-0">
                    <svg width="160" height="160" viewBox="0 0 160 160">
                        <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                        <motion.circle
                            cx="80" cy="80" r="68"
                            fill="none"
                            stroke="url(#scoreGrad)"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 68}`}
                            strokeDashoffset={2 * Math.PI * 68 * (1 - score / 900)}
                            transform="rotate(-90 80 80)"
                            initial={{ strokeDashoffset: 2 * Math.PI * 68 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 68 * (1 - score / 900) }}
                            transition={{ duration: 1.5, ease: 'circOut' }}
                        />
                        <defs>
                            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={approved ? '#818CF8' : '#FF6E84'} />
                                <stop offset="100%" stopColor={approved ? '#4ADE80' : '#FF6E84'} />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            className={`text-4xl font-display font-black bg-gradient-to-r ${getScoreGradient()} bg-clip-text text-transparent`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            {score}
                        </motion.span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">AI Score</span>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                        {approved
                            ? <CheckCircle2 size={22} className="text-success" />
                            : <AlertCircle size={22} className="text-error" />
                        }
                        <h3 className="text-xl font-display font-bold">
                            {approved ? 'Application Approved' : 'Application Not Approved'}
                        </h3>
                    </div>
                    <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{reason}</p>
                    <div className="flex flex-wrap gap-3">
                        <div className="bg-surface-low px-3 py-2 rounded-xl ghost-border text-center">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Risk Level</p>
                            <p className="text-sm font-bold capitalize" style={{ color: getRiskColor() }}>{risk}</p>
                        </div>
                        <div className="bg-surface-low px-3 py-2 rounded-xl ghost-border text-center">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Score Percentile</p>
                            <p className="text-sm font-bold text-primary">{Math.round((score / 900) * 100)}th</p>
                        </div>
                        <div className="bg-surface-low px-3 py-2 rounded-xl ghost-border text-center">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Interest Rate</p>
                            <p className="text-sm font-bold text-success">8.0% Fixed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Factor breakdown bars */}
            <div className="tonal-card rounded-2xl p-6 ghost-border">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-5">Score Factor Analysis</h4>
                <div className="space-y-4">
                    {factors.map((factor, i) => (
                        <motion.div
                            key={factor.key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm">{factor.icon}</span>
                                    <span className="text-xs font-medium text-on-surface">{factor.label}</span>
                                    <span className="text-[9px] text-on-surface-variant">({factor.weight}% weight)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {factor.positive
                                        ? <TrendingUp size={12} className="text-success" />
                                        : <TrendingDown size={12} className="text-error" />
                                    }
                                    <span className={`text-xs font-bold ${factor.positive ? 'text-success' : 'text-error'}`}>
                                        {factor.score}/100
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-surface-lowest h-1.5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${factor.score}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 + i * 0.08, ease: 'circOut' }}
                                    className="h-full rounded-full"
                                    style={{
                                        background: factor.positive
                                            ? 'linear-gradient(to right, #818CF8, #4ADE80)'
                                            : 'linear-gradient(to right, #FF6E84, #FACC15)'
                                    }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* What's helping / hurting */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-success/5 border border-success/15 rounded-2xl p-5">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-success mb-3 flex items-center space-x-2">
                        <TrendingUp size={12} /> <span>Positive Signals ({positiveFactors.length})</span>
                    </h4>
                    <ul className="space-y-2">
                        {positiveFactors.map(f => (
                            <li key={f.key} className="flex items-center space-x-2 text-xs text-on-surface">
                                <CheckCircle2 size={12} className="text-success flex-shrink-0" />
                                <span>{f.label}</span>
                            </li>
                        ))}
                        {positiveFactors.length === 0 && (
                            <li className="text-xs text-on-surface-variant italic">No strong positive signals yet</li>
                        )}
                    </ul>
                </div>
                <div className="bg-error/5 border border-error/15 rounded-2xl p-5">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-error mb-3 flex items-center space-x-2">
                        <TrendingDown size={12} /> <span>Areas to Improve ({negativeFactors.length})</span>
                    </h4>
                    <ul className="space-y-2">
                        {negativeFactors.map(f => (
                            <li key={f.key} className="flex items-center space-x-2 text-xs text-on-surface">
                                <AlertCircle size={12} className="text-error flex-shrink-0" />
                                <span>{f.label}</span>
                            </li>
                        ))}
                        {negativeFactors.length === 0 && (
                            <li className="text-xs text-on-surface-variant italic">All factors are positive</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Improvement tips toggle */}
            {negativeFactors.length > 0 && (
                <div className="tonal-card rounded-2xl ghost-border overflow-hidden">
                    <button
                        onClick={() => setShowTips(!showTips)}
                        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            <Lightbulb size={16} className="text-yellow-400" />
                            <span className="text-sm font-bold text-on-surface">How to Improve Your Score</span>
                        </div>
                        {showTips ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <AnimatePresence>
                        {showTips && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
                                    {negativeFactors.map(f => (
                                        <div key={f.key} className="flex items-start space-x-3">
                                            <span className="text-sm mt-0.5">{f.icon}</span>
                                            <div>
                                                <p className="text-xs font-bold text-on-surface mb-0.5">{f.label}</p>
                                                <p className="text-xs text-on-surface-variant">{f.tip}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
};

export default ScoreBreakdown;
