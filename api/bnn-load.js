// Serves the latest BNN Market Call picks from Vercel Blob.
// No auth required — editorial data is not user-specific.

import { list } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "GET")    { res.status(405).end(); return; }

  // Cache for 2 hours — cron runs once per day so staleness is fine.
  res.setHeader("Cache-Control", "public, max-age=7200, stale-while-revalidate=86400");

  try {
    const { blobs } = await list({ prefix: "bnn-calls/latest" });
    if (!blobs.length) {
      return res.status(404).json({ error: "No BNN data yet — trigger /api/refresh-bnn first." });
    }

    const blobRes = await fetch(blobs[0].url);
    if (!blobRes.ok) return res.status(502).json({ error: "Failed to read blob" });

    const data = await blobRes.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
