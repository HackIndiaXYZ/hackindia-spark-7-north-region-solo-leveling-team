import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { UserCircle, Github, Twitter, Briefcase, Zap, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Score3D from '../components/Score3D';

const BorrowerProfile = () => {
    const { walletAddress } = useWeb3();
    const [score, setScore] = useState(650); // Base score

    const [integrations, setIntegrations] = useState({
        github: false,
        twitter: false,
        bank: false
    });

    const connectIntegration = (provider, points) => {
        if (integrations[provider]) return;
        
        // Mock connection process
        const loadingToast = toast.loading(`Connecting ${provider}...`);
        
        setTimeout(() => {
            setIntegrations({...integrations, [provider]: true});
            setScore(prev => prev + points);
            toast.success(`${provider} connected! Score increased.`, { id: loadingToast });
        }, 1500);
    };

    return (
        <div className="max-w-6xl mx-auto py-12 px-6">
            <div className="mb-10 text-center">
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 flex items-center justify-center">
                    <UserCircle className="mr-4 text-primary" size={48} />
                    Borrower Profile
                </h1>
                <p className="text-on-surface-variant text-lg">
                    Connect off-chain data to boost your AI credit score and unlock better loan terms.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
                
                {/* Data Integrations */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold font-display mb-6">Off-Chain Data Sources</h2>
                    
                    {/* GitHub */}
                    <div className="glass p-6 rounded-2xl ghost-border flex items-center justify-between group">
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-xl bg-surface-high flex items-center justify-center mr-4">
                                <Github className={integrations.github ? "text-success" : "text-white"} size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">GitHub Activity</h3>
                                <p className="text-sm text-on-surface-variant">Proof of consistent work (+45 pts)</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => connectIntegration('github', 45)}
                            disabled={integrations.github}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${integrations.github ? 'bg-success/20 text-success' : 'bg-primary hover:bg-primary-dim text-white'}`}
                        >
                            {integrations.github ? <span className="flex items-center"><CheckCircle2 className="mr-2" size={16}/> Connected</span> : 'Connect'}
                        </button>
                    </div>

                    {/* Bank / Plaid */}
                    <div className="glass p-6 rounded-2xl ghost-border flex items-center justify-between group">
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-xl bg-surface-high flex items-center justify-center mr-4">
                                <Briefcase className={integrations.bank ? "text-success" : "text-white"} size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Bank Data (Plaid)</h3>
                                <p className="text-sm text-on-surface-variant">Income verification (+120 pts)</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => connectIntegration('bank', 120)}
                            disabled={integrations.bank}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${integrations.bank ? 'bg-success/20 text-success' : 'bg-primary hover:bg-primary-dim text-white'}`}
                        >
                            {integrations.bank ? <span className="flex items-center"><CheckCircle2 className="mr-2" size={16}/> Connected</span> : 'Connect'}
                        </button>
                    </div>

                    {/* Twitter / X */}
                    <div className="glass p-6 rounded-2xl ghost-border flex items-center justify-between group">
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-xl bg-surface-high flex items-center justify-center mr-4">
                                <Twitter className={integrations.twitter ? "text-success" : "text-white"} size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">X (Twitter) Profile</h3>
                                <p className="text-sm text-on-surface-variant">Social reputation (+20 pts)</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => connectIntegration('twitter', 20)}
                            disabled={integrations.twitter}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${integrations.twitter ? 'bg-success/20 text-success' : 'bg-primary hover:bg-primary-dim text-white'}`}
                        >
                            {integrations.twitter ? <span className="flex items-center"><CheckCircle2 className="mr-2" size={16}/> Connected</span> : 'Connect'}
                        </button>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 p-6 rounded-2xl mt-8">
                        <h3 className="text-primary font-bold flex items-center mb-2">
                            <Zap className="mr-2" size={18} /> Privacy First
                        </h3>
                        <p className="text-sm text-on-surface-variant">
                            Your off-chain data is processed by our secure AI oracle and is never stored permanently. Only the generated proof and resulting score update are etched on-chain.
                        </p>
                    </div>
                </div>

                {/* Live Score Display */}
                <div className="glass p-8 rounded-3xl ghost-border flex flex-col items-center">
                    <h2 className="text-2xl font-bold font-display mb-2">Live AI Score</h2>
                    <p className="text-on-surface-variant text-sm mb-8">Updates in real-time as you connect data</p>
                    
                    <Score3D score={score} />

                    <div className="w-full mt-8 bg-surface-high p-4 rounded-xl flex justify-between items-center text-sm">
                        <span className="text-on-surface-variant">Wallet Address</span>
                        <span className="font-mono">{walletAddress ? `${walletAddress.substring(0,6)}...${walletAddress.substring(walletAddress.length-4)}` : 'Not Connected'}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BorrowerProfile;
