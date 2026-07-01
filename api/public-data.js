// Single endpoint for all public (non-user-specific) blob data.
// Replaces: bnn-load, pulse-load, options-signals-load, csp-cc-picks-load, analyst-ratings-load
//
// Usage: GET /api/public-data?key=<name>
//   key=bnn             → last 5 days of BNN Market Call picks
//   key=pulse           → latest market pulse snapshot
//   key=options-signals → latest options spread signals
//   key=csp-cc-picks    → latest CSP / covered-call picks
//   key=analyst-ratings → latest FMP analyst upgrades/downgrades

import { list } from "@vercel/blob";

const MAX_BNN_DAYS = 5;

const CONFIG = {
  pulse:                    { prefix: "market-pulse/latest",           maxAge: 3600  },
  "options-signals":        { prefix: "options-signals/latest",        maxAge: 3600  },
  "csp-cc-picks":           { prefix: "csp-cc-picks/latest",          maxAge: 3600  },
  "analyst-ratings":        { prefix: "analyst-ratings/latest",        maxAge: 21600 },
  "insider-signals":        { prefix: "insider-signals/latest",        maxAge: 43200 },
  "recommendations-context":{ prefix: "recommendations-context/latest",maxAge: 21600 },
};

async function handleBnn(res) {
  res.setHeader("Cache-Control", "public, max-age=7200, stale-while-revalidate=86400");
  const { blobs } = await list({ prefix: "bnn-calls/" });

  const dateBlobs = blobs
    .filter(b => /bnn-calls\/\d{4}-\d{2}-\d{2}\.json$/.test(b.pathname))
    .sort((a, b) => b.pathname.localeCompare(a.pathname))
    .slice(0, MAX_BNN_DAYS);

  let days;
  if (dateBlobs.length) {
    days = await Promise.all(dateBlobs.map(b => fetch(b.url).then(r => r.ok ? r.json() : null)));
    days = days.filter(Boolean);
  } else {
    const latestBlob = blobs.find(b => b.pathname === "bnn-calls/latest.json");
    if (!latestBlob) return res.status(404).json({ error: "No BNN data yet — trigger /api/refresh-bnn first." });
    days = [await fetch(latestBlob.url).then(r => r.json())];
  }

  if (!days.length) return res.status(404).json({ error: "No BNN data available." });
  return res.status(200).json({ ...days[0], days });
}

async function handleSimple(key, config, res) {
  res.setHeader("Cache-Control", `public, max-age=${config.maxAge}, stale-while-revalidate=86400`);
  const { blobs } = await list({ prefix: config.prefix });
  if (!blobs.length) return res.status(404).json({ error: `No data for '${key}' yet.` });
  const blobRes = await fetch(blobs[0].url);
  if (!blobRes.ok) return res.status(502).json({ error: "Failed to read blob" });
  return res.status(200).json(await blobRes.json());
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "GET")    { res.status(405).end(); return; }

  const key = req.query?.key || "";

  try {
    if (key === "bnn")       return await handleBnn(res);
    if (CONFIG[key])         return await handleSimple(key, CONFIG[key], res);
    return res.status(400).json({ error: `Unknown key '${key}'. Valid: bnn, pulse, options-signals, csp-cc-picks, analyst-ratings, insider-signals, recommendations-context` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
