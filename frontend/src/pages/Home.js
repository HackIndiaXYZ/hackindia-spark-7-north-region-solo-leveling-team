import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { getProtocolStats } from '../utils/web3Service';
import { Shield, Zap, ArrowRight, CheckCircle2, TrendingUp, Users, Wallet, Lock, Database, Activity } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Hero3D from '../components/Hero3D';
import TiltCard from '../components/TiltCard';

const Home = () => {
    const { contract, isDemoMode } = useWeb3();
    const [stats, setStats] = useState({ totalLoans: 0, tvl: 0, avgScore: 0, repaymentRate: 0 });

    const vaultRef = useRef(null);
    const { scrollYProgress: vaultProgress } = useScroll({
        target: vaultRef,
        offset: ["start start", "end start"]
    });

    const vaultScale = useTransform(vaultProgress, [0, 0.3, 0.6], [1, 1.2, 0.8]);
    const vaultOpacity = useTransform(vaultProgress, [0, 0.5, 0.8], [1, 1, 0]);
    const vaultBorder = useTransform(vaultProgress, [0, 0.3], ["rgba(var(--color-primary), 0.3)", "rgba(var(--color-success), 0.8)"]);

    useEffect(() => {
        const fetchStats = async () => {
            const data = await getProtocolStats(contract, isDemoMode);
            setStats({
                totalLoans: data.totalLoans,
                tvl: data.tvl,
                avgScore: 724, 
                repaymentRate: 91.3 
            });
        };
        fetchStats();
    }, [contract, isDemoMode]);

    return (
        <div className="flex flex-col min-h-screen relative overflow-hidden bg-background">
            {/* 3D Background Layer */}
            <Hero3D />

            {/* Hero Section */}
            <section className="relative min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="lg:col-span-7"
                >
                    <h1 className="text-6xl md:text-8xl font-display font-extrabold mb-8 tracking-tight leading-[0.9]">
                        Credit for <br />
                        <span className="gradient-text">Every Indian</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-on-surface-variant mb-12 max-w-xl font-light leading-relaxed">
                        AI-powered micro-loans for the 190 million unbanked. 
                        A high-precision lending protocol built for scale and financial inclusion.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <Link to="/apply" className="bg-primary hover:bg-primary-dim text-white px-10 py-5 rounded-xl font-bold text-lg transition-all flex items-center justify-center shadow-[0_0_30px_rgba(var(--color-primary),0.3)] hover:scale-105 active:scale-95">
                            Apply for a Loan <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                        <Link to="/lend" className="ghost-border hover:bg-white/5 text-on-surface px-10 py-5 rounded-xl font-bold text-lg transition-all flex items-center justify-center">
                            Become a Lender
                        </Link>
                    </div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    className="lg:col-span-5 relative hidden lg:block"
                >
                    <div className="absolute -inset-4 bg-primary/10 blur-[100px] rounded-full"></div>
                    <div className="relative glass p-8 rounded-3xl ghost-border overflow-hidden group hover:scale-[1.02] transition-transform duration-500 cursor-default">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                            <Zap size={120} className="text-primary" />
                        </div>
                        <div className="space-y-6 relative z-10">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                                <Shield className="text-primary" size={24} />
                            </div>
                            <h3 className="text-2xl font-display font-bold">Protocol Status</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm text-on-surface-variant font-medium">Repayment Rate</span>
                                    <span className="text-2xl font-display font-bold text-success">{stats.repaymentRate}%</span>
                                </div>
                                <div className="w-full bg-surface-low h-1.5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.repaymentRate}%` }}
                                        transition={{ duration: 1.5, delay: 1, ease: "circOut" }}
                                        className="bg-success h-full"
                                    ></motion.div>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-xs text-on-surface-variant">Precision AI Scoring Active</span>
                                    <span className="text-xs text-success flex items-center"><CheckCircle2 size={12} className="mr-1" /> Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Scrollytelling Section 1: The Secure Vault */}
            <section ref={vaultRef} className="relative h-[250vh] w-full z-20">
                <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden px-6">
                    <motion.div style={{ opacity: useTransform(vaultProgress, [0, 0.1, 0.8, 0.9], [0, 1, 1, 0]) }} className="text-center mb-16">
                        <h2 className="text-4xl md:text-6xl font-display font-bold mb-4">The Global Liquidity Vault</h2>
                        <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">Secured by cryptography. Disbursed instantly.</p>
                    </motion.div>

                    <div className="relative w-64 h-64 md:w-96 md:h-96 mx-auto flex items-center justify-center">
                        {/* Vault Core */}
                        <motion.div 
                            style={{ scale: vaultScale, opacity: vaultOpacity, borderColor: vaultBorder }} 
                            className="absolute inset-0 bg-surface rounded-full border-[8px] flex items-center justify-center z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                        >
                            <motion.div style={{ rotate: useTransform(vaultProgress, [0, 0.3], [0, 90]) }}>
                                <Lock size={80} className="text-primary mb-4" />
                            </motion.div>
                        </motion.div>

                        {/* Money Flowing Out */}
                        {[...Array(12)].map((_, i) => {
                            const delay = i * 0.05;
                            // Need to avoid window inside SSR if any, but fine for client-side React
                            const targetY = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 800;
                            const y = useTransform(vaultProgress, [0.3 + delay, 0.6 + delay], [0, targetY]);
                            const x = useTransform(vaultProgress, [0.3 + delay, 0.6 + delay], [0, (i % 2 === 0 ? 1 : -1) * (50 + i * 15)]);
                            const opacity = useTransform(vaultProgress, [0.3 + delay, 0.4 + delay, 0.6 + delay], [0, 1, 0]);
                            const scale = useTransform(vaultProgress, [0.3 + delay, 0.6 + delay], [0.5, 1.5]);

                            return (
                                <motion.div 
                                    key={i}
                                    style={{ y, x, opacity, scale }}
                                    className="absolute z-0 w-12 h-12 bg-success/20 border border-success rounded-full flex items-center justify-center backdrop-blur-md shadow-[0_0_20px_rgba(var(--color-success),0.4)]"
                                >
                                    <span className="text-success font-bold text-xl">$</span>
                                </motion.div>
                            )
                        })}

                        {/* Data Encrypting / Flowing In */}
                        {[...Array(8)].map((_, i) => {
                            const delay = i * 0.08;
                            const startY = typeof window !== 'undefined' ? -window.innerHeight * 0.5 : -500;
                            const y = useTransform(vaultProgress, [0.1 + delay, 0.4 + delay], [startY, 0]);
                            const x = useTransform(vaultProgress, [0.1 + delay, 0.4 + delay], [(i % 2 === 0 ? 1 : -1) * (100 + i * 10), 0]);
                            const opacity = useTransform(vaultProgress, [0.1 + delay, 0.3 + delay, 0.4 + delay], [0, 1, 0]);

                            return (
                                <motion.div 
                                    key={`data-${i}`}
                                    style={{ y, x, opacity }}
                                    className="absolute z-0 w-8 h-8 bg-primary/20 border border-primary rounded-md flex items-center justify-center backdrop-blur-sm"
                                >
                                    <Database size={16} className="text-primary" />
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Scrollytelling Section 2: Pinned Analytics & Moving Features */}
            <section className="relative h-[400vh] w-full bg-background z-20">
                <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
                    {/* Static Analytics Dashboard Background */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-center opacity-30">
                        <div className="w-full max-w-7xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="h-64 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/20 to-transparent"></div>
                                <Activity size={32} className="text-white/20 mb-4" />
                                <div className="h-4 w-1/3 bg-white/10 rounded mb-2"></div>
                                <div className="h-8 w-2/3 bg-white/20 rounded"></div>
                            </div>
                            <div className="h-64 border border-white/10 rounded-2xl p-6 md:col-span-2 relative overflow-hidden">
                                <div className="w-full h-full flex items-end space-x-2 opacity-50">
                                    {[...Array(20)].map((_, i) => (
                                        <div key={i} className="flex-1 bg-white/10 rounded-t-sm" style={{ height: `${20 + Math.random() * 80}%` }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="text-center mt-12">
                            <h2 className="text-[10vw] font-display font-extrabold text-white/5 leading-none">ANALYTICS</h2>
                        </div>
                    </div>
                </div>

                {/* Moving Feature Cards */}
                <div className="relative z-10 -mt-[350vh] pb-[50vh] max-w-5xl mx-auto px-6 space-y-[60vh]">
                    <div className="glass p-12 rounded-3xl border border-white/10 shadow-2xl bg-surface/80 backdrop-blur-xl md:w-2/3">
                        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-8">
                            <Zap className="text-primary" size={32} />
                        </div>
                        <h3 className="text-4xl font-display font-bold mb-6">Real-time Risk Assessment</h3>
                        <p className="text-on-surface-variant text-xl leading-relaxed">
                            Our proprietary AI models process thousands of alternative data points instantly to generate a highly accurate, dynamic credit score.
                        </p>
                    </div>

                    <div className="glass p-12 rounded-3xl border border-white/10 shadow-2xl bg-surface/80 backdrop-blur-xl md:w-2/3 ml-auto">
                        <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center mb-8">
                            <Shield className="text-success" size={32} />
                        </div>
                        <h3 className="text-4xl font-display font-bold mb-6">Encrypted Identity</h3>
                        <p className="text-on-surface-variant text-xl leading-relaxed">
                            Your KYC data (PAN, Aadhaar) is hashed and encrypted before it ever reaches our servers. Prove who you are without exposing sensitive details.
                        </p>
                    </div>

                    <div className="glass p-12 rounded-3xl border border-white/10 shadow-2xl bg-surface/80 backdrop-blur-xl md:w-2/3 mx-auto text-center">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-8 mx-auto">
                            <Users className="text-blue-500" size={32} />
                        </div>
                        <h3 className="text-4xl font-display font-bold mb-6">Global Liquidity</h3>
                        <p className="text-on-surface-variant text-xl leading-relaxed mb-8">
                            Access capital from lenders worldwide. Smart contracts ensure instant settlement and guaranteed programmatic execution of loan terms.
                        </p>
                        <Link to="/apply" className="inline-block bg-white text-black px-8 py-4 rounded-xl font-bold transition-transform hover:scale-105">
                            Start Borrowing Now
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="section-low py-16 px-6 z-30 relative bg-surface">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Total Loans', value: stats.totalLoans, icon: Users },
                        { label: 'MATIC Locked', value: stats.tvl, icon: Wallet },
                        { label: 'Avg AI Score', value: stats.avgScore, icon: Zap },
                        { label: 'Repayment Rate', value: `${stats.repaymentRate}%`, icon: TrendingUp }
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col">
                            <div className="text-on-surface-variant mb-2 flex items-center space-x-2">
                                <stat.icon size={16} className="text-primary/60" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <div className="text-4xl md:text-5xl font-display font-bold">{stat.value}</div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
export default Home;
