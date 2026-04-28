/**
 * fallbackChain.js
 * ─────────────────────────────────────────────────────────────
 * 3-Tier LLM Fallback Chain
 *
 * Tier 1 → Gemini 2.5 Flash   (5s timeout)
 * Tier 2 → Groq Llama 70B     (on Gemini failure)
 * Tier 3 → Ollama Llama 3.1   (on Groq failure, localhost:11434)
 * Final  → Rule-based only     (if all 3 fail)
 *
 * IMPORTANT: This module ONLY provides an LLM caller function.
 * The deterministic score is NEVER touched here.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

const https = require('https');
const http  = require('http');

// ─── Config ───────────────────────────────────────────────────────────────────

const GEMINI_TIMEOUT_MS = 5000;
const GROQ_TIMEOUT_MS   = 8000;
const OLLAMA_TIMEOUT_MS = 10000;

// ─── Low-level HTTP helpers ───────────────────────────────────────────────────

/**
 * Make a JSON POST request with a timeout.
 * Returns the parsed response body.
 *
 * @param {object} opts      - { hostname, path, headers, body, timeoutMs, useHttp }
 * @returns {Promise<object>}
 */
function jsonPost({ hostname, path, headers = {}, body, timeoutMs = 8000, useHttp = false }) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const options = {
            hostname,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                ...headers,
            },
        };

        const lib = useHttp ? http : https;
        const req = lib.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(new Error(`Invalid JSON response from ${hostname}`));
                }
            });
        });

        req.setTimeout(timeoutMs, () => {
            req.destroy(new Error(`Request to ${hostname} timed out after ${timeoutMs}ms`));
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

// ─── Tier 1: Gemini 2.5 Flash ────────────────────────────────────────────────

/**
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<string>} - Raw text response
 */
async function callGemini(systemPrompt, userPrompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error('Gemini API key not configured');
    }

    const body = {
        system_instruction: {
            parts: [{ text: systemPrompt }],
        },
        contents: [
            {
                role: 'user',
                parts: [{ text: userPrompt }],
            },
        ],
        generationConfig: {
            temperature: 0.1,       // Low temperature — we want consistent reasoning
            maxOutputTokens: 512,
            responseMimeType: 'application/json',
        },
    };

    const data = await jsonPost({
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        body,
        timeoutMs: GEMINI_TIMEOUT_MS,
    });

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return text;
}

// ─── Tier 2: Groq Llama 70B ──────────────────────────────────────────────────

/**
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<string>}
 */
async function callGroq(systemPrompt, userPrompt) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('Groq API key not configured');

    const body = {
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt   },
        ],
        temperature: 0.1,
        max_tokens: 512,
        response_format: { type: 'json_object' },
    };

    const data = await jsonPost({
        hostname: 'api.groq.com',
        path:     '/openai/v1/chat/completions',
        headers:  { Authorization: `Bearer ${apiKey}` },
        body,
        timeoutMs: GROQ_TIMEOUT_MS,
    });

    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from Groq');
    return text;
}

// ─── Tier 3: Ollama Local ─────────────────────────────────────────────────────

/**
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<string>}
 */
async function callOllama(systemPrompt, userPrompt) {
    const body = {
        model:  'llama3.1',
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        format: 'json',
        options: { temperature: 0.1, num_predict: 512 },
    };

    const data = await jsonPost({
        hostname:  'localhost',
        path:      '/api/generate',
        body,
        timeoutMs: OLLAMA_TIMEOUT_MS,
        useHttp:   true,
    });

    const text = data?.response;
    if (!text) throw new Error('Empty response from Ollama');
    return text;
}

// ─── Fallback Chain Orchestrator ─────────────────────────────────────────────

/**
 * Try each LLM tier in order. Returns an object with:
 * - caller: async (system, user) => string  — the LLM call function
 * - tierUsed: 'gemini'|'groq'|'ollama'|'rule_based'
 *
 * Use this to build a single caller to pass to getAIReasoning().
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<{ text: string, tierUsed: string }>}
 */
async function runFallbackChain(systemPrompt, userPrompt) {
    const tiers = [
        { name: 'gemini', fn: callGemini },
        { name: 'groq',   fn: callGroq   },
        { name: 'ollama', fn: callOllama },
    ];

    for (const tier of tiers) {
        try {
            const text = await tier.fn(systemPrompt, userPrompt);
            return { text, tierUsed: tier.name };
        } catch (err) {
            console.warn(`[FallbackChain] Tier "${tier.name}" failed: ${err.message}`);
        }
    }

    // All 3 failed — signal caller to use rule-based reasoning
    return { text: null, tierUsed: 'rule_based' };
}

/**
 * Build a caller function compatible with getAIReasoning().
 * Wraps the fallback chain and exposes tierUsed via closure.
 *
 * @returns {{ caller: Function, getTierUsed: Function }}
 */
function buildLLMCaller() {
    let _tierUsed = 'rule_based';

    const caller = async (systemPrompt, userPrompt) => {
        const { text, tierUsed } = await runFallbackChain(systemPrompt, userPrompt);
        _tierUsed = tierUsed;
        if (!text) throw new Error('All LLM tiers failed');
        return text;
    };

    const getTierUsed = () => _tierUsed;

    return { caller, getTierUsed };
}

module.exports = { buildLLMCaller, runFallbackChain, callGemini, callGroq, callOllama };
