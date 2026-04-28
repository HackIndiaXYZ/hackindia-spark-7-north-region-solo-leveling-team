import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useWeb3 } from '../context/Web3Context';
import { applyForLoan } from '../utils/web3Service';
import ScoreBreakdown from '../components/ScoreBreakdown';
import { useCurrency } from '../context/CurrencyContext';
import { toastPending, toastError, toastTx } from '../components/ToastProvider';
import { Loader2, ArrowLeft, ArrowRight, ShieldCheck, Info, Zap, Wallet } from 'lucide-react';

// Dynamic interest rate: shorter terms cost less, longer terms cost more
const getDynamicRate = (duration) => {
    const d = Number(duration);
    if (d <= 7)   return 5.0;
    if (d <= 14)  return 5.5;
    if (d <= 30)  return 6.0;
    if (d <= 60)  return 7.0;
    if (d <= 90)  return 8.0;
    if (d <= 120) return 9.0;
    if (d <= 180) return 10.5;
    if (d <= 270) return 12.0;
    return 14.0; // 365 days
};

const Apply = () => {
    const { contract, signer, isDemoMode, isConnected, connectWallet, walletAddress, balance } = useWeb3();
    const { displayAmount, currency, setCurrency, MATIC_TO_INR } = useCurrency();
    const navigate = useNavigate();
    
    const [step, setStep] = useState(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        income: isDemoMode ? 18000 : '',
        employmentType: isDemoMode ? 'Gig Worker' : 'Salaried',
        existingDebt: isDemoMode ? 'None' : 'None',
        loanPurpose: isDemoMode ? 'Medical Emergency' : 'Medical Emergency',
        amount: isDemoMode ? 0.1 : 0.05,
        duration: isDemoMode ? 30 : 30,
        repaymentHistory: isDemoMode ? 'Good - Always paid on time' : 'No History',
        utilityPayments: isDemoMode ? 'Always on time' : 'Always on time',
        yearsAtAddress: isDemoMode ? 3 : 1,
        hasCollateral: false,
        collateralAsset: 'None',
        collateralValue: ''
    });

    const handleChange = (e) => {
        let val = e.target.value;
        if (e.target.name === 'amount' || e.target.name === 'income') {
            val = val.replace(/[^0-9.]/g, '');
            const parts = val.split('.');
            if (parts.length > 2) {
                val = parts[0] + '.' + parts.slice(1).join('');
            }
        }
        setFormData({ ...formData, [e.target.name]: val });
    };

    const handleGetScore = async (e) => {
        e.preventDefault();

        if (formData.hasCollateral) {
            if (formData.collateralAsset === 'None') {
                toastError("Please select a collateral asset type.");
                return;
            }
            const cVal = parseFloat(formData.collateralValue);
            if (isNaN(cVal) || cVal <= 0) {
                toastError("Please enter a valid positive number for the collateral value.");
                return;
            }
        }

        setIsAnalyzing(true);
        setStep(2);

        try {
            const res = await axios.post('http://localhost:5000/api/credit-score', formData);
            setAiResult(res.data);
        } catch (error) {
            console.error(error);
            setAiResult({
                score: 742,
                risk: 'low',
                approved: true,
                reason: "Mock fallback: AI scoring system is currently in demo mode.",
                maxLoanAmount: 0.5,
                suggestedRate: 8
            });
        }
        setIsAnalyzing(false);
    };

    const submitApplication = async () => {
        if (!isConnected && !isDemoMode) {
            toastError("Please connect your wallet first.");
            return;
        }
        setIsSubmitting(true);
        toastPending("Initiating on-chain transaction...");
        
        const address = isDemoMode ? "0xdemo_borrower" : walletAddress;
        const res = await applyForLoan(
            contract, signer, formData.amount, 
            aiResult.score, formData.loanPurpose, 
            formData.duration, isDemoMode, address,
            formData.hasCollateral ? formData.collateralAsset : 'None',
            formData.hasCollateral ? formData.collateralValue || 0 : 0
        );

        if (res.success) {
            toastTx(res.txHash);
            navigate('/dashboard');
        } else {
            toastError("Transaction failed. Please try again.");
        }
        setIsSubmitting(false);
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 min-h-screen">
            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Lending <span className="text-primary">Precision</span></h1>
                <p className="text-on-surface-variant font-light max-w-xl">
                    Our AI evaluates alternative metrics to generate a verifiable on-chain credit score.
                </p>
            </div>

            {/* Step Indicator - Zero-Line */}
            <div className="grid grid-cols-3 gap-1 mb-12">
                {[
                    { n: 1, label: 'Profile' },
                    { n: 2, label: 'Analysis' },
                    { n: 3, label: 'Verification' }
                ].map((s) => (
                    <div key={s.n} className="flex flex-col">
                        <div className={`h-1 transition-all duration-500 ${step >= s.n ? 'bg-primary' : 'bg-surface-low'}`}></div>
                        <span className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${step >= s.n ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                            {s.n}. {s.label}
                        </span>
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="tonal-card p-10 rounded-3xl ghost-border animate-in fade-in slide-in-from-bottom-4">
                    <form onSubmit={handleGetScore} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center">
                                    <Info size={12} className="mr-1" /> Monthly Income (₹)
                                </label>
                                <input 
                                    type="text"
                                    inputMode="numeric"
                                    name="income" 
                                    required 
                                    value={formData.income} 
                                    onChange={handleChange} 
                                    onFocus={(e) => e.target.select()}
                                    className="w-full bg-surface-low border border-white/20 rounded-xl p-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-white/30" 
                                    placeholder="e.g. 25000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Employment Type</label>
                                <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="w-full bg-surface-low border border-white/10 rounded-xl p-4 text-on-surface focus:border-primary outline-none">
                                    <option className="bg-surface-high">Salaried</option>
                                    <option className="bg-surface-high">Gig Worker</option>
                                    <option className="bg-surface-high">Self-Employed</option>
                                    <option className="bg-surface-high">Farmer</option>
                                    <option className="bg-surface-high">Daily Wage</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Request Amount (MATIC)</label>
                                <input 
                                    type="text"
                                    inputMode="decimal"
                                    name="amount" 
                                    required 
                                    value={formData.amount} 
                                    onChange={handleChange} 
                                    onFocus={(e) => e.target.select()}
                                    className="w-full bg-surface-low border border-white/20 rounded-xl p-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" 
                                />
                                {formData.amount && !isNaN(formData.amount) && (
                                    <p className="text-xs text-on-surface-variant mt-1 font-medium">
                                        ≈ ₹{Math.round(formData.amount * MATIC_TO_INR).toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Repayment Term</label>
                                <select name="duration" value={formData.duration} onChange={handleChange} className="w-full bg-surface-low border border-white/10 rounded-xl p-4 text-on-surface focus:border-primary outline-none">
                                    <option value="7"  className="bg-surface-high">7 Days  (1 Week)</option>
                                    <option value="14" className="bg-surface-high">14 Days (2 Weeks)</option>
                                    <option value="30" className="bg-surface-high">30 Days (1 Month)</option>
                                    <option value="60" className="bg-surface-high">60 Days (2 Months)</option>
                                    <option value="90" className="bg-surface-high">90 Days (3 Months)</option>
                                    <option value="120" className="bg-surface-high">120 Days (4 Months)</option>
                                    <option value="180" className="bg-surface-high">180 Days (6 Months)</option>
                                    <option value="270" className="bg-surface-high">270 Days (9 Months)</option>
                                    <option value="365" className="bg-surface-high">365 Days (1 Year)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Purpose of Capital</label>
                            <select name="loanPurpose" value={formData.loanPurpose} onChange={handleChange} className="w-full bg-surface-low border border-white/10 rounded-xl p-4 text-on-surface focus:border-primary outline-none">
                                <option className="bg-surface-high">Medical Emergency</option>
                                <option className="bg-surface-high">Business Capital</option>
                                <option className="bg-surface-high">Agriculture</option>
                                <option className="bg-surface-high">Education</option>
                                <option className="bg-surface-high">Home Repair</option>
                                <option className="bg-surface-high">Other</option>
                            </select>
                        </div>
                        
                        {/* Collateral Section */}
                        <div className="pt-4 border-t border-white/5 space-y-4">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="hasCollateral"
                                    checked={formData.hasCollateral}
                                    onChange={(e) => setFormData({...formData, hasCollateral: e.target.checked})}
                                    className="w-5 h-5 rounded border-white/20 bg-surface-low text-primary focus:ring-primary focus:ring-offset-surface-base"
                                />
                                <span className="text-sm font-bold text-on-surface">Secure loan with Real World Asset (Collateral)</span>
                            </label>
                            
                            {formData.hasCollateral && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Asset Type</label>
                                        <select name="collateralAsset" value={formData.collateralAsset} onChange={handleChange} className="w-full bg-surface-low border border-white/10 rounded-xl p-4 text-on-surface focus:border-primary outline-none">
                                            <option value="None" disabled className="bg-surface-high">Select Asset</option>
                                            <option value="Property Deed" className="bg-surface-high">Property Deed</option>
                                            <option value="Vehicle Title" className="bg-surface-high">Vehicle Title</option>
                                            <option value="Gold/Jewelry" className="bg-surface-high">Gold/Jewelry</option>
                                            <option value="Other" className="bg-surface-high">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Estimated Value (₹)</label>
                                        <input 
                                            type="text"
                                            inputMode="numeric"
                                            name="collateralValue" 
                                            value={formData.collateralValue} 
                                            onChange={handleChange} 
                                            className="w-full bg-surface-low border border-white/20 rounded-xl p-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-white/30" 
                                            placeholder="e.g. 500000"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="pt-6">
                            <button type="submit" className="w-full bg-primary hover:bg-primary-dim text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center space-x-2">
                                <span>Generate Precision AI Score</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {step === 2 && (
                <div className="tonal-card p-10 rounded-3xl ghost-border flex flex-col items-center justify-center min-h-[500px] animate-in fade-in zoom-in duration-500">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center">
                            <div className="relative mb-8">
                                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Zap size={24} className="text-primary animate-pulse" />
                                </div>
                            </div>
                            <p className="text-xl font-display font-bold text-on-surface mb-2 text-center">Calibrating Scoring Engine</p>
                            <p className="text-on-surface-variant text-sm text-center">Analyzing income consistency and behavioral patterns...</p>
                        </div>
                    ) : aiResult ? (
                        <div className="w-full max-w-3xl">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-display font-bold mb-2">Analysis Complete</h2>
                                <p className="text-on-surface-variant">Verifiable credit score generated for your decentralized profile.</p>
                            </div>
                            
                            <ScoreBreakdown
                                score={aiResult.score}
                                risk={aiResult.risk}
                                approved={aiResult.approved}
                                reason={aiResult.reason}
                                formData={formData}
                            />
                            
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-12 w-full max-w-lg mx-auto">
                                <button onClick={() => setStep(1)} className="flex-1 ghost-border hover:bg-white/5 text-on-surface font-bold py-4 rounded-xl transition-all flex items-center justify-center">
                                    <ArrowLeft size={18} className="mr-2" /> Recalibrate
                                </button>
                                {aiResult.approved && (
                                    <button onClick={() => setStep(3)} className="flex-1 bg-primary hover:bg-primary-dim text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center">
                                        Verify & Proceed <ArrowRight size={18} className="ml-2" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {step === 3 && (() => {
                const rate = getDynamicRate(formData.duration);
                const totalRepayment = formData.amount * (1 + rate / 100);
                return (
                <div className="tonal-card p-10 rounded-3xl ghost-border animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-display font-bold">Verification Ledger</h2>
                        {/* Currency toggle */}
                        <div className="flex items-center bg-surface-low ghost-border rounded-xl p-1 space-x-1">
                            {['MATIC', 'USD', 'INR'].map(c => (
                                <button key={c} onClick={() => setCurrency(c)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currency === c ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-surface-lowest rounded-2xl p-8 ghost-border mb-10 space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Capital Requested</span>
                            <div className="text-right">
                                <span className="text-2xl font-display font-bold text-on-surface">{displayAmount(formData.amount)}</span>
                                {currency !== 'MATIC' && <p className="text-[10px] text-on-surface-variant mt-0.5">{formData.amount} MATIC</p>}
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Term Duration</span>
                            <span className="font-bold text-on-surface">{formData.duration} Days</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Dynamic Interest Rate</span>
                            <div className="text-right">
                                <span className="font-bold text-primary text-lg">{rate.toFixed(1)}% APR</span>
                                <p className="text-[9px] text-on-surface-variant mt-0.5">Based on {formData.duration}-day term</p>
                            </div>
                        </div>
                        <div className="h-px bg-white/5"></div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Repayment</span>
                            <div className="text-right">
                                <span className="text-3xl font-display font-bold text-success">{displayAmount(totalRepayment.toFixed(4))}</span>
                                {currency !== 'MATIC' && <p className="text-[10px] text-on-surface-variant mt-0.5">{totalRepayment.toFixed(4)} MATIC</p>}
                            </div>
                        </div>
                    </div>

                    {!isConnected && !isDemoMode ? (
                        <button onClick={connectWallet} className="w-full bg-primary hover:bg-primary-dim text-white py-5 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2">
                            <Wallet size={20} />
                            <span>Connect Wallet to Sign</span>
                        </button>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-center space-x-3 text-[11px] font-mono text-on-surface-variant bg-surface-low py-3 px-4 rounded-xl ghost-border">
                                <div className="w-2 h-2 rounded-full bg-success"></div>
                                <span>SIGNER: {walletAddress.substring(0,12)}...{walletAddress.substring(walletAddress.length - 8)}</span>
                                <span className="opacity-30">|</span>
                                <span className="text-on-surface">BAL: {balance} MATIC</span>
                            </div>
                            <button 
                                onClick={submitApplication} 
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary-dim disabled:opacity-50 text-white font-bold py-5 rounded-2xl transition-all shadow-xl flex justify-center items-center active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center space-x-3">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>SIGNING ON-CHAIN...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-3">
                                        <ShieldCheck size={24} />
                                        <span>EXECUTE LOAN APPLICATION</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    )}
                </div>
                );
            })()}
        </div>
    );
};
export default Apply;
