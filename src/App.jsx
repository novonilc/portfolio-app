import React, { useState, useEffect, useRef } from "react";
import portfolioIdeas from "./data/recommendations.json";
import marketPulseData from "./data/marketPulse.json";
import stockUniverseData from "./data/stockUniverse.json";
const RECOMMENDATIONS = portfolioIdeas.recommendations;

// ═══════════════════════════════════════════════════════════════════════════
// LICENSE CONFIGURATION
// Two tiers:
//   Basic ($49 CAD/yr) — all portfolio features, no AI
//   Pro   ($99 CAD/yr) — all features + AI (Market Pulse, Suggestions, Options AI, Broker Import)
//
// Tier detection uses product_id (reliable) — variant names don't matter.
// Steps:
//   1. Create TWO products in Lemon Squeezy with separate product IDs
//   2. Paste each checkout URL below
//   3. Paste each numeric Product ID below (find in LS dashboard › Products)
// ═══════════════════════════════════════════════════════════════════════════
const LS_CHECKOUT_BASIC  = "https://portfolio-manager-for-canada.lemonsqueezy.com/checkout/buy/7e425f04-17a0-42c2-8232-dce156391ccf";
const LS_CHECKOUT_PRO    = "https://portfolio-manager-for-canada.lemonsqueezy.com/checkout/buy/bf976ea6-2417-4a1f-9cfb-86cc6873ff08";
const LS_PRODUCT_ID_PRO  = 1087809; // Pro product ID — from LS dashboard › Products
const LS_PRODUCT_ID_BASIC = 1088288;      // TODO: paste Basic product ID here once created in LS

// Reads the active license tier from localStorage ("basic" | "pro")
// On localhost only, ?tier=basic or ?tier=pro in the URL overrides — lets you test both UIs
// without needing a real Lemon Squeezy key.
function getLicenseTier() {
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (isLocal) {
    const urlTier = new URLSearchParams(window.location.search).get("tier");
    if (urlTier === "basic" || urlTier === "pro") return urlTier;
  }
  try {
    const lic = JSON.parse(localStorage.getItem("portfolio:license") || "null");
    if (!lic) return "pro"; // no license = dev bypass mode
    if (!lic.tier) return "pro"; // pre-tier activation = original Pro plan, keep Pro
    return lic.tier; // "basic" or "pro"
  } catch { return "pro"; }
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL PORTFOLIO DATA
// ═══════════════════════════════════════════════════════════════════════════
const INITIAL_TFSA = [
  { ticker:"NVDA", name:"Nvidia",                  current:4947, target:14, divYield:0,   locked:"✅ Keep", notes:"No dividend — pure growth compounder. Perfect in TFSA." },
  { ticker:"AMZN", name:"Amazon",                  current:1388, target:10, divYield:0,   locked:"✅ Keep", notes:"No dividend — 100% tax-free growth in TFSA." },
  { ticker:"NOW",  name:"ServiceNow",              current:3971, target:10, divYield:0,   locked:"✅ Keep", notes:"No dividend — AI enterprise software leader." },
  { ticker:"GOOG", name:"Alphabet",                current:3144, target:7,  divYield:0.5, locked:"✅ Keep", notes:"Tiny dividend (acceptable drag). AI + Search moat." },
  { ticker:"PLTR", name:"Palantir",                current:1425, target:8,  divYield:0,   locked:"✅ Keep", notes:"No dividend — high-conviction AI defense play." },
  { ticker:"MU",   name:"Micron Technology",       current:2803, target:8,  divYield:0.5, locked:"✅ Keep", notes:"Tiny dividend. AI memory monopoly." },
  { ticker:"CNQ",  name:"Cdn Natural Resources",   current:3174, target:10, divYield:4.5, locked:"✅ Keep", notes:"Canadian dividend — full tax credit in TFSA." },
  { ticker:"XIU",  name:"iShares S&P/TSX 60",      current:1885, target:8,  divYield:2.8, locked:"✅ Keep", notes:"Canadian ETF — no WHT. Core Canadian exposure." },
  { ticker:"BTCC", name:"Purpose Bitcoin ETF",     current:1387, target:5,  divYield:0,   locked:"✅ Keep", notes:"CAD-listed, crypto exposure capped at 5%." },
  { ticker:"GOLD", name:"Physically Backed Gold",  current:1308, target:5,  divYield:0,   locked:"✅ Keep", notes:"Inflation hedge. CAD-denominated." },
  { ticker:"VFV.TO",name:"Vanguard S&P 500 (CAD)", current:0,   target:15, divYield:1.3, locked:"🆕 NEW",  notes:"NEW. Replaces MSFT/AAPL/META/TSM/ADI/THE moved to RRSP." },
  { ticker:"MSFT", name:"Microsoft",               current:4260, target:0,  divYield:0.8, locked:"❌ SELL", notes:"MOVE TO RRSP — 0.8% dividend leaks 15% WHT." },
  { ticker:"AAPL", name:"Apple",                   current:3636, target:0,  divYield:0.5, locked:"❌ SELL", notes:"MOVE TO RRSP — save withholding on dividends." },
  { ticker:"META", name:"Meta Platforms",          current:2224, target:0,  divYield:0.4, locked:"❌ SELL", notes:"MOVE TO RRSP — dividend growing." },
  { ticker:"TSM",  name:"Taiwan Semiconductor",    current:4178, target:0,  divYield:1.5, locked:"❌ SELL", notes:"MOVE TO RRSP — 1.5% dividend = highest drag." },
  { ticker:"ADI",  name:"Analog Devices",          current:1274, target:0,  divYield:1.8, locked:"❌ SELL", notes:"MOVE TO RRSP — highest yield in TFSA." },
  { ticker:"THE",  name:"TD Intl Equity ETF",      current:2668, target:0,  divYield:2.0, locked:"❌ SELL", notes:"Consolidate — replace with VFV.TO." },
];

const INITIAL_RRSP = [
  { ticker:"QQQM", name:"Invesco Nasdaq 100 ETF",  current:500,  target:15, divYield:0.6, locked:"✅ Keep",        notes:"Keep existing. U.S.-listed = 0% WHT." },
  { ticker:"SPDR", name:"SPDR S&P 500 (VOO)",      current:300,  target:0,  divYield:1.3, locked:"❌ SELL",        notes:"Consolidate into VTI for broader exposure." },
  { ticker:"VXUS", name:"Vanguard Total Intl",     current:200,  target:5,  divYield:3.0, locked:"✅ Keep",        notes:"Keep existing. International diversification." },
  { ticker:"VTI",  name:"Vanguard Total US Market",current:0,    target:30, divYield:1.3, locked:"🆕 NEW",         notes:"NEW core ETF. 0% WHT in RRSP. MER 0.03%." },
  { ticker:"MSFT", name:"Microsoft",               current:0,    target:8,  divYield:0.8, locked:"🆕 FROM TFSA",   notes:"Transfer from TFSA. No WHT here." },
  { ticker:"AAPL", name:"Apple",                   current:0,    target:6,  divYield:0.5, locked:"🆕 FROM TFSA",   notes:"Transfer from TFSA." },
  { ticker:"TSM",  name:"Taiwan Semiconductor",    current:0,    target:7,  divYield:1.5, locked:"🆕 FROM TFSA",   notes:"Transfer from TFSA — biggest WHT saver." },
  { ticker:"META", name:"Meta Platforms",          current:0,    target:5,  divYield:0.4, locked:"🆕 FROM TFSA",   notes:"Transfer from TFSA." },
  { ticker:"ADI",  name:"Analog Devices",          current:0,    target:4,  divYield:1.8, locked:"🆕 FROM TFSA",   notes:"Transfer from TFSA." },
  { ticker:"LLY",  name:"Eli Lilly",               current:0,    target:10, divYield:0.7, locked:"🆕 NEW",         notes:"NEW. GLP-1 + Alzheimer's. 20-year healthcare play." },
  { ticker:"AVGO", name:"Broadcom",                current:0,    target:10, divYield:1.2, locked:"🆕 NEW",         notes:"NEW. Custom AI chips. Revenue doubling YoY." },
];

// ═══════════════════════════════════════════════════════════════════════════
// RECOMMENDATIONS — imported from src/data/recommendations.json (see top)
// To update monthly: edit that JSON file, no changes to this file needed.
// ═══════════════════════════════════════════════════════════════════════════
// Sector gap detection — which categories are missing from the portfolio
const SECTOR_TICKERS = {
  financials:    ["JPM","GS","BAC","BRK.B","V","MA","AXP","TD","RY","BNS","BMO","CM"],
  healthcare:    ["LLY","NVO","UNH","ISRG","JNJ","ABBV","MRK","PFE","AMGN","IDXX"],
  defense:       ["RTX","LMT","NOC","GD","AXON","HII","GE","CAT","DE"],
  consumer:      ["COST","WMT","AMZN","TGT","HD","PG","KO","MCD","SBUX","NKE"],
  // International exposure via US-listed stocks of foreign companies (no ETFs)
  international: ["NVO","TSM","ASML","SHOP","ATD","BAM","TFII","CP.TO","CNR.TO"],
  // Real estate via individual REITs only (no ETF wrappers)
  "real estate": ["O","SPG","PLD","AMT","WELL","PSA","EXR"],
  "energy infra":["ENB","TRP","PPL","KMI"],
  "oil & gas":   ["SU.TO","SU","CNQ","CVX","XOM","COP","EOG","CVE","MEG","OXY"],
};

function detectGaps(tfsa, rrsp) {
  const allTickers = new Set([...tfsa, ...rrsp].map(h => h.ticker));
  return Object.entries(SECTOR_TICKERS)
    .filter(([, tickers]) => !tickers.some(t => allTickers.has(t)))
    .map(([sector]) => sector);
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CAGR ESTIMATES — used when a holding has no custom cagr set
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_CAGR = {
  // Technology
  NVDA:18, AMZN:15, NOW:16, GOOG:12, PLTR:18, MU:15, MSFT:13, AAPL:11,
  META:14, TSM:14, ADI:12, AVGO:16, ARM:18, AMD:15, QCOM:10, CRWD:22,
  MRVL:18, ANET:20, PANW:18, ORCL:12, ASML:15,
  // Financials
  "BRK.B":10, V:14, MA:14, AXP:14, JPM:10, BAC:9, GS:11, SCHW:14,
  BLK:12, MSCI:16, PYPL:10, KKR:16,
  // Healthcare
  LLY:18, ISRG:15, NVO:13, JNJ:8, ABBV:8, UNH:12, MRK:8, AMGN:10, IDXX:14,
  // Consumer
  COST:12, WMT:10, KO:7, PG:8, MCD:10, SBUX:10, NKE:11, HD:9, NFLX:18,
  // Energy & Industrials
  ENB:8, RTX:12, LMT:11, NOC:10, GE:20, HON:9, AXON:20, CAT:11, DE:10,
  ITW:10, TDG:13, XOM:7, CVX:7, OXY:10, COP:9, "SU.TO":9,
  // Canadian
  SHOP:15, CNQ:8, RY:9, TD:8, BMO:8, CM:8, BNS:7, MFC:10, SLF:10,
  ATD:14, BAM:15, TFII:14,
};

// ═══════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════
const BLANK_FORM = { ticker:"", name:"", current:"", costBasis:"", target:"", divYield:"", cagr:"", currencyOverride:"", notes:"" };
const CONTRIB_FREQUENCY_OPTIONS = [
  { value:"weekly",   label:"Weekly",   periodsPerYear:52, cadenceWeeks:1, shortLabel:"wk" },
  { value:"biweekly", label:"Bi-weekly", periodsPerYear:26, cadenceWeeks:2, shortLabel:"2wk" },
  { value:"monthly",  label:"Monthly",  periodsPerYear:12, cadenceWeeks:4, shortLabel:"mo" },
];
const DEFAULT_CONTRIB_PLAN = { amount:0, frequency:"monthly" };
const CSV_HEADER_ALIASES = {
  ticker: ["ticker", "symbol"],
  name: ["name", "company", "companyname"],
  current: ["current", "current$", "currentvalue", "marketvalue", "value"],
  costBasis: ["costbasis", "cost_basis", "avgcost", "averagecost", "bookvalue", "invested"],
  target: ["target", "target%", "targetpct", "allocation", "weight"],
  divYield: ["divyield", "dividend", "dividendyield", "yield", "yield%"],
  cagr: ["cagr", "growth", "growthrate", "estcagr"],
  currencyOverride: ["currency", "ccy"],
  notes: ["notes", "note", "thesis"],
  account: ["account", "portfolio", "bucket"],
};

// Canadian-listed tickers exempt from US withholding tax
const CAD_EXEMPT = new Set(["CNQ","XIU","VFV.TO","BTCC","GOLD","ZAG.TO","XRE.TO","XEG.TO","XIU.TO","ZCN.TO"]);

// ── AI Advisor prompt templates ────────────────────────────────────────────────
const AI_ADVISOR_TEMPLATES = [
  {
    id: 0, icon: "📈", color: "#22d3ee",
    title: "Market Analysis",
    desc: "Identify emerging patterns and investment opportunities in a sector or stock",
    fields: [{ key: "focus", label: "Sector or Stock", placeholder: "e.g. Semiconductors, NVDA, Canadian Banks" }],
    buildPrompt: (f, ctx) =>
      `You are a senior equity analyst providing research for a Canadian investor.\n\n${ctx}\n\nAnalyze the current trends in the stock market, focusing on ${f.focus}. Identify any emerging patterns and suggest possible investment opportunities. Take into account the latest earnings reports, macro environment, and sector-specific news in your analysis. Structure your response with: (1) Current Trend, (2) Emerging Patterns, (3) Investment Opportunities, (4) Key Risks to watch.`,
  },
  {
    id: 1, icon: "🎯", color: "#a78bfa",
    title: "Portfolio Diversification",
    desc: "Strategies to diversify your portfolio and minimise concentration risk",
    fields: [{ key: "focus", label: "Sectors or Stocks to Evaluate", placeholder: "e.g. Technology, Financials, NVDA, CNQ" }],
    buildPrompt: (f, ctx) =>
      `You are a portfolio strategist for a Canadian investor.\n\n${ctx}\n\nGiven this portfolio with concentration in ${f.focus}, suggest strategies to diversify further and minimize risk. Include: (1) Concentration risks identified, (2) Sectors to explore, (3) Specific stocks or instruments to consider, (4) Target allocation adjustments, (5) Canadian tax-efficiency considerations (TFSA vs RRSP placement).`,
  },
  {
    id: 2, icon: "🛡", color: "#f97316",
    title: "Risk Management",
    desc: "Stop-loss, position sizing, and drawdown protection techniques",
    fields: [{ key: "focus", label: "Trading Strategy or Stocks", placeholder: "e.g. growth stocks, NVDA + TSM, covered calls" }],
    buildPrompt: (f, ctx) =>
      `You are a risk management specialist advising a Canadian retail investor.\n\n${ctx}\n\nAnalyze effective risk management techniques for the following strategy/positions: ${f.focus}. Provide detailed examples of how to implement: (1) Stop-loss orders and trailing stops, (2) Diversification rules, (3) Position sizing (percentage of portfolio per position), (4) Portfolio-level drawdown limits, (5) Hedging strategies using options if applicable. Tailor advice to a Canadian registered account context (TFSA/RRSP constraints).`,
  },
  {
    id: 3, icon: "📊", color: "#34d399",
    title: "Technical Analysis",
    desc: "Price action, moving averages, RSI and buy/sell/hold recommendations",
    fields: [{ key: "tickers", label: "Stocks to Analyze", placeholder: "e.g. NVDA, AAPL, CNQ.TO" }],
    buildPrompt: (f, ctx) =>
      `You are a technical analyst evaluating stocks for a Canadian investor.\n\n${ctx}\n\nUsing technical analysis principles, evaluate the stocks: ${f.tickers}. For each stock analyze: (1) Recent price trend and momentum, (2) Key support and resistance levels, (3) Volume patterns and what they signal, (4) Moving averages (50-day, 200-day) — golden/death cross status, (5) RSI (overbought/oversold), (6) MACD signal, (7) Final recommendation: Buy / Accumulate / Hold / Reduce / Sell — with a suggested entry zone and stop-loss level.`,
  },
  {
    id: 4, icon: "🌐", color: "#60a5fa",
    title: "Economic Indicators",
    desc: "How GDP, inflation, unemployment, and rates affect your stocks",
    fields: [{ key: "focus", label: "Sector or Stocks", placeholder: "e.g. Canadian Banks, REITs, Energy stocks" }],
    buildPrompt: (f, ctx) =>
      `You are a macro economist advising a Canadian investor.\n\n${ctx}\n\nExplain how current economic indicators — including GDP growth, unemployment, CPI inflation, Bank of Canada and Fed interest rate policy, and currency (CAD/USD) — influence stock market performance. Then provide specific analysis of how these indicators affect ${f.focus}. Include: (1) Current macro environment summary, (2) Impact on the specified sector/stocks, (3) Key indicators to monitor in the next 3–6 months, (4) How investors can position portfolios given these conditions.`,
  },
  {
    id: 5, icon: "💎", color: "#fbbf24",
    title: "Value Investing",
    desc: "Identify undervalued stocks using fundamental valuation principles",
    fields: [{ key: "focus", label: "Stocks or Companies to Evaluate", placeholder: "e.g. INTC, NKE, Canadian banks" }],
    buildPrompt: (f, ctx) =>
      `You are a value investor in the tradition of Graham and Buffett, advising a Canadian investor.\n\n${ctx}\n\nDescribe the principles of value investing and identify whether ${f.focus} represent undervalued opportunities today. For each, analyze: (1) P/E vs. sector peers, (2) P/B and EV/EBITDA, (3) Free cash flow yield, (4) Balance sheet quality (debt/equity), (5) Competitive moat assessment, (6) Margin of safety at current price, (7) Verdict: undervalued, fairly valued, or overvalued — and a target price range.`,
  },
  {
    id: 6, icon: "🧠", color: "#e879f9",
    title: "Market Sentiment",
    desc: "Assess investor sentiment and how to trade it for a stock or sector",
    fields: [{ key: "focus", label: "Stock or Sector", placeholder: "e.g. AI stocks, Canadian Energy, PLTR" }],
    buildPrompt: (f, ctx) =>
      `You are a behavioural finance specialist advising a Canadian investor.\n\n${ctx}\n\nAnalyze how market sentiment currently influences ${f.focus}. Cover: (1) Current sentiment reading (fear/greed, bullish/bearish — with evidence), (2) Put/call ratios, short interest, analyst consensus shifts, (3) Social/media momentum signals, (4) How sentiment diverges from fundamentals (if it does), (5) Contrarian opportunity or momentum-following strategy, (6) Specific entry/exit signals based on sentiment extremes.`,
  },
  {
    id: 7, icon: "📋", color: "#f43f5e",
    title: "Earnings Report Analysis",
    desc: "Interpret key metrics from earnings and predict price impact",
    fields: [
      { key: "company", label: "Company / Ticker", placeholder: "e.g. NVDA, Apple, Shopify" },
      { key: "highlights", label: "Key Results (optional)", placeholder: "e.g. EPS beat $0.89 vs $0.81 est, revenue $26B, guidance raised" },
    ],
    buildPrompt: (f, ctx) =>
      `You are a sell-side equity analyst reviewing an earnings report for a Canadian investor.\n\n${ctx}\n\nExplain how to interpret ${f.company}'s results report${f.highlights ? `, focusing on these highlights: ${f.highlights}` : ""}. Cover: (1) Revenue growth vs. expectations and year-over-year, (2) EPS (GAAP vs. adjusted) and beat/miss magnitude, (3) Gross margin and operating margin trends, (4) Forward guidance vs. analyst consensus, (5) Balance sheet highlights (cash, debt, buybacks), (6) Management commentary and tone, (7) Expected stock price reaction and whether the move is justified, (8) Revised price target or investment thesis update.`,
  },
  {
    id: 8, icon: "⚖️", color: "#94a3b8",
    title: "Growth vs Dividend Stocks",
    desc: "Compare growth and dividend strategies with your actual holdings",
    fields: [{ key: "focus", label: "Specific Stocks to Compare", placeholder: "e.g. NVDA vs ENB, AMZN vs TD" }],
    buildPrompt: (f, ctx) =>
      `You are a portfolio strategist advising a Canadian investor on income vs. growth allocation.\n\n${ctx}\n\nCompare and contrast growth stocks and dividend stocks, using ${f.focus} as specific examples. Cover: (1) Total return potential over 5–10 years for each, (2) Dividend reinvestment (DRIP) compounding math, (3) Tax efficiency in TFSA vs. RRSP for each type (IRS withholding on US dividends), (4) Volatility and drawdown characteristics, (5) Which is better suited for: accumulation phase vs. near-retirement, (6) Recommended blend for this investor's profile and timeline.`,
  },
  {
    id: 9, icon: "🌍", color: "#fb923c",
    title: "Geopolitical & World Events",
    desc: "Analyse major events impact on markets and how to protect your portfolio",
    fields: [{ key: "event", label: "Event or Theme", placeholder: "e.g. US-China trade war, oil price shock, rate hikes, pandemic" },
             { key: "focus", label: "Sector or Stock Impacted", placeholder: "e.g. Canadian Energy, semiconductors, NVDA" }],
    buildPrompt: (f, ctx) =>
      `You are a geopolitical risk analyst advising a Canadian investor.\n\n${ctx}\n\nAnalyze the impact of ${f.event} on the stock market, specifically examining the effect on ${f.focus}. Structure your analysis as: (1) Event summary and timeline, (2) Transmission mechanism (how this event flows through to stock prices), (3) Sector/stock specific impact — winners and losers, (4) Historical precedent from similar events, (5) Portfolio protection strategies (defensive positioning, hedges, safe havens), (6) Opportunity: which sectors or stocks benefit from this disruption, (7) Monitoring signals — what to watch that signals escalation vs. resolution.`,
  },
];

const ADVISOR_INDUSTRIES = [
  { id: "technology",  label: "Technology",  icon: "💻", color: "#22d3ee" },
  { id: "financials",  label: "Financials",  icon: "🏦", color: "#fbbf24" },
  { id: "energy",      label: "Energy",      icon: "⚡", color: "#f97316" },
  { id: "healthcare",  label: "Healthcare",  icon: "💊", color: "#34d399" },
  { id: "consumer",    label: "Consumer",    icon: "🛒", color: "#a78bfa" },
  { id: "industrials", label: "Industrials", icon: "🏭", color: "#94a3b8" },
  { id: "real_estate", label: "Real Estate", icon: "🏢", color: "#fb923c" },
  { id: "materials",   label: "Materials",   icon: "⛏",  color: "#60a5fa" },
  { id: "utilities",   label: "Utilities",   icon: "🔌", color: "#e879f9" },
  { id: "telecom",     label: "Telecom",     icon: "📡", color: "#f43f5e" },
  { id: "crypto",      label: "Crypto",      icon: "₿",  color: "#fbbf24" },
];

// ── Monthly AI budget tracker ─────────────────────────────────────────────────
const MONTHLY_AI_BUDGET = 10.00; // USD hard cap per calendar month

const AI_MODEL_COSTS = {
  "claude-sonnet-4-6":         { input: 3.00 / 1e6, output: 15.00 / 1e6 },
  "claude-haiku-4-5-20251001": { input: 0.80 / 1e6, output:  4.00 / 1e6 },
};

function aiUsageKey() {
  const d = new Date();
  return `portfolio:aiUsage:${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}`;
}
function getAiMonthlySpend() {
  try { return parseFloat(localStorage.getItem(aiUsageKey()) || "0") || 0; } catch { return 0; }
}
function recordAiSpend(inputTokens, outputTokens, model) {
  const costs = AI_MODEL_COSTS[model] || AI_MODEL_COSTS["claude-sonnet-4-6"];
  const delta = inputTokens * costs.input + outputTokens * costs.output;
  const next = getAiMonthlySpend() + delta;
  try { localStorage.setItem(aiUsageKey(), next.toFixed(6)); } catch {}
  return next;
}

// Normalise Wealthsimple CSV "Account Type" values → short portfolio names
function normalizeWsAccountName(raw = "") {
  const s = raw.trim().toLowerCase();
  if (s === "tfsa" || s.includes("tax-free")) return "TFSA";
  if (s === "rrsp" || s.includes("retirement savings")) return "RRSP";
  if (s === "resp" || s.includes("education")) return "RESP";
  if (s.includes("crypto")) return "Crypto";
  if (s.includes("non-registered") || s === "individual" || s === "personal") return "Non-Reg";
  if (s.includes("locked-in") || s === "lira") return "LIRA";
  if (s.includes("rrif")) return "RRIF";
  // Fallback: uppercase + collapse spaces
  return raw.trim().replace(/\s+/g, "-").toUpperCase().slice(0, 12);
}

function getTickerCurrency(ticker, currencyOverride = "") {
  if (currencyOverride === "CAD" || currencyOverride === "USD") return currencyOverride;
  return (ticker.endsWith(".TO") || CAD_EXEMPT.has(ticker)) ? "CAD" : "USD";
}

function getExchange(ticker, currencyOverride = "") {
  return getTickerCurrency(ticker, currencyOverride) === "CAD" ? "TSX" : "NYSE";
}

function fmtAmt(amount, ticker, currencyOverride = "") {
  const sym = getTickerCurrency(ticker, currencyOverride) === "CAD" ? "C$" : "US$";
  return `${sym}${Math.round(amount).toLocaleString()}`;
}

// Per-portfolio accent colors — TFSA/RRSP fixed, extras cycle
const PORTFOLIO_COLORS = {
  TFSA: { accent:"#fbbf24", rgb:"251,191,36" },
  RRSP: { accent:"#22d3ee", rgb:"34,211,238" },
};
const EXTRA_COLORS = [
  { accent:"#a78bfa", rgb:"167,139,250" },
  { accent:"#34d399", rgb:"52,211,153"  },
  { accent:"#fb923c", rgb:"251,146,60"  },
  { accent:"#f472b6", rgb:"244,114,182" },
  { accent:"#60a5fa", rgb:"96,165,250"  },
];

// Quick ticker lookup for search tab
const TICKER_DB = Object.fromEntries(RECOMMENDATIONS.map(r => [r.ticker, r]));

// ─── Spread Scanner — ticker universe & technical indicator helpers ───────────

const SPREAD_SCAN_TICKERS = [
  // Mega-cap tech
  "AAPL","MSFT","NVDA","AMD","META","GOOGL","AMZN","TSLA","PLTR","ARM",
  // Cloud / SaaS
  "SNOW","DDOG","CRWD","ZS","NET","MDB","TEAM",
  // Semiconductors
  "AVGO","QCOM","MU","SMCI","AMAT","LRCX",
  // Financials
  "JPM","BAC","GS","V","BRK.B","SCHW","MS","C",
  // Healthcare & Pharma
  "LLY","JNJ","ISRG","NVO","UNH","MRNA","ABBV",
  // Energy
  "XOM","CVX","CNQ","OXY",
  // Defense / Industrial
  "RTX","AXON","GE","BA",
  // Consumer & Retail
  "COST","SHOP","NFLX","SBUX","HD","NKE",
  // Fintech & Payments
  "SQ","PYPL","HOOD",
  // EV & Mobility
  "RIVN","F","GM",
  // High-beta / speculative
  "SOFI","COIN","MARA",
  // ETFs (most liquid spread vehicles)
  "SPY","QQQ","IWM","XLF","XLE","XLK","GLD","XBI",
];

function _ssEMA(values, period) {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const out = new Array(values.length).fill(null);
  out[period - 1] = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) out[i] = values[i] * k + out[i - 1] * (1 - k);
  return out;
}
function _ssRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let ag = 0, al = 0;
  for (let i = 1; i <= period; i++) { const d = closes[i] - closes[i - 1]; if (d > 0) ag += d; else al -= d; }
  ag /= period; al /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = (ag * (period - 1) + Math.max(d, 0)) / period;
    al = (al * (period - 1) + Math.max(-d, 0)) / period;
  }
  return al === 0 ? 100 : parseFloat((100 - 100 / (1 + ag / al)).toFixed(1));
}
function _ssMACD(closes, fast = 12, slow = 26, sig = 9) {
  if (closes.length < slow + sig) return null;
  const ef = _ssEMA(closes, fast), es = _ssEMA(closes, slow);
  const ml = closes.map((_, i) => ef[i] != null && es[i] != null ? ef[i] - es[i] : null).filter(v => v != null);
  if (ml.length < sig) return null;
  const se = _ssEMA(ml, sig);
  const lm = ml[ml.length - 1], ls = se[se.length - 1];
  return { macd: parseFloat(lm.toFixed(3)), signal: parseFloat(ls.toFixed(3)), histogram: parseFloat((lm - ls).toFixed(3)) };
}
function _ssSMA(closes, period) {
  if (closes.length < period) return null;
  return parseFloat((closes.slice(-period).reduce((a, b) => a + b, 0) / period).toFixed(2));
}
function _ssVWAP(highs, lows, closes, volumes, period = 20) {
  const n = Math.min(period, closes.length);
  let sumPV = 0, sumV = 0;
  for (let i = closes.length - n; i < closes.length; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3;
    sumPV += tp * volumes[i]; sumV += volumes[i];
  }
  return sumV > 0 ? parseFloat((sumPV / sumV).toFixed(2)) : null;
}
// ATR (14-period Wilder smoothing) — returns { atr, atrPct }
function _ssATR(highs, lows, closes, period = 14) {
  if (closes.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < closes.length; i++) {
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1])));
  }
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) atr = (atr * (period - 1) + trs[i]) / period;
  const price = closes[closes.length - 1];
  return { atr: parseFloat(atr.toFixed(3)), atrPct: parseFloat((atr / price * 100).toFixed(2)) };
}
// Historical Volatility (20-day, annualised %) from log returns
function _ssHV(closes, period = 20) {
  if (closes.length < period + 2) return null;
  const lr = [];
  for (let i = 1; i < closes.length; i++) if (closes[i-1] > 0) lr.push(Math.log(closes[i] / closes[i-1]));
  const rec = lr.slice(-period);
  const mean = rec.reduce((a, b) => a + b, 0) / rec.length;
  const variance = rec.reduce((s, r) => s + (r - mean) ** 2, 0) / (rec.length - 1);
  return parseFloat((Math.sqrt(variance * 252) * 100).toFixed(1));
}
// Bollinger Band position (0 = at lower band, 1 = at upper band)
function _ssBBPos(closes, period = 20) {
  if (closes.length < period) return null;
  const sl = closes.slice(-period);
  const mean = sl.reduce((a, b) => a + b, 0) / period;
  const std  = Math.sqrt(sl.reduce((s, c) => s + (c - mean) ** 2, 0) / period);
  if (std === 0) return 0.5;
  const pos = (closes[closes.length - 1] - (mean - 2 * std)) / (4 * std);
  return parseFloat(Math.max(0, Math.min(1, pos)).toFixed(2));
}
// HV Rank (IV Rank proxy) — mirrors computeHVRank in refresh-csp-cc-picks.js
function _ssHVRank(closes, period = 20) {
  if (closes.length < period + 2 + 60) return null;
  const lr = [];
  for (let i = 1; i < closes.length; i++) if (closes[i-1] > 0) lr.push(Math.log(closes[i] / closes[i-1]));
  const hvHistory = [];
  for (let i = period; i <= lr.length; i++) {
    const rec = lr.slice(i - period, i);
    const mean = rec.reduce((a, b) => a + b, 0) / rec.length;
    const variance = rec.reduce((s, r) => s + (r - mean) ** 2, 0) / (rec.length - 1);
    hvHistory.push(Math.sqrt(variance * 252) * 100);
  }
  if (hvHistory.length < 2) return null;
  const history = hvHistory.slice(-252);
  const hvLow = Math.min(...history), hvHigh = Math.max(...history);
  if (hvHigh === hvLow) return 50;
  const rank = (history[history.length - 1] - hvLow) / (hvHigh - hvLow) * 100;
  return parseFloat(Math.max(0, Math.min(100, rank)).toFixed(1));
}
function _ssCspScore({ rsi, macd, price, sma50, sma200, vwap, volumeRatio, atrPct, hvPct, hvRank, bbPos }) {
  let score = 35; const signals = [];
  if (rsi != null) {
    if      (rsi >= 40 && rsi <= 62)  { score += 15; signals.push(`RSI ${rsi}`); }
    else if (rsi >  62 && rsi <= 72)  { score += 8;  signals.push(`RSI ${rsi} (stretched)`); }
    else if (rsi >= 35 && rsi <  40)  { score += 4;  signals.push(`RSI ${rsi} (pullback)`); }
    else if (rsi < 35)                { score -= 15; }
    else if (rsi > 75)                { score -= 8; }
  }
  if (sma50 != null) { if (price > sma50) { score += 12; signals.push("Above SMA50"); } else score -= 5; }
  if (sma50 != null && sma200 != null && sma50 > sma200) { score += 8; signals.push("Golden cross"); }
  if (bbPos != null) {
    if      (bbPos < 0.30) { score += 10; signals.push("Near support"); }
    else if (bbPos < 0.50)   score += 5;
    else if (bbPos > 0.85)   score -= 8;
  }
  if (hvRank != null) {
    if      (hvRank >= 60 && hvRank <= 82) { score += 16; signals.push(`IVR ${Math.round(hvRank)}%`); }
    else if (hvRank >= 45 && hvRank <  60) { score += 10; signals.push(`IVR ${Math.round(hvRank)}%`); }
    else if (hvRank >  82)                 { score += 4;  signals.push(`IVR ${Math.round(hvRank)}% (high)`); }
    else if (hvRank >= 30 && hvRank <  45)   score += 4;
    else                                     score -= 10;
  }
  if (hvPct != null) { if (hvPct >= 18 && hvPct <= 50) score += 5; else if (hvPct > 55) score -= 6; else if (hvPct < 14) score -= 4; }
  if      (volumeRatio >= 1.5) { score += 8; signals.push("High volume"); }
  else if (volumeRatio >= 1.0)   score += 4;
  else if (volumeRatio < 0.6)    score -= 6;
  if (atrPct != null) { if (atrPct < 2.0) { score += 6; signals.push("Stable range"); } else if (atrPct < 3.0) score += 3; else if (atrPct > 4.5) score -= 8; }
  if (macd?.histogram != null && macd.histogram > 0) { score += 6; signals.push("Momentum up"); }
  if (vwap != null && Math.abs((price - vwap) / vwap) < 0.015) { score += 4; signals.push("Near VWAP"); }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const rating = score >= 72 ? "Strong" : score >= 58 ? "Good" : score >= 44 ? "Fair" : "Skip";
  return { cspScore: score, cspSignals: signals.slice(0, 4), cspRating: rating };
}
function _ssCcScore({ rsi, macd, price, sma50, sma200, vwap, volumeRatio, atrPct, hvPct, hvRank, bbPos }) {
  let score = 35; const signals = [];
  if (rsi != null) {
    if      (rsi >= 58 && rsi <= 75)  { score += 18; signals.push(`RSI ${rsi} (extended)`); }
    else if (rsi >= 50 && rsi <  58)  { score += 10; signals.push(`RSI ${rsi} (neutral)`); }
    else if (rsi >  75 && rsi <= 85)  { score += 5;  signals.push(`RSI ${rsi} (overbought)`); }
    else if (rsi < 44)                  score -= 10;
  }
  if (sma50 != null && price > sma50) { score += 10; signals.push("Above SMA50"); }
  if (sma50 != null && sma200 != null && sma50 > sma200) { score += 8; signals.push("Uptrend intact"); }
  if (bbPos != null) {
    if      (bbPos > 0.80) { score += 17; signals.push("Near upper BB"); }
    else if (bbPos > 0.65) { score += 12; signals.push("Upper BB zone"); }
    else if (bbPos > 0.50)   score += 5;
    else if (bbPos < 0.30)   score -= 8;
  }
  if (hvRank != null) {
    if      (hvRank >= 70) { score += 18; signals.push(`IVR ${Math.round(hvRank)}%`); }
    else if (hvRank >= 50) { score += 12; signals.push(`IVR ${Math.round(hvRank)}%`); }
    else if (hvRank >= 35) { score += 6;  signals.push(`IVR ${Math.round(hvRank)}%`); }
    else if (hvRank >= 20)   score += 2;
    else                     score -= 8;
  }
  if (hvPct != null) { if (hvPct >= 18 && hvPct <= 55) score += 5; else if (hvPct < 14) score -= 4; else if (hvPct > 60) score -= 3; }
  if      (volumeRatio >= 1.5) { score += 8; signals.push("High volume"); }
  else if (volumeRatio >= 1.0)   score += 4;
  else if (volumeRatio < 0.6)    score -= 6;
  if (atrPct != null) { if (atrPct >= 1.5 && atrPct <= 3.5) { score += 5; signals.push("Good range"); } else if (atrPct > 5.0) score -= 5; }
  if (macd?.histogram != null && macd.histogram > 0) { score += 5; signals.push("MACD positive"); }
  if (vwap != null && price > vwap) { const pct = (price - vwap) / vwap; if (pct > 0.02) { score += 5; signals.push("Above VWAP"); } else if (pct > 0) score += 3; }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const rating = score >= 72 ? "Strong" : score >= 58 ? "Good" : score >= 44 ? "Fair" : "Skip";
  return { ccScore: score, ccSignals: signals.slice(0, 4), ccRating: rating };
}
function _ssScore({ rsi, macd, price, sma50, sma200, vwap, volumeRatio, atrPct, hvPct, bbPos }) {
  let score = 40, bull = 0, bear = 0;
  if      (volumeRatio >= 2.0) { score += 20; bull++; bear++; }
  else if (volumeRatio >= 1.5) { score += 14; bull++; bear++; }
  else if (volumeRatio >= 1.0) { score += 8; }
  else if (volumeRatio <  0.6) { score -= 12; }
  if (rsi != null) {
    if      (rsi >= 35 && rsi <= 65) score += 18;
    else if (rsi >= 28 && rsi <  35) score += 8;
    else if (rsi >  65 && rsi <= 73) score += 8;
    else score -= 12;
    if (rsi >= 52) bull += 2; else bear += 2;
  }
  if (macd?.histogram != null) {
    score += Math.min(12, Math.round(Math.abs(macd.histogram) / (price * 0.003) * 6));
    if (macd.histogram > 0) { bull += 3; } else { bear += 3; }
    if (macd.macd > macd.signal && macd.macd > 0) bull++;
    if (macd.macd < macd.signal && macd.macd < 0) bear++;
  }
  if (sma50 != null) { score += 6; if ((price - sma50) / sma50 > 0.02) bull += 2; else if ((price - sma50) / sma50 < -0.02) bear += 2; }
  if (sma50 != null && sma200 != null) { if (sma50 > sma200) { score += 10; bull += 2; } else { score += 4; bear += 2; } }
  if (vwap != null) {
    const pct = Math.abs((price - vwap) / vwap);
    if (pct <= 0.015) score += 10; else if (pct <= 0.04) score += 5;
    if (price > vwap) bull++; else bear++;
  }
  // ATR% — lower is better for premium selling (tighter, more predictable range)
  if (atrPct != null) {
    if      (atrPct < 1.5) score += 8;
    else if (atrPct < 2.5) score += 4;
    else if (atrPct < 3.5) score += 1;
    else if (atrPct > 5.0) score -= 12;
    else if (atrPct > 4.0) score -= 6;
  }
  // HV20 — 18–45% is the sweet spot: enough premium, not chaotic
  if (hvPct != null) {
    if (hvPct >= 18 && hvPct <= 45) score += 5;
    else if (hvPct > 55)            score -= 5;
  }
  // Bollinger Band position — middle range suits IC; extremes give directional edge
  if (bbPos != null) {
    if      (bbPos >= 0.25 && bbPos <= 0.75) { score += 6; }
    else if (bbPos < 0.20) { score += 4; bull += 2; }
    else if (bbPos > 0.80) { score += 4; bear += 2; }
    else                   { score += 2; }
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  let direction = "neutral";
  if (bull >= bear + 3) direction = "bullish";
  else if (bear >= bull + 3) direction = "bearish";
  let recommendation, recommendationColor;
  if      (score >= 65 && direction === "bullish") { recommendation = "Bull Put Spread";  recommendationColor = "#22c55e"; }
  else if (score >= 65 && direction === "bearish") { recommendation = "Bear Call Spread"; recommendationColor = "#ef4444"; }
  else if (score >= 65)                            { recommendation = "Iron Condor";      recommendationColor = "#a78bfa"; }
  else if (score >= 48)                            { recommendation = "Caution";          recommendationColor = "#fbbf24"; }
  else                                             { recommendation = "Skip";             recommendationColor = "rgba(255,255,255,0.3)"; }
  return { score, direction, recommendation, recommendationColor, bull, bear };
}

// ─── Exact trade constructor ───────────────────────────────────────────────
// Returns a trade setup object for actionable cards, or null for Caution/Skip.
function buildTradeSetup(s) {
  const { price, recommendation, sma50, sma200, vwap, hvPct } = s;
  if (!price || recommendation === "Caution" || recommendation === "Skip") return null;

  const roundStrike = (v) => {
    if (price < 10)  return Math.round(v * 2) / 2;
    if (price < 100) return Math.round(v);
    if (price < 300) return Math.round(v / 5) * 5;
    return Math.round(v / 10) * 10;
  };

  const width = price < 10  ? 0.5
              : price < 30  ? 1
              : price < 75  ? 2.5
              : price < 200 ? 5
              : price < 500 ? 10
              : 25;

  // BSM-based credit estimation using HV20 as IV proxy (IV ≈ HV × 1.25)
  // Uses the same simplified Black-Scholes approximation as estimatePremium()
  const ivDecimal = Math.min(Math.max(((hvPct || 30) * 1.25) / 100, 0.12), 1.20);
  const DTE = 35;
  const atmBase = price * ivDecimal * Math.sqrt(DTE / 365) * 0.4;
  const legPremium = (strike) =>
    parseFloat(Math.max(0, atmBase * Math.exp(-3.8 * Math.abs(price - strike) / price)).toFixed(2));

  // Clamp credit to a sane 10%–50% of width (avoids extreme outliers)
  const clampCredit = (c) => parseFloat(Math.min(width * 0.50, Math.max(width * 0.10, c)).toFixed(2));

  const expTarget = new Date();
  expTarget.setDate(expTarget.getDate() + 35);
  const expiryStr = expTarget.toLocaleDateString("en-US", { month:"short", day:"numeric" });
  const fmt = (v) => v.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 });

  if (recommendation === "Bull Put Spread") {
    const support  = Math.min(sma50 || price, vwap || price);
    const shortPut = roundStrike(Math.min(price * 0.97, support * 1.005));
    const longPut  = roundStrike(shortPut - width);
    const credit   = clampCredit(legPremium(shortPut) - legPremium(longPut));
    const maxLoss  = parseFloat((width - credit).toFixed(2));
    const beNum    = parseFloat((shortPut - credit).toFixed(2));
    const anchor   = sma50 ? `SMA50 $${fmt(sma50)}` : vwap ? `VWAP $${fmt(vwap)}` : null;
    return {
      type: "bull_put",
      legs: [
        { action:"SELL", contract:`$${fmt(shortPut)} Put`, role:"short" },
        { action:"BUY",  contract:`$${fmt(longPut)}  Put`, role:"long"  },
      ],
      width: `$${width}`,
      creditEst: credit, maxLoss,
      maxGain: credit,
      creditPerContract: Math.round(credit * 100),
      maxLossPerContract: Math.round(maxLoss * 100),
      breakEven: `$${fmt(beNum)}`,
      breakEvenNums: [beNum],
      strikesRaw: { longPut, shortPut },
      expiry: `~35 DTE · target ${expiryStr}`,
      rationale: anchor ? `Short put anchored near support (${anchor})` : "Short put 3% below current price",
    };
  }

  if (recommendation === "Bear Call Spread") {
    const resistance = Math.max(sma50 || price, vwap || price);
    const shortCall  = roundStrike(Math.max(price * 1.03, resistance * 0.995));
    const longCall   = roundStrike(shortCall + width);
    const credit     = clampCredit(legPremium(shortCall) - legPremium(longCall));
    const maxLoss    = parseFloat((width - credit).toFixed(2));
    const beNum      = parseFloat((shortCall + credit).toFixed(2));
    const anchor     = sma50 ? `SMA50 $${fmt(sma50)}` : vwap ? `VWAP $${fmt(vwap)}` : null;
    return {
      type: "bear_call",
      legs: [
        { action:"SELL", contract:`$${fmt(shortCall)} Call`, role:"short" },
        { action:"BUY",  contract:`$${fmt(longCall)}  Call`, role:"long"  },
      ],
      width: `$${width}`,
      creditEst: credit, maxLoss,
      maxGain: credit,
      creditPerContract: Math.round(credit * 100),
      maxLossPerContract: Math.round(maxLoss * 100),
      breakEven: `$${fmt(beNum)}`,
      breakEvenNums: [beNum],
      strikesRaw: { shortCall, longCall },
      expiry: `~35 DTE · target ${expiryStr}`,
      rationale: anchor ? `Short call anchored near resistance (${anchor})` : "Short call 3% above current price",
    };
  }

  if (recommendation === "Iron Condor") {
    const support    = sma50 ? Math.min(sma50, price * 0.97) : price * 0.96;
    const resistance = sma200 ? Math.max(sma200, price * 1.03) : sma50 ? price * 1.04 : price * 1.04;
    const shortPut   = roundStrike(Math.min(price * 0.96, support * 1.005));
    const longPut    = roundStrike(shortPut - width);
    const shortCall  = roundStrike(Math.max(price * 1.04, resistance * 0.995));
    const longCall   = roundStrike(shortCall + width);
    const putCredit  = clampCredit(legPremium(shortPut)  - legPremium(longPut));
    const callCredit = clampCredit(legPremium(shortCall) - legPremium(longCall));
    const totalCredit = parseFloat((putCredit + callCredit).toFixed(2));
    // Max loss: worst wing loss minus total credit received from BOTH wings
    const maxLoss    = parseFloat((width - totalCredit).toFixed(2));
    const beLow      = parseFloat((shortPut  - totalCredit).toFixed(2));
    const beHigh     = parseFloat((shortCall + totalCredit).toFixed(2));
    return {
      type: "iron_condor",
      legs: [
        { action:"SELL", contract:`$${fmt(shortPut)}  Put`,  role:"short" },
        { action:"BUY",  contract:`$${fmt(longPut)}   Put`,  role:"long"  },
        { action:"SELL", contract:`$${fmt(shortCall)} Call`, role:"short" },
        { action:"BUY",  contract:`$${fmt(longCall)}  Call`, role:"long"  },
      ],
      width: `$${width} each wing`,
      creditEst: totalCredit, maxLoss,
      maxGain: totalCredit,
      creditPerContract: Math.round(totalCredit * 100),
      maxLossPerContract: Math.round(maxLoss * 100),
      breakEven: `$${fmt(beLow)} – $${fmt(beHigh)}`,
      breakEvenNums: [beLow, beHigh],
      strikesRaw: { longPut, shortPut, shortCall, longCall },
      expiry: `~35 DTE · target ${expiryStr}`,
      rationale: "Price in neutral zone — sell both wings for premium",
    };
  }

  return null;
}

// Options constants
const SECTOR_IV_MULT = {
  "Semiconductor":3.0, "Technology":2.4, "Aerospace/Defense":1.6,
  "Healthcare":1.7, "Financials":1.3, "Energy":2.0, "Payments":1.6,
  "Consumer Staples":1.1, "Consumer Cyclical":1.9, "Industrials":1.6,
  "Real Estate":1.5, "Utilities":1.2,
};
const OPT_EXPIRIES = [
  { label:"21 DTE",  days:21 },
  { label:"30 DTE",  days:30 },
  { label:"45 DTE",  days:45 },
];
const OPT_STATUS_LABELS = {
  open:"Open", expired:"Expired worthless",
  assigned:"Assigned", closed_profit:"Closed — profit", closed_loss:"Closed — loss",
};
const DEFAULT_OPT_TRADE = {
  type:"cc", ticker:"", account:"TFSA", contracts:1,
  strike:"", expiry:"", premium:"", underlyingPrice:"", notes:"",
};

// ═══════════════════════════════════════════════════════════════════════════
// LICENSE GATE — shown when no valid license is stored in localStorage
// ═══════════════════════════════════════════════════════════════════════════
export function LicenseGate({ onActivate }) {
  const [key,     setKey]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  async function activate() {
    const trimmed = key.trim();
    if (!trimmed) { setError("Please enter your license key."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          license_key: trimmed,
          instance_name: "Portfolio Rebalancer — " + navigator.userAgent.slice(0, 50),
        }),
      });
      const data = await res.json();
      if (data.activated) {
        const productId  = data.meta?.product_id;
        // Detect tier by product ID — reliable regardless of variant name.
        // "Basic" = key belongs to the Basic product; anything else = Pro.
        const tier = (LS_PRODUCT_ID_BASIC && productId === LS_PRODUCT_ID_BASIC)
          ? "basic"
          : "pro";
        // eslint-disable-next-line no-console
        console.info("[License] product_id:", productId, "→ tier:", tier);
        const record = {
          key: trimmed,
          activatedAt: new Date().toISOString(),
          instanceId: data.instance?.id || "",
          email: data.meta?.customer_email || "",
          tier,
        };
        localStorage.setItem("portfolio:license", JSON.stringify(record));
        setSuccess(true);
        setTimeout(() => onActivate(record), 1200);
      } else {
        const msg = data.error || "license_key_invalid";
        if (msg.includes("activation_limit"))
          setError("This key has reached its activation limit. Each key activates on up to 3 devices — contact support if you need a reset.");
        else
          setError("Invalid license key. Check for typos or contact support if you need help.");
      }
    } catch {
      setError("Could not reach the license server. Check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const card = { background:"#0d1526", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"40px 36px", width:"100%", maxWidth:480 };
  const inp  = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#f1f5f9", padding:"11px 14px", borderRadius:10, fontSize:14, fontFamily:"'JetBrains Mono',monospace", width:"100%", marginBottom:10 };
  const btnS = (active) => ({ padding:"12px 20px", borderRadius:10, border:"none", cursor: active ? "pointer":"not-allowed", fontWeight:700, fontSize:14, fontFamily:"inherit", width:"100%", background: active ? "#fbbf24":"rgba(255,255,255,0.08)", color: active ? "#0d1117":"#64748b", transition:"all 0.2s" });

  return (
    <div style={{ minHeight:"100vh", background:"#060b18", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'DM Sans',system-ui,sans-serif", color:"#f1f5f9" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:32 }}>
        <div style={{ width:10, height:10, borderRadius:"50%", background:"#fbbf24" }}></div>
        <span style={{ fontSize:18, fontWeight:800 }}>Portfolio Rebalancer Pro</span>
      </div>

      <div style={card}>
        {success ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>License activated!</div>
            <div style={{ fontSize:14, color:"#94a3b8" }}>Loading your portfolio…</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Activate your license</div>
            <div style={{ fontSize:14, color:"#94a3b8", marginBottom:28, lineHeight:1.6 }}>
              Enter the license key from your purchase confirmation email to unlock Portfolio Rebalancer Pro.
            </div>

            <label style={{ fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:6 }}>License key</label>
            <input
              style={inp}
              type="text"
              placeholder="PFRA-XXXX-XXXX-XXXX"
              value={key}
              onChange={e => { setKey(e.target.value); setError(null); }}
              onKeyDown={e => e.key === "Enter" && activate()}
            />

            {error && (
              <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#fca5a5", marginBottom:12, lineHeight:1.6 }}>
                ⚠ {error}
              </div>
            )}

            <button style={btnS(!loading && key.trim().length > 0)} onClick={activate} disabled={loading || !key.trim()}>
              {loading ? "Activating…" : "Activate License →"}
            </button>

            <div style={{ margin:"20px 0", height:1, background:"rgba(255,255,255,0.06)" }}></div>

            <div>
              <div style={{ fontSize:13, color:"#64748b", marginBottom:14, textAlign:"center" }}>Don't have a license yet? Choose a plan:</div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                {/* Basic plan */}
                <a href={LS_CHECKOUT_BASIC} target="_blank" rel="noreferrer"
                  style={{ flex:1, minWidth:140, display:"flex", flexDirection:"column", gap:6,
                    padding:"16px", borderRadius:12, textDecoration:"none",
                    background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
                    color:"#f1f5f9", transition:"all 0.2s" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em" }}>Basic</div>
                  <div style={{ fontSize:22, fontWeight:800 }}>$49 <span style={{ fontSize:13, fontWeight:400, color:"#64748b" }}>CAD/yr</span></div>
                  <div style={{ fontSize:11, color:"#64748b", lineHeight:1.5 }}>All portfolio tools<br/>No AI features</div>
                  <div style={{ marginTop:6, fontSize:12, fontWeight:700, color:"#94a3b8", textAlign:"center", padding:"8px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)" }}>Subscribe →</div>
                </a>
                {/* Pro plan */}
                <a href={LS_CHECKOUT_PRO} target="_blank" rel="noreferrer"
                  style={{ flex:1, minWidth:140, display:"flex", flexDirection:"column", gap:6,
                    padding:"16px", borderRadius:12, textDecoration:"none",
                    background:"rgba(34,197,94,0.07)", border:"1px solid rgba(34,197,94,0.35)",
                    color:"#f1f5f9", transition:"all 0.2s", position:"relative" }}>
                  <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:"#22c55e", color:"#0d1117", fontSize:10, fontWeight:800, padding:"2px 12px", borderRadius:99, whiteSpace:"nowrap" }}>RECOMMENDED</div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#22c55e", textTransform:"uppercase", letterSpacing:"0.07em" }}>Pro</div>
                  <div style={{ fontSize:22, fontWeight:800 }}>$99 <span style={{ fontSize:13, fontWeight:400, color:"#64748b" }}>CAD/yr</span></div>
                  <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.5 }}>All portfolio tools<br/>+ Claude AI (10 calls/day)</div>
                  <div style={{ marginTop:6, fontSize:12, fontWeight:700, color:"#0d1117", textAlign:"center", padding:"8px", borderRadius:8, background:"linear-gradient(135deg,#22c55e,#16a34a)" }}>Subscribe →</div>
                </a>
              </div>
              <div style={{ fontSize:11, color:"#334155", marginTop:10, textAlign:"center" }}>
                Secure checkout · License key by email · Cancel anytime
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop:20, fontSize:12, color:"#334155", textAlign:"center", maxWidth:400 }}>
        Already purchased? Check your email for a message from Lemon Squeezy with your key.
        If you need help, reply to that email.
      </div>
    </div>
  );
}

function DonutChart({ segments, size = 110, thickness = 16, centerLabel, centerSub }) {
  const cx = size / 2, cy = size / 2;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let cum = 0;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ display:"block" }}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={thickness}/>
        {segments.filter(s => s.pct > 0.5).map((seg, i) => {
          const dash = (seg.pct / 100) * circ;
          const dashOffset = -(cum / 100) * circ;
          cum += seg.pct;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={thickness - 2}
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
      </svg>
      {(centerLabel !== undefined || centerSub !== undefined) && (
        <div style={{
          position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", textAlign:"center", pointerEvents:"none"
        }}>
          {centerLabel !== undefined && (
            <div style={{ fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
              color:"#f1f5f9", lineHeight:1.2 }}>
              {centerLabel}
            </div>
          )}
          {centerSub !== undefined && (
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.38)", marginTop:2 }}>{centerSub}</div>
          )}
        </div>
      )}
    </div>
  );
}

const PIE_COLORS = [
  "#fbbf24","#22d3ee","#a78bfa","#34d399","#f87171",
  "#60a5fa","#fb923c","#f472b6","#4ade80","#818cf8",
  "#facc15","#2dd4bf","#c084fc","#86efac","#fca5a5","#93c5fd",
];

function PieChart({ slices, size = 150 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 3;
  let cum = -Math.PI / 2;
  const paths = [];
  for (const s of slices.filter(s => s.pct > 0.3)) {
    const angle = (s.pct / 100) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cum);
    const y1 = cy + r * Math.sin(cum);
    cum += angle;
    const x2 = cx + r * Math.cos(cum);
    const y2 = cy + r * Math.sin(cum);
    const d = `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r},0,${angle > Math.PI ? 1 : 0},1,${x2.toFixed(2)},${y2.toFixed(2)} Z`;
    paths.push({ ...s, d });
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ display:"block", flexShrink:0 }}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color}
          stroke="rgba(15,23,42,0.6)" strokeWidth={1.5}/>
      ))}
    </svg>
  );
}

function sortRows(arr, col, dir, getter) {
  if (!col) return arr;
  return [...arr].sort((a, b) => {
    const av = getter(a, col);
    const bv = getter(b, col);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
    return dir === "asc" ? cmp : -cmp;
  });
}

function SortTh({ col, label, sort, onSort, style, className }) {
  const active = sort.col === col;
  return (
    <th
      className={className}
      onClick={() => onSort(col)}
      style={{ cursor: "pointer", userSelect: "none", ...style }}
    >
      {label}
      <span style={{ marginLeft: 3, fontSize: 8, opacity: active ? 1 : 0.25 }}>
        {active ? (sort.dir === "asc" ? "▲" : "▼") : "▲▼"}
      </span>
    </th>
  );
}

// ─── Stock Scanner ────────────────────────────────────────────────────────────
const SCAN_PRESET_FILTERS = {
  all:        { maxPe:120, maxPeg:5,   minRoe:0,  maxDe:5,   minDivY:0, minFcfY:0, minEpsG:0, minGrossMargin:0,  market:"all", sector:"all", mktCap:"all",       ideasOnly:false },
  buffett:    { maxPe:22,  maxPeg:5,   minRoe:15, maxDe:1.0, minDivY:0, minFcfY:0, minEpsG:5, minGrossMargin:30, market:"all", sector:"all", mktCap:"all",       ideasOnly:false },
  garp:       { maxPe:55,  maxPeg:1.5, minRoe:15, maxDe:5,   minDivY:0, minFcfY:0, minEpsG:15,minGrossMargin:40, market:"all", sector:"all", mktCap:"all",       ideasOnly:false },
  income:     { maxPe:22,  maxPeg:5,   minRoe:0,  maxDe:5,   minDivY:3, minFcfY:0, minEpsG:3, minGrossMargin:0,  market:"all", sector:"all", mktCap:"all",       ideasOnly:false },
  deep:       { maxPe:13,  maxPeg:5,   minRoe:0,  maxDe:5,   minDivY:0, minFcfY:5, minEpsG:0, minGrossMargin:0,  market:"all", sector:"all", mktCap:"all",       ideasOnly:false },
  compounder: { maxPe:45,  maxPeg:5,   minRoe:25, maxDe:0.7, minDivY:0, minFcfY:0, minEpsG:8, minGrossMargin:40, market:"all", sector:"all", mktCap:"all",       ideasOnly:false },
  midsmall:   { maxPe:120, maxPeg:5,   minRoe:0,  maxDe:5,   minDivY:0, minFcfY:0, minEpsG:0, minGrossMargin:0,  market:"all", sector:"all", mktCap:"mid-small", ideasOnly:false },
  ideas:      { maxPe:120, maxPeg:5,   minRoe:0,  maxDe:5,   minDivY:0, minFcfY:0, minEpsG:0, minGrossMargin:0,  market:"all", sector:"all", mktCap:"all",       ideasOnly:true  },
  canadian:   { maxPe:18,  maxPeg:5,   minRoe:0,  maxDe:5,   minDivY:3, minFcfY:0, minEpsG:0, minGrossMargin:0,  market:"CA",  sector:"all", mktCap:"all",       ideasOnly:false },
  retire:     { maxPe:120, maxPeg:2.5, minRoe:15, maxDe:5,   minDivY:0, minFcfY:0, minEpsG:12,minGrossMargin:30, market:"all", sector:"all", mktCap:"all",       ideasOnly:false },
};
const SCAN_PRESETS = [
  { key:"all",        icon:"🌐", label:"Show All",       desc:"All stocks, no filter"               },
  { key:"buffett",    icon:"🏛️", label:"Buffett Zone",   desc:"Quality at fair price — Berkshire style" },
  { key:"garp",       icon:"📈", label:"GARP",           desc:"Growth at a reasonable price (PEG < 1.5)" },
  { key:"income",     icon:"💰", label:"Income Quality", desc:"High yield from durable businesses"  },
  { key:"deep",       icon:"🔎", label:"Deep Value",     desc:"Very cheap on P/E & free cash flow"  },
  { key:"compounder", icon:"🚀", label:"Compounders",    desc:"High ROE + low debt = decades of gains" },
  { key:"midsmall",   icon:"🎯", label:"Mid & Small",    desc:"$300M–$10B, often-overlooked gems"   },
  { key:"ideas",      icon:"💡", label:"Ideas Picks",    desc:"Stocks curated in the Ideas tab"     },
  { key:"canadian",   icon:"🍁", label:"Canadian Value", desc:"TSX stocks for TFSA / RRSP"          },
  { key:"retire",     icon:"🏖️", label:"Retire in 10-15yr", desc:"High-growth compounders for a 45yr wealth plan" },
];
function computeScanScore(s) {
  // Null-safe: missing metrics score 0 rather than false-positives from JS null coercion
  let pts = 0;
  // Use forward PEG (fwdPe ÷ epsGrowth) when available — the market prices on forward
  // earnings, so forward PEG is a more accurate valuation signal than trailing PEG.
  // Falls back to stored trailing peg if fwdPe is zero or missing.
  const fwdPeg = (s.fwdPe > 0 && s.epsGrowth > 0) ? s.fwdPe / s.epsGrowth : null;
  const p = fwdPeg ?? s.peg;
  pts += (p != null && p > 0) ? (p<=0.8?25:p<=1.2?20:p<=1.5?14:p<=2.0?8:p<=3.0?3:0) : 0;
  const r = s.roe != null ? Math.min(s.roe, 100) : null;
  pts += r != null ? (r>=40?20:r>=25?16:r>=18?12:r>=12?7:2) : 0;
  if (s.isBank) { pts += 8; } else { const d=s.de; pts += d != null ? (d<0.2?15:d<0.5?12:d<1.0?8:d<1.5?5:d<2.5?2:0) : 0; }
  const f = s.fcfYield;
  pts += f != null ? (f>=8?20:f>=6?16:f>=4?11:f>=2?6:1) : 0;
  const g = s.grossMargin;
  pts += g != null ? (g>=70?10:g>=50?8:g>=35?5:2) : 0;
  const e = s.epsGrowth;
  pts += e>=25?10:e>=15?8:e>=8?5:e>=3?3:0;
  return Math.min(100, pts);
}
// Retirement wealth-building score — weights EPS growth + quality over cheapness
function computeRetireScore(s) {
  let pts = 0;
  // EPS growth is the #1 driver of 10-15yr compounding (35 pts)
  const e = s.epsGrowth;
  pts += e >= 25 ? 35 : e >= 18 ? 28 : e >= 12 ? 20 : e >= 8 ? 10 : e >= 3 ? 4 : 0;
  // ROE — quality of the business (25 pts)
  const r = s.roe != null ? Math.min(s.roe, 100) : null;
  pts += r != null ? (r >= 40 ? 25 : r >= 25 ? 20 : r >= 18 ? 14 : r >= 12 ? 7 : 2) : 0;
  // PEG — not overpaying for growth (20 pts)
  const fwdPeg = (s.fwdPe > 0 && s.epsGrowth > 0) ? s.fwdPe / s.epsGrowth : null;
  const p = fwdPeg ?? s.peg;
  pts += (p != null && p > 0) ? (p <= 1.0 ? 20 : p <= 1.5 ? 15 : p <= 2.0 ? 9 : p <= 2.5 ? 4 : 0) : 0;
  // Gross margin — pricing power / moat durability (12 pts)
  const gm = s.grossMargin;
  pts += gm != null ? (gm >= 70 ? 12 : gm >= 50 ? 9 : gm >= 35 ? 5 : gm >= 20 ? 2 : 0) : 0;
  // FCF yield — real cash generation (8 pts)
  const f = s.fcfYield;
  pts += f != null ? (f >= 6 ? 8 : f >= 4 ? 6 : f >= 2 ? 3 : 1) : 0;
  return Math.min(100, pts);
}
// Estimate realistic long-run CAGR from EPS growth rate × quality factor
function estimateRetireCagr(s) {
  const g    = Math.min(Math.max(s.epsGrowth || 0, 3), 22);
  const roe  = s.roe   || 0;
  const gm   = s.grossMargin || 0;
  const highQ = (roe >= 25 && gm >= 50) || roe >= 60;
  const midQ  = !highQ && ((roe >= 15 && gm >= 30) || roe >= 40);
  return Math.round(g * (highQ ? 1.0 : midQ ? 0.88 : 0.76));
}
function ScanPill({ value, color }) {
  return (
    <span style={{ background:`${color}18`, border:`1px solid ${color}44`, borderRadius:5,
      padding:"2px 8px", fontSize:11, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace",
      display:"inline-block", whiteSpace:"nowrap" }}>
      {value}
    </span>
  );
}
// Fair-price engine ─────────────────────────────────────────────────────────────
// Returns estimated intrinsic value using two methods:
//   Growth stocks  (epsGrowth ≥ 5) : Lynch PEG — Fair PE = growth × targetPEG
//   Income stocks  (divYield > 2%)  : Div-yield normalisation — Fair = div$ / targetYield
// targetPEG rises with quality (ROE + gross margin) to reward durable moats.
function computeScanFairPrice(s) {
  // Prefer forward P/E (next-12m estimates) for a more accurate EPS base.
  const fwdPe = s.fwdPe || s.pe;
  if (!s.price || s.price <= 0 || !fwdPe || fwdPe <= 0) return null;
  const fwdEps = s.price / fwdPe;
  const g      = Math.max(1, Math.min(s.epsGrowth || 0, 50));
  const div    = s.divYield     || 0;
  const roe    = s.roe          || 0;
  const gross  = s.grossMargin  || 0;
  const isBank = s.isBank       || false;

  // Income / yield-based path — only when growth is low AND yield is meaningfully
  // above 2.5%, so that low-yield payers (AAPL 0.5%, MSFT 0.8%) stay on the
  // growth path instead of getting an artificially low yield-anchored fair price.
  if (g <= 8 && div > 2.5) {
    const targetYield = div >= 5    ? 5.0   // high-yield (pipelines, BNS-type)
      : isBank                      ? 3.5   // large-cap banks historically 3–4%
      : roe >= 25                   ? 3.0   // quality Dividend Aristocrat
      : roe >= 15                   ? 3.5   // decent dividend payer
      : 4.5;
    return Math.round(s.price * (div / targetYield) * 100) / 100;
  }

  // Growth / quality path — forward PEG method.
  // Exceptional ROE (≥ 60) flags a capital-light moat regardless of reported gross
  // margin — captures AAPL (roe 145%), LMT, SBUX, HD whose blended margins look
  // low but whose business economics are elite.
  const highQ = (roe >= 25 && gross >= 50) || roe >= 60;
  const midQ  = !highQ && ((roe >= 15 && gross >= 30) || roe >= 40);

  // tPEG = the PEG ratio we're willing to pay for quality. 1.5/1.2/0.9 is
  // more realistic in a higher-rate environment than the older 2.0/1.5/1.1.
  // Cap at 1.5× current fwd P/E (was 2×) so a low-multiple stock can't show
  // >50% upside purely from PE expansion, and hard cap at 50 (was 65).
  const tPEG  = highQ ? 1.5 : midQ ? 1.2 : 0.9;
  const minPE = highQ ? 15  : midQ ? 12  : 8;
  const fairPE = Math.min(Math.max(g * tPEG, minPE), 50, fwdPe * 1.5);
  return Math.round(fwdEps * fairPE * 100) / 100;
}
function computeScanUpside(s) {
  const fair = computeScanFairPrice(s);
  if (!fair || !s.price || s.price <= 0) return null;
  return Math.round((fair - s.price) / s.price * 100);
}
function scanSignal(upside, score) {
  if (upside === null) return null;
  if (upside >= 25 && score >= 60) return { label:"Strong Buy", color:"#22c55e", icon:"⬆" };
  if (upside >= 12 && score >= 48) return { label:"Buy",        color:"#86efac", icon:"↑"  };
  if (upside >= 0  && score >= 38) return { label:"Watch",      color:"#fbbf24", icon:"→"  };
  if (upside < -20)                return { label:"Expensive",  color:"#ef4444", icon:"↓"  };
  return                                  { label:"Hold",       color:"#64748b", icon:"–"  };
}
// ──────────────────────────────────────────────────────────────────────────────

function AppLogo() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="38" rx="10" fill="rgba(251,191,36,0.07)" stroke="rgba(251,191,36,0.22)" strokeWidth="1"/>
      <rect x="6"  y="23" width="5.5" height="9"  rx="1.5" fill="#fbbf24" opacity="0.45"/>
      <rect x="15" y="14" width="5.5" height="18" rx="1.5" fill="#fbbf24" opacity="0.9"/>
      <rect x="24" y="19" width="5.5" height="13" rx="1.5" fill="#fbbf24" opacity="0.6"/>
      <path d="M8.5 21.5 L17.5 12.5 L26.5 17" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="26.5" cy="17" r="2.2" fill="#22d3ee"/>
    </svg>
  );
}

export default function App() {
  const [portfolios,       setPortfolios]      = useState(["TFSA","RRSP"]);
  const [account,          setAccount]         = useState("TFSA");
  const [cashHolding,      setCashHolding]     = useState({ TFSA: 0, RRSP: 0 });
  const [dcaWeeks,         setDcaWeeks]        = useState(20);
  const [holdings,         setHoldings]        = useState({ TFSA: INITIAL_TFSA, RRSP: INITIAL_RRSP });
  const [saveStatus,       setSaveStatus]      = useState("");
  const [backupStatus,     setBackupStatus]    = useState("");
  const [autoSaveAt,       setAutoSaveAt]      = useState(() => localStorage.getItem("portfolio:autosave:ts") || null);
  const autoSaveRef      = useRef(null);
  const cloudSaveRef     = useRef(null);
  const cloudHasDataRef  = useRef(false); // true if cloud load found an existing snapshot
  // Options trading
  const [optionTrades,        setOptionTrades]       = useState([]);
  const [optionPrices,        setOptionPrices]       = useState({});
  const [optionPricesLoading, setOptionPricesLoading]= useState(false);
  const [optionPriceError,    setOptionPriceError]   = useState(null);
  const [optionSubTab,        setOptionSubTab]       = useState("cc");
  const [optionNewTrade,      setOptionNewTrade]     = useState(null);
  const [optionClosing,       setOptionClosing]      = useState(null);
  const [optionWatchlist,     setOptionWatchlist]    = useState(() => JSON.parse(localStorage.getItem("portfolio:options:watchlist") || "[]"));
  const [optionWatchInput,    setOptionWatchInput]   = useState("");
  const [tab,              setTab]             = useState(() => localStorage.getItem("portfolio:helpSeen") ? "dashboard" : "help");
  const [helpUnlocked,     setHelpUnlocked]    = useState(() => !!localStorage.getItem("portfolio:helpSeen"));
  const [helpNudge,        setHelpNudge]       = useState(false);
  function navigateTo(dest) {
    if (dest !== "help") {
      localStorage.setItem("portfolio:helpSeen", "1");
      setHelpUnlocked(true);
    }
    setTab(dest);
  }
  function tryNavigate(dest) {
    if (!helpUnlocked && dest !== "help") {
      setHelpNudge(true);
      setTimeout(() => setHelpNudge(false), 2800);
      return;
    }
    navigateTo(dest);
  }
  const [scanPreset,    setScanPreset]    = useState("all");
  const [scanFilters,   setScanFilters]   = useState({ ...SCAN_PRESET_FILTERS.all });
  const [scanCommitted, setScanCommitted] = useState({ ...SCAN_PRESET_FILTERS.all });
  const [scanDirty,     setScanDirty]     = useState(false);
  const [scanSort,      setScanSort]      = useState({ col:"score", dir:"desc" });
  const [scanExpanded,  setScanExpanded]  = useState(null);
  const [scanSearch,    setScanSearch]    = useState("");
  const [scanMinUpside, setScanMinUpside] = useState(-100);
  const [scanMinScore,  setScanMinScore]  = useState(0);
  const [scanSigFilter, setScanSigFilter] = useState("all");
  const [stockScanResults,  setStockScanResults]  = useState(null);
  const [stockScanProgress, setStockScanProgress] = useState(null);
  const [stockScanError,    setStockScanError]    = useState(null);
  const stockScanAbortRef = useRef(null);
  const [addForm,          setAddForm]         = useState(null);
  const [recFilter,        setRecFilter]       = useState("all");
  const [pendingRemove,    setPendingRemove]   = useState(null);
  const [rebalMode,        setRebalMode]       = useState("cash");
  const [showReset,        setShowReset]       = useState(false);
  const [addPortfolioForm, setAddPortfolioForm]= useState(null);
  const [searchQuery,      setSearchQuery]     = useState("");
  const [searchResult,     setSearchResult]    = useState(null);
  const [contribPlan,      setContribPlan]     = useState({
    TFSA: { ...DEFAULT_CONTRIB_PLAN },
    RRSP: { ...DEFAULT_CONTRIB_PLAN },
  });
  const [usdCadRate,       setUsdCadRate]      = useState(1.38);
  const [targetsFilter,    setTargetsFilter]   = useState("all");
  const [licenseTier,      setLicenseTier]     = useState(() => getLicenseTier());
  const [rebalSort,       setRebalSort]       = useState({ col: null, dir: "asc" });
  const [dcaSort,         setDcaSort]         = useState({ col: null, dir: "asc" });
  const [targetsSort,     setTargetsSort]     = useState({ col: null, dir: "asc" });
  const [ccStrikeSort,    setCcStrikeSort]    = useState({ col: null, dir: "asc" });
  const [cspStrikeSort,   setCspStrikeSort]   = useState({ col: null, dir: "asc" });
  const [openTradeSort,   setOpenTradeSort]   = useState({ col: null, dir: "asc" });
  const [closedTradeSort, setClosedTradeSort] = useState({ col: null, dir: "asc" });
  const [aiSugSort,       setAiSugSort]       = useState({ col: null, dir: "asc" });
  const [noteGenerating,  setNoteGenerating]  = useState(new Set()); // tickers currently auto-generating a note
  const [cloudSyncStatus, setCloudSyncStatus] = useState("idle"); // "idle"|"syncing"|"synced"|"error"
  const [cloudSyncedAt,   setCloudSyncedAt]   = useState(() => localStorage.getItem("portfolio:cloud:ts") || null);
  // Spread scanner signals (loaded from /api/options-signals-load or live scan)
  const [spreadSignals,        setSpreadSignals]        = useState(null);
  const [spreadSignalsLoading, setSpreadSignalsLoading] = useState(false);
  const [spreadSignalsError,   setSpreadSignalsError]   = useState(null);
  const [spreadScanProgress,   setSpreadScanProgress]   = useState(null); // { done, total, ticker } | null
  const [cspCcPicks,           setCspCcPicks]           = useState(null);
  const [cspCcPicksLoading,    setCspCcPicksLoading]    = useState(false);
  const [cspCcScanProgress,    setCspCcScanProgress]    = useState(null); // { done, total, ticker } | null
  const spreadScanAbortRef = useRef(null);

  // Proxy helper — all AI calls route through /api/claude (key never in browser)
  async function callClaude(body) {
    // Pre-call budget gate
    const spent = getAiMonthlySpend();
    if (spent >= MONTHLY_AI_BUDGET) {
      const nextMonth = new Date();
      nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1, 1);
      nextMonth.setUTCHours(0, 0, 0, 0);
      const resetDate = nextMonth.toLocaleDateString("en-CA", { month: "long", day: "numeric" });
      throw new Error(
        `Monthly AI budget of $${MONTHLY_AI_BUDGET.toFixed(2)} reached. Resets on ${resetDate}.`
      );
    }
    const lic = (() => { try { return JSON.parse(localStorage.getItem("portfolio:license") || "null"); } catch { return null; } })();
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(lic?.key ? { "x-license-key": lic.key } : {}) },
      body: JSON.stringify(body),
    });
    const model = body.model || "claude-sonnet-4-6";
    const origJson = res.json.bind(res);
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
      json: async () => {
        const data = await origJson();
        if (res.ok && data?.usage) {
          const newSpend = recordAiSpend(data.usage.input_tokens || 0, data.usage.output_tokens || 0, model);
          setAiMonthlySpend(newSpend);
        }
        return data;
      },
    };
  }
  const [marketPulse,      setMarketPulse]     = useState(() => {
    try {
      const c = localStorage.getItem("pulse:cache");
      if (!c) return marketPulseData;
      const cached = JSON.parse(c);
      // Backfill any fields added after the cache was written (e.g. newsSignals)
      return { ...marketPulseData, ...cached };
    } catch { return marketPulseData; }
  });
  const [pulseLoading,     setPulseLoading]    = useState(false);
  const [pulseError,       setPulseError]      = useState(null);
  const [pulseRefreshedAt, setPulseRefreshedAt]= useState(() => localStorage.getItem("pulse:refreshedAt") || null);
  const [pulseCopyLoading, setPulseCopyLoading]= useState(false);
  const [pulseCopied,      setPulseCopied]     = useState(false);
  const [pulsePasteOpen,   setPulsePasteOpen]  = useState(false);
  const [pulsePasteText,   setPulsePasteText]  = useState("");
  // Quick-trade state for Action Center
  const [pulseTradeOpen,   setPulseTradeOpen]  = useState(null); // actionIdx or null
  const [pulseTradeAcct,   setPulseTradeAcct]  = useState("TFSA");
  const [pulseTradeAmt,    setPulseTradeAmt]   = useState("");
  const [pulseReducePct,   setPulseReducePct]  = useState(25);
  const [pulseTradeLog,    setPulseTradeLog]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("pulse:tradeLog") || "[]"); } catch { return []; }
  });
  const [pulseTradeFlash,  setPulseTradeFlash] = useState(null); // { msg, ok }
  const [pulsePasteError,  setPulsePasteError] = useState(null);
  const [pulseApplyDone,   setPulseApplyDone]  = useState(false);
  const [brokerImportLoading, setBrokerImportLoading] = useState(false);
  const [brokerImportError,   setBrokerImportError]   = useState(null);
  const [brokerImportPreview, setBrokerImportPreview] = useState(null); // { rows, summary }
  const [aiTargetsLoading,    setAiTargetsLoading]    = useState(false);
  const [aiTargetsError,      setAiTargetsError]      = useState(null);
  const [aiTargetsPreview,    setAiTargetsPreview]    = useState(null); // { suggestions, account }
  const [diversifyLoading,    setDiversifyLoading]    = useState(false);
  const [diversifyError,      setDiversifyError]      = useState(null);
  const [diversifySuggestions,setDiversifySuggestions]= useState(() => {
    try { return JSON.parse(localStorage.getItem("diversify:suggestions") || "null"); } catch { return null; }
  });
  const [bnnCalls,            setBnnCalls]            = useState(null);
  const [bnnDayIndex,         setBnnDayIndex]         = useState(0);
  const [aiOptionsLoading,    setAiOptionsLoading]    = useState(false);
  const [aiOptionsError,      setAiOptionsError]      = useState(null);
  const [aiOptionsAnalysis,   setAiOptionsAnalysis]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("options:aiAnalysis") || "null"); } catch { return null; }
  });

  // ── Live prices + contribution room ───────────────────────────────────────
  const [liveHoldingPrices,   setLiveHoldingPrices]   = useState({});
  const [livePrevPrices,      setLivePrevPrices]       = useState({});
  const [livePricesFetching,  setLivePricesFetching]  = useState(false);
  const [livePricesFetchedAt, setLivePricesFetchedAt] = useState(null);
  const [holdingSignals,      setHoldingSignals]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("portfolio:holdingSignals") || "{}"); } catch { return {}; }
  });
  const [holdingSignalsLoading,    setHoldingSignalsLoading]    = useState(false);
  const [holdingSignalsFetchedAt,  setHoldingSignalsFetchedAt]  = useState(
    () => localStorage.getItem("portfolio:holdingSignals:ts") || null
  );
  const [contribRoom,         setContribRoom]         = useState(() => {
    try { return JSON.parse(localStorage.getItem("portfolio:contribRoom") || "{}"); } catch { return {}; }
  });

  // ── Investor profile ───────────────────────────────────────────────────────
  const [investorProfile,   setInvestorProfile]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("portfolio:profile") || "null"); } catch { return null; }
  });
  const [showProfileModal,  setShowProfileModal]  = useState(false);
  const [profileDraft,      setProfileDraft]      = useState(null); // working copy while modal open
  const [showLicenseModal,  setShowLicenseModal]  = useState(false);
  const [licenseModalKey,   setLicenseModalKey]   = useState("");
  const [licenseModalLoading, setLicenseModalLoading] = useState(false);
  const [licenseModalError,  setLicenseModalError]  = useState(null);
  const [licenseModalSuccess, setLicenseModalSuccess] = useState(false);

  // ── CSV import account mapping ─────────────────────────────────────────────
  // { [csvAcctName]: { target: appPortfolioName, mode: "replace"|"merge" } }
  const [brokerImportMapping, setBrokerImportMapping] = useState({});

  // ── AI Advisor ─────────────────────────────────────────────────────────────
  const [advisorTemplateId,  setAdvisorTemplateId]  = useState(null);   // selected template id
  const [advisorInputs,      setAdvisorInputs]      = useState({});      // { fieldKey: value }
  const [advisorResponse,    setAdvisorResponse]    = useState(null);    // string response
  const [advisorLoading,     setAdvisorLoading]     = useState(false);
  const [advisorError,       setAdvisorError]       = useState(null);
  const [advisorIndustry,    setAdvisorIndustry]    = useState([]);      // selected industry ids
  const [aiMonthlySpend,     setAiMonthlySpend]     = useState(() => getAiMonthlySpend());
  const [aiBudgetDismissed,  setAiBudgetDismissed]  = useState(false);
  const [advisorHistory,     setAdvisorHistory]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("portfolio:advisorHistory") || "[]"); } catch { return []; }
  });

  // ── Load from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const listData = localStorage.getItem("portfolio:list");
      const pList = listData ? JSON.parse(listData) : ["TFSA","RRSP"];
      setPortfolios(pList);
      const nextH = { TFSA: INITIAL_TFSA, RRSP: INITIAL_RRSP };
      for (const p of pList) {
        const hData = localStorage.getItem(`portfolio:${p}`);
        if (hData) nextH[p] = JSON.parse(hData);
        else if (!nextH[p]) nextH[p] = [];
      }
      setHoldings(nextH);
      const cashData = localStorage.getItem("portfolio:cash");
      if (cashData) setCashHolding(JSON.parse(cashData));
      const contribData = localStorage.getItem("portfolio:contrib");
      if (contribData) {
        const rawContrib = JSON.parse(contribData);
        const nextContrib = Object.fromEntries(pList.map(p => {
          const existing = rawContrib?.[p];
          if (existing && typeof existing === "object" && !Array.isArray(existing)) {
            const freq = CONTRIB_FREQUENCY_OPTIONS.some(o => o.value === existing.frequency)
              ? existing.frequency
              : "monthly";
            return [p, { amount: Number(existing.amount) || 0, frequency: freq }];
          }
          // Backward-compat for old saves where value was monthly number
          return [p, { amount: Number(existing) || 0, frequency: "monthly" }];
        }));
        setContribPlan(nextContrib);
      }
      const fxData = localStorage.getItem("portfolio:fxRate");
      if (fxData) setUsdCadRate(Number(fxData) || 1.38);
      const optData = localStorage.getItem("portfolio:options");
      if (optData) setOptionTrades(JSON.parse(optData));
    } catch (e) { console.warn("Could not load saved data:", e); }
  }, []);

  // Keep the ref pointing at the latest state on every render — lets the
  // interval fire without needing to re-mount when state changes.
  autoSaveRef.current = () => {
    try {
      const snapshot = JSON.stringify({
        backupVersion: 2,
        exportedAt: new Date().toISOString(),
        portfolios,
        holdings,
        cashHolding,
        contribPlan,
        usdCadRate,
        pulse: { cache: marketPulse, refreshedAt: pulseRefreshedAt },
      });
      localStorage.setItem("portfolio:autosave", snapshot);
      const ts = new Date().toISOString();
      localStorage.setItem("portfolio:autosave:ts", ts);
      setAutoSaveAt(ts);
    } catch (e) { console.warn("Auto-save failed:", e); }
  };

  // Periodic auto-save every 5 minutes
  useEffect(() => {
    const id = setInterval(() => autoSaveRef.current?.(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Debounced auto-save — 10 s after the last meaningful data change
  useEffect(() => {
    const t = setTimeout(() => autoSaveRef.current?.(), 10_000);
    return () => clearTimeout(t);
  }, [holdings, cashHolding, contribPlan, usdCadRate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cloud sync ─────────────────────────────────────────────────────────────
  cloudSaveRef.current = async () => {
    const lic = (() => { try { return JSON.parse(localStorage.getItem("portfolio:license") || "null"); } catch { return null; } })();
    if (!lic?.key) return;
    setCloudSyncStatus("syncing");
    try {
      const saveRes = await fetch("/api/blob-save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-license-key": lic.key },
        body: JSON.stringify({ portfolios, holdings, cashHolding, contribPlan, usdCadRate, optionTrades }),
      });
      if (!saveRes.ok) throw new Error(`blob-save ${saveRes.status}`);
      const ts = new Date().toISOString();
      setCloudSyncedAt(ts);
      localStorage.setItem("portfolio:cloud:ts", ts);
      setCloudSyncStatus("synced");
      setTimeout(() => setCloudSyncStatus("idle"), 3000);
    } catch {
      setCloudSyncStatus("error");
      setTimeout(() => setCloudSyncStatus("idle"), 5000);
    }
  };

  // Debounced cloud save — 20 s after the last meaningful data change
  useEffect(() => {
    const t = setTimeout(() => cloudSaveRef.current?.(), 20_000);
    return () => clearTimeout(t);
  }, [holdings, cashHolding, contribPlan, usdCadRate, optionTrades]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cloud load on mount — fetches latest cloud snapshot and applies it.
  // If the cloud returns 404 (first time), immediately pushes local data up
  // so restoring on a second device works right away.
  useEffect(() => {
    const lic = (() => { try { return JSON.parse(localStorage.getItem("portfolio:license") || "null"); } catch { return null; } })();
    if (!lic?.key) return;
    (async () => {
      try {
        const res = await fetch("/api/blob-load", { headers: { "x-license-key": lic.key } });
        if (!res.ok) {
          // 404 = no cloud snapshot yet — push local data up immediately
          cloudSaveRef.current?.();
          return;
        }
        const data = await res.json();
        if (data.portfolios) {
          setPortfolios(data.portfolios);
          localStorage.setItem("portfolio:list", JSON.stringify(data.portfolios));
        }
        if (data.holdings) {
          setHoldings(data.holdings);
          for (const [p, h] of Object.entries(data.holdings))
            localStorage.setItem(`portfolio:${p}`, JSON.stringify(h));
        }
        if (data.cashHolding) {
          setCashHolding(data.cashHolding);
          localStorage.setItem("portfolio:cash", JSON.stringify(data.cashHolding));
        }
        if (data.contribPlan) {
          setContribPlan(data.contribPlan);
          localStorage.setItem("portfolio:contrib", JSON.stringify(data.contribPlan));
        }
        if (data.usdCadRate) setUsdCadRate(data.usdCadRate);
        if (data.optionTrades) {
          setOptionTrades(data.optionTrades);
          localStorage.setItem("portfolio:options", JSON.stringify(data.optionTrades));
        }
        if (data.savedAt) {
          setCloudSyncedAt(data.savedAt);
          localStorage.setItem("portfolio:cloud:ts", data.savedAt);
        }
        cloudHasDataRef.current = true;
      } catch (e) { console.warn("Cloud load failed:", e); }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load scheduled Market Pulse on startup — if the server-side cron has run,
  // this will be newer than the bundled JSON and the user's localStorage cache.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/pulse-load");
        if (!res.ok) return; // no scheduled data yet — fall back to bundled JSON / localStorage
        const data = await res.json();
        if (!data.regime || !data.macroSignals) return;

        // Only apply if this is newer than what's already in state
        const existingTs  = pulseRefreshedAt || "";
        const scheduledTs = data._scheduledAt || data.lastUpdated || "";
        if (scheduledTs && scheduledTs > existingTs) {
          setMarketPulse(data);
          setPulseRefreshedAt(scheduledTs);
          localStorage.setItem("pulse:cache", JSON.stringify(data));
          localStorage.setItem("pulse:refreshedAt", scheduledTs);
        }
      } catch { /* network error — silently use cached/bundled data */ }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load BNN Market Call picks on startup
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/bnn-load");
        if (!res.ok) return; // no data yet — section stays hidden
        const data = await res.json();
        if (data.experts?.length) setBnnCalls(data);
      } catch { /* silently skip — BNN section stays hidden */ }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load spread scanner signals on startup (refreshed daily at 7am PST by cron)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/options-signals-load");
        if (!res.ok) return;
        const data = await res.json();
        if (data.signals?.length) setSpreadSignals(data);
      } catch { /* silently skip — scanner section shows empty state */ }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load CSP/CC technical picks on startup (refreshed weekdays at 6 AM UTC by cron)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/csp-cc-picks-load");
        if (!res.ok) return;
        const data = await res.json();
        if (data.cspPicks?.length || data.ccPicks?.length) setCspCcPicks(data);
      } catch { /* silently skip */ }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

// ── Persist helpers ────────────────────────────────────────────────────
  function persist(acct, data) {
    try {
      setSaveStatus("Saving...");
      localStorage.setItem(`portfolio:${acct}`, JSON.stringify(data));
      setSaveStatus("✓ Saved");
      setTimeout(() => setSaveStatus(""), 1500);
    } catch { setSaveStatus("⚠ Save failed"); }
  }

  function persistCash(next) {
    localStorage.setItem("portfolio:cash", JSON.stringify(next));
  }

  function persistContrib(next) {
    localStorage.setItem("portfolio:contrib", JSON.stringify(next));
  }

  function persistFxRate(rate) {
    localStorage.setItem("portfolio:fxRate", String(rate));
  }

  // ── Options trading helpers ─────────────────────────────────────────────
  function persistOptions(next) {
    localStorage.setItem("portfolio:options", JSON.stringify(next));
  }

  function persistWatchlist(next) {
    localStorage.setItem("portfolio:options:watchlist", JSON.stringify(next));
  }

  function addWatchlistTicker(raw) {
    const sym = raw.trim().toUpperCase().replace(/[^A-Z0-9.^-]/g, "");
    if (!sym || optionWatchlist.includes(sym)) return;
    const next = [...optionWatchlist, sym];
    setOptionWatchlist(next);
    persistWatchlist(next);
    setOptionWatchInput("");
  }

  function removeWatchlistTicker(sym) {
    const next = optionWatchlist.filter(s => s !== sym);
    setOptionWatchlist(next);
    persistWatchlist(next);
  }

  async function fetchLivePrices() {
    setLivePricesFetching(true);
    const tickers = [...new Set(portfolios.flatMap(p => (holdings[p] || []).map(h => h.ticker)))];
    const last = {}, prev = {};
    await Promise.allSettled(tickers.map(async sym => {
      try {
        const r = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!r.ok) return;
        const d = await r.json();
        const closes = d.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(Boolean);
        if (closes?.length >= 1) last[sym] = closes[closes.length - 1];
        if (closes?.length >= 2) prev[sym] = closes[closes.length - 2];
      } catch {}
    }));
    setLiveHoldingPrices(last);
    setLivePrevPrices(prev);
    setOptionPrices(p => ({ ...p, ...last }));
    setLivePricesFetchedAt(new Date().toISOString());
    setLivePricesFetching(false);
  }

  async function analyzeHoldings() {
    setHoldingSignalsLoading(true);
    const tickers = [...new Set(portfolios.flatMap(p => (holdings[p] || []).map(h => h.ticker)))];
    const results = {};
    const BATCH = 5;
    for (let i = 0; i < tickers.length; i += BATCH) {
      const batch = tickers.slice(i, i + BATCH);
      await Promise.allSettled(batch.map(async ticker => {
        try {
          const res = await fetch(`/api/yahoo-chart?ticker=${encodeURIComponent(ticker)}&range=1y&interval=1d`);
          if (!res.ok) return;
          const data = await res.json();
          const result = data.chart?.result?.[0];
          if (!result) return;
          const q = result.indicators?.quote?.[0] || {};
          const bars = (q.close || []).map((c, j) => ({ c, h: (q.high||[])[j], l: (q.low||[])[j], v: (q.volume||[])[j] }))
            .filter(b => b.c != null && b.h != null && b.l != null && b.v != null);
          if (bars.length < 30) return;
          const closes = bars.map(b => b.c), highs = bars.map(b => b.h),
                lows   = bars.map(b => b.l), volumes = bars.map(b => b.v);
          const price     = closes[closes.length - 1];
          const prevClose = closes[closes.length - 2];
          const sma50  = _ssSMA(closes, 50);
          const sma200 = _ssSMA(closes, 200);
          const rsi  = _ssRSI(closes);
          const macd = _ssMACD(closes);
          const vwap = _ssVWAP(highs, lows, closes, volumes, 20);
          const lastVol  = volumes[volumes.length - 1];
          const avg20Vol = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
          const volumeRatio = avg20Vol > 0 ? parseFloat((lastVol / avg20Vol).toFixed(2)) : 1;
          const atrResult = _ssATR(highs, lows, closes);
          const atrPct    = atrResult?.atrPct ?? null;
          const hvPct  = _ssHV(closes);
          const bbPos  = _ssBBPos(closes);

          // Fundamental data from stock universe when available
          const uni = stockUniverseData.stocks.find(s => s.ticker === ticker);
          const uniWithPrice = uni ? { ...uni, price } : null;
          const fundScore   = uniWithPrice ? computeScanScore(uniWithPrice)     : null;
          const fairPrice   = uniWithPrice ? computeScanFairPrice(uniWithPrice) : null;
          const upside      = fairPrice    ? computeScanUpside(uniWithPrice)    : null;
          const fundSig     = scanSignal(upside, fundScore ?? 50);

          // Technical direction: bull/bear vote count
          let bull = 0, bear = 0;
          if (rsi != null)          { if (rsi >= 52) bull += 2; else bear += 2; }
          if (macd?.histogram != null) { if (macd.histogram > 0) bull++; else bear++; }
          if (macd?.macd != null && macd?.signal != null) {
            if (macd.macd > macd.signal) bull++; else bear++;
          }
          if (sma50 != null)  { if (price > sma50)  bull += 2; else bear += 2; }
          if (sma200 != null) { if (price > sma200)  bull++;   else bear++; }
          if (sma50 != null && sma200 != null) { if (sma50 > sma200) bull += 2; else bear += 2; }
          if (bbPos != null)  { if (bbPos < 0.25) bull++; else if (bbPos > 0.80) bear++; }
          const techDir = bull >= bear + 3 ? "bullish" : bear >= bull + 3 ? "bearish" : "neutral";

          // Pure technical signal (used when no fundamentals available, or as a second opinion)
          let techSig;
          if      (rsi != null && rsi < 32 && techDir !== "bearish")  techSig = { label:"Oversold",   color:"#22d3ee", icon:"⬇" };
          else if (rsi != null && rsi > 72 && techDir === "bearish")  techSig = { label:"Overbought", color:"#ef4444", icon:"⬆" };
          else if (techDir === "bullish")                              techSig = { label:"Bullish",    color:"#22c55e", icon:"↑"  };
          else if (techDir === "bearish")                              techSig = { label:"Bearish",    color:"#f97316", icon:"↓"  };
          else                                                         techSig = { label:"Neutral",    color:"#64748b", icon:"→"  };

          // Merge: if fundamentals available, use them as the primary signal; tech as secondary
          const sig = fundSig ?? techSig;

          // Key reasons for the signal
          const reasons = [];
          if (rsi != null)   reasons.push(rsi < 35 ? `RSI ${Math.round(rsi)} oversold` : rsi > 70 ? `RSI ${Math.round(rsi)} overbought` : `RSI ${Math.round(rsi)}`);
          if (sma50 != null) reasons.push(price > sma50 ? "Above 50-MA" : "Below 50-MA");
          if (sma200 != null) reasons.push(price > sma200 ? "Above 200-MA" : "Below 200-MA");
          if (sma50 != null && sma200 != null) { if (sma50 > sma200) reasons.push("Golden cross"); else reasons.push("Death cross"); }
          if (macd?.histogram != null) reasons.push(macd.histogram > 0 ? "MACD positive" : "MACD negative");
          if (upside != null) reasons.push(`${upside > 0 ? "+" : ""}${upside}% fair-value upside`);

          results[ticker] = {
            ticker,
            price:      parseFloat(price.toFixed(2)),
            dayChgPct:  prevClose ? parseFloat(((price - prevClose) / prevClose * 100).toFixed(2)) : null,
            rsi:        rsi != null ? Math.round(rsi) : null,
            sma50:      sma50  != null ? parseFloat(sma50.toFixed(2))  : null,
            sma200:     sma200 != null ? parseFloat(sma200.toFixed(2)) : null,
            vsPct50:    sma50  != null ? parseFloat(((price - sma50)  / sma50  * 100).toFixed(1)) : null,
            vsPct200:   sma200 != null ? parseFloat(((price - sma200) / sma200 * 100).toFixed(1)) : null,
            macdHist:   macd?.histogram != null ? parseFloat(macd.histogram.toFixed(3)) : null,
            bbPos:      bbPos != null ? parseFloat(bbPos.toFixed(2)) : null,
            atrPct,
            fundScore, fairPrice, upside,
            sig, techSig, techDir,
            reasons: reasons.slice(0, 4),
            high52w: parseFloat(Math.max(...highs).toFixed(2)),
            low52w:  parseFloat(Math.min(...lows).toFixed(2)),
          };
        } catch { /* skip on network/parse error */ }
      }));
      if (i + BATCH < tickers.length) await new Promise(r => setTimeout(r, 300));
    }
    setHoldingSignals(results);
    const ts = new Date().toISOString();
    setHoldingSignalsFetchedAt(ts);
    localStorage.setItem("portfolio:holdingSignals", JSON.stringify(results));
    localStorage.setItem("portfolio:holdingSignals:ts", ts);
    setHoldingSignalsLoading(false);
  }

  function updateContribRoom(key, val) {
    const next = { ...contribRoom, [key]: Number(val) || 0 };
    setContribRoom(next);
    localStorage.setItem("portfolio:contribRoom", JSON.stringify(next));
  }

  async function fetchOptionPrices() {
    setOptionPricesLoading(true);
    setOptionPriceError(null);
    const tickers = [...new Set(
      portfolios.flatMap(p => (holdings[p] || []).map(h => h.ticker))
        .concat(RECOMMENDATIONS.map(r => r.ticker))
        .concat(optionWatchlist)
    )];
    const prices = {};
    await Promise.allSettled(tickers.map(async sym => {
      try {
        const r = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`,
          { signal: AbortSignal.timeout(7000) }
        );
        if (!r.ok) return;
        const d = await r.json();
        const closes = d.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
        const last = closes?.filter(Boolean).pop();
        if (last) prices[sym] = last;
      } catch { /* silent */ }
    }));
    setOptionPrices(prices);
    setOptionPricesLoading(false);
    if (!Object.keys(prices).length) setOptionPriceError("Could not fetch prices — check your connection.");
  }

  function estimateIV(ticker, vix = 17) {
    const rec = TICKER_DB[ticker];
    const sector = rec?.sector || "";
    const mult = SECTOR_IV_MULT[sector] || 1.8;
    return vix * mult;
  }

  // Simplified Black-Scholes inspired premium estimate (annualised IV in %)
  function estimatePremium(price, strikeDistance, daysToExpiry, annualIVpct) {
    if (!price || price <= 0) return 0.01;
    const T = daysToExpiry / 365;
    const IV = annualIVpct / 100;
    const moneyness = Math.abs(strikeDistance) / price;
    const atm = price * IV * Math.sqrt(T) * 0.4;
    return Math.max(atm * Math.exp(-3.8 * moneyness), 0.01);
  }

  // Three strike suggestions for a given strategy direction
  function getStrikeSuggestions(price, type, daysToExpiry, iv) {
    const offsets = type === "cc"
      ? [0.05, 0.08, 0.12]   // OTM call: 5%, 8%, 12% above
      : [0.05, 0.09, 0.13];  // OTM put: 5%, 9%, 13% below
    return offsets.map((pct, i) => {
      const strike = type === "cc"
        ? Math.round(price * (1 + pct) * 2) / 2   // round to $0.50
        : Math.round(price * (1 - pct) * 2) / 2;
      const dist = Math.abs(strike - price);
      const premiumPerShare = estimatePremium(price, dist, daysToExpiry, iv);
      const contractPremium = premiumPerShare * 100;
      const collateral = type === "csp" ? strike * 100 : price * 100;
      const monthlyYield = (contractPremium / collateral) * (30 / daysToExpiry) * 100;
      return {
        label: ["Conservative","Moderate","Aggressive"][i],
        strike,
        pct: Math.round(pct * 100),
        premiumPerShare: Math.round(premiumPerShare * 100) / 100,
        contractPremium: Math.round(contractPremium),
        monthlyYield: Math.round(monthlyYield * 10) / 10,
        annualYield:  Math.round(monthlyYield * 12 * 10) / 10,
      };
    });
  }

  function addOptionTrade(tradeRaw) {
    const trade = {
      ...tradeRaw,
      id: Date.now().toString(),
      openedAt: new Date().toISOString().split("T")[0],
      status: "open",
      closePrice: null,
      closedAt: null,
    };
    const next = [trade, ...optionTrades];
    setOptionTrades(next);
    persistOptions(next);
    setOptionNewTrade(null);
  }

  function closeOptionTrade(id, status, closePrice) {
    const next = optionTrades.map(t =>
      t.id === id
        ? { ...t, status, closePrice: Number(closePrice) || 0, closedAt: new Date().toISOString().split("T")[0] }
        : t
    );
    setOptionTrades(next);
    persistOptions(next);
    setOptionClosing(null);
  }

  function deleteOptionTrade(id) {
    const next = optionTrades.filter(t => t.id !== id);
    setOptionTrades(next);
    persistOptions(next);
  }

  function handleContribAmount(val) {
    const next = {
      ...contribPlan,
      [account]: { ...(contribPlan[account] || DEFAULT_CONTRIB_PLAN), amount: Number(val) || 0 },
    };
    setContribPlan(next);
    persistContrib(next);
  }

  function handleContribFrequency(freq) {
    const validFreq = CONTRIB_FREQUENCY_OPTIONS.some(o => o.value === freq) ? freq : "monthly";
    const next = {
      ...contribPlan,
      [account]: { ...(contribPlan[account] || DEFAULT_CONTRIB_PLAN), frequency: validFreq },
    };
    setContribPlan(next);
    persistContrib(next);
  }

  // ── Holdings mutations ─────────────────────────────────────────────────
  function updateHolding(idx, field, value) {
    const next = { ...holdings };
    next[account] = [...next[account]];
    next[account][idx] = {
      ...next[account][idx],
      [field]: field === "currencyOverride" ? value : (Number(value) || 0),
    };
    setHoldings(next);
    persist(account, next[account]);
  }

  function addTicker() {
    if (!addForm || !addForm.ticker.trim()) return;
    const ticker = addForm.ticker.trim().toUpperCase();
    if (holdings[account].some(h => h.ticker === ticker)) {
      alert(`${ticker} already exists in ${account}`);
      return;
    }
    if ((holdings[account] || []).length >= 25) {
      alert(`${account} has reached 25 holdings (optimal range is 10–20). Remove a position before adding a new one.`);
      return;
    }
    const next = { ...holdings };
    next[account] = [...next[account], {
      ticker,
      name:      addForm.name.trim() || ticker,
      current:   Number(addForm.current)   || 0,
      costBasis: Number(addForm.costBasis) || 0,
      target:    Number(addForm.target)    || 0,
      divYield:  Number(addForm.divYield)  || 0,
      cagr:      Number(addForm.cagr)      || DEFAULT_CAGR[ticker] || 10,
      currencyOverride: addForm.currencyOverride || "",
      locked:    "✅ Keep",
      notes:     addForm.notes.trim(),
    }];
    setHoldings(next);
    persist(account, next[account]);
    setAddForm(null);
  }

  function removeTicker(idx) {
    const next = { ...holdings };
    next[account] = next[account].filter((_, i) => i !== idx);
    setHoldings(next);
    persist(account, next[account]);
    setPendingRemove(null);
  }

  function addRecommendedTicker(rec, targetAccount) {
    if (holdings[targetAccount].some(h => h.ticker === rec.ticker)) {
      alert(`${rec.ticker} already exists in ${targetAccount}`);
      return;
    }
    if ((holdings[targetAccount] || []).length >= 25) {
      alert(`${targetAccount} has reached 25 holdings (optimal range is 10–20). Remove a position before adding a new one.`);
      return;
    }
    const next = { ...holdings };
    next[targetAccount] = [...next[targetAccount], {
      ticker:    rec.ticker,
      name:      rec.name,
      current:   0,
      costBasis: 0,
      target:    0,
      divYield:  rec.divYield,
      cagr:      DEFAULT_CAGR[rec.ticker] || 10,
      currencyOverride: "",
      locked:    "✅ Keep",
      notes:     rec.thesis.slice(0, 120) + "…",
    }];
    setHoldings(next);
    persist(targetAccount, next[targetAccount]);
    setAccount(targetAccount);
    setTab("targets");
  }

  // ── Auto-generate "why I bought this" notes via Claude ────────────────
  async function generateNote(idx, h) {
    const ticker = h.ticker;
    setNoteGenerating(s => new Set(s).add(ticker));
    try {
      const acctCtx = account === "TFSA"
        ? "TFSA — dividends and capital gains fully sheltered from tax"
        : account === "RRSP"
        ? "RRSP — US dividends exempt from 15% withholding tax"
        : account;
      const cagr = h.cagr ?? DEFAULT_CAGR?.[ticker] ?? 10;
      const pnlLine = h.costBasis > 0
        ? `\nCurrent P&L: ${(((h.current - h.costBasis) / h.costBasis) * 100).toFixed(1)}%`
        : "";
      const prompt = `Write one sentence (max 120 characters) explaining why this stock belongs in this portfolio. Be specific — mention the account tax advantage if relevant. No quotes, no preamble, no period at the end.

Ticker: ${ticker}
Name: ${h.name}
Account: ${acctCtx}
Estimated CAGR: ${cagr}%
Dividend yield: ${h.divYield || 0}%${pnlLine}`;

      const res = await callClaude({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [{ role: "user", content: prompt }],
      });
      const data = await res.json();
      const text = data.content?.[0]?.text?.trim().replace(/^["']|["']$/g, "");
      if (text) updateHolding(idx, "notes", text);
    } catch (e) {
      console.error("generateNote failed", e);
    } finally {
      setNoteGenerating(s => { const n = new Set(s); n.delete(ticker); return n; });
    }
  }

  async function generateAllNotes() {
    const list = holdings[account];
    for (let i = 0; i < list.length; i++) {
      if (!list[i].notes) await generateNote(i, list[i]);
    }
  }

  // ── Pulse Quick Trade helpers ──────────────────────────────────────────
  function logPulseTrade(entry) {
    const next = [entry, ...pulseTradeLog].slice(0, 50);
    setPulseTradeLog(next);
    localStorage.setItem("pulse:tradeLog", JSON.stringify(next));
  }

  function executePulseBuy(ticker, name, acct, amtStr) {
    const amt = parseFloat(amtStr);
    if (!amt || amt <= 0) { setPulseTradeFlash({ msg:"Enter a valid amount", ok:false }); return; }
    const next = { ...holdings };
    const idx = next[acct].findIndex(h => h.ticker === ticker);
    if (idx >= 0) {
      next[acct] = [...next[acct]];
      next[acct][idx] = { ...next[acct][idx], current: next[acct][idx].current + amt };
    } else {
      if (Object.values(next).flat().length >= 30) {
        setPulseTradeFlash({ msg:"Portfolio limit reached (30 holdings — optimal is 15–25) — remove a position first.", ok:false });
        return;
      }
      next[acct] = [...next[acct], {
        ticker, name: name || ticker, current: amt, costBasis: amt,
        target: 0, divYield: 0, cagr: DEFAULT_CAGR[ticker] || 10,
        currencyOverride: "", locked: "✅ Keep", notes: "Added from Market Pulse action.",
      }];
    }
    setHoldings(next);
    persist(acct, next[acct]);
    logPulseTrade({ date: new Date().toISOString(), ticker, type:"Buy", account: acct, amount: amt, note:`+C$${amt.toLocaleString()}` });
    setPulseTradeFlash({ msg:`✓ Added C$${amt.toLocaleString()} of ${ticker} to ${acct}`, ok:true });
    setPulseTradeAmt("");
    setPulseTradeOpen(null);
    setTimeout(() => setPulseTradeFlash(null), 4000);
  }

  function executePulseReduce(ticker, acct, reducePct) {
    const next = { ...holdings };
    const idx = next[acct]?.findIndex(h => h.ticker === ticker);
    if (idx === undefined || idx < 0) { setPulseTradeFlash({ msg:`${ticker} not found in ${acct}`, ok:false }); return; }
    const holding = next[acct][idx];
    const removed = holding.current * (reducePct / 100);
    const newVal  = Math.max(0, holding.current - removed);
    next[acct] = [...next[acct]];
    next[acct][idx] = { ...holding, current: newVal };
    setHoldings(next);
    persist(acct, next[acct]);
    logPulseTrade({ date: new Date().toISOString(), ticker, type:"Reduce", account: acct, amount: -removed, note:`-${reducePct}% → C$${Math.round(newVal).toLocaleString()} remaining` });
    setPulseTradeFlash({ msg:`✓ Reduced ${ticker} by ${reducePct}% in ${acct} — C$${Math.round(newVal).toLocaleString()} remaining`, ok:true });
    setPulseTradeOpen(null);
    setTimeout(() => setPulseTradeFlash(null), 4000);
  }

  // ── Cash holding ───────────────────────────────────────────────────────
  function handleCash(val) {
    const next = { ...cashHolding, [account]: Number(val) || 0 };
    setCashHolding(next);
    persistCash(next);
  }

  // ── Reset / Export / Import ────────────────────────────────────────────
  function addPortfolio(name) {
    const clean = name.trim().replace(/\s+/g,"_").toUpperCase().slice(0,20);
    if (!clean || portfolios.includes(clean)) return;
    const next = [...portfolios, clean];
    setPortfolios(next);
    localStorage.setItem("portfolio:list", JSON.stringify(next));
    const nextH = { ...holdings, [clean]: [] };
    setHoldings(nextH);
    const nextC = { ...cashHolding, [clean]: 0 };
    setCashHolding(nextC);
    persistCash(nextC);
    const nextContrib = { ...contribPlan, [clean]: { ...DEFAULT_CONTRIB_PLAN } };
    setContribPlan(nextContrib);
    persistContrib(nextContrib);
    setAccount(clean);
    setAddPortfolioForm(null);
  }

  function removePortfolio(pName) {
    if (["TFSA","RRSP"].includes(pName)) return;
    const next = portfolios.filter(p => p !== pName);
    setPortfolios(next);
    localStorage.setItem("portfolio:list", JSON.stringify(next));
    localStorage.removeItem(`portfolio:${pName}`);
    const nextH = { ...holdings };
    delete nextH[pName];
    setHoldings(nextH);
    const nextC = { ...cashHolding };
    delete nextC[pName];
    setCashHolding(nextC);
    persistCash(nextC);
    const nextContrib = { ...contribPlan };
    delete nextContrib[pName];
    setContribPlan(nextContrib);
    persistContrib(nextContrib);
    if (account === pName) setAccount(next[0] || "TFSA");
  }

  function doReset() {
    const defaultData = account === "TFSA" ? INITIAL_TFSA : account === "RRSP" ? INITIAL_RRSP : [];
    const next = { ...holdings, [account]: defaultData };
    setHoldings(next);
    persist(account, next[account]);
    setShowReset(false);
  }

  function relTime(ts) {
    if (!ts) return null;
    const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function exportData() {
    const today = new Date().toISOString().split("T")[0];
    const data = JSON.stringify({
      backupVersion: 2,
      exportedAt: new Date().toISOString(),
      portfolios,
      holdings,
      cashHolding,
      contribPlan,
      usdCadRate,
      pulse: {
        cache:       marketPulse,
        refreshedAt: pulseRefreshedAt,
      },
    }, null, 2);
    const blob = new Blob([data], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `portfolio-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus("✓ Backup saved");
    setTimeout(() => setBackupStatus(""), 3000);
  }

  function normalizeCsvHeader(header = "") {
    return header.trim().toLowerCase().replace(/[\s_-]/g, "");
  }

  function parseCsvLine(line) {
    const cells = [];
    let curr = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "\"") {
        if (inQuotes && line[i + 1] === "\"") {
          curr += "\"";
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(curr.trim());
        curr = "";
      } else {
        curr += ch;
      }
    }
    cells.push(curr.trim());
    return cells;
  }

  function parseCsvText(csvText) {
    const lines = csvText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length < 2) throw new Error("CSV must include a header and at least one data row");

    const headers = parseCsvLine(lines[0]).map(normalizeCsvHeader);
    const headerIdx = Object.fromEntries(headers.map((h, i) => [h, i]));
    const fieldIdx = {};
    for (const [field, aliases] of Object.entries(CSV_HEADER_ALIASES)) {
      const found = aliases.find(a => headerIdx[normalizeCsvHeader(a)] !== undefined);
      if (found) fieldIdx[field] = headerIdx[normalizeCsvHeader(found)];
    }

    if (fieldIdx.ticker === undefined) {
      throw new Error("Missing required column: ticker");
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]);
      const get = (field) => {
        const idx = fieldIdx[field];
        return idx === undefined ? "" : (cells[idx] ?? "").trim();
      };
      const ticker = get("ticker").toUpperCase();
      if (!ticker) continue;

      const accountRaw = get("account").toUpperCase();
      const sanitizedAccount = accountRaw
        ? accountRaw.replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "").slice(0, 20)
        : account;
      const currencyRaw = get("currencyOverride").toUpperCase();
      rows.push({
        account: sanitizedAccount || account,
        ticker,
        name: get("name") || ticker,
        current: Number(get("current")) || 0,
        costBasis: Number(get("costBasis")) || 0,
        target: Number(get("target")) || 0,
        divYield: Number(get("divYield")) || 0,
        cagr: Number(get("cagr")) || DEFAULT_CAGR[ticker] || 10,
        currencyOverride: currencyRaw === "USD" || currencyRaw === "CAD" ? currencyRaw : "",
        notes: get("notes"),
        locked: "✅ Keep",
      });
    }
    if (!rows.length) throw new Error("No valid rows found in CSV");
    return rows;
  }

  // mapping: { [csvRawAcct]: { target: appPortfolioName, mode: "replace"|"merge" } }
  function applyCsvImport(rows, mapping = {}) {
    // Remap rows: replace raw CSV account name with the user's chosen target portfolio name
    const remapped = rows.map(r => {
      const m = mapping[r.account];
      return { ...r, account: m ? m.target : normalizeWsAccountName(r.account) };
    });

    const targetAccounts = [...new Set(remapped.map(r => r.account).filter(Boolean))];
    const nextPortfolios = [...new Set([...portfolios, ...targetAccounts])];
    const nextHoldings   = { ...holdings };
    const nextCash       = { ...cashHolding };
    const nextContrib    = { ...contribPlan };

    for (const p of nextPortfolios) {
      if (!nextHoldings[p]) nextHoldings[p] = [];
      if (nextCash[p] === undefined) nextCash[p] = 0;
      if (!nextContrib[p]) nextContrib[p] = { ...DEFAULT_CONTRIB_PLAN };
    }

    // Group incoming rows by target portfolio
    const byTarget = {};
    for (const r of remapped) {
      if (!byTarget[r.account]) byTarget[r.account] = [];
      byTarget[r.account].push(r);
    }

    for (const [targetAcct, acctRows] of Object.entries(byTarget)) {
      const incoming = acctRows.map(({ account: _a, ...rest }) => rest);
      // Find the raw CSV account name(s) that map to this target (to check merge/replace mode)
      const rawAcct = Object.keys(mapping).find(k => mapping[k].target === targetAcct);
      const mode    = rawAcct ? (mapping[rawAcct]?.mode || "replace") : "replace";

      if (mode === "merge") {
        // Merge: update existing holdings by ticker, append new ones
        const existing = [...(nextHoldings[targetAcct] || [])];
        for (const inc of incoming) {
          const idx = existing.findIndex(h => h.ticker === inc.ticker);
          if (idx >= 0) existing[idx] = { ...existing[idx], ...inc }; // update in-place
          else existing.push(inc);
        }
        nextHoldings[targetAcct] = existing;
      } else {
        // Replace: overwrite the account entirely
        nextHoldings[targetAcct] = incoming;
      }
    }

    setPortfolios(nextPortfolios);
    localStorage.setItem("portfolio:list", JSON.stringify(nextPortfolios));
    setHoldings(nextHoldings);
    for (const p of targetAccounts) persist(p, nextHoldings[p]);
    setCashHolding(nextCash);
    persistCash(nextCash);
    setContribPlan(nextContrib);
    persistContrib(nextContrib);
    if (targetAccounts.length) setAccount(targetAccounts[0]);
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = String(e.target.result || "");
        const ext = (file.name.split(".").pop() || "").toLowerCase();

        if (ext === "csv") {
          const rows = parseCsvText(text);
          applyCsvImport(rows);
          setBackupStatus(`✓ Imported ${rows.length} holding${rows.length === 1 ? "" : "s"} from CSV`);
          setTimeout(() => setBackupStatus(""), 4000);
          event.target.value = "";
          return;
        }

        const data = JSON.parse(text);
        const h = data.holdings || data;
        if (!(h.TFSA && h.RRSP)) throw new Error("Invalid backup — missing TFSA/RRSP holdings");
        const pList = data.portfolios || ["TFSA","RRSP"];

        // Restore portfolios + holdings
        setPortfolios(pList);
        localStorage.setItem("portfolio:list", JSON.stringify(pList));
        setHoldings(h);
        for (const p of pList) { if (h[p]) persist(p, h[p]); }

        // Restore cash
        if (data.cashHolding) { setCashHolding(data.cashHolding); persistCash(data.cashHolding); }

        // Restore contrib plan (with frequency validation)
        if (data.contribPlan) {
          const nextContrib = Object.fromEntries(pList.map(p => {
            const existing = data.contribPlan?.[p];
            const freq = CONTRIB_FREQUENCY_OPTIONS.some(o => o.value === existing?.frequency)
              ? existing.frequency : "monthly";
            return [p, { amount: Number(existing?.amount) || 0, frequency: freq }];
          }));
          setContribPlan(nextContrib);
          persistContrib(nextContrib);
        } else if (data.monthlyContrib) {
          const nextContrib = Object.fromEntries(pList.map(p => [
            p, { amount: Number(data.monthlyContrib[p]) || 0, frequency:"monthly" },
          ]));
          setContribPlan(nextContrib);
          persistContrib(nextContrib);
        }

        // Restore FX rate
        if (data.usdCadRate) {
          setUsdCadRate(Number(data.usdCadRate));
          persistFxRate(Number(data.usdCadRate));
        }

        // Restore Market Pulse cache (v2 backup format)
        if (data.pulse?.cache?.regime) {
          setMarketPulse(data.pulse.cache);
          localStorage.setItem("pulse:cache", JSON.stringify(data.pulse.cache));
          if (data.pulse.refreshedAt) {
            setPulseRefreshedAt(data.pulse.refreshedAt);
            localStorage.setItem("pulse:refreshedAt", data.pulse.refreshedAt);
          }
        }

        const isFullBackup = !!data.backupVersion;
        setBackupStatus(isFullBackup ? "✓ Full backup restored" : "✓ Portfolio imported");
        setTimeout(() => setBackupStatus(""), 4000);
      } catch (err) {
        setBackupStatus(`⚠ ${err?.message || "Could not read file"}`);
        setTimeout(() => setBackupStatus(""), 5000);
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  // ── Broker CSV import via Claude ──────────────────────────────────────
  async function importBrokerHoldings(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";

    if (licenseTier === "basic") {
      setBrokerImportError("AI Broker Import requires the Pro plan. Upgrade at portfolio-manager-for-canada.lemonsqueezy.com");
      return;
    }

    setBrokerImportLoading(true);
    setBrokerImportError(null);
    setBrokerImportPreview(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvText = String(e.target.result || "");
        const rate = usdCadRate || 1.38;

        // Pre-scan CSV to find tickers that are managed funds or private equity,
        // and to collect unique raw account names for the mapping UI
        const csvLines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
        const rawHdrs  = parseCsvLine(csvLines[0] || "").map(h => h.toLowerCase().trim().replace(/\s+/g, " "));
        const secTypeIdx   = rawHdrs.findIndex(h => h === "security type");
        const classIdx     = rawHdrs.findIndex(h => h.includes("account classification"));
        const symbolIdx    = rawHdrs.findIndex(h => h === "symbol");
        const acctTypeIdx  = rawHdrs.findIndex(h => h === "account type" || h.includes("account type"));
        const excludedTickers  = new Set();
        const csvRawAcctNames  = new Set(); // raw "Account Type" values in this CSV
        for (let i = 1; i < csvLines.length; i++) {
          const cells = parseCsvLine(csvLines[i]);
          const secType  = (cells[secTypeIdx]  || "").toUpperCase().trim();
          const cls      = (cells[classIdx]    || "").toLowerCase().trim();
          const sym      = (cells[symbolIdx]   || "").toUpperCase().trim();
          const rawAcct  = (cells[acctTypeIdx] || "").trim();
          if (sym && (secType === "MUTUAL_FUND" || cls === "managed")) excludedTickers.add(sym);
          if (rawAcct) csvRawAcctNames.add(rawAcct);
        }

        // Build initial mapping: rawAccountName → { target: normalised name, mode: "replace" }
        // Pre-populate to existing portfolio names where possible, default to "replace"
        const initialMapping = {};
        for (const raw of csvRawAcctNames) {
          const normalised = normalizeWsAccountName(raw);
          initialMapping[raw] = {
            target: portfolios.includes(normalised) ? normalised : normalised,
            mode: "replace",
          };
        }
        setBrokerImportMapping(initialMapping);

        const prompt = `You are converting a Wealthsimple brokerage CSV export into portfolio app holdings.

Current USD/CAD rate: ${rate}

CSV data:
${csvText}

Rules:
- Include holdings where Quantity > 0 EXCEPT:
  - SKIP any row where Security Type is "MUTUAL_FUND" (private equity, managed funds)
  - SKIP any row where Account Classification is "Managed"
  - These tickers must be excluded entirely: ${[...excludedTickers].join(", ") || "none"}
- Use the EXACT value from the "Account Type" column verbatim for the "account" field — do NOT normalise it. Preserve it exactly as it appears in the CSV.
- For "current" (market value in the holding's NATIVE currency — do NOT pre-convert):
  - If "Market Value Currency" is CAD: use the "Market Value" column value as-is
  - If "Market Value Currency" is USD: use the "Market Value" column value as-is (keep in USD)
- For "costBasis" (cost basis in the holding's NATIVE currency):
  - If "Market Value Currency" is CAD: use the "Book Value (CAD)" column value as-is
  - If "Market Value Currency" is USD: divide the "Book Value (CAD)" column value by ${rate} to convert to USD
- Use "Symbol" for "ticker", "Name" for "name"
- "currencyOverride": set to "USD" if the Market Value Currency is USD, "CAD" if CAD, else ""
- Suggest "target" % allocation per account (integers; each account's targets must sum to 100)
  - TFSA: favor no/low-dividend growth stocks (no IRS WHT drag)
  - RRSP: favor US-listed dividend/income stocks (WHT-exempt in RRSP)
  - RESP: keep proportional to current market values
  - Crypto: split proportionally by market value
- Estimate "divYield" (0–5) and "cagr" (5–20) per ticker
- Set "locked" to "✅ Keep" for all
- "notes": one-line rationale for the target

Return ONLY a valid JSON array — no markdown fences, no explanation.
Example element (NVDA USD stock: Market Value = 1767.91 USD → current=1767.91; Book Value CAD = 2053.54 → costBasis = 2053.54 / ${rate} ≈ ${(2053.54/rate).toFixed(2)}):
{"account":"TFSA","ticker":"NVDA","name":"NVIDIA Corp","current":1767.91,"costBasis":${(2053.54/rate).toFixed(2)},"target":15,"divYield":0.03,"cagr":18,"currencyOverride":"USD","notes":"AI infrastructure leader","locked":"✅ Keep"}`;

        // Client-side safety filter applied after Claude responds (see below)

        const res = await callClaude({
          model: "claude-sonnet-4-6",
          max_tokens: 8000,
          messages: [{ role: "user", content: prompt }],
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || err.error || `API error ${res.status}`);
        }

        const data = await res.json();
        const rawText = (data.content?.[0]?.text || "").trim();

        // Strip markdown fences Claude sometimes adds despite instructions
        let stripped = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

        // Extract just the [...] array in case Claude wrapped it in explanation text
        const arrStart = stripped.indexOf("[");
        const arrEnd   = stripped.lastIndexOf("]");
        if (arrStart !== -1 && arrEnd > arrStart) stripped = stripped.slice(arrStart, arrEnd + 1);

        // Sanitize common LLM JSON mistakes before parsing:
        // 1. Literal newlines/tabs inside string values → space
        // 2. Trailing commas before } or ] (invalid JSON but common from LLMs)
        stripped = stripped
          .replace(/[\r\n\t]+/g, " ")
          .replace(/,(\s*[}\]])/g, "$1");

        let rows;
        try {
          rows = JSON.parse(stripped);
        } catch (parseErr) {
          throw new Error(`AI returned malformed JSON (${parseErr.message}). Try re-uploading the CSV.`);
        }

        if (!Array.isArray(rows) || !rows.length) throw new Error("Claude returned no holdings");

        // Client-side safety filter: remove any managed/private-equity tickers Claude may have slipped through
        const cleanRows = rows.filter(r => !excludedTickers.has((r.ticker || "").toUpperCase()));

        // Summarise by account
        const byAccount = {};
        for (const r of cleanRows) {
          const acct = r.account || "UNKNOWN";
          if (!byAccount[acct]) byAccount[acct] = { count: 0, totalCAD: 0 };
          byAccount[acct].count++;
          byAccount[acct].totalCAD += r.current || 0;
        }
        setBrokerImportPreview({
          rows: cleanRows,
          byAccount,
          skipped: rows.length - cleanRows.length,
          csvRawAcctNames: [...csvRawAcctNames],
        });
      } catch (err) {
        setBrokerImportError(err.message || "Failed to parse broker CSV");
      } finally {
        setBrokerImportLoading(false);
      }
    };
    reader.readAsText(file);
  }

  function applyBrokerImport() {
    if (!brokerImportPreview?.rows) return;
    try {
      applyCsvImport(brokerImportPreview.rows, brokerImportMapping);
      setBackupStatus(`✓ Imported ${brokerImportPreview.rows.length} holdings from broker CSV`);
      setTimeout(() => setBackupStatus(""), 4000);
    } catch (err) {
      setBrokerImportError(err.message);
    }
    setBrokerImportPreview(null);
  }

  // ── Investor profile context block (injected into all AI prompts) ────────
  function profileContext() {
    if (!investorProfile) return "";
    const ip = investorProfile;
    const yearsLeft = ip.age ? Math.max(0, (ip.retirementAge || 65) - Number(ip.age)) : null;
    const RISK_DESC = {
      conservative: "Conservative — prioritise capital preservation and low volatility over growth",
      balanced:     "Balanced — mix of growth and stability, comfortable with moderate drawdowns",
      growth:       "Growth — maximise long-term wealth, comfortable with significant volatility",
      aggressive:   "Aggressive — maximum growth potential, can tolerate severe drawdowns",
    };
    const GOAL_DESC = {
      retirement:   "Building retirement income",
      growth:       "Maximising long-term wealth accumulation",
      income:       "Generating regular dividend income",
      preservation: "Preserving capital with modest growth",
    };
    const lines = [
      "INVESTOR PROFILE:",
      ip.age        ? `- Age: ${ip.age}${yearsLeft !== null ? ` (${yearsLeft} years to retirement at age ${ip.retirementAge || 65})` : ""}` : null,
      ip.riskTolerance  ? `- Risk tolerance: ${RISK_DESC[ip.riskTolerance] || ip.riskTolerance}` : null,
      ip.primaryGoal    ? `- Primary goal: ${GOAL_DESC[ip.primaryGoal] || ip.primaryGoal}` : null,
      ip.monthlyContrib ? `- Monthly contribution capacity: C$${Number(ip.monthlyContrib).toLocaleString()}` : null,
    ].filter(Boolean);
    return lines.join("\n");
  }

  // ── AI target suggestions for the active account ──────────────────────
  async function suggestTargetsWithAI() {
    const snap = holdings[account];
    if (!snap || !snap.length) { setAiTargetsError("No holdings to analyse."); return; }

    if (licenseTier === "basic") {
      setAiTargetsError("AI Target Suggestions require the Pro plan. Upgrade at portfolio-manager-for-canada.lemonsqueezy.com");
      return;
    }

    setAiTargetsLoading(true);
    setAiTargetsError(null);
    setAiTargetsPreview(null);

    try {
      // Build a CAD-valued summary without exposing cost-basis / personal details
      const fxRate    = usdCadRate || 1.38;
      const totalCAD  = snap.reduce((s, h) => {
        const cur = getTickerCurrency(h.ticker, h.currencyOverride);
        return s + (cur === "USD" ? h.current * fxRate : h.current);
      }, 0);

      const lines = snap.map(h => {
        const cur    = getTickerCurrency(h.ticker, h.currencyOverride);
        const cadVal = cur === "USD" ? h.current * fxRate : h.current;
        const pct    = totalCAD > 0 ? ((cadVal / totalCAD) * 100).toFixed(1) : "0.0";
        return `${h.ticker} | ${h.name} | ${cur} | C$${Math.round(cadVal).toLocaleString()} (${pct}% of portfolio) | divYield:${h.divYield ?? 0}% | currentTarget:${h.target}%`;
      }).join("\n");

      const regime      = marketPulse?.regime?.label    || "Unknown";
      const riskScore   = marketPulse?.riskMeter?.score ?? 50;
      const riskLabel   = riskScore < 40 ? "risk-off — bias defensive"
                        : riskScore > 60 ? "risk-on — lean growth"
                        : "neutral — balanced";

      const acctRules = {
        TFSA:   "Favour zero/low-dividend individual growth stocks — IRS withholding tax (15%) on US dividends is unrecoverable in a TFSA. US dividend payers should get lower targets. Canadian-listed stocks are ideal (no WHT). Suggest individual stocks only.",
        RRSP:   "Favour US-listed dividend/income individual stocks — WHT is 0% under the Canada-US treaty in an RRSP. Balance income and growth stocks. No ETF suggestions — only individual equities.",
        RESP:   "Conservative and balanced individual stocks only. Mirror current market-value proportions. Favour dividend-paying defensive stocks (JNJ, KO, ENB) for stability.",
        Crypto: "Split proportionally by current market value. No fund wrappers — direct crypto holdings only.",
      };

      const profCtxTargets = profileContext();
      const prompt = `You are a Canadian portfolio advisor. Suggest optimal target allocations for a ${account} account.
${profCtxTargets ? `\n${profCtxTargets}\n` : ""}
Market regime: ${regime} | Risk score: ${riskScore}/100 (${riskLabel})
Account: ${account}
Total value: C$${Math.round(totalCAD).toLocaleString()}
USD/CAD: ${fxRate}

Account-specific rule:
${acctRules[account] || "Optimise for long-term growth."}

Current holdings (ticker | name | currency | CAD value | divYield | currentTarget):
${lines}

Instructions:
- Assign a "target" integer % to each ticker — they must sum to EXACTLY 100
- Maximum 25% for any single equity position
- Set target to 0 only if you have a strong reason to exit the position
- Also provide updated "cagr" (5-yr estimate, integer 5-25) and "divYield" (%, one decimal) per ticker
- "rationale": one sharp sentence — what drives the target change

Return ONLY a JSON array, no markdown:
[{"ticker":"NVDA","target":18,"cagr":18,"divYield":0.0,"rationale":"AI compute moat; TFSA-optimal growth with minimal WHT drag"}]`;

      const res = await callClaude({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || err.error || `API error ${res.status}`);
      }

      const data     = await res.json();
      const rawText  = (data.content?.[0]?.text || "").trim();
      const stripped = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const parsed   = JSON.parse(stripped);

      if (!Array.isArray(parsed) || !parsed.length) throw new Error("Claude returned no suggestions");

      // Merge with current holdings so we keep the right order and old targets
      const suggestions = snap.map(h => {
        const s = parsed.find(x => x.ticker === h.ticker);
        return {
          ticker:     h.ticker,
          name:       h.name,
          oldTarget:  h.target,
          target:     s ? Math.max(0, Math.round(Number(s.target) || 0)) : h.target,
          cagr:       s ? Math.max(1, Math.round(Number(s.cagr)   || h.cagr || 10)) : (h.cagr || 10),
          divYield:   s ? Math.max(0, Number(s.divYield) || 0) : (h.divYield || 0),
          rationale:  s?.rationale || "",
        };
      });

      setAiTargetsPreview({ suggestions, account });
    } catch (err) {
      setAiTargetsError(err.message || "Failed to get AI suggestions");
    } finally {
      setAiTargetsLoading(false);
    }
  }

  function applyAiTargets() {
    if (!aiTargetsPreview?.suggestions) return;
    const { suggestions } = aiTargetsPreview;
    const next = { ...holdings };
    next[account] = next[account].map(h => {
      const s = suggestions.find(x => x.ticker === h.ticker);
      if (!s) return h;
      return { ...h, target: s.target, cagr: s.cagr, divYield: s.divYield };
    });
    setHoldings(next);
    persist(account, next[account]);
    setAiTargetsPreview(null);
  }

  // ── AI diversification suggestions (cross-account) ───────────────────
  async function fetchDiversificationSuggestions() {
    if (licenseTier === "basic") {
      setDiversifyError("AI Diversification Analysis requires the Pro plan. Upgrade at portfolio-manager-for-canada.lemonsqueezy.com");
      return;
    }

    setDiversifyLoading(true);
    setDiversifyError(null);

    try {
      const fxRate = usdCadRate || 1.38;

      // Summarise every account — CAD values, currency, divYield
      const accountSummaries = portfolios.map(p => {
        const h = holdings[p] || [];
        if (!h.length) return null;
        const total = h.reduce((s, x) => {
          const cur = getTickerCurrency(x.ticker, x.currencyOverride);
          return s + (cur === "USD" ? x.current * fxRate : x.current);
        }, 0);
        const lines = h.map(x => {
          const cur    = getTickerCurrency(x.ticker, x.currencyOverride);
          const cadVal = cur === "USD" ? x.current * fxRate : x.current;
          const pct    = total > 0 ? ((cadVal / total) * 100).toFixed(1) : "0.0";
          return `  ${x.ticker} | ${x.name} | ${cur} | C$${Math.round(cadVal).toLocaleString()} (${pct}%) | div:${x.divYield ?? 0}%`;
        }).join("\n");
        return `${p} (total C$${Math.round(total).toLocaleString()}):\n${lines}`;
      }).filter(Boolean).join("\n\n");

      // All tickers currently held (to avoid duplicates)
      const heldTickers = new Set(
        portfolios.flatMap(p => (holdings[p] || []).map(x => x.ticker))
      );

      // Combined total for portfolio-level context
      const grandTotal = portfolios.reduce((s, p) => {
        return s + (holdings[p] || []).reduce((a, x) => {
          const cur = getTickerCurrency(x.ticker, x.currencyOverride);
          return a + (cur === "USD" ? x.current * fxRate : x.current);
        }, 0);
      }, 0);

      // Detected gaps
      const gapList = Object.entries(SECTOR_TICKERS)
        .filter(([, tickers]) => !tickers.some(t => [...heldTickers].includes(t)))
        .map(([sector]) => sector);

      // Cross-portfolio overlap — tickers held in 2+ accounts
      const overlapMap = {};
      portfolios.forEach(p => {
        (holdings[p] || []).forEach(h => {
          if (!overlapMap[h.ticker]) overlapMap[h.ticker] = [];
          overlapMap[h.ticker].push(p);
        });
      });
      const overlappingTickers = Object.entries(overlapMap)
        .filter(([, accts]) => accts.length > 1)
        .map(([ticker, accts]) => {
          const portions = accts.map(a => {
            const h = (holdings[a] || []).find(x => x.ticker === ticker);
            const cur = h ? getTickerCurrency(h.ticker, h.currencyOverride) : "USD";
            const cadVal = h ? (cur === "USD" ? h.current * fxRate : h.current) : 0;
            const acctTotal = (holdings[a] || []).reduce((s, x) => {
              const c = getTickerCurrency(x.ticker, x.currencyOverride);
              return s + (c === "USD" ? x.current * fxRate : x.current);
            }, 0);
            const pct = acctTotal > 0 ? (cadVal / acctTotal * 100).toFixed(1) : "0.0";
            return `${a}:${pct}%`;
          });
          return `  ${ticker}: ${portions.join(" + ")}`;
        });

      // Buy Radar — scanner-validated stocks near/at fair value, not yet held
      const radarInZone   = buyRadarData.inZone.filter(s => !heldTickers.has(s.ticker)).slice(0, 10);
      const radarNearZone = buyRadarData.nearZone.filter(s => !heldTickers.has(s.ticker)).slice(0, 5);
      const radarLines = [
        ...radarInZone.map(s   => `  ${s.ticker} | ${s.name} | +${s.upside}% upside | score:${s.score}/100 | ${s.sector} | div:${s.divYield ?? 0}%`),
        ...radarNearZone.map(s => `  ${s.ticker} | ${s.name} | ${s.upside}% upside (near zone) | score:${s.score}/100 | ${s.sector} | div:${s.divYield ?? 0}%`),
      ];

      const regime    = marketPulse?.regime?.label    || "Unknown";
      const riskScore = marketPulse?.riskMeter?.score ?? 50;
      const riskCtx   = riskScore < 40 ? "risk-off — prefer defensive, quality positions"
                      : riskScore > 60 ? "risk-on — lean growth, accept more volatility"
                      : "neutral — balance growth and quality";

      const profCtx = profileContext();
      const prompt = `You are a portfolio advisor for a Canadian investor with TFSA, RRSP, and other registered accounts.
${profCtx ? `\n${profCtx}\n` : ""}
Combined portfolio: C$${Math.round(grandTotal).toLocaleString()} across ${portfolios.length} accounts
Market regime: ${regime} | Risk score: ${riskScore}/100 (${riskCtx})
Detected sector gaps: ${gapList.length ? gapList.join(", ") : "none — well covered"}
USD/CAD rate: ${fxRate}

Current holdings by account (ticker | name | currency | CAD value (% of account) | div yield):
${accountSummaries}

Tickers held in multiple accounts (same stock duplicated across portfolios):
${overlappingTickers.length ? overlappingTickers.join("\n") : "  (none — all tickers unique per account)"}

Scanner Buy Radar — stocks at or near fair value not yet held (quantitative screen):
${radarLines.length ? radarLines.join("\n") : "  (none — market fully valued right now)"}

Already held tickers: ${[...heldTickers].join(", ")}

TASK A — Suggest exactly 3–6 NEW positions that would meaningfully diversify this portfolio.

Addition rules:
- NEVER suggest a ticker already in the held list above
- Suggest INDIVIDUAL STOCKS ONLY — no ETFs, no index funds, no bond funds
- For geographic diversification, use US-listed stocks of foreign companies (e.g. ASML, NVO, TSM, SHOP, BAM)
- Account assignment:
  - TFSA: only zero/minimal dividend payers (avoid IRS 15% WHT drain); Canadian stocks ideal
  - RRSP: US dividend-paying stocks welcome (WHT = 0% under Canada-US treaty)
- Suggest initial target % of 3–8% of the target account — keep each position modest
- Focus on filling real gaps: sector, geography, risk profile
- Consider the regime: in risk-off, lean toward defensive dividend stocks (JNJ, KO, ENB); in risk-on, lean toward growth stocks
- Stop at 6 — do not pad with unnecessary positions

TASK B — Identify existing positions that should be trimmed or removed.

Trim rules (flag a position if ANY of these apply):
- Single-stock position exceeds 20% of its account (concentration risk)
- Single-stock position exceeds 15% of total portfolio
- Two or more positions with substantially overlapping exposure (e.g. multiple AI/semi stocks, duplicate energy names)
- Position is misplaced for tax efficiency (high-dividend US stock in TFSA instead of RRSP)
- Position is speculative/high-risk and oversized given the current risk score
- Only flag genuine concerns — do NOT invent trims; return an empty array if holdings are well-balanced

TASK C — Cross-portfolio overlap advice.
For each ticker that appears in 2+ accounts (listed above):
- "Keep in both" — if holding it across accounts serves a deliberate purpose (large core position intentionally split, different lot dates, etc.)
- "Consolidate to RRSP" or "Consolidate to TFSA" — if one account placement clearly dominates for tax reasons
- "Diversify — swap [account] slot to [altTicker]" — if you'd capture more diversification by replacing one of the duplicate slots with a correlated-but-distinct stock (e.g., keeping NVDA in RRSP but swapping TFSA NVDA → AMD or MRVL for semi diversification)
If there are no overlapping tickers, return an empty array.

TASK D — Scanner-validated picks.
From the Buy Radar list above, select up to 3 stocks that:
- Have a meaningful buy signal (positive or near-zero upside to fair value)
- Fill a genuine gap not covered by TASK A suggestions
- Suit the current market regime
- Are NOT already in the held list
These are quantitatively screened — they can overlap with TASK A; that's fine. If none qualify, return [].

Return ONLY a valid JSON object, no markdown, no trailing commas:
{
  "additions": [{
    "ticker": "ENB",
    "name": "Enbridge Inc.",
    "account": "TFSA",
    "targetPct": 5,
    "sector": "Energy Infrastructure",
    "divYield": 7.2,
    "cagr": 8,
    "fillsGap": "Energy infrastructure — pipeline/midstream completely absent from portfolio",
    "thesis": "North America's largest pipeline operator with 30+ years of dividend growth. Regulated cash flows make it bond-like in volatility. CAD-listed, so no WHT in TFSA.",
    "placementReason": "CAD-listed — zero WHT drag regardless of account; TFSA preferred for tax-free dividend compounding"
  }],
  "trims": [{
    "ticker": "NVDA",
    "account": "TFSA",
    "currentPct": 28.5,
    "suggestedPct": 15,
    "action": "Reduce",
    "reason": "At 28.5% of TFSA this single semi position dominates the account. A 15% cap reduces concentration risk while keeping meaningful upside exposure."
  }],
  "crossPortfolioAdvice": [{
    "ticker": "NVDA",
    "inAccounts": ["TFSA", "RRSP"],
    "verdict": "Consolidate to RRSP",
    "altTicker": null,
    "altAccount": null,
    "reason": "NVDA pays a minimal dividend but the RRSP slot means zero WHT. The TFSA slot would be better used for a Canadian name or zero-dividend growth stock."
  }],
  "scannerPicks": [{
    "ticker": "TSM",
    "name": "Taiwan Semiconductor",
    "account": "RRSP",
    "targetPct": 5,
    "upside": 45,
    "signal": "Strong Buy",
    "sector": "Technology",
    "divYield": 0.9,
    "cagr": 15,
    "fillsGap": "Foundry / advanced-node manufacturing not represented",
    "thesis": "Sole manufacturer of leading-edge chips for NVDA, AAPL, AMD. AI capex supercycle drives volume. 45% upside to fair value at current prices.",
    "placementReason": "US-listed, pays a dividend — RRSP treaty eliminates 15% WHT"
  }]
}`;

      const res = await callClaude({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || err.error || `API error ${res.status}`);
      }

      const data     = await res.json();
      const rawText  = (data.content?.[0]?.text || "").trim();
      const stripped = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const parsed   = JSON.parse(stripped);

      if (!parsed.additions || !Array.isArray(parsed.additions)) throw new Error("Claude returned no suggestions");

      // Safety: strip any tickers that are already held
      const clean               = parsed.additions.filter(s => s.ticker && !heldTickers.has(s.ticker.toUpperCase())).slice(0, 6);
      const cleanTrims          = (parsed.trims || []).filter(s => s.ticker && heldTickers.has(s.ticker.toUpperCase())).slice(0, 6);
      const cleanCrossPortfolio = (parsed.crossPortfolioAdvice || []).slice(0, 8);
      const cleanScannerPicks   = (parsed.scannerPicks || []).filter(s => s.ticker && !heldTickers.has(s.ticker.toUpperCase())).slice(0, 3);

      const result = {
        suggestions: clean,
        trims: cleanTrims,
        crossPortfolioAdvice: cleanCrossPortfolio,
        scannerPicks: cleanScannerPicks,
        generatedAt: new Date().toISOString(),
        regime,
        riskScore,
      };
      setDiversifySuggestions(result);
      localStorage.setItem("diversify:suggestions", JSON.stringify(result));
    } catch (err) {
      setDiversifyError(err.message || "Failed to generate suggestions");
    } finally {
      setDiversifyLoading(false);
    }
  }

  // ── AI Options Analysis ───────────────────────────────────────────────
  async function fetchAIOptionsAnalysis() {
    if (licenseTier === "basic") {
      setAiOptionsError("AI Options Analysis requires the Pro plan. Upgrade at portfolio-manager-for-canada.lemonsqueezy.com");
      return;
    }

    setAiOptionsLoading(true);
    setAiOptionsError(null);

    try {
      const fxRate = usdCadRate || 1.38;
      const mp     = marketPulse;
      const vix    = Number(mp.macroSignals?.find(c => c.category === "Equities")
        ?.signals?.find(s => s.label === "VIX")?.value?.replace(/[^0-9.]/g, "")) || 17;
      const riskScore  = mp.riskMeter?.score ?? 50;
      const regime     = mp.regime?.label || "Unknown";

      // ── Pre-compute CC candidates ──────────────────────────────────────
      // TFSA = non-registered-linked, so TFSA + RRSP are both options-eligible
      const ccCandidates = portfolios.flatMap(acct =>
        (holdings[acct] || []).map(h => {
          const price = optionPrices[h.ticker];
          if (!price) return null;
          const estShares = Math.round(h.current / price);
          const contracts = Math.floor(estShares / 100);
          if (contracts < 1) return null;
          const iv      = estimateIV(h.ticker, vix);
          const strikes = getStrikeSuggestions(price, "cc", 30, iv);
          const cur     = getTickerCurrency(h.ticker, h.currencyOverride);
          return { ticker: h.ticker, name: h.name || h.ticker, acct, cur, price, estShares, contracts, iv: Math.round(iv), strikes };
        }).filter(Boolean)
      ).filter((x, i, arr) => arr.findIndex(y => y.ticker === x.ticker) === i); // dedupe

      // ── Cash buying power for CSPs ─────────────────────────────────────
      const cashBlocks = portfolios.map(p => {
        const cadCash = cashHolding[p] || 0;
        const usdCash = cadCash / fxRate;
        return { account: p, cadCash: Math.round(cadCash), usdCash: Math.round(usdCash) };
      }).filter(x => x.cadCash > 100);

      const totalCashCAD = cashBlocks.reduce((s, x) => s + x.cadCash, 0);

      // ── Format CC section for prompt ──────────────────────────────────
      const ccLines = ccCandidates.length
        ? ccCandidates.map(h => {
            const [cons, mod, agg] = h.strikes;
            return [
              `${h.ticker} (${h.acct}, ${h.cur}) — price $${h.price.toFixed(2)} | ${h.contracts} contract${h.contracts>1?"s":""} | IV ~${h.iv}%`,
              `  Conservative: strike $${cons.strike} (+${cons.pct}% OTM) | ~$${cons.premiumPerShare}/sh | $${cons.contractPremium}/contract | ${cons.monthlyYield}%/mo`,
              `  Moderate:     strike $${mod.strike}  (+${mod.pct}% OTM) | ~$${mod.premiumPerShare}/sh | $${mod.contractPremium}/contract | ${mod.monthlyYield}%/mo`,
              `  Aggressive:   strike $${agg.strike}  (+${agg.pct}% OTM) | ~$${agg.premiumPerShare}/sh | $${agg.contractPremium}/contract | ${agg.monthlyYield}%/mo`,
            ].join("\n");
          }).join("\n\n")
        : "No positions with 100+ shares currently available for covered calls. (Load live prices first if you haven't.)";

      // ── Format cash section ───────────────────────────────────────────
      const cashLines = cashBlocks.length
        ? cashBlocks.map(x =>
            `${x.account}: C$${x.cadCash.toLocaleString()} (≈ US$${x.usdCash.toLocaleString()}) — can secure 1 CSP on stocks priced up to $${x.usdCash} (or C$${x.cadCash} for CAD names)`
          ).join("\n")
        : "No significant cash available. Focus on covered calls only.";

      // ── Existing open option trades ────────────────────────────────────
      const openTrades = optionTrades.filter(t => t.status === "open");
      const openLines  = openTrades.length
        ? openTrades.map(t => `  ${t.type.toUpperCase()} ${t.ticker} ${t.account} strike $${t.strike} exp ${t.expiry}`).join("\n")
        : "  None";

      const profCtxOptions = profileContext();
      const prompt = `You are an options strategy advisor for a Canadian investor.
${profCtxOptions ? `\n${profCtxOptions}\nOptions sizing and risk level should reflect this investor profile. A conservative investor should see primarily Low-risk trade suggestions; an aggressive investor can handle High-risk trades.\n` : ""}
ACCOUNT CONTEXT:
- TFSA acts as a non-registered account for options (covered calls and CSPs are permitted)
- RRSP: covered calls and cash-secured puts permitted per broker rules
- Treat TFSA + RRSP holdings equally as options-eligible

MARKET ENVIRONMENT:
- VIX: ${vix} | Regime: ${regime} | Risk score: ${riskScore}/100
- IV environment: ${vix >= 25 ? "High — excellent for selling premium" : vix >= 18 ? "Elevated — good conditions" : vix >= 14 ? "Low — be selective" : "Very low — consider skipping"}
- Regime bias: ${riskScore >= 60 ? "Risk-On: CCs on extended positions; be cautious on new CSPs" : riskScore >= 40 ? "Neutral: balanced premium selling" : "Risk-Off: prefer CSPs on quality; avoid CCs that cap upside recovery"}

COVERED CALL CANDIDATES (pre-computed — only positions with 100+ shares):
${ccLines}

CASH AVAILABLE FOR CASH-SECURED PUTS:
${cashLines}
Total cash across accounts: C$${Math.round(totalCashCAD).toLocaleString()}

CURRENTLY OPEN OPTION TRADES (do not double up on these tickers):
${openLines}

TASK:
Generate 4–8 specific options trade recommendations. Mix CCs and CSPs based on what the portfolio and market support.

RISK CLASSIFICATION RULES (apply carefully):
- LOW risk: Conservative strike (5% OTM), IV < 25%, stable sector (ETFs, Financials, Utilities), DTE 30–45
- MEDIUM risk: Moderate strike (8% OTM), IV 25–40%, diversified sector, DTE 21–30
- HIGH risk: Aggressive strike (12%+ OTM) OR IV > 40% OR volatile sector (Semis, Biotech) OR DTE < 21

For CSPs: suggest specific tickers the investor might want to own at a discount (from their existing wish-list or quality names). Use the cash available per account to size.

VERDICT OPTIONS: "Strong" (execute now), "Consider" (good setup, minor reservations), "Skip" (unfavorable risk/reward)

Return ONLY a valid JSON object, no markdown:
{
  "summary": "2-3 sentence overall strategy recommendation given the regime and IV environment",
  "trades": [
    {
      "type": "cc",
      "ticker": "XEQT",
      "account": "TFSA",
      "risk": "Low",
      "strike": 46.00,
      "dte": 30,
      "premiumEst": 0.45,
      "contractPremium": 45,
      "contracts": 1,
      "monthlyYieldPct": 1.0,
      "rationale": "One paragraph explaining why this trade makes sense given regime, IV, and position size",
      "risks": ["Risk 1", "Risk 2"],
      "verdict": "Strong"
    }
  ]
}`;

      const res = await callClaude({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || err.error || `API error ${res.status}`);
      }

      const data     = await res.json();
      const rawText  = (data.content?.[0]?.text || "").trim();
      const stripped = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const parsed   = JSON.parse(stripped);

      if (!parsed.trades || !Array.isArray(parsed.trades)) throw new Error("Invalid response structure");

      const result = {
        ...parsed,
        generatedAt: new Date().toISOString(),
        regime,
        riskScore,
        vix,
      };
      setAiOptionsAnalysis(result);
      localStorage.setItem("options:aiAnalysis", JSON.stringify(result));
    } catch (err) {
      setAiOptionsError(err.message || "Failed to generate analysis");
    } finally {
      setAiOptionsLoading(false);
    }
  }

  async function refreshSpreadSignals() {
    setSpreadSignalsLoading(true);
    setSpreadSignalsError(null);
    try {
      const res = await fetch("/api/options-signals-load");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.signals?.length) setSpreadSignals(data);
      else throw new Error("No signals returned");
    } catch (err) {
      setSpreadSignalsError(err.message || "Failed to load signals");
    } finally {
      setSpreadSignalsLoading(false);
    }
  }

  async function refreshCspCcPicks() {
    setCspCcPicksLoading(true);
    try {
      const res = await fetch("/api/csp-cc-picks-load");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.cspPicks?.length || data.ccPicks?.length) setCspCcPicks(data);
    } catch { /* keep current data on error */ }
    finally { setCspCcPicksLoading(false); }
  }

  async function runManualCspCcScan() {
    const tickers = SPREAD_SCAN_TICKERS;
    setCspCcScanProgress({ done: 0, total: tickers.length, ticker: tickers[0] });
    const results = [];
    const BATCH = 5;
    for (let i = 0; i < tickers.length; i += BATCH) {
      const batch = tickers.slice(i, i + BATCH);
      const settled = await Promise.allSettled(batch.map(async ticker => {
        const res = await fetch(`/api/yahoo-chart?ticker=${encodeURIComponent(ticker)}&range=1y&interval=1d`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const result = data.chart?.result?.[0];
        if (!result) throw new Error("No chart data");
        const q = result.indicators?.quote?.[0] || {};
        const bars = (q.close || []).map((c, j) => ({ c, h: (q.high||[])[j], l: (q.low||[])[j], v: (q.volume||[])[j] }))
          .filter(b => b.c != null && b.h != null && b.l != null && b.v != null);
        if (bars.length < 50) throw new Error("Insufficient data");
        const closes = bars.map(b => b.c), highs = bars.map(b => b.h),
              lows   = bars.map(b => b.l), volumes = bars.map(b => b.v);
        const price = closes[closes.length - 1], prevClose = closes[closes.length - 2];
        const sma50 = _ssSMA(closes, 50), sma200 = _ssSMA(closes, 200);
        const rsi = _ssRSI(closes), macd = _ssMACD(closes);
        const vwap = _ssVWAP(highs, lows, closes, volumes, 20);
        const atrR = _ssATR(highs, lows, closes), atrPct = atrR?.atrPct ?? null;
        const hvPct = _ssHV(closes), hvRank = _ssHVRank(closes), bbPos = _ssBBPos(closes);
        const lastVol = volumes[volumes.length - 1];
        const avg20Vol = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
        const volumeRatio = avg20Vol > 0 ? parseFloat((lastVol / avg20Vol).toFixed(2)) : 1;
        const ind = { rsi, macd, price, sma50, sma200, vwap, volumeRatio, atrPct, hvPct, hvRank, bbPos };
        return {
          ticker, price: parseFloat(price.toFixed(2)),
          priceChangePct: prevClose ? parseFloat(((price - prevClose) / prevClose * 100).toFixed(2)) : 0,
          rsi, hvPct, hvRank, bbPos, sma50, sma200, atrPct, volumeRatio, vwap,
          high52w: parseFloat(Math.max(...highs).toFixed(2)),
          low52w:  parseFloat(Math.min(...lows).toFixed(2)),
          ..._ssCspScore(ind), ..._ssCcScore(ind),
        };
      }));
      settled.forEach(r => { if (r.status === "fulfilled") results.push(r.value); });
      const done = Math.min(i + BATCH, tickers.length);
      setCspCcScanProgress({ done, total: tickers.length, ticker: tickers[done] || "" });
      if (i + BATCH < tickers.length) await new Promise(r => setTimeout(r, 300));
    }
    const cspPicks = results.filter(p => p.cspScore >= 50).sort((a, b) => b.cspScore - a.cspScore);
    const ccPicks  = results.filter(p => p.ccScore  >= 50).sort((a, b) => b.ccScore  - a.ccScore);
    setCspCcPicks({ cspPicks, ccPicks, lastUpdated: new Date().toISOString(), manualScan: true });
    setCspCcScanProgress(null);
  }

  async function runManualSpreadScan() {
    // Cancel any in-flight scan
    if (spreadScanAbortRef.current) spreadScanAbortRef.current.abort();
    const ac = new AbortController();
    spreadScanAbortRef.current = ac;

    const tickers = SPREAD_SCAN_TICKERS;
    setSpreadSignalsError(null);
    setSpreadScanProgress({ done: 0, total: tickers.length, ticker: tickers[0] });

    const results = [];
    const BATCH = 5; // fetch 5 tickers in parallel, then next batch

    for (let i = 0; i < tickers.length; i += BATCH) {
      if (ac.signal.aborted) break;
      const batch = tickers.slice(i, i + BATCH);

      const batchResults = await Promise.allSettled(
        batch.map(async ticker => {
          const url = `/api/yahoo-chart?ticker=${encodeURIComponent(ticker)}&interval=1d&range=1y`;
          const res = await fetch(url, { signal: ac.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          const result = data.chart?.result?.[0];
          if (!result) throw new Error("no data");
          const q = result.indicators?.quote?.[0] || {};
          const bars = (q.close || []).map((c, idx) => ({
            c, h: q.high?.[idx], l: q.low?.[idx], v: q.volume?.[idx],
          })).filter(b => b.c != null && b.h != null && b.l != null && b.v != null);

          if (bars.length < 30) throw new Error("insufficient data");
          const closes  = bars.map(b => b.c);
          const highs   = bars.map(b => b.h);
          const lows    = bars.map(b => b.l);
          const volumes = bars.map(b => b.v);

          const price   = closes[closes.length - 1];
          const prev    = closes[closes.length - 2];
          const sma50   = _ssSMA(closes, 50);
          const sma200  = _ssSMA(closes, 200);
          const rsi     = _ssRSI(closes);
          const macd    = _ssMACD(closes);
          const vwap    = _ssVWAP(highs, lows, closes, volumes, 20);
          const lastVol = volumes[volumes.length - 1];
          const avg20V  = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
          const volumeRatio = parseFloat((avg20V > 0 ? lastVol / avg20V : 1).toFixed(2));
          const atrResult   = _ssATR(highs, lows, closes);
          const atrPct      = atrResult?.atrPct ?? null;
          const hvPct       = _ssHV(closes);
          const bbPos       = _ssBBPos(closes);

          const { score, direction, recommendation, recommendationColor, bull, bear } =
            _ssScore({ rsi, macd, price, sma50, sma200, vwap, volumeRatio, atrPct, hvPct, bbPos });

          return {
            ticker,
            price:           parseFloat(price.toFixed(2)),
            priceChangePct:  prev ? parseFloat(((price - prev) / prev * 100).toFixed(2)) : 0,
            volume:          lastVol,
            volumeRatio,
            vwap,
            sma50,
            sma200,
            rsi,
            macd,
            atrPct,
            hvPct,
            bbPos,
            bull,
            bear,
            score,
            direction,
            recommendation,
            recommendationColor,
            high52w: parseFloat(Math.max(...highs).toFixed(2)),
            low52w:  parseFloat(Math.min(...lows).toFixed(2)),
          };
        })
      );

      batchResults.forEach((r, idx) => {
        if (r.status === "fulfilled") results.push(r.value);
        // silently skip failed tickers
      });

      if (!ac.signal.aborted) {
        const done = Math.min(i + BATCH, tickers.length);
        const nextTicker = tickers[Math.min(i + BATCH, tickers.length - 1)];
        setSpreadScanProgress({ done, total: tickers.length, ticker: nextTicker });
      }

      // Small pause between batches to be respectful of Yahoo Finance rate limits
      if (i + BATCH < tickers.length && !ac.signal.aborted) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    if (!ac.signal.aborted) {
      results.sort((a, b) => b.score - a.score);
      if (!results.length) {
        setSpreadSignalsError("Scan returned no data — check network or try Load cache.");
      }
      setSpreadSignals({
        signals:     results,
        lastUpdated: new Date().toISOString(),
        tickerCount: results.length,
        source:      "live",
      });
      setSpreadScanProgress(null);
    }
  }

  // ── Stock universe live scan ───────────────────────────────────────────
  async function runStockScan() {
    if (stockScanAbortRef.current) stockScanAbortRef.current.abort();
    const ac = new AbortController();
    stockScanAbortRef.current = ac;

    if (!stockUniverseData.stocks.length) {
      setStockScanError("Stock universe is empty — run scripts/rebuild-universe.mjs to restore data.");
      setStockScanProgress(null);
      return;
    }

    // Map TSX-only tickers with no NYSE listing to their .TO equivalent for Yahoo Finance.
    // Tickers already containing "." (SU.TO, CP.TO, etc.) are left as-is.
    const CA_FIX = { ATD:"ATD.TO", TRP:"TRP.TO", BAM:"BAM.TO", MFC:"MFC.TO",
                     SLF:"SLF.TO", ENB:"ENB.TO", CNQ:"CNQ.TO", TFII:"TFII.TO" };
    const pairs = stockUniverseData.stocks.map(s => ({
      orig:  s.ticker,
      fetch: (!s.ticker.includes(".") && CA_FIX[s.ticker]) ? CA_FIX[s.ticker] : s.ticker,
    }));

    setStockScanError(null);
    setStockScanProgress({ done: 0, total: pairs.length, ticker: pairs[0].orig });

    const results = [];
    const BATCH = 5;

    for (let i = 0; i < pairs.length; i += BATCH) {
      if (ac.signal.aborted) break;
      const batch = pairs.slice(i, i + BATCH);

      const batchResults = await Promise.allSettled(
        batch.map(async ({ orig, fetch: yTicker }) => {
          const url = `/api/yahoo-chart?ticker=${encodeURIComponent(yTicker)}&interval=1d&range=5d`;
          const res = await fetch(url, { signal: ac.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const result = data.chart?.result?.[0];
          if (!result) throw new Error("no data");
          const closes = result.indicators?.quote?.[0]?.close || [];
          const price = closes.filter(c => c != null).pop();
          if (!price || price <= 0) throw new Error("no price");
          // Key result by original ticker so liveMap merge works correctly
          return { ticker: orig, price: parseFloat(price.toFixed(2)) };
        })
      );

      batchResults.forEach(r => {
        if (r.status === "fulfilled") results.push(r.value);
        // silently skip tickers that failed (data not available on Yahoo)
      });

      if (!ac.signal.aborted) {
        const done = Math.min(i + BATCH, pairs.length);
        setStockScanProgress({ done, total: pairs.length, ticker: pairs[Math.min(i + BATCH, pairs.length - 1)]?.orig });
      }

      if (i + BATCH < pairs.length && !ac.signal.aborted) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    if (!ac.signal.aborted) {
      if (!results.length) {
        setStockScanError("Scan returned no prices — check network or try again.");
      } else {
        setStockScanResults({ stocks: results, lastUpdated: new Date().toISOString(), source: "live", count: results.length });
        setScanCommitted({ ...scanFilters });
        setScanDirty(false);
      }
    }
    setStockScanProgress(null);
  }

  // ── FX helpers (close over usdCadRate state) ───────────────────────────
  const toCAD = (amount, ticker, currencyOverride = "") =>
    getTickerCurrency(ticker, currencyOverride) === "USD" ? amount * usdCadRate : amount;
  const fromCAD = (cadAmount, ticker, currencyOverride = "") =>
    getTickerCurrency(ticker, currencyOverride) === "USD" && usdCadRate > 0 ? cadAmount / usdCadRate : cadAmount;

  // ── Derived values ─────────────────────────────────────────────────────
  const current       = holdings[account];
  // All aggregate values in CAD — USD positions converted via usdCadRate
  const currentTotal  = current.reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride), 0);
  const cash          = cashHolding[account] || 0;   // cash is always CAD
  const newTotal      = currentTotal + cash;

  // P&L in CAD (costBasis entered in native currency, converted here)
  const totalCostBasis = current.reduce((s, h) => s + toCAD(h.costBasis || 0, h.ticker, h.currencyOverride), 0);
  const totalPnL       = totalCostBasis > 0 ? currentTotal - totalCostBasis : null;
  const totalPnLPct    = totalCostBasis > 0 ? ((currentTotal - totalCostBasis) / totalCostBasis) * 100 : null;

  // Annual dividend income + TFSA withholding tax — in CAD
  const annualDivIncome = current.reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride) * (h.divYield || 0) / 100, 0);
  const whtEstimate     = account === "TFSA"
    ? current.filter(h => !CAD_EXEMPT.has(h.ticker))
              .reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride) * (h.divYield || 0) / 100 * 0.15, 0)
    : 0;

  // Cash-constrained rebalance — all deltas in CAD
  const rawItems = current.map(h => {
    const currentDollarCAD = toCAD(h.current, h.ticker, h.currencyOverride);
    const targetDollar     = newTotal * h.target / 100;     // CAD
    const rawDelta         = targetDollar - currentDollarCAD; // CAD
    return { ...h,
      currentDollar:       currentDollarCAD,
      currentDollarNative: h.current,
      targetDollar,
      rawDelta,
      currentPct: currentTotal > 0 ? (currentDollarCAD / currentTotal) * 100 : 0,
    };
  });
  const rawBuyTotal    = rawItems.filter(r => r.rawDelta > 0).reduce((s, r) => s + r.rawDelta, 0);
  const scaleFactor    = rebalMode === "cash" && cash > 0 && rawBuyTotal > cash ? cash / rawBuyTotal : 1;
  const isCashConstrained = scaleFactor < 1;

  const rebalance = rawItems.map(r => {
    const delta = rebalMode === "cash"
      ? (r.rawDelta > 0 ? r.rawDelta * scaleFactor : 0)
      : r.rawDelta;
    return {
      ...r,
      delta,                             // CAD
      deltaNative: fromCAD(delta, r.ticker, r.currencyOverride),  // native currency (USD or CAD)
      rawDeltaNative: fromCAD(r.rawDelta, r.ticker, r.currencyOverride),
    };
  });

  const totalBuys      = rebalance.filter(r => r.delta > 0).reduce((s, r) => s + r.delta, 0);
  const totalSells     = rebalance.filter(r => r.delta < 0).reduce((s, r) => s + Math.abs(r.delta), 0);
  const cashRemaining  = Math.max(cash - totalBuys, 0);
  const buyList        = rebalance.filter(r => r.delta > 0);
  const accountContribPlan = contribPlan[account] || DEFAULT_CONTRIB_PLAN;
  const contribAmount       = Number(accountContribPlan.amount) || 0;
  const contribFrequency    = CONTRIB_FREQUENCY_OPTIONS.some(o => o.value === accountContribPlan.frequency)
    ? accountContribPlan.frequency
    : "monthly";
  const contribFrequencyMeta = CONTRIB_FREQUENCY_OPTIONS.find(o => o.value === contribFrequency) || CONTRIB_FREQUENCY_OPTIONS[2];
  const annualContrib       = contribAmount * contribFrequencyMeta.periodsPerYear;
  const monthlyContribEq    = annualContrib / 12;
  const dcaPeriods          = Math.max(1, Math.ceil(dcaWeeks / contribFrequencyMeta.cadenceWeeks));
  const perPeriodTotalBuy   = totalBuys / dcaPeriods;
  // Split by currency — USD shown in native USD, CAD in native CAD
  const totalBuysCAD   = buyList.filter(r => getTickerCurrency(r.ticker, r.currencyOverride) === "CAD").reduce((s, r) => s + r.delta, 0);
  const totalBuysUSD   = buyList.filter(r => getTickerCurrency(r.ticker, r.currencyOverride) === "USD").reduce((s, r) => s + r.deltaNative, 0);
  const perPeriodUSD   = totalBuysUSD / dcaPeriods;  // native USD
  const perPeriodCAD   = totalBuysCAD / dcaPeriods;  // native CAD
  const maxAlloc       = Math.max(...current.map(h => Math.max(h.target, (toCAD(h.current, h.ticker, h.currencyOverride) / Math.max(currentTotal, 1)) * 100)), 1);

  // Broad-market ETFs are more diversified by nature, so they get a higher concentration ceiling.
  const BROAD_ETFS = new Set(["SPY","QQQ","IWM","VTI","VOO","IVV","QQQM","QUU",
    "XEQT","XGRO","XBAL","VFV","ZSP","HXS","XIC","ZAG","XLK","XLF","XLE","GLD","XBI"]);

  // Concentration warnings: >15% for individual stocks, >25% for broad ETFs
  const concentrationWarnings = current.filter(h => {
    if (currentTotal <= 0) return false;
    const pct = (toCAD(h.current, h.ticker, h.currencyOverride) / currentTotal) * 100;
    return BROAD_ETFS.has(h.ticker) ? pct > 25 : pct > 15;
  });

  // Total holdings across ALL accounts — hard cap 30, sweet spot 15-25
  const totalHoldingsCount = Object.values(holdings).flat().length;
  const atHoldingsCap      = totalHoldingsCount >= 30;
  const nearHoldingsCap    = totalHoldingsCount >= 25 && !atHoldingsCap;
  const underDiversified   = totalHoldingsCount < 10 && totalHoldingsCount > 0;
  const inSweetSpot        = totalHoldingsCount >= 15 && totalHoldingsCount <= 25;

  // Buy Radar — fair-value triggers shared across all tabs
  const buyRadarData = (() => {
    if (!stockUniverseData.stocks.length) return { inZone: [], nearZone: [] };
    const livePriceMap = stockScanResults
      ? Object.fromEntries(stockScanResults.stocks.map(r => [r.ticker, r.price]))
      : {};
    const heldSet = new Set(portfolios.flatMap(p => (holdings[p] || []).map(h => h.ticker)));
    const scored = stockUniverseData.stocks
      .filter(s => s.price > 0)
      .map(s => {
        const st = livePriceMap[s.ticker] != null ? { ...s, price: livePriceMap[s.ticker] } : s;
        const fairPrice = computeScanFairPrice(st);
        const upside    = computeScanUpside(st);
        return { ...st, fairPrice, upside, score: computeScanScore(st), held: heldSet.has(st.ticker) };
      })
      .filter(s => s.fairPrice != null && s.score >= 35);
    return {
      inZone:   scored.filter(s => s.upside >= 0).sort((a, b) => b.upside - a.upside),
      nearZone: scored.filter(s => s.upside < 0 && s.upside >= -18).sort((a, b) => b.upside - a.upside),
    };
  })();

  // 4× take-profit alerts — any holding where current ≥ 4× cost basis
  const fourXAlerts = Object.entries(holdings).flatMap(([acct, list]) =>
    list
      .filter(h => h.costBasis > 0 && h.current > 0 && h.current / h.costBasis >= 4)
      .map(h => ({ ...h, acct, multiple: (h.current / h.costBasis).toFixed(1) }))
  );

  // WHT sell recommendations — TFSA positions losing ≥$20/yr to IRS withholding (in CAD)
  const whtSellRecs = account === "TFSA"
    ? current
        .filter(h => {
          const whtCAD = toCAD(h.current, h.ticker, h.currencyOverride) * (h.divYield || 0) / 100 * 0.15;
          return !CAD_EXEMPT.has(h.ticker) && (h.divYield || 0) >= 3 && whtCAD > 0;
        })
        .map(h => ({
          ...h,
          annualDiv: toCAD(h.current, h.ticker, h.currencyOverride) * h.divYield / 100,
          annualWHT: toCAD(h.current, h.ticker, h.currencyOverride) * h.divYield / 100 * 0.15,
          priority:  toCAD(h.current, h.ticker, h.currencyOverride) * h.divYield / 100 * 0.15 >= 80,
        }))
        .sort((a, b) => b.annualWHT - a.annualWHT)
    : [];

  // Buy recommendations with contextual tax + allocation reasons
  const enrichedBuys = rebalance
    .filter(r => r.delta > 5)
    .sort((a, b) => b.delta - a.delta)
    .map(r => {
      const gap = (r.target - r.currentPct).toFixed(1);
      const reasons = [];
      if (r.current === 0) {
        reasons.push(`New position — ${r.target}% target, currently unowned`);
      } else {
        reasons.push(`${gap}% underweight — ${r.currentPct.toFixed(1)}% held vs ${r.target}% target`);
      }
      if (account === "TFSA") {
        if (!(r.divYield) || r.divYield === 0)
          reasons.push("No dividend drag — 100% of appreciation compounds tax-free in TFSA");
        else if (CAD_EXEMPT.has(r.ticker))
          reasons.push(`WHT-exempt (CAD-listed) — full ${r.divYield}% yield retained in TFSA`);
        else
          reasons.push(`⚠ US dividend attracts 15% IRS withholding in TFSA (~C$${Math.round(toCAD(r.current,r.ticker)*(r.divYield||0)/100*0.15)}/yr drag) — consider RRSP`);
      } else if (account === "RRSP") {
        if ((r.divYield || 0) > 0.4)
          reasons.push(`${r.divYield}% yield — 0% withholding under Canada-US tax treaty in RRSP`);
        else if (!(r.divYield) || r.divYield === 0)
          reasons.push("Growth stock — tax-deferred compounding in RRSP until withdrawal");
      }
      return { ...r, reasons };
    });

  const gaps      = detectGaps(holdings.TFSA, holdings.RRSP);
  const targetSum = current.reduce((s, h) => s + h.target, 0);

  const filteredRecs = RECOMMENDATIONS.filter(r => {
    if (recFilter === "tfsa")  return r.bestFor === "TFSA" || r.bestFor === "both";
    if (recFilter === "rrsp")  return r.bestFor === "RRSP" || r.bestFor === "both";
    if (recFilter === "gaps")  return r.fills.some(f => gaps.includes(f));
    if (recFilter === "pulse") {
      // Keep ideas whose sector is explicitly aligned with the base-case 3M sector rotation
      const rotation = marketPulse?.outlooks?.[0]?.scenarios
        ?.find(s => s.label === "Base case")?.sectorRotation?.toLowerCase() || "";
      const sectorWord = (r.sector || "").toLowerCase().split(" ")[0];
      return ["overweight", "add", "rotate into", "favor", "tilt to"].some(term => {
        const idx = rotation.indexOf(term);
        return idx !== -1 && rotation.slice(idx, idx + 90).includes(sectorWord);
      });
    }
    return true;
  }).filter(r => {
    const allTickers = new Set(portfolios.flatMap(p => (holdings[p] || []).map(h => h.ticker)));
    return !allTickers.has(r.ticker);
  });

  const accountIdx  = portfolios.indexOf(account);
  const colorInfo   = PORTFOLIO_COLORS[account] ?? EXTRA_COLORS[Math.max(0, accountIdx - 2) % EXTRA_COLORS.length];
  const accentColor = colorInfo.accent;
  const accentRGB   = colorInfo.rgb;
  const filteredCurrent = (targetsFilter === "manual"
    ? current.filter(h => !!h.currencyOverride)
    : current
  ).map((h, idx) => ({ h, idx: current.indexOf(h) }));

// ── Market Pulse — live data fetch ────────────────────────────────────
  async function fetchLiveSignals() {
    const live = {};
    const tryFetch = async (url, timeout = 5000) => {
      const r = await fetch(url, { signal: AbortSignal.timeout(timeout) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    };
    // FRED public CSV — may fail due to CORS; silently ignored via allSettled
    const tryFetchFredCSV = async (seriesId, timeout = 6000) => {
      const r = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`, { signal: AbortSignal.timeout(timeout) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = await r.text();
      const rows = text.trim().split("\n").filter(l => !l.startsWith("DATE") && l.trim());
      const last = rows[rows.length - 1]?.split(",");
      if (!last || isNaN(last[1])) throw new Error("no data");
      return parseFloat(last[1]);
    };

    await Promise.allSettled([
      tryFetch("https://api.alternative.me/fng/?limit=1").then(d => {
        live.fearGreedValue = Number(d.data[0].value);
        live.fearGreedLabel = d.data[0].value_classification;
      }),
      tryFetch("https://open.er-api.com/v6/latest/USD").then(d => {
        live.usdCad = d.rates?.CAD;
      }),
      tryFetchFredCSV("T10YIE").then(v => { live.breakeven10y = v; }),
      tryFetchFredCSV("DFII10").then(v => { live.realYield10y = v; }),
      ...[
        ["sp500",        "^GSPC"],
        ["tsx",          "^GSPTSE"],
        ["vix",          "^VIX"],
        ["gold",         "GC=F"],
        ["oil",          "CL=F"],
        ["treasury3m",   "^IRX"],
        ["treasury5y",   "^FVX"],
        ["treasury10y",  "^TNX"],
        ["treasury30y",  "^TYX"],
      ].map(([key, sym]) =>
        tryFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`, 6000)
          .then(d => {
            const closes = d.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
            const last = closes?.filter(Boolean).pop();
            if (last) live[key] = last;
          })
      ),
    ]);
    return live;
  }

  function buildMarketPulsePrompt(live) {
    const today = new Date().toISOString().split("T")[0];
    const monthLabel = new Date().toLocaleString("default", { month: "long", year: "numeric" });
    const threeMonths = new Date(); threeMonths.setMonth(threeMonths.getMonth() + 3);
    const sixMonths   = new Date(); sixMonths.setMonth(sixMonths.getMonth() + 6);
    const fmt3 = threeMonths.toLocaleString("default", { month: "short", year: "numeric" });
    const fmt6 = sixMonths.toLocaleString("default",   { month: "short", year: "numeric" });

    const lines = [];
    if (live.fearGreedValue != null) lines.push(`- CNN Fear & Greed Index: ${live.fearGreedValue}/100 (${live.fearGreedLabel})`);
    if (live.usdCad)       lines.push(`- USD/CAD: ${live.usdCad.toFixed(4)}`);
    if (live.sp500)        lines.push(`- S&P 500: ${live.sp500.toFixed(0)}`);
    if (live.tsx)          lines.push(`- TSX Composite: ${live.tsx.toFixed(0)}`);
    if (live.vix)          lines.push(`- VIX: ${live.vix.toFixed(1)}`);
    if (live.gold)         lines.push(`- Gold (front-month futures): $${live.gold.toFixed(0)}/oz`);
    if (live.oil)          lines.push(`- WTI Crude (front-month futures): $${live.oil.toFixed(1)}/barrel`);
    if (live.treasury3m)   lines.push(`- 3M US Treasury yield: ${live.treasury3m.toFixed(2)}%`);
    if (live.treasury10y)  lines.push(`- 10Y US Treasury yield: ${live.treasury10y.toFixed(2)}%`);
    if (live.treasury5y)   lines.push(`- 5Y US Treasury yield: ${live.treasury5y.toFixed(2)}%`);
    if (live.treasury30y)  lines.push(`- 30Y US Treasury yield: ${live.treasury30y.toFixed(2)}%`);
    if (live.breakeven10y) lines.push(`- 10Y Breakeven Inflation (FRED T10YIE): ${live.breakeven10y.toFixed(2)}%`);
    if (live.realYield10y != null) {
      lines.push(`- 10Y Real Yield (FRED DFII10 TIPS): ${live.realYield10y.toFixed(2)}%`);
    } else if (live.treasury10y && live.breakeven10y) {
      lines.push(`- 10Y Real Yield (computed nominal−breakeven): ${(live.treasury10y - live.breakeven10y).toFixed(2)}%`);
    }

    const spreadLines = [];
    if (live.treasury3m && live.treasury10y)
      spreadLines.push(`- 3M–10Y spread: ${Math.round((live.treasury10y - live.treasury3m) * 100)} bps (${live.treasury10y - live.treasury3m >= 0 ? "normal" : "INVERTED — recession signal"})`);
    if (live.treasury5y && live.treasury30y)
      spreadLines.push(`- 5Y–30Y spread: ${Math.round((live.treasury30y - live.treasury5y) * 100)} bps`);
    if (live.treasury10y && live.treasury3m && live.treasury30y)
      spreadLines.push(`- Curve shape: ${live.treasury10y - live.treasury3m < -0.20 ? "Deeply inverted" : live.treasury10y - live.treasury3m < 0 ? "Mildly inverted" : live.treasury10y - live.treasury3m < 0.30 ? "Flat to slightly positive" : "Normal/Steepening"}`);

    // Build a compact holdings summary for holdings-aware action generation
    const buildHoldingSummary = (acct, hList) => {
      if (!hList || !hList.length) return "";
      const rows = hList
        .filter(h => h.current > 0)
        .map(h => `    ${h.ticker} (${h.name}): C$${Math.round(h.current).toLocaleString()} current value, ${h.divYield || 0}% div yield, target ${h.target}%`)
        .join("\n");
      return rows ? `  ${acct}:\n${rows}` : "";
    };
    const holdingsBlock = portfolios
      .map(p => buildHoldingSummary(p, holdings[p] || []))
      .filter(Boolean)
      .join("\n");

    // BNN Bloomberg Market Call picks — cross-reference with held tickers
    const allHeld = new Set(
      portfolios.flatMap(p => (holdings[p] || []).map(h => h.ticker))
    );
    let bnnBlock = "";
    const bnnDays = bnnCalls?.days?.length ? bnnCalls.days : (bnnCalls?.experts?.length ? [bnnCalls] : []);
    if (bnnDays.length) {
      const rows = [];
      bnnDays.forEach(day => {
        const dayLabel = day.date || day.fetchedAt?.slice(0, 10) || "recent";
        (day.experts || []).forEach(expert => {
          (expert.picks || []).forEach(pick => {
            const held = allHeld.has(pick.ticker);
            if (held || pick.action === "buy") {
              rows.push(
                `  [${dayLabel}] ${pick.ticker} — ${pick.rawAction || pick.action.toUpperCase()} ` +
                `[${expert.guest}${expert.firm ? ", " + expert.firm : ""}]: ` +
                `"${pick.rationale}"` +
                (held ? " ← YOU HOLD THIS" : "")
              );
            }
          });
        });
      });
      if (rows.length) {
        const dateRange = bnnDays.length > 1
          ? `${bnnDays[bnnDays.length-1].date || ""} to ${bnnDays[0].date || ""}`
          : (bnnDays[0].date || bnnDays[0].fetchedAt?.slice(0, 10) || "latest");
        bnnBlock = `\nBNN Bloomberg Market Call picks (${dateRange}):\n` + rows.join("\n");
      }
    }

    return `You are a senior macro analyst writing a monthly market pulse briefing for a Canadian investor managing a TFSA and RRSP portfolio.

Today's date: ${today}
3-month target period: ${fmt3}
6-month target period: ${fmt6}

Live market data fetched right now:
${lines.length ? lines.join("\n") : "(fetch failed — use your best current knowledge)"}
${spreadLines.length ? "\nComputed yield curve spreads:\n" + spreadLines.join("\n") : ""}

Current portfolio holdings (use these to generate specific, personalised actions):
${holdingsBlock || "(no holdings data available)"}
${bnnBlock || ""}

Using the live data as your anchor, apply your macro knowledge to fill in anything not directly measured above: Fed/BoC policy stance, full yield curve shape (3M/2Y/5Y/10Y/30Y), CPI trend, unemployment, sector rotation, geopolitical context, earnings revisions, sentiment indicators, credit spreads, DXY, copper, global macro. Weight the live numbers heavily; they override your training data.

For the yieldCurve section: classify the curve shape, report all five benchmark yields, compute spreads in bps, estimate the NY Fed 12-month recession probability, describe the inversion history, and give a trajectory outlook.

For newsSignals: provide exactly 4 recent, specific news headlines from Bloomberg, CNBC, Reuters, Financial Times, or WSJ that are most relevant to this portfolio. Each headline must name the source and include a direct implication for the specific tickers held above. Keep portfolioImpact to one sentence.

For portfolioImplication.actions: generate exactly 5 specific, actionable items referencing actual tickers from the holdings above. Classify each as "Buy", "Hold", "Reduce", "Watch", or "Rebalance". Include a rationale tied to the current macro regime. At least 2 actions must be "High" priority. Keep each action field to one concise sentence.
Where BNN Bloomberg experts have picked a stock you hold (marked "← YOU HOLD THIS" above): a TOP PICK or BUY from a guest strengthens a Hold or Buy action; a SELL or DON'T BUY from a guest on a held position should trigger a Reduce or Watch action. Name the BNN guest and their call in the action sentence where relevant.

Be concise throughout — keep every "note", "trajectory", "canadianAngle", and "positioning" field to a single sentence. Do not pad with adjectives.

Generate a complete market pulse JSON for ${monthLabel}. Return the JSON inside a single \`\`\`json code block. No explanation before or after the code block — only the code block.

Required schema (fill every field; scenario probabilities within each outlook must sum to exactly 100):

{
  "lastUpdated": "${today}",
  "period": "${monthLabel}",
  "regime": {
    "label": "short label e.g. Cautious Bull",
    "sublabel": "short sub-label e.g. Recovery Mode",
    "color": "#22c55e or #fbbf24 or #ef4444",
    "description": "2-3 sentences on the current macro environment",
    "score": 0-100
  },
  "riskMeter": {
    "score": 0-100,
    "label": "e.g. Mildly Risk-Off",
    "sublabel": "one sentence context",
    "color": "#hex"
  },
  "yieldCurve": {
    "shapeLabel": "Normal | Flat | Inverted | Bear-Steepening | Bull-Flattening | Bull-Steepening | Bear-Flattening",
    "shapeColor": "#22c55e (normal/steepening) or #fbbf24 (flat) or #ef4444 (inverted)",
    "currentYields": [
      { "maturity": "3M",  "yield": 0.00 },
      { "maturity": "2Y",  "yield": 0.00 },
      { "maturity": "5Y",  "yield": 0.00 },
      { "maturity": "10Y", "yield": 0.00 },
      { "maturity": "30Y", "yield": 0.00 }
    ],
    "spreads": [
      { "label": "3M–10Y", "description": "NY Fed recession predictor", "bps": 0, "status": "normal|warning|inverted", "note": "one-line interpretation" },
      { "label": "2Y–10Y", "description": "Classic 2s10s",              "bps": 0, "status": "normal|warning|inverted", "note": "one-line interpretation" },
      { "label": "5Y–30Y", "description": "Long-end slope",              "bps": 0, "status": "normal|warning|inverted", "note": "one-line interpretation" }
    ],
    "inversionStatus": "e.g. Dis-inverted Apr 2026 after 22-month inversion | Currently inverted X months",
    "recessionProbability": "~X% (NY Fed 12-month model)",
    "recessionProbabilityScore": 15,
    "trajectory": "One sentence on where the curve is heading and why",
    "canadianCurve": "One sentence on BoC curve dynamics relevant to a Canadian TFSA/RRSP investor"
  },
  "macroSignals": [
    { "category": "Equities", "icon": "📈", "signals": [
        { "label": "S&P 500",       "value": "~X,XXX", "trend": "up|down|sideways", "status": "bullish|bearish|caution|neutral", "note": "one line" },
        { "label": "TSX Composite", "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "VIX",           "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Nasdaq / Tech", "value": "...", "trend": "...", "status": "...", "note": "..." }
    ]},
    { "category": "Rates & Bonds", "icon": "🏦", "signals": [
        { "label": "Fed Funds Rate",           "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "10Y US Treasury",          "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Yield Curve (2s10s)",      "value": "+/- XX bps", "trend": "...", "status": "...", "note": "..." },
        { "label": "10Y Real Yield",           "value": "X.XX%", "trend": "...", "status": "...", "note": "..." },
        { "label": "10Y Breakeven Inflation",  "value": "X.XX%", "trend": "...", "status": "...", "note": "..." },
        { "label": "BoC Rate",                 "value": "...", "trend": "...", "status": "...", "note": "..." }
    ]},
    { "category": "Macro", "icon": "🌐", "signals": [
        { "label": "US CPI (YoY)",    "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "US Unemployment", "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Oil (WTI)",       "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Gold",            "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "USD/CAD",         "value": "...", "trend": "...", "status": "...", "note": "..." }
    ]},
    { "category": "Credit & Risk", "icon": "💳", "signals": [
        { "label": "HY Credit Spread (CDX HY)", "value": "~XXX bps", "trend": "...", "status": "bullish (<350 bps) | caution (350–500) | bearish (>500)", "note": "one line — widening spreads = credit stress, risk-off signal" },
        { "label": "IG Credit Spread",          "value": "~XX bps",  "trend": "...", "status": "...", "note": "..." },
        { "label": "US HY Default Rate",        "value": "X.X%",     "trend": "...", "status": "...", "note": "..." },
        { "label": "Bank Lending Standards",    "value": "...",       "trend": "...", "status": "...", "note": "..." }
    ]},
    { "category": "Global & Commodities", "icon": "🌍", "signals": [
        { "label": "DXY (US Dollar Index)", "value": "~XXX",  "trend": "...", "status": "...", "note": "strong USD = headwind for EM, commodities, and CAD" },
        { "label": "Copper (front-month)",  "value": "~$X.XX/lb", "trend": "...", "status": "bullish|bearish|neutral", "note": "copper is a leading global growth indicator" },
        { "label": "China PMI",             "value": "...",    "trend": "...", "status": "...", "note": "..." },
        { "label": "Eurozone CPI",          "value": "...",    "trend": "...", "status": "...", "note": "..." }
    ]},
    { "category": "Sentiment", "icon": "🧠", "signals": [
        { "label": "Fear & Greed",       "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "AAII Bull/Bear",     "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Put/Call Ratio",     "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Earnings Revisions", "value": "...", "trend": "...", "status": "...", "note": "..." }
    ]}
  ],
  "newsSignals": [
    {
      "source": "Bloomberg|CNBC|Reuters|FT|WSJ",
      "headline": "Specific headline text — must be a real or very plausible current headline",
      "date": "Month DD, YYYY",
      "impact": "bullish|bearish|neutral",
      "portfolioImpact": "One sentence: which holdings are directly affected and how (name the tickers)"
    }
  ],
  "outlooks": [
    {
      "horizon": "3 months", "period": "${fmt3}",
      "scenarios": [
        { "label": "Bull case",  "probability": 30, "color": "#22c55e", "icon": "🟢",
          "trigger": "...", "marketTarget": "S&P X,XXX–X,XXX", "canadianAngle": "TSX/CAD/oil implications",
          "positioning": "TFSA/RRSP action referencing actual portfolio tickers",
          "sectorRotation": "e.g. Overweight Financials + Tech; underweight Utilities" },
        { "label": "Base case",  "probability": 45, "color": "#fbbf24", "icon": "🟡",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "...", "sectorRotation": "..." },
        { "label": "Bear case",  "probability": 25, "color": "#ef4444", "icon": "🔴",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "...",
          "sectorRotation": "e.g. Rotate to Staples, Healthcare, Gold — avoid rate-sensitives" }
      ],
      "keyEvents": [ { "date": "Mon DD", "event": "description" } ]
    },
    {
      "horizon": "6 months", "period": "${fmt6}",
      "scenarios": [
        { "label": "Bull case",  "probability": 28, "color": "#22c55e", "icon": "🟢",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "...", "sectorRotation": "..." },
        { "label": "Base case",  "probability": 42, "color": "#fbbf24", "icon": "🟡",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "...", "sectorRotation": "..." },
        { "label": "Bear case",  "probability": 30, "color": "#ef4444", "icon": "🔴",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "...", "sectorRotation": "..." }
      ],
      "keyEvents": [ { "date": "Mon YYYY", "event": "description" } ]
    }
  ],
  "catalysts": {
    "bullish": [ { "icon": "emoji", "label": "specific catalyst relevant to current environment" } ],
    "bearish":  [ { "icon": "emoji", "label": "specific risk relevant to current environment" } ]
  },
  "portfolioImplication": {
    "summary": "1-2 sentences specific to a Canadian TFSA/RRSP investor given the current regime and actual holdings",
    "actions": [
      { "priority": "High",   "type": "Hold|Buy|Reduce|Watch|Rebalance", "ticker": "TICKER or null", "action": "One concise sentence referencing actual portfolio tickers" },
      { "priority": "High",   "type": "...", "ticker": "...", "action": "..." },
      { "priority": "Medium", "type": "...", "ticker": "...", "action": "..." },
      { "priority": "Medium", "type": "...", "ticker": "...", "action": "..." },
      { "priority": "Low",    "type": "...", "ticker": "...", "action": "..." }
    ]
  }
}`;
  }

  async function reactivateLicense() {
    const trimmed = licenseModalKey.trim();
    if (!trimmed) { setLicenseModalError("Please enter your new license key."); return; }
    setLicenseModalLoading(true);
    setLicenseModalError(null);
    try {
      const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          license_key: trimmed,
          instance_name: "Portfolio Rebalancer — " + navigator.userAgent.slice(0, 50),
        }),
      });
      const data = await res.json();
      if (data.activated) {
        const productId = data.meta?.product_id;
        const tier = (LS_PRODUCT_ID_BASIC && productId === LS_PRODUCT_ID_BASIC) ? "basic" : "pro";
        const record = {
          key: trimmed,
          activatedAt: new Date().toISOString(),
          instanceId: data.instance?.id || "",
          email: data.meta?.customer_email || "",
          tier,
        };
        localStorage.setItem("portfolio:license", JSON.stringify(record));
        setLicenseTier(tier);
        setLicenseModalSuccess(true);
        setTimeout(() => {
          setShowLicenseModal(false);
          setLicenseModalSuccess(false);
          setLicenseModalKey("");
          setLicenseModalError(null);
        }, 2000);
      } else {
        const msg = data.error || "license_key_invalid";
        if (msg.includes("activation_limit"))
          setLicenseModalError("This key has reached its activation limit. Contact support to reset it.");
        else
          setLicenseModalError("Invalid license key. Check for typos, or contact support.");
      }
    } catch {
      setLicenseModalError("Could not reach the license server. Check your internet connection and try again.");
    } finally {
      setLicenseModalLoading(false);
    }
  }

  async function refreshMarketPulse() {
    if (licenseTier === "basic") {
      setPulseError("AI Market Pulse refresh requires the Pro plan. Upgrade at portfolio-manager-for-canada.lemonsqueezy.com");
      return;
    }

    setPulseLoading(true);
    setPulseError(null);
    try {
      const live = await fetchLiveSignals();
      const prompt = buildMarketPulsePrompt(live);

      const res = await callClaude({
        model: "claude-sonnet-4-6",
        max_tokens: 16000,
        messages: [{ role: "user", content: prompt }],
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || err.error || `API error ${res.status}`);
      }

      const data = await res.json();
      if (data.stop_reason === "max_tokens") {
        throw new Error("Response was too long and got cut off — try again. If this persists, reduce the number of holdings or shorten the prompt.");
      }
      const text = data.content?.[0]?.text || "";

      // Strip optional markdown fences, then extract the outermost { … } block
      let stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const start = stripped.indexOf("{");
      const end   = stripped.lastIndexOf("}");
      if (start !== -1 && end > start) stripped = stripped.slice(start, end + 1);

      const parsed = JSON.parse(stripped);

      if (!parsed.regime || !parsed.macroSignals || !parsed.outlooks) {
        throw new Error("Response is missing required fields — try again.");
      }

      const ts = new Date().toISOString();
      setMarketPulse(parsed);
      setPulseRefreshedAt(ts);
      localStorage.setItem("pulse:cache", JSON.stringify(parsed));
      localStorage.setItem("pulse:refreshedAt", ts);
    } catch (e) {
      setPulseError(e.message);
    } finally {
      setPulseLoading(false);
    }
  }

  async function copyMarketPulsePrompt() {
    setPulseCopyLoading(true);
    setPulseCopied(false);
    setPulsePasteError(null);
    try {
      const live = await fetchLiveSignals();
      const prompt = buildMarketPulsePrompt(live);
      await navigator.clipboard.writeText(prompt);
      setPulseCopied(true);
      setPulsePasteOpen(true);
      setTimeout(() => setPulseCopied(false), 4000);
    } catch (e) {
      setPulseError("Could not copy: " + e.message);
    } finally {
      setPulseCopyLoading(false);
    }
  }

  function applyPastedPulse() {
    setPulsePasteError(null);
    try {
      // 1. Try to pull JSON out of a ```json ... ``` fence
      // 2. Fall back to finding the outermost { ... } in the text
      // 3. Last resort: parse the whole pasted text as-is
      let jsonStr = pulsePasteText;
      const fenceMatch = pulsePasteText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (fenceMatch) {
        jsonStr = fenceMatch[1].trim();
      } else {
        const start = pulsePasteText.indexOf("{");
        const end   = pulsePasteText.lastIndexOf("}");
        if (start !== -1 && end > start) jsonStr = pulsePasteText.slice(start, end + 1);
      }

      const parsed = JSON.parse(jsonStr);
      if (!parsed.regime || !parsed.macroSignals || !parsed.outlooks) {
        throw new Error("Missing required fields — make sure you pasted the full JSON response.");
      }
      const ts = new Date().toISOString();
      setMarketPulse(parsed);
      setPulseRefreshedAt(ts);
      localStorage.setItem("pulse:cache", JSON.stringify(parsed));
      localStorage.setItem("pulse:refreshedAt", ts);
      setPulsePasteText("");
      setPulsePasteOpen(false);
      setPulseApplyDone(true);
      setTimeout(() => setPulseApplyDone(false), 4000);
    } catch (e) {
      setPulsePasteError(e.message);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#080c16", color:"#f1f5f9",
      fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#080c16;margin:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:10px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.2)}
        input,button,select,textarea{font-family:inherit}
        input[type=number],input[type=text],textarea{
          background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);
          color:#f1f5f9;padding:8px 12px;border-radius:8px;font-size:13px;
          font-family:'JetBrains Mono',monospace;width:100%;transition:all 0.2s;
        }
        input[type=number]:focus,input[type=text]:focus,textarea:focus{
          outline:none;border-color:${accentColor};background:rgba(255,255,255,0.07);
          box-shadow:0 0 0 3px ${accentColor}18;
        }
        input[type=range]{accent-color:${accentColor};width:100%}
        .tab-btn{
          padding:7px 16px;border-radius:8px;font-size:12px;font-weight:500;
          border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);
          color:rgba(255,255,255,0.38);cursor:pointer;transition:all 0.2s;
          font-family:inherit;letter-spacing:0.03em;
        }
        .tab-btn.on{
          background:rgba(${accentRGB},0.15);border-color:${accentColor}55;
          color:${accentColor};box-shadow:0 0 20px ${accentColor}22;
        }
        .tab-btn:hover:not(.on){color:rgba(255,255,255,0.72);border-color:rgba(255,255,255,0.14);background:rgba(255,255,255,0.04)}
        .card{
          background:rgba(255,255,255,0.028);border:1px solid rgba(255,255,255,0.07);
          border-radius:14px;padding:18px 20px;transition:border-color 0.2s;
        }
        .card:hover{border-color:rgba(255,255,255,0.11)}
        .stat-card{
          position:relative;overflow:hidden;
          background:rgba(255,255,255,0.028);border:1px solid rgba(255,255,255,0.07);
          border-radius:14px;padding:14px 16px;transition:all 0.22s;
        }
        .stat-card::before{
          content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:var(--accent);border-radius:14px 14px 0 0;opacity:0.7;
        }
        .stat-card:hover{border-color:rgba(255,255,255,0.12);transform:translateY(-1px)}
        .th{
          text-align:left;font-size:10px;font-weight:600;letter-spacing:0.12em;
          color:rgba(255,255,255,0.28);text-transform:uppercase;padding:10px 14px;
          border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.025);
        }
        .td{
          padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.04);
          font-size:12px;color:rgba(255,255,255,0.68);vertical-align:middle;
          font-family:'JetBrains Mono',monospace;
        }
        .td-main{color:#f1f5f9;font-weight:500}
        .td input[type=number],.td input[type=text]{
          padding:5px 8px;font-size:13px;border-radius:6px;box-sizing:border-box;
        }
        .td-target input[type=number]{
          padding:6px 8px;font-size:15px;font-weight:700;
          color:#f1f5f9;text-align:center;
          background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.14);
        }
        .bar{height:4px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden;margin-top:5px}
        .bar-fill{height:100%;border-radius:2px;transition:width 0.5s cubic-bezier(.4,0,.2,1)}
        .pill{display:inline-block;padding:2px 9px;border-radius:5px;font-size:10px;font-weight:500;letter-spacing:0.03em}
        .hold{background:rgba(148,163,184,0.07);color:#94a3b8;border:1px solid rgba(148,163,184,0.14)}
        .new-tag{background:rgba(52,211,153,0.1);color:#34d399;border:1px solid rgba(52,211,153,0.22);
          padding:1px 7px;border-radius:4px;font-size:9px;font-weight:600;letter-spacing:0.06em}
        .sec{font-size:9.5px;letter-spacing:0.15em;text-transform:uppercase;
          color:rgba(255,255,255,0.27);margin-bottom:10px;font-weight:600}
        .btn{
          background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.58);padding:7px 14px;border-radius:8px;
          cursor:pointer;font-size:12px;transition:all 0.2s;white-space:nowrap;
        }
        .btn:hover{border-color:${accentColor}55;color:${accentColor};background:rgba(${accentRGB},0.07)}
        .btn-danger{border-color:rgba(244,63,94,0.22);color:rgba(244,63,94,0.65);background:rgba(244,63,94,0.04)}
        .btn-danger:hover{border-color:#f43f5e;color:#f43f5e;background:rgba(244,63,94,0.09)}
        .btn-primary{background:rgba(${accentRGB},0.1);border-color:${accentColor}50;color:${accentColor}}
        .btn-primary:hover{background:rgba(${accentRGB},0.18);border-color:${accentColor}}
        .dca-week{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);
          border-radius:10px;padding:14px 16px;margin-bottom:8px}
        .rec-card{
          background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);
          border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px;transition:all 0.22s;
        }
        .rec-card:hover{border-color:rgba(255,255,255,0.13);transform:translateY(-1px);box-shadow:0 8px 32px rgba(0,0,0,0.35)}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes slideUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .pulse{animation:pulse 1.5s ease infinite}
        .slide-up{animation:slideUp 0.25s ease forwards}
        .gap-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;
          border-radius:20px;font-size:10px;font-weight:500;letter-spacing:0.05em;
          background:rgba(249,115,22,0.1);color:#f97316;border:1px solid rgba(249,115,22,0.2);text-transform:capitalize}
        .add-form{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);
          border-radius:12px;padding:18px;margin-top:14px}
        .warn{background:rgba(249,115,22,0.05);border:1px solid rgba(249,115,22,0.16);
          border-left:3px solid #f97316;border-radius:10px;padding:11px 16px;
          font-size:11px;color:#f97316;line-height:1.65;margin-bottom:14px}
        .action-card{transition:filter 0.15s,border-color 0.2s}
        .action-card:hover{filter:brightness(1.12)}
        tbody tr:hover .td{background:rgba(255,255,255,0.02)}
        .buy-row .td{background:rgba(34,211,238,0.014)}
        .sell-row .td{background:rgba(244,63,94,0.014)}
        .action-divider{display:flex;align-items:center;gap:10px;margin-bottom:14px}
        .action-divider-bar{width:3px;border-radius:2px;flex-shrink:0}
      `}</style>

      {/* ── Header ── */}
      <div style={{ position:"sticky", top:0, zIndex:100 }}>
        <div style={{
          background:"rgba(8,12,22,0.88)", backdropFilter:"blur(24px) saturate(180%)",
          WebkitBackdropFilter:"blur(24px) saturate(180%)",
          padding:"13px 28px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          flexWrap:"wrap", gap:10
        }}>
          {/* Brand */}
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <AppLogo/>
            <div>
              <p style={{ fontSize:9, letterSpacing:"0.25em", color:`${accentColor}88`,
                textTransform:"uppercase", fontWeight:600, marginBottom:4 }}>
                PRB · DCA Planner
              </p>
              <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                <h1 style={{ fontFamily:"'Instrument Serif', serif", fontSize:20, fontWeight:400,
                  background:`linear-gradient(125deg, #f1f5f9 0%, ${accentColor} 48%, #a78bfa 100%)`,
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.1 }}>
                  Portfolio ReBalancer &amp; DCA Planner
                </h1>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            {saveStatus && (
              <span className="pulse" style={{ fontSize:11, color:accentColor, marginRight:4 }}>
                {saveStatus}
              </span>
            )}

            {/* Backup / Restore */}
            {backupStatus ? (
              <span style={{ fontSize:11, fontWeight:600, marginRight:4,
                color: backupStatus.startsWith("⚠") ? "#ef4444" : "#22c55e" }}>
                {backupStatus}
              </span>
            ) : autoSaveAt ? (
              <span title={`Auto-saved at ${new Date(autoSaveAt).toLocaleTimeString()}`}
                style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginRight:2,
                  display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", flexShrink:0,
                  background: (Date.now() - new Date(autoSaveAt).getTime()) < 2 * 60 * 1000
                    ? "#22c55e" : "rgba(255,255,255,0.2)" }} />
                {relTime(autoSaveAt)}
              </span>
            ) : null}

            {/* Cloud sync indicator */}
            {cloudSyncStatus === "syncing" && (
              <span style={{ fontSize:10, color:"#60a5fa", display:"flex", alignItems:"center", gap:3 }}>
                <span className="pulse">☁</span> Saving…
              </span>
            )}
            {cloudSyncStatus === "synced" && (
              <span style={{ fontSize:10, color:"#22c55e", display:"flex", alignItems:"center", gap:3 }}>
                ☁ Synced
              </span>
            )}
            {cloudSyncStatus === "error" && (
              <span style={{ fontSize:10, color:"#ef4444", display:"flex", alignItems:"center", gap:3 }}>
                ☁ Sync failed
              </span>
            )}
            {cloudSyncStatus === "idle" && cloudSyncedAt && (
              <span title={`Cloud synced at ${new Date(cloudSyncedAt).toLocaleTimeString()}`}
                style={{ fontSize:10, color:"rgba(255,255,255,0.3)", display:"flex", alignItems:"center", gap:3 }}>
                ☁ {relTime(cloudSyncedAt)}
              </span>
            )}
            <button className="btn" style={{ fontSize:11, padding:"6px 12px" }} onClick={exportData}
              title="Download a full backup — holdings, cash, contrib plan, FX rate, and Market Pulse cache">
              💾 Backup
            </button>
            <label className="btn" style={{ cursor:"pointer", fontSize:11, padding:"6px 12px" }}
              title="Restore from a JSON backup, or import holdings from CSV">
              📂 Restore / Import
              <input type="file" accept=".json,.csv,text/csv,application/json" style={{ display:"none" }} onChange={importData}/>
            </label>
            {licenseTier === "basic" ? (
              <a href={LS_CHECKOUT_PRO} target="_blank" rel="noreferrer" className="btn"
                style={{ fontSize:11, padding:"6px 12px", textDecoration:"none",
                  background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.3)",
                  color:"#fbbf24" }}
                title="AI Broker Import requires the Pro plan">
                🏦 Import from Broker — Pro only →
              </a>
            ) : (
              <label className="btn" style={{
                cursor: brokerImportLoading ? "wait" : "pointer",
                fontSize:11, padding:"6px 12px",
                background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.35)",
                color:"#fbbf24", opacity: brokerImportLoading ? 0.6 : 1,
              }} title="Upload your Wealthsimple holdings CSV — Claude will parse and import it automatically">
                {brokerImportLoading ? "⏳ Analysing…" : "🏦 Import from Broker"}
                <input type="file" accept=".csv,text/csv" style={{ display:"none" }}
                  disabled={brokerImportLoading}
                  onChange={importBrokerHoldings}/>
              </label>
            )}
            {/* Investor Profile button */}
            <button
              onClick={() => { setProfileDraft(investorProfile ? { ...investorProfile } : {}); setShowProfileModal(true); }}
              style={{ fontSize:11, padding:"6px 12px", borderRadius:7, cursor:"pointer",
                background: investorProfile ? "rgba(167,139,250,0.14)" : "rgba(255,255,255,0.05)",
                border: investorProfile ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.12)",
                color: investorProfile ? "#a78bfa" : "rgba(255,255,255,0.45)" }}
              title="Set your investor profile — personalises all AI suggestions">
              {investorProfile ? `👤 ${investorProfile.age}yr · ${investorProfile.riskTolerance}` : "👤 Set Profile"}
            </button>

            {/* AI monthly budget indicator */}
            {(() => {
              const pct = aiMonthlySpend / MONTHLY_AI_BUDGET;
              const color = pct >= 1 ? "#f43f5e" : pct >= 0.9 ? "#fb923c" : "#64748b";
              const label = `AI $${aiMonthlySpend.toFixed(2)} / $${MONTHLY_AI_BUDGET.toFixed(0)}`;
              return (
                <span title={`Monthly AI usage: $${aiMonthlySpend.toFixed(4)} of $${MONTHLY_AI_BUDGET.toFixed(2)}`}
                  style={{ fontSize:10, padding:"5px 10px", borderRadius:7, fontFamily:"'JetBrains Mono',monospace",
                    background:`${color}12`, border:`1px solid ${color}35`, color, userSelect:"none",
                    display:"flex", alignItems:"center", gap:5 }}>
                  🤖 {label}
                  <span style={{ display:"inline-block", width:32, height:4, borderRadius:2,
                    background:"rgba(255,255,255,0.08)", overflow:"hidden", verticalAlign:"middle" }}>
                    <span style={{ display:"block", height:"100%", borderRadius:2,
                      width:`${Math.min(pct * 100, 100).toFixed(1)}%`,
                      background: color, transition:"width 0.4s" }}/>
                  </span>
                </span>
              );
            })()}

            {/* License tier indicator */}
            <button
              onClick={() => { setLicenseModalKey(""); setLicenseModalError(null); setLicenseModalSuccess(false); setShowLicenseModal(true); }}
              style={{ fontSize:11, padding:"5px 10px", borderRadius:7, cursor:"pointer",
                background: licenseTier === "basic" ? "rgba(251,191,36,0.12)" : "rgba(34,197,94,0.08)",
                border: licenseTier === "basic" ? "1px solid rgba(251,191,36,0.35)" : "1px solid rgba(34,197,94,0.2)",
                color: licenseTier === "basic" ? "#fbbf24" : "#4ade80" }}
              title={licenseTier === "basic" ? "Basic plan — click to upgrade to Pro" : "Pro plan — click to manage license"}>
              {licenseTier === "basic" ? "⬆ Basic → Pro" : "✓ Pro"}
            </button>
            {brokerImportError && (
              <span style={{ fontSize:11, color:"#f87171", maxWidth:260 }}>
                ⚠ {brokerImportError}
                <button onClick={() => setBrokerImportError(null)}
                  style={{ marginLeft:6, background:"none", border:"none", color:"#f87171", cursor:"pointer" }}>✕</button>
              </span>
            )}
            {showReset ? (
              <>
                <button className="btn btn-danger" onClick={doReset} style={{ fontSize:11, padding:"6px 12px" }}>
                  Confirm Reset
                </button>
                <button className="btn" onClick={() => setShowReset(false)}
                  style={{ fontSize:11, padding:"6px 10px" }}>✕</button>
              </>
            ) : (
              <button className="btn" onClick={() => setShowReset(true)}
                style={{ fontSize:11, padding:"6px 10px" }}>↻</button>
            )}

            <div style={{ width:1, height:22, background:"rgba(255,255,255,0.08)", margin:"0 4px" }}/>

            {/* Portfolio tabs */}
            {portfolios.map(p => (
              <button key={p} className={`tab-btn ${account===p?"on":""}`}
                style={{ padding:"5px 12px", fontSize:11 }}
                onClick={() => { setAccount(p); setShowReset(false); setPendingRemove(null); }}>
                {p === "TFSA" ? "💰 TFSA" : p === "RRSP" ? "🏦 RRSP" : `📁 ${p}`}
              </button>
            ))}

            {addPortfolioForm !== null ? (
              <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                <input type="text" value={addPortfolioForm}
                  onChange={e => setAddPortfolioForm(e.target.value.toUpperCase())}
                  onKeyDown={e => {
                    if (e.key === "Enter") addPortfolio(addPortfolioForm);
                    if (e.key === "Escape") setAddPortfolioForm(null);
                  }}
                  placeholder="NAME" autoFocus style={{ width:88, fontSize:11, padding:"5px 8px" }}/>
                <button className="btn btn-primary" onClick={() => addPortfolio(addPortfolioForm)}
                  style={{ fontSize:11, padding:"5px 10px" }}>Add</button>
                <button className="btn" onClick={() => setAddPortfolioForm(null)}
                  style={{ fontSize:11, padding:"5px 8px" }}>✕</button>
              </div>
            ) : (
              <button className="btn" onClick={() => setAddPortfolioForm("")}
                style={{ fontSize:11, padding:"5px 10px" }}>+ Portfolio</button>
            )}
            {!["TFSA","RRSP"].includes(account) && (
              <button className="btn btn-danger" onClick={() => removePortfolio(account)}
                style={{ fontSize:11, padding:"5px 10px" }}>✕ Delete</button>
            )}
          </div>
        </div>
        {/* Dynamic gradient accent line under header */}
        <div style={{
          height:1,
          background:`linear-gradient(90deg, transparent 0%, ${accentColor}55 25%, ${accentColor}55 75%, transparent 100%)`
        }}/>
      </div>

      {/* ── Concentration warning ── */}
      {concentrationWarnings.length > 0 && (
        <div style={{ padding:"12px 28px 0" }}>
          <div className="warn" style={{ marginBottom:0, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:16 }}>⚠</span>
            <span>
              Concentration risk in {account}:{" "}
              {concentrationWarnings.map(h => {
                const pct = ((toCAD(h.current, h.ticker, h.currencyOverride) / currentTotal) * 100).toFixed(1);
                const limit = BROAD_ETFS.has(h.ticker) ? 25 : 15;
                return (
                  <strong key={h.ticker} style={{ color:"#f97316" }}>
                    {h.ticker} ({pct}% &gt; {limit}% limit)
                  </strong>
                );
              }).reduce((a, b) => [a, ", ", b])}{" "}
              — individual stocks should stay under 15%, broad ETFs under 25%.
            </span>
          </div>
        </div>
      )}

      {/* ── Under-diversification warning ── */}
      {underDiversified && (
        <div style={{ padding:"12px 28px 0" }}>
          <div style={{
            display:"flex", alignItems:"flex-start", gap:10, padding:"10px 14px",
            background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.25)",
            borderRadius:8, fontSize:12, color:"rgba(255,255,255,0.8)",
          }}>
            <span style={{ fontSize:16, flexShrink:0 }}>📊</span>
            <span>
              <strong style={{ color:"#fbbf24" }}>Under-diversified</strong> — {totalHoldingsCount} position{totalHoldingsCount !== 1 ? "s" : ""} across all accounts.
              Research shows 15–25 stocks across sectors captures &gt;95% of diversification benefits
              with a manageable watchlist. Consider adding positions to reach the sweet spot.
            </span>
          </div>
        </div>
      )}

      {/* ── Near holdings cap soft warning ── */}
      {nearHoldingsCap && (
        <div style={{ padding:"12px 28px 0" }}>
          <div style={{
            display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
            background:"rgba(249,115,22,0.06)", border:"1px solid rgba(249,115,22,0.25)",
            borderRadius:8, fontSize:12, color:"rgba(255,255,255,0.8)",
          }}>
            <span style={{ fontSize:16 }}>📋</span>
            <span>
              <strong style={{ color:"#f97316" }}>Approaching maximum</strong> — {totalHoldingsCount}/30 holdings.
              The optimal range is <strong style={{ color:"#f97316" }}>15–25</strong> positions; beyond 25 you risk "diworsification" — more complexity with minimal added diversification.
            </span>
          </div>
        </div>
      )}

      {/* ── 4× take-profit alerts ── */}
      {fourXAlerts.length > 0 && (
        <div style={{ padding:"12px 28px 0" }}>
          <div style={{
            display:"flex", alignItems:"flex-start", gap:10, padding:"12px 14px",
            background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.3)",
            borderRadius:8,
          }}>
            <span style={{ fontSize:18, flexShrink:0 }}>💰</span>
            <div style={{ fontSize:12, lineHeight:1.6, color:"rgba(255,255,255,0.85)" }}>
              <strong style={{ color:"#fbbf24" }}>Take-profit signal:</strong>{" "}
              {fourXAlerts.map((h, i) => (
                <span key={h.ticker + h.acct}>
                  <strong style={{ color:"#fbbf24" }}>{h.ticker}</strong>
                  <span style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}> ({h.acct})</span>
                  {" "}is up <strong style={{ color:"#34d399" }}>{h.multiple}×</strong> your cost basis
                  {i < fourXAlerts.length - 1 ? "; " : ""}
                </span>
              ))}
              {" "}— consider trimming to lock in gains and redeploy into underweight positions.
            </div>
          </div>
        </div>
      )}

      {/* ── Holdings cap warning ── */}
      {atHoldingsCap && (
        <div style={{ padding:"12px 28px 0" }}>
          <div style={{
            display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
            background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.3)",
            borderRadius:8, fontSize:12, color:"rgba(255,255,255,0.8)",
          }}>
            <span style={{ fontSize:16 }}>🚫</span>
            <span>
              <strong style={{ color:"#ef4444" }}>Portfolio at maximum ({totalHoldingsCount}/30 holdings)</strong>{" "}
              — the optimal range is 15–25 positions. Consider consolidating before adding new ones.
            </span>
          </div>
        </div>
      )}

      {/* ── Summary cards ── */}
      <div style={{ padding:"18px 28px 0", display:"grid",
        gridTemplateColumns:"repeat(auto-fit, minmax(152px, 1fr))", gap:10 }}>

        {/* Cash — always CAD */}
        <div className="stat-card" style={{ "--accent":"#34d399" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Cash CAD ({account})</p>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
            <span style={{ fontSize:13, color:"rgba(255,255,255,0.22)", fontFamily:"'JetBrains Mono',monospace" }}>C$</span>
            <input type="number" value={cash || ""} onChange={e => handleCash(e.target.value)}
              placeholder="0"
              style={{ fontSize:21, fontWeight:600, color:"#34d399", border:"none",
                background:"transparent", padding:0, width:"100%",
                fontFamily:"'JetBrains Mono',monospace" }}/>
          </div>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>available to invest</p>
        </div>

        {/* USD → CAD Rate */}
        <div className="stat-card" style={{ "--accent":"#60a5fa" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>USD → CAD Rate</p>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
            <input type="number" value={usdCadRate} step="0.001" min="1" max="2"
              onChange={e => { const r = Number(e.target.value) || 1.38; setUsdCadRate(r); persistFxRate(r); }}
              style={{ fontSize:21, fontWeight:600, color:"#60a5fa", border:"none",
                background:"transparent", padding:0, width:"100%",
                fontFamily:"'JetBrains Mono',monospace" }}/>
          </div>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>1 USD = {usdCadRate} CAD</p>
        </div>

        {/* Total invested — in CAD */}
        <div className="stat-card" style={{ "--accent":"#64748b" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Total invested</p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color: totalCostBasis > 0 ? "#94a3b8" : "rgba(255,255,255,0.18)", marginBottom:4 }}>
            {totalCostBasis > 0 ? `C$${Math.round(totalCostBasis).toLocaleString()}` : "—"}
          </p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>cost basis (CAD)</p>
        </div>

        {/* Portfolio value — in CAD */}
        <div className="stat-card" style={{ "--accent":accentColor }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Portfolio value</p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color:accentColor, marginBottom:4 }}>
            C${Math.round(currentTotal).toLocaleString()}
          </p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>market value (CAD)</p>
        </div>

        {/* Unrealized P&L — in CAD */}
        {totalPnL !== null && (
          <div className="stat-card"
            style={{ "--accent": totalPnL >= 0 ? "#34d399" : "#f43f5e" }}>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
              marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Unrealized P&amp;L</p>
            <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
              color: totalPnL >= 0 ? "#34d399" : "#f43f5e", marginBottom:4 }}>
              {totalPnL >= 0 ? "+" : ""}C${Math.round(totalPnL).toLocaleString()}
            </p>
            <p style={{ fontSize:9, color: totalPnL >= 0 ? "#34d399" : "#f43f5e", opacity:0.8 }}>
              {totalPnLPct >= 0 ? "+" : ""}{totalPnLPct.toFixed(1)}% total return
            </p>
          </div>
        )}

        {/* Annual dividends — in CAD */}
        {annualDivIncome > 1 && (
          <div className="stat-card" style={{ "--accent":"#a78bfa" }}>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
              marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Annual dividends</p>
            <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
              color:"#a78bfa", marginBottom:4 }}>
              C${Math.round(annualDivIncome).toLocaleString()}
            </p>
            {account === "TFSA" && whtEstimate > 1 ? (
              <p style={{ fontSize:9, color:"#f97316" }}>−C${Math.round(whtEstimate)} WHT/yr</p>
            ) : (
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>estimated/yr (CAD)</p>
            )}
          </div>
        )}

        {/* After deploy — in CAD */}
        <div className="stat-card" style={{ "--accent":"#7c3aed" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>After deploy</p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color:"#c4b5fd", marginBottom:4 }}>
            C${Math.round(newTotal).toLocaleString()}
          </p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>portfolio + cash (CAD)</p>
        </div>

        {/* To buy — in CAD */}
        <div className="stat-card" style={{ "--accent":"#22d3ee" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>To buy</p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color:"#22d3ee", marginBottom:4 }}>
            C${Math.round(totalBuys).toLocaleString()}
          </p>
          <p style={{ fontSize:9, color: isCashConstrained ? "#f97316" : "rgba(255,255,255,0.22)" }}>
            {isCashConstrained ? "scaled to cash" : "at target weights"}
          </p>
        </div>

        {/* Cash remaining / To sell — in CAD */}
        <div className="stat-card" style={{
          "--accent": rebalMode==="full" ? "#f43f5e" : cashRemaining > 0 ? "#34d399" : "#475569"
        }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>
            {rebalMode === "full" ? "To sell" : "Cash remaining"}
          </p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color: rebalMode==="full" ? "#f43f5e" : cashRemaining > 0 ? "#34d399" : "#475569",
            marginBottom:4 }}>
            C${Math.round(rebalMode === "full" ? totalSells : cashRemaining).toLocaleString()}
          </p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>
            {rebalMode === "full" ? "overweight positions" : "after all buys"}
          </p>
        </div>
      </div>

      {/* ── AI budget warning banner ── */}
      {(() => {
        const pct = aiMonthlySpend / MONTHLY_AI_BUDGET;
        const atLimit = pct >= 1;
        const nearLimit = pct >= 0.9 && !atLimit;
        if ((!nearLimit && !atLimit) || aiBudgetDismissed) return null;
        const bg    = atLimit ? "rgba(244,63,94,0.10)"  : "rgba(251,146,60,0.08)";
        const bdr   = atLimit ? "rgba(244,63,94,0.35)"  : "rgba(251,146,60,0.35)";
        const color = atLimit ? "#f43f5e" : "#fb923c";
        const msg   = atLimit
          ? `Monthly AI budget of $${MONTHLY_AI_BUDGET.toFixed(2)} reached — AI features are disabled until the 1st of next month.`
          : `AI usage at ${(pct * 100).toFixed(0)}% of the $${MONTHLY_AI_BUDGET.toFixed(2)} monthly budget ($${aiMonthlySpend.toFixed(2)} used). Approaching limit.`;
        return (
          <div style={{ margin:"0 28px", marginTop:10, padding:"10px 14px",
            background:bg, border:`1px solid ${bdr}`, borderRadius:9,
            display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:13 }}>{atLimit ? "🚫" : "⚠️"}</span>
            <span style={{ flex:1, fontSize:12, color, lineHeight:1.5 }}>{msg}</span>
            {!atLimit && (
              <button onClick={() => setAiBudgetDismissed(true)}
                style={{ flexShrink:0, fontSize:10, padding:"3px 9px", borderRadius:5,
                  cursor:"pointer", background:"transparent",
                  border:`1px solid ${bdr}`, color }}>
                Dismiss
              </button>
            )}
          </div>
        );
      })()}

      {/* ── Tab bar ── */}
      <div style={{ padding:"20px 28px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", paddingBottom:0 }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[["dashboard","📊 Dashboard"],["rebalance","⚖️ Rebalance"],["dca","📅 DCA Plan"],["targets","🎯 Edit Targets"],
            ["recommend","💡 Ideas"],["search","🔍 Search"],["pulse","📡 Market Pulse"],["scanner","🔎 Scanner"],["options","⚡ Options"],["advisor","🧠 AI Advisor"],["help","📖 Help"]].map(([v,l]) => {
            const locked = !helpUnlocked && v !== "help";
            return (
              <button key={v} className={`tab-btn ${tab===v?"on":""}`}
                onClick={() => tryNavigate(v)}
                title={locked ? "Please read the Help guide first" : undefined}
                style={{ borderBottom:"none", borderRadius:"8px 8px 0 0", marginBottom:0, paddingBottom:10,
                  opacity: locked ? 0.32 : 1,
                  cursor: locked ? "not-allowed" : "pointer",
                  filter: locked ? "grayscale(0.6)" : "none",
                  transition:"opacity 0.2s" }}>
                {l}
              </button>
            );
          })}
        </div>
        {helpNudge && (
          <div style={{
            position:"absolute", zIndex:200,
            background:"#1e293b", border:"1px solid rgba(251,191,36,0.45)",
            borderRadius:10, padding:"10px 16px", fontSize:13, color:"#fbbf24",
            boxShadow:"0 8px 24px rgba(0,0,0,0.5)", marginTop:4,
            display:"flex", alignItems:"center", gap:8, maxWidth:360,
          }}>
            <span style={{ fontSize:16 }}>📖</span>
            <span>Please read the <strong>Help guide</strong> first — click <em>"Start using the app →"</em> when ready.</span>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB: REBALANCE
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "rebalance" && (
        <div style={{ padding:"22px 28px" }}>
          {/* Buy Radar — compact */}
          {(buyRadarData.inZone.length > 0 || buyRadarData.nearZone.length > 0) && (() => {
            const pFmt = p => p < 10 ? p.toFixed(2) : p < 100 ? p.toFixed(1) : Math.round(p);
            return (
              <div className="card" style={{ marginBottom:14, padding:"12px 16px",
                borderColor:"rgba(34,197,94,0.2)", background:"rgba(34,197,94,0.02)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                  <span style={{ fontSize:13 }}>🎯</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"#f1f5f9" }}>Buy Radar</span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>prioritise these when deploying cash</span>
                  <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                    {buyRadarData.inZone.length > 0 && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)", color:"#22c55e", fontWeight:700 }}>{buyRadarData.inZone.length} in zone</span>}
                    {buyRadarData.nearZone.length > 0 && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)", color:"#fbbf24", fontWeight:700 }}>{buyRadarData.nearZone.length} approaching</span>}
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {buyRadarData.inZone.slice(0, 6).map(s => (
                    <div key={s.ticker} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:8,
                      background: s.held ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                      border: s.held ? "1px solid rgba(34,197,94,0.28)" : "1px solid rgba(34,197,94,0.18)" }}>
                      <span style={{ fontSize:11, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>{s.ticker}</span>
                      {s.held && <span style={{ fontSize:8, color:"#22d3ee", fontWeight:700 }}>held</span>}
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>${pFmt(s.price)}</span>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>→</span>
                      <span style={{ fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>buy@${pFmt(s.fairPrice)}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:"#22c55e" }}>+{s.upside}%</span>
                    </div>
                  ))}
                  {buyRadarData.nearZone.slice(0, 5).map(s => (
                    <div key={s.ticker} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:8,
                      background: s.held ? "rgba(251,191,36,0.05)" : "rgba(255,255,255,0.02)",
                      border:"1px solid rgba(251,191,36,0.18)" }}>
                      <span style={{ fontSize:11, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>{s.ticker}</span>
                      {s.held && <span style={{ fontSize:8, color:"#22d3ee", fontWeight:700 }}>held</span>}
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>${pFmt(s.price)}</span>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>→</span>
                      <span style={{ fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>trigger@${pFmt(s.fairPrice)}</span>
                      <span style={{ fontSize:10, color:"#fbbf24" }}>{Math.abs(s.upside).toFixed(1)}% away</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <div className="card" style={{ marginBottom:16, display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ flex:"1 1 220px" }}>
              <p className="sec">Cash available to deploy — CAD ({account})</p>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20, color:"rgba(255,255,255,0.4)" }}>C$</span>
                <input type="number" value={cash || ""} onChange={e => handleCash(e.target.value)}
                  placeholder="0" style={{ fontSize:22, fontWeight:500, color:"#34d399", maxWidth:200 }}/>
              </div>
            </div>
            <div style={{ flex:"1 1 240px" }}>
              <p className="sec">Quick add</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[500,1000,2500,5000,7000,10000].map(v => (
                  <button key={v} className="btn" onClick={() => handleCash(cash + v)}>+C${v.toLocaleString()}</button>
                ))}
              </div>
            </div>
            <div style={{ flex:"0 0 auto" }}>
              <p className="sec">Mode</p>
              <div style={{ display:"flex", gap:6 }}>
                <button className={`tab-btn ${rebalMode==="cash"?"on":""}`}
                  onClick={() => setRebalMode("cash")} style={{ fontSize:11, padding:"5px 12px" }}>
                  Cash-only
                </button>
                <button className={`tab-btn ${rebalMode==="full"?"on":""}`}
                  onClick={() => setRebalMode("full")} style={{ fontSize:11, padding:"5px 12px" }}>
                  Full rebalance
                </button>
              </div>
            </div>
            <div style={{ flex:"0 0 170px" }}>
              <p className="sec">Contribution limits (2026)</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>TFSA: C$7,000/yr</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>RRSP: C$32,490/yr</p>
            </div>
          </div>

          {isCashConstrained && (
            <div className="warn">
              ⚠ Buys scaled to cash: optimal deploy is C${Math.round(rawBuyTotal).toLocaleString()} but
              only C${Math.round(cash).toLocaleString()} available — each position scaled to {(scaleFactor*100).toFixed(0)}% of optimal.
            </div>
          )}

          {/* ── WHT sell recommendations ───────────────────────────────── */}
          {whtSellRecs.length > 0 && (
            <div style={{ marginBottom:22 }}>
              <div className="action-divider">
                <div className="action-divider-bar" style={{ height:20, background:"#fb923c" }}/>
                <p className="sec" style={{ marginBottom:0, color:"#fb923c" }}>
                  WHT Alert — {whtSellRecs.length} position{whtSellRecs.length>1?"s":""} bleeding
                  ~${Math.round(whtSellRecs.reduce((s,h)=>s+h.annualWHT,0)).toLocaleString()}/yr to IRS withholding in {account}
                </p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {whtSellRecs.map(h => (
                  <div key={h.ticker} className="action-card" style={{
                    background:"rgba(251,146,60,0.04)",
                    border:"1px solid rgba(251,146,60,0.18)",
                    borderLeft:"3px solid #fb923c",
                    borderRadius:10, padding:"14px 18px",
                    display:"flex", gap:20, flexWrap:"wrap", alignItems:"center"
                  }}>
                    {/* Ticker */}
                    <div style={{ minWidth:90 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                        <span style={{ fontSize:16, fontFamily:"'JetBrains Mono',monospace",
                          fontWeight:700, color:"#fb923c" }}>{h.ticker}</span>
                        {h.priority && (
                          <span style={{ fontSize:9, padding:"1px 6px", borderRadius:3,
                            background:"rgba(239,68,68,0.15)", color:"#ef4444",
                            border:"1px solid rgba(239,68,68,0.3)", fontWeight:700,
                            letterSpacing:"0.05em" }}>PRIORITY</span>
                        )}
                      </div>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{h.name}</p>
                    </div>

                    {/* Reason */}
                    <div style={{ flex:"1 1 260px" }}>
                      <div style={{ marginBottom:7 }}>
                        <span style={{ fontSize:11, padding:"3px 10px", borderRadius:4,
                          background:"rgba(239,68,68,0.1)", color:"#ef4444",
                          border:"1px solid rgba(239,68,68,0.22)",
                          fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>
                          ▼ SELL · MOVE TO RRSP
                        </span>
                      </div>
                      <p style={{ fontSize:12, color:"rgba(255,255,255,0.65)", lineHeight:1.65 }}>
                        <span style={{ color:"#ef4444", fontWeight:700 }}>
                          ~${Math.round(h.annualWHT).toLocaleString()}/yr
                        </span>{" "}
                        lost to IRS — 15% withholding × {h.divYield}% yield × ${Math.round(h.current).toLocaleString()} position value
                      </p>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.38)", marginTop:5 }}>
                        Moving to RRSP recovers this permanently under Canada-US Tax Treaty (Article XXI).
                        RRSP exempts US dividends from the 15% withholding that TFSA does not.
                      </p>
                    </div>

                    {/* Math breakdown */}
                    <div style={{ textAlign:"right", minWidth:120,
                      borderLeft:"1px solid rgba(255,255,255,0.06)", paddingLeft:16 }}>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:4 }}>Annual dividend</p>
                      <p style={{ fontSize:17, fontFamily:"'JetBrains Mono',monospace",
                        fontWeight:700, color:"#a78bfa" }}>
                        ${Math.round(h.annualDiv).toLocaleString()}
                      </p>
                      <div style={{ marginTop:6, borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:6 }}>
                        <p style={{ fontSize:10, color:"#ef4444" }}>
                          − ${Math.round(h.annualWHT).toLocaleString()} kept by IRS
                        </p>
                        <p style={{ fontSize:10, color:"#34d399", marginTop:3 }}>
                          = ${Math.round(h.annualDiv - h.annualWHT).toLocaleString()} you receive
                        </p>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:4 }}>
                          {h.divYield}% yield → effective {(h.divYield * 0.85).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.22)", paddingLeft:4 }}>
                  Total WHT drag: ~${Math.round(whtSellRecs.reduce((s,h)=>s+h.annualWHT,0)).toLocaleString()}/yr ·
                  This compounds against you every year the positions stay in {account}
                </p>
              </div>
            </div>
          )}

          {/* ── Buy recommendations ────────────────────────────────────── */}
          {enrichedBuys.length > 0 && (
            <div style={{ marginBottom:22 }}>
              <div className="action-divider">
                <div className="action-divider-bar" style={{ height:20, background:"#22d3ee" }}/>
                <p className="sec" style={{ marginBottom:0, color:"#22d3ee" }}>
                  Buy plan — C${Math.round(totalBuys).toLocaleString()} across {enrichedBuys.length} position{enrichedBuys.length>1?"s":""}
                  {isCashConstrained ? ` · scaled to C${Math.round(cash).toLocaleString()} cash` : ""}
                </p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {enrichedBuys.map((h, rank) => (
                  <div key={h.ticker} className="action-card" style={{
                    background:"rgba(34,211,238,0.025)",
                    border:"1px solid rgba(34,211,238,0.1)",
                    borderLeft:"3px solid #22d3ee",
                    borderRadius:10, padding:"14px 18px",
                    display:"flex", gap:20, flexWrap:"wrap", alignItems:"center"
                  }}>
                    {/* Rank + Ticker */}
                    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:115 }}>
                      <span style={{ fontSize:17, fontFamily:"'JetBrains Mono',monospace",
                        color:"rgba(255,255,255,0.1)", fontWeight:700, minWidth:22, textAlign:"right" }}>
                        {rank + 1}
                      </span>
                      <div>
                        <p style={{ fontSize:16, fontFamily:"'JetBrains Mono',monospace",
                          fontWeight:700, color:"#22d3ee" }}>{h.ticker}</p>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{h.name}</p>
                      </div>
                    </div>

                    {/* Reasons */}
                    <div style={{ flex:"1 1 260px" }}>
                      {h.reasons.map((r, i) => (
                        <p key={i} style={{
                          fontSize: i===0 ? 12 : 11,
                          color: i===0 ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.4)",
                          fontWeight: i===0 ? 500 : 400,
                          lineHeight:1.65, marginTop: i===0 ? 0 : 4
                        }}>
                          {i > 0 && <span style={{ opacity:0.4, marginRight:5 }}>↳</span>}{r}
                        </p>
                      ))}
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign:"right", minWidth:120,
                      borderLeft:"1px solid rgba(255,255,255,0.06)", paddingLeft:16 }}>
                      <span style={{ fontSize:10, padding:"2px 10px", borderRadius:4,
                        background:"rgba(34,211,238,0.1)", color:"#22d3ee",
                        border:"1px solid rgba(34,211,238,0.22)",
                        fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                        display:"block", marginBottom:7, textAlign:"center" }}>
                        ▲ BUY
                      </span>
                      <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace",
                        fontWeight:700, color:"#22d3ee" }}>
                        {fmtAmt(h.deltaNative, h.ticker, h.currencyOverride)}
                      </p>
                      {isCashConstrained && Math.round(h.rawDelta) !== Math.round(h.delta) && (
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:3 }}>
                          full: {fmtAmt(h.rawDeltaNative, h.ticker, h.currencyOverride)}
                        </p>
                      )}
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:4 }}>
                        {h.currentPct.toFixed(1)}% → {h.target}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Full breakdown table ───────────────────────────────────── */}
          <p className="sec" style={{ marginBottom:8 }}>Full breakdown — {account}</p>
          <div className="card" style={{ padding:0, overflow:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:980 }}>
              <thead>
                <tr>
                  {(() => {
                    const onSort = col => setRebalSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
                    return (<>
                      <SortTh col="ticker"      label="Ticker"    sort={rebalSort} onSort={onSort} className="th" />
                      <SortTh col="status"      label="Status"    sort={rebalSort} onSort={onSort} className="th" />
                      <SortTh col="current"     label="Current $" sort={rebalSort} onSort={onSort} className="th" style={{ textAlign:"right" }} />
                      <SortTh col="pnl"         label="P&L"       sort={rebalSort} onSort={onSort} className="th" style={{ textAlign:"right" }} />
                      <SortTh col="currentPct"  label="Current %" sort={rebalSort} onSort={onSort} className="th" style={{ textAlign:"right" }} />
                      <SortTh col="targetPct"   label="Target %"  sort={rebalSort} onSort={onSort} className="th" style={{ textAlign:"right" }} />
                      <SortTh col="targetDollar" label="Target $" sort={rebalSort} onSort={onSort} className="th" style={{ textAlign:"right" }} />
                      <th className="th" style={{ textAlign:"right" }}>Action</th>
                      <th className="th">Allocation</th>
                    </>);
                  })()}
                </tr>
              </thead>
              <tbody>
                {sortRows(rebalance, rebalSort.col, rebalSort.dir, (h, col) => ({
                  ticker: h.ticker, status: h.locked || "",
                  current: h.current, pnl: h.costBasis > 0 ? h.current - h.costBasis : null,
                  currentPct: h.currentPct, targetPct: h.target, targetDollar: h.targetDollar,
                }[col] ?? null)).map(h => {
                  const action    = Math.abs(h.delta) < 5 ? "hold" : h.delta > 0 ? "buy" : "sell";
                  const cb        = h.costBasis || 0;
                  const posPnl    = cb > 0 ? h.current - cb : null;
                  const posPnlPct = cb > 0 ? ((h.current - cb) / cb) * 100 : null;
                  return (
                    <tr key={h.ticker}
                      className={action==="buy" ? "buy-row" : action==="sell" ? "sell-row" : ""}>
                      <td className="td td-main">
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <strong style={{ color:accentColor }}>{h.ticker}</strong>
                          {h.locked?.includes("NEW") && <span className="new-tag">NEW</span>}
                          {h.locked?.includes("FROM TFSA") && <span className="new-tag" style={{ background:"rgba(251,146,60,0.12)", color:"#fb923c", borderColor:"rgba(251,146,60,0.3)" }}>FROM TFSA</span>}
                        </div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{h.name}</div>
                      </td>
                      <td className="td"><span className="pill hold">{h.locked}</span></td>
                      <td className="td" style={{ textAlign:"right" }}>{fmtAmt(h.currentDollarNative, h.ticker, h.currencyOverride)}</td>
                      <td className="td" style={{ textAlign:"right" }}>
                        {posPnl !== null ? (
                          <div>
                            <span style={{ color: posPnl >= 0 ? "#34d399" : "#ef4444" }}>
                              {posPnl >= 0 ? "+" : ""}${Math.round(posPnl).toLocaleString()}
                            </span>
                            <div style={{ fontSize:10, color: posPnl >= 0 ? "#34d399" : "#ef4444", opacity:0.75 }}>
                              {posPnlPct >= 0 ? "+" : ""}{posPnlPct.toFixed(1)}%
                            </div>
                          </div>
                        ) : <span style={{ color:"rgba(255,255,255,0.2)", fontSize:11 }}>—</span>}
                      </td>
                      <td className="td" style={{ textAlign:"right", color:"rgba(255,255,255,0.5)" }}>{h.currentPct.toFixed(1)}%</td>
                      <td className="td" style={{ textAlign:"right", color:accentColor }}>{h.target}%</td>
                      <td className="td" style={{ textAlign:"right" }}>C${Math.round(h.targetDollar).toLocaleString()}</td>
                      <td className="td" style={{ textAlign:"right" }}>
                        {action==="buy"  && <span style={{ color:"#22d3ee" }}>▲ BUY {fmtAmt(h.deltaNative, h.ticker, h.currencyOverride)}</span>}
                        {action==="sell" && <span style={{ color:"#ef4444" }}>▼ SELL {fmtAmt(Math.abs(h.deltaNative), h.ticker, h.currencyOverride)}</span>}
                        {action==="hold" && <span style={{ color:"#94a3b8" }}>● HOLD</span>}
                        {rebalMode === "cash" && h.rawDelta < 0 && (
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)", marginTop:2 }}>overweight</div>
                        )}
                      </td>
                      <td className="td" style={{ minWidth:140 }}>
                        <div style={{ position:"relative", height:14 }}>
                          <div className="bar" style={{ position:"absolute", top:3, width:"100%" }}>
                            <div className="bar-fill" style={{ width:`${(h.currentPct/maxAlloc)*100}%`, background:"rgba(148,163,184,0.4)" }}/>
                          </div>
                          <div className="bar" style={{ position:"absolute", top:8, width:"100%", background:"transparent" }}>
                            <div className="bar-fill" style={{ width:`${(h.target/maxAlloc)*100}%`, background:accentColor }}/>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: DCA PLAN
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "dca" && (
        <div style={{ padding:"22px 28px" }}>
          {/* Buy Radar — compact */}
          {(buyRadarData.inZone.length > 0 || buyRadarData.nearZone.length > 0) && (() => {
            const pFmt = p => p < 10 ? p.toFixed(2) : p < 100 ? p.toFixed(1) : Math.round(p);
            return (
              <div className="card" style={{ marginBottom:14, padding:"12px 16px",
                borderColor:"rgba(34,197,94,0.2)", background:"rgba(34,197,94,0.02)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                  <span style={{ fontSize:13 }}>🎯</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"#f1f5f9" }}>Buy Radar</span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>DCA into these — already at or near fair value</span>
                  <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                    {buyRadarData.inZone.length > 0 && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)", color:"#22c55e", fontWeight:700 }}>{buyRadarData.inZone.length} in zone</span>}
                    {buyRadarData.nearZone.length > 0 && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)", color:"#fbbf24", fontWeight:700 }}>{buyRadarData.nearZone.length} approaching</span>}
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {buyRadarData.inZone.slice(0, 6).map(s => (
                    <div key={s.ticker} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:8,
                      background: s.held ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                      border: s.held ? "1px solid rgba(34,197,94,0.28)" : "1px solid rgba(34,197,94,0.18)" }}>
                      <span style={{ fontSize:11, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>{s.ticker}</span>
                      {s.held && <span style={{ fontSize:8, color:"#22d3ee", fontWeight:700 }}>held</span>}
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>${pFmt(s.price)}</span>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>→</span>
                      <span style={{ fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>buy@${pFmt(s.fairPrice)}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:"#22c55e" }}>+{s.upside}%</span>
                    </div>
                  ))}
                  {buyRadarData.nearZone.slice(0, 5).map(s => (
                    <div key={s.ticker} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:8,
                      background: s.held ? "rgba(251,191,36,0.05)" : "rgba(255,255,255,0.02)",
                      border:"1px solid rgba(251,191,36,0.18)" }}>
                      <span style={{ fontSize:11, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>{s.ticker}</span>
                      {s.held && <span style={{ fontSize:8, color:"#22d3ee", fontWeight:700 }}>held</span>}
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>${pFmt(s.price)}</span>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>→</span>
                      <span style={{ fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>trigger@${pFmt(s.fairPrice)}</span>
                      <span style={{ fontSize:10, color:"#fbbf24" }}>{Math.abs(s.upside).toFixed(1)}% away</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ flex:"1 1 280px" }}>
                <p className="sec">Spread buying over weeks (DCA)</p>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:0.5 }}>Cadence</span>
                  {CONTRIB_FREQUENCY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`tab-btn ${contribFrequency===opt.value?"on":""}`}
                      onClick={() => handleContribFrequency(opt.value)}
                      style={{ padding:"4px 10px", fontSize:10 }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <input type="range" min={4} max={26} value={dcaWeeks}
                    onChange={e => setDcaWeeks(Number(e.target.value))}/>
                  <span style={{ fontSize:18, fontWeight:500, color:accentColor,
                    fontFamily:"'JetBrains Mono',monospace", minWidth:100 }}>
                    {dcaWeeks} weeks
                  </span>
                </div>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:6 }}>
                  ≈ {(dcaWeeks/4).toFixed(1)} months · {dcaPeriods} {contribFrequencyMeta.label.toLowerCase()} contributions · C${Math.round(perPeriodTotalBuy).toLocaleString()}/{contribFrequencyMeta.shortLabel}
                </p>
              </div>
              <div style={{ flex:"0 0 180px", textAlign:"center" }}>
                <p className="sec">{contribFrequencyMeta.label} spend</p>
                <p style={{ fontSize:24, fontWeight:500, color:"#22d3ee", fontFamily:"'JetBrains Mono',monospace" }}>
                  C${Math.round(perPeriodTotalBuy).toLocaleString()}
                </p>
                <div style={{ marginTop:6, display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
                  {perPeriodUSD > 0 && <span style={{ fontSize:10, color:"#60a5fa" }}>US${Math.round(perPeriodUSD).toLocaleString()}</span>}
                  {perPeriodUSD > 0 && perPeriodCAD > 0 && <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>·</span>}
                  {perPeriodCAD > 0 && <span style={{ fontSize:10, color:"#fbbf24" }}>C${Math.round(perPeriodCAD).toLocaleString()}</span>}
                </div>
              </div>
              <div style={{ flex:"0 0 180px", textAlign:"center" }}>
                <p className="sec">Total to deploy</p>
                <p style={{ fontSize:24, fontWeight:500, color:accentColor, fontFamily:"'JetBrains Mono',monospace" }}>
                  C${Math.round(totalBuys).toLocaleString()}
                </p>
                <div style={{ marginTop:6, display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
                  {totalBuysUSD > 0 && <span style={{ fontSize:10, color:"#60a5fa" }}>US${Math.round(totalBuysUSD).toLocaleString()}</span>}
                  {totalBuysUSD > 0 && totalBuysCAD > 0 && <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>·</span>}
                  {totalBuysCAD > 0 && <span style={{ fontSize:10, color:"#fbbf24" }}>C${Math.round(totalBuysCAD).toLocaleString()}</span>}
                </div>
              </div>
            </div>
          </div>

          {totalBuys === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"40px 20px" }}>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.5)" }}>
                No buys needed — enter cash to deploy in the Rebalance tab
              </p>
            </div>
          ) : (
            <>
              <p className="sec">{contribFrequencyMeta.label} DCA plan — {account}</p>
              <div className="card" style={{ padding:0, overflow:"auto", marginBottom:16 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:600 }}>
                  <thead>
                    <tr>
                      {(() => {
                        const onSort = col => setDcaSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
                        return (<>
                          <SortTh col="ticker"   label="Ticker"                                       sort={dcaSort} onSort={onSort} className="th" />
                          <SortTh col="name"     label="Name"                                         sort={dcaSort} onSort={onSort} className="th" />
                          <SortTh col="exchange" label="Exchange"                                     sort={dcaSort} onSort={onSort} className="th" />
                          <SortTh col="total"    label="Total buy"                                    sort={dcaSort} onSort={onSort} className="th" style={{ textAlign:"right" }} />
                          <SortTh col="perFreq"  label={`Per ${contribFrequencyMeta.label.toLowerCase()}`} sort={dcaSort} onSort={onSort} className="th" style={{ textAlign:"right" }} />
                          <SortTh col="pct"      label="% of plan"                                   sort={dcaSort} onSort={onSort} className="th" style={{ textAlign:"right" }} />
                        </>);
                      })()}
                    </tr>
                  </thead>
                  <tbody>
                    {sortRows(dcaSort.col ? buyList : [...buyList].sort((a,b) => b.delta - a.delta), dcaSort.col, dcaSort.dir, (h, col) => ({
                      ticker: h.ticker, name: h.name,
                      exchange: getExchange(h.ticker, h.currencyOverride),
                      total: h.delta, perFreq: h.delta / dcaPeriods,
                      pct: (h.delta / totalBuys) * 100,
                    }[col] ?? null)).map(h => {
                      const exch   = getExchange(h.ticker, h.currencyOverride);
                      const isCAD  = getTickerCurrency(h.ticker, h.currencyOverride) === "CAD";
                      return (
                        <tr key={h.ticker}>
                          <td className="td td-main"><strong style={{ color:accentColor }}>{h.ticker}</strong></td>
                          <td className="td" style={{ color:"rgba(255,255,255,0.5)" }}>{h.name}</td>
                          <td className="td">
                            <span style={{
                              fontSize:10, padding:"2px 7px", borderRadius:4, fontWeight:500,
                              background: isCAD ? "rgba(251,191,36,0.1)" : "rgba(96,165,250,0.1)",
                              color:      isCAD ? "#fbbf24"              : "#60a5fa",
                              border:     `1px solid ${isCAD ? "rgba(251,191,36,0.25)" : "rgba(96,165,250,0.25)"}`,
                            }}>
                              {exch} · {isCAD ? "C$" : "US$"}
                            </span>
                          </td>
                          <td className="td" style={{ textAlign:"right" }}>{fmtAmt(h.deltaNative, h.ticker, h.currencyOverride)}</td>
                          <td className="td" style={{ textAlign:"right", color:"#22d3ee", fontWeight:500 }}>{fmtAmt(h.deltaNative/dcaPeriods, h.ticker, h.currencyOverride)}</td>
                          <td className="td" style={{ textAlign:"right" }}>{((h.delta/totalBuys)*100).toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="sec">{contribFrequencyMeta.label} schedule</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10 }}>
                {Array.from({ length: Math.min(dcaPeriods, 12) }, (_, w) => {
                  const isoDate = new Date(Date.now() + w * contribFrequencyMeta.cadenceWeeks * 7 * 24 * 60 * 60 * 1000);
                  return (
                    <div key={w} className="dca-week">
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontSize:11, color:accentColor, fontWeight:500 }}>{contribFrequencyMeta.label} {w+1}</span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>
                          {isoDate.toLocaleDateString("en-CA", { month:"short", day:"numeric" })}
                        </span>
                      </div>
                      {buyList.sort((a,b) => b.delta - a.delta).slice(0, 5).map(h => (
                        <div key={h.ticker} style={{ display:"flex", justifyContent:"space-between",
                          fontSize:10, padding:"2px 0", fontFamily:"'JetBrains Mono',monospace" }}>
                          <span style={{ color: getTickerCurrency(h.ticker, h.currencyOverride) === "CAD" ? "#fbbf2488" : "rgba(255,255,255,0.5)" }}>
                            {h.ticker}
                          </span>
                          <span style={{ color:"rgba(255,255,255,0.75)" }}>{fmtAmt(h.deltaNative/dcaPeriods, h.ticker, h.currencyOverride)}</span>
                        </div>
                      ))}
                      <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:8, paddingTop:6,
                        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>Total</span>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:1 }}>
                          {perPeriodUSD > 0 && <span style={{ fontSize:10, color:"#60a5fa", fontFamily:"'JetBrains Mono',monospace" }}>US${Math.round(perPeriodUSD).toLocaleString()}</span>}
                          {perPeriodCAD > 0 && <span style={{ fontSize:10, color:"#fbbf24", fontFamily:"'JetBrains Mono',monospace" }}>C${Math.round(perPeriodCAD).toLocaleString()}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: EDIT TARGETS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "targets" && (
        <div style={{ padding:"22px 28px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              <p className="sec" style={{ margin:0 }}>Edit holdings, cost basis &amp; targets — {account}</p>
              {licenseTier === "basic" ? (
                <a href={LS_CHECKOUT_PRO} target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:6,
                    padding:"6px 14px", fontSize:12, fontWeight:600, borderRadius:8,
                    border:"1px solid rgba(251,191,36,0.35)",
                    background:"rgba(251,191,36,0.08)",
                    color:"#fbbf24", textDecoration:"none" }}>
                  <span style={{ fontSize:14 }}>✨</span> AI Targets — Pro only · Upgrade →
                </a>
              ) : (
                <button
                  onClick={suggestTargetsWithAI}
                  disabled={aiTargetsLoading}
                  style={{
                    display:"flex", alignItems:"center", gap:6,
                    padding:"6px 14px", fontSize:12, fontWeight:600, borderRadius:8,
                    border:"1px solid rgba(167,139,250,0.45)",
                    background: aiTargetsLoading ? "rgba(167,139,250,0.06)" : "rgba(167,139,250,0.1)",
                    color:"#a78bfa", cursor: aiTargetsLoading ? "wait" : "pointer",
                    opacity: aiTargetsLoading ? 0.7 : 1, transition:"all 0.15s",
                  }}
                  title="Send current holdings to Claude and get suggested target allocations"
                >
                  <span style={{ fontSize:14 }}>{aiTargetsLoading ? "⏳" : "✨"}</span>
                  {aiTargetsLoading ? "Analysing…" : "Suggest Targets with AI"}
                </button>
              )}
              {aiTargetsError && (
                <span style={{ fontSize:11, color:"#f87171", display:"flex", alignItems:"center", gap:4 }}>
                  ⚠ {aiTargetsError}
                  <button onClick={() => setAiTargetsError(null)}
                    style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", padding:0, lineHeight:1 }}>✕</button>
                </span>
              )}
              {(() => {
                const missing = holdings[account].filter(h => !h.notes).length;
                const anyGenerating = noteGenerating.size > 0;
                return missing > 0 && (
                  <button
                    onClick={generateAllNotes}
                    disabled={anyGenerating}
                    style={{
                      display:"flex", alignItems:"center", gap:6,
                      padding:"7px 13px", borderRadius:8, fontSize:12, fontWeight:500,
                      border:"1px solid rgba(52,211,153,0.4)",
                      background: anyGenerating ? "rgba(52,211,153,0.04)" : "rgba(52,211,153,0.08)",
                      color:"#34d399", cursor: anyGenerating ? "wait" : "pointer",
                      opacity: anyGenerating ? 0.7 : 1, transition:"all 0.15s",
                    }}
                    title={`Auto-generate "why I bought" notes for ${missing} holding${missing===1?"":"s"} missing a note`}
                  >
                    <span style={{ fontSize:14 }}>{anyGenerating ? "⏳" : "✨"}</span>
                    {anyGenerating ? `Generating… (${noteGenerating.size} left)` : `Generate ${missing} missing note${missing===1?"":"s"}`}
                  </button>
                );
              })()}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"6px 10px" }}>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>Rows</span>
                {[["all","All"],["manual","Manual only"]].map(([v,l]) => (
                  <button
                    key={v}
                    className={`tab-btn ${targetsFilter===v?"on":""}`}
                    onClick={() => setTargetsFilter(v)}
                    style={{ padding:"4px 10px", fontSize:10 }}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"8px 14px" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Contribution</span>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"rgba(255,255,255,0.4)" }}>$</span>
                  <input type="number" min="0" step="100"
                    value={contribAmount || ""}
                    placeholder="0"
                    onChange={e => handleContribAmount(e.target.value)}
                    style={{ paddingLeft:18, width:100 }}/>
                </div>
                <select
                  value={contribFrequency}
                  onChange={e => handleContribFrequency(e.target.value)}
                  style={{ width:105, fontSize:11 }}
                >
                  {CONTRIB_FREQUENCY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {targetsFilter === "manual" && (
                <span style={{ fontSize:10, color:"rgba(251,191,36,0.8)" }}>
                  Showing {filteredCurrent.length} manual override row{filteredCurrent.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
          <div className="card" style={{ padding:0, overflow:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1465 }}>
              <thead>
                <tr>
                  {(() => {
                    const onSort = col => setTargetsSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
                    return (<>
                      <SortTh col="ticker"    label="Ticker / Name" sort={targetsSort} onSort={onSort} className="th" />
                      <SortTh col="currency"  label="Currency"      sort={targetsSort} onSort={onSort} className="th" style={{ width:120 }} />
                      <SortTh col="current"   label="Current $"     sort={targetsSort} onSort={onSort} className="th" style={{ width:115 }} />
                      <SortTh col="costBasis" label="Cost Basis $"  sort={targetsSort} onSort={onSort} className="th" style={{ width:115 }} />
                      <SortTh col="pnl"       label="P&L $"         sort={targetsSort} onSort={onSort} className="th" style={{ textAlign:"right", width:120 }} />
                      <SortTh col="pnlPct"    label="P&L %"         sort={targetsSort} onSort={onSort} className="th" style={{ textAlign:"right", width:75 }} />
                      <SortTh col="target"    label="Target %"      sort={targetsSort} onSort={onSort} className="th" style={{ width:95 }} />
                      <SortTh col="holdPct"   label="Held %"        sort={targetsSort} onSort={onSort} className="th" style={{ width:80, textAlign:"right" }} />
                      <SortTh col="cagr"      label="CAGR %"        sort={targetsSort} onSort={onSort} className="th" style={{ width:90 }} />
                      <th className="th" style={{ textAlign:"right", width:105 }}>10yr</th>
                      <th className="th" style={{ textAlign:"right", width:105 }}>15yr</th>
                      <th className="th" style={{ textAlign:"right", width:105 }}>20yr</th>
                      <th className="th" style={{ width:110 }}></th>
                    </>);
                  })()}
                </tr>
              </thead>
              <tbody>
                {sortRows(filteredCurrent, targetsSort.col, targetsSort.dir, ({ h }, col) => ({
                  ticker: h.ticker, currency: getTickerCurrency(h.ticker, h.currencyOverride),
                  current: h.current, costBasis: h.costBasis || 0,
                  pnl: h.costBasis > 0 ? h.current - h.costBasis : null,
                  pnlPct: h.costBasis > 0 ? ((h.current - h.costBasis) / h.costBasis) * 100 : null,
                  target: h.target, cagr: h.cagr ?? DEFAULT_CAGR[h.ticker] ?? 10,
                  holdPct: currentTotal > 0 ? (toCAD(h.current, h.ticker, h.currencyOverride) / currentTotal) * 100 : 0,
                }[col] ?? null)).map(({ h, idx }) => {
                  const cagr      = h.cagr ?? DEFAULT_CAGR[h.ticker] ?? 10;
                  const cb        = h.costBasis || 0;
                  const posPnl    = cb > 0 ? h.current - cb : null;
                  const posPnlPct = cb > 0 ? ((h.current - cb) / cb) * 100 : null;
                  const isFourX   = cb > 0 && h.current / cb >= 4;
                  const multiple  = cb > 0 ? (h.current / cb).toFixed(1) : null;
                  const contrib     = monthlyContribEq;
                  const holdingPMT  = contrib > 0 ? (h.target / 100) * contrib : 0;
                  const currentCAD  = toCAD(h.current, h.ticker, h.currencyOverride);
                  const proj = yrs => {
                    const r = cagr / 100 / 12;
                    const n = yrs * 12;
                    if (currentCAD === 0 && holdingPMT === 0) return "—";
                    const fv = r === 0
                      ? currentCAD + holdingPMT * n
                      : currentCAD * Math.pow(1+r, n) + holdingPMT * (Math.pow(1+r,n)-1) / r;
                    return `C$${Math.round(fv).toLocaleString()}`;
                  };
                  return (
                    <tr key={h.ticker} style={isFourX ? { background:"rgba(251,191,36,0.05)", outline:"1px solid rgba(251,191,36,0.18)" } : undefined}>
                      <td className="td td-main">
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <strong style={{ color:accentColor }}>{h.ticker}</strong>
                          {isFourX && (
                            <span style={{
                              fontSize:9, padding:"1px 5px", borderRadius:4, fontWeight:700,
                              background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.4)",
                              color:"#fbbf24", letterSpacing:"0.04em",
                            }} title={`Up ${multiple}× cost basis — consider taking profits`}>
                              💰 {multiple}×
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{h.name}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:5 }}>
                          <input
                            type="text"
                            value={h.notes || ""}
                            placeholder="Why I bought this…"
                            onChange={e => updateHolding(idx, "notes", e.target.value)}
                            style={{
                              flex:1, fontSize:10, padding:"3px 6px",
                              background:"rgba(255,255,255,0.04)",
                              border:"1px solid rgba(255,255,255,0.08)",
                              borderRadius:4, color:"rgba(255,255,255,0.55)",
                              outline:"none", minWidth:0,
                            }}
                          />
                          <button
                            onClick={() => generateNote(idx, h)}
                            disabled={noteGenerating.has(h.ticker)}
                            title="Auto-generate note with AI"
                            style={{
                              flexShrink:0, fontSize:11, padding:"2px 6px",
                              background:"rgba(167,139,250,0.1)",
                              border:"1px solid rgba(167,139,250,0.25)",
                              borderRadius:4, color:"#a78bfa",
                              cursor: noteGenerating.has(h.ticker) ? "wait" : "pointer",
                              opacity: noteGenerating.has(h.ticker) ? 0.5 : 1,
                            }}
                          >
                            {noteGenerating.has(h.ticker) ? "…" : "✨"}
                          </button>
                        </div>
                      </td>
                      <td className="td">
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                          <select
                            value={h.currencyOverride || ""}
                            onChange={e => updateHolding(idx, "currencyOverride", e.target.value)}
                            style={{ fontSize:11, padding:"5px 8px", borderRadius:6 }}
                          >
                            <option value="">Auto</option>
                            <option value="CAD">CAD</option>
                            <option value="USD">USD</option>
                          </select>
                          <span
                            className="pill"
                            style={{
                              width:"fit-content",
                              padding:"1px 6px",
                              fontSize:9,
                              borderRadius:4,
                              color: h.currencyOverride ? "#fbbf24" : "rgba(255,255,255,0.65)",
                              border: h.currencyOverride ? "1px solid rgba(251,191,36,0.35)" : "1px solid rgba(148,163,184,0.22)",
                              background: h.currencyOverride ? "rgba(251,191,36,0.08)" : "rgba(148,163,184,0.08)",
                            }}
                          >
                            {h.currencyOverride ? "MANUAL" : "AUTO"} · {getTickerCurrency(h.ticker, h.currencyOverride)}
                          </span>
                        </div>
                      </td>
                      <td className="td">
                        <input type="number" value={h.current}
                          onChange={e => updateHolding(idx, "current", e.target.value)}/>
                      </td>
                      <td className="td">
                        <input type="number" value={cb || ""}
                          placeholder="0"
                          onChange={e => updateHolding(idx, "costBasis", e.target.value)}
                          style={{ color:"#94a3b8" }}/>
                      </td>
                      <td className="td" style={{ textAlign:"right" }}>
                        {posPnl !== null ? (
                          <span style={{ color: posPnl >= 0 ? "#34d399" : "#ef4444", fontWeight:500 }}>
                            {posPnl >= 0 ? "+" : ""}${Math.round(posPnl).toLocaleString()}
                          </span>
                        ) : <span style={{ color:"rgba(255,255,255,0.2)" }}>—</span>}
                      </td>
                      <td className="td" style={{ textAlign:"right" }}>
                        {posPnlPct !== null ? (
                          <span style={{ color: posPnlPct >= 0 ? "#34d399" : "#ef4444", fontSize:11 }}>
                            {posPnlPct >= 0 ? "+" : ""}{posPnlPct.toFixed(1)}%
                          </span>
                        ) : <span style={{ color:"rgba(255,255,255,0.2)" }}>—</span>}
                      </td>
                      <td className="td td-target">
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <input type="number" value={h.target} max="100" min="0" step="1"
                            onChange={e => updateHolding(idx, "target", e.target.value)}
                            style={{ flex:1 }}/>
                          <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)", flexShrink:0 }}>%</span>
                        </div>
                      </td>
                      <td className="td" style={{ textAlign:"right", whiteSpace:"nowrap" }}>
                        {(() => {
                          if (currentTotal <= 0 || h.current <= 0) return <span style={{ color:"rgba(255,255,255,0.2)" }}>—</span>;
                          const pct = (toCAD(h.current, h.ticker, h.currencyOverride) / currentTotal) * 100;
                          const diff = pct - h.target;
                          return (
                            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:1 }}>
                              <span style={{ fontSize:12, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                                color:"#22d3ee" }}>{pct.toFixed(1)}%</span>
                              {h.target > 0 && (
                                <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace",
                                  color: Math.abs(diff) < 1 ? "rgba(255,255,255,0.25)"
                                    : diff > 0 ? "#fb923c" : "#34d399" }}>
                                  {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="td">
                        <input type="number" value={cagr} min="0" max="100" step="0.5"
                          onChange={e => updateHolding(idx, "cagr", e.target.value)}
                          style={{ color:"#a78bfa" }}/>
                      </td>
                      <td className="td" style={{ textAlign:"right", color:"#34d399" }}>{proj(10)}</td>
                      <td className="td" style={{ textAlign:"right", color:"#22d3ee" }}>{proj(15)}</td>
                      <td className="td" style={{ textAlign:"right", color:accentColor, fontWeight:600 }}>{proj(20)}</td>
                      <td className="td" style={{ textAlign:"center" }}>
                        {pendingRemove === idx ? (
                          <div style={{ display:"flex", gap:4 }}>
                            <button className="btn btn-danger" onClick={() => removeTicker(idx)}
                              style={{ padding:"3px 7px", fontSize:10 }}>Yes</button>
                            <button className="btn" onClick={() => setPendingRemove(null)}
                              style={{ padding:"3px 7px", fontSize:10 }}>No</button>
                          </div>
                        ) : (
                          <button className="btn btn-danger" onClick={() => setPendingRemove(idx)}
                            style={{ padding:"3px 8px", fontSize:11 }}>✕</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr style={{ background:"rgba(255,255,255,0.03)" }}>
                  <td className="td td-main"><strong>TOTAL</strong></td>
                  <td className="td" style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>AUTO / MANUAL</td>
                  <td className="td" style={{ color:accentColor, fontWeight:500 }}>C${Math.round(currentTotal).toLocaleString()}</td>
                  <td className="td" style={{ color:"#94a3b8", fontWeight:500 }}>
                    {totalCostBasis > 0 ? `C$${Math.round(totalCostBasis).toLocaleString()}` : "—"}
                  </td>
                  <td className="td" style={{ textAlign:"right", fontWeight:500,
                    color: totalPnL !== null ? (totalPnL >= 0 ? "#34d399" : "#ef4444") : "rgba(255,255,255,0.2)" }}>
                    {totalPnL !== null ? `${totalPnL >= 0 ? "+" : ""}C$${Math.round(totalPnL).toLocaleString()}` : "—"}
                  </td>
                  <td className="td" style={{ textAlign:"right", fontWeight:500,
                    color: totalPnLPct !== null ? (totalPnLPct >= 0 ? "#34d399" : "#ef4444") : "rgba(255,255,255,0.2)" }}>
                    {totalPnLPct !== null ? `${totalPnLPct >= 0 ? "+" : ""}${totalPnLPct.toFixed(1)}%` : "—"}
                  </td>
                  <td className="td" style={{ fontWeight:700, fontSize:14,
                    color: Math.abs(targetSum-100) > 0.5 ? "#ef4444" : "#34d399" }}>
                    {targetSum}%
                  </td>
                  <td className="td" style={{ textAlign:"right", fontWeight:700, fontSize:14, color:"#22d3ee" }}>
                    {currentTotal > 0 ? "100%" : "—"}
                  </td>
                  <td className="td"></td>
                  <td className="td" style={{ textAlign:"right", color:"#34d399", fontWeight:500 }}>
                    C${Math.round(current.reduce((s,h)=>{
                      const r=(h.cagr??DEFAULT_CAGR[h.ticker]??10)/100/12,n=120,pmt=monthlyContribEq*(h.target/100),c=toCAD(h.current,h.ticker,h.currencyOverride);
                      if(c===0&&pmt===0)return s;
                      return s+(r===0?c+pmt*n:c*Math.pow(1+r,n)+pmt*(Math.pow(1+r,n)-1)/r);
                    },0)).toLocaleString()}
                  </td>
                  <td className="td" style={{ textAlign:"right", color:"#22d3ee", fontWeight:500 }}>
                    C${Math.round(current.reduce((s,h)=>{
                      const r=(h.cagr??DEFAULT_CAGR[h.ticker]??10)/100/12,n=180,pmt=monthlyContribEq*(h.target/100),c=toCAD(h.current,h.ticker,h.currencyOverride);
                      if(c===0&&pmt===0)return s;
                      return s+(r===0?c+pmt*n:c*Math.pow(1+r,n)+pmt*(Math.pow(1+r,n)-1)/r);
                    },0)).toLocaleString()}
                  </td>
                  <td className="td" style={{ textAlign:"right", color:accentColor, fontWeight:600 }}>
                    C${Math.round(current.reduce((s,h)=>{
                      const r=(h.cagr??DEFAULT_CAGR[h.ticker]??10)/100/12,n=240,pmt=monthlyContribEq*(h.target/100),c=toCAD(h.current,h.ticker,h.currencyOverride);
                      if(c===0&&pmt===0)return s;
                      return s+(r===0?c+pmt*n:c*Math.pow(1+r,n)+pmt*(Math.pow(1+r,n)-1)/r);
                    },0)).toLocaleString()}
                  </td>
                  <td className="td" style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>
                    {Math.abs(targetSum-100) > 0.5 ? `⚠ off by ${Math.abs(targetSum-100).toFixed(1)}%` : "✓ balanced"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Growth Milestones */}
          {(() => {
            const contrib = monthlyContribEq;
            const fv = (yrs) => current.reduce((s,h) => {
              const r = (h.cagr??DEFAULT_CAGR[h.ticker]??10)/100/12, n = yrs*12;
              const c = toCAD(h.current, h.ticker, h.currencyOverride);
              const pmt = contrib * (h.target/100);
              if (c===0 && pmt===0) return s;
              return s + (r===0 ? c+pmt*n : c*Math.pow(1+r,n)+pmt*(Math.pow(1+r,n)-1)/r);
            }, 0);
            const lump = (yrs) => current.reduce((s,h) => {
              const r = (h.cagr??DEFAULT_CAGR[h.ticker]??10)/100/12, n = yrs*12;
              const c = toCAD(h.current, h.ticker, h.currencyOverride);
              if (c===0) return s;
              return s + c*Math.pow(1+r,n);
            }, 0);
            const totalContrib = annualContrib;
            return (
              <div style={{ marginTop:20, padding:"18px 20px", background:"rgba(255,255,255,0.03)", border:`1px solid ${accentColor}33`, borderRadius:14 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:8 }}>
                  <p className="sec" style={{ margin:0 }}>Growth Milestones</p>
                  {contrib > 0 && (
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>
                      C${contribAmount.toLocaleString()}/{contribFrequencyMeta.shortLabel} · C${totalContrib.toLocaleString()}/yr in contributions
                    </span>
                  )}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {[10,15,20].map(yrs => {
                    const withC = fv(yrs);
                    const noC   = lump(yrs);
                    const boost = withC - noC;
                    return (
                      <div key={yrs} className="stat-card" style={{ "--accent": accentColor }}>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>{yrs}-Year Projection</div>
                        <div style={{ fontSize:22, fontWeight:700, color: accentColor, marginBottom:4 }}>
                          C${Math.round(withC).toLocaleString()}
                        </div>
                        {contrib > 0 ? (
                          <>
                            <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>
                              Without contributions: <span style={{ color:"rgba(255,255,255,0.6)" }}>C${Math.round(noC).toLocaleString()}</span>
                            </div>
                            <div style={{ fontSize:11, color:"#34d399", marginTop:3 }}>
                              +C${Math.round(boost).toLocaleString()} from C${Math.round(annualContrib*yrs).toLocaleString()} invested
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Add a recurring contribution above to see boost</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Add ticker */}
          <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <button className={`btn ${addForm ? "btn-primary" : ""}`}
              disabled={!addForm && atHoldingsCap}
              title={!addForm && atHoldingsCap ? "Portfolio limit reached (30 holdings) — remove a position first" : undefined}
              onClick={() => setAddForm(addForm ? null : { ...BLANK_FORM })}>
              {addForm ? "✕ Cancel" : "+ Add Ticker"}
            </button>
            <span style={{
              fontSize:11, padding:"3px 9px", borderRadius:12, fontWeight:600,
              background: atHoldingsCap    ? "rgba(239,68,68,0.12)"
                        : nearHoldingsCap  ? "rgba(249,115,22,0.1)"
                        : inSweetSpot      ? "rgba(34,197,94,0.08)"
                        : underDiversified ? "rgba(251,191,36,0.1)"
                        :                   "rgba(255,255,255,0.06)",
              border:     atHoldingsCap    ? "1px solid rgba(239,68,68,0.35)"
                        : nearHoldingsCap  ? "1px solid rgba(249,115,22,0.3)"
                        : inSweetSpot      ? "1px solid rgba(34,197,94,0.25)"
                        : underDiversified ? "1px solid rgba(251,191,36,0.25)"
                        :                   "1px solid rgba(255,255,255,0.1)",
              color:      atHoldingsCap    ? "#ef4444"
                        : nearHoldingsCap  ? "#f97316"
                        : inSweetSpot      ? "#22c55e"
                        : underDiversified ? "#fbbf24"
                        :                   "rgba(255,255,255,0.4)",
            }} title="Optimal diversification: 15–25 positions">
              {totalHoldingsCount} / 30
              {inSweetSpot      ? " ✓ Diversified"
             : underDiversified ? " — Add more"
             : nearHoldingsCap  ? " — Near limit"
             : atHoldingsCap    ? " — At max"
             :                    " holdings"}
            </span>
          </div>

          {addForm && (
            <div className="add-form">
              <p className="sec" style={{ marginBottom:14 }}>New position — {account}</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(155px, 1fr))", gap:10, marginBottom:12 }}>
                {[
                  ["Ticker *",      "text",   "ticker",    "e.g. AAPL"],
                  ["Name",          "text",   "name",      "e.g. Apple"],
                  ["Current $",     "number", "current",   "0"],
                  ["Cost Basis $",  "number", "costBasis", "0"],
                  ["Target %",      "number", "target",    "0"],
                  ["Div yield %",   "number", "divYield",  "0.0"],
                  ["Est. CAGR %",   "number", "cagr",      "10"],
                ].map(([label, type, field, ph]) => (
                  <div key={field}>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>{label}</p>
                    <input type={type} value={addForm[field]} placeholder={ph}
                      onChange={e => setAddForm({ ...addForm,
                        [field]: type==="text" ? (field==="ticker" ? e.target.value.toUpperCase() : e.target.value) : e.target.value
                      })}/>
                  </div>
                ))}
                <div>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Currency</p>
                  <select
                    value={addForm.currencyOverride || ""}
                    onChange={e => setAddForm({ ...addForm, currencyOverride: e.target.value })}
                    style={{ width:"100%", fontSize:12, padding:"8px 10px", borderRadius:8 }}
                  >
                    <option value="">Auto-detect</option>
                    <option value="CAD">CAD</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Notes (optional)</p>
                <input type="text" value={addForm.notes} placeholder="Investment thesis or notes…"
                  onChange={e => setAddForm({ ...addForm, notes: e.target.value })}/>
              </div>
              <button className="btn btn-primary" onClick={addTicker}>+ Add to {account}</button>
            </div>
          )}

          <div style={{ marginTop:14, padding:"12px 14px", background:"rgba(251,191,36,0.05)",
            border:"1px solid rgba(251,191,36,0.15)", borderRadius:8, fontSize:11,
            color:"rgba(251,191,36,0.8)", lineHeight:1.6 }}>
            ⚠ Not financial advice. Data stored in your browser only. Export regularly to back up. Consult a licensed CFP before trading.
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: RECOMMENDATIONS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "recommend" && (
        <div style={{ padding:"22px 28px" }}>

          {/* ── Investor Profile banner ─────────────────────────────────── */}
          {(() => {
            const ip = investorProfile;
            const yearsLeft = ip?.age ? Math.max(0, (ip.retirementAge || 65) - Number(ip.age)) : null;
            const RISK_COLOR = { conservative:"#22d3ee", balanced:"#a78bfa", growth:"#22c55e", aggressive:"#f97316" };
            const RISK_LABEL = { conservative:"Conservative 🛡", balanced:"Balanced ⚖️", growth:"Growth 📈", aggressive:"Aggressive 🚀" };
            const GOAL_LABEL = { retirement:"Retirement Income", growth:"Wealth Accumulation", income:"Dividend Income", preservation:"Capital Preservation" };
            if (!ip) return (
              <div style={{ marginBottom:14, padding:"12px 18px", borderRadius:10,
                background:"rgba(167,139,250,0.05)", border:"1px dashed rgba(167,139,250,0.3)",
                display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", margin:0 }}>
                  👤 Set your investor profile to personalise recommendations and AI suggestions.
                </p>
                <button onClick={() => { setProfileDraft({}); setShowProfileModal(true); }}
                  style={{ fontSize:11, padding:"5px 14px", borderRadius:7, cursor:"pointer",
                    background:"rgba(167,139,250,0.14)", border:"1px solid rgba(167,139,250,0.4)",
                    color:"#a78bfa", fontWeight:600 }}>
                  Set up profile →
                </button>
              </div>
            );
            const riskColor = RISK_COLOR[ip.riskTolerance] || "#a78bfa";
            return (
              <div style={{ marginBottom:14, padding:"12px 18px", borderRadius:10,
                background:`${riskColor}08`, border:`1px solid ${riskColor}25`,
                display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:12, fontWeight:600, color: riskColor }}>
                    {RISK_LABEL[ip.riskTolerance]}
                  </span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>·</span>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>
                    {GOAL_LABEL[ip.primaryGoal]}
                  </span>
                  {ip.age && (
                    <>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>·</span>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>
                        Age {ip.age} · {yearsLeft}yr to retirement
                      </span>
                    </>
                  )}
                  {ip.monthlyContrib > 0 && (
                    <>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>·</span>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>
                        C${Number(ip.monthlyContrib).toLocaleString()}/mo
                      </span>
                    </>
                  )}
                </div>
                <button onClick={() => { setProfileDraft({ ...ip }); setShowProfileModal(true); }}
                  style={{ fontSize:10, padding:"4px 10px", borderRadius:6, cursor:"pointer",
                    background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                    color:"rgba(255,255,255,0.4)" }}>
                  Edit profile
                </button>
              </div>
            );
          })()}

          {/* ── AI Diversification panel ───────────────────────────────── */}
          {(() => {
            const ds = diversifySuggestions;
            const tealAccent = "#2dd4bf";
            const relAge = ds?.generatedAt
              ? (() => {
                  const m = Math.round((Date.now() - new Date(ds.generatedAt).getTime()) / 60000);
                  if (m < 1)  return "just now";
                  if (m < 60) return `${m}m ago`;
                  const h = Math.floor(m / 60);
                  return h < 24 ? `${h}h ago` : `${Math.floor(h/24)}d ago`;
                })()
              : null;

            return (
              <div className="card" style={{
                marginBottom:16, padding:"16px 20px",
                background:"rgba(45,212,191,0.03)",
                border:"1px solid rgba(45,212,191,0.18)",
              }}>
                {/* Header row */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  flexWrap:"wrap", gap:10, marginBottom: ds ? 16 : 0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <p style={{ margin:0, fontSize:13, fontWeight:700, color:tealAccent }}>
                      🤖 AI Diversification Analysis
                    </p>
                    {ds && (
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)",
                        fontFamily:"'JetBrains Mono',monospace" }}>
                        {ds.regime} · risk {ds.riskScore}/100 · {relAge}
                      </span>
                    )}
                    {diversifyError && (
                      <span style={{ fontSize:11, color:"#f87171", display:"flex",
                        alignItems:"center", gap:4 }}>
                        ⚠ {diversifyError}
                        <button onClick={() => setDiversifyError(null)}
                          style={{ background:"none", border:"none", color:"#f87171",
                            cursor:"pointer", padding:0, lineHeight:1 }}>✕</button>
                      </span>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    {ds && (
                      <button onClick={() => {
                        setDiversifySuggestions(null);
                        localStorage.removeItem("diversify:suggestions");
                      }} style={{ fontSize:10, padding:"4px 10px", borderRadius:6,
                        background:"rgba(255,255,255,0.04)",
                        border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)",
                        cursor:"pointer" }}>
                        Clear
                      </button>
                    )}
                    {licenseTier === "basic" ? (
                      <a href={LS_CHECKOUT_PRO} target="_blank" rel="noreferrer"
                        style={{ display:"flex", alignItems:"center", gap:6,
                          padding:"7px 16px", fontSize:12, fontWeight:600, borderRadius:8,
                          border:"1px solid rgba(251,191,36,0.35)",
                          background:"rgba(251,191,36,0.08)",
                          color:"#fbbf24", textDecoration:"none" }}>
                        <span style={{ fontSize:14 }}>✨</span> AI Analysis — Pro only · Upgrade →
                      </a>
                    ) : (
                      <button
                        onClick={fetchDiversificationSuggestions}
                        disabled={diversifyLoading}
                        style={{
                          display:"flex", alignItems:"center", gap:6,
                          padding:"7px 16px", fontSize:12, fontWeight:600, borderRadius:8,
                          border:`1px solid ${tealAccent}55`,
                          background: diversifyLoading ? `rgba(45,212,191,0.06)` : `rgba(45,212,191,0.1)`,
                          color: tealAccent, cursor: diversifyLoading ? "wait" : "pointer",
                          opacity: diversifyLoading ? 0.7 : 1,
                        }}
                      >
                        <span style={{ fontSize:14 }}>{diversifyLoading ? "⏳" : "✨"}</span>
                        {diversifyLoading ? "Analysing portfolio…" : ds ? "Re-analyse" : "Analyse my portfolio"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Empty state */}
                {!ds && !diversifyLoading && (
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", lineHeight:1.6, margin:0 }}>
                    Claude will analyse your complete portfolio across all accounts, identify real gaps in
                    sector, geography, and asset class coverage, and suggest 3–6 specific additions — with
                    account placement rationale and a suggested initial weight each.
                  </p>
                )}

                {/* ── Trim / Reduce alerts ── */}
                {ds?.trims?.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <p style={{ fontSize:11, fontWeight:600, color:"#f97316", marginBottom:8,
                      display:"flex", alignItems:"center", gap:6 }}>
                      ✂ Trim / Reduce Alerts
                      <span style={{ fontSize:10, fontWeight:400, color:"rgba(255,255,255,0.35)" }}>
                        — positions flagged for concentration or tax-placement concerns
                      </span>
                    </p>
                    <div style={{ display:"grid", gap:8,
                      gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))" }}>
                      {ds.trims.map((tr, i) => {
                        const isRemove = tr.action === "Remove";
                        const accentColor = isRemove ? "#ef4444" : "#f97316";
                        return (
                          <div key={i} style={{
                            background:"rgba(249,115,22,0.06)",
                            border:"1px solid rgba(249,115,22,0.2)",
                            borderLeft:`3px solid ${accentColor}`,
                            borderRadius:10, padding:"12px 14px",
                          }}>
                            <div style={{ display:"flex", justifyContent:"space-between",
                              alignItems:"flex-start", marginBottom:6 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                <span style={{ fontSize:16, fontWeight:800,
                                  fontFamily:"'JetBrains Mono',monospace", color:accentColor }}>
                                  {tr.ticker}
                                </span>
                                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                                  background:`${accentColor}15`, color:accentColor,
                                  border:`1px solid ${accentColor}30`, fontWeight:600 }}>
                                  {tr.account}
                                </span>
                                <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4,
                                  background:"rgba(0,0,0,0.2)", color:accentColor, fontWeight:700 }}>
                                  {tr.action}
                                </span>
                              </div>
                              {!isRemove && tr.currentPct != null && tr.suggestedPct != null && (
                                <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                                  <p style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                                    color:"rgba(255,255,255,0.55)", margin:0 }}>
                                    <span style={{ color:"#ef4444" }}>{tr.currentPct}%</span>
                                    {" → "}
                                    <span style={{ color:"#22c55e" }}>{tr.suggestedPct}%</span>
                                  </p>
                                  <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", margin:0 }}>of account</p>
                                </div>
                              )}
                            </div>
                            <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)",
                              lineHeight:1.5, marginBottom:10 }}>
                              {tr.reason}
                            </p>
                            <button
                              onClick={() => setTab("targets")}
                              style={{ width:"100%", padding:"6px 0", fontSize:10, fontWeight:600,
                                background:`${accentColor}10`, border:`1px solid ${accentColor}30`,
                                borderRadius:6, color:accentColor, cursor:"pointer" }}>
                              Adjust in Edit Targets →
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Cross-portfolio overlap advice ── */}
                {ds?.crossPortfolioAdvice?.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <p style={{ fontSize:11, fontWeight:600, color:"#a78bfa", marginBottom:8,
                      display:"flex", alignItems:"center", gap:6 }}>
                      🔀 Cross-Portfolio Overlap
                      <span style={{ fontSize:10, fontWeight:400, color:"rgba(255,255,255,0.35)" }}>
                        — same ticker held in multiple accounts
                      </span>
                    </p>
                    <div style={{ display:"grid", gap:8,
                      gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))" }}>
                      {ds.crossPortfolioAdvice.map((adv, i) => {
                        const isDiversify = adv.verdict?.startsWith("Diversify");
                        const isConsolidate = adv.verdict?.startsWith("Consolidate");
                        const accentColor = isDiversify ? "#f97316" : isConsolidate ? "#22d3ee" : "#a78bfa";
                        return (
                          <div key={i} style={{
                            background:"rgba(167,139,250,0.04)",
                            border:`1px solid rgba(167,139,250,0.18)`,
                            borderLeft:`3px solid ${accentColor}`,
                            borderRadius:10, padding:"12px 14px",
                          }}>
                            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                              <span style={{ fontSize:15, fontWeight:800,
                                fontFamily:"'JetBrains Mono',monospace", color:accentColor }}>
                                {adv.ticker}
                              </span>
                              {(adv.inAccounts || []).map(a => (
                                <span key={a} style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                                  background:"rgba(167,139,250,0.12)", color:"#a78bfa",
                                  border:"1px solid rgba(167,139,250,0.25)", fontWeight:600 }}>
                                  {a}
                                </span>
                              ))}
                              <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4,
                                background:`${accentColor}15`, color:accentColor,
                                border:`1px solid ${accentColor}30`, fontWeight:700, marginLeft:"auto" }}>
                                {adv.verdict}
                              </span>
                            </div>
                            <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)",
                              lineHeight:1.5, margin:0 }}>
                              {adv.reason}
                            </p>
                            {adv.altTicker && (
                              <p style={{ fontSize:10, color:"#f97316", marginTop:6, marginBottom:0 }}>
                                💡 Alternative: <strong>{adv.altTicker}</strong>{adv.altAccount ? ` in ${adv.altAccount}` : ""}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Scanner-validated picks ── */}
                {ds?.scannerPicks?.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <p style={{ fontSize:11, fontWeight:600, color:"#fbbf24", marginBottom:8,
                      display:"flex", alignItems:"center", gap:6 }}>
                      📡 Scanner-Validated Buys
                      <span style={{ fontSize:10, fontWeight:400, color:"rgba(255,255,255,0.35)" }}>
                        — at or near fair value per the Buy Radar model
                      </span>
                    </p>
                    <div style={{ display:"grid", gap:12,
                      gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))" }}>
                      {ds.scannerPicks.map((s, i) => {
                        const alreadyHeld = portfolios.some(p =>
                          (holdings[p] || []).some(h => h.ticker === s.ticker)
                        );
                        const acctColor   = s.account === "RRSP" ? "#22d3ee" : "#fbbf24";
                        const signalColor = (s.upside ?? 0) >= 25 ? "#22c55e"
                          : (s.upside ?? 0) >= 0 ? "#86efac" : "#fbbf24";
                        return (
                          <div key={i} style={{
                            background:"rgba(251,191,36,0.03)",
                            border:"1px solid rgba(251,191,36,0.18)",
                            borderLeft:"3px solid #fbbf24",
                            borderRadius:10, padding:"14px 16px",
                          }}>
                            <div style={{ display:"flex", justifyContent:"space-between",
                              alignItems:"flex-start", marginBottom:8 }}>
                              <div>
                                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                                  <span style={{ fontSize:16, fontWeight:800,
                                    fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>
                                    {s.ticker}
                                  </span>
                                  <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                                    background:`${acctColor}15`, color:acctColor,
                                    border:`1px solid ${acctColor}30`, fontWeight:600 }}>
                                    {s.account}
                                  </span>
                                  <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                                    background:`${signalColor}15`, color:signalColor,
                                    border:`1px solid ${signalColor}30`, fontWeight:600 }}>
                                    {s.signal || "Buy"}
                                  </span>
                                </div>
                                <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", margin:0 }}>
                                  {s.name}
                                </p>
                              </div>
                              <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                                <p style={{ fontSize:13, fontWeight:700, color:signalColor,
                                  fontFamily:"'JetBrains Mono',monospace", margin:0 }}>
                                  {s.upside != null ? `+${s.upside}%` : "—"}
                                </p>
                                <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", margin:0 }}>
                                  upside
                                </p>
                              </div>
                            </div>
                            <div style={{ fontSize:10, color:"rgba(251,191,36,0.75)",
                              background:"rgba(251,191,36,0.06)",
                              border:"1px solid rgba(251,191,36,0.15)",
                              borderRadius:5, padding:"3px 8px", marginBottom:8,
                              display:"inline-block", lineHeight:1.4 }}>
                              🎯 {s.fillsGap}
                            </div>
                            <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)",
                              lineHeight:1.55, marginBottom:8 }}>{s.thesis}</p>
                            {s.placementReason && (
                              <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)",
                                lineHeight:1.4, marginBottom:10,
                                borderTop:"1px solid rgba(255,255,255,0.05)",
                                paddingTop:7, margin:"0 0 10px" }}>
                                📍 {s.placementReason}
                              </p>
                            )}
                            <div style={{ display:"flex", gap:12, marginBottom:10 }}>
                              {[["Target", `${s.targetPct ?? 5}%`], ["Div yield", `${s.divYield ?? 0}%`], ["Est. CAGR", `${s.cagr ?? 10}%`]].map(([label, val]) => (
                                <div key={label}>
                                  <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", margin:0,
                                    textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</p>
                                  <p style={{ fontSize:12, fontWeight:600,
                                    color:"rgba(255,255,255,0.7)", margin:0,
                                    fontFamily:"'JetBrains Mono',monospace" }}>{val}</p>
                                </div>
                              ))}
                            </div>
                            {alreadyHeld ? (
                              <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>
                                ✓ Already in portfolio
                              </span>
                            ) : (
                              <button
                                className="btn btn-primary"
                                style={{ width:"100%", fontSize:11, padding:"7px 0",
                                  borderColor:`${acctColor}50`, color:acctColor,
                                  background:`${acctColor}10` }}
                                onClick={() => {
                                  addRecommendedTicker({
                                    ticker: s.ticker, name: s.name,
                                    divYield: s.divYield ?? 0, thesis: s.thesis, bestFor: s.account,
                                  }, s.account);
                                }}>
                                + Add to {s.account}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Suggestion cards */}
                {ds?.suggestions?.length > 0 && (
                  <div>
                  {(ds.trims?.length > 0 || ds.crossPortfolioAdvice?.length > 0 || ds.scannerPicks?.length > 0) && (
                    <p style={{ fontSize:11, fontWeight:600, color:tealAccent, marginBottom:8,
                      display:"flex", alignItems:"center", gap:6 }}>
                      ✦ New Positions to Add
                    </p>
                  )}
                  <div style={{ display:"grid", gap:12,
                    gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))" }}>
                    {ds.suggestions.map((s, i) => {
                      const alreadyHeld = portfolios.some(p =>
                        (holdings[p] || []).some(h => h.ticker === s.ticker)
                      );
                      const acctColor = s.account === "RRSP" ? "#22d3ee" : "#fbbf24";
                      return (
                        <div key={i} style={{
                          background:"rgba(255,255,255,0.03)",
                          border:`1px solid rgba(45,212,191,0.14)`,
                          borderLeft:`3px solid ${tealAccent}`,
                          borderRadius:10, padding:"14px 16px",
                        }}>
                          {/* Card header */}
                          <div style={{ display:"flex", justifyContent:"space-between",
                            alignItems:"flex-start", marginBottom:8 }}>
                            <div>
                              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                                <span style={{ fontSize:16, fontWeight:800,
                                  fontFamily:"'JetBrains Mono',monospace", color:tealAccent }}>
                                  {s.ticker}
                                </span>
                                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                                  background:`${acctColor}15`, color:acctColor,
                                  border:`1px solid ${acctColor}30`, fontWeight:600 }}>
                                  {s.account}
                                </span>
                                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                                  background:"rgba(45,212,191,0.08)",
                                  color:"rgba(45,212,191,0.7)",
                                  border:"1px solid rgba(45,212,191,0.2)" }}>
                                  {s.sector}
                                </span>
                              </div>
                              <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)",
                                margin:0 }}>{s.name}</p>
                            </div>
                            <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                              <p style={{ fontSize:14, fontWeight:700, color:tealAccent,
                                fontFamily:"'JetBrains Mono',monospace", margin:0 }}>
                                {s.targetPct}%
                              </p>
                              <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)",
                                margin:0 }}>suggested</p>
                            </div>
                          </div>

                          {/* Fills gap pill */}
                          <div style={{ fontSize:10, color:"rgba(45,212,191,0.75)",
                            background:"rgba(45,212,191,0.06)",
                            border:"1px solid rgba(45,212,191,0.15)",
                            borderRadius:5, padding:"3px 8px", marginBottom:8,
                            display:"inline-block", lineHeight:1.4 }}>
                            🎯 {s.fillsGap}
                          </div>

                          {/* Thesis */}
                          <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)",
                            lineHeight:1.55, marginBottom:8 }}>{s.thesis}</p>

                          {/* Placement reason */}
                          {s.placementReason && (
                            <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)",
                              lineHeight:1.4, marginBottom:10,
                              borderTop:"1px solid rgba(255,255,255,0.05)",
                              paddingTop:7, margin:"0 0 10px" }}>
                              📍 {s.placementReason}
                            </p>
                          )}

                          {/* Metrics row */}
                          <div style={{ display:"flex", gap:12, marginBottom:10 }}>
                            {[
                              ["Div yield", `${s.divYield ?? 0}%`],
                              ["Est. CAGR",  `${s.cagr ?? 10}%`],
                            ].map(([label, val]) => (
                              <div key={label}>
                                <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)",
                                  margin:0, textTransform:"uppercase",
                                  letterSpacing:"0.07em" }}>{label}</p>
                                <p style={{ fontSize:12, fontWeight:600,
                                  color:"rgba(255,255,255,0.7)", margin:0,
                                  fontFamily:"'JetBrains Mono',monospace" }}>{val}</p>
                              </div>
                            ))}
                          </div>

                          {/* Add button */}
                          {alreadyHeld ? (
                            <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>
                              ✓ Already in portfolio
                            </span>
                          ) : (
                            <button
                              className="btn btn-primary"
                              style={{ width:"100%", fontSize:11, padding:"7px 0",
                                borderColor:`${acctColor}50`, color:acctColor,
                                background:`${acctColor}10` }}
                              onClick={() => {
                                addRecommendedTicker({
                                  ticker:   s.ticker,
                                  name:     s.name,
                                  divYield: s.divYield ?? 0,
                                  thesis:   s.thesis,
                                  bestFor:  s.account,
                                }, s.account);
                              }}
                            >
                              + Add to {s.account}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Gap analysis banner */}
          {gaps.length > 0 && (
            <div className="card" style={{ marginBottom:16, padding:"12px 16px" }}>
              <p className="sec" style={{ marginBottom:8 }}>Portfolio gaps detected</p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {gaps.map(g => (
                  <span key={g} className="gap-badge">⚠ {g}</span>
                ))}
              </div>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:10, lineHeight:1.5 }}>
                Your combined TFSA + RRSP portfolio has no holdings in these sectors. Filter by "Fills Gaps" below to see targeted suggestions.
              </p>
            </div>
          )}

          {/* ── Market context card — live from Market Pulse ── */}
          {(() => {
            const mp  = marketPulse;
            const ctx = portfolioIdeas.marketContext;
            const regime   = mp.regime;
            const risk     = mp.riskMeter;
            const outlook3m = mp.outlooks?.[0];
            const baseCase  = outlook3m?.scenarios?.find(s => s.label === "Base case");
            const yc        = mp.yieldCurve;

            return (
              <div className="card" style={{ marginBottom:16, padding:"14px 18px",
                background:"rgba(34,211,238,0.03)", borderColor:"rgba(34,211,238,0.1)" }}>

                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  marginBottom:12, flexWrap:"wrap", gap:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <p className="sec" style={{ margin:0, color:"#22d3ee88" }}>
                      Market context — {mp.period}
                    </p>
                    {pulseRefreshedAt
                      ? <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                          background:"rgba(167,139,250,0.1)", color:"rgba(167,139,250,0.6)",
                          border:"1px solid rgba(167,139,250,0.2)", fontFamily:"'JetBrains Mono',monospace" }}>
                          ✨ AI live
                        </span>
                      : <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"'JetBrains Mono',monospace" }}>
                          updated {mp.lastUpdated}
                        </span>
                    }
                  </div>
                  {/* Regime + risk meter pills */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                    <span style={{ fontSize:10, fontWeight:600, padding:"2px 9px", borderRadius:4,
                      background:`${regime.color}18`, color: regime.color,
                      border:`1px solid ${regime.color}35` }}>
                      {regime.label}
                    </span>
                    <span style={{ fontSize:10, padding:"2px 9px", borderRadius:4,
                      background:`${risk.color}12`, color: risk.color,
                      border:`1px solid ${risk.color}25` }}>
                      Risk {risk.score}/100 — {risk.label}
                    </span>
                    {yc && (
                      <span style={{ fontSize:10, padding:"2px 9px", borderRadius:4,
                        background:`${yc.shapeColor || "#fbbf24"}12`,
                        color: yc.shapeColor || "#fbbf24",
                        border:`1px solid ${yc.shapeColor || "#fbbf24"}25` }}>
                        Curve: {yc.shapeLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Base-case 3-month snapshot + sector rotation */}
                {baseCase && (
                  <div style={{ background:"rgba(251,191,36,0.05)", border:"1px solid rgba(251,191,36,0.15)",
                    borderLeft:"3px solid #fbbf24", borderRadius:8, padding:"10px 14px", marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      marginBottom:6, flexWrap:"wrap", gap:4 }}>
                      <p style={{ fontSize:10, fontWeight:600, color:"#fbbf24" }}>
                        🟡 Base case ({outlook3m.horizon}) — {baseCase.probability}% probability
                      </p>
                      <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                        color:"#fbbf24" }}>{baseCase.marketTarget}</span>
                    </div>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.5, marginBottom:6 }}>
                      {baseCase.trigger}
                    </p>
                    {baseCase.sectorRotation && (
                      <div style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
                        <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase",
                          letterSpacing:"0.05em", whiteSpace:"nowrap", marginTop:1 }}>Sector rotation</span>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.55)", lineHeight:1.4 }}>
                          {baseCase.sectorRotation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Investment themes from recommendations.json (curated) */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))", gap:8 }}>
                  {ctx.themes.map(c => (
                    <div key={c.label} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ fontSize:15, flexShrink:0 }}>{c.icon}</span>
                      <div>
                        <p style={{ fontSize:11, fontWeight:500,
                          color: c.color || "rgba(255,255,255,0.7)", marginBottom:2 }}>{c.label}</p>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.33)", lineHeight:1.4 }}>{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Signal → Trade panel (from Market Pulse portfolioImplication) ── */}
          {(() => {
            const actions = marketPulse?.portfolioImplication?.actions || [];
            if (!actions.length) return null;

            // Extract known tickers from action text
            const knownTickers = new Set(RECOMMENDATIONS.map(r => r.ticker));
            const extractTickers = txt =>
              [...new Set((txt.match(/\b([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\b/g) || [])
                .filter(t => knownTickers.has(t)))];

            const pColor = p => p === "High" ? "#ef4444" : p === "Medium" ? "#fbbf24" : "#64748b";

            return (
              <div className="card" style={{ marginBottom:16, padding:"14px 18px",
                background:"rgba(167,139,250,0.03)", borderColor:"rgba(167,139,250,0.12)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <p style={{ fontSize:11, fontWeight:600, color:"#a78bfa" }}>
                    🎯 Pulse signals → trade actions
                  </p>
                  <span style={{ fontSize:9, color:"rgba(167,139,250,0.4)" }}>
                    from current Market Pulse · click tickers to filter Ideas
                  </span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {actions.map((a, i) => {
                    const tickers = extractTickers(a.action);
                    const pc = pColor(a.priority);
                    return (
                      <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start",
                        padding:"8px 12px", borderRadius:8,
                        background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4,
                          whiteSpace:"nowrap", marginTop:1, fontWeight:600,
                          background:`${pc}18`, color: pc, border:`1px solid ${pc}30` }}>
                          {a.priority}
                        </span>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.55)",
                          lineHeight:1.5, flex:1 }}>{a.action}</p>
                        {tickers.length > 0 && (
                          <div style={{ display:"flex", gap:5, flexShrink:0, flexWrap:"wrap",
                            alignItems:"center" }}>
                            {tickers.map(t => {
                              const rec = RECOMMENDATIONS.find(r => r.ticker === t);
                              return (
                                <button key={t}
                                  onClick={() => addRecommendedTicker(rec, rec?.bestFor === "RRSP" ? "RRSP" : "TFSA")}
                                  title={`Add ${t} to ${rec?.bestFor === "RRSP" ? "RRSP" : "TFSA"}`}
                                  style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                                    fontWeight:600, padding:"3px 8px", borderRadius:4, cursor:"pointer",
                                    background:"rgba(167,139,250,0.12)",
                                    border:"1px solid rgba(167,139,250,0.3)",
                                    color:"#a78bfa" }}>
                                  + {t}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Filter bar */}
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginRight:4 }}>Filter:</span>
            {[
              ["all",   "All ideas"],
              ["tfsa",  "Best for TFSA"],
              ["rrsp",  "Best for RRSP"],
              ["gaps",  "Fills Gaps"],
              ["pulse", "✨ Pulse aligned"],
            ].map(([v,l]) => (
              <button key={v} className={`tab-btn ${recFilter===v?"on":""}`}
                onClick={() => setRecFilter(v)}
                style={{ padding:"5px 12px", fontSize:11,
                  ...(v === "pulse" && recFilter !== "pulse"
                    ? { borderColor:"rgba(167,139,250,0.3)", color:"rgba(167,139,250,0.7)" }
                    : {}) }}>
                {l}
              </button>
            ))}
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginLeft:"auto" }}>
              {filteredRecs.length} stock{filteredRecs.length !== 1 ? "s" : ""} · already-owned excluded
            </span>
          </div>

          {/* Buy Radar — compact, filtered to Ideas tickers */}
          {(() => {
            const ideaTickers = new Set(RECOMMENDATIONS.map(r => r.ticker));
            const inZone   = buyRadarData.inZone.filter(s => ideaTickers.has(s.ticker)).slice(0, 6);
            const nearZone = buyRadarData.nearZone.filter(s => ideaTickers.has(s.ticker)).slice(0, 6);
            if (!inZone.length && !nearZone.length) return null;
            const pFmt = p => p < 10 ? p.toFixed(2) : p < 100 ? p.toFixed(1) : Math.round(p);
            return (
              <div className="card" style={{ marginBottom:14, padding:"12px 16px",
                borderColor:"rgba(34,197,94,0.2)", background:"rgba(34,197,94,0.02)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                  <span style={{ fontSize:13 }}>🎯</span>
                  <span style={{ fontSize:12, fontWeight:700, color:"#f1f5f9" }}>Buy Radar</span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>Ideas picks currently at or near fair value</span>
                  <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                    {inZone.length > 0 && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)", color:"#22c55e", fontWeight:700 }}>{inZone.length} buy now</span>}
                    {nearZone.length > 0 && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)", color:"#fbbf24", fontWeight:700 }}>{nearZone.length} approaching</span>}
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {inZone.map(s => (
                    <div key={s.ticker} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:8,
                      background: s.held ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                      border:"1px solid rgba(34,197,94,0.25)" }}>
                      <span style={{ fontSize:11, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>{s.ticker}</span>
                      {s.held && <span style={{ fontSize:8, color:"#22d3ee", fontWeight:700 }}>held</span>}
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>${pFmt(s.price)}</span>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>→</span>
                      <span style={{ fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>buy@${pFmt(s.fairPrice)}</span>
                      <span style={{ fontSize:10, fontWeight:700, color:"#22c55e" }}>+{s.upside}%</span>
                    </div>
                  ))}
                  {nearZone.map(s => (
                    <div key={s.ticker} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:8,
                      background: s.held ? "rgba(251,191,36,0.05)" : "rgba(255,255,255,0.02)",
                      border:"1px solid rgba(251,191,36,0.18)" }}>
                      <span style={{ fontSize:11, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>{s.ticker}</span>
                      {s.held && <span style={{ fontSize:8, color:"#22d3ee", fontWeight:700 }}>held</span>}
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>${pFmt(s.price)}</span>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>→</span>
                      <span style={{ fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>trigger@${pFmt(s.fairPrice)}</span>
                      <span style={{ fontSize:10, color:"#fbbf24" }}>{Math.abs(s.upside).toFixed(1)}% away</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── BNN Bloomberg Market Call picks ─────────────────────────── */}
          {(bnnCalls?.days?.length > 0 || bnnCalls?.experts?.length > 0) && (() => {
            const ACTION_COLOR = { buy:"#22c55e", sell:"#ef4444", hold:"#fbbf24", caution:"#fb923c" };
            const ACTION_BG    = { buy:"rgba(34,197,94,0.1)", sell:"rgba(239,68,68,0.1)", hold:"rgba(251,191,36,0.1)", caution:"rgba(251,146,60,0.1)" };

            const days = bnnCalls.days?.length ? bnnCalls.days : [bnnCalls];
            const safeIdx = Math.min(bnnDayIndex, days.length - 1);
            const activeDay = days[safeIdx] || days[0];

            const renderPick = (pick, i) => {
              const ac = ACTION_COLOR[pick.action] || "#94a3b8";
              const ab = ACTION_BG[pick.action]    || "rgba(148,163,184,0.08)";
              return (
                <div key={i} style={{ padding:"12px 14px", borderRadius:10,
                  background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display:"flex", alignItems:"center",
                    justifyContent:"space-between", marginBottom:5, gap:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <span style={{ fontSize:15, fontFamily:"'JetBrains Mono',monospace",
                        fontWeight:700, color:"rgba(255,255,255,0.9)" }}>
                        {pick.ticker}
                      </span>
                      {pick.exchange && (
                        <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>{pick.exchange}</span>
                      )}
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:4,
                      background: ab, color: ac, border:`1px solid ${ac}35`,
                      textTransform:"uppercase", letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
                      {pick.rawAction || pick.action}
                    </span>
                  </div>
                  {pick.name && (
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.38)", marginBottom:6 }}>{pick.name}</p>
                  )}
                  {pick.targetPrice != null && (
                    <span style={{ fontSize:9, padding:"1px 6px", borderRadius:3, display:"inline-block",
                      marginBottom:6, background:"rgba(34,197,94,0.06)", color:"#4ade80",
                      border:"1px solid rgba(34,197,94,0.2)" }}>
                      Target ${pick.targetPrice}
                    </span>
                  )}
                  {pick.rationale && (
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.5, margin:"0 0 8px" }}>
                      {pick.rationale}
                    </p>
                  )}
                  <button className="btn"
                    onClick={() => { setSearchQuery(pick.ticker); setTab("search"); }}
                    style={{ width:"100%", fontSize:10, padding:"5px 0",
                      borderColor:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.35)" }}>
                    Look up in Search →
                  </button>
                </div>
              );
            };

            return (
              <div className="card" style={{ marginBottom:16, padding:"16px 20px",
                background:"rgba(239,68,68,0.03)", border:"1px solid rgba(239,68,68,0.18)" }}>
                {/* Header row */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  flexWrap:"wrap", gap:10, marginBottom: days.length > 1 ? 10 : 16 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#f87171" }}>
                    📺 BNN Bloomberg — Market Call
                  </p>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)",
                    fontFamily:"'JetBrains Mono',monospace" }}>
                    {activeDay.date || activeDay.fetchedAt?.slice(0,10)}
                  </span>
                </div>

                {/* Day selector tabs — only shown when we have more than one day */}
                {days.length > 1 && (
                  <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
                    {days.map((day, di) => {
                      const dateStr = day.date || day.fetchedAt?.slice(0,10) || `Day ${di+1}`;
                      const pickCount = (day.experts || []).reduce((s,e) => s + (e.picks?.length || 0), 0);
                      const isActive = di === safeIdx;
                      return (
                        <button key={di} onClick={() => setBnnDayIndex(di)} style={{
                          padding:"4px 10px", borderRadius:5, cursor:"pointer",
                          border:`1px solid ${isActive ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`,
                          background: isActive ? "rgba(248,113,113,0.15)" : "transparent",
                          color: isActive ? "#f87171" : "rgba(255,255,255,0.35)",
                          fontSize:10, fontFamily:"'JetBrains Mono',monospace", display:"flex", alignItems:"center", gap:5,
                        }}>
                          {dateStr}
                          {di === 0 && (
                            <span style={{ fontSize:8, opacity:0.6 }}>LATEST</span>
                          )}
                          <span style={{ fontSize:9, padding:"1px 5px", borderRadius:3,
                            background: isActive ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.05)",
                            color: isActive ? "#f87171" : "rgba(255,255,255,0.25)" }}>
                            {pickCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Picks summary badge */}
                <div style={{ marginBottom:14 }}>
                  <span style={{ fontSize:10, padding:"2px 7px", borderRadius:4,
                    background:"rgba(248,113,113,0.1)", color:"#f87171",
                    border:"1px solid rgba(248,113,113,0.25)" }}>
                    {(activeDay.experts || []).reduce((s, e) => s + (e.picks?.length || 0), 0)} picks
                  </span>
                </div>

                {/* One section per expert in the active day */}
                {(activeDay.experts || []).map((expert, ei) => (
                  <div key={ei} style={{ marginBottom: ei < (activeDay.experts?.length ?? 1) - 1 ? 20 : 0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)" }}>
                        {expert.guest}
                      </span>
                      {expert.firm && (
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>· {expert.firm}</span>
                      )}
                      <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)" }}>
                        {expert.picks?.length || 0} picks
                      </span>
                    </div>
                    {expert.picks?.length > 0 ? (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:10 }}>
                        {expert.picks.map((pick, i) => renderPick(pick, i))}
                      </div>
                    ) : (
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>No picks found for this expert.</p>
                    )}
                  </div>
                ))}

                <p style={{ fontSize:9, color:"rgba(255,255,255,0.18)", marginTop:14, marginBottom:0 }}>
                  Guest opinions — not endorsements. Source: BNN Bloomberg Market Call · Stockchase.com. Verify before acting.
                </p>
              </div>
            );
          })()}

          {(() => {
            const MOAT_COLOR = {
              "Network Effect":       "#a78bfa",
              "IP Royalties":         "#60a5fa",
              "IP / Patent":          "#60a5fa",
              "Regulated Monopoly":   "#2dd4bf",
              "Government Contract":  "#fb923c",
              "Switching Costs":      "#f472b6",
              "Cost Leader":          "#22c55e",
              "Low-Cost Producer":    "#22c55e",
              "Diversified Portfolio":"#94a3b8",
            };
            const ROLE_META = {
              anchor:   { label:"Shock Absorber", color:"#2dd4bf",  desc:"Holds value in drawdowns" },
              growth:   { label:"Growth Engine",  color:"#a78bfa",  desc:"High-conviction compounder" },
              cyclical: { label:"Cyclical Bet",   color:"#fb923c",  desc:"Timing-sensitive — size carefully" },
            };

            const roleOrder = { anchor: 0, growth: 1, cyclical: 2 };
            const sortByRole = arr => [...arr].sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9));

            const recStocks = sortByRole(filteredRecs);

            const renderCard = (rec) => {
              const rotation = marketPulse?.outlooks?.[0]?.scenarios
                ?.find(s => s.label === "Base case")?.sectorRotation?.toLowerCase() || "";
              const sectorWord = (rec.sector || "").toLowerCase().split(" ")[0];
              let alignment = null;
              if (rotation) {
                const isAligned = ["overweight","add","rotate into","favor","tilt to"]
                  .some(t => { const i = rotation.indexOf(t); return i !== -1 && rotation.slice(i, i+90).includes(sectorWord); });
                const isAvoid = ["underweight","avoid","reduce","trim","rotate out"]
                  .some(t => { const i = rotation.indexOf(t); return i !== -1 && rotation.slice(i, i+90).includes(sectorWord); });
                if (isAligned) alignment = { label:"Regime aligned", color:"#22c55e" };
                else if (isAvoid) alignment = { label:"Regime avoid", color:"#ef4444" };
              }
              const moatColor = rec.moat ? (MOAT_COLOR[rec.moat] || "#94a3b8") : null;

              return (
                <div key={rec.ticker} className="rec-card">
                  {/* Card header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                        <span style={{ fontSize:18, fontFamily:"'JetBrains Mono', monospace",
                          fontWeight:600, color: rec.bestFor === "TFSA" ? "#fbbf24" : rec.bestFor === "RRSP" ? "#22d3ee" : "#a78bfa" }}>
                          {rec.ticker}
                        </span>
                        <span style={{ fontSize:10, fontWeight:500, padding:"2px 7px", borderRadius:4,
                          background: rec.conviction === "High"
                            ? "rgba(52,211,153,0.12)" : "rgba(148,163,184,0.1)",
                          color:  rec.conviction === "High" ? "#34d399" : "#94a3b8",
                          border: `1px solid ${rec.conviction === "High" ? "rgba(52,211,153,0.3)" : "rgba(148,163,184,0.2)"}` }}>
                          {rec.conviction}
                        </span>
                        {alignment && (
                          <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, fontWeight:600,
                            background:`${alignment.color}15`, color: alignment.color,
                            border:`1px solid ${alignment.color}35` }}>
                            {alignment.label === "Regime aligned" ? "✓" : "✗"} {alignment.label}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.45)" }}>{rec.name}</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4,
                        background: rec.bestFor === "TFSA"
                          ? "rgba(251,191,36,0.1)" : rec.bestFor === "RRSP"
                          ? "rgba(34,211,238,0.1)" : "rgba(167,139,250,0.1)",
                        color: rec.bestFor === "TFSA" ? "#fbbf24" : rec.bestFor === "RRSP" ? "#22d3ee" : "#a78bfa",
                        border: `1px solid ${rec.bestFor === "TFSA" ? "rgba(251,191,36,0.25)" : rec.bestFor === "RRSP" ? "rgba(34,211,238,0.25)" : "rgba(167,139,250,0.25)"}` }}>
                        {rec.bestFor === "both" ? "TFSA / RRSP" : rec.bestFor}
                      </span>
                      {rec.divYield >= 3 && (
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:4 }}>{rec.divYield}% yield</p>
                      )}
                      {rec.divYield === 0 && (
                        <p style={{ fontSize:10, color:"rgba(52,211,153,0.6)", marginTop:4 }}>No dividend</p>
                      )}
                    </div>
                  </div>

                  {/* MOAT badge */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:2 }}>
                    {moatColor && (
                      <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:4,
                        background:`${moatColor}12`, color: moatColor,
                        border:`1px solid ${moatColor}30` }}>
                        ◆ {rec.moat}
                      </span>
                    )}
                    {false && (  // placeholder to preserve surrounding JSX structure
                      <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:4,
                            background:"rgba(34,197,94,0.08)", color:"#4ade80",
                            border:"1px solid rgba(34,197,94,0.25)" }}>
                            ✓ Diversified
                          </span>
                    )}
                    {rec.role && (() => {
                      const rm = ROLE_META[rec.role];
                      if (!rm) return null;
                      return (
                        <span title={rm.desc} style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:4,
                          background:`${rm.color}10`, color: rm.color,
                          border:`1px solid ${rm.color}28`, cursor:"default" }}>
                          {rm.label}
                        </span>
                      );
                    })()}
                    <span style={{ fontSize:10, padding:"2px 7px", borderRadius:4,
                      background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)",
                      border:"1px solid rgba(255,255,255,0.08)" }}>
                      {rec.sector}
                    </span>
                    {rec.tags.map(tag => (
                      <span key={tag} style={{ fontSize:10, padding:"2px 7px", borderRadius:4,
                        background:"rgba(167,139,250,0.06)", color:"rgba(167,139,250,0.6)",
                        border:"1px solid rgba(167,139,250,0.15)" }}>
                        {tag}
                      </span>
                    ))}
                    {rec.fills.some(f => gaps.includes(f)) && (
                      <span style={{ fontSize:10, padding:"2px 7px", borderRadius:4,
                        background:"rgba(251,146,60,0.1)", color:"#fb923c",
                        border:"1px solid rgba(251,146,60,0.25)" }}>
                        Fills gap
                      </span>
                    )}
                  </div>

                  {/* Thesis */}
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", lineHeight:1.6 }}>{rec.thesis}</p>

                  {/* Risk callout */}
                  {rec.risks?.length > 0 && (
                    <div style={{ padding:"8px 10px", borderRadius:7, marginTop:2,
                      background:"rgba(239,68,68,0.04)", border:"1px solid rgba(239,68,68,0.14)" }}>
                      <p style={{ fontSize:10, fontWeight:600, color:"rgba(248,113,113,0.8)", marginBottom:5, letterSpacing:"0.03em" }}>
                        ⚠ RISKS TO MONITOR
                      </p>
                      <ul style={{ margin:0, padding:"0 0 0 14px" }}>
                        {rec.risks.map((r, i) => (
                          <li key={i} style={{ fontSize:10, color:"rgba(255,255,255,0.38)", lineHeight:1.6 }}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Add buttons */}
                  <div style={{ display:"flex", gap:8, marginTop:"auto" }}>
                    <button className="btn" onClick={() => addRecommendedTicker(rec, "TFSA")}
                      style={{ flex:1, fontSize:11, padding:"6px 10px",
                        borderColor:"rgba(251,191,36,0.3)", color:"rgba(251,191,36,0.8)" }}>
                      + Add to TFSA
                    </button>
                    <button className="btn" onClick={() => addRecommendedTicker(rec, "RRSP")}
                      style={{ flex:1, fontSize:11, padding:"6px 10px",
                        borderColor:"rgba(34,211,238,0.3)", color:"rgba(34,211,238,0.8)" }}>
                      + Add to RRSP
                    </button>
                  </div>
                </div>
              );
            };

            if (filteredRecs.length === 0) return (
              <div className="card" style={{ textAlign:"center", padding:"40px 20px" }}>
                <p style={{ fontSize:14, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>
                  {recFilter === "gaps" ? "No gap-filling ideas available — your portfolio is well-diversified!" : "No ideas match the current filter."}
                </p>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>Try clearing the filter or adding more positions.</p>
              </div>
            );

            return (
              <>
                {recStocks.length > 0 && (
                  <>
                    {(() => {
                      const groups = [
                        { role:"anchor",   items: recStocks.filter(r => r.role === "anchor") },
                        { role:"growth",   items: recStocks.filter(r => r.role === "growth") },
                        { role:"cyclical", items: recStocks.filter(r => r.role === "cyclical" || !r.role) },
                      ].filter(g => g.items.length > 0);
                      return groups.map(({ role, items }) => {
                        const rm = ROLE_META[role];
                        return (
                          <div key={role} style={{ marginBottom: 20 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                              <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:4,
                                background:`${rm.color}10`, color: rm.color,
                                border:`1px solid ${rm.color}28` }}>
                                {rm.label}
                              </span>
                              <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>{rm.desc}</span>
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:12 }}>
                              {items.map(rec => renderCard(rec))}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </>
                )}

              </>
            );
          })()}

          <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:20, lineHeight:1.5 }}>
            ⚠ Not financial advice. Recommendations are for educational purposes only. Market conditions change rapidly. Consult a licensed financial advisor before making investment decisions.
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: TICKER SEARCH
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "search" && (
        <div style={{ padding:"22px 28px" }}>

          {/* Search bar */}
          <div className="card" style={{ marginBottom:20 }}>
            <p className="sec" style={{ marginBottom:10 }}>Ticker Lookup &amp; Analysis</p>
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value.toUpperCase())}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const q = searchQuery.trim();
                    setSearchResult(q ? (TICKER_DB[q] || { ticker:q, notFound:true }) : null);
                  }
                }}
                placeholder="Type ticker and press Enter — e.g. NVDA, COST, BRK.B…"
                style={{ fontSize:14, flex:"1 1 280px", maxWidth:420 }}
              />
              <button className="btn btn-primary" onClick={() => {
                const q = searchQuery.trim();
                setSearchResult(q ? (TICKER_DB[q] || { ticker:q, notFound:true }) : null);
              }}>Search</button>
              {searchResult && (
                <button className="btn" onClick={() => { setSearchResult(null); setSearchQuery(""); }}>✕ Clear</button>
              )}
            </div>
            <div>
              <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:7 }}>Quick access — curated picks:</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {RECOMMENDATIONS.slice(0, 16).map(r => (
                  <button key={r.ticker} className="btn"
                    onClick={() => { setSearchQuery(r.ticker); setSearchResult(r); }}
                    style={{ padding:"3px 10px", fontSize:11,
                      borderColor: r.bestFor==="TFSA" ? "rgba(251,191,36,0.25)" : "rgba(34,211,238,0.25)",
                      color: r.bestFor==="TFSA" ? "rgba(251,191,36,0.75)" : "rgba(34,211,238,0.75)" }}>
                    {r.ticker}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result: found in curated DB */}
          {searchResult && !searchResult.notFound && (() => {
            const rec = searchResult;
            const cagr = rec.cagr ?? DEFAULT_CAGR[rec.ticker];
            return (
              <div style={{ maxWidth:640 }}>
                <div className="rec-card" style={{ borderColor:`${accentColor}30` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                        <span style={{ fontSize:24, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                          color: rec.bestFor==="TFSA" ? "#fbbf24" : rec.bestFor==="RRSP" ? "#22d3ee" : "#a78bfa" }}>
                          {rec.ticker}
                        </span>
                        <span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:4,
                          background: rec.conviction==="High" ? "rgba(52,211,153,0.12)" : "rgba(148,163,184,0.1)",
                          color: rec.conviction==="High" ? "#34d399" : "#94a3b8",
                          border: `1px solid ${rec.conviction==="High" ? "rgba(52,211,153,0.3)" : "rgba(148,163,184,0.2)"}` }}>
                          {rec.conviction} conviction
                        </span>
                      </div>
                      <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginBottom:3 }}>{rec.name}</p>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{rec.sector}</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <span style={{ fontSize:11, padding:"3px 10px", borderRadius:4,
                        background: rec.bestFor==="TFSA" ? "rgba(251,191,36,0.1)" : rec.bestFor==="RRSP" ? "rgba(34,211,238,0.1)" : "rgba(167,139,250,0.1)",
                        color: rec.bestFor==="TFSA" ? "#fbbf24" : rec.bestFor==="RRSP" ? "#22d3ee" : "#a78bfa",
                        border: `1px solid ${rec.bestFor==="TFSA" ? "rgba(251,191,36,0.25)" : rec.bestFor==="RRSP" ? "rgba(34,211,238,0.25)" : "rgba(167,139,250,0.25)"}` }}>
                        Best for {rec.bestFor==="both" ? "TFSA / RRSP" : rec.bestFor}
                      </span>
                      <p style={{ fontSize:11, color: rec.divYield >= 3 ? "#a78bfa" : "#34d399", marginTop:6 }}>
                        {rec.divYield >= 3 ? `${rec.divYield}% dividend yield` : "No dividend — growth only"}
                      </p>
                      {cagr && <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:3 }}>Est. CAGR: {cagr}%/yr</p>}
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4,
                      background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.4)",
                      border:"1px solid rgba(255,255,255,0.08)" }}>{rec.sector}</span>
                    {rec.tags.map(tag => (
                      <span key={tag} style={{ fontSize:10, padding:"2px 7px", borderRadius:4,
                        background:"rgba(167,139,250,0.06)", color:"rgba(167,139,250,0.6)",
                        border:"1px solid rgba(167,139,250,0.15)" }}>{tag}</span>
                    ))}
                  </div>

                  <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:8, padding:"12px 14px",
                    border:"1px solid rgba(255,255,255,0.05)" }}>
                    <p style={{ fontSize:10, color:`${accentColor}88`, letterSpacing:"0.1em",
                      textTransform:"uppercase", marginBottom:6, fontWeight:500 }}>Investment thesis</p>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.65)", lineHeight:1.7 }}>{rec.thesis}</p>
                  </div>

                  {cagr && (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                      {[10,15,20].map(yrs => (
                        <div key={yrs} style={{ background:"rgba(255,255,255,0.02)", borderRadius:8,
                          padding:"9px 12px", border:"1px solid rgba(255,255,255,0.05)", textAlign:"center" }}>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em",
                            textTransform:"uppercase", marginBottom:5 }}>{yrs}yr @ {cagr}%</p>
                          <p style={{ fontSize:14, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                            color: yrs===10 ? "#34d399" : yrs===15 ? "#22d3ee" : accentColor }}>
                            {Math.pow(1+cagr/100,yrs).toFixed(1)}×
                          </p>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:3 }}>
                            $10K → ${Math.round(10000*Math.pow(1+cagr/100,yrs)/1000)}K
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {portfolios.map(p => {
                      const already = (holdings[p]||[]).some(h => h.ticker === rec.ticker);
                      const col = PORTFOLIO_COLORS[p] ?? EXTRA_COLORS[(portfolios.indexOf(p)-2+EXTRA_COLORS.length)%EXTRA_COLORS.length];
                      return (
                        <button key={p} className="btn"
                          onClick={() => already ? null : addRecommendedTicker(rec, p)}
                          style={{ flex:1, fontSize:11, padding:"7px 10px", opacity: already ? 0.4 : 1,
                            borderColor:`rgba(${col.rgb},0.3)`, color:`rgba(${col.rgb},0.85)`,
                            cursor: already ? "default" : "pointer" }}>
                          {already ? `✓ In ${p}` : `+ Add to ${p}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Result: not in DB */}
          {searchResult && searchResult.notFound && searchResult.ticker && (
            <div className="card" style={{ maxWidth:640 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <span style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:accentColor }}>
                  {searchResult.ticker}
                </span>
                <span style={{ fontSize:11, padding:"3px 10px", borderRadius:4,
                  background:"rgba(148,163,184,0.07)", color:"#64748b",
                  border:"1px solid rgba(148,163,184,0.15)" }}>Not in database</span>
              </div>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.65, marginBottom:14 }}>
                This ticker isn't in our curated database. You can add it manually or get a deep AI analysis
                using the prompt below at <span style={{ color:accentColor }}>claude.ai</span>.
              </p>
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:10, color:`${accentColor}88`, letterSpacing:"0.1em", textTransform:"uppercase",
                  marginBottom:8, fontWeight:500 }}>Copy this prompt for Claude AI:</p>
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                  borderRadius:8, padding:"12px 14px", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:11, color:"rgba(255,255,255,0.55)", lineHeight:1.75, userSelect:"all" }}>
                  Analyze {searchResult.ticker} as a long-term investment for a Canadian investor using
                  registered accounts (TFSA/RRSP). Cover: business model, growth catalysts, key risks,
                  fair value estimate, dividend info, and whether it is better suited for TFSA or RRSP.
                  Include an estimated 5-year CAGR and a conviction rating (High / Medium / Low).
                </div>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {portfolios.map(p => {
                  const col = PORTFOLIO_COLORS[p] ?? EXTRA_COLORS[(portfolios.indexOf(p)-2+EXTRA_COLORS.length)%EXTRA_COLORS.length];
                  return (
                    <button key={p} className="btn"
                      onClick={() => addRecommendedTicker({
                        ticker:searchResult.ticker, name:searchResult.ticker,
                        divYield:0, thesis:"Added via ticker search",
                      }, p)}
                      style={{ fontSize:11, padding:"7px 14px",
                        borderColor:`rgba(${col.rgb},0.3)`, color:`rgba(${col.rgb},0.85)` }}>
                      + Add to {p}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Default: browse all curated tickers */}
          {!searchResult && (
            <>
              <p className="sec" style={{ marginBottom:10 }}>
                Curated database — {RECOMMENDATIONS.length} tickers analyzed
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:8 }}>
                {RECOMMENDATIONS.map(rec => (
                  <button key={rec.ticker}
                    onClick={() => { setSearchQuery(rec.ticker); setSearchResult(rec); }}
                    style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
                      borderRadius:10, padding:"12px 14px", cursor:"pointer", textAlign:"left",
                      display:"flex", alignItems:"center", gap:10, fontFamily:"inherit",
                      transition:"border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.06)"}>
                    <div style={{ minWidth:54 }}>
                      <p style={{ fontSize:14, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
                        color: rec.bestFor==="TFSA" ? "#fbbf24" : "#22d3ee" }}>{rec.ticker}</p>
                      <p style={{ fontSize:9, color: rec.conviction==="High" ? "#34d399" : "#64748b", marginTop:2 }}>
                        {rec.conviction}
                      </p>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", whiteSpace:"nowrap",
                        overflow:"hidden", textOverflow:"ellipsis" }}>{rec.name}</p>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{rec.sector}</p>
                    </div>
                    <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, whiteSpace:"nowrap",
                      background: rec.bestFor==="TFSA" ? "rgba(251,191,36,0.08)" : "rgba(34,211,238,0.08)",
                      color: rec.bestFor==="TFSA" ? "rgba(251,191,36,0.6)" : "rgba(34,211,238,0.6)",
                      border: `1px solid ${rec.bestFor==="TFSA" ? "rgba(251,191,36,0.15)" : "rgba(34,211,238,0.15)"}` }}>
                      {rec.bestFor}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:20, lineHeight:1.5 }}>
            ⚠ Not financial advice. Analysis is for educational purposes only.
            Consult a licensed financial advisor before investing.
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: MARKET PULSE
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "pulse" && (() => {
        const mp = marketPulse;
        const regime = mp.regime;
        const risk = mp.riskMeter;

        const trendIcon = t => t === "up" ? "↑" : t === "down" ? "↓" : "→";
        const trendColor = (t, status) => {
          if (status === "bullish") return "#22c55e";
          if (status === "bearish") return "#ef4444";
          if (status === "caution") return "#fbbf24";
          if (t === "up") return "#22c55e";
          if (t === "down") return "#ef4444";
          return "rgba(255,255,255,0.45)";
        };

        return (
          <div style={{ padding:"22px 28px" }}>

            {/* ── Claude AI refresh panel ── */}
            <div className="card" style={{ marginBottom:16, padding:"16px 20px",
              background:"rgba(167,139,250,0.03)", borderColor:"rgba(167,139,250,0.12)" }}>

              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ fontSize:13 }}>✨</span>
                  <p style={{ fontSize:11, fontWeight:600, color:"#a78bfa" }}>Refresh with Claude AI</p>
                </div>
                {pulseRefreshedAt && (
                  <span style={{ fontSize:9, color:"rgba(167,139,250,0.5)", fontFamily:"'JetBrains Mono',monospace" }}>
                    last refreshed {new Date(pulseRefreshedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {/* One-click AI refresh — Pro plan only */}
              <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
                {licenseTier === "basic" ? (
                  <a href={LS_CHECKOUT_PRO} target="_blank" rel="noreferrer"
                    style={{ fontSize:12, padding:"8px 18px", borderRadius:8, textDecoration:"none",
                      display:"inline-flex", alignItems:"center", gap:6,
                      background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.3)",
                      color:"#fbbf24", fontWeight:600 }}>
                    ⚡ Refresh with AI — <span style={{ fontWeight:700 }}>Pro only</span> · Upgrade →
                  </a>
                ) : (
                  <>
                    <button className="btn" onClick={refreshMarketPulse} disabled={pulseLoading}
                      style={{ fontSize:12, padding:"8px 18px",
                        background:"rgba(167,139,250,0.18)", borderColor:"rgba(167,139,250,0.35)",
                        color:"#a78bfa", opacity: pulseLoading ? 0.6 : 1 }}>
                      {pulseLoading ? "Refreshing…" : "⚡ Refresh with AI"}
                    </button>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.22)" }}>Included with Pro · no API key needed</span>
                  </>
                )}
              </div>

              {/* Paste fallback — for manual / offline use */}
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:12, marginBottom:0 }}>
                <p style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.25)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  Manual fallback — paste from claude.ai
                </p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:10 }}>
                  <button className="btn" onClick={copyMarketPulsePrompt} disabled={pulseCopyLoading}
                    style={{ fontSize:11, padding:"6px 14px",
                      background: pulseCopied ? "rgba(34,197,94,0.15)" : "rgba(167,139,250,0.08)",
                      borderColor: pulseCopied ? "rgba(34,197,94,0.3)" : "rgba(167,139,250,0.18)",
                        color: pulseCopied ? "#22c55e" : "#a78bfa",
                        opacity: pulseCopyLoading ? 0.6 : 1 }}>
                      {pulseCopyLoading ? "Fetching signals…" : pulseCopied ? "✓ Copied!" : "📋 Copy prompt"}
                    </button>
                    {pulseCopied && (
                      <a href="https://claude.ai" target="_blank" rel="noreferrer"
                        style={{ fontSize:11, padding:"6px 14px", borderRadius:6, textDecoration:"none",
                          background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)",
                          color:"#22c55e" }}>
                        Open claude.ai →
                      </a>
                    )}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>Or paste a claude.ai response to apply manually</span>
                    <button className="btn" onClick={() => { setPulsePasteOpen(o => !o); setPulsePasteError(null); }}
                      style={{ fontSize:10, padding:"4px 10px",
                        background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)",
                        color:"rgba(255,255,255,0.35)" }}>
                      {pulsePasteOpen ? "▲ Hide" : "▼ Paste response"}
                    </button>
                  </div>

                {pulsePasteOpen && (
                  <div>
                    <textarea
                      value={pulsePasteText}
                      onChange={e => { setPulsePasteText(e.target.value); setPulsePasteError(null); }}
                      placeholder="Paste Claude's full response here — the app will extract the JSON automatically even if there is text around it…"
                      rows={8}
                      style={{ width:"100%", fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                        background:"rgba(255,255,255,0.03)", border:"1px solid rgba(167,139,250,0.2)",
                        borderRadius:8, padding:"10px 12px", color:"rgba(255,255,255,0.65)",
                        resize:"vertical", boxSizing:"border-box", lineHeight:1.5 }}
                    />
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8 }}>
                      <button className="btn btn-primary" onClick={applyPastedPulse}
                        disabled={!pulsePasteText.trim()}
                        style={{ fontSize:11, padding:"7px 20px",
                          background:"rgba(167,139,250,0.2)", borderColor:"rgba(167,139,250,0.4)",
                          color:"#a78bfa", opacity: pulsePasteText.trim() ? 1 : 0.4 }}>
                        Apply &amp; Refresh Dashboard
                      </button>
                      {pulsePasteText.trim() && (
                        <button className="btn" onClick={() => { setPulsePasteText(""); setPulsePasteError(null); }}
                          style={{ fontSize:10, padding:"7px 14px", color:"rgba(255,255,255,0.3)",
                            borderColor:"rgba(255,255,255,0.07)" }}>
                          Clear
                        </button>
                      )}
                    </div>
                    {pulsePasteError && (
                      <p style={{ fontSize:10, color:"#ef4444", marginTop:8, padding:"6px 10px",
                        background:"rgba(239,68,68,0.07)", borderRadius:6, border:"1px solid rgba(239,68,68,0.2)" }}>
                        ⚠ {pulsePasteError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {pulseError && (
                <p style={{ fontSize:10, color:"#ef4444", marginTop:10, padding:"6px 10px",
                  background:"rgba(239,68,68,0.07)", borderRadius:6, border:"1px solid rgba(239,68,68,0.2)" }}>
                  ⚠ {pulseError}
                </p>
              )}
              {pulseApplyDone && (
                <p style={{ fontSize:10, color:"#22c55e", marginTop:10, padding:"8px 12px",
                  background:"rgba(34,197,94,0.07)", borderRadius:6, border:"1px solid rgba(34,197,94,0.2)" }}>
                  ✓ Market Pulse updated — scroll down to see the refreshed dashboard.
                </p>
              )}
            </div>

            {/* ── ACTION CENTER ── */}
            {mp.portfolioImplication?.actions?.length > 0 && (() => {
              const typeStyles = {
                Buy:       { bg:"rgba(34,197,94,0.10)",   border:"rgba(34,197,94,0.30)",  color:"#22c55e", icon:"↑ Buy"    },
                Hold:      { bg:"rgba(34,211,238,0.07)",  border:"rgba(34,211,238,0.20)", color:"#22d3ee", icon:"◆ Hold"   },
                Reduce:    { bg:"rgba(239,68,68,0.10)",   border:"rgba(239,68,68,0.28)",  color:"#ef4444", icon:"↓ Reduce" },
                Watch:     { bg:"rgba(251,191,36,0.08)",  border:"rgba(251,191,36,0.25)", color:"#fbbf24", icon:"◎ Watch"  },
                Rebalance: { bg:"rgba(167,139,250,0.09)", border:"rgba(167,139,250,0.28)",color:"#a78bfa", icon:"⇄ Rebalance" },
              };
              const pBorder = p => p==="High"?"#ef4444":p==="Medium"?"#fbbf24":"#64748b";

              // For each ticker find where it's held and its current CAD value
              const holdingInfo = ticker => {
                if (!ticker || ticker==="null") return [];
                return portfolios.flatMap(p =>
                  (holdings[p]||[])
                    .filter(h => h.ticker === ticker)
                    .map(h => ({ acct:p, h, valCAD: toCAD(h.current, ticker, h.currencyOverride) }))
                ).filter(x => x.valCAD > 0 || x.h.current > 0);
              };

              return (
                <div className="card" style={{ marginBottom:16, padding:"18px 20px",
                  background:"rgba(167,139,250,0.03)", borderColor:"rgba(167,139,250,0.16)",
                  borderLeft:"3px solid #a78bfa" }}>

                  {/* Header */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                    marginBottom:12, flexWrap:"wrap", gap:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:16 }}>🎯</span>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:"#a78bfa", margin:0 }}>Action Center</p>
                        <p style={{ fontSize:10, color:"rgba(167,139,250,0.5)", margin:0, marginTop:1 }}>
                          {mp.period} · click Buy / Reduce on any card to log a trade
                        </p>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {["High","Medium","Low"].map(p => {
                        const cnt = mp.portfolioImplication.actions.filter(a => a.priority===p).length;
                        if (!cnt) return null;
                        const c = pBorder(p);
                        return <span key={p} style={{ fontSize:10, padding:"3px 9px", borderRadius:12,
                          background:`${c}15`, color:c, border:`1px solid ${c}35`, fontWeight:600 }}>{cnt} {p}</span>;
                      })}
                    </div>
                  </div>

                  {/* Global trade flash */}
                  {pulseTradeFlash && (
                    <div style={{ padding:"8px 12px", borderRadius:6, marginBottom:12, fontSize:11,
                      background: pulseTradeFlash.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      border:`1px solid ${pulseTradeFlash.ok?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`,
                      color: pulseTradeFlash.ok ? "#22c55e" : "#ef4444" }}>
                      {pulseTradeFlash.msg}
                    </div>
                  )}

                  {/* Summary */}
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", lineHeight:1.6,
                    marginBottom:14, paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    {mp.portfolioImplication.summary}
                  </p>

                  {/* Action cards */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:10 }}>
                    {mp.portfolioImplication.actions.map((a, i) => {
                      const ts      = typeStyles[a.type] || typeStyles.Watch;
                      const pc      = pBorder(a.priority);
                      const ticker  = a.ticker && a.ticker !== "null" ? a.ticker : null;
                      const held    = holdingInfo(ticker);
                      const isOpen  = pulseTradeOpen === i;
                      const canBuy  = a.type === "Buy" || a.type === "Rebalance";
                      const canSell = a.type === "Reduce";
                      const showBtn = ticker && (canBuy || canSell);

                      // For reduce: pick first account that holds the ticker; prefer the noted account
                      const reduceAcct = held[0]?.acct || "TFSA";
                      const reduceHolding = held.find(x => x.acct === reduceAcct) || held[0];
                      const reducedNewVal = reduceHolding
                        ? Math.max(0, reduceHolding.h.current * (1 - pulseReducePct / 100))
                        : 0;

                      return (
                        <div key={i} style={{ border:`1px solid ${ts.border}`, borderLeft:`3px solid ${pc}`,
                          background:ts.bg, borderRadius:8, padding:"12px 14px",
                          display:"flex", flexDirection:"column", gap:6 }}>

                          {/* Card header */}
                          <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4,
                              background:`${pc}18`, color:pc, border:`1px solid ${pc}30`, whiteSpace:"nowrap" }}>
                              {a.priority}
                            </span>
                            <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:4,
                              color:ts.color, border:`1px solid ${ts.border}`, background:ts.bg, whiteSpace:"nowrap" }}>
                              {ts.icon}
                            </span>
                            {ticker && (
                              <span style={{ fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                                padding:"2px 8px", borderRadius:4,
                                background: held.length ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.04)",
                                color: held.length ? "#22d3ee" : "rgba(255,255,255,0.4)",
                                border: held.length ? "1px solid rgba(34,211,238,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
                                {ticker}
                              </span>
                            )}
                            {/* Current value chips */}
                            {held.map(x => (
                              <span key={x.acct} style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                                color:"rgba(255,255,255,0.45)", fontFamily:"'JetBrains Mono',monospace" }}>
                                {x.acct} C${Math.round(x.h.current).toLocaleString()}
                              </span>
                            ))}
                          </div>

                          {/* BNN Bloomberg signal badge (if available for this ticker) */}
                          {ticker && (bnnCalls?.days?.length > 0 || bnnCalls?.experts?.length > 0) && (() => {
                            const bnnSrc = bnnCalls?.days?.length ? bnnCalls.days : [bnnCalls];
                            const allPicks = bnnSrc.flatMap(day =>
                              (day.experts || []).flatMap(exp =>
                                (exp.picks || [])
                                  .filter(p => p.ticker === ticker)
                                  .map(p => ({ guest: exp.guest, firm: exp.firm, action: p.action, rawAction: p.rawAction, rationale: p.rationale, date: day.date }))
                              )
                            );
                            if (!allPicks.length) return null;
                            const isBuy = allPicks.some(p => p.action === "buy");
                            const isSell = allPicks.some(p => p.action === "sell");
                            const badgeColor = isBuy ? "#22c55e" : isSell ? "#ef4444" : "#fbbf24";
                            const badgeBg   = isBuy ? "rgba(34,197,94,0.12)" : isSell ? "rgba(239,68,68,0.12)" : "rgba(251,191,36,0.10)";
                            const actionLabel = isBuy ? "BUY" : isSell ? "SELL" : "HOLD";
                            return (
                              <div style={{ display:"flex", flexDirection:"column", gap:3, padding:"6px 8px",
                                borderRadius:5, background:"rgba(0,0,0,0.25)",
                                border:`1px solid ${badgeColor}30`, marginTop:2 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                                  <span style={{ fontSize:8, fontWeight:800, padding:"1px 6px", borderRadius:3,
                                    background:badgeBg, color:badgeColor, border:`1px solid ${badgeColor}50`,
                                    letterSpacing:"0.06em" }}>
                                    📺 BNN · {actionLabel}
                                  </span>
                                  {allPicks.slice(0, 2).map((p, pi) => (
                                    <span key={pi} style={{ fontSize:8, color:"rgba(255,255,255,0.35)" }}>
                                      {p.rawAction || p.action.toUpperCase()} — {p.guest}{p.firm ? `, ${p.firm}` : ""}
                                    </span>
                                  ))}
                                </div>
                                <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", margin:0, lineHeight:1.4, fontStyle:"italic" }}>
                                  "{allPicks[0].rationale}"
                                </p>
                              </div>
                            );
                          })()}

                          {/* Rationale */}
                          <p style={{ fontSize:11, color:"rgba(255,255,255,0.68)", lineHeight:1.55, margin:0 }}>
                            {a.action}
                          </p>

                          {/* Action button row */}
                          {showBtn && !isOpen && (
                            <div style={{ display:"flex", gap:6, marginTop:2 }}>
                              {canBuy && (
                                <button onClick={() => { setPulseTradeOpen(i); setPulseTradeAmt("");
                                  const def = held[0]?.acct || (ticker && RECOMMENDATIONS.find(r=>r.ticker===ticker)?.bestFor) || "TFSA";
                                  setPulseTradeAcct(def); }}
                                  style={{ fontSize:10, fontWeight:700, padding:"5px 14px", borderRadius:5,
                                    cursor:"pointer", background:"rgba(34,197,94,0.18)",
                                    border:"1px solid rgba(34,197,94,0.4)", color:"#22c55e" }}>
                                  ↑ Buy / Add
                                </button>
                              )}
                              {canSell && held.length > 0 && (
                                <button onClick={() => { setPulseTradeOpen(i); setPulseReducePct(25); }}
                                  style={{ fontSize:10, fontWeight:700, padding:"5px 14px", borderRadius:5,
                                    cursor:"pointer", background:"rgba(239,68,68,0.15)",
                                    border:"1px solid rgba(239,68,68,0.35)", color:"#ef4444" }}>
                                  ↓ Reduce
                                </button>
                              )}
                              {canSell && held.length === 0 && (
                                <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:3 }}>
                                  Not currently held
                                </span>
                              )}
                            </div>
                          )}

                          {/* ── Inline BUY panel ── */}
                          {isOpen && canBuy && (
                            <div style={{ marginTop:6, padding:"12px 14px", borderRadius:6,
                              background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.2)" }}>
                              <p style={{ fontSize:10, fontWeight:600, color:"#22c55e", marginBottom:10 }}>
                                ↑ Buy / Add to position
                              </p>
                              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:8 }}>
                                <div style={{ display:"flex", gap:4 }}>
                                  {portfolios.map(p => (
                                    <button key={p} onClick={() => setPulseTradeAcct(p)}
                                      style={{ fontSize:10, fontWeight:600, padding:"4px 10px", borderRadius:4,
                                        cursor:"pointer",
                                        background: pulseTradeAcct===p ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.04)",
                                        border: pulseTradeAcct===p ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(255,255,255,0.08)",
                                        color: pulseTradeAcct===p ? "#22c55e" : "rgba(255,255,255,0.4)" }}>
                                      {p}
                                    </button>
                                  ))}
                                </div>
                                <div style={{ display:"flex", alignItems:"center", gap:4, flex:"1 1 120px", minWidth:0 }}>
                                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", whiteSpace:"nowrap" }}>C$</span>
                                  <input type="number" min="0" placeholder="Amount"
                                    value={pulseTradeAmt}
                                    onChange={e => setPulseTradeAmt(e.target.value)}
                                    onKeyDown={e => e.key==="Enter" && executePulseBuy(ticker, a.action.split(" ")[0], pulseTradeAcct, pulseTradeAmt)}
                                    style={{ flex:1, minWidth:0, fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                                      background:"rgba(255,255,255,0.05)", border:"1px solid rgba(34,197,94,0.3)",
                                      borderRadius:4, padding:"5px 8px", color:"rgba(255,255,255,0.8)" }} />
                                </div>
                              </div>
                              {held.find(x=>x.acct===pulseTradeAcct) && (
                                <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:8 }}>
                                  Currently C${Math.round(held.find(x=>x.acct===pulseTradeAcct).h.current).toLocaleString()} in {pulseTradeAcct}
                                  {pulseTradeAmt && !isNaN(pulseTradeAmt) && ` → C${Math.round(held.find(x=>x.acct===pulseTradeAcct).h.current + Number(pulseTradeAmt)).toLocaleString()} after`}
                                </p>
                              )}
                              <div style={{ display:"flex", gap:7 }}>
                                <button onClick={() => executePulseBuy(ticker, ticker, pulseTradeAcct, pulseTradeAmt)}
                                  style={{ fontSize:11, fontWeight:700, padding:"6px 18px", borderRadius:5,
                                    cursor:"pointer", background:"rgba(34,197,94,0.22)",
                                    border:"1px solid rgba(34,197,94,0.5)", color:"#22c55e" }}>
                                  Confirm Buy
                                </button>
                                <button onClick={() => setPulseTradeOpen(null)}
                                  style={{ fontSize:10, padding:"6px 12px", borderRadius:5, cursor:"pointer",
                                    background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                                    color:"rgba(255,255,255,0.35)" }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* ── Inline REDUCE panel ── */}
                          {isOpen && canSell && (
                            <div style={{ marginTop:6, padding:"12px 14px", borderRadius:6,
                              background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)" }}>
                              <p style={{ fontSize:10, fontWeight:600, color:"#ef4444", marginBottom:10 }}>
                                ↓ Reduce position
                              </p>
                              {held.map(x => (
                                <div key={x.acct} style={{ marginBottom:12 }}>
                                  <div style={{ display:"flex", justifyContent:"space-between",
                                    alignItems:"center", marginBottom:6 }}>
                                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>
                                      {x.acct} — C${Math.round(x.h.current).toLocaleString()} held
                                    </span>
                                    <span style={{ fontSize:11, fontWeight:700,
                                      fontFamily:"'JetBrains Mono',monospace", color:"#ef4444" }}>
                                      −{pulseReducePct}%
                                      <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400, marginLeft:6, fontSize:10 }}>
                                        → C${Math.round(Math.max(0, x.h.current*(1-pulseReducePct/100))).toLocaleString()} remaining
                                      </span>
                                    </span>
                                  </div>
                                  <input type="range" min="5" max="100" step="5"
                                    value={pulseReducePct}
                                    onChange={e => setPulseReducePct(Number(e.target.value))}
                                    style={{ width:"100%", accentColor:"#ef4444", marginBottom:8 }} />
                                  <div style={{ display:"flex", justifyContent:"space-between",
                                    fontSize:9, color:"rgba(255,255,255,0.25)", marginBottom:10 }}>
                                    <span>5%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                                  </div>
                                  <div style={{ display:"flex", gap:7 }}>
                                    <button onClick={() => executePulseReduce(ticker, x.acct, pulseReducePct)}
                                      style={{ fontSize:11, fontWeight:700, padding:"6px 18px", borderRadius:5,
                                        cursor:"pointer", background:"rgba(239,68,68,0.2)",
                                        border:"1px solid rgba(239,68,68,0.45)", color:"#ef4444" }}>
                                      Confirm Reduce
                                    </button>
                                    <button onClick={() => setPulseTradeOpen(null)}
                                      style={{ fontSize:10, padding:"6px 12px", borderRadius:5, cursor:"pointer",
                                        background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                                        color:"rgba(255,255,255,0.35)" }}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Header + regime */}
            <div className="card" style={{ marginBottom:16, padding:"16px 20px",
              background:"rgba(34,211,238,0.03)", borderColor:"rgba(34,211,238,0.12)" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                    <p className="sec" style={{ margin:0, color:"#22d3ee88" }}>Market Pulse — {mp.period}</p>
                    {pulseRefreshedAt
                      ? <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, fontFamily:"'JetBrains Mono',monospace",
                          background:"rgba(167,139,250,0.1)", color:"rgba(167,139,250,0.6)",
                          border:"1px solid rgba(167,139,250,0.2)" }}>✨ AI-refreshed {mp.lastUpdated}</span>
                      : <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"'JetBrains Mono',monospace" }}>
                          updated {mp.lastUpdated}
                        </span>
                    }
                  </div>
                  <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.85)", marginBottom:4 }}>
                    <span style={{ color: regime.color }}>{regime.label}</span>
                    <span style={{ color:"rgba(255,255,255,0.3)", marginLeft:8, fontWeight:400, fontSize:11 }}>{regime.sublabel}</span>
                  </p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.6, maxWidth:680 }}>
                    {regime.description}
                  </p>
                </div>

                {/* Risk-On / Risk-Off gauge */}
                <div style={{ minWidth:220, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
                  borderRadius:10, padding:"14px 16px" }}>

                  {/* Title + numeric score */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.06em",
                      textTransform:"uppercase", margin:0 }}>Risk Meter</p>
                    <span style={{ fontSize:12, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                      color: risk.color }}>{risk.score}/100</span>
                  </div>

                  {/* Zone labels */}
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:8, color:"rgba(239,68,68,0.6)", textTransform:"uppercase", letterSpacing:"0.04em" }}>Risk-Off</span>
                    <span style={{ fontSize:8, color:"rgba(251,191,36,0.6)", textTransform:"uppercase", letterSpacing:"0.04em" }}>Neutral</span>
                    <span style={{ fontSize:8, color:"rgba(34,197,94,0.6)", textTransform:"uppercase", letterSpacing:"0.04em" }}>Risk-On</span>
                  </div>

                  {/* Track + thumb — wrapper tall enough for thumb to render without clipping */}
                  <div style={{ position:"relative", height:22, marginBottom:10 }}>
                    {/* Track: dark background, fill clips at score% so unvisited zones stay dark */}
                    <div style={{ position:"absolute", top:"50%", transform:"translateY(-50%)",
                      left:0, right:0, height:8, borderRadius:4,
                      background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
                      <div style={{
                        position:"absolute", left:0, top:0, bottom:0,
                        width:`${risk.score}%`,
                        background:"linear-gradient(90deg, #ef4444 0%, #f97316 25%, #eab308 50%, #84cc16 75%, #22c55e 100%)"
                      }} />
                    </div>
                    {/* Tick marks at zone boundaries */}
                    {[20,40,60,80].map(p => (
                      <div key={p} style={{ position:"absolute", top:"50%", left:`${p}%`,
                        transform:"translate(-50%,-50%)",
                        width:1.5, height:14, background:"rgba(0,0,0,0.5)", zIndex:2 }} />
                    ))}
                    {/* Thumb — sibling of the track, NOT inside overflow:hidden */}
                    <div style={{
                      position:"absolute", top:"50%",
                      left:`${Math.min(Math.max(risk.score,1),99)}%`,
                      transform:"translate(-50%,-50%)",
                      width:18, height:18, borderRadius:"50%", zIndex:3,
                      background: risk.color,
                      border:"2.5px solid rgba(255,255,255,0.95)",
                      boxShadow:`0 0 10px ${risk.color}90, 0 0 4px rgba(0,0,0,0.7)`
                    }} />
                  </div>

                  <p style={{ fontSize:13, fontWeight:700, color: risk.color,
                    textAlign:"center", marginBottom:3 }}>{risk.label}</p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)",
                    textAlign:"center", lineHeight:1.4 }}>{risk.sublabel}</p>
                </div>
              </div>
            </div>

            {/* ── Buffett Indicator card ── */}
            {mp.buffettIndicator && (() => {
              const bi = mp.buffettIndicator;
              const pct = parseFloat(bi.value) || 0;
              const zones = [
                { label:"Undervalued",           max:75,  color:"#22c55e" },
                { label:"Fair Value",             max:100, color:"#84cc16" },
                { label:"Modestly Overvalued",    max:130, color:"#fbbf24" },
                { label:"Significantly OV",       max:165, color:"#f97316" },
                { label:"Extremely Overvalued",   max:300, color:"#ef4444" },
              ];
              const maxScale = 250;
              const needlePct = Math.min(pct / maxScale * 100, 100);
              const trendIcon2 = bi.trend === "up" ? "↑" : bi.trend === "down" ? "↓" : "→";
              return (
                <div className="card" style={{ marginBottom:16, padding:"16px 20px",
                  background:"rgba(239,68,68,0.03)", borderColor: bi.color + "44" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
                    {/* Left: label + description */}
                    <div style={{ flex:"1 1 280px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", letterSpacing:"0.08em",
                          textTransform:"uppercase", margin:0 }}>Buffett Indicator</p>
                        <span style={{ fontSize:9, padding:"1px 7px", borderRadius:4,
                          background: bi.color + "20", color: bi.color,
                          border:`1px solid ${bi.color}44` }}>
                          {trendIcon2} {bi.valueLabel}
                        </span>
                      </div>
                      <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:28, fontWeight:800, fontFamily:"'JetBrains Mono',monospace",
                          color: bi.color }}>{bi.value}</span>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>
                          of GDP &nbsp;·&nbsp; fair value {bi.fairValueZone} &nbsp;·&nbsp; avg {bi.historicalAvg}
                        </span>
                      </div>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.55, marginBottom:6, maxWidth:560 }}>
                        {bi.description}
                      </p>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontStyle:"italic", lineHeight:1.4 }}>
                        💡 {bi.implication}
                      </p>
                    </div>
                    {/* Right: gauge bar */}
                    <div style={{ flex:"0 0 240px", minWidth:200 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:8, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em" }}>0%</span>
                        <span style={{ fontSize:8, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em" }}>250%</span>
                      </div>
                      {/* Segmented gauge */}
                      <div style={{ position:"relative", height:14, borderRadius:7, overflow:"hidden",
                        display:"flex", gap:1 }}>
                        {zones.map((z, i) => {
                          const prev = i === 0 ? 0 : zones[i-1].max;
                          const width = ((z.max - prev) / maxScale) * 100;
                          return (
                            <div key={z.label} style={{
                              width:`${width}%`, height:"100%",
                              background: z.color + (pct <= z.max && (i === 0 || pct > zones[i-1].max) ? "cc" : "33"),
                              borderRadius: i === 0 ? "7px 0 0 7px" : i === zones.length-1 ? "0 7px 7px 0" : 0,
                            }} />
                          );
                        })}
                        {/* Needle */}
                        <div style={{
                          position:"absolute", top:0, bottom:0,
                          left:`${Math.min(needlePct, 98)}%`,
                          width:2, background:"#fff", borderRadius:1,
                          boxShadow:"0 0 6px rgba(255,255,255,0.8)",
                        }} />
                      </div>
                      {/* Zone labels */}
                      <div style={{ display:"flex", marginTop:4, gap:1 }}>
                        {zones.map((z, i) => {
                          const prev = i === 0 ? 0 : zones[i-1].max;
                          const width = ((z.max - prev) / maxScale) * 100;
                          const active = pct <= z.max && (i === 0 || pct > zones[i-1].max);
                          return (
                            <div key={z.label} style={{ width:`${width}%`, fontSize:6,
                              color: active ? z.color : "rgba(255,255,255,0.2)",
                              fontWeight: active ? 700 : 400, textAlign:"center",
                              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                              {active ? z.label : (i === 0 ? "UV" : i === 1 ? "FV" : "OV")}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Macro signals grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:12, marginBottom:16 }}>
              {mp.macroSignals.map(cat => (
                <div key={cat.category} className="card" style={{ padding:"14px 16px" }}>
                  <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.55)", marginBottom:10,
                    display:"flex", alignItems:"center", gap:6 }}>
                    <span>{cat.icon}</span>{cat.category}
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {cat.signals.map(sig => (
                      <div key={sig.label} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{sig.label}</p>
                          <p style={{ fontSize:12, fontWeight:600, fontFamily:"'JetBrains Mono',monospace",
                            color: trendColor(sig.trend, sig.status), marginTop:1 }}>
                            {trendIcon(sig.trend)} {sig.value}
                          </p>
                        </div>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)", lineHeight:1.4,
                          maxWidth:130, textAlign:"right", marginTop:2 }}>{sig.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── News Flash Panel ── */}
            {mp.newsSignals?.length > 0 && (
              <div className="card" style={{ marginBottom:16, padding:"16px 20px",
                background:"rgba(34,211,238,0.02)", borderColor:"rgba(34,211,238,0.1)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:14 }}>📰</span>
                  <p style={{ fontSize:11, fontWeight:700, color:"#22d3ee", margin:0 }}>News Flash</p>
                  <span style={{ fontSize:9, color:"rgba(34,211,238,0.4)", marginLeft:4 }}>
                    Bloomberg · CNBC · Reuters · FT · WSJ — portfolio impact analysis
                  </span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {mp.newsSignals.map((n, i) => {
                    const impactColor = n.impact === "bullish" ? "#22c55e"
                      : n.impact === "bearish" ? "#ef4444" : "#fbbf24";
                    const impactIcon = n.impact === "bullish" ? "▲" : n.impact === "bearish" ? "▼" : "→";
                    return (
                      <div key={i} style={{
                        display:"flex", gap:12, alignItems:"flex-start",
                        padding:"10px 14px", borderRadius:8,
                        background:`${impactColor}08`,
                        border:`1px solid ${impactColor}20`,
                        borderLeft:`3px solid ${impactColor}`
                      }}>
                        <div style={{ flexShrink:0, paddingTop:1 }}>
                          <span style={{ fontSize:11, fontWeight:700, color: impactColor }}>
                            {impactIcon}
                          </span>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                            <span style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:3,
                              background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.5)",
                              border:"1px solid rgba(255,255,255,0.1)", textTransform:"uppercase",
                              letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
                              {n.source}
                            </span>
                            <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)",
                              fontFamily:"'JetBrains Mono',monospace" }}>{n.date}</span>
                          </div>
                          <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.8)",
                            lineHeight:1.45, marginBottom:5 }}>{n.headline}</p>
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.5, margin:0 }}>
                            <span style={{ color: impactColor, fontWeight:600 }}>Portfolio impact: </span>
                            {n.portfolioImpact}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Yield Curve Panel ── */}
            {mp.yieldCurve && (() => {
              const yc = mp.yieldCurve;

              // SVG chart helpers
              const maturityX = { "3M": 18, "2Y": 68, "5Y": 130, "10Y": 210, "30Y": 290 };
              const yields = (yc.currentYields || []).filter(y => maturityX[y.maturity] !== undefined);
              const yVals  = yields.map(y => y.yield);
              const yMin   = Math.max(0, Math.min(...yVals) - 0.3);
              const yMax   = Math.max(...yVals) + 0.3;
              const yRange = yMax - yMin || 1;
              const toSvgY = v => 8 + (1 - (v - yMin) / yRange) * 74; // maps yield → SVG y (8–82)

              const spreadStatusColor = s =>
                s === "inverted" ? "#ef4444" : s === "warning" ? "#fbbf24" : "#22c55e";

              const points = yields.map(y => `${maturityX[y.maturity]},${toSvgY(y.yield).toFixed(1)}`).join(" ");

              return (
                <div className="card" style={{ marginBottom:16, padding:"16px 20px",
                  background:"rgba(34,211,238,0.02)", borderColor:"rgba(34,211,238,0.1)" }}>

                  {/* Header row */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
                    <p className="sec" style={{ margin:0, color:"#22d3ee88" }}>Yield Curve</p>
                    <span style={{ fontSize:11, fontWeight:600, padding:"2px 9px", borderRadius:4,
                      background: `${yc.shapeColor || "#fbbf24"}18`,
                      color: yc.shapeColor || "#fbbf24",
                      border: `1px solid ${yc.shapeColor || "#fbbf24"}35` }}>
                      {yc.shapeLabel}
                    </span>
                    {yc.inversionStatus && (
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)",
                        fontFamily:"'JetBrains Mono',monospace" }}>
                        {yc.inversionStatus}
                      </span>
                    )}
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:20, alignItems:"start" }}>

                    {/* Left: SVG curve chart */}
                    <div style={{ minWidth:200 }}>
                      <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginBottom:4,
                        textTransform:"uppercase", letterSpacing:"0.05em" }}>
                        US Treasury Yield Curve
                      </p>
                      <svg viewBox="0 0 310 100" style={{ width:"100%", maxWidth:310, display:"block",
                        background:"rgba(255,255,255,0.02)", borderRadius:6, border:"1px solid rgba(255,255,255,0.06)" }}>
                        {/* Horizontal grid lines */}
                        {[0.25, 0.5, 0.75].map(f => (
                          <line key={f} x1="12" x2="298" y1={8 + f * 74} y2={8 + f * 74}
                            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        ))}
                        {/* Zero-spread reference (horizontal at mid) */}
                        {yields.length >= 2 && (
                          <line x1="12" x2="298"
                            y1={toSvgY((yMax + yMin) / 2).toFixed(1)}
                            y2={toSvgY((yMax + yMin) / 2).toFixed(1)}
                            stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="3,3" />
                        )}
                        {/* Yield curve path */}
                        {yields.length >= 2 && (
                          <polyline points={points} fill="none"
                            stroke={yc.shapeColor || "#22d3ee"} strokeWidth="2"
                            strokeLinejoin="round" strokeLinecap="round" />
                        )}
                        {/* Dots + labels */}
                        {yields.map(y => {
                          const cx = maturityX[y.maturity];
                          const cy = toSvgY(y.yield);
                          return (
                            <g key={y.maturity}>
                              <circle cx={cx} cy={cy} r="3.5"
                                fill={yc.shapeColor || "#22d3ee"}
                                stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
                              <text x={cx} y={cy - 7} textAnchor="middle"
                                style={{ fontSize:"6.5px", fill:"rgba(255,255,255,0.55)",
                                  fontFamily:"'JetBrains Mono',monospace" }}>
                                {y.yield.toFixed(2)}%
                              </text>
                              <text x={cx} y={94} textAnchor="middle"
                                style={{ fontSize:"6px", fill:"rgba(255,255,255,0.3)",
                                  fontFamily:"'JetBrains Mono',monospace" }}>
                                {y.maturity}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Right: spreads + recession probability + context */}
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

                      {/* Recession probability bar */}
                      {yc.recessionProbability && (
                        <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:8,
                          border:"1px solid rgba(255,255,255,0.07)", padding:"10px 12px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                            <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)",
                              textTransform:"uppercase", letterSpacing:"0.05em" }}>
                              12-Month Recession Probability
                            </p>
                            <span style={{ fontSize:13, fontWeight:700,
                              fontFamily:"'JetBrains Mono',monospace",
                              color: (yc.recessionProbabilityScore || 0) >= 50 ? "#ef4444"
                                   : (yc.recessionProbabilityScore || 0) >= 25 ? "#fbbf24" : "#22c55e" }}>
                              {yc.recessionProbability}
                            </span>
                          </div>
                          {yc.recessionProbabilityScore != null && (
                            <div style={{ position:"relative", height:5, background:"rgba(255,255,255,0.06)",
                              borderRadius:3, overflow:"hidden" }}>
                              <div style={{ position:"absolute", left:0, top:0, bottom:0,
                                width:`${Math.min(yc.recessionProbabilityScore, 100)}%`,
                                background: yc.recessionProbabilityScore >= 50 ? "#ef4444"
                                          : yc.recessionProbabilityScore >= 25 ? "#fbbf24" : "#22c55e",
                                borderRadius:3, transition:"width 0.5s" }} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Spreads */}
                      {(yc.spreads || []).map(sp => (
                        <div key={sp.label} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                          <div style={{ flex:1 }}>
                            <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>
                              {sp.label}
                              <span style={{ color:"rgba(255,255,255,0.2)", marginLeft:5, fontWeight:400 }}>
                                {sp.description}
                              </span>
                            </p>
                            <p style={{ fontSize:12, fontWeight:700, marginTop:1,
                              fontFamily:"'JetBrains Mono',monospace",
                              color: spreadStatusColor(sp.status) }}>
                              {sp.bps >= 0 ? "+" : ""}{sp.bps} bps
                            </p>
                          </div>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)", lineHeight:1.4,
                            maxWidth:160, textAlign:"right", marginTop:2 }}>{sp.note}</p>
                        </div>
                      ))}

                      {/* Trajectory + Canadian curve */}
                      {yc.trajectory && (
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", lineHeight:1.5,
                          borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:8 }}>
                          <span style={{ color:"rgba(255,255,255,0.2)", fontSize:9,
                            textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:2 }}>
                            Trajectory
                          </span>
                          {yc.trajectory}
                        </p>
                      )}
                      {yc.canadianCurve && (
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", lineHeight:1.5,
                          borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:8 }}>
                          <span style={{ color:"rgba(255,255,255,0.2)", fontSize:9,
                            textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:2 }}>
                            CAD curve
                          </span>
                          {yc.canadianCurve}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Scenario cards now also show Sector Rotation */}
            {/* 3-month and 6-month outlooks */}
            {mp.outlooks.map(outlook => (
              <div key={outlook.horizon} className="card" style={{ marginBottom:16, padding:"16px 20px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
                  <p className="sec" style={{ margin:0 }}>
                    {outlook.horizon} outlook
                  </p>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontFamily:"'JetBrains Mono',monospace" }}>
                    target: {outlook.period}
                  </span>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:10, marginBottom:14 }}>
                  {outlook.scenarios.map(sc => (
                    <div key={sc.label} style={{ border:`1px solid ${sc.color}25`,
                      borderLeft:`3px solid ${sc.color}`,
                      background:`${sc.color}08`,
                      borderRadius:8, padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                        <p style={{ fontSize:12, fontWeight:600, color: sc.color }}>
                          {sc.icon} {sc.label}
                        </p>
                        <span style={{ fontSize:13, fontWeight:700, color: sc.color,
                          fontFamily:"'JetBrains Mono',monospace" }}>
                          {sc.probability}%
                        </span>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        <div>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>Trigger</p>
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.55)", lineHeight:1.4 }}>{sc.trigger}</p>
                        </div>
                        <div>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>Market target</p>
                          <p style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color: sc.color, fontWeight:600 }}>{sc.marketTarget}</p>
                        </div>
                        <div>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>CAD angle</p>
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.4 }}>{sc.canadianAngle}</p>
                        </div>
                        <div>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>Positioning</p>
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.6)", lineHeight:1.4 }}>{sc.positioning}</p>
                        </div>
                        {sc.sectorRotation && (
                          <div style={{ borderTop:`1px solid ${sc.color}20`, paddingTop:5 }}>
                            <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>Sector rotation</p>
                            <p style={{ fontSize:10, color:`${sc.color}cc`, lineHeight:1.4 }}>{sc.sectorRotation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key events */}
                <div>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                    Key events to watch
                  </p>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {outlook.keyEvents.map(ev => (
                      <div key={ev.date} style={{ display:"flex", gap:6, alignItems:"center",
                        background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
                        borderRadius:6, padding:"5px 10px" }}>
                        <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace",
                          color:"#22d3ee", fontWeight:600, whiteSpace:"nowrap" }}>{ev.date}</span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>{ev.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Catalysts: bull vs bear */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div className="card" style={{ padding:"14px 16px",
                background:"rgba(34,197,94,0.03)", borderColor:"rgba(34,197,94,0.1)" }}>
                <p style={{ fontSize:11, fontWeight:600, color:"#22c55e", marginBottom:10 }}>
                  🟢 Bull catalysts
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {mp.catalysts.bullish.map(c => (
                    <div key={c.label} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ fontSize:13, flexShrink:0 }}>{c.icon}</span>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.5)", lineHeight:1.5 }}>{c.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ padding:"14px 16px",
                background:"rgba(239,68,68,0.03)", borderColor:"rgba(239,68,68,0.1)" }}>
                <p style={{ fontSize:11, fontWeight:600, color:"#ef4444", marginBottom:10 }}>
                  🔴 Bear risks
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {mp.catalysts.bearish.map(c => (
                    <div key={c.label} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ fontSize:13, flexShrink:0 }}>{c.icon}</span>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.5)", lineHeight:1.5 }}>{c.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Trade Log ── */}
            {pulseTradeLog.length > 0 && (
              <div className="card" style={{ marginBottom:16, padding:"14px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.5)", margin:0 }}>
                    📋 Trade log <span style={{ fontSize:9, fontWeight:400, color:"rgba(255,255,255,0.25)", marginLeft:4 }}>logged from Action Center</span>
                  </p>
                  <button onClick={() => { setPulseTradeLog([]); localStorage.removeItem("pulse:tradeLog"); }}
                    style={{ fontSize:9, padding:"2px 8px", borderRadius:4, cursor:"pointer",
                      background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                      color:"rgba(255,255,255,0.25)" }}>
                    Clear
                  </button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {pulseTradeLog.slice(0, 20).map((t, i) => {
                    const isBuy = t.type === "Buy";
                    const tc    = isBuy ? "#22c55e" : "#ef4444";
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
                        padding:"6px 10px", borderRadius:6,
                        background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize:10, fontWeight:700, color:tc, minWidth:42 }}>{t.type}</span>
                        <span style={{ fontSize:11, fontWeight:600, fontFamily:"'JetBrains Mono',monospace",
                          color:"rgba(255,255,255,0.7)", minWidth:52 }}>{t.ticker}</span>
                        <span style={{ fontSize:9, padding:"1px 6px", borderRadius:3,
                          background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                          color:"rgba(255,255,255,0.4)" }}>{t.account}</span>
                        <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                          color:tc, fontWeight:600 }}>{t.note}</span>
                        <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", marginLeft:"auto",
                          whiteSpace:"nowrap" }}>
                          {new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)", lineHeight:1.5 }}>
              ⚠ Not financial advice. Market signals and outlooks are curated manually and may not reflect current conditions. Last updated {mp.lastUpdated}. Consult a licensed financial advisor before making investment decisions.
            </p>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: DASHBOARD
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "dashboard" && (() => {
        const tfsaH = holdings["TFSA"] || [];
        const rrspH = holdings["RRSP"] || [];

        // Values in CAD
        const tfsaTotalCAD = tfsaH.reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride), 0);
        const rrspTotalCAD = rrspH.reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride), 0);
        const combTotalCAD = tfsaTotalCAD + rrspTotalCAD;

        // Cash (always CAD)
        const tfsaCash = cashHolding["TFSA"] || 0;
        const rrspCash = cashHolding["RRSP"] || 0;
        const combCashTotal = tfsaCash + rrspCash;
        const tfsaGrandTotal = tfsaTotalCAD + tfsaCash;
        const rrspGrandTotal = rrspTotalCAD + rrspCash;
        const combGrandTotal = tfsaGrandTotal + rrspGrandTotal;

        // True total across ALL portfolios (includes Crypto, RESP, etc.)
        const allPortfoliosTotal = portfolios.reduce((s, p) => {
          const h = holdings[p] || [];
          const mv = h.reduce((a, x) => a + toCAD(x.current, x.ticker, x.currencyOverride), 0);
          return s + mv + (cashHolding[p] || 0);
        }, 0);
        const otherPortfoliosTotal = allPortfoliosTotal - combGrandTotal;

        // USD vs CAD splits per account (values in CAD for comparison, native USD for display)
        const tfsaUSDValCAD = tfsaH.filter(h => getTickerCurrency(h.ticker, h.currencyOverride) === "USD")
          .reduce((s, h) => s + h.current * usdCadRate, 0);
        const tfsaCADValCAD = tfsaH.filter(h => getTickerCurrency(h.ticker, h.currencyOverride) === "CAD")
          .reduce((s, h) => s + h.current, 0);
        const tfsaUSDNative = usdCadRate > 0 ? tfsaUSDValCAD / usdCadRate : 0;

        const rrspUSDValCAD = rrspH.filter(h => getTickerCurrency(h.ticker, h.currencyOverride) === "USD")
          .reduce((s, h) => s + h.current * usdCadRate, 0);
        const rrspCADValCAD = rrspH.filter(h => getTickerCurrency(h.ticker, h.currencyOverride) === "CAD")
          .reduce((s, h) => s + h.current, 0);
        const rrspUSDNative = usdCadRate > 0 ? rrspUSDValCAD / usdCadRate : 0;

        const combUSDNative = tfsaUSDNative + rrspUSDNative;
        const combCADNative = tfsaCADValCAD + rrspCADValCAD;
        const combUSDValCAD = tfsaUSDValCAD + rrspUSDValCAD;

        // P&L
        const tfsaCostCAD = tfsaH.reduce((s, h) => s + toCAD(h.costBasis || 0, h.ticker, h.currencyOverride), 0);
        const rrspCostCAD = rrspH.reduce((s, h) => s + toCAD(h.costBasis || 0, h.ticker, h.currencyOverride), 0);
        const combCostCAD = tfsaCostCAD + rrspCostCAD;
        const tfsaPnL = tfsaCostCAD > 0 ? tfsaTotalCAD - tfsaCostCAD : null;
        const rrspPnL = rrspCostCAD > 0 ? rrspTotalCAD - rrspCostCAD : null;
        const combPnL = combCostCAD > 0 ? combTotalCAD - combCostCAD : null;
        const combPnLPct = combCostCAD > 0 ? (combTotalCAD - combCostCAD) / combCostCAD * 100 : null;

        // Dividends
        const tfsaDivCAD = tfsaH.reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride) * (h.divYield || 0) / 100, 0);
        const rrspDivCAD = rrspH.reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride) * (h.divYield || 0) / 100, 0);
        const combDivCAD = tfsaDivCAD + rrspDivCAD;

        // WHT drag (TFSA — US dividends taxed at 15% by IRS)
        const tfsaWHTCAD = tfsaH.filter(h => !CAD_EXEMPT.has(h.ticker))
          .reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride) * (h.divYield || 0) / 100 * 0.15, 0);

        // Effective yield (after WHT for TFSA)
        const tfsaEffDivCAD = tfsaDivCAD - tfsaWHTCAD;

        // Top holdings per account (sorted by CAD value)
        const tfsaTop = [...tfsaH]
          .map(h => ({ ...h, valueCAD: toCAD(h.current, h.ticker, h.currencyOverride) }))
          .filter(h => h.valueCAD > 0)
          .sort((a, b) => b.valueCAD - a.valueCAD)
          .slice(0, 8);
        const rrspTop = [...rrspH]
          .map(h => ({ ...h, valueCAD: toCAD(h.current, h.ticker, h.currencyOverride) }))
          .filter(h => h.valueCAD > 0)
          .sort((a, b) => b.valueCAD - a.valueCAD)
          .slice(0, 8);

        // Combined sorted across both accounts
        const allTop = [
          ...tfsaH.map(h => ({ ...h, acct:"TFSA", valueCAD: toCAD(h.current, h.ticker, h.currencyOverride) })),
          ...rrspH.map(h => ({ ...h, acct:"RRSP", valueCAD: toCAD(h.current, h.ticker, h.currencyOverride) })),
        ].filter(h => h.valueCAD > 0).sort((a, b) => b.valueCAD - a.valueCAD).slice(0, 12);

        // Target alignment health
        const tfsaTargetSum = tfsaH.reduce((s, h) => s + (h.target || 0), 0);
        const rrspTargetSum = rrspH.reduce((s, h) => s + (h.target || 0), 0);
        const tfsaConc = tfsaTotalCAD > 0
          ? tfsaH.filter(h => (toCAD(h.current, h.ticker, h.currencyOverride) / tfsaTotalCAD) * 100 > 20)
          : [];
        const rrspConc = rrspTotalCAD > 0
          ? rrspH.filter(h => (toCAD(h.current, h.ticker, h.currencyOverride) / rrspTotalCAD) * 100 > 20)
          : [];

        // Account allocation % (includes cash)
        const tfsaAcctPct = combGrandTotal > 0 ? (tfsaGrandTotal / combGrandTotal) * 100 : 0;
        const rrspAcctPct = combGrandTotal > 0 ? (rrspGrandTotal / combGrandTotal) * 100 : 0;

        // Max bar value helpers
        const tfsaMaxVal = tfsaTop[0]?.valueCAD || 1;
        const rrspMaxVal = rrspTop[0]?.valueCAD || 1;
        const allMaxVal  = allTop[0]?.valueCAD || 1;

        // Donut segments
        const acctSegments = [
          { pct: tfsaAcctPct, color:"#fbbf24", label:"TFSA" },
          { pct: rrspAcctPct, color:"#22d3ee", label:"RRSP" },
        ];
        const tfsaCurrSegments = tfsaGrandTotal > 0 ? [
          { pct: (tfsaUSDValCAD / tfsaGrandTotal) * 100, color:"#60a5fa", label:"USD" },
          { pct: ((tfsaCADValCAD + tfsaCash) / tfsaGrandTotal) * 100, color:"#34d399", label:"CAD" },
        ] : [{ pct:100, color:"rgba(255,255,255,0.07)", label:"—" }];
        const rrspCurrSegments = rrspGrandTotal > 0 ? [
          { pct: (rrspUSDValCAD / rrspGrandTotal) * 100, color:"#60a5fa", label:"USD" },
          { pct: ((rrspCADValCAD + rrspCash) / rrspGrandTotal) * 100, color:"#34d399", label:"CAD" },
        ] : [{ pct:100, color:"rgba(255,255,255,0.07)", label:"—" }];
        const combCurrSegments = combGrandTotal > 0 ? [
          { pct: (combUSDValCAD / combGrandTotal) * 100, color:"#60a5fa", label:"USD" },
          { pct: ((combCADNative + combCashTotal) / combGrandTotal) * 100, color:"#34d399", label:"CAD" },
        ] : [{ pct:100, color:"rgba(255,255,255,0.07)", label:"—" }];

        const fmt = (n) => Math.round(n).toLocaleString();
        const pnlColor = (v) => v === null ? "#64748b" : v >= 0 ? "#34d399" : "#ef4444";
        const pnlSign  = (v) => v >= 0 ? "+" : "";

        // ── Morning Radar: drift alerts ───────────────────────────────────
        const driftAlerts = portfolios.flatMap(p => {
          const acctH = holdings[p] || [];
          const total = acctH.reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride), 0);
          if (!total) return [];
          return acctH.flatMap(h => {
            if (!h.target || h.target === 0 || h.current <= 0) return [];
            const actualPct = (toCAD(h.current, h.ticker, h.currencyOverride) / total) * 100;
            const drift = h.target > 0 ? actualPct / h.target : 0;
            if (drift > 1.3)  return [{ ticker: h.ticker, acct: p, actualPct, target: h.target, drift, dir: "over" }];
            if (drift < 0.65) return [{ ticker: h.ticker, acct: p, actualPct, target: h.target, drift, dir: "under" }];
            return [];
          });
        }).sort((a, b) => Math.abs(b.drift - 1) - Math.abs(a.drift - 1)).slice(0, 5);

        // ── Morning Radar: expiring options (within 14 days) ─────────────
        const nowMs = Date.now();
        const in14Ms = nowMs + 14 * 86400000;
        const expiringOptions = optionTrades.filter(t => {
          if (t.status !== "open" || !t.expiry) return false;
          const ms = new Date(t.expiry).getTime();
          return ms >= nowMs && ms <= in14Ms;
        }).sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

        // ── Morning Radar: today's estimated P&L from live prices ─────────
        const hasPrices = Object.keys(liveHoldingPrices).length > 0;
        const allHeldFlat = portfolios.flatMap(p => (holdings[p] || []).map(h => ({ ...h, acct: p })));
        const liveDayPnLCAD = hasPrices ? allHeldFlat.reduce((s, h) => {
          const price = liveHoldingPrices[h.ticker];
          const prev  = livePrevPrices[h.ticker];
          if (!price || !prev || prev === 0) return s;
          const changePct = (price - prev) / prev;
          return s + toCAD(h.current, h.ticker, h.currencyOverride) * changePct;
        }, 0) : null;
        const liveDayPct = liveDayPnLCAD !== null && combTotalCAD > 0
          ? (liveDayPnLCAD / combTotalCAD) * 100 : null;

        // ── Live price age label ──────────────────────────────────────────
        const priceAgeLabel = livePricesFetchedAt
          ? (() => {
              const m = Math.round((Date.now() - new Date(livePricesFetchedAt).getTime()) / 60000);
              if (m < 1)  return "just now";
              if (m < 60) return `${m}m ago`;
              return `${Math.floor(m / 60)}h ago`;
            })()
          : null;

        // ── FX sensitivity ─────────────────────────────────────────────────
        const fxSensitivity5 = combUSDValCAD * 0.05; // 5% CAD appreciation impact in CAD

        // ── Dividend income by month (uniform estimate) ───────────────────
        const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const monthlyDivBase = combDivCAD / 12;
        // Weight months slightly for quarter-end spikes (most dividends quarterly)
        const MONTH_WEIGHTS = [1,0.6,1.4, 1,0.6,1.4, 1,0.6,1.4, 1,0.6,1.4];
        const divByMonth = MONTH_NAMES.map((m, i) => ({
          month: m, amount: (combDivCAD * MONTH_WEIGHTS[i]) / MONTH_WEIGHTS.reduce((a,b) => a+b, 0),
        }));
        const maxMonthlyDiv = Math.max(...divByMonth.map(d => d.amount), 1);
        const curMonth = new Date().getMonth();

        // Account panel renderer (used for both TFSA and RRSP)
        function AccountPanel({ label, color, rgb, holdings: acctH, totalCAD, grandTotal, cash,
                                usdValCAD, cadValCAD, usdNative,
                                topHoldings, maxVal, divCAD, whtCAD, pnL, costCAD, targetSum, currSegments, concWarns }) {
          const usdPct = grandTotal > 0 ? (usdValCAD / grandTotal) * 100 : 0;
          const cadPct = grandTotal > 0 ? ((cadValCAD + cash) / grandTotal) * 100 : 0;
          const effDiv = divCAD - (whtCAD || 0);
          return (
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              {/* Panel header */}
              <div style={{ padding:"14px 18px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)",
                background:`rgba(${rgb},0.04)` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.15em",
                      color, textTransform:"uppercase" }}>{label}</span>
                    <p style={{ fontSize:24, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                      color, marginTop:4 }}>
                      C${fmt(grandTotal)}
                    </p>
                    <div style={{ display:"flex", gap:8, marginTop:2, flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>
                        C${fmt(totalCAD)} invested
                      </span>
                      {cash > 0 && (
                        <>
                          <span style={{ fontSize:10, color:"rgba(255,255,255,0.15)" }}>·</span>
                          <span style={{ fontSize:10, color:"#94a3b8" }}>
                            C${fmt(cash)} cash
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    {pnL !== null ? (
                      <>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:4,
                          letterSpacing:"0.1em", textTransform:"uppercase" }}>Unrealized P&L</p>
                        <p style={{ fontSize:18, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                          color: pnlColor(pnL) }}>
                          {pnlSign(pnL)}C${fmt(pnL)}
                        </p>
                        <p style={{ fontSize:10, color: pnlColor(pnL), opacity:0.8, marginTop:2 }}>
                          {pnlSign(pnL)}{((pnL / costCAD) * 100).toFixed(1)}% return
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>No cost basis set</p>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:14 }}>
                {/* Currency exposure */}
                <div>
                  <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                    color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:10 }}>Currency Exposure</p>
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                    <DonutChart
                      segments={currSegments} size={90} thickness={14}
                      centerLabel={grandTotal > 0 ? `${Math.round(usdPct)}%` : "—"}
                      centerSub="USD"
                    />
                    <div style={{ flex:1 }}>
                      {/* USD row */}
                      <div style={{ marginBottom:8 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:10, color:"#60a5fa", fontWeight:600 }}>USD Holdings</span>
                          <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#60a5fa" }}>
                            US${fmt(usdNative)}
                          </span>
                        </div>
                        <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                          <div style={{ height:4, background:"#60a5fa", borderRadius:2,
                            width:`${usdPct}%`, transition:"width 0.5s" }}/>
                        </div>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", marginTop:3 }}>
                          C${fmt(usdValCAD)} equiv · {usdPct.toFixed(1)}%
                        </p>
                      </div>
                      {/* CAD row */}
                      <div style={{ marginBottom: cash > 0 ? 8 : 0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:10, color:"#34d399", fontWeight:600 }}>CAD Holdings</span>
                          <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#34d399" }}>
                            C${fmt(cadValCAD)}
                          </span>
                        </div>
                        <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                          <div style={{ height:4, background:"#34d399", borderRadius:2,
                            width:`${cadPct}%`, transition:"width 0.5s" }}/>
                        </div>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", marginTop:3 }}>
                          {(grandTotal > 0 ? (cadValCAD / grandTotal * 100) : 0).toFixed(1)}% of {label}
                        </p>
                      </div>
                      {/* Cash row */}
                      {cash > 0 && (() => {
                        const cashPct = grandTotal > 0 ? (cash / grandTotal) * 100 : 0;
                        return (
                          <div>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>Cash</span>
                              <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#94a3b8" }}>
                                C${fmt(cash)}
                              </span>
                            </div>
                            <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                              <div style={{ height:4, background:"#94a3b8", borderRadius:2,
                                width:`${cashPct}%`, transition:"width 0.5s" }}/>
                            </div>
                            <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", marginTop:3 }}>
                              {cashPct.toFixed(1)}% of {label}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Top holdings */}
                {topHoldings.length > 0 && (
                  <div>
                    <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                      color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>
                      Top Holdings
                    </p>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {topHoldings.map((h, i) => {
                        const barPct = (h.valueCAD / maxVal) * 100;
                        const isUSD = getTickerCurrency(h.ticker, h.currencyOverride) === "USD";
                        const dispVal = isUSD
                          ? `US$${fmt(h.current)}`
                          : `C$${fmt(h.current)}`;
                        const acctPct = totalCAD > 0 ? (h.valueCAD / totalCAD) * 100 : 0;
                        return (
                          <div key={h.ticker}>
                            <div style={{ display:"flex", justifyContent:"space-between",
                              alignItems:"baseline", marginBottom:3 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                                  fontWeight:600, color }}>
                                  {i+1}. {h.ticker}
                                </span>
                                <span style={{ fontSize:9, color: isUSD ? "#60a5fa" : "#34d399",
                                  padding:"0px 5px", borderRadius:3,
                                  background: isUSD ? "rgba(96,165,250,0.1)" : "rgba(52,211,153,0.1)",
                                  border: `1px solid ${isUSD ? "rgba(96,165,250,0.2)" : "rgba(52,211,153,0.2)"}` }}>
                                  {isUSD ? "USD" : "CAD"}
                                </span>
                              </div>
                              <div style={{ textAlign:"right" }}>
                                <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                                  color:"rgba(255,255,255,0.75)", fontWeight:500 }}>
                                  {dispVal}
                                </span>
                                <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginLeft:5 }}>
                                  {acctPct.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:2 }}>
                              <div style={{ height:3, borderRadius:2, transition:"width 0.5s",
                                background:`linear-gradient(90deg, ${color}bb, ${color}55)`,
                                width:`${barPct}%` }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Holdings breakdown pie chart */}
                {(() => {
                  const holdingSlices = acctH
                    .map((h, i) => ({
                      label: h.ticker,
                      valueCAD: toCAD(h.current, h.ticker, h.currencyOverride),
                      color: PIE_COLORS[i % PIE_COLORS.length],
                    }))
                    .filter(s => s.valueCAD > 0)
                    .sort((a, b) => b.valueCAD - a.valueCAD);
                  if (cash > 0) {
                    holdingSlices.push({ label: "CASH", valueCAD: cash, color: "#94a3b8" });
                  }
                  const slices = holdingSlices.map(s => ({
                    ...s,
                    pct: grandTotal > 0 ? (s.valueCAD / grandTotal) * 100 : 0,
                  }));
                  if (slices.length === 0) return null;
                  return (
                    <div>
                      <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                        color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:10 }}>
                        Holdings Breakdown
                      </p>
                      <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                        <PieChart slices={slices} size={130} />
                        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5,
                          overflowY:"auto", maxHeight:130 }}>
                          {slices.map(s => (
                            <div key={s.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <div style={{ width:8, height:8, borderRadius:2,
                                background:s.color, flexShrink:0 }}/>
                              <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                                fontWeight:600, color:"rgba(255,255,255,0.75)", flex:1 }}>
                                {s.label}
                              </span>
                              <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                                color:"rgba(255,255,255,0.4)" }}>
                                {s.pct.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Income & alerts row */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div style={{ background:"rgba(167,139,250,0.05)", border:"1px solid rgba(167,139,250,0.15)",
                    borderRadius:8, padding:"10px 12px" }}>
                    <p style={{ fontSize:9, color:"rgba(167,139,250,0.7)", letterSpacing:"0.1em",
                      textTransform:"uppercase", marginBottom:5 }}>Annual Dividends</p>
                    <p style={{ fontSize:16, fontFamily:"'JetBrains Mono',monospace",
                      fontWeight:700, color:"#a78bfa" }}>
                      C${fmt(divCAD)}
                    </p>
                    {whtCAD > 1 && (
                      <p style={{ fontSize:9, color:"#f97316", marginTop:3 }}>
                        −C${fmt(whtCAD)} WHT drag
                      </p>
                    )}
                    {whtCAD > 1 && (
                      <p style={{ fontSize:9, color:"#34d399", marginTop:1 }}>
                        = C${fmt(effDiv)} net
                      </p>
                    )}
                  </div>
                  <div style={{
                    background: Math.abs(targetSum - 100) > 0.5
                      ? "rgba(249,115,22,0.05)" : "rgba(52,211,153,0.05)",
                    border: `1px solid ${Math.abs(targetSum - 100) > 0.5 ? "rgba(249,115,22,0.2)" : "rgba(52,211,153,0.2)"}`,
                    borderRadius:8, padding:"10px 12px"
                  }}>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em",
                      textTransform:"uppercase", marginBottom:5 }}>Target Weights</p>
                    <p style={{ fontSize:16, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                      color: Math.abs(targetSum - 100) > 0.5 ? "#f97316" : "#34d399" }}>
                      {targetSum}%
                    </p>
                    <p style={{ fontSize:9, marginTop:3,
                      color: Math.abs(targetSum - 100) > 0.5 ? "#f97316" : "rgba(52,211,153,0.7)" }}>
                      {Math.abs(targetSum - 100) > 0.5
                        ? `⚠ Off by ${Math.abs(targetSum - 100).toFixed(1)}%`
                        : "✓ Balanced"}
                    </p>
                  </div>
                </div>

                {/* Concentration warnings inside panel */}
                {concWarns.length > 0 && (
                  <div style={{ background:"rgba(249,115,22,0.04)", border:"1px solid rgba(249,115,22,0.18)",
                    borderLeft:"3px solid #f97316", borderRadius:8, padding:"8px 12px" }}>
                    <p style={{ fontSize:9, color:"#f97316", fontWeight:600, marginBottom:4 }}>
                      ⚠ Concentration risk
                    </p>
                    {concWarns.map(h => (
                      <p key={h.ticker} style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>
                        <strong style={{ color:"#f97316" }}>{h.ticker}</strong>{" "}
                        {((toCAD(h.current, h.ticker, h.currencyOverride) / totalCAD) * 100).toFixed(1)}%
                        {" "}— exceeds 20% allocation
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div style={{ padding:"22px 28px" }}>

            {/* ════ MORNING RADAR ══════════════════════════════════════════ */}
            <div style={{ marginBottom:18, padding:"14px 18px", borderRadius:12,
              background:"rgba(167,139,250,0.04)", border:"1px solid rgba(167,139,250,0.18)" }}>
              {/* Radar header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                flexWrap:"wrap", gap:8, marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:15 }}>🌅</span>
                  <p style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.9)", margin:0 }}>
                    Morning Radar
                  </p>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>
                    {new Date().toLocaleDateString("en-CA", { weekday:"long", month:"long", day:"numeric", year:"numeric" })}
                  </span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {priceAgeLabel && (
                    <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>
                      prices: {priceAgeLabel}
                    </span>
                  )}
                  <button onClick={fetchLivePrices} disabled={livePricesFetching}
                    style={{ fontSize:10, fontWeight:600, padding:"5px 14px", borderRadius:7,
                      background: livePricesFetching ? "rgba(167,139,250,0.06)" : "rgba(167,139,250,0.14)",
                      border:"1px solid rgba(167,139,250,0.35)", color:"#a78bfa",
                      cursor: livePricesFetching ? "wait" : "pointer",
                      opacity: livePricesFetching ? 0.6 : 1 }}>
                    {livePricesFetching ? "⏳ Fetching…" : "📡 Refresh Prices"}
                  </button>
                </div>
              </div>

              {/* Radar grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:10 }}>

                {/* Today's P&L */}
                <div style={{ padding:"10px 14px", borderRadius:8,
                  background: liveDayPnLCAD === null ? "rgba(255,255,255,0.02)"
                    : liveDayPnLCAD >= 0 ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
                  border:`1px solid ${liveDayPnLCAD === null ? "rgba(255,255,255,0.08)"
                    : liveDayPnLCAD >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                  <p style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.09em",
                    color:"rgba(255,255,255,0.3)", fontWeight:600, marginBottom:5 }}>Today's Est. P&L</p>
                  {liveDayPnLCAD !== null ? (
                    <>
                      <p style={{ fontSize:20, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                        color: liveDayPnLCAD >= 0 ? "#22c55e" : "#ef4444", margin:0, lineHeight:1 }}>
                        {liveDayPnLCAD >= 0 ? "+" : ""}C${fmt(liveDayPnLCAD)}
                      </p>
                      <p style={{ fontSize:10, color: liveDayPnLCAD >= 0 ? "#22c55e" : "#ef4444",
                        opacity:0.8, marginTop:3 }}>
                        {liveDayPnLCAD >= 0 ? "+" : ""}{liveDayPct?.toFixed(2)}% · {allHeldFlat.filter(h => liveHoldingPrices[h.ticker]).length} positions priced
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.22)", fontFamily:"'JetBrains Mono',monospace" }}>
                      — click Refresh Prices
                    </p>
                  )}
                </div>

                {/* Drift alerts */}
                <div style={{ padding:"10px 14px", borderRadius:8,
                  background: driftAlerts.length > 0 ? "rgba(249,115,22,0.06)" : "rgba(34,197,94,0.05)",
                  border:`1px solid ${driftAlerts.length > 0 ? "rgba(249,115,22,0.22)" : "rgba(34,197,94,0.18)"}` }}>
                  <p style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.09em",
                    color:"rgba(255,255,255,0.3)", fontWeight:600, marginBottom:5 }}>Allocation Drift</p>
                  {driftAlerts.length === 0 ? (
                    <p style={{ fontSize:12, color:"#22c55e" }}>✓ All positions on target</p>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                      {driftAlerts.slice(0, 4).map(a => (
                        <div key={`${a.acct}-${a.ticker}`} style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:10, fontWeight:700,
                            fontFamily:"'JetBrains Mono',monospace",
                            color: a.dir === "over" ? "#f97316" : "#60a5fa" }}>
                            {a.ticker}
                          </span>
                          <span style={{ fontSize:9, color:"rgba(255,255,255,0.35)" }}>
                            {a.actualPct.toFixed(1)}% vs {a.target}% target
                          </span>
                          <span style={{ fontSize:9,
                            color: a.dir === "over" ? "#f97316" : "#60a5fa" }}>
                            {a.dir === "over" ? "▲ over" : "▼ under"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expiring options */}
                <div style={{ padding:"10px 14px", borderRadius:8,
                  background: expiringOptions.length > 0 ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.02)",
                  border:`1px solid ${expiringOptions.length > 0 ? "rgba(251,191,36,0.22)" : "rgba(255,255,255,0.08)"}` }}>
                  <p style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.09em",
                    color:"rgba(255,255,255,0.3)", fontWeight:600, marginBottom:5 }}>Expiring Options</p>
                  {expiringOptions.length === 0 ? (
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>No options expiring this week</p>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                      {expiringOptions.map(t => {
                        const daysLeft = Math.ceil((new Date(t.expiry) - Date.now()) / 86400000);
                        return (
                          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:10, fontWeight:700,
                              fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>
                              {t.ticker}
                            </span>
                            <span style={{ fontSize:9, padding:"1px 5px", borderRadius:3,
                              background:"rgba(251,191,36,0.12)", color:"#fbbf24",
                              border:"1px solid rgba(251,191,36,0.25)" }}>
                              {(t.type || "").toUpperCase()}
                            </span>
                            <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>
                              exp {t.expiry} · <span style={{ color: daysLeft <= 3 ? "#ef4444" : "#fbbf24" }}>{daysLeft}d</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* WHT alert */}
                {tfsaWHTCAD > 50 ? (
                  <div style={{ padding:"10px 14px", borderRadius:8,
                    background:"rgba(249,115,22,0.06)", border:"1px solid rgba(249,115,22,0.22)" }}>
                    <p style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.09em",
                      color:"rgba(255,255,255,0.3)", fontWeight:600, marginBottom:5 }}>WHT Drag</p>
                    <p style={{ fontSize:18, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                      color:"#f97316", margin:0, lineHeight:1 }}>
                      −C${fmt(tfsaWHTCAD)}/yr
                    </p>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginTop:3 }}>
                      US dividends in TFSA · move to RRSP to recover
                    </p>
                  </div>
                ) : (
                  <div style={{ padding:"10px 14px", borderRadius:8,
                    background:"rgba(34,197,94,0.04)", border:"1px solid rgba(34,197,94,0.15)" }}>
                    <p style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.09em",
                      color:"rgba(255,255,255,0.3)", fontWeight:600, marginBottom:5 }}>WHT Status</p>
                    <p style={{ fontSize:12, color:"#22c55e" }}>✓ Minimal WHT drag</p>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Tax placement looks good</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Buy Radar ─────────────────────────────────────────────── */}
            {(() => {
              const { inZone: inZoneAll, nearZone: nearZoneAll } = buyRadarData;
              const inZone   = inZoneAll.slice(0, 6);
              const nearZone = nearZoneAll.slice(0, 8);

              if (!inZone.length && !nearZone.length) return null;

              const pFmt = p => p < 10 ? p.toFixed(2) : p < 100 ? p.toFixed(1) : Math.round(p);

              return (
                <div className="card" style={{ marginBottom:16,
                  borderColor:"rgba(34,197,94,0.2)", background:"rgba(34,197,94,0.02)" }}>
                  {/* Header */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                    flexWrap:"wrap", gap:8, marginBottom:14 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:16 }}>🎯</span>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:"#f1f5f9", margin:0 }}>Buy Radar</p>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", margin:0, marginTop:1 }}>
                          Fair-value trigger prices · {stockScanResults ? "live prices" : "static prices — run Scan Now for live"}
                        </p>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      {inZone.length > 0 && (
                        <span style={{ fontSize:10, padding:"3px 9px", borderRadius:10,
                          background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)",
                          color:"#22c55e", fontWeight:700 }}>
                          {inZone.length} in zone
                        </span>
                      )}
                      {nearZone.length > 0 && (
                        <span style={{ fontSize:10, padding:"3px 9px", borderRadius:10,
                          background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)",
                          color:"#fbbf24", fontWeight:700 }}>
                          {nearZone.length} approaching
                        </span>
                      )}
                    </div>
                  </div>

                  {/* In Zone */}
                  {inZone.length > 0 && (
                    <>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
                        color:"#22c55e", marginBottom:8 }}>
                        ✅ At or below fair value — buy now
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:8, marginBottom:14 }}>
                        {inZone.map(s => (
                          <div key={s.ticker} style={{ padding:"10px 12px", borderRadius:8,
                            background: s.held ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                            border: s.held ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(255,255,255,0.07)" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                              <span style={{ fontSize:12, fontWeight:800, fontFamily:"'JetBrains Mono',monospace",
                                color:"#22c55e" }}>{s.ticker}</span>
                              {s.held && (
                                <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, fontWeight:700,
                                  background:"rgba(34,211,238,0.12)", border:"1px solid rgba(34,211,238,0.3)",
                                  color:"#22d3ee" }}>✓ Held</span>
                              )}
                              <span style={{ fontSize:10, fontWeight:700, marginLeft:"auto",
                                color:"#22c55e" }}>+{s.upside}% upside</span>
                            </div>
                            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:6,
                              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</div>
                            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                              <div>
                                <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:1 }}>Current</div>
                                <div style={{ fontSize:13, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                                  color:"#cbd5e1" }}>${pFmt(s.price)}</div>
                              </div>
                              <div style={{ color:"rgba(255,255,255,0.15)", fontSize:14 }}>→</div>
                              <div>
                                <div style={{ fontSize:9, color:"#22c55e", marginBottom:1, fontWeight:700 }}>Fair Buy (trigger)</div>
                                <div style={{ fontSize:13, fontWeight:800, fontFamily:"'JetBrains Mono',monospace",
                                  color:"#22c55e" }}>${pFmt(s.fairPrice)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Near Zone */}
                  {nearZone.length > 0 && (
                    <>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
                        color:"#fbbf24", marginBottom:8 }}>
                        👁 Approaching fair value — set your price alert
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:8 }}>
                        {nearZone.map(s => {
                          const gapPct = Math.abs(s.upside);
                          return (
                            <div key={s.ticker} style={{ padding:"10px 12px", borderRadius:8,
                              background: s.held ? "rgba(251,191,36,0.05)" : "rgba(255,255,255,0.02)",
                              border: s.held ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                                <span style={{ fontSize:12, fontWeight:800, fontFamily:"'JetBrains Mono',monospace",
                                  color:"rgba(255,255,255,0.7)" }}>{s.ticker}</span>
                                {s.held && (
                                  <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, fontWeight:700,
                                    background:"rgba(34,211,238,0.12)", border:"1px solid rgba(34,211,238,0.3)",
                                    color:"#22d3ee" }}>✓ Held</span>
                                )}
                                <span style={{ fontSize:10, color:"#fbbf24", marginLeft:"auto", fontWeight:700 }}>
                                  {gapPct.toFixed(1)}% away
                                </span>
                              </div>
                              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:6,
                                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</div>
                              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                                <div>
                                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:1 }}>Current</div>
                                  <div style={{ fontSize:13, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                                    color:"#cbd5e1" }}>${pFmt(s.price)}</div>
                                </div>
                                <div style={{ color:"rgba(255,255,255,0.15)", fontSize:14 }}>→</div>
                                <div>
                                  <div style={{ fontSize:9, color:"#fbbf24", marginBottom:1, fontWeight:700 }}>Buy trigger</div>
                                  <div style={{ fontSize:13, fontWeight:800, fontFamily:"'JetBrains Mono',monospace",
                                    color:"#fbbf24" }}>${pFmt(s.fairPrice)}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:12, marginBottom:0, lineHeight:1.6 }}>
                    Fair prices use the Lynch PEG model (growth stocks) or dividend-yield normalisation (income stocks).
                    Run <strong style={{color:"rgba(255,255,255,0.3)"}}>Scanner → Scan Now</strong> to refresh with live prices.
                    Not financial advice.
                  </p>
                </div>
              );
            })()}

            {/* ── Header label ── */}
            <div style={{ marginBottom:18, display:"flex", alignItems:"flex-end",
              justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <p style={{ fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.3)", fontWeight:600 }}>Portfolio Dashboard</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.28)", marginTop:3 }}>
                  Combined view — TFSA + RRSP · 1 USD = {usdCadRate} CAD
                </p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:4 }}>Total Holdings</p>
                <p style={{ fontSize:30, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  color:"#a78bfa", lineHeight:1 }}>
                  C${fmt(combGrandTotal)}
                </p>
                <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:5, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:"#fbbf24" }}>
                    TFSA C${fmt(tfsaGrandTotal)}
                  </span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>·</span>
                  <span style={{ fontSize:10, color:"#22d3ee" }}>
                    RRSP C${fmt(rrspGrandTotal)}
                  </span>
                  {combCashTotal > 0 && (
                    <>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>·</span>
                      <span style={{ fontSize:10, color:"#94a3b8" }}>
                        Cash C${fmt(combCashTotal)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ════ PORTFOLIO SIGNALS ══════════════════════════════════════ */}
            {(() => {
              const allHeld = portfolios.flatMap(p =>
                (holdings[p] || []).filter(h => h.current > 0).map(h => ({ ...h, acct: p }))
              );
              const hasSignals = Object.keys(holdingSignals).length > 0;
              const signalAge = holdingSignalsFetchedAt ? (() => {
                const m = Math.round((Date.now() - new Date(holdingSignalsFetchedAt).getTime()) / 60000);
                if (m < 1)  return "just now";
                if (m < 60) return `${m}m ago`;
                const h = Math.floor(m / 60);
                return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
              })() : null;

              // Count signals by category
              const sigCounts = { buy: 0, hold: 0, caution: 0, missing: 0 };
              allHeld.forEach(h => {
                const s = holdingSignals[h.ticker];
                if (!s) { sigCounts.missing++; return; }
                const lbl = s.sig?.label || "";
                if (lbl === "Strong Buy" || lbl === "Buy" || lbl === "Bullish" || lbl === "Oversold") sigCounts.buy++;
                else if (lbl === "Overbought" || lbl === "Bearish" || lbl === "Expensive") sigCounts.caution++;
                else sigCounts.hold++;
              });

              return (
                <div style={{ marginBottom:18, padding:"14px 18px", borderRadius:12,
                  background:"rgba(34,197,94,0.03)", border:"1px solid rgba(34,197,94,0.15)" }}>

                  {/* Header */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                    flexWrap:"wrap", gap:8, marginBottom: hasSignals ? 14 : 0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:15 }}>📈</span>
                      <p style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.9)", margin:0 }}>
                        Portfolio Signals
                      </p>
                      {signalAge && (
                        <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>
                          analyzed {signalAge}
                        </span>
                      )}
                      {hasSignals && (
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {sigCounts.buy > 0 && (
                            <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:5,
                              background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)",
                              color:"#22c55e" }}>{sigCounts.buy} Buy</span>
                          )}
                          {sigCounts.hold > 0 && (
                            <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:5,
                              background:"rgba(100,116,139,0.12)", border:"1px solid rgba(100,116,139,0.3)",
                              color:"#94a3b8" }}>{sigCounts.hold} Hold</span>
                          )}
                          {sigCounts.caution > 0 && (
                            <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:5,
                              background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)",
                              color:"#ef4444" }}>{sigCounts.caution} Caution</span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={analyzeHoldings}
                      disabled={holdingSignalsLoading}
                      style={{ fontSize:10, fontWeight:600, padding:"5px 14px", borderRadius:7,
                        background: holdingSignalsLoading ? "rgba(34,197,94,0.06)" : "rgba(34,197,94,0.14)",
                        border:"1px solid rgba(34,197,94,0.35)", color:"#22c55e",
                        cursor: holdingSignalsLoading ? "wait" : "pointer",
                        opacity: holdingSignalsLoading ? 0.6 : 1 }}>
                      {holdingSignalsLoading ? "⏳ Analyzing…" : hasSignals ? "🔄 Re-analyze" : "📊 Analyze Holdings"}
                    </button>
                  </div>

                  {/* Signals table */}
                  {hasSignals && (() => {
                    // Sort: caution first, then buy, then hold; secondary by value desc
                    const sortPriority = (lbl) => {
                      if (lbl === "Overbought" || lbl === "Bearish" || lbl === "Expensive") return 0;
                      if (lbl === "Strong Buy" || lbl === "Oversold") return 2;
                      if (lbl === "Buy" || lbl === "Bullish") return 1;
                      return -1;
                    };
                    const rows = allHeld
                      .map(h => ({ h, s: holdingSignals[h.ticker] }))
                      .filter(({ s }) => s)
                      .sort((a, b) => {
                        const pa = sortPriority(a.s.sig?.label || "");
                        const pb = sortPriority(b.s.sig?.label || "");
                        if (pb !== pa) return pb - pa;
                        return toCAD(b.h.current, b.h.ticker, b.h.currencyOverride)
                          - toCAD(a.h.current, a.h.ticker, a.h.currencyOverride);
                      });

                    return (
                      <div style={{ overflowX:"auto" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                          <thead>
                            <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                              {["Ticker","Acct","Signal","RSI","vs 50-MA","vs 200-MA","Upside","Tech Trend","Key Signals"].map(h => (
                                <th key={h} style={{ padding:"4px 8px", textAlign:"left", fontSize:9,
                                  fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase",
                                  color:"rgba(255,255,255,0.28)", whiteSpace:"nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map(({ h, s }) => {
                              const sigColor  = s.sig?.color  || "#64748b";
                              const sigLabel  = s.sig?.label  || "—";
                              const sigIcon   = s.sig?.icon   || "—";
                              const rsiColor  = s.rsi == null ? "#64748b"
                                : s.rsi < 35 ? "#22d3ee" : s.rsi > 70 ? "#ef4444" : "#94a3b8";
                              const vs50Color = s.vsPct50 == null ? "#64748b"
                                : s.vsPct50 > 0 ? "#22c55e" : "#ef4444";
                              const vs200Color = s.vsPct200 == null ? "#64748b"
                                : s.vsPct200 > 0 ? "#22c55e" : "#ef4444";
                              const upsideColor = s.upside == null ? "#64748b"
                                : s.upside >= 20 ? "#22c55e" : s.upside >= 0 ? "#86efac"
                                : s.upside >= -15 ? "#fbbf24" : "#ef4444";
                              const techColor = s.techDir === "bullish" ? "#22c55e"
                                : s.techDir === "bearish" ? "#ef4444" : "#94a3b8";
                              const acctColor = h.acct === "TFSA" ? "#fbbf24" : "#22d3ee";
                              return (
                                <tr key={`${h.acct}-${h.ticker}`}
                                  style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                                  <td style={{ padding:"7px 8px", fontFamily:"'JetBrains Mono',monospace",
                                    fontWeight:700, color:"rgba(255,255,255,0.85)", whiteSpace:"nowrap" }}>
                                    {h.ticker}
                                    <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginLeft:4 }}>
                                      {s.dayChgPct != null ? `${s.dayChgPct > 0 ? "+" : ""}${s.dayChgPct}%` : ""}
                                    </span>
                                  </td>
                                  <td style={{ padding:"7px 8px" }}>
                                    <span style={{ fontSize:9, fontWeight:700, color:acctColor,
                                      padding:"1px 5px", borderRadius:3,
                                      background:`${acctColor}18`, border:`1px solid ${acctColor}30` }}>
                                      {h.acct}
                                    </span>
                                  </td>
                                  <td style={{ padding:"7px 8px", whiteSpace:"nowrap" }}>
                                    <span style={{ fontSize:10, fontWeight:700, color:sigColor,
                                      padding:"2px 8px", borderRadius:5,
                                      background:`${sigColor}18`, border:`1px solid ${sigColor}44`,
                                      fontFamily:"'JetBrains Mono',monospace" }}>
                                      {sigIcon} {sigLabel}
                                    </span>
                                  </td>
                                  <td style={{ padding:"7px 8px", fontFamily:"'JetBrains Mono',monospace",
                                    fontWeight:600, color:rsiColor }}>
                                    {s.rsi ?? "—"}
                                  </td>
                                  <td style={{ padding:"7px 8px", fontFamily:"'JetBrains Mono',monospace",
                                    fontSize:10, color:vs50Color, whiteSpace:"nowrap" }}>
                                    {s.vsPct50 != null ? `${s.vsPct50 > 0 ? "+" : ""}${s.vsPct50}%` : "—"}
                                  </td>
                                  <td style={{ padding:"7px 8px", fontFamily:"'JetBrains Mono',monospace",
                                    fontSize:10, color:vs200Color, whiteSpace:"nowrap" }}>
                                    {s.vsPct200 != null ? `${s.vsPct200 > 0 ? "+" : ""}${s.vsPct200}%` : "—"}
                                  </td>
                                  <td style={{ padding:"7px 8px", fontFamily:"'JetBrains Mono',monospace",
                                    fontSize:10, color:upsideColor, whiteSpace:"nowrap" }}>
                                    {s.upside != null ? `${s.upside > 0 ? "+" : ""}${s.upside}%` : "—"}
                                  </td>
                                  <td style={{ padding:"7px 8px", fontSize:10, color:techColor, whiteSpace:"nowrap" }}>
                                    {s.techDir === "bullish" ? "↑ Bullish"
                                      : s.techDir === "bearish" ? "↓ Bearish" : "→ Neutral"}
                                  </td>
                                  <td style={{ padding:"7px 8px", fontSize:10,
                                    color:"rgba(255,255,255,0.4)", maxWidth:220 }}>
                                    {(s.reasons || []).join(" · ")}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {allHeld.length > rows.length && (
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:6 }}>
                            {allHeld.length - rows.length} holding(s) could not be analyzed (data unavailable).
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {!hasSignals && !holdingSignalsLoading && (
                    <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:8 }}>
                      Click "Analyze Holdings" to fetch live technical data and get Buy / Hold / Sell signals for every position.
                    </p>
                  )}
                  {holdingSignalsLoading && (
                    <p style={{ fontSize:11, color:"rgba(34,197,94,0.5)", marginTop:8 }}>
                      Fetching 1-year chart data for {portfolios.flatMap(p => (holdings[p]||[]).filter(h=>h.current>0)).length} positions…
                    </p>
                  )}
                </div>
              );
            })()}

            {/* ── Row 1: Combined summary stats ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:10, marginBottom:20 }}>

              {/* Combined total */}
              <div className="stat-card" style={{ "--accent":"#a78bfa" }}>
                <p style={{ fontSize:9, letterSpacing:"0.13em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>Total Portfolio</p>
                <p style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  color:"#a78bfa", marginBottom:4 }}>
                  C${fmt(allPortfoliosTotal)}
                </p>
                <p style={{ fontSize:10, color:"rgba(96,165,250,0.85)" }}>
                  US${fmt(allPortfoliosTotal / usdCadRate)} equiv.
                </p>
                {otherPortfoliosTotal > 0 && (
                  <p style={{ fontSize:9, color:"rgba(167,139,250,0.5)", marginTop:2 }}>
                    incl. C${fmt(otherPortfoliosTotal)} other accounts
                  </p>
                )}
              </div>

              {/* TFSA total */}
              <div className="stat-card" style={{ "--accent":"#fbbf24" }}>
                <p style={{ fontSize:9, letterSpacing:"0.13em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>TFSA</p>
                <p style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  color:"#fbbf24", marginBottom:4 }}>
                  C${fmt(tfsaGrandTotal)}
                </p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:9, color:"#60a5fa" }}>US${fmt(tfsaUSDNative)}</span>
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>·</span>
                  <span style={{ fontSize:9, color:"#34d399" }}>C${fmt(tfsaCADValCAD)}</span>
                  {tfsaCash > 0 && (
                    <>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>·</span>
                      <span style={{ fontSize:9, color:"#94a3b8" }}>C${fmt(tfsaCash)} cash</span>
                    </>
                  )}
                </div>
              </div>

              {/* RRSP total */}
              <div className="stat-card" style={{ "--accent":"#22d3ee" }}>
                <p style={{ fontSize:9, letterSpacing:"0.13em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>RRSP</p>
                <p style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  color:"#22d3ee", marginBottom:4 }}>
                  C${fmt(rrspGrandTotal)}
                </p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:9, color:"#60a5fa" }}>US${fmt(rrspUSDNative)}</span>
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>·</span>
                  <span style={{ fontSize:9, color:"#34d399" }}>C${fmt(rrspCADValCAD)}</span>
                  {rrspCash > 0 && (
                    <>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>·</span>
                      <span style={{ fontSize:9, color:"#94a3b8" }}>C${fmt(rrspCash)} cash</span>
                    </>
                  )}
                </div>
              </div>

              {/* Combined P&L */}
              <div className="stat-card" style={{ "--accent": combPnL !== null ? (combPnL >= 0 ? "#34d399" : "#ef4444") : "#475569" }}>
                <p style={{ fontSize:9, letterSpacing:"0.13em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>Combined P&L</p>
                {combPnL !== null ? (
                  <>
                    <p style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                      color: pnlColor(combPnL), marginBottom:4 }}>
                      {pnlSign(combPnL)}C${fmt(combPnL)}
                    </p>
                    <p style={{ fontSize:10, color: pnlColor(combPnL), opacity:0.8 }}>
                      {pnlSign(combPnL)}{combPnLPct.toFixed(1)}% total return
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize:14, color:"rgba(255,255,255,0.2)", fontFamily:"'JetBrains Mono',monospace" }}>—</p>
                )}
              </div>

              {/* Annual dividends */}
              <div className="stat-card" style={{ "--accent":"#a78bfa" }}>
                <p style={{ fontSize:9, letterSpacing:"0.13em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>Annual Dividends</p>
                <p style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  color:"#a78bfa", marginBottom:4 }}>
                  C${fmt(combDivCAD)}
                </p>
                {tfsaWHTCAD > 1 && (
                  <p style={{ fontSize:9, color:"#f97316" }}>
                    −C${fmt(tfsaWHTCAD)} WHT drag (TFSA)
                  </p>
                )}
              </div>

              {/* USD exposure */}
              <div className="stat-card" style={{ "--accent":"#60a5fa" }}>
                <p style={{ fontSize:9, letterSpacing:"0.13em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>USD Exposure</p>
                <p style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  color:"#60a5fa", marginBottom:4 }}>
                  US${fmt(combUSDNative)}
                </p>
                <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>
                  {combGrandTotal > 0 ? ((combUSDValCAD / combGrandTotal) * 100).toFixed(1) : 0}% of combined
                </p>
              </div>

            </div>

            {/* ── Row 2: Account split + currency donut ── */}
            <div className="card" style={{ marginBottom:20, padding:"16px 20px" }}>
              <div style={{ display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>

                {/* Account split bar */}
                <div style={{ flex:"1 1 260px" }}>
                  <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                    color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:10 }}>Account Allocation</p>
                  <div style={{ height:20, borderRadius:6, overflow:"hidden", display:"flex", marginBottom:8 }}>
                    <div style={{ width:`${tfsaAcctPct}%`, background:"linear-gradient(90deg,#fbbf24,#f59e0b)",
                      display:"flex", alignItems:"center", justifyContent:"center", transition:"width 0.5s",
                      minWidth: tfsaAcctPct > 5 ? "auto" : 0 }}>
                      {tfsaAcctPct > 8 && (
                        <span style={{ fontSize:9, fontWeight:700, color:"rgba(0,0,0,0.65)" }}>
                          TFSA {tfsaAcctPct.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div style={{ width:`${rrspAcctPct}%`, background:"linear-gradient(90deg,#22d3ee,#06b6d4)",
                      display:"flex", alignItems:"center", justifyContent:"center", transition:"width 0.5s" }}>
                      {rrspAcctPct > 8 && (
                        <span style={{ fontSize:9, fontWeight:700, color:"rgba(0,0,0,0.65)" }}>
                          RRSP {rrspAcctPct.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, color:"#fbbf24" }}>
                      TFSA — C${fmt(tfsaGrandTotal)}
                    </span>
                    <span style={{ fontSize:10, color:"#22d3ee" }}>
                      RRSP — C${fmt(rrspGrandTotal)}
                    </span>
                  </div>
                </div>

                <div style={{ width:1, height:60, background:"rgba(255,255,255,0.07)", flexShrink:0 }}/>

                {/* Currency donut */}
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <DonutChart
                    segments={combCurrSegments} size={80} thickness={13}
                    centerLabel={combGrandTotal > 0 ? `${((combUSDValCAD / combGrandTotal) * 100).toFixed(0)}%` : "—"}
                    centerSub="USD"
                  />
                  <div>
                    <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                      color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>Combined Currency</p>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:"#60a5fa", flexShrink:0 }}/>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>
                        USD — US${fmt(combUSDNative)}
                        <span style={{ color:"rgba(255,255,255,0.3)", marginLeft:4 }}>
                          (C${fmt(combUSDValCAD)})
                        </span>
                      </span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom: combCashTotal > 0 ? 5 : 0 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:"#34d399", flexShrink:0 }}/>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>
                        CAD — C${fmt(combCADNative)}
                      </span>
                    </div>
                    {combCashTotal > 0 && (
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:"#94a3b8", flexShrink:0 }}/>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>
                          Cash — C${fmt(combCashTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ width:1, height:60, background:"rgba(255,255,255,0.07)", flexShrink:0 }}/>

                {/* WHT summary */}
                {tfsaWHTCAD > 1 && (
                  <div style={{ background:"rgba(249,115,22,0.05)", border:"1px solid rgba(249,115,22,0.2)",
                    borderRadius:8, padding:"10px 14px", minWidth:160 }}>
                    <p style={{ fontSize:9, color:"#f97316", letterSpacing:"0.1em",
                      textTransform:"uppercase", marginBottom:5 }}>WHT Annual Drag</p>
                    <p style={{ fontSize:18, fontFamily:"'JetBrains Mono',monospace",
                      fontWeight:700, color:"#f97316" }}>
                      −C${fmt(tfsaWHTCAD)}
                    </p>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginTop:3, lineHeight:1.4 }}>
                      IRS withholds 15% on US dividends in TFSA
                    </p>
                  </div>
                )}

                <div style={{ width:1, height:60, background:"rgba(255,255,255,0.07)", flexShrink:0 }}/>

                {/* FX sensitivity */}
                <div style={{ background:"rgba(96,165,250,0.04)", border:"1px solid rgba(96,165,250,0.18)",
                  borderRadius:8, padding:"10px 14px", minWidth:170 }}>
                  <p style={{ fontSize:9, color:"#60a5fa", letterSpacing:"0.1em",
                    textTransform:"uppercase", marginBottom:5 }}>FX Sensitivity</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.6)", lineHeight:1.5 }}>
                    5% CAD rise →{" "}
                    <span style={{ color:"#ef4444", fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
                      −C${fmt(fxSensitivity5)}
                    </span>
                  </p>
                  <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:3, lineHeight:1.4 }}>
                    {combGrandTotal > 0 ? ((combUSDValCAD / combGrandTotal) * 100).toFixed(0) : 0}% USD exposure on C${fmt(combGrandTotal)} portfolio
                  </p>
                </div>
              </div>
            </div>

            {/* ── Row 3: TFSA | RRSP account panels ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(360px, 1fr))", gap:14, marginBottom:20 }}>
              <AccountPanel
                label="TFSA" color="#fbbf24" rgb="251,191,36"
                holdings={tfsaH} totalCAD={tfsaTotalCAD}
                grandTotal={tfsaGrandTotal} cash={tfsaCash}
                usdValCAD={tfsaUSDValCAD} cadValCAD={tfsaCADValCAD} usdNative={tfsaUSDNative}
                topHoldings={tfsaTop} maxVal={tfsaMaxVal}
                divCAD={tfsaDivCAD} whtCAD={tfsaWHTCAD}
                pnL={tfsaPnL} costCAD={tfsaCostCAD}
                targetSum={tfsaTargetSum}
                currSegments={tfsaCurrSegments}
                concWarns={tfsaConc}
              />
              <AccountPanel
                label="RRSP" color="#22d3ee" rgb="34,211,238"
                holdings={rrspH} totalCAD={rrspTotalCAD}
                grandTotal={rrspGrandTotal} cash={rrspCash}
                usdValCAD={rrspUSDValCAD} cadValCAD={rrspCADValCAD} usdNative={rrspUSDNative}
                topHoldings={rrspTop} maxVal={rrspMaxVal}
                divCAD={rrspDivCAD} whtCAD={0}
                pnL={rrspPnL} costCAD={rrspCostCAD}
                targetSum={rrspTargetSum}
                currSegments={rrspCurrSegments}
                concWarns={rrspConc}
              />
            </div>

            {/* ── Row 4: Combined top holdings ── */}
            {allTop.length > 0 && (
              <div className="card" style={{ marginBottom:20 }}>
                <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:14 }}>
                  Combined Top Holdings — largest positions across both accounts
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {allTop.map((h, i) => {
                    const isUSD = getTickerCurrency(h.ticker, h.currencyOverride) === "USD";
                    const barPct = (h.valueCAD / allMaxVal) * 100;
                    const acctColor = h.acct === "TFSA" ? "#fbbf24" : "#22d3ee";
                    const pct = combTotalCAD > 0 ? (h.valueCAD / combTotalCAD) * 100 : 0;
                    const dispVal = isUSD ? `US$${fmt(h.current)}` : `C$${fmt(h.current)}`;
                    const livePrice = liveHoldingPrices[h.ticker];
                    const prevPrice = livePrevPrices[h.ticker];
                    const dayChgPct = livePrice && prevPrice && prevPrice > 0
                      ? ((livePrice - prevPrice) / prevPrice) * 100 : null;
                    return (
                      <div key={`${h.acct}-${h.ticker}`} style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)",
                          fontFamily:"'JetBrains Mono',monospace", minWidth:18, textAlign:"right" }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                          fontWeight:600, color:acctColor, minWidth:56 }}>
                          {h.ticker}
                        </span>
                        <span style={{ fontSize:9, padding:"1px 6px", borderRadius:3, minWidth:36, textAlign:"center",
                          background: h.acct === "TFSA" ? "rgba(251,191,36,0.1)" : "rgba(34,211,238,0.1)",
                          color:acctColor,
                          border:`1px solid ${h.acct === "TFSA" ? "rgba(251,191,36,0.22)" : "rgba(34,211,238,0.22)"}` }}>
                          {h.acct}
                        </span>
                        <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.05)", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:6, borderRadius:3, transition:"width 0.5s",
                            background:`linear-gradient(90deg, ${acctColor}cc, ${acctColor}44)`,
                            width:`${barPct}%` }}/>
                        </div>
                        <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                          color:"rgba(255,255,255,0.7)", minWidth:96, textAlign:"right" }}>
                          {dispVal}
                        </span>
                        {dayChgPct !== null ? (
                          <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                            fontWeight:600, minWidth:52, textAlign:"right",
                            color: dayChgPct >= 0 ? "#22c55e" : "#ef4444" }}>
                            {dayChgPct >= 0 ? "+" : ""}{dayChgPct.toFixed(2)}%
                          </span>
                        ) : (
                          <span style={{ fontSize:9, color:"rgba(255,255,255,0.15)", minWidth:52, textAlign:"right" }}>
                            —
                          </span>
                        )}
                        <span style={{ fontSize:9, color:"rgba(255,255,255,0.28)",
                          minWidth:38, textAlign:"right" }}>
                          {pct.toFixed(1)}%
                        </span>
                        <span style={{ fontSize:9, padding:"1px 5px", borderRadius:3,
                          background: isUSD ? "rgba(96,165,250,0.1)" : "rgba(52,211,153,0.1)",
                          color: isUSD ? "#60a5fa" : "#34d399",
                          border:`1px solid ${isUSD ? "rgba(96,165,250,0.18)" : "rgba(52,211,153,0.18)"}` }}>
                          {isUSD ? "USD" : "CAD"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Row 5: Portfolio Diversification ── */}
            {combTotalCAD > 0 && (() => {
              const SECTOR_COLOR = {
                "Technology":  "#22d3ee",
                "Financials":  "#60a5fa",
                "Healthcare":  "#34d399",
                "Energy":      "#f97316",
                "Consumer":    "#fbbf24",
                "Industrials": "#a78bfa",
                "Real Estate": "#f472b6",
                "ETF / Fund":  "#4ade80",
                "Cash":        "#94a3b8",
                "Other":       "rgba(255,255,255,0.25)",
              };
              const GEO_COLOR  = { "United States":"#60a5fa", "Canada":"#34d399", "International":"#fbbf24" };
              const ROLE_COLOR = { "Core Holding":"#22d3ee", "Growth":"#a78bfa", "Income":"#34d399", "Tactical":"#f97316", "Other":"rgba(255,255,255,0.3)" };

              function canonSector(raw) {
                if (!raw) return "Other";
                const r = raw.toLowerCase();
                if (r.includes("tech") || r.includes("semi") || r.includes("cloud") || r.includes("saas") || r.includes("software") || r.includes("ai") || r.includes("data")) return "Technology";
                if (r.includes("financ") || r.includes("bank") || r.includes("payment") || r.includes("fintech") || r.includes("insurance")) return "Financials";
                if (r.includes("health") || r.includes("pharma") || r.includes("biotech") || r.includes("medic")) return "Healthcare";
                if (r.includes("energy") || r.includes("oil") || r.includes("gas") || r.includes("pipeline") || r.includes("utilit")) return "Energy";
                if (r.includes("consumer") || r.includes("retail") || r.includes("staple") || r.includes("discret")) return "Consumer";
                if (r.includes("industri") || r.includes("defense") || r.includes("aerospace") || r.includes("transport") || r.includes("manufactur")) return "Industrials";
                if (r.includes("real estate") || r.includes("reit")) return "Real Estate";
                if (r.includes("etf") || r.includes("fund") || r.includes("index")) return "ETF / Fund";
                return "Other";
              }

              const CA_EXTRA    = new Set(["SHOP","BN","BAM","ENB","SU","CNR","RY","TD","BNS","CP","MFC"]);
              const INTL_MAP    = { NVO:"International", ASML:"International", TSM:"International", SAP:"International", ARM:"International" };
              function getGeo(ticker, currencyOverride) {
                if (INTL_MAP[ticker]) return INTL_MAP[ticker];
                if (CA_EXTRA.has(ticker) || CAD_EXEMPT.has(ticker) || currencyOverride === "CAD") return "Canada";
                return "United States";
              }

              const DIV_ETFS = new Set(["SPY","QQQ","IWM","VTI","VOO","IVV","QQQM","QUU","XEQT","XGRO","XBAL","VFV","ZSP","HXS","XIC","ZAG","XLK","XLF","XLE","GLD","XBI"]);
              function getRole(ticker) {
                const rec = TICKER_DB[ticker];
                if (!rec) return "Other";
                const r = (rec.role || "").toLowerCase();
                if (r === "anchor") return "Core Holding";
                if (r === "growth") return "Growth";
                if (r === "income") return "Income";
                if (r === "tactical") return "Tactical";
                return "Other";
              }

              const allH = [
                ...tfsaH.map(h => ({ ...h, valueCAD: toCAD(h.current, h.ticker, h.currencyOverride) })),
                ...rrspH.map(h => ({ ...h, valueCAD: toCAD(h.current, h.ticker, h.currencyOverride) })),
              ].filter(h => h.valueCAD > 0);

              const total = combTotalCAD + (combCashTotal > 0 ? combCashTotal : 0);

              const agg = (keyFn) => {
                const m = {};
                allH.forEach(h => { const k = keyFn(h); m[k] = (m[k] || 0) + h.valueCAD; });
                return Object.entries(m).map(([name, val]) => ({ name, val, pct: val / total * 100 })).sort((a, b) => b.val - a.val);
              };

              const sectorArr = (() => {
                const m = {};
                allH.forEach(h => {
                  const rawSec = TICKER_DB[h.ticker]?.sector;
                  const sec = (DIV_ETFS.has(h.ticker) && !rawSec) ? "ETF / Fund" : canonSector(rawSec);
                  m[sec] = (m[sec] || 0) + h.valueCAD;
                });
                const arr = Object.entries(m).map(([name, val]) => ({ name, val, pct: val / total * 100 })).sort((a, b) => b.val - a.val);
                if (combCashTotal > total * 0.005) arr.push({ name:"Cash", val:combCashTotal, pct:combCashTotal / total * 100 });
                return arr;
              })();

              const geoArr  = agg(h => getGeo(h.ticker, h.currencyOverride));
              const roleArr = agg(h => getRole(h.ticker));

              const LegendDot = ({ name, colorMap }) => (
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background: colorMap[name] || "#94a3b8", flexShrink:0 }} />
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.5)" }}>{name}</span>
                </div>
              );

              const BarRow = ({ name, pct, color }) => (
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.65)" }}>{name}</span>
                    <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ height:3, borderRadius:2, background:"rgba(255,255,255,0.06)" }}>
                    <div style={{ height:"100%", borderRadius:2, width:`${Math.min(pct, 100)}%`, background: color }} />
                  </div>
                </div>
              );

              return (
                <div style={{ padding:"0 28px 20px" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)",
                    textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>
                    Portfolio Diversification
                  </p>

                  {/* Stacked sector bar */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", height:10, borderRadius:6, overflow:"hidden", gap:1 }}>
                      {sectorArr.filter(s => s.pct > 0.5).map(s => (
                        <div key={s.name} style={{ flex: s.pct, minWidth:2,
                          background: SECTOR_COLOR[s.name] || "#94a3b8" }}
                          title={`${s.name}: ${s.pct.toFixed(1)}%`} />
                      ))}
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"5px 14px", marginTop:8 }}>
                      {sectorArr.map(s => (
                        <div key={s.name} style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <div style={{ width:8, height:8, borderRadius:2, background: SECTOR_COLOR[s.name] || "#94a3b8" }} />
                          <span style={{ fontSize:9, color:"rgba(255,255,255,0.45)" }}>{s.name}</span>
                          <span style={{ fontSize:9, color:"rgba(255,255,255,0.28)", fontFamily:"'JetBrains Mono',monospace" }}>{s.pct.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Three cards */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:12 }}>

                    {/* Sector detail */}
                    <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"14px 16px" }}>
                      <p style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase",
                        letterSpacing:"0.08em", marginBottom:12 }}>Sector Breakdown</p>
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {sectorArr.map(s => (
                          <BarRow key={s.name} name={s.name} pct={s.pct} color={SECTOR_COLOR[s.name] || "#94a3b8"} />
                        ))}
                      </div>
                    </div>

                    {/* Geography */}
                    <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"14px 16px" }}>
                      <p style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase",
                        letterSpacing:"0.08em", marginBottom:12 }}>Geography</p>
                      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                        <DonutChart
                          segments={geoArr.map(g => ({ pct: g.pct, color: GEO_COLOR[g.name] || "#94a3b8", label: g.name }))}
                          size={92} thickness={14}
                          centerLabel={`${geoArr[0]?.pct.toFixed(0) ?? 0}%`}
                          centerSub={geoArr[0]?.name?.split(" ")[0]}
                        />
                        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                          {geoArr.map(g => (
                            <BarRow key={g.name} name={g.name} pct={g.pct} color={GEO_COLOR[g.name] || "#94a3b8"} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Style & Role */}
                    <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"14px 16px" }}>
                      <p style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase",
                        letterSpacing:"0.08em", marginBottom:12 }}>Style &amp; Role</p>
                      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                        <DonutChart
                          segments={roleArr.map(r => ({ pct: r.pct, color: ROLE_COLOR[r.name] || "#94a3b8", label: r.name }))}
                          size={92} thickness={14}
                          centerLabel={`${roleArr[0]?.pct.toFixed(0) ?? 0}%`}
                          centerSub={roleArr[0]?.name}
                        />
                        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                          {roleArr.map(r => (
                            <BarRow key={r.name} name={r.name} pct={r.pct} color={ROLE_COLOR[r.name] || "#94a3b8"} />
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* ── Row 6: Portfolio health summary ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:10, marginBottom:14 }}>

              {/* WHT recovery opportunity */}
              {tfsaWHTCAD > 1 && (
                <div style={{ background:"rgba(249,115,22,0.04)", border:"1px solid rgba(249,115,22,0.18)",
                  borderLeft:"3px solid #f97316", borderRadius:10, padding:"12px 14px" }}>
                  <p style={{ fontSize:9, color:"#f97316", fontWeight:700, letterSpacing:"0.08em",
                    textTransform:"uppercase", marginBottom:6 }}>WHT Recovery</p>
                  <p style={{ fontSize:14, fontFamily:"'JetBrains Mono',monospace",
                    fontWeight:700, color:"#fb923c", marginBottom:4 }}>
                    C${fmt(tfsaWHTCAD)}/yr
                  </p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.5 }}>
                    Moving US dividend payers from TFSA → RRSP recovers this permanently under the Canada–US Tax Treaty.
                  </p>
                </div>
              )}

              {/* Dividend income breakdown */}
              {combDivCAD > 1 && (
                <div style={{ background:"rgba(167,139,250,0.04)", border:"1px solid rgba(167,139,250,0.18)",
                  borderLeft:"3px solid #a78bfa", borderRadius:10, padding:"12px 14px" }}>
                  <p style={{ fontSize:9, color:"#a78bfa", fontWeight:700, letterSpacing:"0.08em",
                    textTransform:"uppercase", marginBottom:6 }}>Income Breakdown</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>TFSA dividends</span>
                      <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>
                        C${fmt(tfsaDivCAD)}/yr
                      </span>
                    </div>
                    {tfsaWHTCAD > 1 && (
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>  WHT deducted</span>
                        <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#f97316" }}>
                          −C${fmt(tfsaWHTCAD)}/yr
                        </span>
                      </div>
                    )}
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>RRSP dividends</span>
                      <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#22d3ee" }}>
                        C${fmt(rrspDivCAD)}/yr
                      </span>
                    </div>
                    <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", marginTop:3, paddingTop:5,
                      display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)", fontWeight:600 }}>Net received</span>
                      <span style={{ fontSize:13, fontFamily:"'JetBrains Mono',monospace",
                        color:"#a78bfa", fontWeight:700 }}>
                        C${fmt(combDivCAD - tfsaWHTCAD)}/yr
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sector gaps */}
              {(() => {
                const gapList = detectGaps(tfsaH, rrspH);
                return gapList.length > 0 ? (
                  <div style={{ background:"rgba(249,115,22,0.04)", border:"1px solid rgba(249,115,22,0.18)",
                    borderLeft:"3px solid #f97316", borderRadius:10, padding:"12px 14px" }}>
                    <p style={{ fontSize:9, color:"#f97316", fontWeight:700, letterSpacing:"0.08em",
                      textTransform:"uppercase", marginBottom:6 }}>Sector Gaps</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:7 }}>
                      {gapList.map(g => (
                        <span key={g} className="gap-badge">{g}</span>
                      ))}
                    </div>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", lineHeight:1.5 }}>
                      No positions in these sectors across both accounts.
                    </p>
                  </div>
                ) : (
                  <div style={{ background:"rgba(52,211,153,0.04)", border:"1px solid rgba(52,211,153,0.18)",
                    borderLeft:"3px solid #34d399", borderRadius:10, padding:"12px 14px" }}>
                    <p style={{ fontSize:9, color:"#34d399", fontWeight:700, letterSpacing:"0.08em",
                      textTransform:"uppercase", marginBottom:6 }}>Sector Coverage</p>
                    <p style={{ fontSize:14, color:"#34d399" }}>✓ All sectors covered</p>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:4 }}>
                      Your portfolio spans all tracked sectors.
                    </p>
                  </div>
                );
              })()}

              {/* Cost basis summary */}
              {combCostCAD > 0 && (
                <div style={{ background:"rgba(148,163,184,0.04)", border:"1px solid rgba(148,163,184,0.15)",
                  borderLeft:"3px solid #64748b", borderRadius:10, padding:"12px 14px" }}>
                  <p style={{ fontSize:9, color:"rgba(148,163,184,0.7)", fontWeight:700, letterSpacing:"0.08em",
                    textTransform:"uppercase", marginBottom:6 }}>Cost Basis</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>TFSA invested</span>
                      <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>
                        C${fmt(tfsaCostCAD)}
                      </span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>RRSP invested</span>
                      <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#22d3ee" }}>
                        C${fmt(rrspCostCAD)}
                      </span>
                    </div>
                    <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", marginTop:3, paddingTop:5,
                      display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)", fontWeight:600 }}>Total invested</span>
                      <span style={{ fontSize:13, fontFamily:"'JetBrains Mono',monospace",
                        color:"#94a3b8", fontWeight:700 }}>
                        C${fmt(combCostCAD)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Contribution Room tracker */}
              <div style={{ background:"rgba(34,197,94,0.04)", border:"1px solid rgba(34,197,94,0.18)",
                borderLeft:"3px solid #22c55e", borderRadius:10, padding:"12px 14px" }}>
                <p style={{ fontSize:9, color:"#22c55e", fontWeight:700, letterSpacing:"0.08em",
                  textTransform:"uppercase", marginBottom:8 }}>Contribution Room</p>
                {[["TFSA","#fbbf24","7,000"], ["RRSP","#22d3ee","32,490"]].map(([key, color, limit]) => {
                  const room = contribRoom[key] || 0;
                  const usedPct = Math.max(0, Math.min(100, room > 0
                    ? 100 - (room / (key === "TFSA" ? 7000 : 32490)) * 100 : 0));
                  return (
                    <div key={key} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>
                          {key} · C${limit}/yr limit
                        </span>
                        <input
                          type="number"
                          value={room || ""}
                          placeholder="room left"
                          onChange={e => updateContribRoom(key, e.target.value)}
                          style={{ width:96, fontSize:10, padding:"2px 6px", textAlign:"right",
                            background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                            borderRadius:4, color, fontFamily:"'JetBrains Mono',monospace",
                            boxSizing:"border-box" }}
                        />
                      </div>
                      {room > 0 && (
                        <div style={{ height:5, borderRadius:3, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                          <div style={{ height:5, borderRadius:3, width:`${usedPct}%`,
                            background:`linear-gradient(90deg,${color}99,${color}44)`, transition:"width 0.4s" }}/>
                        </div>
                      )}
                      {room > 0 && (
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:3 }}>
                          C${fmt(room)} remaining
                        </p>
                      )}
                    </div>
                  );
                })}
                <p style={{ fontSize:9, color:"rgba(255,255,255,0.2)", marginTop:4, lineHeight:1.4 }}>
                  Enter your remaining room from CRA My Account
                </p>
              </div>

            </div>

            {/* ════ DIVIDEND INCOME CALENDAR ══════════════════════════════ */}
            {combDivCAD > 1 && (
              <div className="card" style={{ marginBottom:16, padding:"16px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:14 }}>
                  <div>
                    <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                      color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:3 }}>
                      Dividend Income Projection
                    </p>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>
                      Estimated monthly income (quarter-end weighted) · net of WHT
                    </p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ fontSize:20, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                      color:"#a78bfa", lineHeight:1 }}>
                      C${fmt(combDivCAD - tfsaWHTCAD)}/yr
                    </p>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>
                      ≈ C${fmt((combDivCAD - tfsaWHTCAD) / 12)}/mo net
                    </p>
                  </div>
                </div>

                {/* Monthly bars */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(12, 1fr)", gap:4, alignItems:"end", height:80 }}>
                  {divByMonth.map((d, idx) => {
                    const netAmt = d.amount - (tfsaWHTCAD / 12) * MONTH_WEIGHTS[idx] / (MONTH_WEIGHTS.reduce((a,b)=>a+b,0)/12);
                    const barH = Math.max(4, (d.amount / maxMonthlyDiv) * 70);
                    const isCur = idx === curMonth;
                    return (
                      <div key={d.month} style={{ display:"flex", flexDirection:"column",
                        alignItems:"center", height:80, justifyContent:"flex-end" }}>
                        <p style={{ fontSize:8, color: isCur ? "#a78bfa" : "rgba(255,255,255,0.45)",
                          fontFamily:"'JetBrains Mono',monospace", marginBottom:3, fontWeight: isCur ? 700 : 400 }}>
                          C${Math.round(netAmt)}
                        </p>
                        <div style={{ width:"100%", borderRadius:"3px 3px 0 0",
                          height:`${barH}px`,
                          background: isCur
                            ? "linear-gradient(180deg,#a78bfa,#7c3aed)"
                            : "linear-gradient(180deg,rgba(167,139,250,0.5),rgba(167,139,250,0.2))",
                          border: isCur ? "1px solid rgba(167,139,250,0.6)" : "1px solid rgba(167,139,250,0.15)",
                          transition:"height 0.4s" }}/>
                        <p style={{ fontSize:8, color: isCur ? "#a78bfa" : "rgba(255,255,255,0.25)",
                          marginTop:3, fontWeight: isCur ? 700 : 400 }}>{d.month}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Per-account breakdown row */}
                <div style={{ display:"flex", gap:20, marginTop:12, paddingTop:10,
                  borderTop:"1px solid rgba(255,255,255,0.06)", flexWrap:"wrap" }}>
                  {[
                    ["TFSA", "#fbbf24", tfsaDivCAD, tfsaWHTCAD],
                    ["RRSP", "#22d3ee", rrspDivCAD, 0],
                  ].map(([label, color, gross, wht]) => (
                    <div key={label}>
                      <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:3 }}>{label}</p>
                      <p style={{ fontSize:13, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                        color }}>C${fmt(gross - wht)}/yr</p>
                      {wht > 0 && (
                        <p style={{ fontSize:9, color:"#f97316" }}>−C${fmt(wht)}/yr WHT</p>
                      )}
                    </div>
                  ))}
                  <div>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:3 }}>Quarterly est.</p>
                    <p style={{ fontSize:13, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                      color:"rgba(255,255,255,0.7)" }}>
                      C${fmt((combDivCAD - tfsaWHTCAD) / 4)}/qtr
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:3 }}>Effective yield</p>
                    <p style={{ fontSize:13, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                      color:"rgba(255,255,255,0.7)" }}>
                      {combGrandTotal > 0
                        ? (((combDivCAD - tfsaWHTCAD) / combGrandTotal) * 100).toFixed(2) : "0.00"}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)", lineHeight:1.5 }}>
              ⚠ Not financial advice. Data stored locally in your browser. Export regularly to back up. Consult a licensed CFP before trading.
            </p>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: OPTIONS TRADING
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "options" && (() => {
        const mp       = marketPulse;
        const vix      = Number(mp.macroSignals?.find(c => c.category === "Equities")
          ?.signals?.find(s => s.label === "VIX")?.value?.replace(/[^0-9.]/g,"")) || 17;
        const ivEnv    = vix >= 25 ? { label:"High IV — great for selling premium", color:"#22c55e", icon:"🔥" }
                       : vix >= 18 ? { label:"Elevated IV — good conditions",       color:"#22c55e", icon:"✅" }
                       : vix >= 14 ? { label:"Low IV — be selective, smaller premiums", color:"#fbbf24", icon:"⚠" }
                       :             { label:"Very low IV — consider skipping",       color:"#ef4444", icon:"🔕" };
        const riskScore = mp.riskMeter?.score ?? 50;
        const regimeBias = riskScore >= 60
          ? "Risk-On: sell CCs on extended positions to lock in gains. Be cautious on new CSPs."
          : riskScore >= 40
          ? "Neutral: balanced premium selling. CCs on full positions, CSPs on names you want to own."
          : "Risk-Off: favour CSPs on quality at a discount. Avoid CCs that cap upside during recovery.";
        const baseRotation = mp.outlooks?.[0]?.scenarios?.find(s => s.label === "Base case")?.sectorRotation?.toLowerCase() || "";

        const fmt2 = n => Number(n).toFixed(2);
        const fmtK = n => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${Number(n).toFixed(0)}`;

        // ─ Covered call candidates: held positions + any watchlist tickers
        const heldTickers = new Set(
          portfolios.flatMap(acct => (holdings[acct] || []).map(h => h.ticker))
        );
        const ccFromHoldings = portfolios.flatMap(acct =>
          (holdings[acct] || []).map(h => {
            const price      = optionPrices[h.ticker];
            const estShares  = price ? Math.round(h.current / price) : null;
            const contracts  = estShares ? Math.floor(estShares / 100) : null;
            const iv         = estimateIV(h.ticker, vix);
            const sectorWord = (TICKER_DB[h.ticker]?.sector || "").toLowerCase().split(" ")[0];
            const ccSuggested = !baseRotation || !["underweight","avoid"].some(t => {
              const i = baseRotation.indexOf(t); return i !== -1 && baseRotation.slice(i,i+80).includes(sectorWord);
            });
            return { ticker: h.ticker, name: TICKER_DB[h.ticker]?.name || h.ticker, acct, price, estShares, contracts, iv, ccSuggested, fromHolding: true };
          })
        ).filter((h, idx, arr) => arr.findIndex(x => x.ticker === h.ticker) === idx);

        const ccFromWatchlist = optionWatchlist
          .filter(sym => !heldTickers.has(sym))
          .map(sym => {
            const price      = optionPrices[sym];
            const iv         = estimateIV(sym, vix);
            const ccSuggested = true;
            return { ticker: sym, name: TICKER_DB[sym]?.name || sym, acct: "—", price, estShares: null, contracts: null, iv, ccSuggested, fromHolding: false };
          });

        const ccCandidates = [...ccFromHoldings, ...ccFromWatchlist]
          .sort((a, b) => (b.contracts||0) - (a.contracts||0));

        // ─ CSP candidates: recommendations aligned with regime + watchlist tickers
        const cspFromRecs = RECOMMENDATIONS.filter(r => {
          const sectorWord = (r.sector || "").toLowerCase().split(" ")[0];
          const isAligned  = !baseRotation || ["overweight","add","rotate into","favor","tilt to"].some(t => {
            const i = baseRotation.indexOf(t); return i !== -1 && baseRotation.slice(i,i+90).includes(sectorWord);
          });
          return isAligned;
        }).map(r => ({
          ...r,
          price: optionPrices[r.ticker],
          iv: estimateIV(r.ticker, vix),
          fromWatchlist: false,
        })).slice(0, 12);

        const cspRecTickers = new Set(cspFromRecs.map(r => r.ticker));
        const cspFromWatchlist = optionWatchlist
          .filter(sym => !cspRecTickers.has(sym))
          .map(sym => ({
            ticker: sym, name: TICKER_DB[sym]?.name || sym,
            sector: TICKER_DB[sym]?.sector || "—",
            thesis: "Custom watchlist ticker.",
            bestFor: "TFSA",
            price: optionPrices[sym],
            iv: estimateIV(sym, vix),
            fromWatchlist: true,
          }));

        const cspCandidates = [...cspFromRecs, ...cspFromWatchlist];

        // ─ Trade log stats
        const openTrades   = optionTrades.filter(t => t.status === "open");
        const closedTrades = optionTrades.filter(t => t.status !== "open");
        const totalPremiumCollected = optionTrades.reduce((s, t) => s + (Number(t.premium) * 100 * Number(t.contracts)), 0);
        const realizedPnL = closedTrades.reduce((s, t) => {
          const received = Number(t.premium) * 100 * Number(t.contracts);
          const closed   = (Number(t.closePrice) || 0) * 100 * Number(t.contracts);
          return s + (t.status === "expired" ? received : t.status === "closed_profit" ? received - closed : -(closed - received));
        }, 0);
        const winCount  = closedTrades.filter(t => ["expired","closed_profit","assigned"].includes(t.status)).length;
        const winRate   = closedTrades.length ? Math.round(winCount / closedTrades.length * 100) : null;

        // ─ Shared watchlist ticker input (used by both CC and CSP)
        const renderWatchlistInput = (accentColor = "#22d3ee") => (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", whiteSpace:"nowrap" }}>+ Add any ticker:</span>
            <input
              value={optionWatchInput}
              onChange={e => setOptionWatchInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && addWatchlistTicker(optionWatchInput)}
              placeholder="e.g. NVDA, SPY, PLTR"
              style={{ fontSize:11, padding:"5px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.12)",
                background:"rgba(255,255,255,0.04)", color:"#fff", width:160, fontFamily:"'JetBrains Mono',monospace" }}
            />
            <button className="btn" onClick={() => addWatchlistTicker(optionWatchInput)}
              style={{ fontSize:10, padding:"5px 12px", color:accentColor, borderColor:`rgba(${accentColor==="a78bfa"?"167,139,250":"34,211,238"},0.3)` }}>
              Add
            </button>
            {optionWatchlist.map(sym => (
              <span key={sym} style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10,
                padding:"3px 8px", borderRadius:5, background:"rgba(255,255,255,0.05)",
                border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.65)",
                fontFamily:"'JetBrains Mono',monospace" }}>
                {sym}
                <button onClick={() => removeWatchlistTicker(sym)}
                  style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:11, padding:"0 0 0 4px", lineHeight:1 }}>
                  ×
                </button>
              </span>
            ))}
          </div>
        );

        // Sub-tab: Covered Calls
        const renderCC = () => (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.6, flex:"1 1 400px" }}>
                Sell call options on any stock — your holdings or any ticker you add. Collect premium upfront;
                if the stock stays below your strike at expiry you keep the premium. Ideal in neutral-to-mildly-bullish markets.
              </p>
              <button className="btn btn-primary" onClick={fetchOptionPrices} disabled={optionPricesLoading}
                style={{ fontSize:11, padding:"7px 16px", opacity: optionPricesLoading ? 0.6 : 1,
                  background:"rgba(34,211,238,0.12)", borderColor:"rgba(34,211,238,0.35)", color:"#22d3ee" }}>
                {optionPricesLoading ? "Loading…" : optionPrices && Object.keys(optionPrices).length ? "⟳ Refresh prices" : "📡 Load live prices"}
              </button>
            </div>
            {renderWatchlistInput("#22d3ee")}

            {/* ── CC Technical Signal Picks ────────────────────────────────── */}
            {(() => {
              const isScanning = !!cspCcScanProgress;
              const scanPct = isScanning ? Math.round(cspCcScanProgress.done / cspCcScanProgress.total * 100) : 0;
              return (
                <div style={{ marginBottom:14, padding:"12px 14px", borderRadius:8,
                  background:"rgba(34,211,238,0.03)", border:"1px solid rgba(34,211,238,0.1)" }}>
                  {/* Header */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: cspCcPicks || isScanning ? 10 : 0, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.5)",
                      textTransform:"uppercase", letterSpacing:"0.08em" }}>
                      Technical Signal Picks — Covered Calls
                    </span>
                    {cspCcPicks?.lastUpdated && (
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>
                        · {new Date(cspCcPicks.lastUpdated).toLocaleDateString(undefined, { month:"short", day:"numeric" })}
                        {cspCcPicks.manualScan ? " (manual)" : " (auto)"}
                      </span>
                    )}
                    <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
                      {cspCcPicks && (
                        <button className="btn" onClick={refreshCspCcPicks}
                          disabled={isScanning || cspCcPicksLoading}
                          style={{ fontSize:9, padding:"3px 10px", color:"#22d3ee",
                            borderColor:"rgba(34,211,238,0.2)", opacity: isScanning ? 0.4 : 1 }}>
                          {cspCcPicksLoading ? "⏳" : "⟳ Load cache"}
                        </button>
                      )}
                      <button className="btn" onClick={runManualCspCcScan}
                        disabled={isScanning || cspCcPicksLoading}
                        style={{ fontSize:9, padding:"3px 12px", fontWeight:600,
                          color:"#22d3ee", borderColor:"rgba(34,211,238,0.35)",
                          background:"rgba(34,211,238,0.08)", opacity: isScanning ? 0.5 : 1 }}>
                        {isScanning ? `Scanning… ${cspCcScanProgress.done}/${cspCcScanProgress.total}` : "Scan Now"}
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {isScanning && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ height:3, borderRadius:2, background:"rgba(255,255,255,0.06)", overflow:"hidden", marginBottom:4 }}>
                        <div style={{ height:"100%", width:`${scanPct}%`, background:"#22d3ee",
                          borderRadius:2, transition:"width 0.3s" }} />
                      </div>
                      <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>
                        {cspCcScanProgress.ticker && `Fetching ${cspCcScanProgress.ticker}…`}
                      </p>
                    </div>
                  )}

                  {/* Empty state */}
                  {!cspCcPicks && !isScanning && (
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontStyle:"italic", paddingTop:4 }}>
                      No picks loaded — click <strong style={{ color:"#22d3ee" }}>Scan Now</strong> to analyse {SPREAD_SCAN_TICKERS.length} tickers live, or wait for the 6 AM auto-refresh.
                    </p>
                  )}

                  {/* Picks row */}
                  {(cspCcPicks?.ccPicks?.length > 0) && (
                    <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
                      {cspCcPicks.ccPicks.slice(0, 12).map(p => {
                        const rc = p.ccRating === "Strong" ? "#22c55e" : p.ccRating === "Good" ? "#fbbf24" : "rgba(255,255,255,0.35)";
                        return (
                          <div key={p.ticker} title="Click to add to watchlist"
                            onClick={() => addWatchlistTicker(p.ticker)}
                            style={{ minWidth:158, maxWidth:158, flexShrink:0, cursor:"pointer",
                              background:"rgba(34,211,238,0.05)", border:"1px solid rgba(34,211,238,0.15)",
                              borderRadius:8, padding:"10px 12px" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                              <span style={{ fontSize:13, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#22d3ee" }}>
                                {p.ticker}
                              </span>
                              <span style={{ fontSize:11, fontWeight:700, color: rc }}>{p.ccScore}</span>
                            </div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", marginBottom:6, fontFamily:"'JetBrains Mono',monospace" }}>
                              ${p.price?.toFixed(2)} · RSI {p.rsi}
                              {p.hvRank != null && (
                                <span style={{ color: p.hvRank >= 60 ? "#22c55e" : p.hvRank >= 35 ? "#fbbf24" : "rgba(255,255,255,0.3)" }}>
                                  {" "}· IVR {Math.round(p.hvRank)}%
                                </span>
                              )}
                            </div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:5 }}>
                              {(p.ccSignals || []).slice(0, 3).map(sig => (
                                <span key={sig} style={{ fontSize:8, padding:"1px 5px", borderRadius:3,
                                  background:"rgba(34,211,238,0.08)", color:"rgba(34,211,238,0.65)",
                                  border:"1px solid rgba(34,211,238,0.12)", whiteSpace:"nowrap" }}>{sig}</span>
                              ))}
                            </div>
                            <div style={{ fontSize:8, fontWeight:700, color: rc, letterSpacing:"0.04em" }}>{p.ccRating}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {cspCcPicks && (
                    <p style={{ fontSize:8, color:"rgba(255,255,255,0.2)", fontStyle:"italic", marginTop:6 }}>
                      Score 0–100 · Click a ticker to add to watchlist · Auto-refreshed weekdays at 6 AM
                    </p>
                  )}
                </div>
              );
            })()}

            {optionPriceError && <p style={{ fontSize:10, color:"#ef4444", marginBottom:10 }}>⚠ {optionPriceError}</p>}

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {ccCandidates.map(h => {
                const selectedDTE = 30;
                const strikes = h.price ? getStrikeSuggestions(h.price, "cc", selectedDTE, h.iv) : [];
                return (
                  <div key={h.ticker + h.acct} className="card" style={{ padding:"14px 18px",
                    borderColor: h.ccSuggested ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.06)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:18, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#22d3ee" }}>
                          {h.ticker}
                        </span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{h.name}</span>
                        <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4,
                          background:"rgba(34,211,238,0.08)", color:"rgba(34,211,238,0.7)",
                          border:"1px solid rgba(34,211,238,0.2)" }}>{h.acct}</span>
                        {h.ccSuggested
                          ? <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, fontWeight:600,
                              background:"rgba(239,68,68,0.1)", color:"#ef4444",
                              border:"1px solid rgba(239,68,68,0.25)" }}>Regime: consider selling CC</span>
                          : <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4,
                              background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.3)",
                              border:"1px solid rgba(255,255,255,0.08)" }}>Regime: hold / no CC</span>
                        }
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ fontSize:12, fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,0.7)" }}>
                          {h.price ? `$${fmt2(h.price)}` : "—"} /share
                        </p>
                        {h.fromHolding ? (
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>
                            ~{h.estShares ?? "?"} shares · <span style={{ fontWeight:700,
                              color: (h.contracts||0) >= 1 ? "#22c55e" : "#ef4444" }}>
                              {(h.contracts||0) >= 1 ? `${h.contracts} contract${h.contracts>1?"s":""}` : "< 1 contract (need 100 shares)"}
                            </span>
                          </p>
                        ) : (
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>
                            <span style={{ padding:"2px 6px", borderRadius:4, fontSize:9,
                              background:"rgba(251,191,36,0.08)", color:"#fbbf24",
                              border:"1px solid rgba(251,191,36,0.2)" }}>Watchlist</span>
                            {" "}enter contracts when logging
                          </p>
                        )}
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)" }}>Est. IV {Math.round(h.iv)}% · VIX×{(h.iv/vix).toFixed(1)}</p>
                      </div>
                    </div>

                    {/* Strike table — show for watchlist tickers regardless of share count */}
                    {h.price && (h.fromHolding ? (h.contracts||0) >= 1 : true) ? (
                      <div style={{ overflowX:"auto" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
                          <thead>
                            <tr style={{ color:"rgba(255,255,255,0.3)", textAlign:"left" }}>
                              {(() => {
                                const onSort = col => setCcStrikeSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
                                const ts = { padding:"4px 8px", fontWeight:500, whiteSpace:"nowrap" };
                                return (<>
                                  <th style={ts}></th>
                                  <SortTh col="strike"  label="Strike"          sort={ccStrikeSort} onSort={onSort} style={ts} />
                                  <SortTh col="pct"     label="OTM %"           sort={ccStrikeSort} onSort={onSort} style={ts} />
                                  <SortTh col="premium" label="Est. premium/sh" sort={ccStrikeSort} onSort={onSort} style={ts} />
                                  <SortTh col="perContract" label="Per contract" sort={ccStrikeSort} onSort={onSort} style={ts} />
                                  <SortTh col="monthly" label="Monthly yield"   sort={ccStrikeSort} onSort={onSort} style={ts} />
                                  <SortTh col="annual"  label="Ann. yield"      sort={ccStrikeSort} onSort={onSort} style={ts} />
                                  <th style={ts}>Action</th>
                                </>);
                              })()}
                            </tr>
                          </thead>
                          <tbody>
                            {sortRows(strikes, ccStrikeSort.col, ccStrikeSort.dir, (s, col) => ({
                              strike: s.strike, pct: s.pct, premium: s.premiumPerShare,
                              perContract: s.contractPremium, monthly: parseFloat(s.monthlyYield),
                              annual: parseFloat(s.annualYield),
                            }[col] ?? null)).map(s => (
                              <tr key={s.label} style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                                <td style={{ padding:"6px 8px", color:"rgba(255,255,255,0.4)", fontWeight:600, fontSize:9 }}>{s.label}</td>
                                <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", color:"#22d3ee", fontWeight:700 }}>${s.strike}</td>
                                <td style={{ padding:"6px 8px", color:"rgba(255,255,255,0.5)" }}>+{s.pct}%</td>
                                <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>${fmt2(s.premiumPerShare)}</td>
                                <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>${s.contractPremium}</td>
                                <td style={{ padding:"6px 8px", color:"#fbbf24", fontWeight:600 }}>{s.monthlyYield}%</td>
                                <td style={{ padding:"6px 8px", color:"#a78bfa", fontWeight:600 }}>{s.annualYield}%</td>
                                <td style={{ padding:"6px 8px" }}>
                                  <button className="btn" onClick={() => setOptionNewTrade({
                                    ...DEFAULT_OPT_TRADE, type:"cc", ticker:h.ticker,
                                    account: h.fromHolding ? h.acct : "TFSA",
                                    contracts: h.fromHolding ? h.contracts : 1,
                                    strike: s.strike,
                                    expiry: new Date(Date.now() + 30*864e5).toISOString().split("T")[0],
                                    premium: s.premiumPerShare, underlyingPrice: h.price,
                                  })}
                                    style={{ fontSize:9, padding:"3px 9px", color:"#22d3ee",
                                      borderColor:"rgba(34,211,238,0.3)" }}>
                                    Log
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.2)", marginTop:6, fontStyle:"italic" }}>
                          ★ Premiums estimated from IV≈VIX×{(h.iv/vix).toFixed(1)} · 30 DTE · verify with your broker before trading
                        </p>
                      </div>
                    ) : !h.price ? (
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontStyle:"italic" }}>Load live prices to see strike suggestions.</p>
                    ) : (
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontStyle:"italic" }}>
                        Need at least 100 shares (~{fmtK(h.price * 100)} total) for 1 covered call contract.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

        // Sub-tab: CSPs
        const renderCSP = () => (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.6, flex:"1 1 400px" }}>
                Sell put options on any stock you want to own (or any ticker). You get paid premium upfront;
                if the stock stays above the strike you keep it. If assigned, you own shares at an effective discount.
                Best in neutral-to-bullish markets.
              </p>
              <button className="btn btn-primary" onClick={fetchOptionPrices} disabled={optionPricesLoading}
                style={{ fontSize:11, padding:"7px 16px", opacity: optionPricesLoading ? 0.6 : 1,
                  background:"rgba(167,139,250,0.12)", borderColor:"rgba(167,139,250,0.35)", color:"#a78bfa" }}>
                {optionPricesLoading ? "Loading…" : Object.keys(optionPrices).length ? "⟳ Refresh prices" : "📡 Load live prices"}
              </button>
            </div>
            {renderWatchlistInput("#a78bfa")}

            {/* ── CSP Technical Signal Picks ───────────────────────────────── */}
            {(() => {
              const isScanning = !!cspCcScanProgress;
              const scanPct = isScanning ? Math.round(cspCcScanProgress.done / cspCcScanProgress.total * 100) : 0;
              return (
                <div style={{ marginBottom:14, padding:"12px 14px", borderRadius:8,
                  background:"rgba(167,139,250,0.03)", border:"1px solid rgba(167,139,250,0.12)" }}>
                  {/* Header */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: cspCcPicks || isScanning ? 10 : 0, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.5)",
                      textTransform:"uppercase", letterSpacing:"0.08em" }}>
                      Technical Signal Picks — Cash-Secured Puts
                    </span>
                    {cspCcPicks?.lastUpdated && (
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>
                        · {new Date(cspCcPicks.lastUpdated).toLocaleDateString(undefined, { month:"short", day:"numeric" })}
                        {cspCcPicks.manualScan ? " (manual)" : " (auto)"}
                      </span>
                    )}
                    <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
                      {cspCcPicks && (
                        <button className="btn" onClick={refreshCspCcPicks}
                          disabled={isScanning || cspCcPicksLoading}
                          style={{ fontSize:9, padding:"3px 10px", color:"#a78bfa",
                            borderColor:"rgba(167,139,250,0.2)", opacity: isScanning ? 0.4 : 1 }}>
                          {cspCcPicksLoading ? "⏳" : "⟳ Load cache"}
                        </button>
                      )}
                      <button className="btn" onClick={runManualCspCcScan}
                        disabled={isScanning || cspCcPicksLoading}
                        style={{ fontSize:9, padding:"3px 12px", fontWeight:600,
                          color:"#a78bfa", borderColor:"rgba(167,139,250,0.35)",
                          background:"rgba(167,139,250,0.08)", opacity: isScanning ? 0.5 : 1 }}>
                        {isScanning ? `Scanning… ${cspCcScanProgress.done}/${cspCcScanProgress.total}` : "Scan Now"}
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {isScanning && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ height:3, borderRadius:2, background:"rgba(255,255,255,0.06)", overflow:"hidden", marginBottom:4 }}>
                        <div style={{ height:"100%", width:`${scanPct}%`, background:"#a78bfa",
                          borderRadius:2, transition:"width 0.3s" }} />
                      </div>
                      <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>
                        {cspCcScanProgress.ticker && `Fetching ${cspCcScanProgress.ticker}…`}
                      </p>
                    </div>
                  )}

                  {/* Empty state */}
                  {!cspCcPicks && !isScanning && (
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontStyle:"italic", paddingTop:4 }}>
                      No picks loaded — click <strong style={{ color:"#a78bfa" }}>Scan Now</strong> to analyse {SPREAD_SCAN_TICKERS.length} tickers live, or wait for the 6 AM auto-refresh.
                    </p>
                  )}

                  {/* Picks row */}
                  {(cspCcPicks?.cspPicks?.length > 0) && (
                    <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
                      {cspCcPicks.cspPicks.slice(0, 12).map(p => {
                        const rc = p.cspRating === "Strong" ? "#22c55e" : p.cspRating === "Good" ? "#fbbf24" : "rgba(255,255,255,0.35)";
                        return (
                          <div key={p.ticker} title="Click to add to watchlist"
                            onClick={() => addWatchlistTicker(p.ticker)}
                            style={{ minWidth:158, maxWidth:158, flexShrink:0, cursor:"pointer",
                              background:"rgba(167,139,250,0.05)", border:"1px solid rgba(167,139,250,0.15)",
                              borderRadius:8, padding:"10px 12px" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                              <span style={{ fontSize:13, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#a78bfa" }}>
                                {p.ticker}
                              </span>
                              <span style={{ fontSize:11, fontWeight:700, color: rc }}>{p.cspScore}</span>
                            </div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", marginBottom:6, fontFamily:"'JetBrains Mono',monospace" }}>
                              ${p.price?.toFixed(2)} · RSI {p.rsi}
                              {p.hvRank != null && (
                                <span style={{ color: p.hvRank >= 45 && p.hvRank <= 82 ? "#22c55e" : p.hvRank >= 30 ? "#fbbf24" : "rgba(255,255,255,0.3)" }}>
                                  {" "}· IVR {Math.round(p.hvRank)}%
                                </span>
                              )}
                            </div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:5 }}>
                              {(p.cspSignals || []).slice(0, 3).map(sig => (
                                <span key={sig} style={{ fontSize:8, padding:"1px 5px", borderRadius:3,
                                  background:"rgba(167,139,250,0.08)", color:"rgba(167,139,250,0.65)",
                                  border:"1px solid rgba(167,139,250,0.12)", whiteSpace:"nowrap" }}>{sig}</span>
                              ))}
                            </div>
                            <div style={{ fontSize:8, fontWeight:700, color: rc, letterSpacing:"0.04em" }}>{p.cspRating}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {cspCcPicks && (
                    <p style={{ fontSize:8, color:"rgba(255,255,255,0.2)", fontStyle:"italic", marginTop:6 }}>
                      Score 0–100 · Click a ticker to add to watchlist · Auto-refreshed weekdays at 6 AM
                    </p>
                  )}
                </div>
              );
            })()}

            {optionPriceError && <p style={{ fontSize:10, color:"#ef4444", marginBottom:10 }}>⚠ {optionPriceError}</p>}

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(460px, 1fr))", gap:12 }}>
              {cspCandidates.map(r => {
                const strikes = r.price ? getStrikeSuggestions(r.price, "csp", 30, r.iv) : [];
                return (
                  <div key={r.ticker} className="card" style={{ padding:"14px 18px",
                    background:"rgba(167,139,250,0.03)", borderColor:"rgba(167,139,250,0.1)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                          <span style={{ fontSize:16, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#a78bfa" }}>
                            {r.ticker}
                          </span>
                          {r.fromWatchlist ? (
                            <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                              background:"rgba(251,191,36,0.08)", color:"#fbbf24",
                              border:"1px solid rgba(251,191,36,0.2)" }}>Watchlist</span>
                          ) : (
                            <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                              background:"rgba(167,139,250,0.1)", color:"rgba(167,139,250,0.7)",
                              border:"1px solid rgba(167,139,250,0.2)" }}>✓ Regime aligned</span>
                          )}
                          <button onClick={() => removeWatchlistTicker(r.ticker)}
                            style={{ display: r.fromWatchlist ? "inline" : "none",
                              background:"none", border:"none", color:"rgba(255,255,255,0.25)", cursor:"pointer", fontSize:11, padding:0 }}>
                            ×
                          </button>
                        </div>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{r.name} · {r.sector}</p>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.55)", lineHeight:1.5, marginTop:4, maxWidth:320 }}>
                          {r.thesis.length > 100 ? r.thesis.slice(0,100) + "…" : r.thesis}
                        </p>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <p style={{ fontSize:13, fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,0.7)", fontWeight:600 }}>
                          {r.price ? `$${fmt2(r.price)}` : "—"}
                        </p>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)" }}>Est. IV {Math.round(r.iv)}%</p>
                        <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, display:"inline-block", marginTop:3,
                          background: r.bestFor === "TFSA" ? "rgba(251,191,36,0.1)" : "rgba(34,211,238,0.1)",
                          color: r.bestFor === "TFSA" ? "#fbbf24" : "#22d3ee",
                          border:`1px solid ${r.bestFor === "TFSA" ? "rgba(251,191,36,0.25)" : "rgba(34,211,238,0.25)"}` }}>
                          {r.bestFor === "both" ? "TFSA / RRSP" : r.bestFor}
                        </span>
                      </div>
                    </div>

                    {r.price ? (
                      <>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
                          <thead>
                            <tr style={{ color:"rgba(255,255,255,0.3)", textAlign:"left" }}>
                              {(() => {
                                const onSort = col => setCspStrikeSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
                                const ts = { padding:"4px 6px", fontWeight:500, whiteSpace:"nowrap" };
                                return (<>
                                  <th style={ts}></th>
                                  <SortTh col="strike"     label="Strike"        sort={cspStrikeSort} onSort={onSort} style={ts} />
                                  <SortTh col="pct"        label="OTM %"         sort={cspStrikeSort} onSort={onSort} style={ts} />
                                  <SortTh col="premium"    label="Premium/sh"    sort={cspStrikeSort} onSort={onSort} style={ts} />
                                  <SortTh col="collateral" label="Collateral"    sort={cspStrikeSort} onSort={onSort} style={ts} />
                                  <SortTh col="monthly"    label="Monthly yield" sort={cspStrikeSort} onSort={onSort} style={ts} />
                                  <SortTh col="annual"     label="Ann. yield"    sort={cspStrikeSort} onSort={onSort} style={ts} />
                                  <th style={ts}>Action</th>
                                </>);
                              })()}
                            </tr>
                          </thead>
                          <tbody>
                            {sortRows(strikes, cspStrikeSort.col, cspStrikeSort.dir, (s, col) => ({
                              strike: s.strike, pct: s.pct, premium: s.premiumPerShare,
                              collateral: s.strike * 100, monthly: parseFloat(s.monthlyYield),
                              annual: parseFloat(s.annualYield),
                            }[col] ?? null)).map(s => (
                              <tr key={s.label} style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                                <td style={{ padding:"5px 6px", fontSize:9, color:"rgba(255,255,255,0.4)", fontWeight:600 }}>{s.label}</td>
                                <td style={{ padding:"5px 6px", fontFamily:"'JetBrains Mono',monospace", color:"#a78bfa", fontWeight:700 }}>${s.strike}</td>
                                <td style={{ padding:"5px 6px", color:"rgba(255,255,255,0.4)" }}>-{s.pct}%</td>
                                <td style={{ padding:"5px 6px", fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>${fmt2(s.premiumPerShare)}</td>
                                <td style={{ padding:"5px 6px", fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,0.5)" }}>{fmtK(s.strike * 100)}</td>
                                <td style={{ padding:"5px 6px", color:"#fbbf24", fontWeight:600 }}>{s.monthlyYield}%</td>
                                <td style={{ padding:"5px 6px", color:"#a78bfa", fontWeight:600 }}>{s.annualYield}%</td>
                                <td style={{ padding:"5px 6px" }}>
                                  <button className="btn" onClick={() => setOptionNewTrade({
                                    ...DEFAULT_OPT_TRADE, type:"csp", ticker:r.ticker, account: r.bestFor === "RRSP" ? "RRSP" : "TFSA",
                                    contracts:1, strike: s.strike,
                                    expiry: new Date(Date.now() + 30*864e5).toISOString().split("T")[0],
                                    premium: s.premiumPerShare, underlyingPrice: r.price,
                                  })}
                                    style={{ fontSize:9, padding:"3px 9px", color:"#a78bfa",
                                      borderColor:"rgba(167,139,250,0.3)" }}>
                                    Log
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.2)", marginTop:5, fontStyle:"italic" }}>
                          ★ Estimated premiums — confirm with your broker. Collateral = strike × 100 per contract.
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontStyle:"italic" }}>Load live prices to see strike table.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

        // Sub-tab: Trade Log
        const renderTradeLog = () => {
          const today = new Date().toISOString().split("T")[0];
          const tradeColor = t => t.type === "cc" ? "#22d3ee" : "#a78bfa";
          const statusColor = s => s === "open" ? "#fbbf24" : ["expired","closed_profit","assigned"].includes(s) ? "#22c55e" : "#ef4444";

          const tradePnl = t => {
            const received = Number(t.premium) * 100 * Number(t.contracts);
            if (t.status === "open")         return { val: received, label:"Max", color:"#fbbf24" };
            if (t.status === "expired")      return { val: received, label:"Realized", color:"#22c55e" };
            if (t.status === "assigned")     return { val: received, label:"Premium kept", color:"#22c55e" };
            const closeAmt = (Number(t.closePrice)||0) * 100 * Number(t.contracts);
            if (t.status === "closed_profit") return { val: received - closeAmt, label:"Realized", color:"#22c55e" };
            return { val: -(closeAmt - received), label:"Loss",    color:"#ef4444" };
          };

          return (
            <div>
              {/* Summary stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:10, marginBottom:16 }}>
                {[
                  { label:"Total premium collected", value: `$${Math.round(totalPremiumCollected)}`, color:"#22c55e" },
                  { label:"Realized P&L",             value: `${realizedPnL >= 0 ? "+" : ""}$${Math.round(realizedPnL)}`, color: realizedPnL >= 0 ? "#22c55e" : "#ef4444" },
                  { label:"Open positions",           value: openTrades.length, color:"#fbbf24" },
                  { label:"Win rate",                 value: winRate != null ? `${winRate}%` : "—", color: winRate >= 70 ? "#22c55e" : winRate >= 50 ? "#fbbf24" : "#ef4444" },
                ].map(s => (
                  <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
                    borderRadius:8, padding:"10px 14px" }}>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{s.label}</p>
                    <p style={{ fontSize:18, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Log new trade button / form */}
              {optionNewTrade === null ? (
                <button className="btn btn-primary" onClick={() => setOptionNewTrade({ ...DEFAULT_OPT_TRADE })}
                  style={{ marginBottom:14, fontSize:11, padding:"7px 18px",
                    background:"rgba(34,197,94,0.1)", borderColor:"rgba(34,197,94,0.3)", color:"#22c55e" }}>
                  + Log new trade
                </button>
              ) : (
                <div className="card" style={{ marginBottom:14, padding:"16px 20px",
                  background:"rgba(34,197,94,0.03)", borderColor:"rgba(34,197,94,0.15)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <p style={{ fontSize:11, fontWeight:600, color:"#22c55e" }}>Log trade</p>
                    <button className="btn" onClick={() => setOptionNewTrade(null)}
                      style={{ fontSize:10, padding:"3px 9px", color:"rgba(255,255,255,0.35)" }}>✕</button>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:10, marginBottom:12 }}>
                    {[
                      { field:"type",           label:"Type",        type:"select",  opts:[["cc","Covered Call"],["csp","Cash-Secured Put"]] },
                      { field:"ticker",         label:"Ticker",      type:"text",    placeholder:"NVDA" },
                      { field:"account",        label:"Account",     type:"select",  opts: portfolios.map(p => [p, p]) },
                      { field:"contracts",      label:"Contracts",   type:"number",  placeholder:"1" },
                      { field:"strike",         label:"Strike ($)",  type:"number",  placeholder:"800" },
                      { field:"expiry",         label:"Expiry",      type:"date" },
                      { field:"premium",        label:"Premium/sh ($)", type:"number", placeholder:"5.20" },
                      { field:"underlyingPrice",label:"Stock price ($)",type:"number", placeholder:"750" },
                    ].map(({ field, label, type, opts, placeholder }) => (
                      <div key={field}>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginBottom:3, textTransform:"uppercase" }}>{label}</p>
                        {type === "select" ? (
                          <select value={optionNewTrade[field] || ""} onChange={e => setOptionNewTrade(t => ({ ...t, [field]: e.target.value }))}
                            style={{ width:"100%", fontSize:11, padding:"6px 8px", background:"rgba(255,255,255,0.05)",
                              border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, color:"rgba(255,255,255,0.7)" }}>
                            {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        ) : (
                          <input type={type} value={optionNewTrade[field] || ""} placeholder={placeholder}
                            onChange={e => setOptionNewTrade(t => ({ ...t, [field]: e.target.value }))}
                            style={{ width:"100%", fontSize:11, padding:"6px 8px", background:"rgba(255,255,255,0.05)",
                              border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, color:"rgba(255,255,255,0.7)",
                              boxSizing:"border-box" }} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginBottom:3, textTransform:"uppercase" }}>Notes</p>
                    <input type="text" value={optionNewTrade.notes || ""} placeholder="Optional — thesis, adjustment plan…"
                      onChange={e => setOptionNewTrade(t => ({ ...t, notes: e.target.value }))}
                      style={{ width:"100%", fontSize:11, padding:"6px 8px", background:"rgba(255,255,255,0.05)",
                        border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, color:"rgba(255,255,255,0.7)",
                        boxSizing:"border-box", marginBottom:10 }} />
                  </div>
                  {/* Preview P&L */}
                  {optionNewTrade.premium && optionNewTrade.contracts && (
                    <div style={{ display:"flex", gap:16, marginBottom:12, padding:"8px 12px",
                      background:"rgba(34,197,94,0.07)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:8 }}>
                      <div>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>Premium collected</p>
                        <p style={{ fontSize:14, color:"#22c55e", fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
                          ${Math.round(Number(optionNewTrade.premium) * 100 * Number(optionNewTrade.contracts))}
                        </p>
                      </div>
                      {optionNewTrade.strike && (
                        <div>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>
                            {optionNewTrade.type === "csp" ? "Collateral req." : "Breakeven"}
                          </p>
                          <p style={{ fontSize:14, color:"#fbbf24", fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
                            {optionNewTrade.type === "csp"
                              ? fmtK(Number(optionNewTrade.strike) * 100 * Number(optionNewTrade.contracts))
                              : `$${fmt2(Number(optionNewTrade.strike) + Number(optionNewTrade.premium))}`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <button className="btn btn-primary" onClick={() => addOptionTrade(optionNewTrade)}
                    disabled={!optionNewTrade.ticker || !optionNewTrade.strike || !optionNewTrade.premium || !optionNewTrade.expiry}
                    style={{ fontSize:11, padding:"7px 20px", background:"rgba(34,197,94,0.15)",
                      borderColor:"rgba(34,197,94,0.4)", color:"#22c55e",
                      opacity: (!optionNewTrade.ticker || !optionNewTrade.strike || !optionNewTrade.premium || !optionNewTrade.expiry) ? 0.4 : 1 }}>
                    Save trade
                  </button>
                </div>
              )}

              {/* Open positions */}
              {openTrades.length > 0 && (
                <div className="card" style={{ marginBottom:14, padding:"14px 18px" }}>
                  <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.6)", marginBottom:10 }}>Open positions</p>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
                      <thead>
                        <tr style={{ color:"rgba(255,255,255,0.3)", textAlign:"left" }}>
                          {(() => {
                            const onSort = col => setOpenTradeSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
                            const ts = { padding:"4px 8px", fontWeight:500, whiteSpace:"nowrap" };
                            return (<>
                              <SortTh col="type"      label="Type"       sort={openTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="ticker"    label="Ticker"     sort={openTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="account"   label="Acct"       sort={openTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="contracts" label="Contracts"  sort={openTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="strike"    label="Strike"     sort={openTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="expiry"    label="Expiry"     sort={openTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="premium"   label="Premium/sh" sort={openTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="maxPnl"    label="Max P&L"    sort={openTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="dte"       label="DTE"        sort={openTradeSort} onSort={onSort} style={ts} />
                              <th style={ts}>Action</th>
                            </>);
                          })()}
                        </tr>
                      </thead>
                      <tbody>
                        {sortRows(openTrades, openTradeSort.col, openTradeSort.dir, (t, col) => {
                          const received = Number(t.premium) * 100 * Number(t.contracts);
                          return ({
                            type: t.type, ticker: t.ticker, account: t.account,
                            contracts: Number(t.contracts), strike: Number(t.strike),
                            expiry: t.expiry, premium: Number(t.premium), maxPnl: received,
                            dte: Math.ceil((new Date(t.expiry) - new Date()) / 864e5),
                          }[col] ?? null);
                        }).map(t => {
                          const dte = Math.ceil((new Date(t.expiry) - new Date()) / 864e5);
                          const pnl = tradePnl(t);
                          return (
                            <tr key={t.id} style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                              <td style={{ padding:"7px 8px" }}>
                                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, fontWeight:600,
                                  background:`${tradeColor(t)}15`, color: tradeColor(t),
                                  border:`1px solid ${tradeColor(t)}35` }}>
                                  {t.type === "cc" ? "CC" : "CSP"}
                                </span>
                              </td>
                              <td style={{ padding:"7px 8px", fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:"rgba(255,255,255,0.8)" }}>{t.ticker}</td>
                              <td style={{ padding:"7px 8px", color:"rgba(255,255,255,0.4)" }}>{t.account}</td>
                              <td style={{ padding:"7px 8px", textAlign:"center", color:"rgba(255,255,255,0.6)" }}>{t.contracts}</td>
                              <td style={{ padding:"7px 8px", fontFamily:"'JetBrains Mono',monospace", color: tradeColor(t) }}>${t.strike}</td>
                              <td style={{ padding:"7px 8px", color:"rgba(255,255,255,0.5)" }}>{t.expiry}</td>
                              <td style={{ padding:"7px 8px", fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>${fmt2(t.premium)}</td>
                              <td style={{ padding:"7px 8px", fontFamily:"'JetBrains Mono',monospace", color: pnl.color, fontWeight:700 }}>${Math.round(pnl.val)}</td>
                              <td style={{ padding:"7px 8px", color: dte <= 7 ? "#ef4444" : dte <= 14 ? "#fbbf24" : "rgba(255,255,255,0.5)", fontWeight: dte <= 7 ? 700 : 400 }}>{dte}d</td>
                              <td style={{ padding:"7px 8px" }}>
                                {optionClosing?.id === t.id ? (
                                  <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
                                    <input type="number" placeholder="Close $" value={optionClosing.closePrice || ""}
                                      onChange={e => setOptionClosing(c => ({ ...c, closePrice: e.target.value }))}
                                      style={{ width:68, fontSize:10, padding:"3px 6px" }} />
                                    {[["expired","Expired"],["closed_profit","Profit"],["closed_loss","Loss"],["assigned","Assigned"]].map(([s,l]) => (
                                      <button key={s} className="btn" onClick={() => closeOptionTrade(t.id, s, optionClosing.closePrice)}
                                        style={{ fontSize:9, padding:"3px 7px", color: statusColor(s),
                                          borderColor:`${statusColor(s)}40` }}>{l}</button>
                                    ))}
                                    <button className="btn" onClick={() => setOptionClosing(null)}
                                      style={{ fontSize:9, padding:"3px 7px" }}>✕</button>
                                  </div>
                                ) : (
                                  <div style={{ display:"flex", gap:5 }}>
                                    <button className="btn" onClick={() => setOptionClosing({ id: t.id, closePrice: "" })}
                                      style={{ fontSize:9, padding:"3px 9px", color:"#fbbf24",
                                        borderColor:"rgba(251,191,36,0.3)" }}>Close</button>
                                    <button className="btn" onClick={() => deleteOptionTrade(t.id)}
                                      style={{ fontSize:9, padding:"3px 7px", color:"rgba(239,68,68,0.6)",
                                        borderColor:"rgba(239,68,68,0.2)" }}>✕</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Closed trades */}
              {closedTrades.length > 0 && (
                <div className="card" style={{ padding:"14px 18px" }}>
                  <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:10 }}>Trade history</p>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
                      <thead>
                        <tr style={{ color:"rgba(255,255,255,0.3)", textAlign:"left" }}>
                          {(() => {
                            const onSort = col => setClosedTradeSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
                            const ts = { padding:"4px 8px", fontWeight:500, whiteSpace:"nowrap" };
                            return (<>
                              <SortTh col="type"    label="Type"       sort={closedTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="ticker"  label="Ticker"     sort={closedTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="account" label="Acct"       sort={closedTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="strike"  label="Strike"     sort={closedTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="opened"  label="Opened"     sort={closedTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="closed"  label="Closed"     sort={closedTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="premium" label="Premium/sh" sort={closedTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="outcome" label="Outcome"    sort={closedTradeSort} onSort={onSort} style={ts} />
                              <SortTh col="pnl"     label="P&L"        sort={closedTradeSort} onSort={onSort} style={ts} />
                            </>);
                          })()}
                        </tr>
                      </thead>
                      <tbody>
                        {sortRows(closedTrades, closedTradeSort.col, closedTradeSort.dir, (t, col) => {
                          const received = Number(t.premium) * 100 * Number(t.contracts);
                          const closeAmt = (Number(t.closePrice) || 0) * 100 * Number(t.contracts);
                          const pnlVal = t.status === "closed_loss" ? -(closeAmt - received) : received - closeAmt;
                          return ({
                            type: t.type, ticker: t.ticker, account: t.account,
                            strike: Number(t.strike), opened: t.openedAt, closed: t.closedAt || "",
                            premium: Number(t.premium), outcome: t.status, pnl: pnlVal,
                          }[col] ?? null);
                        }).map(t => {
                          const pnl = tradePnl(t);
                          return (
                            <tr key={t.id} style={{ borderTop:"1px solid rgba(255,255,255,0.05)", opacity:0.75 }}>
                              <td style={{ padding:"6px 8px" }}>
                                <span style={{ fontSize:9, padding:"2px 5px", borderRadius:4, fontWeight:600,
                                  background:`${tradeColor(t)}12`, color: tradeColor(t) }}>
                                  {t.type === "cc" ? "CC" : "CSP"}
                                </span>
                              </td>
                              <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,0.6)" }}>{t.ticker}</td>
                              <td style={{ padding:"6px 8px", color:"rgba(255,255,255,0.35)" }}>{t.account}</td>
                              <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,0.5)" }}>${t.strike}</td>
                              <td style={{ padding:"6px 8px", color:"rgba(255,255,255,0.35)" }}>{t.openedAt}</td>
                              <td style={{ padding:"6px 8px", color:"rgba(255,255,255,0.35)" }}>{t.closedAt || "—"}</td>
                              <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>${fmt2(t.premium)}</td>
                              <td style={{ padding:"6px 8px" }}>
                                <span style={{ fontSize:9, color: statusColor(t.status) }}>{OPT_STATUS_LABELS[t.status]}</span>
                              </td>
                              <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace",
                                color: pnl.color, fontWeight:600 }}>
                                {pnl.val >= 0 ? "+" : ""}${Math.round(pnl.val)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {optionTrades.length === 0 && (
                <div className="card" style={{ textAlign:"center", padding:"40px 20px" }}>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:6 }}>No trades logged yet.</p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>Use the Covered Calls or CSP tabs to find setups, then click "Log" to track them here.</p>
                </div>
              )}
            </div>
          );
        };

        // Sub-tab: Spread Scanner
        const renderSpreadScanner = () => {
          const ss = spreadSignals;
          const signals = ss?.signals || [];

          const recColors = {
            "Bull Put Spread":  { bg:"rgba(34,197,94,0.10)",  border:"rgba(34,197,94,0.28)",  text:"#22c55e" },
            "Bear Call Spread": { bg:"rgba(239,68,68,0.10)",  border:"rgba(239,68,68,0.28)",  text:"#ef4444" },
            "Iron Condor":      { bg:"rgba(167,139,250,0.10)",border:"rgba(167,139,250,0.28)",text:"#a78bfa" },
            "Caution":          { bg:"rgba(251,191,36,0.08)", border:"rgba(251,191,36,0.25)", text:"#fbbf24" },
            "Skip":             { bg:"rgba(255,255,255,0.02)",border:"rgba(255,255,255,0.08)",text:"rgba(255,255,255,0.3)" },
          };
          const dirIcon = { bullish:"▲", bearish:"▼", neutral:"◈" };
          const dirColor= { bullish:"#22c55e", bearish:"#ef4444", neutral:"rgba(255,255,255,0.35)" };

          const ScoreBar = ({ score }) => {
            const color = score >= 65 ? "#22c55e" : score >= 48 ? "#fbbf24" : "#ef4444";
            return (
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ flex:1, height:4, borderRadius:2, background:"rgba(255,255,255,0.07)" }}>
                  <div style={{ width:`${score}%`, height:"100%", borderRadius:2, background:color, transition:"width 0.3s" }} />
                </div>
                <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color, minWidth:24, textAlign:"right" }}>{score}</span>
              </div>
            );
          };

          const Pill = ({ value, neutral, good, bad }) => {
            const v = parseFloat(value);
            const color = isNaN(v) ? "rgba(255,255,255,0.3)"
              : v >= good ? "#22c55e"
              : v <= bad  ? "#ef4444"
              : "#fbbf24";
            return (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                color, fontWeight:600 }}>{value ?? "—"}</span>
            );
          };

          // ── Payoff Diagram component ──────────────────────────────────────────
          const PayoffDiagram = ({ setup, currentPrice, ticker }) => {
            if (!setup?.strikesRaw) return null;
            const W = 400, H = 96;
            const pad = { l: 38, r: 6, t: 6, b: 22 };
            const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
            const { type, strikesRaw, creditEst, maxLoss, breakEvenNums } = setup;
            const { longPut = 0, shortPut = 0, shortCall = 0, longCall = 0 } = strikesRaw;
            const pMin = Math.min(longPut || currentPrice * 0.82, currentPrice * 0.82);
            const pMax = Math.max(longCall || currentPrice * 1.18, currentPrice * 1.18);
            const xS = (p) => pad.l + ((p - pMin) / (pMax - pMin)) * iW;
            const yPad = Math.max(creditEst, maxLoss) * 0.18;
            const yMin = -(maxLoss + yPad), yMax = creditEst + yPad;
            const yR = yMax - yMin;
            const yS = (v) => pad.t + ((yMax - v) / yR) * iH;
            const y0 = yS(0);
            const payoff = (p) => {
              if (type === "bull_put") {
                if (p <= longPut)  return -maxLoss;
                if (p >= shortPut) return creditEst;
                return -maxLoss + (p - longPut) * (creditEst + maxLoss) / (shortPut - longPut);
              }
              if (type === "bear_call") {
                if (p <= shortCall) return creditEst;
                if (p >= longCall)  return -maxLoss;
                return creditEst - (p - shortCall) * (creditEst + maxLoss) / (longCall - shortCall);
              }
              if (type === "iron_condor") {
                if (p <= longPut)   return -maxLoss;
                if (p <= shortPut)  return -maxLoss + (p - longPut)  * (creditEst + maxLoss) / (shortPut - longPut);
                if (p <= shortCall) return creditEst;
                if (p <= longCall)  return creditEst - (p - shortCall) * (creditEst + maxLoss) / (longCall - shortCall);
                return -maxLoss;
              }
              return 0;
            };
            const N = 80;
            const pts = Array.from({ length: N + 1 }, (_, i) => {
              const p = pMin + (pMax - pMin) * i / N;
              return { x: xS(p), y: yS(payoff(p)) };
            });
            const poly = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
            const closePoly = (toY) => `${poly} ${(pad.l + iW).toFixed(1)},${toY.toFixed(1)} ${pad.l.toFixed(1)},${toY.toFixed(1)}`;
            const uid = (ticker || "").replace(/[^a-z0-9]/gi, "");
            const fmtY = (v) => Math.abs(v) >= 10 ? `$${Math.round(v)}` : `$${v.toFixed(1)}`;
            const fmtX = (v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${Math.round(v)}`;
            const keyStrikes = [longPut, shortPut, shortCall, longCall].filter(Boolean);
            return (
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto", display:"block", overflow:"visible" }}>
                <defs>
                  <clipPath id={`gain-${uid}`}>
                    <rect x={pad.l} y={pad.t} width={iW} height={Math.max(0, y0 - pad.t)} />
                  </clipPath>
                  <clipPath id={`loss-${uid}`}>
                    <rect x={pad.l} y={y0} width={iW} height={Math.max(0, H - pad.b - y0)} />
                  </clipPath>
                </defs>
                {/* Background */}
                <rect x={pad.l} y={pad.t} width={iW} height={iH} fill="rgba(0,0,0,0.25)" rx={3} />
                {/* Profit fill (clipped to above y=0) */}
                <polygon points={closePoly(y0)} fill="rgba(34,197,94,0.22)" clipPath={`url(#gain-${uid})`} />
                {/* Loss fill (clipped to below y=0) */}
                <polygon points={closePoly(H - pad.b)} fill="rgba(239,68,68,0.22)" clipPath={`url(#loss-${uid})`} />
                {/* Zero line */}
                <line x1={pad.l} y1={y0} x2={pad.l + iW} y2={y0} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
                {/* Payoff curve */}
                <polyline points={poly} fill="none" stroke="#f1f5f9" strokeWidth={1.8} />
                {/* Current price dashed line */}
                <line x1={xS(currentPrice)} y1={pad.t} x2={xS(currentPrice)} y2={H - pad.b}
                  stroke="#fbbf24" strokeWidth={1} strokeDasharray="3,2.5" />
                {/* Break-even dots */}
                {(breakEvenNums || []).map((be, i) => (
                  <circle key={i} cx={xS(be)} cy={y0} r={3.5} fill="#fbbf24" stroke="rgba(0,0,0,0.5)" strokeWidth={1} />
                ))}
                {/* Y axis labels */}
                <text x={pad.l - 4} y={yS(creditEst) + 3.5} textAnchor="end" fontSize={8} fill="#22c55e" fontFamily="monospace">
                  +{fmtY(creditEst)}
                </text>
                <text x={pad.l - 4} y={yS(-maxLoss) + 3.5} textAnchor="end" fontSize={8} fill="#ef4444" fontFamily="monospace">
                  -{fmtY(maxLoss)}
                </text>
                <text x={pad.l - 4} y={y0 + 3.5} textAnchor="end" fontSize={7} fill="rgba(255,255,255,0.25)" fontFamily="monospace">0</text>
                {/* X axis: key strikes */}
                {keyStrikes.map((k, i) => {
                  const x = xS(k);
                  if (x < pad.l + 4 || x > pad.l + iW - 4) return null;
                  return (
                    <g key={i}>
                      <line x1={x} y1={pad.t} x2={x} y2={H - pad.b} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
                      <text x={x} y={H - pad.b + 11} textAnchor="middle" fontSize={7.5}
                        fill="rgba(255,255,255,0.35)" fontFamily="monospace">
                        ${fmtX(k)}
                      </text>
                    </g>
                  );
                })}
                {/* "Now" label */}
                <text x={xS(currentPrice)} y={pad.t + 9} textAnchor="middle" fontSize={7.5} fill="#fbbf24" fontFamily="monospace">
                  now
                </text>
                {/* Corner labels */}
                <text x={pad.l + iW - 2} y={pad.t + 9} textAnchor="end" fontSize={7} fill="rgba(34,197,94,0.6)">MAX GAIN</text>
                <text x={pad.l + iW - 2} y={H - pad.b - 3} textAnchor="end" fontSize={7} fill="rgba(239,68,68,0.6)">MAX LOSS</text>
              </svg>
            );
          };

          const isScanning = !!spreadScanProgress;
          const scanDisabled = isScanning || spreadSignalsLoading;

          return (
            <div>
              {/* Header row */}
              <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:240 }}>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.6, margin:0 }}>
                    Scores {signals.length || SPREAD_SCAN_TICKERS.length}+ liquid tickers on <strong style={{ color:"rgba(255,255,255,0.6)" }}>8 signals</strong>: Volume, RSI, MACD, SMA 50/200, VWAP, ATR%, HV20, Bollinger Bands.
                    Higher score = better conditions for vertical spreads.
                    Cron auto-refresh runs daily at <strong style={{ color:"rgba(255,255,255,0.6)" }}>5:30 PM ET (after close)</strong>.
                  </p>
                  {/* Source + timestamp row */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4, flexWrap:"wrap" }}>
                    {ss?.lastUpdated && (
                      <p style={{ fontSize:9, color:"rgba(255,255,255,0.2)", margin:0 }}>
                        {ss.source === "live" ? "Live scan" : "Server cache"} · {new Date(ss.lastUpdated).toLocaleString()}
                      </p>
                    )}
                    {ss?.source === "live" && (
                      <span style={{ fontSize:8, padding:"1px 6px", borderRadius:10,
                        background:"rgba(34,197,94,0.12)", color:"#22c55e",
                        border:"1px solid rgba(34,197,94,0.28)" }}>● Live</span>
                    )}
                    {ss?.source !== "live" && ss?.lastUpdated && (
                      <span style={{ fontSize:8, padding:"1px 6px", borderRadius:10,
                        background:"rgba(34,211,238,0.08)", color:"#22d3ee",
                        border:"1px solid rgba(34,211,238,0.2)" }}>Scheduled</span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
                  {/* Primary: Scan Now */}
                  <button
                    className="btn btn-primary"
                    onClick={isScanning ? () => {
                      spreadScanAbortRef.current?.abort();
                      setSpreadScanProgress(null);
                    } : runManualSpreadScan}
                    disabled={spreadSignalsLoading}
                    style={{ fontSize:11, padding:"7px 16px", whiteSpace:"nowrap",
                      background: isScanning ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                      borderColor: isScanning ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)",
                      color: isScanning ? "#ef4444" : "#22c55e" }}>
                    {isScanning
                      ? `⏹ Cancel (${spreadScanProgress.done}/${spreadScanProgress.total})`
                      : "🔍 Scan Now"}
                  </button>
                  {/* Secondary: load server cache */}
                  <button
                    className="btn"
                    onClick={refreshSpreadSignals}
                    disabled={scanDisabled}
                    style={{ fontSize:10, padding:"5px 12px", whiteSpace:"nowrap",
                      background:"rgba(34,211,238,0.06)", borderColor:"rgba(34,211,238,0.2)",
                      color:"rgba(34,211,238,0.6)", opacity: scanDisabled ? 0.5 : 1 }}>
                    {spreadSignalsLoading ? "⏳ Loading…" : "⟳ Load cache"}
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {isScanning && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>
                      Scanning{spreadScanProgress.ticker ? ` ${spreadScanProgress.ticker}` : ""}…
                    </span>
                    <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>
                      {spreadScanProgress.done} / {spreadScanProgress.total}
                    </span>
                  </div>
                  <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.07)" }}>
                    <div style={{
                      height:"100%", borderRadius:2, background:"#22c55e",
                      width:`${(spreadScanProgress.done / spreadScanProgress.total) * 100}%`,
                      transition:"width 0.4s ease",
                    }} />
                  </div>
                </div>
              )}

              {spreadSignalsError && (
                <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.08)",
                  border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, marginBottom:12,
                  fontSize:11, color:"#ef4444" }}>
                  ⚠ {spreadSignalsError}
                </div>
              )}

              {/* Legend */}
              {signals.length > 0 && (
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 }}>
                  {Object.entries(recColors).map(([label, c]) => (
                    <span key={label} style={{ fontSize:9, padding:"2px 9px", borderRadius:20,
                      background:c.bg, border:`1px solid ${c.border}`, color:c.text }}>
                      {label}
                    </span>
                  ))}
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", alignSelf:"center", marginLeft:4 }}>
                    Score ≥65 = tradeable · 48–65 = caution · &lt;48 = skip
                  </span>
                </div>
              )}

              {/* Empty state */}
              {!signals.length && !isScanning && !spreadSignalsLoading && (
                <div className="card" style={{ textAlign:"center", padding:"48px 24px" }}>
                  <p style={{ fontSize:28, marginBottom:10 }}>📊</p>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>No scan data yet</p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", maxWidth:380, margin:"0 auto 16px" }}>
                    Run a fresh scan now, or wait for the automatic daily refresh at 5:30 PM ET (after close).
                  </p>
                  <button className="btn btn-primary" onClick={runManualSpreadScan}
                    style={{ fontSize:11, padding:"8px 20px",
                      background:"rgba(34,197,94,0.12)", borderColor:"rgba(34,197,94,0.35)", color:"#22c55e" }}>
                    🔍 Scan Now
                  </button>
                </div>
              )}

              {/* Signal cards grid */}
              {signals.length > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(380px, 1fr))", gap:10 }}>
                  {signals.map(s => {
                    const rc = recColors[s.recommendation] || recColors["Skip"];
                    const priceVsSma50   = s.sma50  ? ((s.price - s.sma50)  / s.sma50  * 100).toFixed(1) : null;
                    const priceVsSma200  = s.sma200 ? ((s.price - s.sma200) / s.sma200 * 100).toFixed(1) : null;
                    const priceVsVwap    = s.vwap   ? ((s.price - s.vwap)   / s.vwap   * 100).toFixed(1) : null;
                    const macdBullish    = s.macd?.histogram > 0;
                    const goldenCross    = s.sma50 && s.sma200 && s.sma50 > s.sma200;
                    const deathCross     = s.sma50 && s.sma200 && s.sma50 < s.sma200;

                    const tradeSetup = buildTradeSetup(s);

                    return (
                      <div key={s.ticker} className="card" style={{ padding:"14px 16px",
                        background:rc.bg, border:`1px solid ${rc.border}` }}>

                        {/* Top row: ticker + score bar */}
                        <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:10 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                              <span style={{ fontSize:16, fontWeight:800, fontFamily:"'JetBrains Mono',monospace",
                                color:"#f1f5f9" }}>{s.ticker}</span>
                              {/* Direction indicator */}
                              <span style={{ fontSize:11, color: dirColor[s.direction] }}>
                                {dirIcon[s.direction]}
                              </span>
                              {/* Recommendation badge */}
                              <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:4,
                                background:rc.bg, color:rc.text, border:`1px solid ${rc.border}`,
                                textTransform:"uppercase", letterSpacing:"0.04em" }}>
                                {s.recommendation}
                              </span>
                              {/* Golden / Death cross */}
                              {goldenCross && (
                                <span style={{ fontSize:8, padding:"1px 5px", borderRadius:3,
                                  background:"rgba(251,191,36,0.12)", color:"#fbbf24",
                                  border:"1px solid rgba(251,191,36,0.28)" }}>Golden ✕</span>
                              )}
                              {deathCross && (
                                <span style={{ fontSize:8, padding:"1px 5px", borderRadius:3,
                                  background:"rgba(239,68,68,0.08)", color:"#ef4444",
                                  border:"1px solid rgba(239,68,68,0.2)" }}>Death ✕</span>
                              )}
                            </div>
                            {/* Price line */}
                            <div style={{ display:"flex", alignItems:"baseline", gap:6, marginTop:3 }}>
                              <span style={{ fontSize:13, fontFamily:"'JetBrains Mono',monospace",
                                color:"rgba(255,255,255,0.8)", fontWeight:600 }}>
                                ${s.price?.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })}
                              </span>
                              <span style={{ fontSize:10, color: s.priceChangePct >= 0 ? "#22c55e" : "#ef4444" }}>
                                {s.priceChangePct >= 0 ? "+" : ""}{s.priceChangePct}%
                              </span>
                            </div>
                          </div>
                          {/* Score bar (right side) */}
                          <div style={{ width:100 }}>
                            <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:3, textAlign:"right" }}>
                              SPREAD SCORE
                            </p>
                            <ScoreBar score={s.score} />
                          </div>
                        </div>

                        {/* Signal consensus bar */}
                        {(s.bull != null || s.bear != null) && (() => {
                          const b = s.bull || 0, br = s.bear || 0, total = b + br;
                          const bullPct = total > 0 ? Math.round((b / total) * 100) : 50;
                          const dir = b > br + 2 ? "bullish" : br > b + 2 ? "bearish" : "neutral";
                          const barColor = dir === "bullish" ? "#22c55e" : dir === "bearish" ? "#ef4444" : "#a78bfa";
                          return (
                            <div style={{ marginBottom:8, padding:"5px 8px", borderRadius:5,
                              background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                                <span style={{ fontSize:8, color:"rgba(255,255,255,0.3)" }}>SIGNAL CONSENSUS</span>
                                <span style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace",
                                  color:"rgba(255,255,255,0.4)" }}>
                                  <span style={{ color:"#22c55e" }}>{b}↑</span>
                                  {" · "}
                                  <span style={{ color:"#ef4444" }}>{br}↓</span>
                                </span>
                              </div>
                              <div style={{ height:3, borderRadius:2, background:"rgba(239,68,68,0.3)" }}>
                                <div style={{ width:`${bullPct}%`, height:"100%", borderRadius:2,
                                  background: barColor, transition:"width 0.3s" }} />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Signal grid */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px 10px" }}>

                          {/* Volume */}
                          <div>
                            <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>VOLUME RATIO</p>
                            <Pill value={`${s.volumeRatio}×`}
                              good={1.5} bad={0.7}
                              neutral />
                            <p style={{ fontSize:8, color:"rgba(255,255,255,0.2)", marginTop:1 }}>
                              vs 20d avg
                            </p>
                          </div>

                          {/* VWAP */}
                          <div>
                            <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>VWAP (20d)</p>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                              color:"rgba(255,255,255,0.65)" }}>
                              {s.vwap ? `$${s.vwap.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : "—"}
                            </span>
                            {priceVsVwap != null && (
                              <p style={{ fontSize:8, color: parseFloat(priceVsVwap) >= 0 ? "#22c55e" : "#ef4444",
                                marginTop:1 }}>
                                {parseFloat(priceVsVwap) >= 0 ? "+" : ""}{priceVsVwap}% vs VWAP
                              </p>
                            )}
                          </div>

                          {/* RSI */}
                          <div>
                            <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>RSI (14)</p>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700,
                              color: s.rsi == null ? "rgba(255,255,255,0.3)"
                                   : s.rsi < 30    ? "#ef4444"
                                   : s.rsi > 70    ? "#ef4444"
                                   : s.rsi < 40    ? "#fbbf24"
                                   : s.rsi > 60    ? "#fbbf24"
                                   : "#22c55e" }}>
                              {s.rsi ?? "—"}
                            </span>
                            <p style={{ fontSize:8, color:"rgba(255,255,255,0.2)", marginTop:1 }}>
                              {s.rsi == null ? "" : s.rsi < 30 ? "Oversold ⚠" : s.rsi > 70 ? "Overbought ⚠" : "Neutral zone"}
                            </p>
                          </div>

                          {/* SMA 50 */}
                          <div>
                            <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>SMA 50</p>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                              color:"rgba(255,255,255,0.65)" }}>
                              {s.sma50 ? `$${s.sma50.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : "—"}
                            </span>
                            {priceVsSma50 != null && (
                              <p style={{ fontSize:8, color: parseFloat(priceVsSma50) >= 0 ? "#22c55e" : "#ef4444",
                                marginTop:1 }}>
                                {parseFloat(priceVsSma50) >= 0 ? "↑" : "↓"} {Math.abs(priceVsSma50)}% {parseFloat(priceVsSma50) >= 0 ? "above" : "below"}
                              </p>
                            )}
                          </div>

                          {/* SMA 200 */}
                          <div>
                            <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>SMA 200</p>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                              color:"rgba(255,255,255,0.65)" }}>
                              {s.sma200 ? `$${s.sma200.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : "—"}
                            </span>
                            {priceVsSma200 != null && (
                              <p style={{ fontSize:8, color: parseFloat(priceVsSma200) >= 0 ? "#22c55e" : "#ef4444",
                                marginTop:1 }}>
                                {parseFloat(priceVsSma200) >= 0 ? "↑" : "↓"} {Math.abs(priceVsSma200)}% {parseFloat(priceVsSma200) >= 0 ? "above" : "below"}
                              </p>
                            )}
                          </div>

                          {/* MACD */}
                          <div>
                            <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>MACD</p>
                            {s.macd ? (
                              <>
                                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                                  color: macdBullish ? "#22c55e" : "#ef4444", fontWeight:600 }}>
                                  {macdBullish ? "▲" : "▼"} {s.macd.histogram > 0 ? "+" : ""}{s.macd.histogram}
                                </span>
                                <p style={{ fontSize:8, color:"rgba(255,255,255,0.2)", marginTop:1 }}>
                                  {macdBullish ? "Bullish momentum" : "Bearish momentum"}
                                </p>
                              </>
                            ) : (
                              <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>—</span>
                            )}
                          </div>

                          {/* ATR% */}
                          <div>
                            <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>ATR% (14d)</p>
                            {s.atrPct != null ? (
                              <>
                                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:600,
                                  color: s.atrPct < 2.5 ? "#22c55e" : s.atrPct < 4.0 ? "#fbbf24" : "#ef4444" }}>
                                  {s.atrPct}%
                                </span>
                                <p style={{ fontSize:8, color:"rgba(255,255,255,0.2)", marginTop:1 }}>
                                  {s.atrPct < 1.5 ? "Very stable ✓" : s.atrPct < 2.5 ? "Stable" : s.atrPct < 4.0 ? "Elevated" : "High vol ⚠"}
                                </p>
                              </>
                            ) : <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>—</span>}
                          </div>

                          {/* HV20 */}
                          <div>
                            <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>HV20 (ann.)</p>
                            {s.hvPct != null ? (
                              <>
                                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:600,
                                  color: s.hvPct >= 18 && s.hvPct <= 45 ? "#22c55e" : s.hvPct > 55 ? "#ef4444" : "#fbbf24" }}>
                                  {s.hvPct}%
                                </span>
                                <p style={{ fontSize:8, color:"rgba(255,255,255,0.2)", marginTop:1 }}>
                                  {s.hvPct >= 18 && s.hvPct <= 45 ? "Sweet spot ✓" : s.hvPct < 18 ? "Low premium" : "Rich vol ⚠"}
                                </p>
                              </>
                            ) : <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>—</span>}
                          </div>

                          {/* Bollinger Band position */}
                          <div>
                            <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>BB POSITION</p>
                            {s.bbPos != null ? (() => {
                              const pct = Math.round(s.bbPos * 100);
                              const label = s.bbPos < 0.20 ? "Near low ▲" : s.bbPos > 0.80 ? "Near high ▼" : "Mid-range ◈";
                              const color = s.bbPos < 0.20 ? "#22c55e" : s.bbPos > 0.80 ? "#ef4444" : "#a78bfa";
                              return (
                                <>
                                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                    <div style={{ flex:1, height:3, borderRadius:2, background:"rgba(255,255,255,0.07)" }}>
                                      <div style={{ width:`${pct}%`, height:"100%", borderRadius:2, background:color }} />
                                    </div>
                                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                                      color, minWidth:22, textAlign:"right" }}>{pct}%</span>
                                  </div>
                                  <p style={{ fontSize:8, color:"rgba(255,255,255,0.2)", marginTop:1 }}>{label}</p>
                                </>
                              );
                            })() : <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>—</span>}
                          </div>
                        </div>

                        {/* Trade Setup */}
                        {tradeSetup ? (
                          <div style={{ marginTop:12, paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
                            <p style={{ fontSize:8, fontWeight:700, letterSpacing:"0.08em",
                              color:"rgba(255,255,255,0.35)", marginBottom:8 }}>SUGGESTED TRADE</p>

                            {/* Legs */}
                            {(() => {
                              const LegRow = ({ leg }) => (
                                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                  <span style={{ fontSize:9, fontWeight:700, minWidth:28, padding:"1px 5px",
                                    borderRadius:3, textAlign:"center",
                                    background: leg.action === "SELL" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)",
                                    color:       leg.action === "SELL" ? "#22c55e" : "#ef4444",
                                    border:`1px solid ${leg.action === "SELL" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.25)"}` }}>
                                    {leg.action}
                                  </span>
                                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11,
                                    fontWeight:700, color:"#f1f5f9" }}>
                                    {leg.contract}
                                  </span>
                                </div>
                              );
                              if (tradeSetup.type === "iron_condor") {
                                return (
                                  <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
                                    <LegRow leg={tradeSetup.legs[0]} />
                                    <LegRow leg={tradeSetup.legs[1]} />
                                    <div style={{ borderTop:"1px dashed rgba(255,255,255,0.08)", margin:"2px 0" }} />
                                    <LegRow leg={tradeSetup.legs[2]} />
                                    <LegRow leg={tradeSetup.legs[3]} />
                                  </div>
                                );
                              }
                              return (
                                <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
                                  {tradeSetup.legs.map((leg, li) => <LegRow key={li} leg={leg} />)}
                                </div>
                              );
                            })()}

                            {/* Metrics row */}
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"5px 8px",
                              padding:"8px 10px", borderRadius:6, marginBottom:10,
                              background:"rgba(0,0,0,0.25)", border:"1px solid rgba(255,255,255,0.06)" }}>
                              <div>
                                <p style={{ fontSize:7, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>WIDTH</p>
                                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                                  color:"rgba(255,255,255,0.6)" }}>{tradeSetup.width}</span>
                              </div>
                              <div>
                                <p style={{ fontSize:7, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>CREDIT / CONTRACT</p>
                                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                                  fontWeight:700, color:"#22c55e" }}>
                                  ~${tradeSetup.creditEst}/sh
                                </span>
                                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                                  color:"rgba(34,197,94,0.6)", marginLeft:4 }}>
                                  (~${tradeSetup.creditPerContract})
                                </span>
                              </div>
                              <div>
                                <p style={{ fontSize:7, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>MAX LOSS / CONTRACT</p>
                                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                                  color:"#ef4444" }}>
                                  ${tradeSetup.maxLoss}/sh
                                </span>
                                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9,
                                  color:"rgba(239,68,68,0.6)", marginLeft:4 }}>
                                  (${tradeSetup.maxLossPerContract})
                                </span>
                              </div>
                              <div style={{ gridColumn:"1/-1", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                                <div>
                                  <p style={{ fontSize:7, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>BREAK-EVEN</p>
                                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                                    color:"#fbbf24" }}>{tradeSetup.breakEven}</span>
                                </div>
                                <div style={{ textAlign:"right" }}>
                                  <p style={{ fontSize:7, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>CREDIT-TO-WIDTH</p>
                                  {(() => {
                                    const widthNum = tradeSetup.maxLoss + tradeSetup.creditEst;
                                    const ratio = widthNum > 0 ? tradeSetup.creditEst / widthNum : 0;
                                    return (
                                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                                        color: ratio >= 0.25 ? "#22c55e" : "#fbbf24" }}>
                                        {(ratio * 100).toFixed(0)}%
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* Payoff diagram */}
                            <div style={{ marginBottom:10, borderRadius:6, overflow:"hidden",
                              border:"1px solid rgba(255,255,255,0.06)" }}>
                              <p style={{ fontSize:7, fontWeight:700, letterSpacing:"0.08em",
                                color:"rgba(255,255,255,0.25)", margin:0, padding:"4px 8px",
                                background:"rgba(0,0,0,0.2)" }}>
                                P&L AT EXPIRY (per share) · ●=break-even · ⋯=current price
                              </p>
                              <PayoffDiagram setup={tradeSetup} currentPrice={s.price} ticker={s.ticker} />
                            </div>

                            {/* Expiry + rationale */}
                            <div style={{ marginTop:6, display:"flex", flexWrap:"wrap",
                              justifyContent:"space-between", alignItems:"center", gap:4 }}>
                              <span style={{ fontSize:8, color:"rgba(255,255,255,0.25)" }}>
                                📅 {tradeSetup.expiry}
                              </span>
                              <span style={{ fontSize:8, color:"rgba(255,255,255,0.2)", maxWidth:220, textAlign:"right" }}>
                                {tradeSetup.rationale}
                              </span>
                            </div>

                            {/* 52w context */}
                            <p style={{ fontSize:7, color:"rgba(255,255,255,0.15)", marginTop:6 }}>
                              52w: ${s.low52w?.toFixed(2)} – ${s.high52w?.toFixed(2)} &nbsp;·&nbsp;
                              Credits are estimates; verify against live chain & IV.
                            </p>
                          </div>
                        ) : (
                          <div style={{ marginTop:10, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.05)",
                            display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:4 }}>
                            <span style={{ fontSize:8, color:"rgba(255,255,255,0.2)" }}>
                              52w: ${s.low52w?.toFixed(2)} – ${s.high52w?.toFixed(2)}
                            </span>
                            <span style={{ fontSize:8, color:"rgba(255,255,255,0.2)" }}>
                              {s.recommendation === "Caution" ? "Conditions borderline — wait for clearer setup" : "No trade setup — skip this ticker"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <p style={{ fontSize:9, color:"rgba(255,255,255,0.15)", marginTop:16, lineHeight:1.6 }}>
                Signals computed from 1-year daily OHLCV data (Yahoo Finance).
                Score combines: Volume ratio, RSI zone, MACD momentum, SMA 50/200 trend, VWAP proximity, ATR% (volatility), HV20 (realised vol), Bollinger Band position.
                ATR% &lt;2.5% = good for tight spreads · HV20 18–45% = premium-selling sweet spot · BB mid-range = Iron Condor territory.
                Not financial advice — always verify strikes, credits, and IV against your live broker chain before placing trades.
              </p>
            </div>
          );
        };

        // Sub-tab: AI Analysis
        const renderAIAnalysis = () => {
          const riskColor  = { Low:"#22c55e", Medium:"#fbbf24", High:"#ef4444" };
          const riskBg     = { Low:"rgba(34,197,94,0.12)", Medium:"rgba(251,191,36,0.12)", High:"rgba(239,68,68,0.12)" };
          const riskBorder = { Low:"rgba(34,197,94,0.25)", Medium:"rgba(251,191,36,0.25)", High:"rgba(239,68,68,0.25)" };
          const verdictColor = { Strong:"#22c55e", Consider:"#fbbf24", Skip:"rgba(255,255,255,0.35)" };
          const typeColor    = { cc:"#22d3ee", csp:"#a78bfa" };
          const typeBg      = { cc:"rgba(34,211,238,0.10)", csp:"rgba(167,139,250,0.10)" };
          const an = aiOptionsAnalysis;

          return (
            <div>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>
                    Claude analyses your holdings and cash to surface specific CC and CSP trades, rated by risk.
                    Load live prices first for best results.
                  </p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                  {licenseTier === "basic" ? (
                    <a href={LS_CHECKOUT_PRO} target="_blank" rel="noreferrer"
                      style={{ fontSize:11, padding:"7px 18px", borderRadius:8, textDecoration:"none",
                        display:"inline-flex", alignItems:"center", gap:5,
                        background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.35)",
                        color:"#fbbf24", fontWeight:600 }}>
                      🤖 AI Analysis — Pro only · Upgrade →
                    </a>
                  ) : (
                    <button className="btn btn-primary" onClick={fetchAIOptionsAnalysis}
                      disabled={aiOptionsLoading}
                      style={{ fontSize:11, padding:"7px 18px",
                        background:"rgba(167,139,250,0.15)", borderColor:"rgba(167,139,250,0.4)",
                        color:"#a78bfa", opacity: aiOptionsLoading ? 0.6 : 1 }}>
                      {aiOptionsLoading ? "⏳ Analysing…" : an ? "⟳ Regenerate" : "🤖 Generate Analysis"}
                    </button>
                  )}
                  {an?.generatedAt && (
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)" }}>
                      Last generated {new Date(an.generatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {aiOptionsError && (
                <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.08)",
                  border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, marginBottom:12,
                  fontSize:11, color:"#ef4444" }}>
                  ⚠ {aiOptionsError}
                </div>
              )}

              {!an && !aiOptionsLoading && (
                <div className="card" style={{ textAlign:"center", padding:"48px 24px" }}>
                  <p style={{ fontSize:28, marginBottom:10 }}>🤖</p>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>No analysis yet</p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", maxWidth:360, margin:"0 auto" }}>
                    Click "Generate Analysis" to have Claude evaluate your holdings and cash and recommend
                    specific CC and CSP trades rated Low / Medium / High risk.
                  </p>
                </div>
              )}

              {an && (
                <>
                  {/* Context pills + summary */}
                  <div className="card" style={{ padding:"14px 18px", marginBottom:14,
                    background:"rgba(167,139,250,0.05)", borderColor:"rgba(167,139,250,0.18)" }}>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
                      <span style={{ fontSize:10, padding:"2px 9px", borderRadius:20,
                        background:"rgba(167,139,250,0.12)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.3)" }}>
                        {an.regime}
                      </span>
                      <span style={{ fontSize:10, padding:"2px 9px", borderRadius:20,
                        background:"rgba(234,179,8,0.10)", color:"#fbbf24", border:"1px solid rgba(234,179,8,0.25)" }}>
                        VIX {an.vix}
                      </span>
                      <span style={{ fontSize:10, padding:"2px 9px", borderRadius:20,
                        background: an.riskScore >= 60 ? "rgba(34,197,94,0.1)" : an.riskScore >= 40 ? "rgba(234,179,8,0.1)" : "rgba(239,68,68,0.1)",
                        color:      an.riskScore >= 60 ? "#22c55e"             : an.riskScore >= 40 ? "#fbbf24"             : "#ef4444",
                        border:`1px solid ${an.riskScore >= 60 ? "rgba(34,197,94,0.25)" : an.riskScore >= 40 ? "rgba(234,179,8,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                        Risk score {an.riskScore}/100
                      </span>
                    </div>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.7)", lineHeight:1.65, margin:0 }}>
                      {an.summary}
                    </p>
                  </div>

                  {/* Trade cards */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(440px, 1fr))", gap:12 }}>
                    {(an.trades || []).map((tr, i) => {
                      const rc = riskColor[tr.risk]  || "#fbbf24";
                      const rb = riskBg[tr.risk]     || "rgba(251,191,36,0.08)";
                      const rbo= riskBorder[tr.risk] || "rgba(251,191,36,0.2)";
                      const tc = typeColor[tr.type]  || "#a78bfa";
                      const tb = typeBg[tr.type]     || "rgba(167,139,250,0.08)";
                      const vc = verdictColor[tr.verdict] || "#fbbf24";
                      const cashReq = tr.type === "csp"
                        ? `$${(tr.strike * 100 * (tr.contracts || 1)).toLocaleString()} collateral`
                        : null;

                      return (
                        <div key={i} className="card" style={{ padding:"16px 18px",
                          background: rb, border:`1px solid ${rbo}` }}>
                          {/* Card top row */}
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, flexWrap:"wrap" }}>
                            {/* Type badge */}
                            <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:4,
                              background: tb, color: tc, border:`1px solid ${tc}30`, textTransform:"uppercase" }}>
                              {tr.type === "cc" ? "CC" : "CSP"}
                            </span>
                            {/* Risk badge */}
                            <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:4,
                              background:"rgba(0,0,0,0.25)", color: rc, border:`1px solid ${rc}50` }}>
                              {tr.risk} Risk
                            </span>
                            {/* Verdict */}
                            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4,
                              background:"rgba(0,0,0,0.2)", color: vc }}>
                              {tr.verdict === "Strong" ? "✓ Strong" : tr.verdict === "Consider" ? "○ Consider" : "✕ Skip"}
                            </span>
                            <span style={{ flex:1 }} />
                            {/* Account chip */}
                            <span style={{ fontSize:9, padding:"1px 7px", borderRadius:3,
                              background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.45)",
                              border:"1px solid rgba(255,255,255,0.1)", letterSpacing:"0.04em" }}>
                              {tr.account}
                            </span>
                          </div>

                          {/* Ticker + name */}
                          <p style={{ fontSize:18, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                            color:"rgba(255,255,255,0.92)", marginBottom:2 }}>
                            {tr.ticker}
                          </p>
                          {tr.name && (
                            <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:10 }}>{tr.name}</p>
                          )}

                          {/* Strike / DTE / contracts grid */}
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:12 }}>
                            {[
                              ["Strike",    `$${tr.strike}`],
                              ["DTE",       `${tr.dte}d`],
                              ["Contracts", tr.contracts],
                              tr.type === "csp"
                                ? ["Collateral", cashReq]
                                : ["Yield/mo",   `${tr.monthlyYieldPct?.toFixed(1)}%`],
                            ].map(([label, val]) => (
                              <div key={label} style={{ textAlign:"center", padding:"6px 4px",
                                background:"rgba(0,0,0,0.18)", borderRadius:6, border:"1px solid rgba(255,255,255,0.06)" }}>
                                <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", textTransform:"uppercase",
                                  letterSpacing:"0.06em", marginBottom:2 }}>{label}</p>
                                <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.85)",
                                  fontFamily:"'JetBrains Mono',monospace" }}>{val}</p>
                              </div>
                            ))}
                          </div>

                          {/* Premium row */}
                          <div style={{ display:"flex", gap:16, marginBottom:12, padding:"8px 12px",
                            background:"rgba(34,197,94,0.06)", borderRadius:8, border:"1px solid rgba(34,197,94,0.12)" }}>
                            <div>
                              <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>Per share</p>
                              <p style={{ fontSize:14, fontWeight:700, color:"#22c55e",
                                fontFamily:"'JetBrains Mono',monospace" }}>
                                ${tr.premiumEst?.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>Per contract</p>
                              <p style={{ fontSize:14, fontWeight:700, color:"#22c55e",
                                fontFamily:"'JetBrains Mono',monospace" }}>
                                ${tr.contractPremium}
                              </p>
                            </div>
                            {tr.contracts > 1 && (
                              <div>
                                <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>Total est.</p>
                                <p style={{ fontSize:14, fontWeight:700, color:"#22c55e",
                                  fontFamily:"'JetBrains Mono',monospace" }}>
                                  ${(tr.contractPremium * tr.contracts).toLocaleString()}
                                </p>
                              </div>
                            )}
                            {tr.type === "cc" && tr.monthlyYieldPct && (
                              <div>
                                <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>Monthly yield</p>
                                <p style={{ fontSize:14, fontWeight:700, color:"#84cc16",
                                  fontFamily:"'JetBrains Mono',monospace" }}>
                                  {tr.monthlyYieldPct.toFixed(1)}%
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Rationale */}
                          <p style={{ fontSize:11, color:"rgba(255,255,255,0.6)", lineHeight:1.6, marginBottom:10 }}>
                            {tr.rationale}
                          </p>

                          {/* Risks */}
                          {tr.risks?.length > 0 && (
                            <div style={{ marginBottom:12 }}>
                              <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase",
                                letterSpacing:"0.06em", marginBottom:4 }}>Key risks</p>
                              <ul style={{ margin:0, paddingLeft:16 }}>
                                {tr.risks.map((r, ri) => (
                                  <li key={ri} style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginBottom:2 }}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Log Trade button */}
                          {tr.verdict !== "Skip" && (
                            <button
                              onClick={() => {
                                setOptionNewTrade({
                                  type:     tr.type,
                                  ticker:   tr.ticker,
                                  account:  tr.account,
                                  strike:   String(tr.strike),
                                  premium:  String(tr.premiumEst?.toFixed(2) || ""),
                                  contracts:String(tr.contracts || 1),
                                  dte:      String(tr.dte),
                                  expiry:   "",
                                  notes:    tr.rationale?.slice(0, 120) || "",
                                  status:   "open",
                                });
                                setOptionSubTab(tr.type === "cc" ? "cc" : "csp");
                              }}
                              style={{ width:"100%", padding:"7px 0", fontSize:11, fontWeight:600,
                                background:`${tc}18`, border:`1px solid ${tc}40`, borderRadius:7,
                                color: tc, cursor:"pointer", letterSpacing:"0.03em" }}>
                              ↗ Pre-fill in {tr.type === "cc" ? "Covered Calls" : "CSP"} tab
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        };

        return (
          <div style={{ padding:"22px 28px" }}>

            {/* ── IV environment + regime bias strip ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div className="card" style={{ padding:"12px 16px",
                background:`${ivEnv.color}08`, borderColor:`${ivEnv.color}20` }}>
                <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase",
                  letterSpacing:"0.06em", marginBottom:4 }}>IV Environment · VIX {vix.toFixed(1)}</p>
                <p style={{ fontSize:13, fontWeight:600, color: ivEnv.color }}>
                  {ivEnv.icon} {ivEnv.label}
                </p>
              </div>
              <div className="card" style={{ padding:"12px 16px",
                background:"rgba(167,139,250,0.03)", borderColor:"rgba(167,139,250,0.1)" }}>
                <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase",
                  letterSpacing:"0.06em", marginBottom:4 }}>Regime bias · {mp.regime?.label}</p>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", lineHeight:1.5 }}>{regimeBias}</p>
              </div>
            </div>

            {/* ── Sub-tab navigation ── */}
            <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
              {[
                ["cc",      "📞 Covered Calls"],
                ["csp",     "🛡 Cash-Secured Puts"],
                ["scanner", "📊 Spread Scanner"],
                ["trades",  "📋 Trade Log"],
                ["ai",      "🤖 AI Analysis"],
              ].map(([v,l]) => (
                <button key={v} className={`tab-btn ${optionSubTab===v?"on":""}`}
                  onClick={() => setOptionSubTab(v)}
                  style={{
                    padding:"6px 14px", fontSize:11,
                    ...(v === "ai" && optionSubTab !== "ai"
                      ? { borderColor:"rgba(167,139,250,0.35)", color:"rgba(167,139,250,0.8)" }
                      : {}),
                    ...(v === "scanner" && optionSubTab !== "scanner"
                      ? { borderColor:"rgba(34,211,238,0.3)", color:"rgba(34,211,238,0.8)" }
                      : {}),
                  }}>
                  {l}
                  {v === "scanner" && spreadSignals?.signals?.length > 0 && (
                    <span style={{ marginLeft:5, fontSize:8, padding:"1px 5px", borderRadius:10,
                      background:"rgba(34,211,238,0.15)", color:"#22d3ee",
                      border:"1px solid rgba(34,211,238,0.3)" }}>
                      {spreadSignals.signals.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {optionSubTab === "cc"      && renderCC()}
            {optionSubTab === "csp"     && renderCSP()}
            {optionSubTab === "scanner" && renderSpreadScanner()}
            {optionSubTab === "trades"  && renderTradeLog()}
            {optionSubTab === "ai"      && renderAIAnalysis()}

            <p style={{ fontSize:10, color:"rgba(255,255,255,0.15)", marginTop:20, lineHeight:1.6 }}>
              ⚠ Not financial advice. Premium estimates are mathematical approximations based on VIX-derived IV and are not live options quotes —
              always verify with your broker before trading. Options trading involves significant risk of loss and may not be suitable for all investors.
              Covered calls and CSPs in registered Canadian accounts (TFSA/RRSP) are generally permitted but rules vary by broker.
            </p>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: SCANNER
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "scanner" && (() => {
        // Universe-empty guard — happens when the daily GitHub Actions refresh
        // wrote an empty file (Yahoo Finance blocked). Show a clear error early
        // rather than letting the table silently appear empty.
        if (!stockUniverseData.stocks.length) {
          return (
            <div className="card" style={{ textAlign:"center", padding:"48px 24px", borderColor:"rgba(239,68,68,0.3)" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#fca5a5", marginBottom:8 }}>
                Stock universe is empty
              </div>
              <div style={{ fontSize:12, color:"#94a3b8", maxWidth:480, margin:"0 auto" }}>
                The daily data refresh wrote an empty file — Yahoo Finance likely blocked the run.
                Re-deploy or re-run <code style={{ color:"rgba(255,255,255,0.4)" }}>scripts/rebuild-universe.mjs</code> to restore the 97-stock baseline.
              </div>
            </div>
          );
        }

        // Merge live prices (from Scan Now) over the static JSON fundamentals
        const liveMap = stockScanResults
          ? Object.fromEntries(stockScanResults.stocks.map(r => [r.ticker, r.price]))
          : {};
        const STOCKS = stockUniverseData.stocks.map(s =>
          liveMap[s.ticker] != null ? { ...s, price: liveMap[s.ticker] } : s
        );
        const allSectors = ["all", ...Array.from(new Set(STOCKS.map(s => s.sector))).sort()];
        // f = committed scan criteria (only updated when "Run Scan" is clicked)
        const f = scanCommitted;

        // Build lookup for curated Ideas recommendations
        const REC_MAP = Object.fromEntries(RECOMMENDATIONS.map(r => [r.ticker, r]));

        // Build holding value map: ticker → total current $ across all portfolios
        const holdingValueMap = {};
        let totalHeldValue = 0;
        portfolios.forEach(p => {
          (holdings[p] || []).forEach(h => {
            if (h.current > 0) {
              holdingValueMap[h.ticker] = (holdingValueMap[h.ticker] || 0) + h.current;
              totalHeldValue += h.current;
            }
          });
        });

        // ── Main scan pass (uses committed filters) ──────────────────────────
        const scanned = STOCKS.filter(s => {
          if (f.ideasOnly && !REC_MAP[s.ticker]) return false;
          // Null-safe: treat null as "does not satisfy" any min/max numeric filter
          if (f.maxPe < 120 && (s.pe == null || s.pe > f.maxPe)) return false;
          if (f.maxPeg < 5  && (s.peg == null || s.peg > f.maxPeg)) return false;
          if (f.minRoe > 0  && (s.roe == null || s.roe < f.minRoe)) return false;
          if (f.maxDe < 5   && !s.isBank && (s.de == null || s.de > f.maxDe)) return false;
          if (f.minDivY > 0 && ((s.divYield ?? 0) < f.minDivY)) return false;
          if (f.minFcfY > 0 && (s.fcfYield == null || s.fcfYield < f.minFcfY)) return false;
          if (f.minEpsG > 0 && s.epsGrowth < f.minEpsG) return false;
          if ((f.minGrossMargin || 0) > 0 && (s.grossMargin == null || s.grossMargin < f.minGrossMargin)) return false;
          if (f.market !== "all" && s.market !== f.market) return false;
          if (f.sector !== "all" && s.sector !== f.sector) return false;
          if (f.mktCap === "mid-small" && !["mid","small"].includes(s.mktCap)) return false;
          if (f.mktCap === "mid"   && s.mktCap !== "mid")   return false;
          if (f.mktCap === "small" && s.mktCap !== "small") return false;
          if (f.mktCap === "large+" && !["large","mega"].includes(s.mktCap)) return false;
          return true;
        }).map(s => {
          const score       = computeScanScore(s);
          const fairPrice   = computeScanFairPrice(s);
          const upside      = computeScanUpside(s);
          const signal      = scanSignal(upside, score);
          const hv          = holdingValueMap[s.ticker] || 0;
          const holdPct     = hv > 0 && totalHeldValue > 0 ? hv / totalHeldValue * 100 : 0;
          const retireScore = computeRetireScore(s);
          const estCagr     = estimateRetireCagr(s);
          return { ...s, score, fairPrice, upside, signal, holdPct, retireScore, estCagr };
        });

        // ── Live result filters (instant, no re-scan needed) ─────────────────
        const filtered = scanned.filter(s => {
          if (scanSearch.trim()) {
            const q = scanSearch.trim().toLowerCase();
            if (!s.ticker.toLowerCase().includes(q) && !(s.name||"").toLowerCase().includes(q)) return false;
          }
          if (scanMinUpside > -100 && (s.upside == null || s.upside < scanMinUpside)) return false;
          if (scanMinScore  > 0    && (s.score  == null || s.score  < scanMinScore))  return false;
          if (scanSigFilter !== "all" && (!s.signal || s.signal.label !== scanSigFilter)) return false;
          return true;
        });

        const sortedFiltered = [...filtered].sort((a, b) => {
          const av = a[scanSort.col], bv = b[scanSort.col];
          const cmp = typeof av === "number" ? av - bv : String(av||"").localeCompare(String(bv||""));
          return scanSort.dir === "asc" ? cmp : -cmp;
        });

        function th(col, label) {
          const active = scanSort.col === col;
          return (
            <th className="th" style={{ cursor:"pointer", userSelect:"none", whiteSpace:"nowrap" }}
              onClick={() => setScanSort(prev => prev.col === col
                ? { col, dir: prev.dir === "asc" ? "desc" : "asc" }
                : { col, dir: ["ticker","name","sector","moat"].includes(col) ? "asc" : "desc" })}>
              {label}
              <span style={{ fontSize:8, marginLeft:3, color: active ? accentColor : "rgba(255,255,255,0.15)" }}>
                {active ? (scanSort.dir === "asc" ? "▲" : "▼") : "▲▼"}
              </span>
            </th>
          );
        }

        const peC   = v => v<=12?"#22c55e":v<=18?"#86efac":v<=25?"#fbbf24":v<=35?"#fb923c":"#ef4444";
        const pegC  = v => v<=1.0?"#22c55e":v<=1.5?"#86efac":v<=2.0?"#fbbf24":v<=3.0?"#fb923c":"#ef4444";
        const roeC  = v => { const r=Math.min(v,100); return r>=40?"#22c55e":r>=25?"#86efac":r>=15?"#fbbf24":r>=10?"#fb923c":"#ef4444"; };
        const deC   = v => v<0.3?"#22c55e":v<0.7?"#86efac":v<1.2?"#fbbf24":v<2.0?"#fb923c":"#ef4444";
        const fcfC  = v => v>=7?"#22c55e":v>=4?"#86efac":v>=2?"#fbbf24":v>=0.5?"#fb923c":"#ef4444";
        const sC    = v => v>=75?"#22c55e":v>=60?"#86efac":v>=45?"#fbbf24":v>=30?"#fb923c":"#ef4444";

        const METRIC_INFO = [
          { icon:"💵", label:"P/E Ratio",    good:"< 15",   color:"#22d3ee",
            why:"How much you pay per $1 of profit. S&P avg ~21×. Under 15 is cheap — but always ask why it's cheap." },
          { icon:"📐", label:"Forward PEG",  good:"< 1.5",  color:"#a78bfa",
            why:"Forward P/E ÷ EPS Growth. The score uses forward P/E (next 12m estimated earnings) not trailing — so you're pricing in where the business is going, not where it's been. fwd PEG < 1 = you're not paying full price for the growth." },
          { icon:"🏆", label:"ROE",          good:"> 15%",  color:"#34d399",
            why:"How efficiently the company uses shareholders' money. ROE > 15–20% is the signature of a business with a durable competitive moat." },
          { icon:"💰", label:"FCF Yield",    good:"> 4%",   color:"#fbbf24",
            why:"Free cash flow ÷ price. Unlike P/E, FCF is hard to fake. A 5%+ yield means the business generates real cash you can trust." },
        ];

        const QUALITY_RULES = [
          { icon:"🏰", title:"Moat First", desc:"High ROE + high gross margins = durable advantage. Without a moat, cheap stocks stay cheap." },
          { icon:"📊", title:"P/E is Context-Dependent", desc:"P/E 15 on a 20% grower (PEG 0.75) is cheap. P/E 15 on a 0% grower is still expensive." },
          { icon:"🏦", title:"Debt Amplifies Risk", desc:"D/E > 1.5× for non-banks means the company cuts dividends first and fails worst in recessions." },
          { icon:"💸", title:"FCF Beats Reported EPS", desc:"EPS can be smoothed via accounting. FCF cannot. FCF yield > 5% = genuinely cheap, regardless of P/E." },
          { icon:"📉", title:"Beware Value Traps", desc:"Low P/E + declining EPS = the ratio gets more expensive every quarter. Check EPS growth first." },
          { icon:"🔁", title:"Compounders Compound", desc:"ROE 25% + retained earnings = equity doubles every ~3 years. Time — not timing — is the edge." },
        ];

        return (
          <div style={{ padding:"24px 28px 52px", maxWidth:1440, margin:"0 auto" }}>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:28 }}>
              <div style={{ fontSize:32, lineHeight:1 }}>🔎</div>
              <div style={{ flex:1 }}>
                <h1 style={{ fontSize:22, fontWeight:900, color:"#f1f5f9", margin:"0 0 3px" }}>Stock Scanner</h1>
                <p style={{ fontSize:13, color:"#64748b", margin:0 }}>
                  Find quality businesses at the right price — {STOCKS.length} curated stocks screened across key fundamentals.{" "}
                  <span style={{ color:"rgba(255,255,255,0.22)", fontSize:12 }}>
                    Stock not listed? It hasn't been added to the universe yet — edit <code style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>src/data/stockUniverse.json</code> to include it.
                  </span>
                </p>
              </div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.15)", textAlign:"right", lineHeight:1.6 }}>
                Updated {stockUniverseData.lastUpdated}<br/>Not financial advice
              </div>
            </div>

            {/* Metric explainer mini-cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:26 }}>
              {METRIC_INFO.map(m => (
                <div key={m.label} className="card" style={{ borderColor:`${m.color}20`, background:`${m.color}05` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:20 }}>{m.icon}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", lineHeight:1.3 }}>{m.label}</div>
                      <div style={{ fontSize:10, color:m.color, fontWeight:700 }}>Good: {m.good}</div>
                    </div>
                  </div>
                  <p style={{ fontSize:11, color:"#64748b", lineHeight:1.65, margin:0 }}>{m.why}</p>
                </div>
              ))}
            </div>

            {/* ── Scan Now card ────────────────────────────────────────────── */}
            {(() => {
              const isScanning = !!stockScanProgress;
              const ss = stockScanResults;
              return (
                <div className="card" style={{ marginBottom:20, borderColor:"rgba(34,197,94,0.2)", background:"rgba(34,197,94,0.03)" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                    <div style={{ flex:1, minWidth:220 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9", marginBottom:4 }}>
                        Live Price Scan
                      </div>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.6, margin:0 }}>
                        Fetches the latest close price from Yahoo Finance for all {stockUniverseData.stocks.length} stocks,
                        then recomputes Fair Buy and Upside with live data.
                        Fundamental metrics (P/E, ROE, etc.) stay from the curated dataset — only price updates.
                      </p>
                      {/* Source + timestamp */}
                      {ss && (
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6 }}>
                          <span style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>
                            {ss.count} prices · {new Date(ss.lastUpdated).toLocaleString()}
                          </span>
                          <span style={{ fontSize:8, padding:"1px 6px", borderRadius:10,
                            background:"rgba(34,197,94,0.12)", color:"#22c55e",
                            border:"1px solid rgba(34,197,94,0.28)" }}>● Live</span>
                        </div>
                      )}
                    </div>

                    {/* Buttons */}
                    <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
                      <button
                        onClick={isScanning
                          ? () => { stockScanAbortRef.current?.abort(); setStockScanProgress(null); }
                          : runStockScan}
                        style={{
                          fontSize:11, padding:"7px 18px", whiteSpace:"nowrap", cursor:"pointer",
                          fontFamily:"inherit", fontWeight:700, borderRadius:8,
                          background: isScanning ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                          border: `1px solid ${isScanning ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
                          color: isScanning ? "#ef4444" : "#22c55e",
                        }}>
                        {isScanning
                          ? `⏹ Cancel (${stockScanProgress.done}/${stockScanProgress.total})`
                          : "🔍 Scan Now"}
                      </button>
                      {ss && (
                        <button
                          onClick={() => setStockScanResults(null)}
                          style={{ fontSize:10, padding:"4px 12px", whiteSpace:"nowrap", cursor:"pointer",
                            fontFamily:"inherit", borderRadius:6,
                            background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
                            color:"rgba(255,255,255,0.35)" }}>
                          ✕ Clear live data
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {isScanning && (
                    <div style={{ marginTop:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>
                          Fetching{stockScanProgress.ticker ? ` ${stockScanProgress.ticker}` : ""}…
                        </span>
                        <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>
                          {stockScanProgress.done} / {stockScanProgress.total}
                        </span>
                      </div>
                      <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.07)" }}>
                        <div style={{
                          height:"100%", borderRadius:2, background:"#22c55e",
                          width:`${(stockScanProgress.done / stockScanProgress.total) * 100}%`,
                          transition:"width 0.4s ease",
                        }} />
                      </div>
                    </div>
                  )}

                  {stockScanError && !isScanning && (
                    <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(239,68,68,0.08)",
                      border:"1px solid rgba(239,68,68,0.25)", borderRadius:8,
                      fontSize:11, color:"#ef4444" }}>
                      ⚠ {stockScanError}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Buy Radar — compact strip above preset buttons */}
            {(buyRadarData.inZone.length > 0 || buyRadarData.nearZone.length > 0) && (() => {
              const pFmt = p => p < 10 ? p.toFixed(2) : p < 100 ? p.toFixed(1) : Math.round(p);
              return (
                <div className="card" style={{ marginBottom:14, padding:"10px 14px",
                  borderColor:"rgba(34,197,94,0.18)", background:"rgba(34,197,94,0.02)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                    <span style={{ fontSize:12 }}>🎯</span>
                    <span style={{ fontSize:11, fontWeight:700, color:"#f1f5f9" }}>Buy Radar</span>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>— search these below for full fundamentals</span>
                    <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                      {buyRadarData.inZone.length > 0 && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)", color:"#22c55e", fontWeight:700 }}>{buyRadarData.inZone.length} buy now</span>}
                      {buyRadarData.nearZone.length > 0 && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)", color:"#fbbf24", fontWeight:700 }}>{buyRadarData.nearZone.length} approaching</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {buyRadarData.inZone.slice(0, 8).map(s => (
                      <div key={s.ticker} style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:7,
                        background: s.held ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                        border: s.held ? "1px solid rgba(34,197,94,0.28)" : "1px solid rgba(34,197,94,0.18)",
                        cursor:"pointer" }}
                        onClick={() => setScanSearch(s.ticker)}>
                        <span style={{ fontSize:11, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>{s.ticker}</span>
                        {s.held && <span style={{ fontSize:8, color:"#22d3ee", fontWeight:700 }}>held</span>}
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>${pFmt(s.price)}</span>
                        <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>→</span>
                        <span style={{ fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>${pFmt(s.fairPrice)}</span>
                        <span style={{ fontSize:10, fontWeight:700, color:"#22c55e" }}>+{s.upside}%</span>
                      </div>
                    ))}
                    {buyRadarData.nearZone.slice(0, 6).map(s => (
                      <div key={s.ticker} style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:7,
                        background: s.held ? "rgba(251,191,36,0.05)" : "rgba(255,255,255,0.02)",
                        border:"1px solid rgba(251,191,36,0.15)",
                        cursor:"pointer" }}
                        onClick={() => setScanSearch(s.ticker)}>
                        <span style={{ fontSize:11, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>{s.ticker}</span>
                        {s.held && <span style={{ fontSize:8, color:"#22d3ee", fontWeight:700 }}>held</span>}
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>${pFmt(s.price)}</span>
                        <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>→</span>
                        <span style={{ fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>${pFmt(s.fairPrice)}</span>
                        <span style={{ fontSize:10, color:"#fbbf24" }}>{Math.abs(s.upside).toFixed(1)}% away</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Retire-mode banner */}
            {scanPreset === "retire" && (
              <div style={{ marginBottom:16, padding:"14px 18px", borderRadius:10,
                background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.25)" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                  <span style={{ fontSize:24, lineHeight:1 }}>🏖️</span>
                  <div style={{ flex:1, minWidth:220 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#fbbf24", marginBottom:4 }}>
                      Retirement Wealth-Builder — Age 45 · Retire in 10-15 years
                    </div>
                    <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", lineHeight:1.65, margin:"0 0 8px" }}>
                      These stocks pass four retirement filters: <strong style={{color:"#f1f5f9"}}>EPS growth ≥ 12%</strong> (compounding engine),{" "}
                      <strong style={{color:"#f1f5f9"}}>ROE ≥ 15%</strong> (quality moat), <strong style={{color:"#f1f5f9"}}>FCF yield ≥ 2%</strong> (real cash),{" "}
                      <strong style={{color:"#f1f5f9"}}>gross margin ≥ 30%</strong> (pricing power).
                      The <em>Retire Score</em> (0–100) weights compounding potential over cheap P/E.
                      The <em>Est. CAGR</em> and <em>$10K→15yr</em> columns show what a $10K position could grow to — sort by those to find your highest-conviction bets.
                    </p>
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                      {[
                        { label:"Rule of 72", tip:"At 15% CAGR, money doubles every ~5 yrs. 3 doublings in 15 yrs = 8× your capital." },
                        { label:"Quality > Cheapness", tip:"A stock at P/E 40 growing 20%/yr beats a P/E 10 stock growing 3%/yr every time over 15 years." },
                        { label:"Stay invested", tip:"Missing the 10 best days in 15 years cuts returns by ~50%. Buy quality, hold through volatility." },
                      ].map(({ label, tip }) => (
                        <div key={label} style={{ fontSize:10, color:"rgba(255,255,255,0.4)", maxWidth:220 }}>
                          <span style={{ color:"#fbbf24", fontWeight:700 }}>{label}: </span>{tip}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preset buttons */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.25)",
                textTransform:"uppercase", marginBottom:9 }}>Quick Screens</div>
              <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                {SCAN_PRESETS.map(({ key, icon, label, desc }) => (
                  <button key={key}
                    className={`tab-btn ${scanPreset===key?"on":""}`}
                    onClick={() => {
                      const pf = { ...SCAN_PRESET_FILTERS[key] };
                      setScanPreset(key);
                      setScanFilters(pf);
                      setScanCommitted(pf);
                      setScanDirty(false);
                    }}
                    style={{ fontSize:12, padding:"7px 14px", display:"flex", alignItems:"center", gap:6 }}>
                    <span>{icon}</span>
                    <span style={{ fontWeight:600 }}>{label}</span>
                    <span style={{ fontSize:10, opacity:0.55 }}>— {desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom filters */}
            <div className="card" style={{ marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>Custom Filters</span>
                {scanPreset !== "all" && scanPreset !== "custom" && (
                  <span style={{ fontSize:10, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)",
                    color:"#fbbf24", borderRadius:5, padding:"1px 8px" }}>
                    preset: {SCAN_PRESETS.find(p=>p.key===scanPreset)?.label}
                  </span>
                )}
                <button onClick={() => {
                    const def = { ...SCAN_PRESET_FILTERS.all };
                    setScanPreset("all");
                    setScanFilters(def);
                    setScanCommitted(def);
                    setScanDirty(false);
                  }}
                  style={{ marginLeft:"auto", fontSize:11, color:"#64748b", background:"none",
                    border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"3px 10px", cursor:"pointer" }}>
                  Reset all
                </button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:18 }}>
                {[
                  { key:"maxPe",          label:"Max P/E",           min:5,  max:120, step:1,   fmt: v => v>=120?"Any":`${v}×` },
                  { key:"maxPeg",         label:"Max Fwd PEG",        min:0.5,max:5,   step:0.1, fmt: v => v>=5?"Any":v.toFixed(1) },
                  { key:"minRoe",         label:"Min ROE",            min:0,  max:50,  step:1,   fmt: v => v<=0?"Any":`${v}%` },
                  { key:"maxDe",          label:"Max D/E (non-bank)", min:0,  max:5,   step:0.1, fmt: v => v>=5?"Any":`${v.toFixed(1)}×` },
                  { key:"minDivY",        label:"Min Div Yield",      min:0,  max:10,  step:0.5, fmt: v => v<=0?"Any":`${v}%` },
                  { key:"minFcfY",        label:"Min FCF Yield",      min:0,  max:12,  step:0.5, fmt: v => v<=0?"Any":`${v}%` },
                  { key:"minEpsG",        label:"Min EPS Growth",     min:0,  max:50,  step:1,   fmt: v => v<=0?"Any":`${v}%` },
                  { key:"minGrossMargin", label:"Min Gross Margin",   min:0,  max:90,  step:5,   fmt: v => v<=0?"Any":`${v}%` },
                ].map(({ key, label, min, max, step, fmt }) => {
                  const val = Math.min(Math.max(scanFilters[key] ?? 0, min), max);
                  return (
                    <div key={key}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{label}</span>
                        <span style={{ fontSize:11, fontWeight:700, color: scanDirty ? "#fbbf24" : accentColor,
                          fontFamily:"'JetBrains Mono',monospace" }}>{fmt(scanFilters[key] ?? 0)}</span>
                      </div>
                      <input type="range" min={min} max={max} step={step} value={val}
                        onChange={e => {
                          const nv = parseFloat(e.target.value);
                          const stored = key==="maxPe"&&nv>=120?120:key==="maxPeg"&&nv>=5?5:key==="maxDe"&&nv>=5?5:nv;
                          setScanPreset("custom");
                          setScanDirty(true);
                          setScanFilters(prev => ({ ...prev, [key]: stored, ideasOnly:false }));
                        }} />
                    </div>
                  );
                })}
                <div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:5 }}>Market</div>
                  <select value={scanFilters.market}
                    onChange={e => { setScanPreset("custom"); setScanDirty(true); setScanFilters(prev=>({...prev,market:e.target.value,ideasOnly:false})); }}
                    style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)",
                      color:"#f1f5f9", borderRadius:8, padding:"6px 10px", fontSize:12, width:"100%", cursor:"pointer" }}>
                    <option value="all">🌐 US + Canada</option>
                    <option value="US">🇺🇸 US only</option>
                    <option value="CA">🍁 Canada only</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:5 }}>Sector</div>
                  <select value={scanFilters.sector}
                    onChange={e => { setScanPreset("custom"); setScanDirty(true); setScanFilters(prev=>({...prev,sector:e.target.value,ideasOnly:false})); }}
                    style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)",
                      color:"#f1f5f9", borderRadius:8, padding:"6px 10px", fontSize:12, width:"100%", cursor:"pointer" }}>
                    {allSectors.map(s => <option key={s} value={s}>{s==="all"?"All Sectors":s}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:5 }}>Market Cap</div>
                  <select value={scanFilters.mktCap ?? "all"}
                    onChange={e => { setScanPreset("custom"); setScanDirty(true); setScanFilters(prev=>({...prev,mktCap:e.target.value,ideasOnly:false})); }}
                    style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)",
                      color:"#f1f5f9", borderRadius:8, padding:"6px 10px", fontSize:12, width:"100%", cursor:"pointer" }}>
                    <option value="all">All sizes</option>
                    <option value="large+">Large + Mega only</option>
                    <option value="mid-small">Mid + Small only</option>
                    <option value="mid">Mid cap (~$2–10B)</option>
                    <option value="small">Small cap (~$300M–2B)</option>
                  </select>
                </div>
              </div>

              {/* Run Scan button */}
              <div style={{ marginTop:18, display:"flex", alignItems:"center", gap:12 }}>
                <button
                  onClick={() => { setScanCommitted({ ...scanFilters }); setScanDirty(false); }}
                  style={{
                    padding:"10px 28px", borderRadius:10, border:"none", cursor:"pointer",
                    fontFamily:"inherit", fontWeight:800, fontSize:14,
                    background: scanDirty ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : "rgba(255,255,255,0.07)",
                    color: scanDirty ? "#0d1117" : "#64748b",
                    boxShadow: scanDirty ? "0 4px 16px rgba(251,191,36,0.35)" : "none",
                    transition:"all 0.2s",
                  }}>
                  {scanDirty ? "▶ Run Scan" : "✓ Results current"}
                </button>
                {scanDirty && (
                  <span style={{ fontSize:12, color:"#fbbf24", opacity:0.8 }}>
                    Filters changed — click to update results
                  </span>
                )}
              </div>
            </div>

            {/* ── Live result filters ─────────────────────────────────────── */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:14, alignItems:"center" }}>
              {/* Ticker / name search */}
              <input
                value={scanSearch}
                onChange={e => setScanSearch(e.target.value)}
                placeholder="🔍 Search ticker or name…"
                style={{ padding:"7px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)",
                  background:"rgba(255,255,255,0.05)", color:"#f1f5f9", fontFamily:"inherit",
                  fontSize:12, outline:"none", width:200 }}
              />
              {/* Min upside */}
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Min upside</span>
                {[-100, 0, 12, 25].map(v => (
                  <button key={v}
                    onClick={() => setScanMinUpside(v)}
                    style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${scanMinUpside===v?"rgba(251,191,36,0.5)":"rgba(255,255,255,0.1)"}`,
                      background: scanMinUpside===v?"rgba(251,191,36,0.12)":"rgba(255,255,255,0.04)",
                      color: scanMinUpside===v?"#fbbf24":"#94a3b8", cursor:"pointer",
                      fontFamily:"inherit", fontSize:11, fontWeight:700 }}>
                    {v===-100?"Any":v===0?"≥ 0%":v===12?"≥ 12%":"≥ 25%"}
                  </button>
                ))}
              </div>
              {/* Min score */}
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Min score</span>
                {[0, 40, 55, 70].map(v => (
                  <button key={v}
                    onClick={() => setScanMinScore(v)}
                    style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${scanMinScore===v?"rgba(251,191,36,0.5)":"rgba(255,255,255,0.1)"}`,
                      background: scanMinScore===v?"rgba(251,191,36,0.12)":"rgba(255,255,255,0.04)",
                      color: scanMinScore===v?"#fbbf24":"#94a3b8", cursor:"pointer",
                      fontFamily:"inherit", fontSize:11, fontWeight:700 }}>
                    {v===0?"Any":`≥ ${v}`}
                  </button>
                ))}
              </div>
              {/* Signal filter */}
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Signal</span>
                {[["all","All"],["Strong Buy","⬆ Strong Buy"],["Buy","↑ Buy"],["Watch","→ Watch"],["Expensive","↓ Expensive"]].map(([v,l]) => (
                  <button key={v}
                    onClick={() => setScanSigFilter(v)}
                    style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${scanSigFilter===v?"rgba(251,191,36,0.5)":"rgba(255,255,255,0.1)"}`,
                      background: scanSigFilter===v?"rgba(251,191,36,0.12)":"rgba(255,255,255,0.04)",
                      color: scanSigFilter===v?"#fbbf24":"#94a3b8", cursor:"pointer",
                      fontFamily:"inherit", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <span style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>
                {sortedFiltered.length === 0 ? "No matches" :
                  `${sortedFiltered.length}${sortedFiltered.length !== scanned.length ? ` of ${scanned.length}` : ""} stock${sortedFiltered.length!==1?"s":""} found`}
              </span>
              {sortedFiltered.length > 0 &&
                <span style={{ fontSize:11, color:"#475569" }}>Click column headers to sort</span>}
              <div style={{ marginLeft:"auto", display:"flex", gap:10, fontSize:11, color:"#475569" }}>
                <span>🟢 Score ≥ 75</span><span>🟡 50–74</span><span>🔴 &lt; 50</span>
              </div>
            </div>

            {sortedFiltered.length === 0 ? (
              <div className="card" style={{ textAlign:"center", padding:"48px 24px" }}>
                <div style={{ fontSize:36, marginBottom:12 }}>🔍</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9", marginBottom:6 }}>No stocks match these filters</div>
                <div style={{ fontSize:12, color:"#64748b" }}>Try relaxing one or more filters, or click a preset above</div>
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1320 }}>
                  <thead>
                    <tr>
                      {th("ticker","Ticker")}
                      {th("name","Company")}
                      {th("holdPct","Held")}
                      {th("sector","Sector")}
                      {th("pe","P/E")}
                      {th("peg","PEG")}
                      {th("roe","ROE %")}
                      {th("de","D/E")}
                      {th("fcfYield","FCF Yld")}
                      {th("divYield","Div %")}
                      {th("epsGrowth","EPS Grw")}
                      {th("score","Score")}
                      {th("retireScore","Retire")}
                      {th("estCagr","Est. CAGR")}
                      {th("price","Price")}
                      {th("fairPrice","Fair Buy")}
                      {th("upside","Upside")}
                      {th("moat","Moat / Edge")}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFiltered.map((s, i) => {
                      const rec       = REC_MAP[s.ticker];
                      const isExpanded= scanExpanded === s.ticker;
                      const rowBg     = i%2===0 ? "transparent" : "rgba(255,255,255,0.013)";
                      return (
                        <React.Fragment key={s.ticker}>
                          <tr style={{ background: rowBg, cursor: rec ? "pointer" : "default",
                              transition:"background 0.12s",
                              borderLeft: rec ? "2px solid rgba(251,191,36,0.4)" : "2px solid transparent" }}
                            onClick={() => rec && setScanExpanded(isExpanded ? null : s.ticker)}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                            onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                            {/* Ticker cell */}
                            <td className="td" style={{ whiteSpace:"nowrap" }}>
                              <span style={{ fontWeight:800, fontSize:13, color:accentColor,
                                fontFamily:"'JetBrains Mono',monospace" }}>{s.ticker}</span>
                              {s.market==="CA" && (
                                <span style={{ fontSize:9, background:"rgba(34,211,238,0.12)", border:"1px solid rgba(34,211,238,0.28)",
                                  color:"#22d3ee", borderRadius:4, padding:"0 5px", marginLeft:5, verticalAlign:"middle" }}>CA</span>
                              )}
                              {s.mktCap==="mid" && (
                                <span style={{ fontSize:9, background:"rgba(251,146,60,0.1)", border:"1px solid rgba(251,146,60,0.25)",
                                  color:"#fb923c", borderRadius:4, padding:"0 5px", marginLeft:3, verticalAlign:"middle" }}>Mid</span>
                              )}
                              {s.mktCap==="small" && (
                                <span style={{ fontSize:9, background:"rgba(244,114,182,0.1)", border:"1px solid rgba(244,114,182,0.25)",
                                  color:"#f472b6", borderRadius:4, padding:"0 5px", marginLeft:3, verticalAlign:"middle" }}>Small</span>
                              )}
                              {s.isBank && (
                                <span style={{ fontSize:9, background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)",
                                  color:"#a78bfa", borderRadius:4, padding:"0 5px", marginLeft:3, verticalAlign:"middle" }}>Bank</span>
                              )}
                              {rec && (
                                <span style={{ fontSize:9, background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.35)",
                                  color:"#fbbf24", borderRadius:4, padding:"0 5px", marginLeft:3, verticalAlign:"middle",
                                  fontWeight:700 }}>💡 {rec.conviction}</span>
                              )}
                              {rec && (
                                <span style={{ fontSize:9, background: rec.bestFor==="TFSA"?"rgba(251,191,36,0.08)":"rgba(34,211,238,0.08)",
                                  border:`1px solid ${rec.bestFor==="TFSA"?"rgba(251,191,36,0.25)":"rgba(34,211,238,0.25)"}`,
                                  color: rec.bestFor==="TFSA"?"#fbbf24":"#22d3ee",
                                  borderRadius:4, padding:"0 5px", marginLeft:3, verticalAlign:"middle" }}>{rec.bestFor}</span>
                              )}
                            </td>
                            <td className="td" style={{ maxWidth:150, overflow:"hidden", textOverflow:"ellipsis",
                              whiteSpace:"nowrap", color:"#e2e8f0", fontSize:12 }}>{s.name}</td>
                            {/* Held % */}
                            <td className="td" style={{ textAlign:"right", whiteSpace:"nowrap" }}>
                              {s.holdPct > 0
                                ? <span style={{ fontSize:11, fontWeight:700, color:"#22d3ee",
                                    fontFamily:"'JetBrains Mono',monospace",
                                    background:"rgba(34,211,238,0.08)", border:"1px solid rgba(34,211,238,0.25)",
                                    borderRadius:5, padding:"2px 7px" }}>
                                    {s.holdPct.toFixed(1)}%
                                  </span>
                                : <span style={{ fontSize:10, color:"#334155" }}>—</span>}
                            </td>
                            <td className="td">
                              <span style={{ fontSize:10, color:"rgba(255,255,255,0.38)", background:"rgba(255,255,255,0.04)",
                                borderRadius:4, padding:"2px 7px", whiteSpace:"nowrap" }}>{s.sector}</span>
                            </td>
                            <td className="td" style={{ textAlign:"right" }}>
                              {s.pe != null ? <ScanPill value={`${s.pe}×`} color={peC(s.pe)} />
                                : <span style={{ fontSize:10, color:"#334155" }}>—</span>}
                            </td>
                            <td className="td" style={{ textAlign:"right" }}>
                              {(() => {
                                const fwdPeg = (s.fwdPe > 0 && s.epsGrowth > 0)
                                  ? +(s.fwdPe / s.epsGrowth).toFixed(2) : null;
                                const display = fwdPeg ?? s.peg;
                                if (!display) return <span style={{ fontSize:10, color:"#334155" }}>—</span>;
                                return (
                                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:1 }}>
                                    <ScanPill value={display.toFixed(2)} color={pegC(display)} />
                                    {fwdPeg && (
                                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)",
                                        fontFamily:"'JetBrains Mono',monospace" }}>fwd</span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="td" style={{ textAlign:"right" }}>
                              {s.roe != null ? <ScanPill value={`${Math.min(s.roe,350)}%`} color={roeC(s.roe)} />
                                : <span style={{ fontSize:10, color:"#334155" }}>—</span>}
                            </td>
                            <td className="td" style={{ textAlign:"right" }}>
                              {s.isBank
                                ? <span style={{ fontSize:11, color:"#475569", fontStyle:"italic" }}>Bank*</span>
                                : s.de != null
                                  ? <ScanPill value={`${s.de}×`} color={deC(s.de)} />
                                  : <span style={{ fontSize:10, color:"#334155" }}>—</span>}
                            </td>
                            <td className="td" style={{ textAlign:"right" }}>
                              {s.fcfYield != null ? <ScanPill value={`${s.fcfYield}%`} color={fcfC(s.fcfYield)} />
                                : <span style={{ fontSize:10, color:"#334155" }}>—</span>}
                            </td>
                            <td className="td" style={{ textAlign:"right",
                              color: (s.divYield??0)>=4?"#22c55e":(s.divYield??0)>=2?"#fbbf24":(s.divYield??0)>0?"#94a3b8":"#334155",
                              fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>
                              {(s.divYield??0)>0?`${s.divYield}%`:"—"}
                            </td>
                            <td className="td" style={{ textAlign:"right",
                              color: s.epsGrowth==null?"#334155":s.epsGrowth>=20?"#22c55e":s.epsGrowth>=10?"#fbbf24":s.epsGrowth>=3?"#94a3b8":"#ef4444",
                              fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>
                              {s.epsGrowth!=null?(s.epsGrowth>0?`+${s.epsGrowth}%`:`${s.epsGrowth}%`):"—"}
                            </td>
                            <td className="td" style={{ textAlign:"center" }}>
                              <div style={{ width:38, height:38, borderRadius:"50%",
                                border:`2.5px solid ${sC(s.score)}`,
                                background:`${sC(s.score)}12`, display:"inline-flex",
                                alignItems:"center", justifyContent:"center",
                                fontSize:11, fontWeight:800, color:sC(s.score),
                                fontFamily:"'JetBrains Mono',monospace" }}>
                                {s.score}
                              </div>
                            </td>
                            {/* Retire Score */}
                            <td className="td" style={{ textAlign:"center" }}>
                              {(() => {
                                const rs = s.retireScore;
                                const rc = rs >= 70 ? "#22c55e" : rs >= 50 ? "#fbbf24" : rs >= 30 ? "#fb923c" : "#ef4444";
                                const label = rs >= 70 ? "Elite" : rs >= 50 ? "Strong" : rs >= 30 ? "Steady" : "Weak";
                                return (
                                  <div style={{ display:"inline-flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                                    <div style={{ width:34, height:34, borderRadius:"50%",
                                      border:`2px solid ${rc}`, background:`${rc}12`,
                                      display:"inline-flex", alignItems:"center", justifyContent:"center",
                                      fontSize:10, fontWeight:800, color:rc,
                                      fontFamily:"'JetBrains Mono',monospace" }}>
                                      {rs}
                                    </div>
                                    <span style={{ fontSize:8, color:rc, fontWeight:700, letterSpacing:"0.03em" }}>{label}</span>
                                  </div>
                                );
                              })()}
                            </td>
                            {/* Est. CAGR */}
                            <td className="td" style={{ textAlign:"center", whiteSpace:"nowrap" }}>
                              {s.estCagr > 0 ? (
                                <div style={{ display:"inline-flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                                  <span style={{ fontSize:12, fontWeight:800,
                                    color: s.estCagr >= 15 ? "#22c55e" : s.estCagr >= 10 ? "#fbbf24" : "#94a3b8",
                                    fontFamily:"'JetBrains Mono',monospace" }}>
                                    {s.estCagr}%
                                  </span>
                                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)" }}>
                                    ${Math.round(10000 * Math.pow(1 + s.estCagr / 100, 15) / 1000)}K
                                  </span>
                                </div>
                              ) : <span style={{ color:"#334155", fontSize:10 }}>—</span>}
                            </td>
                            {/* Price */}
                            <td className="td" style={{ textAlign:"right", whiteSpace:"nowrap",
                              color:"#cbd5e1", fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>
                              {s.price > 0
                                ? `$${s.price < 10 ? s.price.toFixed(2) : s.price < 100 ? s.price.toFixed(1) : Math.round(s.price)}`
                                : <span style={{ color:"#334155" }}>—</span>}
                            </td>
                            {/* Fair Buy */}
                            <td className="td" style={{ textAlign:"right", whiteSpace:"nowrap" }}>
                              {s.fairPrice
                                ? <span style={{ fontWeight:700, color:
                                    (s.upside??0) >= 12 ? "#22c55e" : (s.upside??0) >= 0 ? "#fbbf24" : "#ef4444",
                                    fontFamily:"'JetBrains Mono',monospace", fontSize:12 }}>
                                    ${s.fairPrice < 10 ? s.fairPrice.toFixed(2) : s.fairPrice < 100 ? s.fairPrice.toFixed(1) : Math.round(s.fairPrice)}
                                  </span>
                                : <span style={{ color:"#334155", fontSize:10 }}>—</span>}
                            </td>
                            {/* Upside + Signal */}
                            <td className="td" style={{ textAlign:"center", whiteSpace:"nowrap" }}>
                              {s.signal
                                ? <div style={{ display:"inline-flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                                    <span style={{ fontSize:10, fontWeight:800,
                                      color: s.signal.color,
                                      fontFamily:"'JetBrains Mono',monospace" }}>
                                      {(s.upside??0) >= 0 ? `+${s.upside}%` : `${s.upside}%`}
                                    </span>
                                    <span style={{ fontSize:9, background:`${s.signal.color}18`,
                                      border:`1px solid ${s.signal.color}44`, borderRadius:4,
                                      padding:"0 5px", color:s.signal.color, fontWeight:700 }}>
                                      {s.signal.icon} {s.signal.label}
                                    </span>
                                  </div>
                                : <span style={{ color:"#334155", fontSize:10 }}>—</span>}
                            </td>
                            <td className="td" style={{ fontSize:10, color:"rgba(255,255,255,0.4)",
                              maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {s.moat}
                              {rec && <span style={{ color:"rgba(255,255,255,0.2)", marginLeft:6 }}>▾ thesis</span>}
                            </td>
                          </tr>

                          {/* Expanded thesis panel */}
                          {isExpanded && rec && (
                            <tr style={{ background:"rgba(251,191,36,0.04)", borderLeft:"2px solid rgba(251,191,36,0.4)" }}>
                              <td colSpan={18} style={{ padding:"14px 20px 16px" }}>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:16, alignItems:"start" }}>
                                  <div>
                                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                                      <span style={{ fontSize:12, fontWeight:800, color:"#fbbf24" }}>💡 Ideas Thesis</span>
                                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>·</span>
                                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>{rec.role} · {rec.moat}</span>
                                    </div>
                                    <p style={{ fontSize:12, color:"#cbd5e1", lineHeight:1.75, margin:"0 0 10px" }}>
                                      {rec.thesis}
                                    </p>
                                    {rec.risks && rec.risks.length > 0 && (
                                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                                        {rec.risks.slice(0,3).map((r,ri) => (
                                          <span key={ri} style={{ fontSize:10, background:"rgba(239,68,68,0.08)",
                                            border:"1px solid rgba(239,68,68,0.2)", color:"#fca5a5",
                                            borderRadius:5, padding:"2px 8px" }}>⚠ {r}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display:"flex", flexDirection:"column", gap:6, minWidth:120, alignItems:"flex-end" }}>
                                    {rec.tags && rec.tags.map((t,ti) => (
                                      <span key={ti} style={{ fontSize:10, background:"rgba(251,191,36,0.08)",
                                        border:"1px solid rgba(251,191,36,0.2)", color:"#fbbf24",
                                        borderRadius:4, padding:"2px 8px", whiteSpace:"nowrap" }}>{t}</span>
                                    ))}
                                    <span style={{ fontSize:10, color:"#64748b", marginTop:4 }}>
                                      Est. CAGR {rec.cagr}%/yr
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p style={{ fontSize:10, color:"rgba(255,255,255,0.18)", marginTop:8, fontStyle:"italic" }}>
              * Banks: D/E excluded from filter and score (leverage is structural).  — = data pending next 6AM refresh (auto-populated daily by GitHub Actions).
            </p>

            {/* Fair Price Method Explainer */}
            <div className="card" style={{ marginTop:28, borderColor:"rgba(34,197,94,0.2)", background:"rgba(34,197,94,0.03)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <span style={{ fontSize:18 }}>🎯</span>
                <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>How "Fair Buy" Price Is Calculated</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div style={{ borderLeft:"2px solid #22c55e44", paddingLeft:12 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", marginBottom:4 }}>
                    Growth Path <span style={{ fontSize:10, color:"#64748b" }}>(div yield ≤ 2.5% OR EPS growth &gt; 8%)</span>
                  </div>
                  <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.7, fontFamily:"'JetBrains Mono',monospace",
                    background:"rgba(255,255,255,0.03)", borderRadius:6, padding:"8px 10px", marginBottom:8 }}>
                    fwdEPS = Price ÷ Forward P/E<br/>
                    Fair PE = max(EPS Growth × tPEG, minPE), capped at 50 and 1.5× fwd P/E<br/>
                    Fair Price = fwdEPS × Fair PE
                  </div>
                  <div style={{ fontSize:11, color:"#64748b", lineHeight:1.6 }}>
                    Uses <strong style={{color:"#94a3b8"}}>forward P/E</strong> (next-12m estimates) for EPS — more accurate than trailing.
                    Quality tiers raise the target PEG and set a minimum P/E floor so great businesses
                    don't get absurdly low fair values just because growth is temporarily slow.
                    Exceptional ROE (≥ 60%) qualifies as premium regardless of gross margin.
                  </div>
                  <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[["Premium (ROE≥25%+GM≥50% or ROE≥60%)","tPEG 1.5 · minPE 15","#22c55e"],
                      ["Quality (ROE≥15%+GM≥30% or ROE≥40%)","tPEG 1.2 · minPE 12","#fbbf24"],
                      ["Standard","tPEG 0.9 · minPE 8","#94a3b8"]].map(([tier,peg,col])=>(
                      <span key={tier} style={{ fontSize:10, background:`${col}12`, border:`1px solid ${col}33`,
                        color:col, borderRadius:5, padding:"2px 8px" }}>
                        {tier}: {peg}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ borderLeft:"2px solid #22d3ee44", paddingLeft:12 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", marginBottom:4 }}>
                    Income Path <span style={{ fontSize:10, color:"#64748b" }}>(div yield &gt; 2.5% AND EPS growth ≤ 8%)</span>
                  </div>
                  <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.7, fontFamily:"'JetBrains Mono',monospace",
                    background:"rgba(255,255,255,0.03)", borderRadius:6, padding:"8px 10px", marginBottom:8 }}>
                    Fair Price = Current Price × (Div Yield% ÷ Target Yield%)
                  </div>
                  <div style={{ fontSize:11, color:"#64748b", lineHeight:1.6 }}>
                    For banks, pipelines, and other slow-growth income businesses where yield is the
                    primary value anchor. Low-yield payers (AAPL 0.5%, MSFT 0.8%) stay on the growth path.
                    Target yields are calibrated to realistic sector trading ranges.
                  </div>
                  <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[["High-yield (div ≥ 5%)","target 5.0%","#a78bfa"],["Banks","target 3.5%","#22d3ee"],
                      ["Quality Aristocrat (ROE ≥ 25%)","target 3.0%","#22c55e"],
                      ["Standard / leveraged","target 4.5%","#fbbf24"]].map(([tier,y,col])=>(
                      <span key={tier} style={{ fontSize:10, background:`${col}12`, border:`1px solid ${col}33`,
                        color:col, borderRadius:5, padding:"2px 8px" }}>
                        {tier}: {y}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop:12, fontSize:10, color:"rgba(255,255,255,0.18)", borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:10 }}>
                ⚠ Fair Price is a model estimate using forward earnings and analyst growth rates — not a price target, not financial advice.
                Signal thresholds: Strong Buy = Upside ≥ 25% + Score ≥ 60 · Buy = ≥ 12% + ≥ 48 · Watch = ≥ 0% + ≥ 38 · Expensive = &lt; −20%.
              </div>
            </div>

            {/* How Score is Calculated */}
            <div className="card" style={{ marginTop:28 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9", marginBottom:14 }}>
                How the Value Score (0–100) Works
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {[
                  { label:"Forward PEG",    pts:"0–25 pts", weight:"Most weight", desc:"fwdPE ÷ EPS growth. Uses forward P/E (not trailing) so the score reflects where earnings are heading. ≤ 0.8 earns full marks." },
                  { label:"FCF Yield",       pts:"0–20 pts", weight:"Real earnings", desc:"Hard-to-fake cash generation. ≥ 8% FCF yield earns full marks." },
                  { label:"Return on Equity",pts:"0–20 pts", weight:"Business quality", desc:"Moat proxy — ROE ≥ 40% earns full marks. Capped at 100% to prevent leverage distortion." },
                  { label:"D/E Ratio",       pts:"0–15 pts", weight:"Safety margin", desc:"Lower debt = more resilience. Skipped for banks (fixed 8/15 pts)." },
                  { label:"Gross Margin",    pts:"0–10 pts", weight:"Pricing power", desc:"Wide margins = durable competitive advantage. ≥ 70% earns full marks." },
                  { label:"EPS Growth",      pts:"0–10 pts", weight:"Momentum", desc:"Confirms earnings quality is compounding. ≥ 25% earns full marks." },
                ].map(m => (
                  <div key={m.label} style={{ borderLeft:`2px solid ${accentColor}33`, paddingLeft:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:3 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"#f1f5f9" }}>{m.label}</span>
                      <span style={{ fontSize:11, color:accentColor, fontFamily:"'JetBrains Mono',monospace" }}>{m.pts}</span>
                    </div>
                    <div style={{ fontSize:10, color:"#64748b", marginBottom:2 }}>{m.weight}</div>
                    <div style={{ fontSize:10, color:"#475569", lineHeight:1.5 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Six Rules */}
            <div style={{ marginTop:24 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.25)",
                textTransform:"uppercase", marginBottom:14 }}>Six Rules for Finding a True Quality Stock</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {QUALITY_RULES.map(r => (
                  <div key={r.title} className="card">
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:18 }}>{r.icon}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:"#f1f5f9" }}>{r.title}</span>
                    </div>
                    <p style={{ fontSize:11, color:"#64748b", lineHeight:1.65, margin:0 }}>{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ fontSize:10, color:"rgba(255,255,255,0.15)", marginTop:24, lineHeight:1.7 }}>
              Data is approximate and manually curated as of {stockUniverseData.lastUpdated}. Fundamental metrics change quarterly.
              Always verify current P/E, EPS, and balance sheet data before making any investment decision. Not financial advice.
            </p>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: AI ADVISOR
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "advisor" && (() => {
        const selectedTpl = advisorTemplateId !== null
          ? AI_ADVISOR_TEMPLATES.find(t => t.id === advisorTemplateId) : null;

        // Build portfolio context string injected into every prompt
        function buildAdvisorPortfolioCtx() {
          const fxRate = usdCadRate || 1.38;
          const allH = portfolios.flatMap(p => (holdings[p] || []).map(h => ({ ...h, acct: p })));
          if (!allH.length) return "";
          const totalCAD = allH.reduce((s, h) => {
            const cur = getTickerCurrency(h.ticker, h.currencyOverride);
            return s + (cur === "USD" ? h.current * fxRate : h.current);
          }, 0);
          const holdingLines = allH
            .filter(h => h.current > 0)
            .sort((a, b) => {
              const av = getTickerCurrency(a.ticker, a.currencyOverride) === "USD" ? a.current * fxRate : a.current;
              const bv = getTickerCurrency(b.ticker, b.currencyOverride) === "USD" ? b.current * fxRate : b.current;
              return bv - av;
            })
            .map(h => {
              const cur = getTickerCurrency(h.ticker, h.currencyOverride);
              const cadVal = cur === "USD" ? h.current * fxRate : h.current;
              const pct = totalCAD > 0 ? ((cadVal / totalCAD) * 100).toFixed(1) : "0.0";
              return `  ${h.acct} | ${h.ticker} | ${h.name} | C$${Math.round(cadVal).toLocaleString()} (${pct}%) | div:${h.divYield ?? 0}% | sector:${h.notes || "—"}`;
            })
            .join("\n");
          const regime = marketPulse?.regime?.label || "Unknown";
          const riskScore = marketPulse?.riskMeter?.score ?? 50;
          const profCtx = profileContext();
          const indLabel = advisorIndustry.length > 0
            ? ADVISOR_INDUSTRIES.filter(i => advisorIndustry.includes(i.id)).map(i => i.label).join(", ")
            : null;
          return [
            "PORTFOLIO CONTEXT:",
            `Total value: C$${Math.round(totalCAD).toLocaleString()} | USD/CAD: ${fxRate} | Accounts: ${portfolios.join(", ")}`,
            `Market regime: ${regime} | Risk score: ${riskScore}/100`,
            indLabel ? `Industry focus: ${indLabel}` : null,
            profCtx || null,
            "Holdings (account | ticker | name | CAD value | div yield | notes):",
            holdingLines,
          ].filter(Boolean).join("\n");
        }

        async function runAdvisorQuery() {
          if (!selectedTpl) return;
          if (licenseTier === "basic") {
            setAdvisorError("AI Advisor requires the Pro plan.");
            return;
          }
          setAdvisorLoading(true);
          setAdvisorError(null);
          setAdvisorResponse(null);
          try {
            const ctx = buildAdvisorPortfolioCtx();
            const fieldValues = Object.fromEntries(
              selectedTpl.fields.map(f => [f.key, advisorInputs[f.key] || ""])
            );
            const prompt = selectedTpl.buildPrompt(fieldValues, ctx);
            const res = await callClaude({
              model: "claude-sonnet-4-6",
              max_tokens: 4096,
              messages: [{ role: "user", content: prompt }],
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error?.message || `API error ${res.status}`);
            }
            const data = await res.json();
            const text = (data.content?.[0]?.text || "").trim();
            setAdvisorResponse(text);
            const entry = {
              id: Date.now(),
              templateId: selectedTpl.id,
              title: selectedTpl.title,
              icon: selectedTpl.icon,
              inputs: { ...fieldValues },
              response: text,
              ts: new Date().toISOString(),
            };
            setAdvisorHistory(prev => {
              const next = [entry, ...prev].slice(0, 20);
              try { localStorage.setItem("portfolio:advisorHistory", JSON.stringify(next)); } catch {}
              return next;
            });
          } catch (e) {
            setAdvisorError(e.message || "Analysis failed. Try again.");
          } finally {
            setAdvisorLoading(false);
          }
        }

        // ── Auto-populate field defaults from portfolio context ─────────
        function getFieldDefault(tplId, fieldKey) {
          const allH = portfolios.flatMap(p => (holdings[p] || []).map(h => h));
          const fxRate = usdCadRate || 1.38;
          const topTickers = [...allH]
            .filter(h => h.current > 0)
            .sort((a, b) => {
              const av = getTickerCurrency(a.ticker, a.currencyOverride) === "USD" ? a.current * fxRate : a.current;
              const bv = getTickerCurrency(b.ticker, b.currencyOverride) === "USD" ? b.current * fxRate : b.current;
              return bv - av;
            })
            .slice(0, 3)
            .map(h => h.ticker)
            .join(", ");
          if (fieldKey === "tickers") return topTickers;
          if (fieldKey === "focus") {
            const sectors = [...new Set(allH.map(h => {
              if (h.ticker.endsWith(".TO") || CAD_EXEMPT.has(h.ticker)) return "Canadian Equities";
              if (["NVDA","AMD","TSM","AAPL","MSFT","GOOGL","META","AMZN","PLTR","NOW","CRWD","AVGO","MRVL","ANET"].includes(h.ticker)) return "Technology";
              if (["JPM","BAC","GS","V","MA","AXP","TD","RY","BNS","BMO","CM","SCHW","BLK"].includes(h.ticker)) return "Financials";
              if (["XOM","CVX","COP","SLB","OXY","CNQ","ENB","TRP"].includes(h.ticker)) return "Energy";
              if (["LLY","JNJ","ABBV","UNH","NVO","MRK","AMGN"].includes(h.ticker)) return "Healthcare";
              return null;
            }).filter(Boolean))];
            return sectors.slice(0, 2).join(", ") || topTickers;
          }
          return "";
        }

        function selectTemplate(tpl) {
          setAdvisorTemplateId(tpl.id);
          setAdvisorResponse(null);
          setAdvisorError(null);
          setAdvisorIndustry([]);
          const defaults = {};
          tpl.fields.forEach(f => {
            defaults[f.key] = getFieldDefault(tpl.id, f.key);
          });
          setAdvisorInputs(defaults);
        }

        const canRun = selectedTpl && selectedTpl.fields.every(f =>
          (advisorInputs[f.key] || "").trim().length > 0
        );

        // ── Enhanced response renderer ──────────────────────────────────
        function renderAdvisorResponse(text, accentColor) {
          const VERDICT_STYLES = {
            "Strong Buy":   { bg: "#34d399", text: "#052e16" },
            "Strong Sell":  { bg: "#f43f5e", text: "#fff1f2" },
            "Fairly valued":{ bg: "#fbbf24", text: "#1c1700" },
            "Accumulate":   { bg: "#34d399", text: "#052e16" },
            "Undervalued":  { bg: "#34d399", text: "#052e16" },
            "Overvalued":   { bg: "#f43f5e", text: "#fff1f2" },
            "Overbought":   { bg: "#f43f5e", text: "#fff1f2" },
            "Oversold":     { bg: "#34d399", text: "#052e16" },
            "Bullish":      { bg: "#34d399", text: "#052e16" },
            "Bearish":      { bg: "#f43f5e", text: "#fff1f2" },
            "Buy":          { bg: "#34d399", text: "#052e16" },
            "Sell":         { bg: "#f43f5e", text: "#fff1f2" },
            "Reduce":       { bg: "#f97316", text: "#fff" },
            "Hold":         { bg: "#fbbf24", text: "#1c1700" },
            "Neutral":      { bg: "#94a3b8", text: "#0f172a" },
          };
          const VERDICT_RE = /\b(Strong Buy|Strong Sell|Fairly valued|Accumulate|Undervalued|Overvalued|Overbought|Oversold|Bullish|Bearish|Buy|Sell|Reduce|Hold|Neutral)\b/g;

          function renderInline(str, keyPfx) {
            // split on **bold** and verdict keywords
            const parts = str.split(/(\*\*[^*]+\*\*)/);
            return parts.flatMap((part, pi) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return [<strong key={`${keyPfx}-b${pi}`} style={{ color:"#f1f5f9", fontWeight:700 }}>{part.slice(2,-2)}</strong>];
              }
              const segments = part.split(VERDICT_RE);
              return segments.map((seg, si) => {
                const vs = VERDICT_STYLES[seg];
                if (vs) {
                  return (
                    <span key={`${keyPfx}-v${pi}-${si}`} style={{
                      display:"inline-block", padding:"1px 7px", borderRadius:4,
                      fontSize:"0.82em", fontWeight:700, margin:"0 2px", verticalAlign:"middle",
                      background: vs.bg, color: vs.text,
                    }}>{seg}</span>
                  );
                }
                return seg;
              });
            });
          }

          const lines = text.split("\n");
          const elements = [];
          let sectionIdx = 0;

          lines.forEach((line, li) => {
            const t = line.trim();
            if (!t) { elements.push(<div key={`g${li}`} style={{ height:6 }} />); return; }

            // Section header: (1) Title  or  1. Title  or  **1. Title**
            const secM = t.match(/^(?:\*\*)?(?:\((\d+)\)|(\d+)[\.:\)]\s)(.+?)(?:\*\*)?$/);
            if (secM && !t.startsWith("-") && !t.startsWith("•")) {
              const num = secM[1] || secM[2];
              const title = secM[3].replace(/\*\*/g, "");
              if (num && parseInt(num) <= 15) {
                sectionIdx++;
                elements.push(
                  <div key={`sec${li}`} style={{
                    display:"flex", alignItems:"center", gap:10,
                    margin: sectionIdx > 1 ? "20px 0 8px" : "4px 0 8px",
                    paddingBottom:6, borderBottom:`1px solid ${accentColor}22`,
                  }}>
                    <span style={{
                      flexShrink:0, width:22, height:22, borderRadius:"50%",
                      background:`${accentColor}20`, border:`1px solid ${accentColor}55`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:10, fontWeight:800, color:accentColor,
                    }}>{num}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:accentColor }}>
                      {renderInline(title, `sh${li}`)}
                    </span>
                  </div>
                );
                return;
              }
            }

            // Bullet: starts with - • * or  •
            if (/^[-•*]\s/.test(t) || /^•/.test(t)) {
              const content = t.replace(/^[-•*•]\s*/, "");
              elements.push(
                <div key={`bl${li}`} style={{ display:"flex", gap:8, marginBottom:4, paddingLeft:10 }}>
                  <span style={{ flexShrink:0, color:accentColor, marginTop:3, fontSize:9 }}>▸</span>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.78)", lineHeight:1.65 }}>
                    {renderInline(content, `bi${li}`)}
                  </span>
                </div>
              );
              return;
            }

            // Regular paragraph
            elements.push(
              <p key={`p${li}`} style={{ margin:"0 0 5px", fontSize:13, color:"rgba(255,255,255,0.78)", lineHeight:1.7 }}>
                {renderInline(t, `pi${li}`)}
              </p>
            );
          });

          return <div>{elements}</div>;
        }

        // ── Render ─────────────────────────────────────────────────────
        return (
          <div style={{ padding:"22px 28px", display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>

            {/* ── Left column: template library + history ── */}
            <div style={{ flex:"0 0 260px", minWidth:220, display:"flex", flexDirection:"column", gap:12 }}>

              {/* Library header */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                <span style={{ fontSize:18 }}>🧠</span>
                <span style={{ fontSize:14, fontWeight:800, color:"#f1f5f9" }}>AI Advisor</span>
                <span style={{ marginLeft:"auto", fontSize:9, padding:"2px 7px", borderRadius:4,
                  background:"rgba(167,139,250,0.15)", color:"#a78bfa",
                  border:"1px solid rgba(167,139,250,0.3)", fontWeight:600, letterSpacing:"0.1em" }}>
                  PRO
                </span>
              </div>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", margin:"0 0 8px",lineHeight:1.5 }}>
                10 expert prompt templates, pre-loaded with your portfolio context.
              </p>

              {/* Template cards */}
              {AI_ADVISOR_TEMPLATES.map(tpl => {
                const isActive = advisorTemplateId === tpl.id;
                return (
                  <button key={tpl.id} onClick={() => selectTemplate(tpl)}
                    style={{
                      width:"100%", textAlign:"left", cursor:"pointer", borderRadius:10,
                      padding:"11px 13px",
                      background: isActive ? `${tpl.color}18` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isActive ? tpl.color + "55" : "rgba(255,255,255,0.08)"}`,
                      transition:"all 0.15s",
                    }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:15 }}>{tpl.icon}</span>
                      <span style={{ fontSize:12, fontWeight:700,
                        color: isActive ? tpl.color : "#e2e8f0" }}>{tpl.title}</span>
                    </div>
                    <p style={{ margin:0, fontSize:10, color:"rgba(255,255,255,0.38)", lineHeight:1.4 }}>
                      {tpl.desc}
                    </p>
                  </button>
                );
              })}

              {/* History */}
              {advisorHistory.length > 0 && (
                <div style={{ marginTop:8 }}>
                  <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                    color:"rgba(255,255,255,0.25)", fontWeight:600, marginBottom:8 }}>
                    Recent Analyses
                  </p>
                  {advisorHistory.slice(0, 5).map(h => (
                    <button key={h.id} onClick={() => {
                      const tpl = AI_ADVISOR_TEMPLATES.find(t => t.id === h.templateId);
                      if (tpl) {
                        setAdvisorTemplateId(tpl.id);
                        setAdvisorInputs(h.inputs || {});
                        setAdvisorResponse(h.response);
                        setAdvisorError(null);
                      }
                    }} style={{
                      width:"100%", textAlign:"left", cursor:"pointer", padding:"7px 10px",
                      background:"transparent", border:"none", borderRadius:7,
                      borderBottom:"1px solid rgba(255,255,255,0.04)", display:"block",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:12 }}>{h.icon}</span>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", flex:1,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {h.title}
                        </span>
                        <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", flexShrink:0 }}>
                          {new Date(h.ts).toLocaleDateString("en-CA",{month:"short",day:"numeric"})}
                        </span>
                      </div>
                      {h.inputs && Object.values(h.inputs).filter(Boolean).length > 0 && (
                        <p style={{ margin:"3px 0 0 18px", fontSize:9,
                          color:"rgba(255,255,255,0.25)", overflow:"hidden",
                          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {Object.values(h.inputs).filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </button>
                  ))}
                  {advisorHistory.length > 5 && (
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.2)", textAlign:"center", marginTop:4 }}>
                      +{advisorHistory.length - 5} more in history
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Right column: builder + response ── */}
            <div style={{ flex:"1 1 480px", minWidth:300, display:"flex", flexDirection:"column", gap:16 }}>

              {!selectedTpl ? (
                /* ── Welcome screen ── */
                <div className="card" style={{ textAlign:"center", padding:"56px 32px" }}>
                  <div style={{ fontSize:48, marginBottom:16 }}>🧠</div>
                  <p style={{ fontSize:18, fontWeight:800, color:"#f1f5f9", marginBottom:8 }}>
                    AI Financial Advisor
                  </p>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", maxWidth:420,
                    margin:"0 auto 24px", lineHeight:1.6 }}>
                    Choose one of the 10 expert templates on the left. Each analysis is automatically
                    enriched with your live portfolio holdings, market regime, and investor profile.
                  </p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))",
                    gap:10, maxWidth:520, margin:"0 auto" }}>
                    {AI_ADVISOR_TEMPLATES.map(tpl => (
                      <button key={tpl.id} onClick={() => selectTemplate(tpl)}
                        style={{ padding:"14px 10px", borderRadius:10, cursor:"pointer",
                          background:`${tpl.color}10`, border:`1px solid ${tpl.color}30`,
                          display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:22 }}>{tpl.icon}</span>
                        <span style={{ fontSize:10, fontWeight:700, color: tpl.color,
                          textAlign:"center" }}>{tpl.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* ── Prompt builder card ── */}
                  <div className="card" style={{ padding:"20px 22px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                      <span style={{ fontSize:22 }}>{selectedTpl.icon}</span>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:0, fontSize:15, fontWeight:800, color: selectedTpl.color }}>
                          {selectedTpl.title}
                        </p>
                        <p style={{ margin:0, fontSize:11, color:"rgba(255,255,255,0.4)" }}>
                          {selectedTpl.desc}
                        </p>
                      </div>
                      <button onClick={() => { setAdvisorTemplateId(null); setAdvisorResponse(null); }}
                        style={{ fontSize:11, padding:"4px 10px", borderRadius:6, cursor:"pointer",
                          background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                          color:"rgba(255,255,255,0.35)" }}>
                        ← Back
                      </button>
                    </div>

                    {/* Context badge */}
                    <div style={{ marginBottom:14, padding:"8px 12px", borderRadius:8,
                      background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
                      display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>
                        ✅ Auto-injected context:
                      </span>
                      {[
                        `${portfolios.flatMap(p => (holdings[p]||[]).filter(h=>h.current>0)).length} holdings`,
                        `C$${Math.round(portfolios.reduce((s,p)=>{
                          return s+(holdings[p]||[]).reduce((a,h)=>{
                            const c=getTickerCurrency(h.ticker,h.currencyOverride);
                            return a+(c==="USD"?h.current*usdCadRate:h.current);
                          },0);
                        },0)).toLocaleString()} portfolio`,
                        marketPulse?.regime?.label || null,
                        investorProfile ? `${investorProfile.riskTolerance} risk` : null,
                      ].filter(Boolean).map(label => (
                        <span key={label} style={{ fontSize:9, padding:"2px 7px", borderRadius:4,
                          background:"rgba(167,139,250,0.1)", color:"#a78bfa",
                          border:"1px solid rgba(167,139,250,0.2)" }}>
                          {label}
                        </span>
                      ))}
                      {ADVISOR_INDUSTRIES.filter(i => advisorIndustry.includes(i.id)).map(ind => (
                        <span key={ind.id} style={{ fontSize:9, padding:"2px 7px", borderRadius:4,
                          background:`${ind.color}18`, color:ind.color,
                          border:`1px solid ${ind.color}40` }}>
                          {ind.icon} {ind.label}
                        </span>
                      ))}
                    </div>

                    {/* Industry selector */}
                    <div style={{ marginBottom:14 }}>
                      <label style={{ fontSize:10, fontWeight:700, letterSpacing:"0.09em",
                        textTransform:"uppercase", color:"rgba(255,255,255,0.35)",
                        display:"block", marginBottom:7 }}>
                        Industry Focus <span style={{ opacity:0.5, fontWeight:400, textTransform:"none" }}>(optional)</span>
                      </label>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        {ADVISOR_INDUSTRIES.map(ind => {
                          const active = advisorIndustry.includes(ind.id);
                          return (
                            <button key={ind.id}
                              onClick={() => {
                                const next = active
                                  ? advisorIndustry.filter(id => id !== ind.id)
                                  : [...advisorIndustry, ind.id];
                                setAdvisorIndustry(next);
                                if (selectedTpl.fields.some(f => f.key === "focus")) {
                                  const labels = ADVISOR_INDUSTRIES.filter(i => next.includes(i.id)).map(i => i.label);
                                  setAdvisorInputs(prev => ({ ...prev, focus: labels.join(", ") }));
                                }
                              }}
                              style={{
                                padding:"4px 10px", borderRadius:20, cursor:"pointer", fontSize:11,
                                background: active ? `${ind.color}25` : "rgba(255,255,255,0.04)",
                                border:`1px solid ${active ? ind.color+"60" : "rgba(255,255,255,0.1)"}`,
                                color: active ? ind.color : "rgba(255,255,255,0.45)",
                                fontWeight: active ? 700 : 400, transition:"all 0.12s",
                              }}>
                              {ind.icon} {ind.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Input fields */}
                    <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
                      {selectedTpl.fields.map(field => (
                        <div key={field.key}>
                          <label style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.6)",
                            display:"block", marginBottom:5 }}>
                            {field.label}
                          </label>
                          <input
                            type="text"
                            value={advisorInputs[field.key] || ""}
                            placeholder={field.placeholder}
                            onChange={e => setAdvisorInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                            style={{
                              width:"100%", boxSizing:"border-box",
                              padding:"9px 12px", borderRadius:8, fontSize:13,
                              background:"rgba(255,255,255,0.05)",
                              border:`1px solid ${selectedTpl.color}40`,
                              color:"#f1f5f9", outline:"none",
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Run button */}
                    <button onClick={runAdvisorQuery} disabled={!canRun || advisorLoading}
                      style={{
                        width:"100%", padding:"12px", borderRadius:9, cursor: canRun && !advisorLoading ? "pointer" : "not-allowed",
                        background: canRun && !advisorLoading ? `${selectedTpl.color}22` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${canRun && !advisorLoading ? selectedTpl.color + "55" : "rgba(255,255,255,0.08)"}`,
                        color: canRun && !advisorLoading ? selectedTpl.color : "rgba(255,255,255,0.2)",
                        fontWeight:700, fontSize:13, transition:"all 0.15s",
                      }}>
                      {advisorLoading ? "⏳ Analysing…" : `${selectedTpl.icon} Run Analysis`}
                    </button>

                    {advisorError && (
                      <p style={{ margin:"10px 0 0", fontSize:12, color:"#f43f5e" }}>
                        ⚠ {advisorError}
                      </p>
                    )}
                  </div>

                  {/* ── Response card ── */}
                  {(advisorResponse || advisorLoading) && (
                    <div className="card" style={{ padding:"20px 22px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                        <span style={{ fontSize:14 }}>{selectedTpl.icon}</span>
                        <span style={{ fontSize:13, fontWeight:700, color: selectedTpl.color }}>
                          Analysis
                        </span>
                        {advisorLoading && (
                          <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)",
                            animation:"pulse 1.5s infinite" }}>
                            generating…
                          </span>
                        )}
                        {advisorResponse && !advisorLoading && (
                          <button onClick={() => {
                            navigator.clipboard?.writeText(advisorResponse).catch(() => {});
                          }} style={{
                            marginLeft:"auto", fontSize:10, padding:"3px 9px", borderRadius:6,
                            cursor:"pointer", background:"rgba(255,255,255,0.05)",
                            border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)",
                          }}>
                            Copy
                          </button>
                        )}
                      </div>

                      {advisorLoading ? (
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {[90, 75, 85, 60, 70].map((w, i) => (
                            <div key={i} style={{
                              height:12, borderRadius:6, background:"rgba(255,255,255,0.06)",
                              width:`${w}%`, animation:"pulse 1.5s infinite",
                              animationDelay: `${i * 0.12}s`,
                            }}/>
                          ))}
                        </div>
                      ) : (
                        <div style={{ wordBreak:"break-word" }}>
                          {renderAdvisorResponse(advisorResponse, selectedTpl.color)}
                        </div>
                      )}

                      {advisorResponse && !advisorLoading && (
                        <div style={{ marginTop:18, paddingTop:14,
                          borderTop:"1px solid rgba(255,255,255,0.06)",
                          display:"flex", alignItems:"center", justifyContent:"space-between",
                          flexWrap:"wrap", gap:10 }}>
                          <p style={{ margin:0, fontSize:9, color:"rgba(255,255,255,0.2)" }}>
                            ⚠ Not financial advice. For educational purposes only.
                            Consult a licensed financial advisor before investing.
                          </p>
                          <button onClick={runAdvisorQuery}
                            style={{ fontSize:10, padding:"4px 12px", borderRadius:6,
                              cursor:"pointer", background:`${selectedTpl.color}15`,
                              border:`1px solid ${selectedTpl.color}35`,
                              color: selectedTpl.color }}>
                            Regenerate ↺
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: HELP
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "help" && (() => {
        const H2 = ({ icon, title }) => (
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:36, marginBottom:14 }}>
            <span style={{ fontSize:20 }}>{icon}</span>
            <span style={{ fontSize:16, fontWeight:800, color:"#f1f5f9" }}>{title}</span>
          </div>
        );
        const H3 = ({ children }) => (
          <p style={{ fontSize:13, fontWeight:700, color:"#fbbf24", margin:"18px 0 6px", textTransform:"uppercase", letterSpacing:"0.06em" }}>{children}</p>
        );
        const P = ({ children }) => (
          <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.75, margin:"0 0 10px" }}>{children}</p>
        );
        const Tip = ({ children }) => (
          <div style={{ background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:10,
            padding:"12px 16px", fontSize:13, color:"#fbbf24", lineHeight:1.65, marginBottom:10 }}>
            <strong>Tip: </strong>{children}
          </div>
        );
        const Note = ({ children }) => (
          <div style={{ background:"rgba(34,211,238,0.06)", border:"1px solid rgba(34,211,238,0.18)", borderRadius:10,
            padding:"12px 16px", fontSize:13, color:"#67e8f9", lineHeight:1.65, marginBottom:10 }}>
            <strong>Note: </strong>{children}
          </div>
        );
        const Step = ({ n, children }) => (
          <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:10 }}>
            <span style={{ flexShrink:0, width:24, height:24, borderRadius:"50%", background:"rgba(251,191,36,0.15)",
              border:"1px solid rgba(251,191,36,0.3)", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontWeight:800, color:"#fbbf24" }}>{n}</span>
            <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.7, margin:0 }}>{children}</p>
          </div>
        );
        const Badge = ({ children, color="#fbbf24" }) => (
          <span style={{ background:`${color}18`, border:`1px solid ${color}40`, borderRadius:6,
            padding:"2px 8px", fontSize:12, fontWeight:700, color, marginRight:4 }}>{children}</span>
        );

        return (
          <div style={{ padding:"28px 32px", maxWidth:860, margin:"0 auto" }}>

            {/* ── Hero ── */}
            <div style={{ background:"linear-gradient(135deg,rgba(251,191,36,0.08),rgba(34,211,238,0.05))",
              border:"1px solid rgba(251,191,36,0.18)", borderRadius:16, padding:"28px 32px", marginBottom:8 }}>
              <p style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", margin:"0 0 8px" }}>
                Getting the most from Portfolio Rebalancer Pro
              </p>
              <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.7, margin:0 }}>
                This app helps Canadian investors (TFSA, RRSP, and other accounts) track holdings,
                plan rebalancing trades, run DCA schedules, and optionally generate covered-call and
                cash-secured-put income — with optional Claude AI assistance on the Pro plan.
              </p>
            </div>

            {/* ── CTA ── */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap",
              gap:12, margin:"20px 0 4px" }}>
              <p style={{ fontSize:13, color:"#64748b", margin:0 }}>
                Read the guide below, then jump in whenever you're ready.
              </p>
              <button
                onClick={() => navigateTo("dashboard")}
                style={{ background:"linear-gradient(135deg,#fbbf24,#f59e0b)", color:"#0d1117",
                  border:"none", borderRadius:10, padding:"11px 22px", fontWeight:800,
                  fontSize:14, fontFamily:"inherit", cursor:"pointer", whiteSpace:"nowrap",
                  boxShadow:"0 4px 16px rgba(251,191,36,0.3)" }}>
                Start using the app →
              </button>
            </div>

            {/* ── Quick-start ── */}
            <H2 icon="🚀" title="Quick Start — 5 steps to a live portfolio" />
            <Step n="1">Open <strong style={{color:"#f1f5f9"}}>Edit Targets</strong> (🎯 tab) and update each row with your <em>actual current value</em> in the Current $ column and your desired <em>target allocation %</em>. All targets in a single account must sum to 100%.</Step>
            <Step n="2">Switch to <strong style={{color:"#f1f5f9"}}>Dashboard</strong> (📊 tab) to see a live snapshot of your total portfolio value, currency split, and which positions are overweight or underweight.</Step>
            <Step n="3">When you have new cash to invest, go to <strong style={{color:"#f1f5f9"}}>Rebalance</strong> (⚖️ tab), enter the amount, and the app will calculate exactly how much to buy to bring each holding towards its target.</Step>
            <Step n="4">Set up a <strong style={{color:"#f1f5f9"}}>DCA Plan</strong> (📅 tab) to see how regular contributions grow your portfolio over time — weekly, bi-weekly, or monthly.</Step>
            <Step n="5">Browse <strong style={{color:"#f1f5f9"}}>Ideas</strong> (💡 tab) and <strong style={{color:"#f1f5f9"}}>Search</strong> (🔍 tab) to discover new positions, then add them directly to your Edit Targets list.</Step>

            {/* ── Tab-by-tab guide ── */}
            <H2 icon="📊" title="Dashboard" />
            <P>The Dashboard gives you a birds-eye view of everything at once: total value across all accounts, TFSA vs RRSP split, USD vs CAD currency exposure, dividend yield, and a pie chart of your largest holdings.</P>
            <Tip>Set your <strong>USD/CAD rate</strong> in the input at the top of the app. Everything is converted to CAD for the total — the default is 1.36 but update it whenever the rate moves significantly.</Tip>

            <H2 icon="⚖️" title="Rebalance" />
            <P>Enter the cash you have available and choose a mode:</P>
            <H3>Cash-deploy mode (default)</H3>
            <P>Ranks your underweight positions and suggests exactly how much of each to buy. No selling required — ideal for regular contributions.</P>
            <H3>Full rebalance mode</H3>
            <P>Also recommends trimming overweight positions. Use this once or twice a year for a full rebalance, or before a large withdrawal.</P>
            <Tip>The rebalance calculation respects your account. If you are on the RRSP tab, it only rebalances RRSP holdings. Switch accounts using the portfolio tabs at the top.</Tip>
            <Note>Amounts are displayed in the native currency of each ticker (CAD for TSX-listed stocks, USD for NYSE/NASDAQ). Check which currency your broker account is in before placing trades.</Note>

            <H2 icon="📅" title="DCA Plan" />
            <P>Dollar-cost averaging (DCA) means investing a fixed amount on a regular schedule rather than timing the market. Enter your planned contribution amount and pick a frequency (weekly, bi-weekly, or monthly). The app projects how each holding grows over 5 and 10 years using the estimated CAGR for each position.</P>
            <Tip>You can override the CAGR for any individual holding in Edit Targets to make projections more conservative or aggressive for specific names.</Tip>

            <H2 icon="🎯" title="Edit Targets" />
            <P>This is your portfolio ledger. Every holding lives here. Key columns:</P>
            <H3>Current $</H3>
            <P>Your current market value in that position. Update this regularly (weekly or monthly) to keep rebalance calculations accurate. You can also import directly from a Wealthsimple CSV export (Pro feature).</P>
            <H3>Target %</H3>
            <P>Your desired allocation. The rebalance engine uses this. Targets within each account must add up to 100% — the app shows a warning if they do not.</P>
            <H3>Div Yield %</H3>
            <P>Annual dividend yield. Used in the Dashboard income estimate. Leave at 0 for non-dividend positions.</P>
            <H3>Cost Basis $</H3>
            <P>What you originally paid. Used to calculate unrealized gain/loss in the Dashboard. Optional but recommended.</P>
            <Tip>Use the <strong>Lock</strong> column (✅ Keep / ❌ SELL / 🆕 NEW) as a note to yourself — it does not affect calculations but helps you track intended actions at a glance.</Tip>

            <H2 icon="💡" title="Ideas" />
            <P>A curated database of {">"}100 tickers analyzed for Canadian investors. Each entry includes a thesis, estimated CAGR, dividend yield, sector, and a regime-alignment flag showing whether the current market environment favours this pick.</P>
            <H3>Filters</H3>
            <P>Filter by account type (TFSA-friendly vs RRSP-friendly), risk level, or sector. <Badge>TFSA optimal</Badge> tickers have no or minimal US withholding tax drag. <Badge color="#22d3ee">RRSP optimal</Badge> tickers pay US dividends that are sheltered by the Canada–US tax treaty.</P>
            <Tip>Click <strong>"Add to targets"</strong> on any idea to instantly create a row in Edit Targets with pre-filled name, yield, and CAGR — then just set your target %.</Tip>

            <H2 icon="🔍" title="Search" />
            <P>Look up any ticker in our curated database for a quick one-page deep-dive: thesis, valuation context, sector, risk level, and recommended account placement. If a ticker is not in the database you can still add it manually or send it to AI for analysis (Pro only).</P>

            <H2 icon="📡" title="Market Pulse" />
            <P>A macro snapshot built for Canadian investors: VIX (fear gauge), yield curve shape, S&P 500 trend, oil price (important for the TSX), CAD/USD rate, and an overall market regime label — Risk-On, Neutral, or Risk-Off.</P>
            <H3>How to use it</H3>
            <P>Check Market Pulse before each rebalance. In a <strong style={{color:"#22c55e"}}>Risk-On</strong> regime, lean into growth positions. In a <strong style={{color:"#ef4444"}}>Risk-Off</strong> regime, favour defensive names and reduce new exposure to high-beta tickers. The Ideas tab flags which picks are <Badge color="#22c55e">Regime aligned</Badge> or <Badge color="#ef4444">Regime avoid</Badge> for the current environment.</P>
            <Note>Data is pre-loaded at publish time. Pro users can refresh it with a live Claude AI call to get current data and commentary.</Note>

            <H2 icon="⚡" title="Options" />
            <P>Generate income from positions you already own using two conservative strategies, find the best tickers to trade spreads on, and track every trade in one place.</P>
            <H3>📊 Spread Scanner — daily vertical spread signals</H3>
            <P>Every morning at 5:30 PM ET (after close) the app runs a full technical scan across 69 liquid optionable tickers and scores each one 0–100 for vertical spread suitability. The score combines five signals: Volume ratio (options liquidity), RSI in the 35–65 premium-selling sweet spot, MACD histogram direction and magnitude, price position relative to SMA 50 and SMA 200, and 20-day VWAP proximity. Each ticker gets a recommendation: <strong style={{color:"#22c55e"}}>Bull Put Spread</strong>, <strong style={{color:"#ef4444"}}>Bear Call Spread</strong>, <strong style={{color:"#a78bfa"}}>Iron Condor</strong>, <strong style={{color:"#fbbf24"}}>Caution</strong>, or <strong style={{color:"rgba(255,255,255,0.4)"}}>Skip</strong>. No setup required — the data loads automatically when you open the scanner tab.</P>
            <H3>Covered Calls (CC)</H3>
            <P>You own 100+ shares of a stock. You sell someone the right to buy them from you at a higher price (the strike) by a set date. If the stock stays below the strike, you keep the premium as pure income. If it rises above, your shares get called away at the strike — you still profit, just miss the upside above that level.</P>
            <H3>Cash-Secured Puts (CSP)</H3>
            <P>You set aside cash equal to 100 shares × the strike price. You sell someone the right to sell shares to you at that price. If the stock stays above the strike, you keep the premium. If it falls below, you buy the shares at the strike — essentially getting paid to buy a stock you wanted anyway at a discount.</P>
            <H3>Strike calculator</H3>
            <P>Enter a ticker, number of contracts, and expiry. The app suggests three strikes (conservative, moderate, aggressive) with estimated premium ranges based on the current VIX environment. Always verify with your broker — these are approximations, not live quotes.</P>
            <H3>Trade log</H3>
            <P>Record every options trade and track your running P&amp;L, win rate, and total premium collected. Mark trades as Expired worthless, Assigned, Closed for profit, or Closed for loss.</P>
            <Tip>Covered calls and CSPs are permitted in Canadian registered accounts (TFSA and RRSP) at most brokers, but rules vary. Confirm with your broker before trading inside a registered account. The Spread Scanner is a starting point — always verify signals with your broker's live options chain before placing trades.</Tip>

            {/* ── Canadian account strategy ── */}
            <H2 icon="🍁" title="TFSA vs RRSP — which holdings go where?" />
            <P>This is one of the most valuable optimisations a Canadian investor can make. The wrong placement costs you real money every year in withholding tax.</P>
            <H3>Put in your TFSA</H3>
            <P><Badge>Canadian stocks & ETFs</Badge> No withholding tax. Growth is 100% tax-free. <Badge>High-growth, no-dividend US stocks</Badge> (NVDA, AMZN, PLTR, etc.) — no dividend to leak, so no WHT drag.</P>
            <H3>Put in your RRSP</H3>
            <P><Badge color="#22d3ee">US dividend payers</Badge> (MSFT, AAPL, VTI, etc.) — the Canada–US tax treaty eliminates the 15% withholding tax on US dividends inside an RRSP. This can save hundreds of dollars per year on a large portfolio. <Badge color="#22d3ee">International ETFs</Badge> that hold US-listed shares also benefit.</P>
            <Tip>The Ideas tab and the notes column in Edit Targets both show account placement recommendations for every holding. Look for the "MOVE TO RRSP" and "WHT" notes.</Tip>

            {/* ── Pro vs Basic ── */}
            <H2 icon="🔑" title="Basic vs Pro — what's included?" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:8 }}>
              {[
                { tier:"Basic — $49 CAD/yr", color:"#fbbf24", features:[
                  "All portfolio tabs (Dashboard, Rebalance, DCA, Targets)",
                  "Ideas database & Search",
                  "Options strike calculator & trade log",
                  "📊 Spread Scanner — daily auto-refresh at 5:30 PM ET (after close)",
                  "📰 BNN Bloomberg expert picks (weekday mornings)",
                  "Market Pulse (pre-loaded data)",
                  "Manual ticker entry & CSV import (basic)",
                  "Up to 3 devices",
                ]},
                { tier:"Pro — $99 CAD/yr", color:"#22c55e", features:[
                  "Everything in Basic (incl. Spread Scanner + BNN picks)",
                  "Claude AI: live Market Pulse refresh with commentary",
                  "Claude AI: Target Suggestions (AI-generated allocations)",
                  "Claude AI: Diversification analysis & gap detection",
                  "Claude AI: Options AI — ranked CC + CSP suggestions",
                  "Wealthsimple broker import (auto-fill current values)",
                  "10 AI calls per day",
                ]},
              ].map(({ tier, color, features }) => (
                <div key={tier} style={{ background:`${color}08`, border:`1px solid ${color}28`, borderRadius:12, padding:"18px 20px" }}>
                  <p style={{ fontSize:13, fontWeight:800, color, margin:"0 0 12px" }}>{tier}</p>
                  {features.map(f => (
                    <div key={f} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:7 }}>
                      <span style={{ color, flexShrink:0, marginTop:1 }}>✓</span>
                      <span style={{ fontSize:12, color:"#94a3b8", lineHeight:1.55 }}>{f}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* ── Best practices ── */}
            <H2 icon="💎" title="Best practices for getting the most out of this app" />
            <Step n="1"><strong style={{color:"#f1f5f9"}}>Update current values monthly</strong> — even rough estimates keep the rebalance recommendations meaningful. Set a reminder on the first of each month.</Step>
            <Step n="2"><strong style={{color:"#f1f5f9"}}>Check Market Pulse before each rebalance</strong> — deploying cash into a Risk-Off regime without adjusting can amplify losses. Use the regime signal to size your buys conservatively in volatile markets.</Step>
            <Step n="3"><strong style={{color:"#f1f5f9"}}>Let the rebalance engine do the math</strong> — avoid the temptation to override every suggestion. The engine compounds allocation discipline over years; emotion-driven tweaks usually hurt returns.</Step>
            <Step n="4"><strong style={{color:"#f1f5f9"}}>Set your investor profile</strong> (👤 button in the header) — risk tolerance, age, and goal inform every AI suggestion and the Ideas regime alignment scores.</Step>
            <Step n="5"><strong style={{color:"#f1f5f9"}}>Use DCA, not lump-sum, in volatile markets</strong> — the DCA Plan tab lets you model what a $500/month contribution looks like over 10 years. Small, consistent amounts beat irregular large investments in most back-tests.</Step>
            <Step n="6"><strong style={{color:"#f1f5f9"}}>Keep targets realistic</strong> — if a position has a 0% target it will always appear as overweight. Either remove it from the list or set a small non-zero target if you plan to hold a residual position.</Step>
            <Step n="7"><strong style={{color:"#f1f5f9"}}>Use the Notes column</strong> — write your own investment thesis in the notes. Reading it during a drawdown is the best reminder of why you bought and often prevents panic-selling.</Step>

            <div style={{ textAlign:"center", margin:"32px 0 20px" }}>
              <button
                onClick={() => navigateTo("dashboard")}
                style={{ background:"linear-gradient(135deg,#fbbf24,#f59e0b)", color:"#0d1117",
                  border:"none", borderRadius:10, padding:"13px 32px", fontWeight:800,
                  fontSize:15, fontFamily:"inherit", cursor:"pointer",
                  boxShadow:"0 4px 20px rgba(251,191,36,0.35)" }}>
                I'm ready — take me to the app →
              </button>
            </div>

            <p style={{ fontSize:11, color:"rgba(255,255,255,0.15)", lineHeight:1.7, textAlign:"center" }}>
              Not financial advice. All calculations are for informational purposes only. Always consult a qualified financial advisor before making investment decisions.
              Tax treatment depends on your individual circumstances — consult a tax professional for personalized guidance.
            </p>
            <div style={{ height:24 }} />
          </div>
        );
      })()}

      {/* ── Broker import preview modal ── */}
      {brokerImportPreview && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", zIndex:9999,
          display:"flex", alignItems:"center", justifyContent:"center", padding:24,
        }} onClick={() => setBrokerImportPreview(null)}>
          <div style={{
            background:"#1e293b", border:"1px solid rgba(251,191,36,0.3)",
            borderRadius:14, padding:"28px 32px", maxWidth:560, width:"100%",
            maxHeight:"90vh", overflowY:"auto",
            boxShadow:"0 24px 60px rgba(0,0,0,0.6)",
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize:15, fontWeight:700, color:"#f1f5f9", marginBottom:6 }}>
              🏦 Broker Import Ready
            </p>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:20, lineHeight:1.5 }}>
              Claude parsed your CSV. For each detected account, choose the portfolio it should
              load into and whether to <strong style={{color:"rgba(255,255,255,0.6)"}}>Replace</strong> all
              existing holdings or <strong style={{color:"rgba(255,255,255,0.6)"}}>Merge</strong> (update
              existing tickers, add new ones, keep everything else).
              {brokerImportPreview.skipped > 0 && (
                <span style={{ display:"block", marginTop:6, color:"#94a3b8" }}>
                  ✂ {brokerImportPreview.skipped} managed/private-equity position{brokerImportPreview.skipped !== 1 ? "s" : ""} excluded automatically.
                </span>
              )}
            </p>

            {/* Account mapping table */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto",
                gap:"6px 10px", alignItems:"center", marginBottom:8 }}>
                <p style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em",
                  color:"rgba(255,255,255,0.3)", fontWeight:600 }}>CSV Account</p>
                <p style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em",
                  color:"rgba(255,255,255,0.3)", fontWeight:600 }}>Load into Portfolio</p>
                <p style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em",
                  color:"rgba(255,255,255,0.3)", fontWeight:600 }}>Mode</p>
              </div>
              {(brokerImportPreview.csvRawAcctNames || Object.keys(brokerImportPreview.byAccount)).map(rawAcct => {
                const m = brokerImportMapping[rawAcct] || { target: normalizeWsAccountName(rawAcct), mode:"replace" };
                const { count, totalCAD } = brokerImportPreview.byAccount[rawAcct] || { count:0, totalCAD:0 };
                return (
                  <div key={rawAcct} style={{ display:"grid",
                    gridTemplateColumns:"1fr 1fr auto", gap:"6px 10px",
                    alignItems:"center", marginBottom:8,
                    background:"rgba(255,255,255,0.03)", borderRadius:8,
                    padding:"10px 12px", border:"1px solid rgba(255,255,255,0.07)" }}>
                    {/* CSV account name */}
                    <div>
                      <p style={{ fontSize:12, fontWeight:600, color:"#fbbf24", margin:0 }}>{rawAcct}</p>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", margin:0 }}>
                        {count} pos · C${Math.round(totalCAD).toLocaleString()}
                      </p>
                    </div>
                    {/* Target portfolio selector */}
                    <select
                      value={m.target}
                      onChange={e => setBrokerImportMapping(prev => ({
                        ...prev,
                        [rawAcct]: { ...m, target: e.target.value },
                      }))}
                      style={{ fontSize:11, padding:"5px 8px",
                        background:"rgba(255,255,255,0.07)",
                        border:"1px solid rgba(255,255,255,0.15)",
                        borderRadius:6, color:"rgba(255,255,255,0.85)",
                        cursor:"pointer" }}>
                      {/* Existing portfolios */}
                      {portfolios.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                      {/* Normalised name if not already in list */}
                      {!portfolios.includes(normalizeWsAccountName(rawAcct)) && (
                        <option value={normalizeWsAccountName(rawAcct)}>
                          {normalizeWsAccountName(rawAcct)} (new)
                        </option>
                      )}
                      {/* If custom target isn't a known portfolio name */}
                      {m.target && !portfolios.includes(m.target) && m.target !== normalizeWsAccountName(rawAcct) && (
                        <option value={m.target}>{m.target} (new)</option>
                      )}
                    </select>
                    {/* Mode selector */}
                    <select
                      value={m.mode}
                      onChange={e => setBrokerImportMapping(prev => ({
                        ...prev,
                        [rawAcct]: { ...m, mode: e.target.value },
                      }))}
                      style={{ fontSize:11, padding:"5px 8px",
                        background: m.mode === "merge"
                          ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.07)",
                        border:`1px solid ${m.mode === "merge"
                          ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.2)"}`,
                        borderRadius:6,
                        color: m.mode === "merge" ? "#22c55e" : "#f87171",
                        cursor:"pointer" }}>
                      <option value="replace">Replace</option>
                      <option value="merge">Merge</option>
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Mode legend */}
            <div style={{ display:"flex", gap:16, marginBottom:20,
              padding:"8px 12px", background:"rgba(255,255,255,0.03)",
              borderRadius:8, border:"1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0, lineHeight:1.5 }}>
                <span style={{ color:"#f87171", fontWeight:600 }}>Replace</span>
                {" "}— clears the target portfolio and loads these holdings fresh.{" "}
                <span style={{ color:"#22c55e", fontWeight:600 }}>Merge</span>
                {" "}— updates tickers that already exist and adds new ones; everything else stays.
              </p>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button className="btn btn-primary" style={{ flex:1, padding:"10px 0", fontSize:13 }}
                onClick={applyBrokerImport}>
                ✓ Import {brokerImportPreview.rows.length} holdings
              </button>
              <button className="btn" style={{ padding:"10px 16px", fontSize:13 }}
                onClick={() => { setBrokerImportPreview(null); setBrokerImportMapping({}); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Targets preview modal ── */}
      {aiTargetsPreview && (() => {
        const { suggestions } = aiTargetsPreview;
        const newSum = suggestions.reduce((s, x) => s + x.target, 0);
        const oldSum = suggestions.reduce((s, x) => s + x.oldTarget, 0);
        return (
          <div style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:9999,
            display:"flex", alignItems:"center", justifyContent:"center", padding:24,
          }} onClick={() => setAiTargetsPreview(null)}>
            <div style={{
              background:"#1e293b", border:"1px solid rgba(167,139,250,0.35)",
              borderRadius:14, padding:"28px 32px", maxWidth:680, width:"100%",
              maxHeight:"85vh", overflowY:"auto",
              boxShadow:"0 24px 60px rgba(0,0,0,0.65)",
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <p style={{ fontSize:15, fontWeight:700, color:"#f1f5f9", margin:0 }}>
                  ✨ AI Target Suggestions — {aiTargetsPreview.account}
                </p>
                <span style={{
                  fontSize:11, padding:"3px 10px", borderRadius:20,
                  background: Math.abs(newSum - 100) <= 1 ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)",
                  border: `1px solid ${Math.abs(newSum - 100) <= 1 ? "rgba(52,211,153,0.4)" : "rgba(239,68,68,0.4)"}`,
                  color: Math.abs(newSum - 100) <= 1 ? "#34d399" : "#ef4444",
                  fontWeight:600,
                }}>
                  Total: {newSum}%
                </span>
              </div>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:18 }}>
                Review before applying — targets, CAGR, and dividend yield will be updated. Cost basis and current values are unchanged.
              </p>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                      {(() => {
                        const onSort = col => setAiSugSort(s => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
                        const ts = { padding:"6px 10px", textAlign:"left", color:"rgba(255,255,255,0.4)", fontWeight:500, fontSize:10, letterSpacing:"0.08em", whiteSpace:"nowrap" };
                        return (<>
                          <SortTh col="ticker"   label="Ticker"    sort={aiSugSort} onSort={onSort} style={ts} />
                          <th style={ts}>Was → Now</th>
                          <SortTh col="delta"    label="Δ"         sort={aiSugSort} onSort={onSort} style={ts} />
                          <SortTh col="cagr"     label="CAGR"      sort={aiSugSort} onSort={onSort} style={ts} />
                          <SortTh col="div"      label="Div%"      sort={aiSugSort} onSort={onSort} style={ts} />
                          <th style={ts}>Rationale</th>
                        </>);
                      })()}
                    </tr>
                  </thead>
                  <tbody>
                    {sortRows(suggestions, aiSugSort.col, aiSugSort.dir, (s, col) => ({
                      ticker: s.ticker, delta: s.target - s.oldTarget,
                      cagr: s.cagr, div: s.divYield,
                    }[col] ?? null)).map(s => {
                      const delta = s.target - s.oldTarget;
                      const deltaColor = delta > 0 ? "#34d399" : delta < 0 ? "#f87171" : "rgba(255,255,255,0.25)";
                      return (
                        <tr key={s.ticker} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding:"8px 10px", fontWeight:700, color:"#a78bfa" }}>{s.ticker}</td>
                          <td style={{ padding:"8px 10px", whiteSpace:"nowrap", fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>
                            <span style={{ color:"rgba(255,255,255,0.35)" }}>{s.oldTarget}%</span>
                            <span style={{ color:"rgba(255,255,255,0.2)", margin:"0 4px" }}>→</span>
                            <span style={{ color:"#f1f5f9", fontWeight:600 }}>{s.target}%</span>
                          </td>
                          <td style={{ padding:"8px 10px", color:deltaColor, fontWeight:600, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>
                            {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${delta}%`}
                          </td>
                          <td style={{ padding:"8px 10px", color:"#a78bfa" }}>{s.cagr}%</td>
                          <td style={{ padding:"8px 10px", color:"rgba(255,255,255,0.55)" }}>{s.divYield}%</td>
                          <td style={{ padding:"8px 10px", color:"rgba(255,255,255,0.5)", fontSize:11, maxWidth:240 }}>{s.rationale}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.02)" }}>
                      <td style={{ padding:"8px 10px", fontWeight:700, color:"rgba(255,255,255,0.6)", fontSize:11 }}>TOTAL</td>
                      <td style={{ padding:"8px 10px", fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>
                        <span style={{ color:"rgba(255,255,255,0.35)" }}>{oldSum}%</span>
                        <span style={{ color:"rgba(255,255,255,0.2)", margin:"0 4px" }}>→</span>
                        <span style={{ color: Math.abs(newSum - 100) <= 1 ? "#34d399" : "#ef4444", fontWeight:700 }}>{newSum}%</span>
                      </td>
                      <td colSpan={4}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:20 }}>
                <button className="btn btn-primary" style={{ flex:1, padding:"10px 0", fontSize:13 }}
                  onClick={applyAiTargets}>
                  ✓ Apply targets
                </button>
                <button className="btn" style={{ padding:"10px 16px", fontSize:13 }}
                  onClick={() => setAiTargetsPreview(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════ INVESTOR PROFILE MODAL ════════════════════════════════════ */}
      {showProfileModal && (() => {
        const draft = profileDraft || investorProfile || {};
        const set   = (k, v) => setProfileDraft(d => ({ ...(d || draft), [k]: v }));
        const yearsToRetirement = draft.age ? Math.max(0, (draft.retirementAge || 65) - Number(draft.age)) : null;

        const RISK_OPTIONS = [
          { key:"conservative", label:"Conservative",
            desc:"Preserve capital first. OK with 4–6% annual return if it means minimal volatility.",
            icon:"🛡", color:"#22d3ee" },
          { key:"balanced",     label:"Balanced",
            desc:"Mix of growth and stability. Can handle 20–30% market swings without panic-selling.",
            icon:"⚖️", color:"#a78bfa" },
          { key:"growth",       label:"Growth",
            desc:"Maximize long-term wealth. Comfortable holding through 40%+ drawdowns.",
            icon:"📈", color:"#22c55e" },
          { key:"aggressive",   label:"Aggressive",
            desc:"Maximum growth potential. Can handle near-total drawdowns on any single position.",
            icon:"🚀", color:"#f97316" },
        ];
        const GOAL_OPTIONS = [
          { key:"retirement",    label:"Retirement Income",   desc:"Build a nest egg that funds your lifestyle in retirement.", icon:"🏖" },
          { key:"growth",        label:"Wealth Accumulation", desc:"Compound your portfolio as aggressively as possible.", icon:"💰" },
          { key:"income",        label:"Dividend Income",     desc:"Generate regular, growing income from dividends now.", icon:"💵" },
          { key:"preservation",  label:"Capital Preservation",desc:"Protect what you have with modest, steady growth.", icon:"🔒" },
        ];

        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.80)", zIndex:10000,
            display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
            onClick={() => setShowProfileModal(false)}>
            <div style={{ background:"#1e293b", border:"1px solid rgba(167,139,250,0.35)",
              borderRadius:16, padding:"32px 36px", maxWidth:560, width:"100%",
              maxHeight:"92vh", overflowY:"auto",
              boxShadow:"0 32px 80px rgba(0,0,0,0.7)" }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ marginBottom:24 }}>
                <p style={{ fontSize:18, fontWeight:700, color:"#f1f5f9", margin:0 }}>
                  👤 Investor Profile
                </p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>
                  Your answers personalise Ideas, AI targets, and all AI recommendations.
                </p>
              </div>

              {/* Q1: Age */}
              <div style={{ marginBottom:24 }}>
                <p style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.8)", marginBottom:10 }}>
                  How old are you?
                </p>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <input type="number" min={18} max={90}
                    value={draft.age || ""}
                    placeholder="e.g. 38"
                    onChange={e => set("age", e.target.value)}
                    style={{ width:100, fontSize:20, padding:"8px 12px", textAlign:"center",
                      background:"rgba(255,255,255,0.07)", border:"1px solid rgba(167,139,250,0.3)",
                      borderRadius:8, color:"#a78bfa", fontFamily:"'JetBrains Mono',monospace",
                      fontWeight:700 }} />
                  {yearsToRetirement !== null && (
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)" }}>
                      → <strong style={{ color:"#a78bfa" }}>{yearsToRetirement} years</strong> to retirement (age {draft.retirementAge || 65})
                      {" "}<button onClick={() => {
                        const r = prompt("Target retirement age:", draft.retirementAge || 65);
                        if (r) set("retirementAge", Number(r));
                      }} style={{ fontSize:9, padding:"1px 6px", borderRadius:4, marginLeft:4,
                        background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                        color:"rgba(255,255,255,0.35)", cursor:"pointer" }}>change</button>
                    </p>
                  )}
                </div>
              </div>

              {/* Q2: Risk tolerance */}
              <div style={{ marginBottom:24 }}>
                <p style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.8)", marginBottom:10 }}>
                  How would you describe your risk tolerance?
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {RISK_OPTIONS.map(opt => {
                    const sel = draft.riskTolerance === opt.key;
                    return (
                      <button key={opt.key} onClick={() => set("riskTolerance", opt.key)}
                        style={{ padding:"12px 14px", borderRadius:10, textAlign:"left", cursor:"pointer",
                          background: sel ? `${opt.color}18` : "rgba(255,255,255,0.03)",
                          border:`1px solid ${sel ? opt.color : "rgba(255,255,255,0.08)"}`,
                          transition:"all 0.15s" }}>
                        <p style={{ fontSize:13, margin:"0 0 4px",
                          color: sel ? opt.color : "rgba(255,255,255,0.7)", fontWeight:600 }}>
                          {opt.icon} {opt.label}
                        </p>
                        <p style={{ fontSize:10, margin:0, color:"rgba(255,255,255,0.38)", lineHeight:1.4 }}>
                          {opt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q3: Primary goal */}
              <div style={{ marginBottom:24 }}>
                <p style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.8)", marginBottom:10 }}>
                  What is your primary investment goal?
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {GOAL_OPTIONS.map(opt => {
                    const sel = draft.primaryGoal === opt.key;
                    return (
                      <button key={opt.key} onClick={() => set("primaryGoal", opt.key)}
                        style={{ padding:"12px 14px", borderRadius:10, textAlign:"left", cursor:"pointer",
                          background: sel ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.03)",
                          border:`1px solid ${sel ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.08)"}`,
                          transition:"all 0.15s" }}>
                        <p style={{ fontSize:13, margin:"0 0 4px",
                          color: sel ? "#a78bfa" : "rgba(255,255,255,0.7)", fontWeight:600 }}>
                          {opt.icon} {opt.label}
                        </p>
                        <p style={{ fontSize:10, margin:0, color:"rgba(255,255,255,0.38)", lineHeight:1.4 }}>
                          {opt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q4: Monthly contribution */}
              <div style={{ marginBottom:28 }}>
                <p style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.8)", marginBottom:10 }}>
                  How much can you invest monthly? <span style={{ color:"rgba(255,255,255,0.3)", fontWeight:400 }}>(optional)</span>
                </p>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14, color:"rgba(255,255,255,0.4)" }}>C$</span>
                  <input type="number" min={0}
                    value={draft.monthlyContrib || ""}
                    placeholder="e.g. 1500"
                    onChange={e => set("monthlyContrib", e.target.value)}
                    style={{ width:140, fontSize:16, padding:"7px 12px",
                      background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.15)",
                      borderRadius:8, color:"rgba(255,255,255,0.85)", fontFamily:"'JetBrains Mono',monospace" }} />
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>/ month</span>
                </div>
              </div>

              {/* Save */}
              <div style={{ display:"flex", gap:10 }}>
                <button className="btn btn-primary"
                  disabled={!draft.age || !draft.riskTolerance || !draft.primaryGoal}
                  style={{ flex:1, padding:"11px 0", fontSize:13, fontWeight:600 }}
                  onClick={() => {
                    const p = { ...draft, savedAt: new Date().toISOString() };
                    setInvestorProfile(p);
                    localStorage.setItem("portfolio:profile", JSON.stringify(p));
                    setProfileDraft(null);
                    setShowProfileModal(false);
                  }}>
                  Save Profile
                </button>
                {investorProfile && (
                  <button className="btn" style={{ padding:"11px 16px", fontSize:13 }}
                    onClick={() => { setProfileDraft(null); setShowProfileModal(false); }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── License management modal ── */}
      {showLicenseModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.80)", zIndex:10000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
          onClick={() => setShowLicenseModal(false)}>
          <div style={{ background:"#0d1526", border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:20, padding:"36px", maxWidth:460, width:"100%",
            boxShadow:"0 32px 80px rgba(0,0,0,0.7)", fontFamily:"'DM Sans',system-ui,sans-serif" }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#f1f5f9" }}>🔑 License</div>
              <button onClick={() => setShowLicenseModal(false)}
                style={{ background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:18, lineHeight:1 }}>✕</button>
            </div>

            {/* Current tier status */}
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:10, padding:"12px 16px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:13, color:"#94a3b8" }}>Current plan</span>
              <span style={{ fontSize:13, fontWeight:700,
                color: licenseTier === "basic" ? "#fbbf24" : "#4ade80",
                background: licenseTier === "basic" ? "rgba(251,191,36,0.1)" : "rgba(34,197,94,0.1)",
                border: `1px solid ${licenseTier === "basic" ? "rgba(251,191,36,0.3)" : "rgba(34,197,94,0.25)"}`,
                padding:"3px 12px", borderRadius:99 }}>
                {licenseTier === "basic" ? "Basic" : "Pro"}
              </span>
            </div>

            {licenseTier === "basic" && (
              <div style={{ background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.2)",
                borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#fbbf24", lineHeight:1.6 }}>
                Upgrade to Pro to unlock AI features — Market Pulse refresh, Target Suggestions,
                Diversification Analysis, Options AI, and Broker Import.{" "}
                <a href={LS_CHECKOUT_PRO} target="_blank" rel="noreferrer"
                  style={{ color:"#fbbf24", fontWeight:700, textDecoration:"underline" }}>
                  Buy Pro ($99 CAD/yr) →
                </a>
              </div>
            )}

            {licenseModalSuccess ? (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#f1f5f9" }}>
                  {licenseTier === "pro" ? "Upgraded to Pro!" : "License updated!"}
                </div>
                <div style={{ fontSize:13, color:"#94a3b8", marginTop:6 }}>AI features are now active.</div>
              </div>
            ) : (
              <>
                <label style={{ fontSize:12, fontWeight:700, color:"#64748b",
                  textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:6 }}>
                  {licenseTier === "basic" ? "Enter your new Pro license key" : "Enter a different license key"}
                </label>
                <input
                  type="text"
                  placeholder="PFRA-XXXX-XXXX-XXXX"
                  value={licenseModalKey}
                  onChange={e => { setLicenseModalKey(e.target.value); setLicenseModalError(null); }}
                  onKeyDown={e => e.key === "Enter" && reactivateLicense()}
                  style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                    color:"#f1f5f9", padding:"11px 14px", borderRadius:10, fontSize:14,
                    fontFamily:"'JetBrains Mono',monospace", width:"100%", marginBottom:10 }}
                />
                {licenseModalError && (
                  <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)",
                    borderRadius:8, padding:"10px 14px", fontSize:13, color:"#fca5a5", marginBottom:12, lineHeight:1.6 }}>
                    ⚠ {licenseModalError}
                  </div>
                )}
                <button
                  onClick={reactivateLicense}
                  disabled={licenseModalLoading || !licenseModalKey.trim()}
                  style={{ width:"100%", padding:"12px", borderRadius:10, border:"none",
                    fontWeight:700, fontSize:14, fontFamily:"inherit",
                    cursor: licenseModalLoading || !licenseModalKey.trim() ? "not-allowed" : "pointer",
                    background: licenseModalKey.trim() && !licenseModalLoading ? "#22c55e" : "rgba(255,255,255,0.07)",
                    color: licenseModalKey.trim() && !licenseModalLoading ? "#fff" : "#64748b",
                    transition:"all 0.2s" }}>
                  {licenseModalLoading ? "Activating…" : "Activate new key →"}
                </button>
                <p style={{ fontSize:11, color:"#334155", marginTop:14, textAlign:"center", lineHeight:1.6 }}>
                  Your license key is in the confirmation email from Lemon Squeezy.
                  Check spam if not visible within 2 minutes.
                </p>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
