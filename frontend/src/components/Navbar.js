import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { Menu, Zap } from 'lucide-react';

const Navbar = () => {
    const { 
        walletAddress, balance, isConnected, 
        isDemoMode, toggleDemoMode, userRole, disconnectWallet
    } = useWeb3();
    const [showProfileMenu, setShowProfileMenu] = React.useState(false);

    return (
        <nav className="bg-surface sticky top-0 z-50 py-4 px-6">
            <div className="mx-auto flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2">
                    <Zap className="text-primary w-8 h-8" />
                    <span className="text-2xl font-bold font-display gradient-text">
                        MicroLend
                    </span>
                </Link>
                
                <div className="hidden md:flex space-x-10 items-center font-medium text-on-surface-variant">
                    <Link to="/" className="hover:text-on-surface transition-colors">Home</Link>
                    <Link to="/apply" className="hover:text-on-surface transition-colors">Apply</Link>
                    <Link to="/lend" className="hover:text-on-surface transition-colors">Lend</Link>
                    <Link to="/dashboard" className="hover:text-on-surface transition-colors">Dashboard</Link>
                    <Link to="/analytics" className="hover:text-on-surface transition-colors">Analytics</Link>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-surface-low px-3 py-1.5 rounded-full ghost-border">
                        <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Demo</span>
                        <button 
                            onClick={toggleDemoMode}
                            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isDemoMode ? 'bg-primary' : 'bg-surface-high'}`}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isDemoMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {isDemoMode && (
                        <span className="hidden sm:inline-flex bg-yellow-400/10 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-400/20">
                            DEMO
                        </span>
                    )}

                    {isConnected ? (
                        <div className="relative">
                            <button 
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="hidden sm:flex items-center bg-surface-high rounded-xl px-4 py-2 ghost-border hover:bg-surface transition-colors cursor-pointer"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse mr-2"></div>
                                <span className="text-sm text-on-surface mr-3 font-medium">{parseFloat(balance).toFixed(3)} MATIC</span>
                                <span className="text-sm text-primary font-bold">{walletAddress.substring(0,6)}...{walletAddress.substring(walletAddress.length - 4)}</span>
                            </button>
                            
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-surface-high border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                                    <div className="p-3 border-b border-white/10 text-xs text-on-surface-variant uppercase font-bold tracking-wider">
                                        Role: {userRole || 'None'}
                                    </div>
                                    <Link 
                                        to={userRole === 'lender' ? "/profile/lender" : "/profile/borrower"} 
                                        onClick={() => setShowProfileMenu(false)}
                                        className="block px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                                    >
                                        My Profile
                                    </Link>
                                    <button 
                                        onClick={() => {
                                            disconnectWallet();
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-error hover:bg-error/10 transition-colors"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link 
                          to="/login"
                          className="bg-primary hover:bg-primary-dim text-white px-6 py-2 rounded-xl text-sm font-bold transition-all"
                        >
                            Log In
                        </Link>
                    )}
                    <button className="md:hidden text-on-surface-variant hover:text-on-surface">
                        <Menu size={24} />
                    </button>
                </div>
            </div>
            {isDemoMode && (
              <div className="w-full bg-yellow-400/5 text-yellow-500/80 text-[10px] font-bold py-1 px-6 mt-4 flex justify-center items-center space-x-2">
                <span>⚠️ DEMO MODE ACTIVE</span>
                <span className="opacity-50">•</span>
                <span>NO REAL TRANSACTIONS</span>
              </div>
            )}
        </nav>
    );
};
export default Navbar;
