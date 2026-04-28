import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Apply from './pages/Apply';
import LenderDashboard from './pages/LenderDashboard';
import BorrowerDashboard from './pages/BorrowerDashboard';
import Login from './pages/Login';
import LenderProfile from './pages/LenderProfile';
import BorrowerProfile from './pages/BorrowerProfile';
import Analytics from './pages/Analytics';
import AboutUs from './pages/AboutUs';
import ToastProvider from './components/ToastProvider';
import { CurrencyProvider } from './context/CurrencyContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <div className="App min-h-screen text-white bg-gray-950">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              {/* ── PUBLIC ROUTES ─────────────────────────────────────── */}
              <Route path="/"         element={<Home />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/about"    element={<AboutUs />} />
              <Route path="/analytics" element={<Analytics />} />

              {/* ── PROTECTED ROUTES ──────────────────────────────────── */}
              <Route path="/apply" element={
                <ProtectedRoute><Apply /></ProtectedRoute>
              } />
              <Route path="/lend" element={
                <ProtectedRoute><LenderDashboard /></ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute><BorrowerDashboard /></ProtectedRoute>
              } />
              <Route path="/profile/lender" element={
                <ProtectedRoute><LenderProfile /></ProtectedRoute>
              } />
              <Route path="/profile/borrower" element={
                <ProtectedRoute><BorrowerProfile /></ProtectedRoute>
              } />
            </Routes>
          </div>
          <ToastProvider />
        </div>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
