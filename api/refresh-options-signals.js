// Vercel Cron Job — computes technical indicators for vertical spread candidates.
// Schedule: 30 21 * * 1-5 (5:30 PM ET / 21:30 UTC, weekdays only)
// Runs after market close so RSI, MACD, and VWAP reflect the complete trading session.
// Auth: Authorization: Bearer CRON_SECRET (same pattern as refresh-pulse)

import { put } from "@vercel/blob";

const BLOB_PATH = "options-signals/latest.json";

// Liquid, optionable tickers well-suited for vertical spreads.
// Covers mega-caps, mid-cap growth, sector leaders, and liquid ETFs.
// All have weekly options and sufficient open interest for spread fills.
const SCAN_TICKERS = [
  // Mega-cap tech
  "AAPL", "MSFT", "NVDA", "AMD", "META", "GOOGL", "AMZN", "TSLA", "PLTR", "ARM",
  // Cloud / SaaS
  "SNOW", "DDOG", "CRWD", "ZS", "NET", "MDB", "TEAM",
  // Semiconductors
  "AVGO", "QCOM", "MU", "SMCI", "AMAT", "LRCX",
  // Financials
  "JPM", "BAC", "GS", "V", "BRK.B", "SCHW", "MS", "C",
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
  "SOFI", "COIN", "MARA",
  // ETFs (most liquid spread vehicles)
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
  const slice = closes.slice(-period);
  return parseFloat((slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(2));
}

// 20-day volume-weighted average price using Typical Price = (H+L+C)/3
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

// ATR (14-period Wilder smoothing) — returns { atr, atrPct }
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

// 20-day Historical Volatility (annualised %) from log returns
function computeHV(closes, period = 20) {
  if (closes.length < period + 2) return null;
  const lr = [];
  for (let i = 1; i < closes.length; i++) if (closes[i-1] > 0) lr.push(Math.log(closes[i] / closes[i-1]));
  const rec = lr.slice(-period);
  const mean = rec.reduce((a, b) => a + b, 0) / rec.length;
  const variance = rec.reduce((s, r) => s + (r - mean) ** 2, 0) / (rec.length - 1);
  return parseFloat((Math.sqrt(variance * 252) * 100).toFixed(1));
}

// Bollinger Band position: 0 = at lower band, 1 = at upper band
function computeBBPos(closes, period = 20) {
  if (closes.length < period) return null;
  const sl = closes.slice(-period);
  const mean = sl.reduce((a, b) => a + b, 0) / period;
  const std  = Math.sqrt(sl.reduce((s, c) => s + (c - mean) ** 2, 0) / period);
  if (std === 0) return 0.5;
  const pos = (closes[closes.length - 1] - (mean - 2 * std)) / (4 * std);
  return parseFloat(Math.max(0, Math.min(1, pos)).toFixed(2));
}

// ─── Spread scoring ───────────────────────────────────────────────────────────

function scoreForSpreads({ rsi, macd, price, sma50, sma200, vwap, volumeRatio, atrPct, hvPct, bbPos }) {
  let score = 40;
  let bull = 0, bear = 0;

  // Volume: higher volume = better options liquidity
  if      (volumeRatio >= 2.0) { score += 20; bull += 1; bear += 1; }
  else if (volumeRatio >= 1.5) { score += 14; bull += 1; bear += 1; }
  else if (volumeRatio >= 1.0) { score += 8;  }
  else if (volumeRatio < 0.6)  { score -= 12; }

  // RSI: 35–65 is the sweet spot for premium selling
  if (rsi != null) {
    if      (rsi >= 35 && rsi <= 65) score += 18;
    else if (rsi >= 28 && rsi <  35) score += 8;
    else if (rsi >  65 && rsi <= 73) score += 8;
    else                             score -= 12;
    if (rsi >= 52) bull += 2;
    else           bear += 2;
  }

  // MACD histogram: magnitude signals trend conviction
  if (macd?.histogram != null) {
    const relMag = Math.abs(macd.histogram) / (price * 0.003);
    score += Math.min(12, Math.round(relMag * 6));
    if (macd.histogram > 0) { bull += 3; }
    else                    { bear += 3; }
    if (macd.macd > macd.signal && macd.macd > 0) bull++;
    if (macd.macd < macd.signal && macd.macd < 0) bear++;
  }

  // Price vs SMA50 (medium-term trend)
  if (sma50 != null) {
    const pct = (price - sma50) / sma50;
    score += 6;
    if (pct >  0.02) bull += 2;
    else if (pct < -0.02) bear += 2;
  }

  // SMA50 vs SMA200: golden cross (bullish) or death cross (bearish)
  if (sma50 != null && sma200 != null) {
    if (sma50 > sma200) { score += 10; bull += 2; }
    else                { score += 4;  bear += 2; }
  }

  // VWAP proximity: price near VWAP = stable, good for defined-risk trades
  if (vwap != null) {
    const pct = Math.abs((price - vwap) / vwap);
    if      (pct <= 0.015) score += 10;
    else if (pct <= 0.04)  score += 5;
    if (price > vwap) bull++;
    else              bear++;
  }

  // ATR% — lower = tighter daily ranges = better premium-selling conditions
  if (atrPct != null) {
    if      (atrPct < 1.5) score += 8;
    else if (atrPct < 2.5) score += 4;
    else if (atrPct < 3.5) score += 1;
    else if (atrPct > 5.0) score -= 12;
    else if (atrPct > 4.0) score -= 6;
  }

  // HV20 — 18–45% annualised is the sweet spot: meaningful premium, not chaotic
  if (hvPct != null) {
    if (hvPct >= 18 && hvPct <= 45) score += 5;
    else if (hvPct > 55)            score -= 5;
  }

  // Bollinger Band position: mid-range = IC territory; extremes signal direction
  if (bbPos != null) {
    if      (bbPos >= 0.25 && bbPos <= 0.75) { score += 6; }
    else if (bbPos < 0.20) { score += 4; bull += 2; }
    else if (bbPos > 0.80) { score += 4; bear += 2; }
    else                   { score += 2; }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let direction = "neutral";
  if      (bull >= bear + 3) direction = "bullish";
  else if (bear >= bull + 3) direction = "bearish";

  let recommendation, recommendationColor;
  if (score >= 65 && direction === "bullish") {
    recommendation = "Bull Put Spread";
    recommendationColor = "#22c55e";
  } else if (score >= 65 && direction === "bearish") {
    recommendation = "Bear Call Spread";
    recommendationColor = "#ef4444";
  } else if (score >= 65) {
    recommendation = "Iron Condor";
    recommendationColor = "#a78bfa";
  } else if (score >= 48) {
    recommendation = "Caution";
    recommendationColor = "#fbbf24";
  } else {
    recommendation = "Skip";
    recommendationColor = "rgba(255,255,255,0.3)";
  }

  return { score, direction, recommendation, recommendationColor, bull, bear };
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

async function analyzeTickerForSpreads(ticker) {
  const data = await fetchYahooChart(ticker);

  const result = data.chart?.result?.[0];
  if (!result) throw new Error("No chart data");

  const quote   = result.indicators?.quote?.[0] || {};
  const rawC    = quote.close  || [];
  const rawH    = quote.high   || [];
  const rawL    = quote.low    || [];
  const rawV    = quote.volume || [];

  const bars = rawC.map((c, i) => ({
    c: rawC[i], h: rawH[i], l: rawL[i], v: rawV[i],
  })).filter(b => b.c != null && b.h != null && b.l != null && b.v != null);

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
  const bbPos     = computeBBPos(closes);

  const lastVol   = volumes[volumes.length - 1];
  const avg20Vol  = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
  const volumeRatio = avg20Vol > 0 ? parseFloat((lastVol / avg20Vol).toFixed(2)) : 1;

  const { score, direction, recommendation, recommendationColor, bull, bear } = scoreForSpreads({
    rsi, macd, price, sma50, sma200, vwap, volumeRatio, atrPct, hvPct, bbPos,
  });

  const high52w = parseFloat(Math.max(...highs).toFixed(2));
  const low52w  = parseFloat(Math.min(...lows).toFixed(2));

  return {
    ticker,
    price:          parseFloat(price.toFixed(2)),
    priceChangePct: prevClose ? parseFloat(((price - prevClose) / prevClose * 100).toFixed(2)) : 0,
    volume:         lastVol,
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
    high52w,
    low52w,
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
    const results = await Promise.allSettled(
      SCAN_TICKERS.map(t => analyzeTickerForSpreads(t))
    );

    const signals = [];
    const errors  = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") signals.push(r.value);
      else errors.push({ ticker: SCAN_TICKERS[i], error: r.reason?.message });
    });

    // Sort by score descending
    signals.sort((a, b) => b.score - a.score);

    const payload = {
      signals,
      errors,
      lastUpdated:  new Date().toISOString(),
      tickerCount:  signals.length,
      scannedAt:    new Date().toISOString(),
    };

    await put(BLOB_PATH, JSON.stringify(payload), {
      access:          "public",
      contentType:     "application/json",
      addRandomSuffix: false,
      allowOverwrite:  true,
    });

    return res.status(200).json({
      ok:           true,
      tickerCount:  signals.length,
      errorCount:   errors.length,
      lastUpdated:  payload.lastUpdated,
      topPicks:     signals.slice(0, 5).map(s => `${s.ticker}(${s.score})`),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
