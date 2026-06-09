// Serves the last 5 days of BNN Market Call picks from Vercel Blob.
// No auth required — editorial data is not user-specific.

import { list } from "@vercel/blob";

const MAX_DAYS = 5;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "GET")    { res.status(405).end(); return; }

  // Cache 2 hours — cron runs once daily.
  res.setHeader("Cache-Control", "public, max-age=7200, stale-while-revalidate=86400");

  try {
    const { blobs } = await list({ prefix: "bnn-calls/" });

    // Prefer date-stamped files (e.g. bnn-calls/2026-06-07.json). Fall back to latest.json
    // if the new archive format hasn't run yet.
    const dateBlobs = blobs
      .filter(b => /bnn-calls\/\d{4}-\d{2}-\d{2}\.json$/.test(b.pathname))
      .sort((a, b) => b.pathname.localeCompare(a.pathname))
      .slice(0, MAX_DAYS);

    let days;
    if (dateBlobs.length) {
      days = await Promise.all(
        dateBlobs.map(blob =>
          fetch(blob.url).then(r => r.ok ? r.json() : null)
        )
      );
      days = days.filter(Boolean);
    } else {
      // Legacy: only "latest.json" exists
      const latestBlob = blobs.find(b => b.pathname === "bnn-calls/latest.json");
      if (!latestBlob) {
        return res.status(404).json({ error: "No BNN data yet — trigger /api/refresh-bnn first." });
      }
      const data = await fetch(latestBlob.url).then(r => r.json());
      days = [data];
    }

    if (!days.length) {
      return res.status(404).json({ error: "No BNN data available." });
    }

    // Spread the latest day at the top level for backward-compat (code that reads
    // bnnCalls.experts / bnnCalls.date still works), PLUS include all days.
    return res.status(200).json({ ...days[0], days });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
