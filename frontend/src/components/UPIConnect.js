import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldCheck, Search, Database } from 'lucide-react';
import axios from 'axios';

const UPIConnect = ({ onAnalysisComplete, persona = 'gig_worker', isDemoMode }) => {
    const [step, setStep] = useState('idle'); // idle, fetching, analyzing, complete
    const [progress, setProgress] = useState(0);

    const startAnalysis = async () => {
        setStep('fetching');
        setProgress(25);
        
        // Simulate fetching time
        await new Promise(r => setTimeout(r, 1500));
        setStep('analyzing');
        setProgress(60);

        try {
            const res = await axios.post('http://localhost:5000/api/upi/analyze', { persona });
            
            // Simulate analysis time
            await new Promise(r => setTimeout(r, 2000));
            setProgress(100);
            setStep('complete');
            
            if (res.data.success) {
                setTimeout(() => {
                    onAnalysisComplete(res.data.data.metrics);
                }, 800);
            }
        } catch (error) {
            console.error('Error analyzing UPI data', error);
            setStep('idle');
            setProgress(0);
        }
    };

    // Auto-trigger in demo mode if required, but usually user clicks a button to consent
    // We'll let the user click the button even in demo mode to show the animation.

    return (
        <div className="w-full bg-surface-low border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
            {/* Background animated gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50"></div>

            <AnimatePresence mode="wait">
                {step === 'idle' && (
                    <motion.div 
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center text-center z-10"
                    >
                        <div className="w-16 h-16 bg-surface-high rounded-full flex items-center justify-center mb-4 border border-white/10">
                            <Database className="text-primary w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-on-surface mb-2">Connect Account Aggregator</h3>
                        <p className="text-sm text-on-surface-variant max-w-sm mb-8">
                            Securely link your UPI transaction history to automatically verify your income and employment. No manual entry required.
                        </p>
                        <button 
                            onClick={startAnalysis}
                            className="bg-primary hover:bg-primary-dim text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center shadow-lg"
                        >
                            <ShieldCheck size={20} className="mr-2" />
                            {isDemoMode ? `Mock Connect (Persona: ${persona})` : 'Connect & Verify securely'}
                        </button>
                    </motion.div>
                )}

                {(step === 'fetching' || step === 'analyzing') && (
                    <motion.div 
                        key="processing"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="flex flex-col items-center w-full max-w-md z-10"
                    >
                        <div className="relative mb-8">
                            <div className="w-24 h-24 border-4 border-white/10 rounded-full flex items-center justify-center">
                                {step === 'fetching' ? (
                                    <Search className="w-10 h-10 text-primary animate-pulse" />
                                ) : (
                                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                )}
                            </div>
                            <svg className="absolute top-0 left-0 w-24 h-24 -rotate-90">
                                <circle
                                    cx="48" cy="48" r="46"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-primary transition-all duration-500 ease-out"
                                    strokeDasharray="289"
                                    strokeDashoffset={289 - (289 * progress) / 100}
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-on-surface mb-2">
                            {step === 'fetching' ? 'Fetching UPI History...' : 'Analyzing Transaction Patterns...'}
                        </h3>
                        <p className="text-sm text-on-surface-variant text-center">
                            {step === 'fetching' 
                                ? 'Connecting to NPCI Account Aggregator via secure encrypted channel.' 
                                : 'Applying machine learning models to derive income and stability metrics.'}
                        </p>
                    </motion.div>
                )}

                {step === 'complete' && (
                    <motion.div 
                        key="complete"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center z-10"
                    >
                        <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="text-success w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-on-surface mb-2">Verification Complete</h3>
                        <p className="text-sm text-on-surface-variant">Profile data extracted successfully.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UPIConnect;
