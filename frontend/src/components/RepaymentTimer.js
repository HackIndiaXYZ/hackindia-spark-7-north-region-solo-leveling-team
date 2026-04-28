import React, { useState, useEffect } from 'react';
import { FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const RepaymentTimer = ({ repayBy, gracePeriodEnd, status }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [timerState, setTimerState] = useState('active'); // active, warning, grace, defaulted, repaid

    useEffect(() => {
        // Status: 0=PENDING, 1=FUNDED, 2=REPAID, 3=DEFAULTED
        if (status === 2 || status === 'REPAID') {
            setTimerState('repaid');
            setTimeLeft('Loan Repaid');
            return;
        }
        if (status === 3 || status === 'DEFAULTED') {
            setTimerState('defaulted');
            setTimeLeft('Defaulted');
            return;
        }

        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            
            const repayTime = Number(repayBy);
            const graceTime = Number(gracePeriodEnd);

            if (repayTime === 0) {
                setTimerState('active');
                setTimeLeft('Awaiting funding...');
                return;
            }

            if (now > graceTime && graceTime > 0) {
                setTimerState('defaulted');
                setTimeLeft('Grace period ended');
                return;
            }

            if (now > repayTime && repayTime > 0) {
                setTimerState('grace');
                const diff = graceTime - now;
                setTimeLeft(`Grace: ${formatTime(diff)}`);
                return;
            }

            if (repayTime > 0) {
                const diff = repayTime - now;
                if (diff < 86400 * 2) {
                    setTimerState('warning');
                } else {
                    setTimerState('active');
                }
                setTimeLeft(`${formatTime(diff)}`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [repayBy, gracePeriodEnd, status]);

    const formatTime = (seconds) => {
        if (seconds <= 0) return '00:00:00';
        const d = Math.floor(seconds / (3600*24));
        const h = Math.floor(seconds % (3600*24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 60);
        
        if (d > 0) return `${d}d ${h}h ${m}m`;
        return `${h}h ${m}m ${s}s`;
    };

    const getStateStyles = () => {
        switch (timerState) {
            case 'active':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'warning':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'grace':
                return 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse';
            case 'defaulted':
                return 'bg-red-600/20 text-red-500 border-red-500/40 font-bold';
            case 'repaid':
                return 'bg-green-500/10 text-green-400 border-green-500/20';
            default:
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const getIcon = () => {
        switch (timerState) {
            case 'active':
            case 'warning':
            case 'grace':
                return <FiClock className="w-4 h-4" />;
            case 'defaulted':
                return <FiXCircle className="w-4 h-4" />;
            case 'repaid':
                return <FiCheckCircle className="w-4 h-4" />;
            default:
                return <FiClock className="w-4 h-4" />;
        }
    };

    return (
        <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border backdrop-blur-sm transition-colors ${getStateStyles()}`}>
            {getIcon()}
            <span className="font-mono text-sm font-medium tracking-wide">
                {timeLeft}
            </span>
        </div>
    );
};

export default RepaymentTimer;
