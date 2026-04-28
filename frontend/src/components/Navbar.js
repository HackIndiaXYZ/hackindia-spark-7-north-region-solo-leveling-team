import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { Menu, Zap, X, LogOut, User, ChevronDown } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
    const { walletAddress, balance, isConnected, isDemoMode, toggleDemoMode, userRole, disconnectWallet } = useWeb3();
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [totalLoans, setTotalLoans] = useState(null);

    // Fetch public loan count for non-logged-in users
    useEffect(() => {
        if (!isAuthenticated) {
            axios.get('http://localhost:5000/api/loans/stats')
                .then(res => setTotalLoans(res.data.totalLoans))
                .catch(() => setTotalLoans(247));
        }
    }, [isAuthenticated]);

    const displayName = user?.name || (walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.slice(-4)}` : null);
    const displayRole = user?.role || userRole;
    const loggedIn = isAuthenticated || isConnected;

    const handleLogout = () => {
        logout();
        disconnectWallet?.();
        setShowProfileMenu(false);
        navigate('/');
    };

    const navLinks = [
        { to: '/',          label: 'Home',      public: true  },
        { to: '/about',     label: 'About Us',  public: true  },
        { to: '/analytics', label: 'Analytics', public: true  },
        { to: '/apply',     label: 'Apply',     public: false },
        { to: '/lend',      label: 'Lend',      public: false },
        { to: '/dashboard', label: 'Dashboard', public: false },
    ];

    return (
        <nav style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                    <Zap size={22} color="#7c3aed" />
                    <span style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        MicroLend
                    </span>
                </Link>

                {/* Desktop nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="hidden-mobile">
                    {navLinks.map(({ to, label, public: isPublic }) => (
                        (!isPublic && !loggedIn) ? null : (
                            <Link
                                key={to}
                                to={to}
                                style={{ textDecoration: 'none', color: '#94a3b8', fontWeight: 500, fontSize: 14, transition: 'color 0.2s' }}
                                onMouseEnter={e => e.target.style.color = '#f1f5f9'}
                                onMouseLeave={e => e.target.style.color = '#94a3b8'}
                            >
                                {label}
                            </Link>
                        )
                    ))}
                </div>

                {/* Right section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Demo toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', padding: '5px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo</span>
                        <button
                            onClick={toggleDemoMode}
                            style={{ width: 36, height: 18, borderRadius: 9, border: 'none', cursor: 'pointer', background: isDemoMode ? '#7c3aed' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                        >
                            <div style={{ position: 'absolute', top: 2, left: isDemoMode ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                        </button>
                    </div>

                    {/* Public loan count (unauthenticated) */}
                    {!loggedIn && totalLoans !== null && (
                        <div style={{ fontSize: 11, color: '#64748b', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, padding: '4px 12px', fontWeight: 600 }}>
                            📊 {totalLoans} loans active
                        </div>
                    )}

                    {/* User menu or login */}
                    {loggedIn ? (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, padding: '7px 14px', cursor: 'pointer', color: '#f1f5f9' }}
                            >
                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                    {displayName ? displayName[0].toUpperCase() : '?'}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {displayName || 'My Account'}
                                </span>
                                <ChevronDown size={13} color="#94a3b8" />
                            </button>

                            {showProfileMenu && (
                                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: 200, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 100 }}>
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{displayName}</div>
                                        <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>
                                            {displayRole || 'User'} {user?.authProvider ? `• ${user.authProvider}` : ''}
                                        </div>
                                    </div>
                                    <Link
                                        to={displayRole === 'lender' ? '/profile/lender' : '/profile/borrower'}
                                        onClick={() => setShowProfileMenu(false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#e2e8f0', textDecoration: 'none', fontSize: 13, transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <User size={14} /> My Profile
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <LogOut size={14} /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', borderRadius: 11, color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 15px rgba(124,58,237,0.4)' }}
                        >
                            Sign In
                        </Link>
                    )}

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'none' }}
                        className="show-mobile"
                    >
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Demo mode banner */}
            {isDemoMode && (
                <div style={{ background: 'rgba(245,158,11,0.08)', borderTop: '1px solid rgba(245,158,11,0.2)', padding: '4px 24px', textAlign: 'center', fontSize: 10, color: '#fbbf24', fontWeight: 700, letterSpacing: '0.1em' }}>
                    ⚠️ DEMO MODE ACTIVE — NO REAL TRANSACTIONS
                </div>
            )}

            <style>{`
                @media (max-width: 768px) {
                    .hidden-mobile { display: none !important; }
                    .show-mobile { display: block !important; }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
