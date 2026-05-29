// Serves the latest options spread signals snapshot from Vercel Blob.
// No authentication required — signals are not user-specific.
// Called by the frontend on Options tab load.

import { list } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "GET")    { res.status(405).end(); return; }

  // 1-hour CDN cache — cron refreshes once daily at 7am PST
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");

  try {
    const { blobs } = await list({ prefix: "options-signals/latest" });
    if (!blobs.length) {
      return res.status(404).json({
        error: "No signals data yet — trigger /api/refresh-options-signals first.",
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
