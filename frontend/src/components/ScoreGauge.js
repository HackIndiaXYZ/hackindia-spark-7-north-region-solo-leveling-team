import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Zap } from 'lucide-react';
import Score3D from './Score3D';

const ScoreGauge = ({ score, risk, approved, reason }) => {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        let current = 0;
        const target = parseInt(score) || 0;
        const duration = 1500;
        const stepTime = 20;
        const totalSteps = duration / stepTime;
        const increment = target / totalSteps;

        const interval = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            setAnimatedScore(Math.round(current));
        }, stepTime);
        return () => clearInterval(interval);
    }, [score]);

    let textClass = "text-error";
    if (score >= 700) { textClass = "text-success"; }
    else if (score >= 500) { textClass = "text-yellow-400"; }

    return (
        <div className="flex flex-col items-center w-full">
            <div className="relative w-full max-w-lg mb-8">
                {/* 3D Gauge Component */}
                <Score3D score={score} />
                
                <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center justify-center">
                    <div className="flex items-center space-x-1">
                      <Zap size={14} className={textClass} />
                      <span className={`text-[12px] font-bold uppercase tracking-widest ${textClass}`}>{risk} Risk Profile</span>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-md">
              <div className="bg-surface-lowest ghost-border p-6 rounded-2xl relative overflow-hidden">
                <div className="flex items-start space-x-4 relative z-10">
                  <div className={`mt-1 p-2 rounded-lg ${approved ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    {approved ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-bold font-display uppercase tracking-wider text-on-surface">AI Assessment Verdict</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${approved ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {approved ? 'QUALIFIED' : 'NOT QUALIFIED'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed font-light">
                      {reason || "Analysis based on multi-dimensional alternative data points including income stability and behavioral utility patterns."}
                    </p>
                  </div>
                </div>
                {/* Subtle texture */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl -mr-12 -mt-12 rounded-full"></div>
              </div>
            </div>
        </div>
    );
};
export default ScoreGauge;
