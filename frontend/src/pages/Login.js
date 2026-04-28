import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { Eye, EyeOff, Lock, Mail, User, Phone, MapPin, Calendar, CreditCard, Shield, Zap, Chrome } from 'lucide-react';

const GOOGLE_MOCK_USERS = [
    { googleId: 'google_101', name: 'Aanya Sharma', email: 'aanya.sharma@gmail.com', avatar: 'AS' },
    { googleId: 'google_102', name: 'Rohan Mehta',  email: 'rohan.mehta@gmail.com',  avatar: 'RM' },
    { googleId: 'google_103', name: 'Priya Verma',  email: 'priya.verma@gmail.com',  avatar: 'PV' },
];

const InputField = ({ icon: Icon, label, type = 'text', value, onChange, placeholder, required, suffix }) => {
    const [show, setShow] = useState(false);
    const inputType = type === 'password' ? (show ? 'text' : 'password') : type;
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#a78bfa', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label} {required && <span style={{ color: '#f87171' }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
                <Icon size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7c3aed', opacity: 0.7 }} />
                <input
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    style={{
                        width: '100%',
                        background: 'rgba(124,58,237,0.07)',
                        border: '1px solid rgba(124,58,237,0.25)',
                        borderRadius: 10,
                        padding: suffix ? '10px 40px 10px 36px' : '10px 12px 10px 36px',
                        color: '#f1f5f9',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                    onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.25)'}
                />
                {type === 'password' && (
                    <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: 0 }}>
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                )}
                {suffix && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#94a3b8' }}>{suffix}</span>}
            </div>
        </div>
    );
};

const RoleCard = ({ role, selected, onClick }) => (
    <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onClick(role)}
        style={{
            flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
            border: selected === role ? '2px solid #7c3aed' : '2px solid rgba(124,58,237,0.2)',
            background: selected === role ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
            color: selected === role ? '#a78bfa' : '#94a3b8',
            fontWeight: 700, fontSize: 13, transition: 'all 0.2s'
        }}
    >
        {role === 'borrower' ? '🏦 Borrower' : '💰 Lender'}
        <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 400, marginTop: 3 }}>
            {role === 'borrower' ? 'Request loans' : 'Fund loans'}
        </div>
    </motion.button>
);

export default function Login() {
    const { login, register, googleLogin } = useAuth();
    const { connectWallet, isDemoMode } = useWeb3();
    const navigate = useNavigate();
    const location = useLocation();

    const returnTo = location.state?.from?.pathname || '/';
    const getRedirect = (role) => role === 'lender' ? '/lend' : (role === 'borrower' ? '/dashboard' : returnTo);

    const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
    const [role, setRole] = useState('borrower');
    const [encryptAnim, setEncryptAnim] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showGooglePicker, setShowGooglePicker] = useState(false);
    const [googleRole, setGoogleRole] = useState('borrower');

    // Sign In state
    const [signInEmail, setSignInEmail] = useState('');
    const [signInPass, setSignInPass]   = useState('');

    // Sign Up state
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPass: '',
        phone: '', address: '', age: '', panCard: '', aadharCard: ''
    });

    const updateForm = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(signInEmail, signInPass);
            navigate(getRedirect(data.user.role));
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPass) {
            setError('Passwords do not match.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setEncryptAnim(true);
        setLoading(true);
        await new Promise(r => setTimeout(r, 2200)); // Let the encryption animation play
        try {
            const payload = { name: form.name, email: form.email, password: form.password, phone: form.phone, address: form.address, age: form.age ? Number(form.age) : undefined, role, panCard: form.panCard, aadharCard: form.aadharCard };
            const data = await register(payload);
            navigate(getRedirect(data.user.role));
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
            setEncryptAnim(false);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async (mockUser) => {
        setShowGooglePicker(false);
        setLoading(true);
        setError('');
        try {
            const data = await googleLogin(mockUser, googleRole);
            navigate(getRedirect(data.user.role));
        } catch (err) {
            setError(err.response?.data?.message || 'Google sign-in failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleWalletConnect = async () => {
        setLoading(true);
        setError('');
        try {
            await connectWallet();
            navigate(returnTo);
        } catch {
            setError('Wallet connection failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d0514 0%, #0f172a 60%, #0d0514 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
            {/* Background glow */}
            <div style={{ position: 'fixed', top: '20%', left: '15%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '20%', right: '15%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ width: '100%', maxWidth: 480, background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 24, padding: '36px 32px', boxShadow: '0 25px 80px rgba(0,0,0,0.5)' }}
            >
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Zap size={24} color="#7c3aed" />
                        <span style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MicroLend</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: 12 }}>Decentralized micro-finance protocol</p>
                </div>

                {/* Tab switcher */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
                    {['signin', 'signup'].map(t => (
                        <motion.button
                            key={t}
                            onClick={() => { setTab(t); setError(''); }}
                            style={{
                                flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                                background: tab === t ? 'rgba(124,58,237,0.3)' : 'transparent',
                                color: tab === t ? '#a78bfa' : '#64748b',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t === 'signin' ? 'Sign In' : 'Create Account'}
                        </motion.button>
                    ))}
                </div>

                {/* Encryption animation overlay */}
                <AnimatePresence>
                    {encryptAnim && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ position: 'absolute', inset: 0, borderRadius: 24, background: 'rgba(10,5,20,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, backdropFilter: 'blur(8px)' }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                style={{ marginBottom: 20 }}
                            >
                                <Shield size={48} color="#7c3aed" />
                            </motion.div>
                            <p style={{ color: '#a78bfa', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Encrypting Your Data</p>
                            {['bcrypt hashing PAN / Aadhaar…', 'Securing phone & address…', 'Generating JWT token…'].map((msg, i) => (
                                <motion.p
                                    key={msg}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.55 }}
                                    style={{ color: '#64748b', fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <Lock size={10} color="#10b981" /> {msg}
                                </motion.p>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ position: 'relative' }}>
                    <AnimatePresence mode="wait">
                        {/* ── SIGN IN ──────────────────────────────────────────── */}
                        {tab === 'signin' && (
                            <motion.form
                                key="signin"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleSignIn}
                            >
                                <InputField icon={Mail} label="Email" type="email" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} placeholder="you@example.com" required />
                                <InputField icon={Lock} label="Password" type="password" value={signInPass} onChange={e => setSignInPass(e.target.value)} placeholder="Your password" required />

                                {error && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)' }}>{error}</p>}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginBottom: 12 }}
                                >
                                    {loading ? 'Signing in…' : 'Sign In →'}
                                </motion.button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
                                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                                    <span style={{ color: '#475569', fontSize: 11 }}>OR</span>
                                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={() => setShowGooglePicker(true)}
                                    style={{ width: '100%', padding: '11px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#e2e8f0', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}
                                >
                                    <Chrome size={18} color="#ea4335" /> Continue with Google
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={handleWalletConnect}
                                    style={{ width: '100%', padding: '11px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, color: '#fbbf24', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                                >
                                    🦊 Connect MetaMask Wallet
                                </motion.button>
                            </motion.form>
                        )}

                        {/* ── SIGN UP ──────────────────────────────────────────── */}
                        {tab === 'signup' && (
                            <motion.form
                                key="signup"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSignUp}
                            >
                                {/* Role selection */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#a78bfa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>I want to <span style={{ color: '#f87171' }}>*</span></label>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <RoleCard role="borrower" selected={role} onClick={setRole} />
                                        <RoleCard role="lender"   selected={role} onClick={setRole} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <InputField icon={User}     label="Full Name"   value={form.name}       onChange={updateForm('name')}       placeholder="Aarav Singh"        required />
                                    <InputField icon={Calendar} label="Age"         type="number" value={form.age} onChange={updateForm('age')}  placeholder="25" />
                                </div>
                                <InputField icon={Mail}  label="Email"    type="email"    value={form.email}    onChange={updateForm('email')}    placeholder="you@example.com"   required />
                                <InputField icon={Phone} label="Phone No" type="tel"      value={form.phone}    onChange={updateForm('phone')}    placeholder="+91 98765 43210" />
                                <InputField icon={MapPin} label="Address"              value={form.address}  onChange={updateForm('address')}  placeholder="123, MG Road, Mumbai" />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <InputField icon={CreditCard} label="PAN Card"     value={form.panCard}    onChange={updateForm('panCard')}    placeholder="ABCDE1234F" />
                                    <InputField icon={Shield}     label="Aadhaar No"   value={form.aadharCard} onChange={updateForm('aadharCard')} placeholder="XXXX XXXX XXXX" />
                                </div>
                                <InputField icon={Lock} label="Password"         type="password" value={form.password}    onChange={updateForm('password')}    placeholder="Min 6 characters" required />
                                <InputField icon={Lock} label="Confirm Password" type="password" value={form.confirmPass} onChange={updateForm('confirmPass')} placeholder="Repeat password"    required />

                                <div style={{ fontSize: 10, color: '#475569', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(124,58,237,0.05)', borderRadius: 8 }}>
                                    <Lock size={10} color="#7c3aed" />
                                    PAN & Aadhaar are bcrypt-hashed. Address & phone are encrypted. We never store raw KYC data.
                                </div>

                                {error && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)' }}>{error}</p>}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginBottom: 12 }}
                                >
                                    {loading ? 'Creating account…' : '🔐 Create Account'}
                                </motion.button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
                                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                                    <span style={{ color: '#475569', fontSize: 11 }}>OR</span>
                                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    type="button"
                                    onClick={() => setShowGooglePicker(true)}
                                    style={{ width: '100%', padding: '11px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#e2e8f0', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                                >
                                    <Chrome size={18} color="#ea4335" /> Sign up with Google
                                </motion.button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sign in / create link */}
                <p style={{ textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 20 }}>
                    {tab === 'signin' ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setError(''); }} style={{ color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                        {tab === 'signin' ? 'Create one' : 'Sign in'}
                    </button>
                </p>
            </motion.div>

            {/* Google account picker modal */}
            <AnimatePresence>
                {showGooglePicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
                        onClick={() => setShowGooglePicker(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 360, boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <Chrome size={32} color="#ea4335" style={{ margin: '0 auto 10px' }} />
                                <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 16, margin: 0 }}>Choose a Google account</h3>
                                <p style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>Demo mode — select a mock account</p>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>I am a:</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {['borrower', 'lender'].map(r => (
                                        <button key={r} onClick={() => setGoogleRole(r)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: googleRole === r ? '1.5px solid #7c3aed' : '1.5px solid rgba(255,255,255,0.1)', background: googleRole === r ? 'rgba(124,58,237,0.15)' : 'transparent', color: googleRole === r ? '#a78bfa' : '#94a3b8', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                                            {r === 'borrower' ? '🏦 Borrower' : '💰 Lender'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {GOOGLE_MOCK_USERS.map(u => (
                                <motion.button
                                    key={u.googleId}
                                    whileHover={{ x: 4, background: 'rgba(124,58,237,0.1)' }}
                                    onClick={() => handleGoogleSignIn(u)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', marginBottom: 8, textAlign: 'left' }}
                                >
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0 }}>
                                        {u.avatar}
                                    </div>
                                    <div>
                                        <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                                        <div style={{ color: '#64748b', fontSize: 11 }}>{u.email}</div>
                                    </div>
                                </motion.button>
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
