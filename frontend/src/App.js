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
import ToastProvider from './components/ToastProvider';
import { CurrencyProvider } from './context/CurrencyContext';

function App() {
  return (
    <CurrencyProvider>
      <div className="App min-h-screen text-white bg-gray-950">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/lend" element={<LenderDashboard />} />
            <Route path="/dashboard" element={<BorrowerDashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile/lender" element={<LenderProfile />} />
            <Route path="/profile/borrower" element={<BorrowerProfile />} />
          </Routes>
        </div>
        <ToastProvider />
      </div>
    </CurrencyProvider>
  );
}

export default App;
