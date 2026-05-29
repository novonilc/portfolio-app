// Server-side proxy for Yahoo Finance chart data.
// Browser fetches are blocked by Yahoo's CORS policy; this endpoint runs server-side.
// Usage: GET /api/yahoo-chart?ticker=AAPL&interval=1d&range=1y

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "GET")    { res.status(405).end(); return; }

  const { ticker, interval = "1d", range = "1y" } = req.query;
  if (!ticker) return res.status(400).json({ error: "ticker is required" });

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;

  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!upstream.ok) return res.status(upstream.status).json({ error: `Yahoo returned ${upstream.status}` });

    const data = await upstream.json();
    // Cache for 1 hour — data is end-of-day
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
