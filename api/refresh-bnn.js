// Vercel Cron Job — fetches BNN Bloomberg Market Call picks from Stockchase.com
// (a structured aggregator of BNN Market Call recommendations), extracts them
// via Claude, and stores JSON in Vercel Blob.
//
// Schedule: daily at 13:00 UTC (9am ET) — shortly after the live show airs on weekdays.
// Configured in vercel.json under "crons".
//
// Why Stockchase? BNN Bloomberg's own site is JavaScript-rendered (SPA) so a
// simple fetch() only gets a blank shell. Stockchase.com has tracked and published
// BNN Market Call guest picks in plain HTML since 2013 and is publicly accessible.
// Picks are attributed to the original guest and source on every display.

import { put } from "@vercel/blob";

const SOURCE_URL = "https://stockchase.com/opinions/recent";
const BLOB_PATH  = "bnn-calls/latest.json";

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
    .slice(0, 16000);
}

function buildPrompt(pageText, today) {
  return `You are a financial data extraction assistant. Extract structured BNN Bloomberg Market Call picks from the following Stockchase.com page content.

Today's date: ${today}

Page content:
---
${pageText}
---

Extract all expert picks from today's (most recent) session. Group by expert. Return JSON inside a single \`\`\`json code block — no text before or after.

Schema:
{
  "fetchedAt": "${today}",
  "source": "BNN Bloomberg Market Call via Stockchase.com",
  "date": "YYYY-MM-DD",
  "experts": [
    {
      "guest": "Full name",
      "firm": "Firm name or empty string",
      "picks": [
        {
          "ticker": "TICKER",
          "name": "Company full name",
          "action": "buy",
          "exchange": "TSX or NYSE or NASDAQ etc",
          "targetPrice": null,
          "rationale": "One sentence rationale",
          "rawAction": "ORIGINAL ACTION TEXT e.g. BUY ON WEAKNESS"
        }
      ]
    }
  ]
}

Action normalisation rules (set "action" field):
- "TOP PICK", "BUY", "BUY ON WEAKNESS", "PAST TOP PICK" → "buy"
- "HOLD", "WAIT", "WATCH" → "hold"
- "SELL", "PARTIAL SELL", "DON'T BUY", "TENDER" → "sell"
- "RISKY" → "caution"

Always set rawAction to the original text from the page.
For TSX tickers remove the "-T" or "-TO" suffix and add ".TO" (e.g. "ATRL-TO" → ticker "ATRL" exchange "TSX" — do NOT include exchange suffix in the ticker field).
If you cannot identify picks return: { "fetchedAt": "${today}", "experts": [], "error": "No picks found" }`;
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

  if (!process.env.ANTHROPIC_API_KEY)     return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN not configured" });

  const today = new Date().toISOString().split("T")[0];

  try {
    const pageRes = await fetch(SOURCE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept":     "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!pageRes.ok) {
      return res.status(502).json({ error: `Stockchase fetch failed: HTTP ${pageRes.status}` });
    }

    const html     = await pageRes.text();
    const pageText = extractPageText(html);

    if (pageText.length < 200) {
      return res.status(502).json({ error: "Stockchase page returned insufficient content" });
    }

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        messages:   [{ role: "user", content: buildPrompt(pageText, today) }],
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
    const payload = { ...parsed, _scheduledAt: new Date().toISOString() };

    // Save as "latest" (overwrite) AND as a date-stamped copy for 5-day history.
    await Promise.all([
      put(BLOB_PATH, JSON.stringify(payload), {
        access: "public", contentType: "application/json",
        addRandomSuffix: false, allowOverwrite: true,
      }),
      put(`bnn-calls/${today}.json`, JSON.stringify(payload), {
        access: "public", contentType: "application/json",
        addRandomSuffix: false, allowOverwrite: true,
      }),
    ]);

    const totalPicks = (parsed.experts || []).reduce((s, e) => s + (e.picks?.length || 0), 0);
    return res.status(200).json({
      ok:          true,
      fetchedAt:   parsed.fetchedAt,
      expertCount: parsed.experts?.length ?? 0,
      totalPicks,
      error:       parsed.error ?? null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
