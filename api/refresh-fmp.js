// Vercel Cron Job — consolidated dispatcher for the four weekly Financial Modeling Prep (FMP)
// refresh jobs. Each job used to be its own file under /api, but Vercel's Hobby plan caps a
// deployment at 12 Serverless Functions, and the project's total /api file count went over
// that limit. Merging same-provider, similar-shape jobs into one function (dispatched by the
// `job` query param) keeps the per-job cron schedules in vercel.json unchanged while cutting
// four Serverless Functions down to one — mirrors the same consolidation already done for
// reads in public-data.js.
//
// Usage: GET/POST /api/refresh-fmp?job=<name>
//   job=analyst-ratings    — Wall Street upgrades/downgrades (Saturdays 12:00 UTC)
//   job=insider-signals    — SEC Form 4 insider buy/sell signals (Sundays 13:30 UTC)
//   job=institutional-flow — SEC Form 13F institutional big-money flow + options play (Sundays 14:00 UTC)
//   job=earnings-calendar  — upcoming earnings dates for the options scan universe (Mondays 11:00 UTC)
//
// Requires env vars: FMP_API_KEY, BLOB_READ_WRITE_TOKEN, and (optionally) CRON_SECRET.

import { put } from "@vercel/blob";

const FMP_BASE_V3 = "https://financialmodelingprep.com/api/v3";
const FMP_BASE_V4 = "https://financialmodelingprep.com/api/v4";
const BATCH_SIZE   = 20;
const BATCH_DELAY  = 400; // ms

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// FMP uses different ticker formats for TSX stocks (no ".TO" suffix).
function toFmpSymbol(ticker) {
  return ticker.replace(/\.TO$/, "");
}

// Shared universe for analyst-ratings, insider-signals, and institutional-flow.
const UNIVERSE_TICKERS = [
  "AAPL","MSFT","NVDA","GOOGL","META","AMZN","AVGO","ORCL","AMD","MU","QCOM",
  "TSM","ARM","NOW","CRWD","PLTR","MRVL","ALAB","ANET","PANW","FICO","INTC","ADBE",
  "CRM","ASML","JPM","BAC","GS","V","MA","AXP","BRK.B","SCHW","BLK","MSCI","ICE",
  "PYPL","HOOD","KKR","COIN","MSTR","LLY","JNJ","ABBV","UNH","ISRG","NVO","MRK","AMGN","IDXX",
  "HIMS","KO","PG","COST","WMT","MNST","HD","NFLX","TSLA","NKE","MCD","SBUX",
  "BKNG","ABNB","UBER","MAR","HLT","RCL","TJX","LOW","LVS","XOM","CVX","OXY",
  "COP","SLB","RTX","LMT","GE","HON","AXON","NOC","LHX","RKLB","ASTS","LUNR",
  "MDA.TO","CAT","DE","ITW","TDG","ODFL","T","VZ","TMUS","LIN","SHW","AMT",
  "PLD","NEE","AEP","ENB","CNQ","SU.TO","CCO.TO","TD","RY","BNS","BMO","CM","MFC",
  "SLF","ATD.TO","SHOP","TRP","BAM","CP.TO","CNR.TO","TFII","WSP.TO",
];

// ════════════════════════════════════════════════════════════════════════════
// job=analyst-ratings — Wall Street upgrades/downgrades
// ════════════════════════════════════════════════════════════════════════════

const ANALYST_LOOKBACK = 90; // days of history to keep per ticker

function normaliseGrade(grade = "") {
  const g = grade.toLowerCase().trim();
  if (/strong.?buy|outperform|overweight|market.?out|accumulate|add|positive/.test(g))  return "buy";
  if (/buy/.test(g) && !/don.*buy/.test(g))                                              return "buy";
  if (/strong.?sell|underperform|underweight|reduce|negative|avoid/.test(g))             return "sell";
  if (/sell/.test(g) && !/strong.?sell/.test(g))                                         return "sell";
  return "hold";
}

function normaliseAction(action = "") {
  const a = action.toLowerCase();
  if (a.includes("upgrade"))   return "upgrade";
  if (a.includes("downgrade")) return "downgrade";
  if (a.includes("init"))      return "initiated";
  return "reiterated";
}

async function fetchAnalystTicker(ticker, apiKey, cutoff) {
  const sym = toFmpSymbol(ticker);
  const url = `${FMP_BASE_V4}/upgrades-downgrades?symbol=${sym}&apikey=${apiKey}`;
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

async function runAnalystRatings(apiKey) {
  const today  = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - ANALYST_LOOKBACK);

  const results = {};
  let fetched = 0, errors = 0;

  for (let i = 0; i < UNIVERSE_TICKERS.length; i += BATCH_SIZE) {
    const batch   = UNIVERSE_TICKERS.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(batch.map(t => fetchAnalystTicker(t, apiKey, cutoff)));
    settled.forEach(r => {
      if (r.status === "fulfilled" && r.value) {
        const { ticker, ...rest } = r.value;
        results[ticker] = rest;
        fetched++;
      } else {
        errors++;
      }
    });
    if (i + BATCH_SIZE < UNIVERSE_TICKERS.length) await sleep(BATCH_DELAY);
  }

  const payload = {
    fetchedAt:    today.toISOString().slice(0, 10),
    tickerCount:  fetched,
    errorCount:   errors,
    lookbackDays: ANALYST_LOOKBACK,
    source:       "Financial Modeling Prep (FMP) — Wall Street analyst upgrades/downgrades",
    ratings:      results,
  };

  await put("analyst-ratings/latest.json", JSON.stringify(payload), {
    access: "public", contentType: "application/json",
    addRandomSuffix: false, allowOverwrite: true,
  });

  const upgrades   = Object.values(results).filter(r => r.trend === "upgrading").length;
  const downgrades = Object.values(results).filter(r => r.trend === "downgrading").length;
  const totalBuy   = Object.values(results).filter(r => r.consensus === "buy").length;

  return { ok: true, fetchedAt: payload.fetchedAt, fetched, errors, upgrades, downgrades, consensusBuys: totalBuy };
}

// ════════════════════════════════════════════════════════════════════════════
// job=insider-signals — SEC Form 4 insider buy/sell signals
// ════════════════════════════════════════════════════════════════════════════

const INSIDER_LOOKBACK = 90; // days of Form 4 history to analyse

function roleWeight(typeOfOwner = "") {
  const t = typeOfOwner.toLowerCase();
  if (/chief executive|ceo/.test(t))                        return 2.0;
  if (/chief financial|cfo|chief operating|coo/.test(t))    return 1.8;
  if (/president|chairman|chief/.test(t))                   return 1.6;
  if (/officer/.test(t))                                    return 1.3;
  if (/10%|ten percent|beneficial owner/.test(t))           return 0.7;
  return 1.0; // director or unclassified
}

function shortRole(typeOfOwner = "") {
  const t = typeOfOwner.toLowerCase();
  if (/chief executive|ceo/.test(t))    return "CEO";
  if (/chief financial|cfo/.test(t))    return "CFO";
  if (/chief operating|coo/.test(t))    return "COO";
  if (/chief/.test(t))                  return "C-Suite";
  if (/president/.test(t))              return "President";
  if (/chairman/.test(t))               return "Chairman";
  if (/officer/.test(t))                return "Officer";
  if (/10%|beneficial/.test(t))         return "10%+ Owner";
  if (/director/.test(t))               return "Director";
  return "Insider";
}

function classifyInsiderTx(row) {
  const txType = (row.transactionType || "").trim();
  const disp   = (row.acquistionOrDisposition || "").toUpperCase();

  if (txType === "P-Purchase" || txType === "P")  return "buy";
  if (txType === "S-Sale"     || txType === "S")  return "sell";

  if ((row.price || 0) > 0) {
    if (disp === "A") return "buy";
    if (disp === "D") return "sell";
  }
  return null;
}

function computeInsiderSignal(rows, cutoff) {
  const now = Date.now();
  let weightedBuy  = 0;
  let weightedSell = 0;
  let totalBuyUSD  = 0;
  let totalSellUSD = 0;
  const buyerSet30d = new Set();
  const recentTxs   = [];

  for (const row of rows) {
    const dateStr = row.transactionDate || row.filingDate || "";
    const txDate  = new Date(dateStr);
    if (isNaN(txDate) || txDate < cutoff) continue;

    const direction = classifyInsiderTx(row);
    if (!direction) continue;

    const shares  = Math.abs(row.securitiesTransacted || 0);
    const price   = row.price || 0;
    if (shares === 0 || price === 0) continue;

    const valueUSD = shares * price;
    const daysAgo  = (now - txDate.getTime()) / 86400000;
    const recency  = daysAgo <= 30 ? 2.0 : daysAgo <= 60 ? 1.5 : 1.0;
    const rw       = roleWeight(row.typeOfOwner);
    const weighted = (valueUSD / 1e6) * rw * recency;

    if (direction === "buy") {
      weightedBuy += weighted;
      totalBuyUSD += valueUSD;
      if (daysAgo <= 30) buyerSet30d.add((row.reportingName || "?").toLowerCase());
      recentTxs.push({ direction, row, valueUSD, dateStr });
    } else {
      weightedSell += weighted * 0.5;
      totalSellUSD += valueUSD;
      recentTxs.push({ direction, row, valueUSD, dateStr });
    }
  }

  const clusterBonus = buyerSet30d.size >= 2 ? 12 : buyerSet30d.size >= 1 ? 4 : 0;
  const total = weightedBuy + weightedSell;

  let score;
  if (total === 0) {
    score = 50;
  } else {
    const netRatio = (weightedBuy - weightedSell) / total;
    score = Math.round((netRatio + 1) * 50);
    score = Math.min(100, Math.max(0, score + clusterBonus));
  }

  const signal = score >= 65 ? "Accumulating" : score <= 35 ? "Distributing" : "Neutral";

  const transactions = recentTxs
    .sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr))
    .slice(0, 6)
    .map(({ direction, row, valueUSD, dateStr }) => ({
      date:     dateStr.slice(0, 10),
      name:     row.reportingName || "Unknown",
      role:     shortRole(row.typeOfOwner),
      type:     direction,
      shares:   Math.abs(row.securitiesTransacted || 0),
      valueM:   Math.round(valueUSD / 10000) / 100,
    }));

  return {
    signal,
    score,
    netBuyM:      Math.round((totalBuyUSD - totalSellUSD) / 10000) / 100,
    totalBuyM:    Math.round(totalBuyUSD / 10000) / 100,
    totalSellM:   Math.round(totalSellUSD / 10000) / 100,
    buyerCount:   buyerSet30d.size,
    clusterBuy:   buyerSet30d.size >= 2,
    transactions,
  };
}

async function fetchInsiderTicker(ticker, apiKey, cutoff) {
  const sym = toFmpSymbol(ticker);
  const url = `${FMP_BASE_V4}/insider-trading?symbol=${sym}&limit=50&apikey=${apiKey}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { ticker, signal: "Neutral", score: 50, transactions: [] };
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) {
      return { ticker, signal: "Neutral", score: 50, transactions: [] };
    }
    return { ticker, ...computeInsiderSignal(rows, cutoff) };
  } catch {
    return { ticker, signal: "Neutral", score: 50, transactions: [] };
  }
}

async function runInsiderSignals(apiKey) {
  const today  = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - INSIDER_LOOKBACK);

  const signals = {};
  let fetched = 0, errors = 0;

  for (let i = 0; i < UNIVERSE_TICKERS.length; i += 15) {
    const batch   = UNIVERSE_TICKERS.slice(i, i + 15);
    const settled = await Promise.allSettled(batch.map(t => fetchInsiderTicker(t, apiKey, cutoff)));
    settled.forEach(r => {
      if (r.status === "fulfilled" && r.value) {
        const { ticker, ...rest } = r.value;
        signals[ticker] = rest;
        fetched++;
      } else {
        errors++;
      }
    });
    if (i + 15 < UNIVERSE_TICKERS.length) await sleep(500);
  }

  const accumulating = Object.values(signals).filter(s => s.signal === "Accumulating").length;
  const distributing = Object.values(signals).filter(s => s.signal === "Distributing").length;

  const payload = {
    fetchedAt:    today.toISOString().slice(0, 10),
    tickerCount:  fetched,
    errorCount:   errors,
    lookbackDays: INSIDER_LOOKBACK,
    source:       "Financial Modeling Prep (FMP) — SEC Form 4 insider transactions",
    accumulating,
    distributing,
    signals,
  };

  await put("insider-signals/latest.json", JSON.stringify(payload), {
    access: "public", contentType: "application/json",
    addRandomSuffix: false, allowOverwrite: true,
  });

  return { ok: true, fetchedAt: payload.fetchedAt, fetched, errors, accumulating, distributing };
}

// ════════════════════════════════════════════════════════════════════════════
// job=institutional-flow — SEC Form 13F institutional big-money flow + options play
// ════════════════════════════════════════════════════════════════════════════

const BIG_MOVE_THRESHOLD = 0.08; // 8% quarter-over-quarter dollar-flow change

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

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

  const dollarScore   = clamp(pctDollarChange * 200, -40, 40);
  const positionScore = clamp(netPositionsRatio * 20, -15, 15);
  const putCallScore  = putCallRatioChange != null ? clamp(-putCallRatioChange * 40, -10, 10) : 0;

  const score  = Math.round(clamp(50 + dollarScore + positionScore + putCallScore, 0, 100));
  const bigMove= Math.abs(pctDollarChange) >= BIG_MOVE_THRESHOLD;
  const signal = score >= 65 ? "Accumulating" : score <= 35 ? "Distributing" : "Neutral";
  const optionsPlay = suggestOptionsTrade(score, bigMove);

  return {
    signal,
    score,
    bigMove,
    dollarChangeM:    Math.round(dollarChange / 10000) / 100,
    totalInvestedM:   Math.round(totalInvested / 10000) / 100,
    pctDollarChange:  Math.round(pctDollarChange * 1000) / 10,
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

async function fetchInstitutionalTicker(ticker, apiKey) {
  const sym = toFmpSymbol(ticker);
  const url = `${FMP_BASE_V4}/institutional-ownership/symbol-ownership?symbol=${sym}&includeCurrentQuarter=false&apikey=${apiKey}`;
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

async function runInstitutionalFlow(apiKey) {
  const signals = {};
  let fetched = 0, errors = 0;

  for (let i = 0; i < UNIVERSE_TICKERS.length; i += 15) {
    const batch   = UNIVERSE_TICKERS.slice(i, i + 15);
    const settled = await Promise.allSettled(batch.map(t => fetchInstitutionalTicker(t, apiKey)));
    settled.forEach(r => {
      if (r.status === "fulfilled" && r.value) {
        const { ticker, ...rest } = r.value;
        signals[ticker] = rest;
        fetched++;
      } else {
        errors++;
      }
    });
    if (i + 15 < UNIVERSE_TICKERS.length) await sleep(500);
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

  await put("institutional-flow/latest.json", JSON.stringify(payload), {
    access: "public", contentType: "application/json",
    addRandomSuffix: false, allowOverwrite: true,
  });

  return { ok: true, fetchedAt: payload.fetchedAt, fetched, errors, accumulating, distributing, bigMoves };
}

// ════════════════════════════════════════════════════════════════════════════
// job=earnings-calendar — upcoming earnings dates for the options scan universe
// ════════════════════════════════════════════════════════════════════════════

const EARNINGS_WINDOW_DAYS = 60; // covers the longest trade DTE used by the scanners (~35 DTE) with margin

// Same universe as SPREAD_SCAN_TICKERS (src/App.jsx) / SCAN_TICKERS (refresh-options-signals.js,
// refresh-csp-cc-picks.js) — kept as its own copy per existing repo convention.
const EARNINGS_SCAN_TICKERS = [
  "AAPL", "MSFT", "NVDA", "AMD", "META", "GOOGL", "AMZN", "TSLA", "PLTR", "ARM",
  "SNOW", "DDOG", "CRWD", "ZS", "NET", "MDB", "TEAM",
  "AVGO", "QCOM", "MU", "SMCI", "AMAT", "LRCX",
  "JPM", "BAC", "GS", "V", "BRK.B", "SCHW", "MS", "C", "ICE",
  "LLY", "JNJ", "ISRG", "NVO", "UNH", "MRNA", "ABBV",
  "XOM", "CVX", "CNQ", "OXY",
  "RTX", "AXON", "GE", "BA",
  "COST", "SHOP", "NFLX", "SBUX", "HD", "NKE",
  "SQ", "PYPL", "HOOD",
  "RIVN", "F", "GM",
  "SOFI", "COIN", "MARA", "MSTR",
  "VST", "CEG", "GEV", "PWR",
  "SPY", "QQQ", "IWM", "XLF", "XLE", "XLK", "GLD", "XBI", // ETFs — no earnings, harmlessly absent from the response
];

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

async function runEarningsCalendar(apiKey) {
  const today = new Date();
  const to    = new Date(today);
  to.setDate(to.getDate() + EARNINGS_WINDOW_DAYS);

  const url = `${FMP_BASE_V3}/earning_calendar?from=${toDateStr(today)}&to=${toDateStr(to)}&apikey=${apiKey}`;

  const wanted = new Set(EARNINGS_SCAN_TICKERS);
  const earningsByTicker = {};

  const upstream = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!upstream.ok) throw new Error(`FMP returned ${upstream.status}`);
  const rows = await upstream.json();
  if (!Array.isArray(rows)) throw new Error("Unexpected FMP response shape");

  for (const row of rows) {
    const sym = row.symbol;
    const date = (row.date || "").slice(0, 10);
    if (!sym || !date || !wanted.has(sym)) continue;
    if (!earningsByTicker[sym] || date < earningsByTicker[sym]) earningsByTicker[sym] = date;
  }

  const payload = {
    earningsByTicker,
    lastUpdated: new Date().toISOString(),
    windowDays:  EARNINGS_WINDOW_DAYS,
    tickerCount: Object.keys(earningsByTicker).length,
    source:      "Financial Modeling Prep (FMP) — earnings calendar",
  };

  await put("earnings-calendar/latest.json", JSON.stringify(payload), {
    access:          "public",
    contentType:     "application/json",
    addRandomSuffix: false,
    allowOverwrite:  true,
  });

  return { ok: true, tickerCount: payload.tickerCount, lastUpdated: payload.lastUpdated };
}

// ════════════════════════════════════════════════════════════════════════════
// Dispatcher
// ════════════════════════════════════════════════════════════════════════════

const JOBS = {
  "analyst-ratings":    runAnalystRatings,
  "insider-signals":    runInsiderSignals,
  "institutional-flow": runInstitutionalFlow,
  "earnings-calendar":  runEarningsCalendar,
};

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.CRON_SECRET;
  const auth   = (req.headers.authorization || "").trim();
  if (secret && auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized — provide Authorization: Bearer <CRON_SECRET>" });
  }

  const job = req.query?.job || "";
  const run = JOBS[job];
  if (!run) {
    return res.status(400).json({ error: `Unknown or missing 'job' query param. Valid: ${Object.keys(JOBS).join(", ")}` });
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey)                             return res.status(500).json({ error: "FMP_API_KEY not configured" });
  if (!process.env.BLOB_READ_WRITE_TOKEN)  return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN not configured" });

  try {
    const result = await run(apiKey);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
