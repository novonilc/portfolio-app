// Manual-trigger endpoint — refreshes the `marketContext` block (period, conflictAlert,
// conflictInsights, themes) shown at the top of the Ideas / Recommendations tab.
//
// No cron — this content is a thematic distillation, not a daily macro feed, so it's
// refreshed on demand rather than on a fixed schedule. It reads the *already-refreshed*
// Market Pulse blob (and latest BNN picks) as grounding input rather than re-fetching
// live market data, so the two datasets never drift out of sync with each other.
//
// Does NOT touch the curated per-stock thesis list (`recommendations` array) — those
// are structural, multi-year theses meant to be refreshed manually after earnings,
// not on a macro cadence.
//
// Protected by Authorization: Bearer CRON_SECRET.
// Trigger manually: POST /api/refresh-recommendations -H "Authorization: Bearer $CRON_SECRET"

import { put, list } from "@vercel/blob";

const BLOB_PATH = "recommendations-context/latest.json";

async function fetchLatestBlob(prefix) {
  try {
    const { blobs } = await list({ prefix });
    if (!blobs.length) return null;
    const res = await fetch(blobs[0].url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function buildPrompt(pulse, bnn) {
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

  return `You are a senior investment strategist writing the weekly "market context" header for a curated stock recommendations page (TFSA/RRSP-focused, Canadian investor audience). The page covers a fixed universe of ~13 hand-picked compounders spanning: defense (RTX), energy (ENB, SU.TO), AI infrastructure (ARM, ASML), healthcare (ISRG, NVO, JNJ), Canadian financials (RY), consumer (COST, MCD), payments (V), and Canadian tech (SHOP), plus a cash-rich value anchor (BRK.B).

Today's date: ${today}

Grounding input — this week's already-published Market Pulse (treat as authoritative; do not contradict it):
${pulseLines.length ? pulseLines.join("\n") : "(no pulse data available — use your best current knowledge)"}
${bnnBlock}

Your job is NOT to re-derive macro data. It is to distill the above into a punchy, stock-picker-facing summary that helps someone scanning the recommendations list understand this week's regime at a glance, and to flag which of the 13 tickers' theses are most and least supported by current conditions.

Be concise — every "desc" field: one sentence max, specific, and tied to a real, current fact from the grounding input above (not generic).

Return ONLY a JSON object inside a single \`\`\`json code block, no text before or after, matching this schema exactly:

{
  "lastUpdated": "${today}",
  "marketContext": {
    "period": "${monthLabel}",
    "conflictAlert": "short ALL-CAPS-style headline, <60 chars, naming the single biggest live risk or catalyst this week",
    "conflictInsights": [
      { "label": "short 3-6 word label", "desc": "one sentence, specific to this week's data" }
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

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.CRON_SECRET;
  const auth   = (req.headers.authorization || "").trim();
  if (secret && auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized — provide Authorization: Bearer <CRON_SECRET>" });
  }

  if (!process.env.ANTHROPIC_API_KEY)    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN not configured" });

  try {
    const [pulse, bnn] = await Promise.all([
      fetchLatestBlob("market-pulse/latest"),
      fetchLatestBlob("bnn-calls/latest"),
    ]);

    const prompt = buildPrompt(pulse, bnn);

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
    await put(BLOB_PATH, JSON.stringify(payload), {
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
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
