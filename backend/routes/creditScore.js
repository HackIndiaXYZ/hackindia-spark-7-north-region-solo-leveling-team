const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake_key');

router.post('/', async (req, res) => {
    const { 
        income, employmentType, existingDebt, loanPurpose,
        repaymentHistory, utilityPayments, yearsAtAddress 
    } = req.body;

    const systemPrompt = `You are a financial credit scoring AI specializing in alternative credit
   assessment for unbanked individuals in India. You evaluate creditworthiness
   using non-traditional data points instead of formal credit history.
   Analyze the provided data and return ONLY a valid JSON object with no
   additional text, markdown, or explanation. The JSON must have exactly
   these fields:
   {
     "score": <integer between 300 and 900>,
     "risk": <"low" | "medium" | "high">,
     "approved": <true if score >= 600, else false>,
     "reason": <string, 2-3 sentences explaining the score in simple English>,
     "maxLoanAmount": <recommended max loan in ETH, between 0.001 and 1.0>,
     "suggestedRate": <interest rate percentage, always 8>
   }`;

    const userPrompt = `Income: ₹${income}/month, Employment: ${employmentType},
   Existing Debt: ${existingDebt}, Loan Purpose: ${loanPurpose},
   Past Repayment: ${repaymentHistory}, Utility Bills: ${utilityPayments},
   Residential Stability: ${yearsAtAddress} years at current address.
   Generate a credit score.`;

    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("No Gemini API Key provided");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent([systemPrompt, userPrompt]);
        const response = await result.response;
        let rawContent = response.text();
        
        // Clean up markdown code blocks if present
        rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

        const scoreData = JSON.parse(rawContent);
        res.json(scoreData);
    } catch (error) {
        console.error("Gemini Fallback Triggered:", error.message);
        // Demo mode fallback
        const mockScore = {
            score: 742,
            risk: "low",
            approved: true,
            reason: "Strong gig income with consistent utility payments. Residential stability and clear loan purpose indicate low risk. Recommended for approval.",
            maxLoanAmount: 0.5,
            suggestedRate: 8
        };
        res.json(mockScore);
    }
});

module.exports = router;
