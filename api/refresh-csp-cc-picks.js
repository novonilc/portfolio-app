// Vercel Cron Job — computes technical signal picks for Cash-Secured Puts and Covered Calls.
// Schedule: 0 6 * * 1-5 (6 AM UTC, weekdays — before US market open)
// Runs daily so traders have fresh picks each morning based on prior day's close.
// Auth: Authorization: Bearer CRON_SECRET

import { put } from "@vercel/blob";

const BLOB_PATH = "csp-cc-picks/latest.json";

const SCAN_TICKERS = [
  // Mega-cap tech
  "AAPL", "MSFT", "NVDA", "AMD", "META", "GOOGL", "AMZN", "TSLA", "PLTR", "ARM",
  // Cloud / SaaS
  "SNOW", "DDOG", "CRWD", "ZS", "NET", "MDB", "TEAM",
  // Semiconductors
  "AVGO", "QCOM", "MU", "SMCI", "AMAT", "LRCX", "ALAB",
  // Financials
  "JPM", "BAC", "GS", "V", "BRK.B", "SCHW", "MS", "C", "ICE",
  // Healthcare & Pharma
  "LLY", "JNJ", "ISRG", "NVO", "UNH", "MRNA", "ABBV",
  // Energy
  "XOM", "CVX", "CNQ", "OXY",
  // Defense / Industrial
  "RTX", "AXON", "GE", "BA",
  // Consumer & Retail
  "COST", "SHOP", "NFLX", "SBUX", "HD", "NKE",
  // Fintech & Payments
  "SQ", "PYPL", "HOOD",
  // EV & Mobility
  "RIVN", "F", "GM",
  // High-beta / speculative
  "SOFI", "COIN", "MARA", "MSTR",
  // ETFs
  "SPY", "QQQ", "IWM", "XLF", "XLE", "XLK", "GLD", "XBI",
];

// ─── Technical indicator helpers ──────────────────────────────────────────────

function computeEMA(values, period) {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const result = new Array(values.length).fill(null);
  result[period - 1] = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    result[i] = values[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

function computeRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return parseFloat((100 - 100 / (1 + avgGain / avgLoss)).toFixed(1));
}

function computeMACD(closes, fast = 12, slow = 26, signal = 9) {
  if (closes.length < slow + signal) return null;
  const emaFast = computeEMA(closes, fast);
  const emaSlow = computeEMA(closes, slow);
  const macdLine = [];
  for (let i = 0; i < closes.length; i++) {
    if (emaFast[i] != null && emaSlow[i] != null) macdLine.push(emaFast[i] - emaSlow[i]);
  }
  if (macdLine.length < signal) return null;
  const sigEMA = computeEMA(macdLine, signal);
  const lastMACD   = macdLine[macdLine.length - 1];
  const lastSignal = sigEMA[sigEMA.length - 1];
  return {
    macd:      parseFloat(lastMACD.toFixed(3)),
    signal:    parseFloat(lastSignal.toFixed(3)),
    histogram: parseFloat((lastMACD - lastSignal).toFixed(3)),
  };
}

function computeSMA(closes, period) {
  if (closes.length < period) return null;
  return parseFloat((closes.slice(-period).reduce((a, b) => a + b, 0) / period).toFixed(2));
}

function computeVWAP(highs, lows, closes, volumes, period = 20) {
  const n = Math.min(period, closes.length);
  const h = highs.slice(-n), l = lows.slice(-n), c = closes.slice(-n), v = volumes.slice(-n);
  let sumPV = 0, sumV = 0;
  for (let i = 0; i < n; i++) {
    const tp = (h[i] + l[i] + c[i]) / 3;
    sumPV += tp * v[i];
    sumV  += v[i];
  }
  return sumV > 0 ? parseFloat((sumPV / sumV).toFixed(2)) : null;
}

function computeATR(highs, lows, closes, period = 14) {
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

function computeHV(closes, period = 20) {
  if (closes.length < period + 2) return null;
  const lr = [];
  for (let i = 1; i < closes.length; i++) if (closes[i-1] > 0) lr.push(Math.log(closes[i] / closes[i-1]));
  const rec = lr.slice(-period);
  const mean = rec.reduce((a, b) => a + b, 0) / rec.length;
  const variance = rec.reduce((s, r) => s + (r - mean) ** 2, 0) / (rec.length - 1);
  return parseFloat((Math.sqrt(variance * 252) * 100).toFixed(1));
}

function computeBBPos(closes, period = 20) {
  if (closes.length < period) return null;
  const sl = closes.slice(-period);
  const mean = sl.reduce((a, b) => a + b, 0) / period;
  const std  = Math.sqrt(sl.reduce((s, c) => s + (c - mean) ** 2, 0) / period);
  if (std === 0) return 0.5;
  const pos = (closes[closes.length - 1] - (mean - 2 * std)) / (4 * std);
  return parseFloat(Math.max(0, Math.min(1, pos)).toFixed(2));
}

// HV Rank (IV Rank proxy): where does today's HV20 sit within its own 52-week range?
// Formula mirrors standard IV Rank: (current - 52w low) / (52w high - 52w low) × 100
// 0 = historically cheap volatility (thin premium), 100 = historically expensive (fat premium).
// Computed from rolling HV20 values — no options chain data required.
function computeHVRank(closes, period = 20) {
  // Need enough bars to compute a meaningful rolling history
  if (closes.length < period + 2 + 60) return null;

  // Build log-return series once
  const lr = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) lr.push(Math.log(closes[i] / closes[i - 1]));
  }

  // Rolling HV20 at every bar position
  const hvHistory = [];
  for (let i = period; i <= lr.length; i++) {
    const rec = lr.slice(i - period, i);
    const mean = rec.reduce((a, b) => a + b, 0) / rec.length;
    const variance = rec.reduce((s, r) => s + (r - mean) ** 2, 0) / (rec.length - 1);
    hvHistory.push(Math.sqrt(variance * 252) * 100);
  }

  if (hvHistory.length < 2) return null;

  // Use up to 252 most-recent readings (one trading year)
  const history = hvHistory.slice(-252);
  const hvLow   = Math.min(...history);
  const hvHigh  = Math.max(...history);
  if (hvHigh === hvLow) return 50;

  const currentHV = history[history.length - 1];
  const rank = (currentHV - hvLow) / (hvHigh - hvLow) * 100;
  return parseFloat(Math.max(0, Math.min(100, rank)).toFixed(1));
}

// ─── CSP scoring ──────────────────────────────────────────────────────────────
// Cash-Secured Put: sell a put below current price, profit if stock stays flat or rises.
// Best candidates: bullish lean, not overbought, stable IV, near support.

function scoreCsp({ rsi, macd, price, sma50, sma200, vwap, volumeRatio, atrPct, hvPct, hvRank, bbPos }) {
  let score = 35;
  const signals = [];

  // RSI: want 40-62 (neutral to mildly bullish, not a falling knife)
  if (rsi != null) {
    if      (rsi >= 40 && rsi <= 62)  { score += 15; signals.push(`RSI ${rsi}`); }
    else if (rsi >  62 && rsi <= 72)  { score += 8;  signals.push(`RSI ${rsi} (stretched)`); }
    else if (rsi >= 35 && rsi <  40)  { score += 4;  signals.push(`RSI ${rsi} (pullback)`); }
    else if (rsi < 35)                { score -= 15; }
    else if (rsi > 75)                { score -= 8;  }
  }

  // Trend: above SMA50 = put likely stays OTM
  if (sma50 != null) {
    if (price > sma50)  { score += 12; signals.push("Above SMA50"); }
    else                { score -= 5;  }
  }
  if (sma50 != null && sma200 != null && sma50 > sma200) {
    score += 8;
    signals.push("Golden cross");
  }

  // BB position: near lower band = at support = better put-strike cushion
  if (bbPos != null) {
    if      (bbPos < 0.30) { score += 10; signals.push("Near support"); }
    else if (bbPos < 0.50) { score += 5;  }
    else if (bbPos > 0.85) { score -= 8;  }
  }

  // HV Rank (IV Rank proxy): primary premium-quality gate.
  // For CSP, sweet spot is 45-80%: elevated enough for good premium but not panic-fear levels.
  // Very high HVR (>85%) on a CSP is risky — stock may be in freefall.
  if (hvRank != null) {
    if      (hvRank >= 60 && hvRank <= 82) { score += 16; signals.push(`IVR ${Math.round(hvRank)}%`); }
    else if (hvRank >= 45 && hvRank <  60) { score += 10; signals.push(`IVR ${Math.round(hvRank)}%`); }
    else if (hvRank >  82)                 { score += 4;  signals.push(`IVR ${Math.round(hvRank)}% (high)`); }
    else if (hvRank >= 30 && hvRank <  45) { score += 4;  }
    else                                   { score -= 10; } // <30%: cheap vol, thin premium
  }

  // HV absolute level: secondary validation — ensures meaningful dollar premium
  if (hvPct != null) {
    if      (hvPct >= 18 && hvPct <= 50) { score += 5; }
    else if (hvPct > 55)                 { score -= 6; }
    else if (hvPct < 14)                 { score -= 4; }
  }

  // Volume: high ratio = liquid options market, tighter bid-ask
  if      (volumeRatio >= 1.5) { score += 8; signals.push("High volume"); }
  else if (volumeRatio >= 1.0) { score += 4; }
  else if (volumeRatio < 0.6)  { score -= 6; }

  // ATR stability: low daily range = defined risk, easier collateral sizing
  if (atrPct != null) {
    if      (atrPct < 2.0) { score += 6; signals.push("Stable range"); }
    else if (atrPct < 3.0) { score += 3; }
    else if (atrPct > 4.5) { score -= 8; }
  }

  // MACD: positive histogram = upward momentum = CSP stays safe
  if (macd?.histogram != null && macd.histogram > 0) {
    score += 6;
    signals.push("Momentum up");
  }

  // VWAP proximity: trading near fair value = stable setup
  if (vwap != null && Math.abs((price - vwap) / vwap) < 0.015) {
    score += 4;
    signals.push("Near VWAP");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const rating = score >= 72 ? "Strong" : score >= 58 ? "Good" : score >= 44 ? "Fair" : "Skip";
  return { cspScore: score, cspSignals: signals.slice(0, 4), cspRating: rating };
}

// ─── CC scoring ───────────────────────────────────────────────────────────────
// Covered Call: sell a call above current price on a holding, profit if stock stays flat or dips.
// Best candidates: extended RSI, near upper Bollinger Band, elevated IV.

function scoreCc({ rsi, macd, price, sma50, sma200, vwap, volumeRatio, atrPct, hvPct, hvRank, bbPos }) {
  let score = 35;
  const signals = [];

  // RSI: 58-75 = extended = ideal time to cap upside with a call
  if (rsi != null) {
    if      (rsi >= 58 && rsi <= 75)  { score += 18; signals.push(`RSI ${rsi} (extended)`); }
    else if (rsi >= 50 && rsi <  58)  { score += 10; signals.push(`RSI ${rsi} (neutral)`);  }
    else if (rsi >  75 && rsi <= 85)  { score += 5;  signals.push(`RSI ${rsi} (overbought)`);}
    else if (rsi < 44)                { score -= 10; }
  }

  // Trend: above SMA50 = call strike has a backstop trend
  if (sma50 != null && price > sma50) {
    score += 10;
    signals.push("Above SMA50");
  }
  if (sma50 != null && sma200 != null && sma50 > sma200) {
    score += 8;
    signals.push("Uptrend intact");
  }

  // BB position: near upper band = extended = prime time to sell calls
  if (bbPos != null) {
    if      (bbPos > 0.80) { score += 17; signals.push("Near upper BB"); }
    else if (bbPos > 0.65) { score += 12; signals.push("Upper BB zone"); }
    else if (bbPos > 0.50) { score += 5;  }
    else if (bbPos < 0.30) { score -= 8;  }
  }

  // HV Rank (IV Rank proxy): the #1 signal for premium selling.
  // Higher IVR = fatter call premium = better reward for capping your upside.
  // No meaningful upper risk cap for CC since you already own the shares.
  if (hvRank != null) {
    if      (hvRank >= 70)             { score += 18; signals.push(`IVR ${Math.round(hvRank)}%`); }
    else if (hvRank >= 50)             { score += 12; signals.push(`IVR ${Math.round(hvRank)}%`); }
    else if (hvRank >= 35)             { score += 6;  signals.push(`IVR ${Math.round(hvRank)}%`); }
    else if (hvRank >= 20)             { score += 2;  }
    else                               { score -= 8;  } // <20%: vol too cheap, premium not worth it
  }

  // HV absolute level: secondary check — ensures dollar premium is meaningful
  if (hvPct != null) {
    if      (hvPct >= 18 && hvPct <= 55) { score += 5; }
    else if (hvPct < 14)                 { score -= 4; }
    else if (hvPct > 60)                 { score -= 3; }
  }

  // Volume: high ratio = liquid options chain, easier to get filled
  if      (volumeRatio >= 1.5) { score += 8; signals.push("High volume"); }
  else if (volumeRatio >= 1.0) { score += 4; }
  else if (volumeRatio < 0.6)  { score -= 6; }

  // ATR: some daily movement = richer premium, but not too wild
  if (atrPct != null) {
    if      (atrPct >= 1.5 && atrPct <= 3.5) { score += 5; signals.push("Good range"); }
    else if (atrPct > 5.0)                   { score -= 5; }
  }

  // MACD: positive = stock still lifting = OTM call likely safe
  if (macd?.histogram != null && macd.histogram > 0) {
    score += 5;
    signals.push("MACD positive");
  }

  // Price well above VWAP = extended, call premium rich
  if (vwap != null && price > vwap) {
    const pct = (price - vwap) / vwap;
    if      (pct > 0.02) { score += 5; signals.push("Above VWAP"); }
    else if (pct > 0)    { score += 3; }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const rating = score >= 72 ? "Strong" : score >= 58 ? "Good" : score >= 44 ? "Fair" : "Skip";
  return { ccScore: score, ccSignals: signals.slice(0, 4), ccRating: rating };
}

// ─── Per-ticker fetch + compute ───────────────────────────────────────────────

async function fetchYahooChart(ticker, attempt = 0) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
      return fetchYahooChart(ticker, attempt + 1);
    }
    throw e;
  }
}

async function analyzeTicker(ticker) {
  const data = await fetchYahooChart(ticker);
  const result = data.chart?.result?.[0];
  if (!result) throw new Error("No chart data");

  const quote = result.indicators?.quote?.[0] || {};
  const rawC  = quote.close  || [];
  const rawH  = quote.high   || [];
  const rawL  = quote.low    || [];
  const rawV  = quote.volume || [];

  const bars = rawC.map((c, i) => ({ c: rawC[i], h: rawH[i], l: rawL[i], v: rawV[i] }))
    .filter(b => b.c != null && b.h != null && b.l != null && b.v != null);

  if (bars.length < 50) throw new Error("Insufficient history (<50 bars)");

  const closes  = bars.map(b => b.c);
  const highs   = bars.map(b => b.h);
  const lows    = bars.map(b => b.l);
  const volumes = bars.map(b => b.v);

  const price     = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2];
  const sma50     = computeSMA(closes, 50);
  const sma200    = computeSMA(closes, 200);
  const rsi       = computeRSI(closes);
  const macd      = computeMACD(closes);
  const vwap      = computeVWAP(highs, lows, closes, volumes, 20);
  const atrResult = computeATR(highs, lows, closes);
  const atrPct    = atrResult?.atrPct ?? null;
  const hvPct     = computeHV(closes);
  const hvRank    = computeHVRank(closes);
  const bbPos     = computeBBPos(closes);

  const lastVol  = volumes[volumes.length - 1];
  const avg20Vol = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
  const volumeRatio = avg20Vol > 0 ? parseFloat((lastVol / avg20Vol).toFixed(2)) : 1;

  const indicators = { rsi, macd, price, sma50, sma200, vwap, volumeRatio, atrPct, hvPct, hvRank, bbPos };
  const cspResult  = scoreCsp(indicators);
  const ccResult   = scoreCc(indicators);

  const high52w = parseFloat(Math.max(...highs).toFixed(2));
  const low52w  = parseFloat(Math.min(...lows).toFixed(2));

  return {
    ticker,
    price:          parseFloat(price.toFixed(2)),
    priceChangePct: prevClose ? parseFloat(((price - prevClose) / prevClose * 100).toFixed(2)) : 0,
    rsi,
    hvPct,
    hvRank,
    bbPos,
    sma50,
    sma200,
    atrPct,
    volumeRatio,
    vwap,
    high52w,
    low52w,
    ...cspResult,
    ...ccResult,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.CRON_SECRET;
  const auth   = (req.headers.authorization || "").trim();
  if (secret && auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized — provide Authorization: Bearer <CRON_SECRET>" });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN not configured" });
  }

  try {
    const results = await Promise.allSettled(SCAN_TICKERS.map(t => analyzeTicker(t)));

    const all    = [];
    const errors = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") all.push(r.value);
      else errors.push({ ticker: SCAN_TICKERS[i], error: r.reason?.message });
    });

    // Filter to picks worth showing (score >= 50 = Fair or better)
    const cspPicks = all.filter(p => p.cspScore >= 50).sort((a, b) => b.cspScore - a.cspScore);
    const ccPicks  = all.filter(p => p.ccScore  >= 50).sort((a, b) => b.ccScore  - a.ccScore);

    const payload = {
      cspPicks,
      ccPicks,
      errors,
      lastUpdated:  new Date().toISOString(),
      scannedAt:    new Date().toISOString(),
      tickerCount:  all.length,
    };

    await put(BLOB_PATH, JSON.stringify(payload), {
      access:          "public",
      contentType:     "application/json",
      addRandomSuffix: false,
      allowOverwrite:  true,
    });

    return res.status(200).json({
      ok:        true,
      cspCount:  cspPicks.length,
      ccCount:   ccPicks.length,
      errorCount: errors.length,
      lastUpdated: payload.lastUpdated,
      topCsp: cspPicks.slice(0, 3).map(p => `${p.ticker}(${p.cspScore})`),
      topCc:  ccPicks.slice(0,  3).map(p => `${p.ticker}(${p.ccScore})`),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
