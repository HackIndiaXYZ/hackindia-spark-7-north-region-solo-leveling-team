import React from 'react';
import { Shield, Zap, Calendar, Tag, ArrowUpRight, CheckCircle, ShieldCheck } from 'lucide-react';
import TiltCard from './TiltCard';
import RepaymentTimer from './RepaymentTimer';

const LoanCard = ({ loan, onFund, onRepay, onExtend, isLender, isBorrower }) => {
    const statusMap = {
        0: { text: "PENDING", class: "bg-yellow-400/10 text-yellow-400" },
        1: { text: "FUNDED", class: "bg-primary/10 text-primary" },
        2: { text: "REPAID", class: "bg-success/10 text-success" },
        3: { text: "DEFAULTED", class: "bg-error/10 text-error" }
    };
    
    const badge = statusMap[loan?.status] || statusMap[0];

    const getScoreColor = (score) => {
        if (score >= 700) return 'text-success';
        if (score >= 500) return 'text-yellow-400';
        return 'text-error';
    };

    return (
        <TiltCard className="group">
            <div className="tonal-card rounded-3xl p-6 ghost-border relative overflow-hidden h-full flex flex-col justify-between">
                {/* Hover accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity -mr-12 -mt-12 rounded-full"></div>

                <div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center space-x-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                            <Shield size={10} className="opacity-50" />
                            <span>Request ID: {loan.id?.toString().padStart(4, '0')}</span>
                            </div>
                            <div className="text-sm text-primary font-bold font-mono">
                            {loan.borrower.substring(0, 8)}...{loan.borrower.substring(loan.borrower.length - 6)}
                            </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                            <span className={`text-[10px] px-3 py-1 rounded-full font-bold tracking-widest border border-white/5 ${badge.class}`}>
                                {badge.text}
                            </span>
                            {(loan.status === 1 || loan.status === 2 || loan.status === 3) && (
                                <RepaymentTimer 
                                    repayBy={loan.repayBy} 
                                    gracePeriodEnd={loan.repayBy ? loan.repayBy + (3 * 86400) : 0} 
                                    status={loan.status} 
                                />
                            )}
                        </div>
                    </div>

                    <div className="mb-8">
                        <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-display font-black text-on-surface">{loan.amount}</span>
                        <span className="text-sm font-bold text-on-surface-variant uppercase">MATIC</span>
                        </div>
                        <div className="text-[11px] font-medium text-on-surface-variant/60 flex items-center mt-1">
                        ~ ₹{(loan.amount * 80).toLocaleString()} <span className="mx-2 opacity-30">|</span> {loan.interestRate}% Fixed APY
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <div className="bg-surface-lowest p-4 rounded-2xl ghost-border">
                            <div className="flex items-center space-x-1.5 text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                            <Zap size={10} className={getScoreColor(loan.creditScore)} />
                            <span>AI Score</span>
                            </div>
                            <span className={`text-xl font-display font-bold ${getScoreColor(loan.creditScore)}`}>{loan.creditScore}</span>
                        </div>
                        <div className="bg-surface-lowest p-4 rounded-2xl ghost-border">
                            <div className="flex items-center space-x-1.5 text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                            <Calendar size={10} className="opacity-50" />
                            <span>Term</span>
                            </div>
                            <span className="text-xl font-display font-bold text-on-surface">{loan.duration} <span className="text-[10px] font-bold uppercase text-on-surface-variant">Days</span></span>
                        </div>
                        <div className="bg-surface-lowest p-4 rounded-2xl ghost-border col-span-2">
                            <div className="flex items-center space-x-1.5 text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                            <Tag size={10} className="opacity-50" />
                            <span>Purpose</span>
                            </div>
                            <span className="text-sm text-on-surface font-medium block truncate">{loan.purpose}</span>
                        </div>
                        {loan.collateralAsset && loan.collateralAsset !== 'None' && (
                            <div className="bg-surface-low border border-primary/20 rounded-2xl p-4 flex items-center justify-between col-span-2">
                                <div className="flex items-center space-x-2 text-primary">
                                    <ShieldCheck size={16} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Collateral Pledged</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-on-surface">{loan.collateralAsset}</p>
                                    <p className="text-[10px] text-on-surface-variant">Est. ₹{loan.collateralValue?.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    {isLender && loan.status === 0 && (
                        <button 
                        onClick={() => onFund(loan.id, loan.amount)} 
                        className="w-full bg-primary hover:bg-primary-dim text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 group/btn"
                        >
                            <span>Deploy Liquidity</span>
                            <ArrowUpRight size={18} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </button>
                    )}

                    {isBorrower && loan.status === 1 && (
                        <div className="space-y-3 mt-4 w-full">
                            <button 
                            onClick={() => onRepay(loan.id, loan.amount, loan.interestRate)} 
                            className="w-full bg-success hover:bg-success/80 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2"
                            >
                                <CheckCircle size={18} />
                                <span>Repay {(loan.amount * (1 + loan.interestRate / 100)).toFixed(3)} MATIC</span>
                            </button>

                            {loan.extensionRequested && loan.extensionsUsed < loan.maxExtensions && (
                                <button 
                                onClick={() => onExtend && onExtend(loan.id)} 
                                className="w-full bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 py-3 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2"
                                >
                                    <Calendar size={16} />
                                    <span>Extend Term (+2% APY)</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </TiltCard>
    );
};
export default LoanCard;

