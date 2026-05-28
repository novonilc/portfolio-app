// Serves the latest scheduled Market Pulse snapshot from Vercel Blob.
// No authentication required — macro data is not user-specific.
// Called by the frontend on startup to load the most recent scheduled refresh.

import { list } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "GET")    { res.status(405).end(); return; }

  // Cache for 1 hour at the CDN edge — the cron job refreshes far less often.
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");

  try {
    const { blobs } = await list({ prefix: "market-pulse/latest" });
    if (!blobs.length) {
      return res.status(404).json({ error: "No scheduled pulse available yet — trigger /api/refresh-pulse first." });
    }

    const blobRes = await fetch(blobs[0].url);
    if (!blobRes.ok) return res.status(502).json({ error: "Failed to read blob" });

    const data = await blobRes.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
