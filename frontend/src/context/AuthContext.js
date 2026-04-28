import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const API = 'http://localhost:5000/api/auth';
const TOKEN_KEY = 'microlend_token';
const USER_KEY  = 'microlend_user';

export const AuthProvider = ({ children }) => {
    const [user, setUser]               = useState(null);
    const [token, setToken]             = useState(null);
    const [isAuthenticated, setIsAuth]  = useState(false);
    const [isLoading, setIsLoading]     = useState(true);

    // On mount: restore session from localStorage
    useEffect(() => {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        const savedUser  = localStorage.getItem(USER_KEY);
        if (savedToken && savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setToken(savedToken);
                setUser(parsedUser);
                setIsAuth(true);
                // Silently validate token with server
                axios.get(`${API}/me`, { headers: { Authorization: `Bearer ${savedToken}` } })
                    .then(res => {
                        setUser(res.data);
                        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
                    })
                    .catch(() => _clearSession());
            } catch {
                _clearSession();
            }
        }
        setIsLoading(false);
    }, []);

    const _saveSession = (token, user) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setToken(token);
        setUser(user);
        setIsAuth(true);
    };

    const _clearSession = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
        setIsAuth(false);
    };

    // ── Email / Password Registration ──────────────────────────────────────────
    const register = async (formData) => {
        const res = await axios.post(`${API}/register`, formData);
        _saveSession(res.data.token, res.data.user);
        return res.data;
    };

    // ── Email / Password Login ─────────────────────────────────────────────────
    const login = async (email, password) => {
        const res = await axios.post(`${API}/login`, { email, password });
        _saveSession(res.data.token, res.data.user);
        return res.data;
    };

    // ── Simulated Google Login ─────────────────────────────────────────────────
    const googleLogin = async (mockGoogleData, role = null) => {
        const payload = { ...mockGoogleData };
        if (role) payload.role = role;
        const res = await axios.post(`${API}/google`, payload);
        _saveSession(res.data.token, res.data.user);
        return res.data;
    };

    // ── MetaMask Wallet Login ──────────────────────────────────────────────────
    const walletLogin = async (walletData) => {
        const res = await axios.post(`${API}/wallet`, walletData);
        _saveSession(res.data.token, res.data.user);
        return res.data;
    };

    // ── Logout ─────────────────────────────────────────────────────────────────
    const logout = useCallback(() => {
        _clearSession();
    }, []);

    // ── Auth header helper for API calls ──────────────────────────────────────
    const authHeader = () => token ? { Authorization: `Bearer ${token}` } : {};

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            isLoading,
            register,
            login,
            googleLogin,
            walletLogin,
            logout,
            authHeader
        }}>
            {children}
        </AuthContext.Provider>
    );
};
