import React, { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

// Live-ish MATIC price approximation (can be fetched from an API)
const MATIC_TO_USD = 0.82;
const MATIC_TO_INR = 68.5;

export const formatAmount = (maticAmount, currency) => {
    if (currency === 'USD') {
        return { value: (maticAmount * MATIC_TO_USD).toFixed(2), symbol: '$', unit: 'USD' };
    }
    if (currency === 'INR') {
        return { value: Math.round(maticAmount * MATIC_TO_INR).toLocaleString('en-IN'), symbol: '₹', unit: 'INR' };
    }
    return { value: maticAmount, symbol: '', unit: 'MATIC' };
};

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState('MATIC'); // 'MATIC' | 'USD' | 'INR'

    const cycleCurrency = () => {
        setCurrency(prev => {
            if (prev === 'MATIC') return 'USD';
            if (prev === 'USD') return 'INR';
            return 'MATIC';
        });
    };

    const displayAmount = (maticAmount) => {
        const { value, symbol, unit } = formatAmount(maticAmount, currency);
        if (currency === 'MATIC') return `${value} MATIC`;
        if (currency === 'USD') return `$${value}`;
        if (currency === 'INR') return `₹${value}`;
        return `${value} ${unit}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, cycleCurrency, displayAmount, formatAmount: (v) => formatAmount(v, currency), MATIC_TO_USD, MATIC_TO_INR }}>
            {children}
        </CurrencyContext.Provider>
    );
};
