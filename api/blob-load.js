import { list } from "@vercel/blob";
import crypto from "crypto";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-license-key");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "GET")     { res.status(405).end(); return; }

  const licenseKey = req.headers["x-license-key"];
  if (!licenseKey) return res.status(401).json({ error: "missing license key" });

  const hash = crypto.createHash("sha256").update(licenseKey).digest("hex");

  const { blobs } = await list({ prefix: `portfolios/${hash}` });
  if (!blobs.length) return res.status(404).json({ error: "not found" });

  const resp = await fetch(blobs[0].url);
  if (!resp.ok) return res.status(502).json({ error: "fetch failed" });

  const data = await resp.json();
  res.status(200).json(data);
}
