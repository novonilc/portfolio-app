import { list } from "@vercel/blob";
import crypto from "crypto";

async function validateLicense(licenseKey) {
  const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ license_key: licenseKey }),
  });
  const data = await res.json();
  return data.valid === true;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-license-key");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "GET")     { res.status(405).end(); return; }

  const licenseKey = req.headers["x-license-key"];
  if (!licenseKey) return res.status(401).json({ error: "missing license key" });

  // Validate license key against Lemon Squeezy before returning any data
  try {
    const valid = await validateLicense(licenseKey);
    if (!valid) return res.status(403).json({ error: "invalid or expired license" });
  } catch {
    return res.status(502).json({ error: "could not validate license — try again" });
  }

  const hash = crypto.createHash("sha256").update(licenseKey).digest("hex");

  let blobs;
  try {
    ({ blobs } = await list({ prefix: `portfolios/${hash}` }));
  } catch {
    return res.status(500).json({ error: "cloud storage unavailable" });
  }

  if (!blobs.length) return res.status(404).json({ error: "not found" });

  // Private blobs require the BLOB_READ_WRITE_TOKEN in the Authorization header
  const resp = await fetch(blobs[0].url, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });
  if (!resp.ok) return res.status(502).json({ error: "fetch failed" });

  const data = await resp.json();
  res.status(200).json(data);
}
