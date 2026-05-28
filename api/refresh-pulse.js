// Vercel Cron Job handler — generates fresh Market Pulse data on a schedule.
// Schedule is configured in vercel.json under "crons".
// Protected by Authorization: Bearer CRON_SECRET (Vercel injects this automatically).
// Can also be triggered manually: POST /api/refresh-pulse with the same header.

import { put } from "@vercel/blob";

const BLOB_PATH = "market-pulse/latest.json";

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
    tryFetchFredCSV("T10YIE").then(v => { live.breakeven10y = v; }),
    tryFetchFredCSV("DFII10").then(v => { live.realYield10y = v; }),
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
  return live;
}

function buildPrompt(live) {
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

  const spreadLines = [];
  if (live.treasury3m && live.treasury10y)
    spreadLines.push(`- 3M–10Y: ${Math.round((live.treasury10y - live.treasury3m) * 100)} bps`);
  if (live.treasury5y && live.treasury30y)
    spreadLines.push(`- 5Y–30Y: ${Math.round((live.treasury30y - live.treasury5y) * 100)} bps`);

  return `You are a senior macro analyst writing a monthly market pulse briefing for Canadian investors managing TFSA and RRSP portfolios.

Today's date: ${today}
3-month target period: ${fmt3}
6-month target period: ${fmt6}

Live market data fetched right now:
${lines.length ? lines.join("\n") : "(fetch failed — use your best current knowledge)"}
${spreadLines.length ? "\nComputed yield curve spreads:\n" + spreadLines.join("\n") : ""}

Using the live data as your anchor, apply your macro knowledge to fill in anything not directly measured: Fed/BoC policy stance, full yield curve shape, CPI trend, unemployment, sector rotation, geopolitical context, earnings revisions, credit spreads, DXY, copper, global macro. Weight the live numbers heavily.

For yieldCurve: classify curve shape, report all five benchmark yields, compute spreads in bps, estimate NY Fed 12-month recession probability, and give a one-sentence trajectory.

For newsSignals: exactly 4 recent, specific headlines from Bloomberg, CNBC, Reuters, FT, or WSJ. Each must name the source. Keep portfolioImpact to one sentence relevant to a Canadian TFSA/RRSP investor.

For portfolioImplication.actions: exactly 5 actionable items for a Canadian TFSA/RRSP investor (assume typical holdings: NVDA, AMZN, VFV.TO, XIU, VTI, MSFT, CNQ, PLTR, LLY). At least 2 must be "High" priority. One concise sentence each.

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
  "macroSignals": [
    { "category": "Equities", "icon": "📈", "signals": [
      { "label": "S&P 500",       "value": "", "trend": "up|down|sideways", "status": "bullish|bearish|caution|neutral", "note": "" },
      { "label": "TSX Composite", "value": "", "trend": "", "status": "", "note": "" },
      { "label": "VIX",           "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Nasdaq / Tech", "value": "", "trend": "", "status": "", "note": "" }
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
      { "label": "US CPI (YoY)",    "value": "", "trend": "", "status": "", "note": "" },
      { "label": "US Unemployment", "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Oil (WTI)",       "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Gold",            "value": "", "trend": "", "status": "", "note": "" },
      { "label": "USD/CAD",         "value": "", "trend": "", "status": "", "note": "" }
    ]},
    { "category": "Credit & Risk", "icon": "💳", "signals": [
      { "label": "HY Credit Spread (CDX HY)", "value": "", "trend": "", "status": "bullish (<350 bps)|caution (350-500)|bearish (>500)", "note": "" },
      { "label": "IG Credit Spread",          "value": "", "trend": "", "status": "", "note": "" },
      { "label": "US HY Default Rate",        "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Bank Lending Standards",    "value": "", "trend": "", "status": "", "note": "" }
    ]},
    { "category": "Global & Commodities", "icon": "🌍", "signals": [
      { "label": "DXY (US Dollar Index)", "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Copper (front-month)",  "value": "", "trend": "", "status": "", "note": "" },
      { "label": "China PMI",             "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Eurozone CPI",          "value": "", "trend": "", "status": "", "note": "" }
    ]},
    { "category": "Sentiment", "icon": "🧠", "signals": [
      { "label": "Fear & Greed",       "value": "", "trend": "", "status": "", "note": "" },
      { "label": "AAII Bull/Bear",     "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Put/Call Ratio",     "value": "", "trend": "", "status": "", "note": "" },
      { "label": "Earnings Revisions", "value": "", "trend": "", "status": "", "note": "" }
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

  try {
    const live   = await fetchLiveSignals();
    const prompt = buildPrompt(live);

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
