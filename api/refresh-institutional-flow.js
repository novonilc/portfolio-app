// Vercel Cron Job — fetches institutional (13F) ownership flow from Financial Modeling Prep (FMP)
// for every stock in the universe, scores the quarter-over-quarter dollar move as a "big money"
// buy/sell signal, and derives a suggested options play from the direction + conviction.
//
// Schedule: weekly on Sundays at 14:00 UTC (after insider-signals runs Sunday at 13:30).
// Requires env var: FMP_API_KEY  (same key used by refresh-analyst-ratings / refresh-insider-signals)
//
// Data source: FMP /api/v4/institutional-ownership/symbol-ownership?symbol=TICKER
// Each row is one quarterly 13F aggregate with both the current and prior quarter's figures
// embedded (e.g. totalInvested vs lastTotalInvested), so the most recent row alone is enough
// to compute a quarter-over-quarter delta — no need to diff separate rows.
//
// Signal interpretation:
//   "Accumulating" (score >= 65) — institutions grew their aggregate dollar position
//   "Distributing"  (score <= 35) — institutions shrank their aggregate dollar position
//   "Neutral"       (36-64)       — dollar flow roughly flat quarter over quarter
//
// "Big move" flag: |dollar change| >= 8% of the prior quarter's total invested — this is the
// headline "institutional big money move" signal the scanner surfaces distinctly from routine
// quarter-to-quarter drift.
//
// Suggested options play is derived purely from this signal's own score + bigMove flag (not
// cross-referenced with the separate technical spread scanner), so it stays self-contained:
//   Accumulating + bigMove → Long Calls (high-conviction directional)
//   Accumulating           → Bull Put Spread (defined-risk bullish credit spread)
//   Distributing + bigMove → Long Puts
//   Distributing           → Bear Call Spread
//   Neutral                → Iron Condor / No Directional Edge

import { put } from "@vercel/blob";

const FMP_BASE    = "https://financialmodelingprep.com/api/v4";
const BLOB_PATH   = "institutional-flow/latest.json";
const BATCH_SIZE  = 15;   // parallel requests per batch
const BATCH_DELAY = 500;  // ms between batches

// Keep in sync with refresh-insider-signals.js / refresh-analyst-ratings.js universe
const UNIVERSE_TICKERS = [
  "AAPL","MSFT","NVDA","GOOGL","META","AMZN","AVGO","ORCL","AMD","MU","QCOM",
  "TSM","ARM","NOW","CRWD","PLTR","MRVL","ALAB","ANET","PANW","FICO","INTC","ADBE",
  "CRM","ASML","JPM","BAC","GS","V","MA","AXP","BRK.B","SCHW","BLK","MSCI",
  "PYPL","HOOD","KKR","LLY","JNJ","ABBV","UNH","ISRG","NVO","MRK","AMGN","IDXX",
  "HIMS","KO","PG","COST","WMT","MNST","HD","NFLX","TSLA","NKE","MCD","SBUX",
  "BKNG","ABNB","UBER","MAR","HLT","RCL","TJX","LOW","LVS","XOM","CVX","OXY",
  "COP","SLB","RTX","LMT","GE","HON","AXON","NOC","LHX","RKLB","ASTS","LUNR",
  "MDA.TO","CAT","DE","ITW","TDG","ODFL","T","VZ","TMUS","LIN","SHW","AMT",
  "PLD","NEE","AEP","ENB","CNQ","SU.TO","CCO.TO","TD","RY","BNS","BMO","CM","MFC",
  "SLF","ATD.TO","SHOP","TRP","BAM","CP.TO","CNR.TO","TFII","WSP.TO",
];

const BIG_MOVE_THRESHOLD = 0.08; // 8% quarter-over-quarter dollar-flow change

// FMP uses clean symbols (no .TO suffix for Canadian stocks)
function toFmpSymbol(ticker) {
  return ticker.replace(/\.TO$/, "");
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Suggest an options strategy from the institutional score + big-move conviction.
function suggestOptionsTrade(score, bigMove) {
  if (score >= 65) {
    return bigMove
      ? { strategy: "Long Calls",      color: "#22c55e", rationale: "Large institutional dollar inflow — high-conviction bullish directional bet" }
      : { strategy: "Bull Put Spread", color: "#22c55e", rationale: "Net institutional buying — defined-risk bullish credit spread" };
  }
  if (score <= 35) {
    return bigMove
      ? { strategy: "Long Puts",        color: "#ef4444", rationale: "Large institutional dollar outflow — high-conviction bearish directional bet" }
      : { strategy: "Bear Call Spread", color: "#ef4444", rationale: "Net institutional selling — defined-risk bearish credit spread" };
  }
  return { strategy: "Iron Condor / No Edge", color: "#94a3b8", rationale: "Institutional dollar flow roughly flat — no directional conviction from 13F data" };
}

function computeInstitutionalSignal(row) {
  const totalInvested     = row.totalInvested     ?? 0;
  const lastTotalInvested = row.lastTotalInvested  ?? 0;
  const dollarChange      = row.totalInvestedChange ?? (totalInvested - lastTotalInvested);
  const pctDollarChange   = lastTotalInvested > 0 ? dollarChange / lastTotalInvested : 0;

  const sharesChange   = row.numberOf13FSharesChange ?? ((row.numberOf13Fshares ?? 0) - (row.lastNumberOf13Fshares ?? 0));
  const investorsChange= row.investorsHoldingChange  ?? ((row.investorsHolding ?? 0) - (row.lastInvestorsHolding ?? 0));

  const newPositions      = row.newPositions      ?? 0;
  const closedPositions   = row.closedPositions   ?? 0;
  const increasedPositions= row.increasedPositions?? 0;
  const reducedPositions  = row.reducedPositions  ?? 0;
  const totalPositionMoves= newPositions + closedPositions + increasedPositions + reducedPositions;
  const netPositions      = (newPositions + increasedPositions) - (closedPositions + reducedPositions);
  const netPositionsRatio = totalPositionMoves > 0 ? netPositions / totalPositionMoves : 0;

  const putCallRatioChange = row.putCallRatioChange ?? null;

  // Primary driver: dollar flow relative to prior quarter's total invested.
  const dollarScore   = clamp(pctDollarChange * 200, -40, 40);
  // Secondary: breadth of position changes (new/closed/increased/reduced), scale-independent.
  const positionScore = clamp(netPositionsRatio * 20, -15, 15);
  // Tertiary: put/call ratio drift among 13F filers who also report options — small tilt.
  const putCallScore  = putCallRatioChange != null ? clamp(-putCallRatioChange * 40, -10, 10) : 0;

  const score  = Math.round(clamp(50 + dollarScore + positionScore + putCallScore, 0, 100));
  const bigMove= Math.abs(pctDollarChange) >= BIG_MOVE_THRESHOLD;
  const signal = score >= 65 ? "Accumulating" : score <= 35 ? "Distributing" : "Neutral";
  const optionsPlay = suggestOptionsTrade(score, bigMove);

  return {
    signal,
    score,
    bigMove,
    dollarChangeM:    Math.round(dollarChange / 10000) / 100,      // $M, 2dp
    totalInvestedM:   Math.round(totalInvested / 10000) / 100,
    pctDollarChange:  Math.round(pctDollarChange * 1000) / 10,     // %, 1dp
    sharesChange,
    investorsChange,
    newPositions,
    closedPositions,
    increasedPositions,
    reducedPositions,
    putCallRatio:       row.putCallRatio ?? null,
    putCallRatioChange,
    optionsPlay,
    asOf: row.date || null,
  };
}

async function fetchTicker(ticker, apiKey) {
  const sym = toFmpSymbol(ticker);
  const url = `${FMP_BASE}/institutional-ownership/symbol-ownership?symbol=${sym}&includeCurrentQuarter=false&apikey=${apiKey}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { ticker, signal: "Neutral", score: 50, bigMove: false };
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) {
      return { ticker, signal: "Neutral", score: 50, bigMove: false };
    }
    return { ticker, ...computeInstitutionalSignal(rows[0]) };
  } catch {
    return { ticker, signal: "Neutral", score: 50, bigMove: false };
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
  if (!apiKey)                            return res.status(500).json({ error: "FMP_API_KEY not configured" });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN not configured" });

  const signals = {};
  let fetched = 0, errors = 0;

  for (let i = 0; i < UNIVERSE_TICKERS.length; i += BATCH_SIZE) {
    const batch   = UNIVERSE_TICKERS.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map(t => fetchTicker(t, apiKey))
    );
    settled.forEach(r => {
      if (r.status === "fulfilled" && r.value) {
        const { ticker, ...rest } = r.value;
        signals[ticker] = rest;
        fetched++;
      } else {
        errors++;
      }
    });
    if (i + BATCH_SIZE < UNIVERSE_TICKERS.length) await sleep(BATCH_DELAY);
  }

  const accumulating = Object.values(signals).filter(s => s.signal === "Accumulating").length;
  const distributing = Object.values(signals).filter(s => s.signal === "Distributing").length;
  const bigMoves      = Object.values(signals).filter(s => s.bigMove).length;

  const payload = {
    fetchedAt:    new Date().toISOString().slice(0, 10),
    tickerCount:  fetched,
    errorCount:   errors,
    source:       "Financial Modeling Prep (FMP) — SEC Form 13F institutional ownership",
    accumulating,
    distributing,
    bigMoves,
    signals,
  };

  await put(BLOB_PATH, JSON.stringify(payload), {
    access: "public", contentType: "application/json",
    addRandomSuffix: false, allowOverwrite: true,
  });

  return res.status(200).json({
    ok:          true,
    fetchedAt:   payload.fetchedAt,
    fetched,
    errors,
    accumulating,
    distributing,
    bigMoves,
  });
}
