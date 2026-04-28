# ⚡ MicroLend: The Precision Lending Protocol

MicroLend is an AI-powered DeFi micro-lending platform designed for unbanked individuals in India (gig workers, farmers, small vendors). By leveraging alternative data points and on-chain intelligence, we eliminate the need for traditional credit scores (CIBIL) and central banking intermediaries.

## 🔬 The "Precision Lens" Design
MicroLend utilizes a high-end fintech design system called **"Precision Lens"**. 
- **Zero-Line Hierarchy:** Structural boundaries are defined through tonal depth and light rather than rigid borders.
- **Abyss Foundation:** A sophisticated dark mode (#030712) designed for clarity and eye-comfort.
- **Editorial Typography:** Pairing Manrope (Headlines) with Inter (Body) for an authoritative yet technical feel.
- **Ghost Borders:** 15% opacity white boundaries used only for accessibility and high-density data modules.

## 🛠 Tech Stack
- **Frontend:** React.js + TailwindCSS + lucide-react
- **AI Engine:** Google Gemini 1.5 Flash (Alternative Credit Scoring)
- **Web3 Layer:** ethers.js v6 + MetaMask integration
- **Smart Contracts:** Solidity ^0.8.19 (ReentrancyGuard, Checks-Effects-Interactions)
- **Infrastructure:** Hardhat (Deployment & Testing) on Polygon Mumbai

## 🚀 Getting Started

### 1. Root Installation
From the project root:
```bash
npm install
npm run install-all
```

### 2. Environment Configuration
Create a `.env` file in the root based on `.env.example`:
```env
GEMINI_API_KEY=your_key_here
PRIVATE_KEY=your_wallet_private_key
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
```

### 3. Deploy Smart Contracts (Optional)
```bash
npm run contract:deploy
```
This will automatically update the frontend `contractABI.js` with the new address and ABI.

### 4. Run Development Environment
```bash
npm run dev
```
This starts both the React frontend (port 3000) and the Express backend (port 5000) concurrently.

## 🧪 Demo Mode (Critical for Judges)
MicroLend includes a robust **Demo Mode** toggled in the Navbar.
- **No Wallet Required:** Bypasses MetaMask for instant flow testing.
- **Mock Latency:** Simulates realistic blockchain block-confirmation times (1.5s).
- **Gemini Fallback:** Provides realistic credit scoring analysis even if API keys are missing.
- **Pre-filled Ledger:** Automatically populates the lending marketplace with realistic data.

---
**HackIndia Spark 6 - Team MicroLend**
