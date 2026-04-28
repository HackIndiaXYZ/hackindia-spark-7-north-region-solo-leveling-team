import React, { createContext, useContext, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contractABI';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState('0.0');
  const [isConnected, setIsConnected] = useState(false);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('microlend_user_role') || null;
  });

  const switchToMumbai = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13881' }], // Mumbai
      });
      setIsWrongNetwork(false);
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x13881',
                chainName: 'Polygon Mumbai',
                rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                blockExplorerUrls: ['https://mumbai.polygonscan.com'],
              },
            ],
          });
          setIsWrongNetwork(false);
        } catch (addError) {
          console.error('Failed to add network', addError);
        }
      }
    }
  };

  const connectWallet = async (role = null) => {
    if (role) {
      setUserRole(role);
      localStorage.setItem('microlend_user_role', role);
    }

    if (isDemoMode) {
      const demoAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
      setWalletAddress(demoAddress);
      setBalance('14.5000');
      setIsConnected(true);
      return demoAddress;
    }

    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const _provider = new BrowserProvider(window.ethereum);
        const { chainId } = await _provider.getNetwork();

        if (chainId !== 80001n) {
          setIsWrongNetwork(true);
          await switchToMumbai();
        }

        const _signer = await _provider.getSigner();
        const _contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, _signer);
        const _balance = await _provider.getBalance(accounts[0]);
        const ethBalance = Number(_balance) / 1e18;

        setProvider(_provider);
        setSigner(_signer);
        setContract(_contract);
        setWalletAddress(accounts[0]);
        setBalance(parseFloat(ethBalance).toFixed(4));
        setIsConnected(true);
        return accounts[0];
      } catch (error) {
        console.error("Connection failed", error);
        return null;
      }
    } else {
      alert("Please install MetaMask!");
      return null;
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
    setBalance('0.0');
    setProvider(null);
    setSigner(null);
    setContract(null);
    setUserRole(null);
    localStorage.removeItem('microlend_user_role');
  };

  const toggleDemoMode = () => {
    setIsDemoMode(prev => !prev);
    disconnectWallet();
  };

  return (
    <Web3Context.Provider
      value={{
        walletAddress,
        contract,
        provider,
        signer,
        balance,
        isConnected,
        isWrongNetwork,
        isDemoMode,
        userRole,
        connectWallet,
        switchToMumbai,
        disconnectWallet,
        toggleDemoMode
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
