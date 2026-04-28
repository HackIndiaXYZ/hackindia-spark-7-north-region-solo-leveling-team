import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useWeb3 } from '../context/Web3Context';
import { getProtocolStats } from '../utils/web3Service';
import { TrendingUp, Users, Wallet, ShieldCheck, Zap, Activity, AlertCircle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface-high border border-white/10 rounded-xl p-3 shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-sm font-bold" style={{ color: p.color || '#E0E5F6' }}>
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

const AnimatedCounter = ({ end, suffix = '' }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = end / 90;
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 1000 / 60);
        return () => clearInterval(timer);
    }, [end]);
    return <span>{count.toLocaleString()}{suffix}</span>;
};

const volumeData = [
    { day: 'Mon', loans: 42, volume: 0.8 }, { day: 'Tue', loans: 67, volume: 1.4 },
    { day: 'Wed', loans: 55, volume: 1.1 }, { day: 'Thu', loans: 88, volume: 2.1 },
    { day: 'Fri', loans: 112, volume: 2.8 }, { day: 'Sat', loans: 95, volume: 2.2 },
    { day: 'Sun', loans: 74, volume: 1.6 },
];
const purposeData = [
    { purpose: 'Medical', count: 38, color: '#818CF8' }, { purpose: 'Business', count: 27, color: '#9333EA' },
    { purpose: 'Agriculture', count: 18, color: '#4ADE80' }, { purpose: 'Education', count: 10, color: '#FACC15' },
    { purpose: 'Home', count: 7, color: '#FF6E84' },
];
const scoreData = [
    { range: '600-649', count: 45 }, { range: '650-699', count: 120 },
    { range: '700-749', count: 310 }, { range: '750-799', count: 280 },
    { range: '800-849', count: 95 }, { range: '850+', count: 30 },
];
const monthlyData = [
    { month: 'Oct', total: 80, repaid: 72 }, { month: 'Nov', total: 160, repaid: 148 },
    { month: 'Dec', total: 280, repaid: 258 }, { month: 'Jan', total: 430, repaid: 395 },
    { month: 'Feb', total: 620, repaid: 572 }, { month: 'Mar', total: 870, repaid: 801 },
    { month: 'Apr', total: 1247, repaid: 1136 },
];

const Analytics = () => {
    const { contract, isDemoMode } = useWeb3();
    const [stats, setStats] = useState({ totalLoans: 1247, tvl: 892 });

    useEffect(() => {
        getProtocolStats(contract, isDemoMode).then(d => { if (d) setStats(d); });
    }, [contract, isDemoMode]);

    const kpis = [
        { label: 'Total Loans', value: stats.totalLoans || 1247, suffix: '', icon: Users, color: '#818CF8', trend: '+12.4%', up: true },
        { label: 'TVL (MATIC)', value: stats.tvl || 892, suffix: '', icon: Wallet, color: '#9333EA', trend: '+8.7%', up: true },
        { label: 'Avg AI Score', value: 724, suffix: '', icon: Zap, color: '#4ADE80', trend: '+3.2 pts', up: true },
        { label: 'Repayment Rate', value: 91, suffix: '%', icon: ShieldCheck, color: '#FACC15', trend: '-0.3%', up: false },
        { label: 'Active Loans', value: 143, suffix: '', icon: Activity, color: '#818CF8', trend: '+18', up: true },
        { label: 'Default Rate', value: 3, suffix: '%', icon: AlertCircle, color: '#FF6E84', trend: '-0.5%', up: true },
    ];

    return (
        <div className="py-12 px-6 max-w-7xl mx-auto min-h-screen">
            <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                <div className="flex items-center space-x-3 text-primary mb-2">
                    <TrendingUp size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Protocol Intelligence</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold">
                    Analytics <span className="text-primary">Dashboard</span>
                </h1>
                <p className="text-on-surface-variant mt-3 text-sm">Real-time on-chain lending metrics and market intelligence.</p>
            </motion.header>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
                {kpis.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="tonal-card rounded-2xl p-5 ghost-border hover:scale-[1.02] transition-transform">
                            <div className="flex items-center justify-between mb-3">
                                <Icon size={16} style={{ color: card.color }} />
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${card.up ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                    {card.trend}
                                </span>
                            </div>
                            <div className="text-2xl font-display font-black text-on-surface">
                                <AnimatedCounter end={card.value} suffix={card.suffix} />
                            </div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">{card.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Row 1: Area + Pie */}
            <div className="grid lg:grid-cols-12 gap-8 mb-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="lg:col-span-8 tonal-card rounded-3xl p-8 ghost-border">
                    <h3 className="text-lg font-display font-bold mb-1">Weekly Loan Volume</h3>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-6">Loans & MATIC volume per day</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={volumeData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3} /><stop offset="95%" stopColor="#9333EA" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.25} /><stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#A6ABBB', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#A6ABBB' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="loans" name="Loans" stroke="#9333EA" strokeWidth={2} fill="url(#lg1)" dot={false} />
                            <Area type="monotone" dataKey="volume" name="Volume (MATIC)" stroke="#4ADE80" strokeWidth={2} fill="url(#lg2)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="lg:col-span-4 tonal-card rounded-3xl p-8 ghost-border">
                    <h3 className="text-lg font-display font-bold mb-1">Loan Purpose</h3>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-4">Distribution by category</p>
                    <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                            <Pie data={purposeData} dataKey="count" nameKey="purpose" innerRadius={42} outerRadius={62} strokeWidth={0} paddingAngle={3}>
                                {purposeData.map((e, i) => <Cell key={i} fill={e.color} opacity={0.85} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                        {purposeData.map((p, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                                    <span className="text-[10px] text-on-surface-variant">{p.purpose}</span>
                                </div>
                                <span className="text-[10px] font-bold">{p.count}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Row 2: Bar + Line */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="tonal-card rounded-3xl p-8 ghost-border">
                    <h3 className="text-lg font-display font-bold mb-1">Score Distribution</h3>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-6">Borrowers by AI credit score range</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={scoreData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#A6ABBB', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#A6ABBB' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" name="Borrowers" radius={[4, 4, 0, 0]}>
                                {scoreData.map((_, i) => <Cell key={i} fill={`hsl(${250 + i * 20}, 70%, ${50 + i * 5}%)`} opacity={0.85} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="tonal-card rounded-3xl p-8 ghost-border">
                    <h3 className="text-lg font-display font-bold mb-1">Protocol Growth</h3>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-6">Cumulative loans over 7 months</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#A6ABBB', fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#A6ABBB' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="total" name="Total Loans" stroke="#9333EA" strokeWidth={2.5} dot={{ r: 3, fill: '#9333EA' }} />
                            <Line type="monotone" dataKey="repaid" name="Repaid" stroke="#4ADE80" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Health Bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="tonal-card rounded-3xl p-8 ghost-border">
                <h3 className="text-lg font-display font-bold mb-6">Protocol Health Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Repayment Rate', val: 91.3, color: '#4ADE80' },
                        { label: 'Capital Utilization', val: 78, color: '#9333EA' },
                        { label: 'Avg Score (÷ 9)', val: 80.4, color: '#818CF8' },
                        { label: 'Default Rate (÷ 10)', val: 32, color: '#FF6E84' }
                    ].map((m, i) => (
                        <div key={i}>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{m.label}</span>
                                <span className="text-xl font-display font-black" style={{ color: m.color }}>{m.val}%</span>
                            </div>
                            <div className="w-full bg-surface-lowest h-1.5 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${m.val}%` }}
                                    transition={{ duration: 1.2, delay: 0.6 + i * 0.1, ease: 'circOut' }}
                                    className="h-full rounded-full" style={{ background: m.color }} />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};
export default Analytics;
