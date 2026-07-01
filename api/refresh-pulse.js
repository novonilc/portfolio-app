// Vercel Cron Job handler — generates fresh Market Pulse data on a schedule.
// Schedule is configured in vercel.json under "crons".
// Protected by Authorization: Bearer CRON_SECRET (Vercel injects this automatically).
// Can also be triggered manually: POST /api/refresh-pulse with the same header.

import { put, list } from "@vercel/blob";

const BLOB_PATH      = "market-pulse/latest.json";
const RECS_BLOB_PATH = "recommendations-context/latest.json";

// Folded into this file (rather than its own api/*.js) to stay under Vercel's
// Hobby-plan 12-Serverless-Function cap — triggered via ?target=recommendations.
async function fetchLatestBlob(prefix) {
  try {
    const { blobs } = await list({ prefix });
    if (!blobs.length) return null;
    const res = await fetch(blobs[0].url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function buildRecommendationsPrompt(pulse, bnn) {
  const today      = new Date().toISOString().split("T")[0];
  const monthLabel = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  const pulseLines = [];
  if (pulse) {
    pulseLines.push(`- Regime: ${pulse.regime?.label} — ${pulse.regime?.sublabel}`);
    pulseLines.push(`- Regime description: ${pulse.regime?.description}`);
    pulseLines.push(`- Risk meter: ${pulse.riskMeter?.score}/100 — ${pulse.riskMeter?.label}`);
    if (pulse.yieldCurve) pulseLines.push(`- Yield curve: ${pulse.yieldCurve.shapeLabel} (${pulse.yieldCurve.trajectory || ""})`);
    if (pulse.buffettIndicator) pulseLines.push(`- Buffett Indicator: ${pulse.buffettIndicator.value} (${pulse.buffettIndicator.valueLabel})`);
    (pulse.macroSignals || []).forEach(cat => {
      (cat.signals || []).forEach(s => {
        if (["S&P 500","TSX Composite","VIX","Fear & Greed","Oil (WTI)","Gold","Fed Funds Rate","US CPI (YoY)","Copper (front-month)"].includes(s.label)) {
          pulseLines.push(`- ${s.label}: ${s.value} (${s.status}) — ${s.note}`);
        }
      });
    });
    (pulse.newsSignals || []).forEach(n => pulseLines.push(`- [${n.source}, ${n.date}] ${n.headline}`));
    if (pulse.catalysts?.bullish?.length) pulseLines.push(`- Bullish catalysts: ${pulse.catalysts.bullish.map(c => c.label).join(" | ")}`);
    if (pulse.catalysts?.bearish?.length) pulseLines.push(`- Bearish catalysts: ${pulse.catalysts.bearish.map(c => c.label).join(" | ")}`);
    if (pulse.portfolioImplication?.summary) pulseLines.push(`- Portfolio implication summary: ${pulse.portfolioImplication.summary}`);
  }

  let bnnBlock = "";
  if (bnn?.experts?.length) {
    const rows = bnn.experts.flatMap(e => (e.picks || []).map(p =>
      `  ${p.ticker} — ${p.rawAction || p.action.toUpperCase()} [${e.guest}${e.firm ? ", " + e.firm : ""}]: "${p.rationale}"`
    ));
    if (rows.length) bnnBlock = `\nBNN Bloomberg Market Call picks (${bnn.date || "latest"}):\n` + rows.join("\n");
  }

  return `You are a senior investment strategist writing the "market context" header for a curated stock recommendations page (TFSA/RRSP-focused, Canadian investor audience). The page covers a fixed universe of ~13 hand-picked compounders spanning: defense (RTX), energy (ENB, SU.TO), AI infrastructure (ARM, ASML), healthcare (ISRG, NVO, JNJ), Canadian financials (RY), consumer (COST, MCD), payments (V), and Canadian tech (SHOP), plus a cash-rich value anchor (BRK.B).

Today's date: ${today}

Grounding input — the most recently published Market Pulse (treat as authoritative; do not contradict it):
${pulseLines.length ? pulseLines.join("\n") : "(no pulse data available — use your best current knowledge)"}
${bnnBlock}

Your job is NOT to re-derive macro data. It is to distill the above into a punchy, stock-picker-facing summary that helps someone scanning the recommendations list understand the current regime at a glance, and to flag which of the 13 tickers' theses are most and least supported by current conditions.

Be concise — every "desc" field: one sentence max, specific, and tied to a real, current fact from the grounding input above (not generic).

Return ONLY a JSON object inside a single \`\`\`json code block, no text before or after, matching this schema exactly:

{
  "lastUpdated": "${today}",
  "marketContext": {
    "period": "${monthLabel}",
    "conflictAlert": "short ALL-CAPS-style headline, <60 chars, naming the single biggest live risk or catalyst right now",
    "conflictInsights": [
      { "label": "short 3-6 word label", "desc": "one sentence, specific to the current data" }
    ],
    "themes": [
      { "icon": "single emoji", "label": "2-4 word theme name", "color": "#22c55e (bullish) | #fbbf24 (caution) | #ef4444 (bearish) | #a78bfa (secular/structural) | #22d3ee (Canada-specific) | #64748b (neutral/frozen)", "desc": "one sentence tying this theme to specific tickers in the universe listed above where relevant" }
    ]
  }
}

Requirements:
- conflictInsights: exactly 4 items.
- themes: exactly 8 items, ordered most-to-least market-moving. At least one theme must reference the AI capex / semiconductor complex (relevant to ARM, ASML), at least one must reference the Canadian names (RY, SU.TO, SHOP, ENB), and at least one must reference the defense/geopolitical thread (RTX) if a live conflict or ceasefire is part of the grounding input.
- Do not invent tickers or data points not present in or reasonably inferable from the grounding input.`;
}

async function refreshRecommendationsContext(res) {
  const [pulse, bnn] = await Promise.all([
    fetchLatestBlob("market-pulse/latest"),
    fetchLatestBlob("bnn-calls/latest"),
  ]);

  const prompt = buildRecommendationsPrompt(pulse, bnn);

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type":    "application/json",
      "x-api-key":       process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-sonnet-4-6",
      max_tokens: 4000,
      messages:   [{ role: "user", content: prompt }],
    }),
  });

  if (!aiRes.ok) {
    const err = await aiRes.json().catch(() => ({}));
    return res.status(502).json({ error: "Claude API error", detail: err });
  }

  const aiData  = await aiRes.json();
  const rawText = (aiData.content?.[0]?.text || "").trim();

  let jsonStr = rawText;
  const fence = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) {
    jsonStr = fence[1].trim();
  } else {
    const s = rawText.indexOf("{"), e = rawText.lastIndexOf("}");
    if (s !== -1 && e > s) jsonStr = rawText.slice(s, e + 1);
  }

  const parsed = JSON.parse(jsonStr);
  if (!parsed.marketContext?.themes?.length) {
    return res.status(502).json({ error: "Claude returned incomplete data — try again" });
  }

  const payload = { ...parsed, _scheduledAt: new Date().toISOString() };
  await put(RECS_BLOB_PATH, JSON.stringify(payload), {
    access:          "public",
    contentType:     "application/json",
    addRandomSuffix: false,
    allowOverwrite:  true,
  });

  return res.status(200).json({
    ok:          true,
    lastUpdated: parsed.lastUpdated,
    period:      parsed.marketContext.period,
    themeCount:  parsed.marketContext.themes.length,
  });
}

async function fetchLiveSignals() {
  const live = {};
  const tryFetch = async (url, timeout = 8000) => {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  };
  const tryFetchFredCSV = async (seriesId, timeout = 8000) => {
    const r = await fetch(
      `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`,
      { signal: AbortSignal.timeout(timeout) }
    );
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
    tryFetchFredCSV("T10YIE").then(v  => { live.breakeven10y  = v; }),
    tryFetchFredCSV("DFII10").then(v  => { live.realYield10y  = v; }),
    tryFetchFredCSV("GDP").then(v     => { live.gdpBillions   = v; }),   // US nominal GDP (quarterly, SAAR, $B)
    tryFetchFredCSV("M2SL").then(v    => { live.m2Billions    = v; }),   // M2 money supply ($B, monthly SA)
    tryFetchFredCSV("PCETRIM").then(v => { live.pce16trimmed  = v; }),   // 16% trimmed mean PCE (monthly, annualised %)
    ...[
      ["sp500",       "^GSPC"],
      ["tsx",         "^GSPTSE"],
      ["vix",         "^VIX"],
      ["gold",        "GC=F"],
      ["oil",         "CL=F"],
      ["treasury3m",  "^IRX"],
      ["treasury5y",  "^FVX"],
      ["treasury10y", "^TNX"],
      ["treasury30y", "^TYX"],
      ["wilshire5000","^W5000"],   // Wilshire 5000 — proxy for total US equity market level
    ].map(([key, sym]) =>
      tryFetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`,
        8000
      ).then(d => {
        const closes = d.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
        const last = closes?.filter(Boolean).pop();
        if (last) live[key] = last;
      })
    ),
  ]);

  // Buffett Indicator estimate: Wilshire 5000 points ≈ total US market cap in $B
  // (1 Wilshire point ≈ $1.16B based on mid-2024 calibration; GDP in $B quarterly → annualise)
  if (live.wilshire5000 && live.gdpBillions) {
    const marketCapB = live.wilshire5000 * 1.16;       // approximate $B
    const annualGdpB = live.gdpBillions;               // already annualised SAAR
    live.buffettIndicatorPct = parseFloat((marketCapB / annualGdpB * 100).toFixed(1));
  }

  return live;
}

// Fetch latest BNN Market Call picks from Vercel Blob (best-effort — null on failure)
async function fetchBnnPicks() {
  try {
    const { blobs } = await list({ prefix: "bnn-calls/latest" });
    if (!blobs.length) return null;
    const res = await fetch(blobs[0].url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.experts?.length) return null;
    return data;
  } catch { return null; }
}

function buildPrompt(live, bnn) {
  const today      = new Date().toISOString().split("T")[0];
  const monthLabel = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const t3 = new Date(); t3.setMonth(t3.getMonth() + 3);
  const t6 = new Date(); t6.setMonth(t6.getMonth() + 6);
  const fmt3 = t3.toLocaleString("default", { month: "short", year: "numeric" });
  const fmt6 = t6.toLocaleString("default", { month: "short", year: "numeric" });

  const lines = [];
  if (live.fearGreedValue != null) lines.push(`- CNN Fear & Greed Index: ${live.fearGreedValue}/100 (${live.fearGreedLabel})`);
  if (live.usdCad)        lines.push(`- USD/CAD: ${live.usdCad.toFixed(4)}`);
  if (live.sp500)         lines.push(`- S&P 500: ${live.sp500.toFixed(0)}`);
  if (live.tsx)           lines.push(`- TSX Composite: ${live.tsx.toFixed(0)}`);
  if (live.vix)           lines.push(`- VIX: ${live.vix.toFixed(1)}`);
  if (live.gold)          lines.push(`- Gold: $${live.gold.toFixed(0)}/oz`);
  if (live.oil)           lines.push(`- WTI Crude: $${live.oil.toFixed(1)}/barrel`);
  if (live.treasury3m)    lines.push(`- 3M US Treasury yield: ${live.treasury3m.toFixed(2)}%`);
  if (live.treasury5y)    lines.push(`- 5Y US Treasury yield: ${live.treasury5y.toFixed(2)}%`);
  if (live.treasury10y)   lines.push(`- 10Y US Treasury yield: ${live.treasury10y.toFixed(2)}%`);
  if (live.treasury30y)   lines.push(`- 30Y US Treasury yield: ${live.treasury30y.toFixed(2)}%`);
  if (live.breakeven10y)  lines.push(`- 10Y Breakeven Inflation (FRED): ${live.breakeven10y.toFixed(2)}%`);
  if (live.realYield10y != null) {
    lines.push(`- 10Y Real Yield (FRED TIPS): ${live.realYield10y.toFixed(2)}%`);
  } else if (live.treasury10y && live.breakeven10y) {
    lines.push(`- 10Y Real Yield (computed): ${(live.treasury10y - live.breakeven10y).toFixed(2)}%`);
  }
  if (live.gdpBillions)        lines.push(`- US Nominal GDP (FRED, latest quarter SAAR): $${live.gdpBillions.toFixed(0)}B (~$${(live.gdpBillions/1000).toFixed(1)}T annualised)`);
  if (live.m2Billions)         lines.push(`- M2 Money Supply (FRED, latest month): $${live.m2Billions.toFixed(0)}B`);
  if (live.pce16trimmed)       lines.push(`- 16% Trimmed-Mean PCE Inflation (FRED, annualised): ${live.pce16trimmed.toFixed(2)}%`);
  if (live.wilshire5000)       lines.push(`- Wilshire 5000 Index (Yahoo): ${live.wilshire5000.toFixed(0)} (proxy for total US equity market level)`);
  if (live.buffettIndicatorPct != null) lines.push(`- Buffett Indicator estimate (Wilshire×1.16/$GDP): ${live.buffettIndicatorPct}%`);

  const spreadLines = [];
  if (live.treasury3m && live.treasury10y)
    spreadLines.push(`- 3M–10Y: ${Math.round((live.treasury10y - live.treasury3m) * 100)} bps`);
  if (live.treasury5y && live.treasury30y)
    spreadLines.push(`- 5Y–30Y: ${Math.round((live.treasury30y - live.treasury5y) * 100)} bps`);

  // BNN Bloomberg picks block (best-effort)
  const TYPICAL_HOLDINGS = new Set(["NVDA","AMZN","VFV.TO","XIU","VTI","MSFT","CNQ","PLTR","LLY","AAPL","META","TSM","AVGO","QQQM","VTI"]);
  let bnnBlock = "";
  if (bnn?.experts?.length) {
    const rows = [];
    bnn.experts.forEach(expert => {
      (expert.picks || []).forEach(pick => {
        const held = TYPICAL_HOLDINGS.has(pick.ticker);
        if (held || pick.action === "buy") {
          rows.push(
            `  ${pick.ticker} — ${pick.rawAction || pick.action.toUpperCase()} ` +
            `[${expert.guest}${expert.firm ? ", " + expert.firm : ""}]: ` +
            `"${pick.rationale}"` +
            (held ? " ← IN TYPICAL PORTFOLIO" : "")
          );
        }
      });
    });
    if (rows.length) {
      bnnBlock = `\nBNN Bloomberg Market Call picks (${bnn.date || "latest"}):\n` + rows.join("\n");
    }
  }

  return `You are a senior macro analyst writing a monthly market pulse briefing for Canadian investors managing TFSA and RRSP portfolios.

Today's date: ${today}
3-month target period: ${fmt3}
6-month target period: ${fmt6}

Live market data fetched right now:
${lines.length ? lines.join("\n") : "(fetch failed — use your best current knowledge)"}
${spreadLines.length ? "\nComputed yield curve spreads:\n" + spreadLines.join("\n") : ""}
${bnnBlock}

Using the live data as your anchor, apply your macro knowledge to fill in anything not directly measured: Fed/BoC policy stance, full yield curve shape, CPI trend, unemployment, sector rotation, geopolitical context, earnings revisions, credit spreads, DXY, copper, global macro, valuation metrics. Weight the live numbers heavily.

For yieldCurve: classify curve shape, report all five benchmark yields, compute spreads in bps, estimate NY Fed 12-month recession probability, and give a one-sentence trajectory.

For buffettIndicator: use the live Buffett estimate if provided (Wilshire×1.16/GDP), or your best current estimate. Classify as: Undervalued (<75%), Fair Value (75–100%), Modestly Overvalued (100–130%), Significantly Overvalued (130–165%), or Extremely Overvalued (>165%). Provide the 1950–2024 historical average (~85%) as context. Score 0–100 where 100 = most overvalued historically.

For valuation macroSignals: provide Shiller CAPE (10-year cyclically adjusted P/E), S&P 500 Forward P/E (next 12 months consensus), and S&P 500 Earnings Yield (= 1/ForwardPE × 100%). For Shiller CAPE: normal <20, elevated 20–30, extreme >30.

For newsSignals: exactly 4 recent, specific headlines from Bloomberg, CNBC, Reuters, FT, or WSJ. Each must name the source. Keep portfolioImpact to one sentence relevant to a Canadian TFSA/RRSP investor.

For portfolioImplication.actions: exactly 5 actionable items for a Canadian TFSA/RRSP investor (assume typical holdings: NVDA, AMZN, VFV.TO, XIU, VTI, MSFT, CNQ, PLTR, LLY). At least 2 must be "High" priority. One concise sentence each.
Where BNN Bloomberg experts picked a typical holding (marked "← IN TYPICAL PORTFOLIO"): a TOP PICK or BUY from a guest strengthens a Hold/Buy action; a SELL on a held position should trigger a Reduce. Name the BNN guest and their call in the action sentence where relevant.

Be concise — every "note", "trajectory", "canadianAngle", and "positioning" field: one sentence max.

Generate a complete market pulse JSON for ${monthLabel}. Return the JSON inside a single \`\`\`json code block. No text before or after.

Required schema (scenario probabilities within each outlook must sum to exactly 100):

{
  "lastUpdated": "${today}",
  "period": "${monthLabel}",
  "regime": {
    "label": "short label",
    "sublabel": "short sub-label",
    "color": "#22c55e or #fbbf24 or #ef4444",
    "description": "2-3 sentences",
    "score": 0
  },
  "riskMeter": { "score": 0, "label": "", "sublabel": "", "color": "" },
  "yieldCurve": {
    "shapeLabel": "Normal|Flat|Inverted|Bear-Steepening|Bull-Flattening|Bull-Steepening|Bear-Flattening",
    "shapeColor": "#22c55e or #fbbf24 or #ef4444",
    "currentYields": [
      { "maturity": "3M",  "yield": 0 },
      { "maturity": "2Y",  "yield": 0 },
      { "maturity": "5Y",  "yield": 0 },
      { "maturity": "10Y", "yield": 0 },
      { "maturity": "30Y", "yield": 0 }
    ],
    "spreads": [
      { "label": "3M–10Y", "description": "NY Fed recession predictor", "bps": 0, "status": "normal|warning|inverted", "note": "" },
      { "label": "2Y–10Y", "description": "Classic 2s10s",              "bps": 0, "status": "normal|warning|inverted", "note": "" },
      { "label": "5Y–30Y", "description": "Long-end slope",              "bps": 0, "status": "normal|warning|inverted", "note": "" }
    ],
    "inversionStatus": "",
    "recessionProbability": "~X% (NY Fed 12-month model)",
    "recessionProbabilityScore": 0,
    "trajectory": "",
    "canadianCurve": ""
  },
  "buffettIndicator": {
    "value": "XXX%",
    "valueLabel": "Undervalued|Fair Value|Modestly Overvalued|Significantly Overvalued|Extremely Overvalued",
    "color": "#22c55e|#fbbf24|#ef4444",
    "score": 0,
    "historicalAvg": "~85% (1950–2024 avg)",
    "fairValueZone": "75–100%",
    "trend": "up|down|sideways",
    "description": "one sentence with current context",
    "implication": "one sentence portfolio implication"
  },
  "macroSignals": [
    { "category": "Equities", "icon": "📈", "signals": [
      { "label": "S&P 500",       "value": "", "trend": "up|down|sideways", "status": "bullish|bearish|caution|neutral", "note": "" },
      { "label": "TSX Composite", "value": "", "trend": "", "status": "", "note": "" },
      { "label": "VIX",           "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Nasdaq / Tech", "value": "", "trend": "", "status": "", "note": "" }
    ]},
    { "category": "Valuation", "icon": "📊", "signals": [
      { "label": "Buffett Indicator",   "value": "", "trend": "", "status": "bullish (<100%)|caution (100–130%)|bearish (>130%)", "note": "" },
      { "label": "Shiller CAPE",        "value": "", "trend": "", "status": "bullish (<20)|caution (20–30)|bearish (>30)",        "note": "" },
      { "label": "S&P 500 Forward P/E", "value": "", "trend": "", "status": "",                                                  "note": "" },
      { "label": "S&P 500 Earnings Yield","value":"","trend": "", "status": "",                                                  "note": "" }
    ]},
    { "category": "Rates & Bonds", "icon": "🏦", "signals": [
      { "label": "Fed Funds Rate",          "value": "", "trend": "", "status": "", "note": "" },
      { "label": "10Y US Treasury",         "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Yield Curve (2s10s)",     "value": "", "trend": "", "status": "", "note": "" },
      { "label": "10Y Real Yield",          "value": "", "trend": "", "status": "", "note": "" },
      { "label": "10Y Breakeven Inflation", "value": "", "trend": "", "status": "", "note": "" },
      { "label": "BoC Rate",                "value": "", "trend": "", "status": "", "note": "" }
    ]},
    { "category": "Macro", "icon": "🌐", "signals": [
      { "label": "US CPI (YoY)",        "value": "", "trend": "", "status": "", "note": "" },
      { "label": "US Core PCE (YoY)",   "value": "", "trend": "", "status": "", "note": "" },
      { "label": "US Unemployment",     "value": "", "trend": "", "status": "", "note": "" },
      { "label": "ISM Manufacturing",   "value": "", "trend": "", "status": "bullish (>55)|caution (50–55)|bearish (<50)", "note": "" },
      { "label": "ISM Services",        "value": "", "trend": "", "status": "bullish (>55)|caution (50–55)|bearish (<50)", "note": "" },
      { "label": "M2 Growth (YoY)",     "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Oil (WTI)",           "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Gold",                "value": "", "trend": "", "status": "", "note": "" },
      { "label": "USD/CAD",             "value": "", "trend": "", "status": "", "note": "" }
    ]},
    { "category": "Credit & Risk", "icon": "💳", "signals": [
      { "label": "HY Credit Spread (CDX HY)", "value": "", "trend": "", "status": "bullish (<350 bps)|caution (350-500)|bearish (>500)", "note": "" },
      { "label": "IG Credit Spread",          "value": "", "trend": "", "status": "", "note": "" },
      { "label": "US HY Default Rate",        "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Bank Lending Standards",    "value": "", "trend": "", "status": "", "note": "" }
    ]},
    { "category": "Global & Commodities", "icon": "🌍", "signals": [
      { "label": "DXY (US Dollar Index)",   "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Copper (front-month)",    "value": "", "trend": "", "status": "", "note": "" },
      { "label": "China PMI",               "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Eurozone CPI",            "value": "", "trend": "", "status": "", "note": "" }
    ]},
    { "category": "Sentiment", "icon": "🧠", "signals": [
      { "label": "Fear & Greed",              "value": "", "trend": "", "status": "", "note": "" },
      { "label": "AAII Bull/Bear",            "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Put/Call Ratio",            "value": "", "trend": "", "status": "", "note": "" },
      { "label": "US Consumer Confidence",   "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Earnings Revisions",       "value": "", "trend": "", "status": "", "note": "" }
    ]}
  ],
  "newsSignals": [
    { "source": "", "headline": "", "date": "", "impact": "bullish|bearish|neutral", "portfolioImpact": "" }
  ],
  "outlooks": [
    {
      "horizon": "3 months", "period": "${fmt3}",
      "scenarios": [
        { "label": "Bull case", "probability": 30, "color": "#22c55e", "icon": "🟢", "trigger": "", "marketTarget": "", "canadianAngle": "", "positioning": "", "sectorRotation": "" },
        { "label": "Base case", "probability": 45, "color": "#fbbf24", "icon": "🟡", "trigger": "", "marketTarget": "", "canadianAngle": "", "positioning": "", "sectorRotation": "" },
        { "label": "Bear case", "probability": 25, "color": "#ef4444", "icon": "🔴", "trigger": "", "marketTarget": "", "canadianAngle": "", "positioning": "", "sectorRotation": "" }
      ],
      "keyEvents": [ { "date": "", "event": "" } ]
    },
    {
      "horizon": "6 months", "period": "${fmt6}",
      "scenarios": [
        { "label": "Bull case", "probability": 28, "color": "#22c55e", "icon": "🟢", "trigger": "", "marketTarget": "", "canadianAngle": "", "positioning": "", "sectorRotation": "" },
        { "label": "Base case", "probability": 42, "color": "#fbbf24", "icon": "🟡", "trigger": "", "marketTarget": "", "canadianAngle": "", "positioning": "", "sectorRotation": "" },
        { "label": "Bear case", "probability": 30, "color": "#ef4444", "icon": "🔴", "trigger": "", "marketTarget": "", "canadianAngle": "", "positioning": "", "sectorRotation": "" }
      ],
      "keyEvents": [ { "date": "", "event": "" } ]
    }
  ],
  "catalysts": {
    "bullish": [ { "icon": "🟢", "label": "" } ],
    "bearish":  [ { "icon": "🔴", "label": "" } ]
  },
  "portfolioImplication": {
    "summary": "",
    "actions": [
      { "priority": "High",   "type": "Hold|Buy|Reduce|Watch|Rebalance", "ticker": null, "action": "" },
      { "priority": "High",   "type": "", "ticker": null, "action": "" },
      { "priority": "Medium", "type": "", "ticker": null, "action": "" },
      { "priority": "Medium", "type": "", "ticker": null, "action": "" },
      { "priority": "Low",    "type": "", "ticker": null, "action": "" }
    ]
  }
}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify CRON_SECRET — Vercel sets this automatically for cron invocations.
  // For manual POST triggers, pass the same secret in the Authorization header.
  const secret = process.env.CRON_SECRET;
  const auth   = (req.headers.authorization || "").trim();
  if (secret && auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized — provide Authorization: Bearer <CRON_SECRET>" });
  }

  if (!process.env.ANTHROPIC_API_KEY)    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN not configured" });

  // Manual-only: refreshes the Recommendations tab's marketContext block instead of
  // the daily Market Pulse. Not on any cron — trigger with ?target=recommendations.
  if (req.query?.target === "recommendations") {
    try {
      return await refreshRecommendationsContext(res);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  try {
    const [live, bnn] = await Promise.all([fetchLiveSignals(), fetchBnnPicks()]);
    const prompt = buildPrompt(live, bnn);

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":    "application/json",
        "x-api-key":       process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: 16000,
        messages:   [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      return res.status(502).json({ error: "Claude API error", detail: err });
    }

    const aiData  = await aiRes.json();
    const rawText = (aiData.content?.[0]?.text || "").trim();

    // Extract JSON from a ```json … ``` fence or bare object
    let jsonStr = rawText;
    const fence = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fence) {
      jsonStr = fence[1].trim();
    } else {
      const s = rawText.indexOf("{"), e = rawText.lastIndexOf("}");
      if (s !== -1 && e > s) jsonStr = rawText.slice(s, e + 1);
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed.regime || !parsed.macroSignals || !parsed.outlooks) {
      return res.status(502).json({ error: "Claude returned incomplete data — try again" });
    }

    const payload = { ...parsed, _scheduledAt: new Date().toISOString(), _liveSignals: live };
    await put(BLOB_PATH, JSON.stringify(payload), {
      access:          "public",
      contentType:     "application/json",
      addRandomSuffix: false,
      allowOverwrite:  true,
    });

    return res.status(200).json({
      ok:          true,
      lastUpdated: parsed.lastUpdated,
      period:      parsed.period,
      signalCount: Object.keys(live).length,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
