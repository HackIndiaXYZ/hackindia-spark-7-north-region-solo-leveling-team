import React from 'react';
import { Toaster, toast } from 'react-hot-toast';

const ToastProvider = () => {
  return (
    <Toaster 
        position="bottom-right"
        toastOptions={{
            duration: 5000,
            style: {
                background: '#111827',
                color: '#E0E5F6',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '16px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                backdropFilter: 'blur(10px)',
            },
            success: {
                iconTheme: {
                    primary: '#4ADE80',
                    secondary: '#0B0F1A',
                },
            },
            error: {
                iconTheme: {
                    primary: '#FF6E84',
                    secondary: '#0B0F1A',
                },
            },
            loading: {
                iconTheme: {
                    primary: '#9333EA',
                    secondary: '#0B0F1A',
                },
            }
        }}
    />
  );
};

export const toastPending = (msg) => toast.loading(msg, { id: 'tx-pending' });
export const toastSuccess = (msg) => toast.success(msg, { id: 'tx-pending' });
export const toastError = (msg) => toast.error(msg, { id: 'tx-pending' });
export const toastTx = (txHash) => toast.success(
    <div className="flex flex-col">
        <span className="font-display font-bold">Transaction Confirmed</span>
        <a 
          href={`https://mumbai.polygonscan.com/tx/${txHash}`} 
          target="_blank" rel="noreferrer" 
          className="text-[10px] font-bold text-primary hover:text-primary-dim underline mt-1 tracking-widest uppercase"
        >
            View on PolygonScan
        </a>
    </div>, 
    { id: 'tx-pending', duration: 6000 }
);

export default ToastProvider;
