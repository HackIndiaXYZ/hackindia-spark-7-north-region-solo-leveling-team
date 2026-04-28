import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { Wallet, Landmark, HandCoins, ShieldCheck, LockKeyhole, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiLoginUser, apiSignupUser } from '../utils/apiService';

const Login = () => {
    const { connectWallet, isConnected, userRole } = useWeb3();
    const navigate = useNavigate();

    // Steps: 'selectRole' | 'kycForm' | 'encrypting' | 'decrypting' | 'roleAnim'
    const [step, setStep] = useState('selectRole');
    const [selectedRole, setSelectedRole] = useState(null);
    const [walletAddr, setWalletAddr] = useState(null);
    const [kycData, setKycData] = useState({ panCard: '', aadharCard: '' });
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // If already connected and logged in seamlessly from context on mount,
        // we might redirect, but we are handling it actively here instead
    }, [isConnected, userRole]);

    const handleRoleSelect = async (role) => {
        setSelectedRole(role);
        try {
            const address = await connectWallet(role);
            if (!address) return;
            setWalletAddr(address);

            // Attempt Login
            try {
                await apiLoginUser(address);
                // User exists! Show decrypting anim, then redirect
                setStep('decrypting');
                setTimeout(() => {
                    navigate(role === 'lender' ? '/lend' : '/dashboard');
                }, 3000);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    // New user -> KYC needed
                    setStep('kycForm');
                } else {
                    setErrorMsg('Server error during login.');
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleKycSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!kycData.panCard || !kycData.aadharCard) {
            setErrorMsg('Both PAN and Aadhaar are required.');
            return;
        }

        setStep('encrypting');

        try {
            await apiSignupUser({
                walletAddress: walletAddr,
                role: selectedRole,
                panCard: kycData.panCard,
                aadharCard: kycData.aadharCard
            });

            // After encryption anim, show role-specific anim
            setTimeout(() => {
                setStep('roleAnim');
                setTimeout(() => {
                    navigate(selectedRole === 'lender' ? '/lend' : '/dashboard');
                }, 3000);
            }, 3000);

        } catch (err) {
            setStep('kycForm');
            setErrorMsg(err.response?.data?.message || 'Error saving KYC data');
        }
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
        exit: { opacity: 0, scale: 1.05, transition: { duration: 0.3 } }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center relative px-4 overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-success/20 blur-[100px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-4xl flex justify-center">
                <AnimatePresence mode="wait">
                    {step === 'selectRole' && (
                        <motion.div key="role" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="w-full">
                            <div className="text-center mb-16">
                                <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Select Your Role</h1>
                                <p className="text-on-surface-variant text-lg max-w-lg mx-auto">
                                    Connect your Web3 wallet and choose how you want to participate in the MicroLend protocol.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div 
                                    onClick={() => handleRoleSelect('borrower')}
                                    className="glass p-10 rounded-3xl ghost-border cursor-pointer group hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] flex flex-col items-center text-center relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <HandCoins size={120} className="text-white" />
                                    </div>
                                    <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                                        <HandCoins size={40} />
                                    </div>
                                    <h2 className="text-3xl font-display font-bold mb-4">I want to Borrow</h2>
                                    <p className="text-on-surface-variant mb-8 flex-grow">
                                        Apply for instant, AI-scored micro-loans without traditional collateral or credit checks.
                                    </p>
                                    <button className="w-full bg-primary/10 text-primary font-bold py-4 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center">
                                        <Wallet className="mr-2" size={20} />
                                        Connect Wallet as Borrower
                                    </button>
                                </div>

                                <div 
                                    onClick={() => handleRoleSelect('lender')}
                                    className="glass p-10 rounded-3xl ghost-border cursor-pointer group hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] flex flex-col items-center text-center relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Landmark size={120} className="text-success" />
                                    </div>
                                    <div className="w-20 h-20 bg-success/20 rounded-2xl flex items-center justify-center mb-6 text-success group-hover:scale-110 transition-transform">
                                        <Landmark size={40} />
                                    </div>
                                    <h2 className="text-3xl font-display font-bold mb-4">I want to Lend</h2>
                                    <p className="text-on-surface-variant mb-8 flex-grow">
                                        Provide liquidity to verified borrowers and earn fixed APY yields on your MATIC.
                                    </p>
                                    <button className="w-full bg-success/10 text-success font-bold py-4 rounded-xl group-hover:bg-success group-hover:text-white transition-colors flex items-center justify-center">
                                        <Wallet className="mr-2" size={20} />
                                        Connect Wallet as Lender
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'kycForm' && (
                        <motion.div key="kyc" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="w-full max-w-md">
                            <div className="glass p-10 rounded-3xl ghost-border">
                                <div className="flex justify-center mb-6">
                                    <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                                        <ShieldCheck size={32} />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-display font-bold text-center mb-2">Verify Identity</h2>
                                <p className="text-on-surface-variant text-center mb-8 text-sm">
                                    To ensure protocol security, please provide your documents. They will be encrypted before storage.
                                </p>
                                
                                {errorMsg && (
                                    <div className="bg-error/20 border border-error/50 text-error px-4 py-3 rounded-lg mb-6 text-sm text-center">
                                        {errorMsg}
                                    </div>
                                )}

                                <form onSubmit={handleKycSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-on-surface-variant mb-2 uppercase tracking-wider">PAN Card Number</label>
                                        <input 
                                            type="text" 
                                            value={kycData.panCard}
                                            onChange={(e) => setKycData({...kycData, panCard: e.target.value.toUpperCase()})}
                                            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                            placeholder="ABCDE1234F"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-on-surface-variant mb-2 uppercase tracking-wider">Aadhaar Card Number</label>
                                        <input 
                                            type="text" 
                                            value={kycData.aadharCard}
                                            onChange={(e) => setKycData({...kycData, aadharCard: e.target.value.replace(/\D/g, '')})}
                                            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                            placeholder="1234 5678 9012"
                                            maxLength={12}
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition-colors mt-8 flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                                        <LockKeyhole size={18} className="mr-2" />
                                        Secure & Submit
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {step === 'encrypting' && (
                        <motion.div key="encrypting" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="text-center">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                className="w-32 h-32 mx-auto relative mb-8"
                            >
                                {/* Abstract Lock/Shield geometry */}
                                <svg viewBox="0 0 100 100" className="w-full h-full text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                                    <motion.path 
                                        d="M50 5 L90 25 L90 60 C90 80 50 95 50 95 C50 95 10 80 10 60 L10 25 Z" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                    />
                                    <motion.circle 
                                        cx="50" cy="50" r="15" 
                                        fill="none" stroke="currentColor" strokeWidth="2"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    />
                                    <motion.rect x="45" y="45" width="10" height="15" fill="currentColor" />
                                </svg>
                            </motion.div>
                            <h2 className="text-3xl font-display font-bold mb-4 tracking-wider">ENCRYPTING DATA</h2>
                            <p className="text-on-surface-variant max-w-sm mx-auto text-sm animate-pulse">
                                Generating cryptographic hashes... Securing PAN & Aadhaar details to the distributed ledger nodes.
                            </p>
                        </motion.div>
                    )}

                    {step === 'decrypting' && (
                        <motion.div key="decrypting" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="text-center">
                            <motion.div className="w-32 h-32 mx-auto relative mb-8 flex items-center justify-center">
                                <Cpu size={80} className="text-success absolute" />
                                <motion.div 
                                    className="absolute inset-0 border-4 border-t-success border-r-success border-b-transparent border-l-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                                <motion.div 
                                    className="absolute inset-2 border-4 border-b-primary border-l-primary border-t-transparent border-r-transparent rounded-full"
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                            </motion.div>
                            <h2 className="text-3xl font-display font-bold mb-4 text-success tracking-wider">VERIFYING CREDENTIALS</h2>
                            <p className="text-on-surface-variant max-w-sm mx-auto text-sm animate-pulse">
                                Decrypting user profile from secure server... Establishing authenticated session.
                            </p>
                        </motion.div>
                    )}

                    {step === 'roleAnim' && (
                        <motion.div key="roleAnim" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="text-center w-full">
                            {selectedRole === 'lender' ? (
                                <div>
                                    <div className="w-64 h-64 mx-auto relative mb-8 flex items-center justify-center">
                                        {/* Vault / Liquidity Pool Abstract Animation */}
                                        <div className="absolute bottom-0 w-32 h-32 bg-success/20 border-b-4 border-success rounded-b-3xl"></div>
                                        <motion.div 
                                            className="w-12 h-12 bg-yellow-400 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.8)] absolute top-0"
                                            animate={{ y: [0, 100], opacity: [0, 1, 0] }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "easeIn" }}
                                        />
                                        <motion.div 
                                            className="w-12 h-12 bg-yellow-400 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.8)] absolute top-[-40px]"
                                            animate={{ y: [0, 140], opacity: [0, 1, 0] }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "easeIn", delay: 0.5 }}
                                        />
                                    </div>
                                    <h2 className="text-3xl font-display font-bold mb-4 text-success tracking-wider">READY TO LEND</h2>
                                    <p className="text-on-surface-variant max-w-sm mx-auto text-sm">
                                        Welcome to the liquidity pool. Let your assets work for you.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="w-64 h-64 mx-auto relative mb-8 flex flex-col items-center justify-center">
                                        {/* Contract Signing / Money Received Abstract Animation */}
                                        <motion.div 
                                            className="w-32 h-40 border-2 border-primary rounded-lg bg-primary/10 relative overflow-hidden"
                                            animate={{ scale: [0.9, 1, 0.9] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <motion.div className="w-20 h-2 bg-primary/50 absolute top-6 left-6 rounded-full" />
                                            <motion.div className="w-16 h-2 bg-primary/50 absolute top-12 left-6 rounded-full" />
                                            <motion.div className="w-24 h-2 bg-primary/50 absolute top-18 left-6 rounded-full" />
                                            
                                            {/* Money dropping onto contract */}
                                            <motion.div 
                                                className="w-8 h-8 bg-success rounded-full absolute right-4 drop-shadow-[0_0_10px_rgba(var(--success),0.8)] flex items-center justify-center text-white font-bold"
                                                animate={{ y: [-50, 120] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "bounce" }}
                                            >
                                                ₹
                                            </motion.div>
                                        </motion.div>
                                    </div>
                                    <h2 className="text-3xl font-display font-bold mb-4 text-primary tracking-wider">READY TO BORROW</h2>
                                    <p className="text-on-surface-variant max-w-sm mx-auto text-sm">
                                        Instant micro-loans unlocked. Building your decentralized credit score.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Login;
