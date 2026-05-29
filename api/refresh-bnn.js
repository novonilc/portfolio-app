// Vercel Cron Job — fetches BNN Bloomberg's Market Call page, extracts guest picks
// via Claude, and stores structured JSON in Vercel Blob.
//
// Schedule: weekdays at 13:00 UTC (9am ET) — shortly after the live show airs.
// Configured in vercel.json under "crons".
//
// NOTE: This fetches a publicly accessible web page for informational/educational
// purposes. BNN Bloomberg editorial content remains their property. Picks are
// attributed to the guest and source on every display. Check their robots.txt
// and ToS periodically to ensure continued compliance.

import { put } from "@vercel/blob";

const BNN_MARKET_CALL_URL = "https://www.bnnbloomberg.ca/market-call";
const BLOB_PATH            = "bnn-calls/latest.json";

// Strip HTML boilerplate — remove scripts/styles/nav then collapse tags to spaces.
// Keeps text compact enough to send to Claude without burning tokens on markup.
function extractPageText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 14000); // ~3.5k tokens — enough to cover the most recent episode
}

function buildPrompt(pageText, today) {
  return `You are a financial data extraction assistant. Extract structured market call picks from the following BNN Bloomberg Market Call page text.

Today's date: ${today}

Page text:
---
${pageText}
---

Extract the MOST RECENT episode only. Return JSON inside a single \`\`\`json code block — no text before or after.

Schema:
{
  "fetchedAt": "${today}",
  "episode": {
    "guest": "Full name",
    "title": "Guest title/role",
    "firm": "Investment firm",
    "date": "YYYY-MM-DD of the episode (use today if unclear)",
    "picks": [
      {
        "ticker": "EXCHANGE_SYMBOL",
        "name": "Full company name",
        "action": "buy",
        "exchange": "TSX or NYSE or NASDAQ etc",
        "targetPrice": null,
        "rationale": "One sentence from the guest's stated rationale",
        "type": "top_pick"
      }
    ]
  }
}

Rules:
- action must be "buy", "sell", or "hold" (lowercase only)
- type must be "top_pick" or "past_pick"
- ticker must be the exchange ticker symbol (e.g. CNQ, not Canadian Natural Resources)
- Append .TO for TSX-listed tickers (e.g. CNQ.TO, ENB.TO)
- targetPrice is a number or null
- rationale: one concise sentence max
- If you cannot identify clear stock picks, return: { "fetchedAt": "${today}", "episode": null, "error": "No picks found on page" }
- Do not invent data — only include what is stated on the page`;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Cron secret — Vercel injects this automatically; manual triggers must supply it.
  const secret = process.env.CRON_SECRET;
  const auth   = (req.headers.authorization || "").trim();
  if (secret && auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!process.env.ANTHROPIC_API_KEY)     return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN not configured" });

  const today = new Date().toISOString().split("T")[0];

  try {
    // 1. Fetch BNN Bloomberg market calls page
    const pageRes = await fetch(BNN_MARKET_CALL_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept":     "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!pageRes.ok) {
      return res.status(502).json({ error: `BNN fetch failed: HTTP ${pageRes.status}` });
    }

    const html     = await pageRes.text();
    const pageText = extractPageText(html);

    if (pageText.length < 200) {
      return res.status(502).json({ error: "BNN page returned insufficient content — may be blocked or down" });
    }

    // 2. Send to Claude Haiku for cost-efficient extraction
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages:   [{ role: "user", content: buildPrompt(pageText, today) }],
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      return res.status(502).json({ error: "Claude API error", detail: err });
    }

    const aiData  = await aiRes.json();
    const rawText = (aiData.content?.[0]?.text || "").trim();

    // Extract JSON from code fence or bare object
    let jsonStr = rawText;
    const fence = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fence) {
      jsonStr = fence[1].trim();
    } else {
      const s = rawText.indexOf("{"), e = rawText.lastIndexOf("}");
      if (s !== -1 && e > s) jsonStr = rawText.slice(s, e + 1);
    }

    const parsed = JSON.parse(jsonStr);

    // 3. Store in Vercel Blob
    const payload = { ...parsed, _scheduledAt: new Date().toISOString() };
    await put(BLOB_PATH, JSON.stringify(payload), {
      access:          "public",
      contentType:     "application/json",
      addRandomSuffix: false,
      allowOverwrite:  true,
    });

    return res.status(200).json({
      ok:        true,
      fetchedAt: parsed.fetchedAt,
      guest:     parsed.episode?.guest ?? null,
      pickCount: parsed.episode?.picks?.length ?? 0,
      error:     parsed.error ?? null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
