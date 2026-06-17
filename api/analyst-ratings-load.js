// Serves the latest analyst ratings snapshot from Vercel Blob.
// Populated weekly by /api/refresh-analyst-ratings (Saturday 12:00 UTC).
// No auth required — analyst data is not user-specific.

import { list } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "GET")    { res.status(405).end(); return; }

  // Cache 6 hours — cron refreshes weekly on Saturdays
  res.setHeader("Cache-Control", "public, max-age=21600, stale-while-revalidate=604800");

  try {
    const { blobs } = await list({ prefix: "analyst-ratings/latest" });
    if (!blobs.length) {
      return res.status(404).json({
        error: "No analyst ratings yet — trigger /api/refresh-analyst-ratings first.",
      });
    }

    const blobRes = await fetch(blobs[0].url);
    if (!blobRes.ok) return res.status(502).json({ error: "Failed to read blob" });

    const data = await blobRes.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
