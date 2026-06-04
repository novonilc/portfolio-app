// Server-side proxy for StockTwits public API.
// Browser fetches are blocked by StockTwits CORS policy; this runs server-side.
// Usage:
//   GET /api/stocktwits?path=trending/symbols
//   GET /api/stocktwits?path=streams/symbol/AAPL

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "GET")    { res.status(405).end(); return; }

  const { path } = req.query;
  if (!path) return res.status(400).json({ error: "path is required" });

  // Only allow safe read paths — no auth or write endpoints
  const ALLOWED = /^(trending\/symbols|streams\/symbol\/[A-Z0-9.\-]{1,12})$/;
  if (!ALLOWED.test(path)) return res.status(403).json({ error: "path not allowed" });

  const url = `https://api.stocktwits.com/api/2/${path}.json`;

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "portfolio-app/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!upstream.ok) return res.status(upstream.status).json({ error: `StockTwits returned ${upstream.status}` });

    const data = await upstream.json();
    // Trending changes slowly; symbol streams are real-time
    const maxAge = path.startsWith("trending") ? 300 : 60;
    res.setHeader("Cache-Control", `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 4}`);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
