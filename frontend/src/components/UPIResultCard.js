import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, TrendingUp, Briefcase, Calendar, CreditCard, ShieldCheck } from 'lucide-react';

const UPIResultCard = ({ metrics, onReset }) => {
    
    // Format helpers
    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    const formatType = (val) => val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-surface-low border border-success/30 rounded-2xl p-6 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 bg-success/10 px-4 py-1 rounded-bl-xl border-b border-l border-success/20 flex items-center">
                <ShieldCheck size={14} className="text-success mr-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-success">Verified via Account Aggregator</span>
            </div>

            <h3 className="text-xl font-display font-bold text-on-surface mb-6 mt-2">Verified Financial Profile</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-lowest p-4 rounded-xl border border-white/5 flex items-start">
                    <div className="bg-primary/20 p-2 rounded-lg mr-4 text-primary">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Avg. Monthly Income</p>
                        <p className="text-2xl font-bold text-on-surface">{formatCurrency(metrics.avg_monthly_income)}</p>
                        <p className="text-xs text-on-surface-variant mt-1 flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${metrics.income_stability_score === 'high' ? 'bg-success' : metrics.income_stability_score === 'medium' ? 'bg-warning' : 'bg-error'}`}></span>
                            Stability: {formatType(metrics.income_stability_score)}
                        </p>
                    </div>
                </div>

                <div className="bg-surface-lowest p-4 rounded-xl border border-white/5 flex items-start">
                    <div className="bg-secondary/20 p-2 rounded-lg mr-4 text-secondary">
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Employment Type</p>
                        <p className="text-xl font-bold text-on-surface">{formatType(metrics.employment_type_detected)}</p>
                        <p className="text-xs text-on-surface-variant mt-1">Derived from txn history</p>
                    </div>
                </div>

                <div className="bg-surface-lowest p-4 rounded-xl border border-white/5 flex items-start">
                    <div className="bg-blue-500/20 p-2 rounded-lg mr-4 text-blue-400">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Bill Regularity</p>
                        <p className="text-lg font-bold text-on-surface">{formatType(metrics.bill_regularity)}</p>
                        <p className="text-xs text-on-surface-variant mt-1">{metrics.months_active} months of data</p>
                    </div>
                </div>

                <div className="bg-surface-lowest p-4 rounded-xl border border-white/5 flex items-start">
                    <div className="bg-orange-500/20 p-2 rounded-lg mr-4 text-orange-400">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Existing Debt Load</p>
                        <p className="text-lg font-bold text-on-surface">{formatType(metrics.existing_debt_load)}</p>
                        <p className="text-xs text-on-surface-variant mt-1">Based on EMI outflows</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-4">
                <div className="flex items-center text-xs text-on-surface-variant">
                    <CheckCircle2 size={14} className="text-success mr-1.5" />
                    <span>Analyzed {metrics.total_transactions_analyzed} transactions</span>
                </div>
                {onReset && (
                    <button 
                        onClick={onReset}
                        className="text-xs text-primary hover:text-primary-dim transition-colors underline-offset-2 hover:underline"
                    >
                        Disconnect & Re-verify
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default UPIResultCard;
