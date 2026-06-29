// Vercel Cron Job — fetches analyst upgrades/downgrades from Financial Modeling Prep (FMP)
// for every stock in the universe and stores a normalised snapshot in Vercel Blob.
//
// Schedule: weekly on Saturdays at 12:00 UTC (well within FMP free-tier 250 req/day).
// Requires env var: FMP_API_KEY  (free at financialmodelingprep.com)
//
// Data source: FMP /api/v4/upgrades-downgrades?symbol=TICKER
// Covers Wall Street firms (Goldman, Morgan Stanley, JPM, etc.) — many of which
// appear as guests on CNBC daily analyst-actions segments.

import { put } from "@vercel/blob";

const FMP_BASE   = "https://financialmodelingprep.com/api/v4";
const BLOB_PATH  = "analyst-ratings/latest.json";
const LOOKBACK   = 90;  // days of history to keep per ticker
const BATCH_SIZE = 20;  // parallel requests per batch
const BATCH_DELAY_MS = 400;  // pause between batches (FMP rate limit buffer)

// All tickers from stockUniverse.json — keep in sync when universe grows.
const UNIVERSE_TICKERS = [
  "AAPL","MSFT","NVDA","GOOGL","META","AMZN","AVGO","ORCL","AMD","MU","QCOM",
  "TSM","ARM","NOW","CRWD","PLTR","MRVL","ANET","PANW","FICO","INTC","ADBE",
  "CRM","ASML","JPM","BAC","GS","V","MA","AXP","BRK.B","SCHW","BLK","MSCI",
  "PYPL","HOOD","KKR","LLY","JNJ","ABBV","UNH","ISRG","NVO","MRK","AMGN","IDXX",
  "HIMS","KO","PG","COST","WMT","MNST","HD","NFLX","TSLA","NKE","MCD","SBUX",
  "BKNG","ABNB","UBER","MAR","HLT","RCL","TJX","LOW","LVS","XOM","CVX","OXY",
  "COP","SLB","RTX","LMT","GE","HON","AXON","NOC","LHX","RKLB","ASTS","LUNR",
  "MDA.TO","CAT","DE","ITW","TDG","ODFL","T","VZ","TMUS","LIN","SHW","AMT",
  "PLD","NEE","AEP","ENB","CNQ","SU.TO","TD","RY","BNS","BMO","CM","MFC",
  "SLF","ATD.TO","SHOP","TRP","BAM","CP.TO","CNR.TO","TFII","WSP.TO",
];

// FMP uses different ticker formats for TSX stocks (no ".TO" suffix).
// Map our tickers to FMP-compatible symbols.
function toFmpSymbol(ticker) {
  return ticker.replace(/\.TO$/, "");  // MDA.TO → MDA, SU.TO → SU
}

// Normalise any grade string to buy / hold / sell
function normaliseGrade(grade = "") {
  const g = grade.toLowerCase().trim();
  if (/strong.?buy|outperform|overweight|market.?out|accumulate|add|positive/.test(g))  return "buy";
  if (/buy/.test(g) && !/don.*buy/.test(g))                                              return "buy";
  if (/strong.?sell|underperform|underweight|reduce|negative|avoid/.test(g))             return "sell";
  if (/sell/.test(g) && !/strong.?sell/.test(g))                                         return "sell";
  return "hold";
}

// Normalise FMP action field to one of: upgrade | downgrade | initiated | reiterated
function normaliseAction(action = "") {
  const a = action.toLowerCase();
  if (a.includes("upgrade"))   return "upgrade";
  if (a.includes("downgrade")) return "downgrade";
  if (a.includes("init"))      return "initiated";
  return "reiterated";
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchTicker(ticker, apiKey, cutoff) {
  const sym = toFmpSymbol(ticker);
  const url = `${FMP_BASE}/upgrades-downgrades?symbol=${sym}&apikey=${apiKey}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ticker, actions: [] };
    const rows = await res.json();
    if (!Array.isArray(rows)) return { ticker, actions: [] };

    const actions = rows
      .filter(r => {
        const d = new Date(r.publishedDate || r.date || "");
        return !isNaN(d) && d >= cutoff;
      })
      .slice(0, 20)
      .map(r => ({
        date:      (r.publishedDate || r.date || "").slice(0, 10),
        firm:      r.gradingCompany || r.newsPublisher || "",
        action:    normaliseAction(r.action || ""),
        fromGrade: r.previousGrade || "",
        toGrade:   r.newGrade || "",
        grade:     normaliseGrade(r.newGrade || ""),
      }));

    // Derive consensus: majority vote from last 90-day grades
    const votes = actions.reduce((acc, a) => { acc[a.grade] = (acc[a.grade] || 0) + 1; return acc; }, {});
    const consensus = ["buy","hold","sell"].reduce((best, g) =>
      (votes[g] || 0) > (votes[best] || 0) ? g : best, "hold");

    const recentUpgrade  = actions.find(a => a.action === "upgrade");
    const recentDowngrade = actions.find(a => a.action === "downgrade");
    const trend = recentUpgrade && (!recentDowngrade || recentUpgrade.date >= recentDowngrade.date)
      ? "upgrading" : recentDowngrade ? "downgrading" : "stable";

    return { ticker, consensus, trend, votes, actions };
  } catch {
    return { ticker, actions: [] };
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.CRON_SECRET;
  const auth   = (req.headers.authorization || "").trim();
  if (secret && auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey)                             return res.status(500).json({ error: "FMP_API_KEY not configured" });
  if (!process.env.BLOB_READ_WRITE_TOKEN)  return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN not configured" });

  const today  = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - LOOKBACK);

  const results = {};
  let fetched = 0, errors = 0;

  // Process in batches to avoid hammering FMP
  for (let i = 0; i < UNIVERSE_TICKERS.length; i += BATCH_SIZE) {
    const batch = UNIVERSE_TICKERS.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map(t => fetchTicker(t, apiKey, cutoff))
    );
    settled.forEach(r => {
      if (r.status === "fulfilled" && r.value) {
        const { ticker, ...rest } = r.value;
        results[ticker] = rest;
        fetched++;
      } else {
        errors++;
      }
    });
    if (i + BATCH_SIZE < UNIVERSE_TICKERS.length) await sleep(BATCH_DELAY_MS);
  }

  const payload = {
    fetchedAt:    today.toISOString().slice(0, 10),
    tickerCount:  fetched,
    errorCount:   errors,
    lookbackDays: LOOKBACK,
    source:       "Financial Modeling Prep (FMP) — Wall Street analyst upgrades/downgrades",
    ratings:      results,
  };

  await put(BLOB_PATH, JSON.stringify(payload), {
    access: "public", contentType: "application/json",
    addRandomSuffix: false, allowOverwrite: true,
  });

  const upgrades   = Object.values(results).filter(r => r.trend === "upgrading").length;
  const downgrades = Object.values(results).filter(r => r.trend === "downgrading").length;
  const totalBuy   = Object.values(results).filter(r => r.consensus === "buy").length;

  return res.status(200).json({
    ok:         true,
    fetchedAt:  payload.fetchedAt,
    fetched,
    errors,
    upgrades,
    downgrades,
    consensusBuys: totalBuy,
  });
}
