// Vercel Cron Job — computes technical indicators for vertical spread candidates.
// Schedule: 30 21 * * 1-5 (5:30 PM ET / 21:30 UTC, weekdays only)
// Runs after market close so RSI, MACD, and VWAP reflect the complete trading session.
// Auth: Authorization: Bearer CRON_SECRET (same pattern as refresh-pulse)

import { put } from "@vercel/blob";

const BLOB_PATH = "options-signals/latest.json";

// Liquid, optionable tickers well-suited for vertical spreads
const SCAN_TICKERS = [
  // Mega-cap tech
  "AAPL", "MSFT", "NVDA", "AMD", "META", "GOOGL", "AMZN", "TSLA", "PLTR", "ARM",
  // Financials
  "JPM", "BAC", "GS", "V", "BRK.B",
  // Healthcare
  "LLY", "JNJ", "ISRG", "NVO",
  // Energy
  "XOM", "CVX", "CNQ",
  // Defense / Industrial
  "RTX", "AXON",
  // Consumer
  "COST", "SHOP",
  // High-beta / speculative
  "SOFI", "COIN", "MARA",
  // ETFs (most liquid spread vehicles)
  "SPY", "QQQ", "IWM", "XLF", "XLE", "XLK",
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

// ─── Spread scoring ───────────────────────────────────────────────────────────

function scoreForSpreads({ rsi, macd, price, sma50, sma200, vwap, volumeRatio }) {
  let score = 40;
  let bull = 0, bear = 0;

  // Volume: higher volume = better options liquidity
  if      (volumeRatio >= 2.0) { score += 20; bull += 1; bear += 1; }
  else if (volumeRatio >= 1.5) { score += 14; bull += 1; bear += 1; }
  else if (volumeRatio >= 1.0) { score += 8;  }
  else if (volumeRatio < 0.6)  { score -= 12; } // thin market — wide spreads

  // RSI: 35–65 is the sweet spot for premium selling (avoids gaps at extremes)
  if (rsi != null) {
    if      (rsi >= 35 && rsi <= 65) score += 18;
    else if (rsi >= 28 && rsi <  35) score += 8;
    else if (rsi >  65 && rsi <= 73) score += 8;
    else                             score -= 12; // extreme RSI = avoid

    if (rsi >= 52) bull += 2;
    else           bear += 2;
  }

  // MACD histogram: magnitude signals trend conviction
  if (macd?.histogram != null) {
    const relMag = Math.abs(macd.histogram) / (price * 0.003);
    score += Math.min(12, Math.round(relMag * 6));
    if (macd.histogram > 0) { bull += 3; }
    else                    { bear += 3; }
    // Fresh MACD cross adds directional clarity
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

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Direction: require a margin of 3+ to call directional
  let direction = "neutral";
  if      (bull >= bear + 3) direction = "bullish";
  else if (bear >= bull + 3) direction = "bearish";

  // Recommendation
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

async function analyzeTickerForSpreads(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const result = data.chart?.result?.[0];
  if (!result) throw new Error("No chart data");

  const quote   = result.indicators?.quote?.[0] || {};
  const rawC    = quote.close  || [];
  const rawH    = quote.high   || [];
  const rawL    = quote.low    || [];
  const rawV    = quote.volume || [];

  // Zip and filter out null bars (Yahoo sometimes returns null mid-series)
  const bars = rawC.map((c, i) => ({
    c: rawC[i], h: rawH[i], l: rawL[i], v: rawV[i],
  })).filter(b => b.c != null && b.h != null && b.l != null && b.v != null);

  if (bars.length < 30) throw new Error("Insufficient history");

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

  const lastVol   = volumes[volumes.length - 1];
  const avg20Vol  = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
  const volumeRatio = avg20Vol > 0 ? parseFloat((lastVol / avg20Vol).toFixed(2)) : 1;

  const { score, direction, recommendation, recommendationColor } = scoreForSpreads({
    rsi, macd, price, sma50, sma200, vwap, volumeRatio,
  });

  // 52-week high/low context
  const high52w = parseFloat(Math.max(...highs).toFixed(2));
  const low52w  = parseFloat(Math.min(...lows).toFixed(2));

  return {
    ticker,
    price:         parseFloat(price.toFixed(2)),
    priceChangePct: prevClose ? parseFloat(((price - prevClose) / prevClose * 100).toFixed(2)) : 0,
    volume:        lastVol,
    volumeRatio,
    vwap,
    sma50,
    sma200,
    rsi,
    macd,
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
