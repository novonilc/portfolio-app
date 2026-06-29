// Vercel Cron Job — fetches insider trading (SEC Form 4) from Financial Modeling Prep (FMP)
// for every stock in the universe and stores a scored insider-signal snapshot in Vercel Blob.
//
// Schedule: weekly on Sundays at 13:30 UTC (after analyst-ratings runs Saturday at 12:00).
// Requires env var: FMP_API_KEY  (same key used by refresh-analyst-ratings)
//
// Signal interpretation:
//   "Accumulating" (score ≥ 65) — net open-market buying, cluster or significant size
//   "Distributing"  (score ≤ 35) — net open-market selling outweighs buying
//   "Neutral"       (36–64)      — mixed or low-volume activity
//
// Important caveats baked into scoring:
//   • Open-market sells are discounted 50% (often pre-planned 10b5-1 or diversification)
//   • Award/RSU/tax-withholding transactions are excluded
//   • CEO/CFO purchases weighted 2×; directors 1×; 10%+ holders 0.7×
//   • Recency decay: last 30 days weighted 2×, 31-60d 1.5×, 61-90d 1×
//   • Cluster bonus: +12 pts if ≥2 distinct buyers in last 30 days

import { put } from "@vercel/blob";

const FMP_BASE    = "https://financialmodelingprep.com/api/v4";
const BLOB_PATH   = "insider-signals/latest.json";
const LOOKBACK    = 90;   // days of Form 4 history to analyse
const BATCH_SIZE  = 15;   // parallel requests per batch (insider endpoint is heavier)
const BATCH_DELAY = 500;  // ms between batches

// Keep in sync with refresh-analyst-ratings.js universe
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

// FMP uses clean symbols (no .TO suffix for Canadian stocks)
function toFmpSymbol(ticker) {
  return ticker.replace(/\.TO$/, "");
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Classify the insider role from FMP's typeOfOwner string
function roleWeight(typeOfOwner = "") {
  const t = typeOfOwner.toLowerCase();
  if (/chief executive|ceo/.test(t))                        return 2.0;
  if (/chief financial|cfo|chief operating|coo/.test(t))    return 1.8;
  if (/president|chairman|chief/.test(t))                   return 1.6;
  if (/officer/.test(t))                                    return 1.3;
  if (/10%|ten percent|beneficial owner/.test(t))           return 0.7;
  return 1.0; // director or unclassified
}

// Shorten typeOfOwner for display
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

// Determine if a transaction is an open-market purchase or sale.
// Excludes awards, RSU exercises, tax withholdings, gifts, etc.
function classifyTx(row) {
  const txType = (row.transactionType || "").trim();
  const disp   = (row.acquistionOrDisposition || "").toUpperCase();

  // FMP transactionType codes:
  //   P-Purchase (open market buy), S-Sale (open market sell)
  //   A-Award, M-Exempt, F-Tax, G-Gift, D-Sale to Issuer, etc.
  if (txType === "P-Purchase" || txType === "P")  return "buy";
  if (txType === "S-Sale"     || txType === "S")  return "sell";

  // Fallback: A/D flag when transactionType is missing or non-standard
  // Only use this if it looks like a real open-market trade (price > 0)
  if ((row.price || 0) > 0) {
    if (disp === "A") return "buy";
    if (disp === "D") return "sell";
  }
  return null; // exclude (award, RSU, tax, gift, etc.)
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

    const direction = classifyTx(row);
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
      // Discount sells: 10b5-1 plans and diversification are common and not predictive
      weightedSell += weighted * 0.5;
      totalSellUSD += valueUSD;
      recentTxs.push({ direction, row, valueUSD, dateStr });
    }
  }

  const clusterBonus = buyerSet30d.size >= 2 ? 12 : buyerSet30d.size >= 1 ? 4 : 0;
  const total = weightedBuy + weightedSell;

  let score;
  if (total === 0) {
    score = 50; // no relevant activity → neutral
  } else {
    // netRatio in [-1, +1]; map to [0, 100]
    const netRatio = (weightedBuy - weightedSell) / total;
    score = Math.round((netRatio + 1) * 50);
    score = Math.min(100, Math.max(0, score + clusterBonus));
  }

  const signal = score >= 65 ? "Accumulating" : score <= 35 ? "Distributing" : "Neutral";

  // Top 6 most-recent transactions for display
  const transactions = recentTxs
    .sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr))
    .slice(0, 6)
    .map(({ direction, row, valueUSD, dateStr }) => ({
      date:     dateStr.slice(0, 10),
      name:     row.reportingName || "Unknown",
      role:     shortRole(row.typeOfOwner),
      type:     direction,
      shares:   Math.abs(row.securitiesTransacted || 0),
      valueM:   Math.round(valueUSD / 10000) / 100, // 2 decimal places in $M
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

async function fetchTicker(ticker, apiKey, cutoff) {
  const sym = toFmpSymbol(ticker);
  const url = `${FMP_BASE}/insider-trading?symbol=${sym}&limit=50&apikey=${apiKey}`;
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

  const today  = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - LOOKBACK);

  const signals = {};
  let fetched = 0, errors = 0;

  for (let i = 0; i < UNIVERSE_TICKERS.length; i += BATCH_SIZE) {
    const batch   = UNIVERSE_TICKERS.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map(t => fetchTicker(t, apiKey, cutoff))
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

  const payload = {
    fetchedAt:    today.toISOString().slice(0, 10),
    tickerCount:  fetched,
    errorCount:   errors,
    lookbackDays: LOOKBACK,
    source:       "Financial Modeling Prep (FMP) — SEC Form 4 insider transactions",
    accumulating,
    distributing,
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
  });
}
