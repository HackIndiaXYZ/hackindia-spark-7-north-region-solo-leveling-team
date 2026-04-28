import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Settings, Shield, Bell, Zap, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const LenderProfile = () => {
    const { walletAddress } = useWeb3();
    const [preferences, setPreferences] = useState({
        autoLending: false,
        riskTolerance: 'medium', // low, medium, high
        maxLoanSize: '500',
        notifications: true
    });

    const handleSave = () => {
        // In a real app, save to smart contract or backend
        toast.success("Lender preferences saved!");
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <h1 className="text-4xl font-display font-bold mb-8 flex items-center">
                <Settings className="mr-4 text-success" size={40} />
                Lender Profile & Settings
            </h1>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    {/* Auto-Lending Card */}
                    <div className="glass p-8 rounded-3xl ghost-border">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center">
                                <Zap className="mr-2 text-primary" />
                                Auto-Lending Engine
                            </h2>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={preferences.autoLending}
                                    onChange={(e) => setPreferences({...preferences, autoLending: e.target.checked})}
                                />
                                <div className="w-14 h-7 bg-surface-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-success"></div>
                            </label>
                        </div>
                        <p className="text-on-surface-variant mb-6">
                            Automatically deploy your capital to borrowers matching your risk tolerance. Your funds will never sit idle.
                        </p>
                        
                        <div className={`space-y-6 transition-all duration-300 ${!preferences.autoLending ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-2">Risk Tolerance (Target APY)</label>
                                <div className="flex bg-surface-low rounded-xl p-1">
                                    {['low', 'medium', 'high'].map((level) => (
                                        <button 
                                            key={level}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${preferences.riskTolerance === level ? 'bg-surface text-white shadow-md' : 'text-on-surface-variant hover:text-white'}`}
                                            onClick={() => setPreferences({...preferences, riskTolerance: level})}
                                        >
                                            {level} Risk
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2 text-xs text-on-surface-variant flex justify-between">
                                    <span>~5% APY</span>
                                    <span>~12% APY</span>
                                    <span>~20% APY</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-2">Max Loan Size (MATIC)</label>
                                <input 
                                    type="number" 
                                    value={preferences.maxLoanSize}
                                    onChange={(e) => setPreferences({...preferences, maxLoanSize: e.target.value})}
                                    className="w-full bg-surface-high border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-success/50 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full bg-success text-white font-bold py-4 rounded-xl hover:bg-success/90 transition-colors flex items-center justify-center shadow-lg shadow-success/20"
                    >
                        <Save className="mr-2" size={20} />
                        Save Preferences
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Wallet Info */}
                    <div className="tonal-card p-6 rounded-3xl ghost-border">
                        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center">
                            <Shield className="mr-2" size={16} /> Identity
                        </h3>
                        <p className="text-xs text-on-surface-variant break-all bg-surface-low p-3 rounded-lg mb-2">
                            {walletAddress || "Not connected"}
                        </p>
                        <div className="flex items-center text-xs text-success">
                            <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse"></span>
                            Verified Lender
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="tonal-card p-6 rounded-3xl ghost-border">
                         <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center">
                            <Bell className="mr-2" size={16} /> Alerts
                        </h3>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Email Notifications</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={preferences.notifications}
                                    onChange={(e) => setPreferences({...preferences, notifications: e.target.checked})}
                                />
                                <div className="w-9 h-5 bg-surface-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LenderProfile;
