import { put } from "@vercel/blob";
import crypto from "crypto";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-license-key");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST")    { res.status(405).end(); return; }

  const licenseKey = req.headers["x-license-key"];
  if (!licenseKey) return res.status(401).json({ error: "missing license key" });

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: "invalid json" }); }

  // Hash the license key so the blob path never exposes the raw key
  const hash = crypto.createHash("sha256").update(licenseKey).digest("hex");

  try {
    await put(`portfolios/${hash}.json`, JSON.stringify({ ...body, savedAt: new Date().toISOString() }), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (err) {
    return res.status(500).json({ error: "Cloud storage unavailable — check BLOB_READ_WRITE_TOKEN is configured." });
  }

  res.status(200).json({ ok: true });
}
