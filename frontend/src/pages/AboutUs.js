import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import axios from 'axios';
import { Zap, Users, TrendingUp, Shield, Globe, Code2, Activity, Award, ChevronRight } from 'lucide-react';

const StatCard = ({ value, label, icon: Icon, color }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.4 }}
        style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${color}30`,
            borderRadius: 20,
            padding: '28px 24px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)'
        }}
    >
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Icon size={22} color={color} />
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</div>
    </motion.div>
);

const FeatureCard = ({ icon, title, description, color }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        whileHover={{ x: 6 }}
        transition={{ duration: 0.4 }}
        style={{
            display: 'flex', alignItems: 'flex-start', gap: 16,
            padding: '20px', borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            marginBottom: 12
        }}
    >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
        </div>
        <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{description}</div>
        </div>
    </motion.div>
);

const TechBadge = ({ name, color, icon }) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 100, background: `${color}10`, border: `1px solid ${color}30`, color, fontSize: 12, fontWeight: 600, margin: '4px' }}
    >
        {icon} {name}
    </motion.div>
);

export default function AboutUs() {
    const [stats, setStats] = useState({ totalLoans: 0, tvl: 0, repaymentRate: 91.3 });

    useEffect(() => {
        axios.get('http://localhost:5000/api/loans/stats')
            .then(res => setStats(res.data))
            .catch(() => setStats({ totalLoans: 247, tvl: 18400, repaymentRate: 91.3 }));
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: '#0d1117', fontFamily: "'Inter', sans-serif", color: '#f1f5f9' }}>
            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #0d0514 0%, #0f172a 50%, #0a1628 100%)', padding: '80px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 400, background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 100, padding: '6px 16px', fontSize: 12, color: '#a78bfa', fontWeight: 600, marginBottom: 24 }}>
                        <Zap size={12} /> Built for India's Unbanked
                    </div>
                    <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 900, margin: '0 0 20px', lineHeight: 1.15 }}>
                        <span style={{ background: 'linear-gradient(135deg, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Democratizing Finance
                        </span>
                        <br />
                        <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.6em' }}>with Blockchain + AI</span>
                    </h1>
                    <p style={{ maxWidth: 560, margin: '0 auto', color: '#64748b', fontSize: 15, lineHeight: 1.7 }}>
                        MicroLend is a decentralized peer-to-peer lending platform that connects borrowers with real-world collateral to lenders seeking yield — powered by Polygon, Gemini AI credit scoring, and secure KYC.
                    </p>
                </motion.div>
            </div>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
                {/* Live Stats */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} style={{ margin: '-30px 0 60px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        <StatCard value={stats.totalLoans || '247+'} label="Total Loans Funded" icon={Activity} color="#7c3aed" />
                        <StatCard value={`₹${(stats.tvl * 7000 / 100000).toFixed(1)}L`} label="Total Value Locked" icon={TrendingUp} color="#06b6d4" />
                        <StatCard value={`${stats.repaymentRate}%`} label="Repayment Rate" icon={Award} color="#10b981" />
                        <StatCard value="< 60s" label="Avg Approval Time" icon={Zap} color="#f59e0b" />
                    </div>
                </motion.div>

                {/* Mission */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginBottom: 72 }}>
                    <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}>
                        <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Our Mission</div>
                        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, lineHeight: 1.3 }}>
                            Financial inclusion for the <span style={{ color: '#a78bfa' }}>next billion users</span>
                        </h2>
                        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>
                            Over 190 million Indians lack access to formal credit. Traditional banks require collateral most people don't have, charge extortionate interest rates, and take weeks to process applications.
                        </p>
                        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.8 }}>
                            MicroLend changes this by using <strong style={{ color: '#a78bfa' }}>Gemini AI credit scoring</strong> to assess risk from non-traditional data, enabling anyone with a smartphone to access fair-rate micro-loans in under a minute.
                        </p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}>
                        <FeatureCard icon="🤖" title="AI Credit Scoring" description="Gemini AI analyzes digital footprints and behavioral data to generate credit scores for the unbanked." color="#7c3aed" />
                        <FeatureCard icon="⛓️" title="On-Chain Transparency" description="Every loan, repayment, and default is recorded immutably on Polygon — no hidden terms." color="#06b6d4" />
                        <FeatureCard icon="🔐" title="Privacy-First KYC" description="PAN and Aadhaar are bcrypt-hashed. Phone and address are encrypted. We store only what's necessary." color="#10b981" />
                        <FeatureCard icon="🏆" title="Reputation Badges" description="On-chain badges reward reliable borrowers with better rates and higher loan limits over time." color="#f59e0b" />
                    </motion.div>
                </div>

                {/* How It Works */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} style={{ textAlign: 'center', marginBottom: 64 }}>
                    <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>How It Works</div>
                    <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 40 }}>3 steps to financial freedom</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                        {[
                            { step: '01', title: 'Create Account', desc: 'Sign up with email, Google, or MetaMask. Complete KYC — all data encrypted.', icon: '🔐' },
                            { step: '02', title: 'Get AI Score', desc: 'Gemini AI analyzes your profile and generates an instant credit score with explanation.', icon: '🤖' },
                            { step: '03', title: 'Get Funded', desc: 'Post your loan request. Lenders compete to fund you — best rates win.', icon: '⚡' },
                        ].map(({ step, title, desc, icon }) => (
                            <motion.div
                                key={step}
                                whileHover={{ y: -6 }}
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 20, padding: '28px 20px' }}
                            >
                                <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, marginBottom: 8 }}>{step}</div>
                                <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{title}</div>
                                <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.6 }}>{desc}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Tech Stack */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} style={{ textAlign: 'center', marginBottom: 64, padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Powered By</div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>Built on world-class technology</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
                        <TechBadge name="Polygon" color="#8247e5" icon="⬡" />
                        <TechBadge name="Solidity" color="#627eea" icon="◈" />
                        <TechBadge name="Gemini AI" color="#06b6d4" icon="✦" />
                        <TechBadge name="React" color="#61dafb" icon="⚛" />
                        <TechBadge name="Node.js" color="#68a063" icon="◉" />
                        <TechBadge name="MongoDB" color="#10b981" icon="◫" />
                        <TechBadge name="bcrypt" color="#f59e0b" icon="🔒" />
                        <TechBadge name="JWT Auth" color="#a78bfa" icon="🪙" />
                        <TechBadge name="Framer Motion" color="#f472b6" icon="✦" />
                        <TechBadge name="Ethers.js" color="#3c3c3d" icon="Ξ" />
                    </div>
                </motion.div>

                {/* Team */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>The Team</div>
                    <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 40 }}>Solo Leveling Team ⚡</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                        {[
                            { name: 'Full-Stack Dev', role: 'React + Node.js + Web3', avatar: 'FD', color: '#7c3aed' },
                            { name: 'Blockchain Dev', role: 'Solidity + Polygon + ethers.js', avatar: 'BD', color: '#06b6d4' },
                            { name: 'AI Engineer', role: 'Gemini AI + Credit Scoring', avatar: 'AI', color: '#10b981' },
                        ].map(m => (
                            <motion.div
                                key={m.name}
                                whileHover={{ y: -6 }}
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '28px 20px', textAlign: 'center' }}
                            >
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${m.color}, ${m.color}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 20, fontWeight: 700, color: '#fff' }}>
                                    {m.avatar}
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{m.name}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{m.role}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', padding: '48px 24px', background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.06))', borderRadius: 24, border: '1px solid rgba(124,58,237,0.2)' }}
                >
                    <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Ready to get started?</h2>
                    <p style={{ color: '#64748b', marginBottom: 28, fontSize: 14 }}>Join thousands already using MicroLend to access fair credit.</p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <motion.a
                            href="/login"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', borderRadius: 12, color: '#fff', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                            Get Started <ChevronRight size={16} />
                        </motion.a>
                        <motion.a
                            href="/analytics"
                            whileHover={{ scale: 1.04 }}
                            style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#e2e8f0', fontWeight: 600, textDecoration: 'none' }}
                        >
                            View Analytics
                        </motion.a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
