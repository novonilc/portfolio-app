// Vercel Cron Job — fetches upcoming earnings dates for the options-scanner ticker
// universe from Financial Modeling Prep (FMP) and stores a ticker -> date map in Vercel Blob.
//
// Schedule: weekly on Mondays at 11:00 UTC (earnings dates rarely change day to day).
// Requires env var: FMP_API_KEY (same key used by financials.js / refresh-analyst-ratings.js)
//
// Used to flag CSP/CC picks and vertical-spread trade tickets whose expiry window overlaps
// an earnings report — selling premium into earnings risks an IV crush / gap the scanner's
// price-technicals-only scoring can't otherwise see.
//
// Data source: FMP /api/v3/earning_calendar?from=&to= — one bulk call covering every
// company reporting in the window, filtered down to our scan universe (cheaper than one
// call per ticker).

import { put } from "@vercel/blob";

const FMP_BASE  = "https://financialmodelingprep.com/api/v3";
const BLOB_PATH = "earnings-calendar/latest.json";
const WINDOW_DAYS = 60; // covers the longest trade DTE used by the scanners (~35 DTE) with margin

// Same universe as SPREAD_SCAN_TICKERS (src/App.jsx) / SCAN_TICKERS (refresh-options-signals.js,
// refresh-csp-cc-picks.js) — kept as its own copy per existing repo convention.
const SCAN_TICKERS = [
  "AAPL", "MSFT", "NVDA", "AMD", "META", "GOOGL", "AMZN", "TSLA", "PLTR", "ARM",
  "SNOW", "DDOG", "CRWD", "ZS", "NET", "MDB", "TEAM",
  "AVGO", "QCOM", "MU", "SMCI", "AMAT", "LRCX",
  "JPM", "BAC", "GS", "V", "BRK.B", "SCHW", "MS", "C",
  "LLY", "JNJ", "ISRG", "NVO", "UNH", "MRNA", "ABBV",
  "XOM", "CVX", "CNQ", "OXY",
  "RTX", "AXON", "GE", "BA",
  "COST", "SHOP", "NFLX", "SBUX", "HD", "NKE",
  "SQ", "PYPL", "HOOD",
  "RIVN", "F", "GM",
  "SOFI", "COIN", "MARA",
  "VST", "CEG", "GEV", "PWR",
  "SPY", "QQQ", "IWM", "XLF", "XLE", "XLK", "GLD", "XBI", // ETFs — no earnings, harmlessly absent from the response
];

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.CRON_SECRET;
  const auth   = (req.headers.authorization || "").trim();
  if (secret && auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized — provide Authorization: Bearer <CRON_SECRET>" });
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey)                             return res.status(500).json({ error: "FMP_API_KEY not configured" });
  if (!process.env.BLOB_READ_WRITE_TOKEN)  return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN not configured" });

  const today = new Date();
  const to    = new Date(today);
  to.setDate(to.getDate() + WINDOW_DAYS);

  const url = `${FMP_BASE}/earning_calendar?from=${toDateStr(today)}&to=${toDateStr(to)}&apikey=${apiKey}`;

  const wanted = new Set(SCAN_TICKERS);
  const earningsByTicker = {};

  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!upstream.ok) throw new Error(`FMP returned ${upstream.status}`);
    const rows = await upstream.json();
    if (!Array.isArray(rows)) throw new Error("Unexpected FMP response shape");

    for (const row of rows) {
      const sym = row.symbol;
      const date = (row.date || "").slice(0, 10);
      if (!sym || !date || !wanted.has(sym)) continue;
      // Keep the earliest date if a ticker somehow appears twice in the window
      if (!earningsByTicker[sym] || date < earningsByTicker[sym]) earningsByTicker[sym] = date;
    }
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }

  const payload = {
    earningsByTicker,
    lastUpdated: new Date().toISOString(),
    windowDays:  WINDOW_DAYS,
    tickerCount: Object.keys(earningsByTicker).length,
    source:      "Financial Modeling Prep (FMP) — earnings calendar",
  };

  await put(BLOB_PATH, JSON.stringify(payload), {
    access:          "public",
    contentType:     "application/json",
    addRandomSuffix: false,
    allowOverwrite:  true,
  });

  return res.status(200).json({
    ok:          true,
    tickerCount: payload.tickerCount,
    lastUpdated: payload.lastUpdated,
  });
}
