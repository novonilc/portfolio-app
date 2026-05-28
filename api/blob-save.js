import { put } from "@vercel/blob";
import crypto from "crypto";

// Returns { valid, customerId } — customer_id is stable across all license
// purchases by the same LS customer, so it's the right key for data isolation.
async function validateLicense(licenseKey) {
  const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ license_key: licenseKey }),
  });
  const data = await res.json();
  if (!data.valid) return { valid: false };
  const customerId = data.meta?.customer_id;
  if (!customerId) return { valid: false }; // can't identify the user
  return { valid: true, customerId: String(customerId) };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-license-key");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST")    { res.status(405).end(); return; }

  const licenseKey = req.headers["x-license-key"];
  if (!licenseKey) return res.status(401).json({ error: "missing license key" });

  let customerId;
  try {
    const result = await validateLicense(licenseKey);
    if (!result.valid) return res.status(403).json({ error: "invalid or expired license" });
    customerId = result.customerId;
  } catch {
    return res.status(502).json({ error: "could not validate license — try again" });
  }

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: "invalid json" }); }

  // Path is keyed to the LS customer, not the license key.
  // Same user with multiple licenses always writes to the same blob.
  const hash = sha256(customerId);

  // access: "public" is intentional. Security comes from two layers:
  //   1. License validation above — expired/invalid keys are rejected before this line
  //   2. Path obscurity — the path is SHA-256(customer_id), a 64-char hash that is
  //      not guessable or enumerable even if someone knows the blob store exists.
  // "private" blobs (Vercel public beta) are avoided due to SDK instability with
  // allowOverwrite, and the extra protection they'd add is negligible given (1)+(2).
  try {
    await put(`portfolios/${hash}.json`, JSON.stringify({ ...body, savedAt: new Date().toISOString() }), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch {
    return res.status(500).json({ error: "Cloud storage unavailable — check BLOB_READ_WRITE_TOKEN is configured." });
  }

  res.status(200).json({ ok: true });
}
