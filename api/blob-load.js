import { list, put, del } from "@vercel/blob";
import crypto from "crypto";

async function validateLicense(licenseKey) {
  const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ license_key: licenseKey }),
  });
  const data = await res.json();
  if (!data.valid) return { valid: false };
  const customerId = data.meta?.customer_id;
  if (!customerId) return { valid: false };
  return { valid: true, customerId: String(customerId) };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function fetchBlob(url) {
  const resp = await fetch(url);
  if (!resp.ok) return null;
  return resp.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-license-key");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "GET")     { res.status(405).end(); return; }

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

  const customerHash = sha256(customerId);
  const legacyHash   = sha256(licenseKey); // old path: keyed to license key

  let blobs, legacyBlobs;
  try {
    ([{ blobs }, { blobs: legacyBlobs }] = await Promise.all([
      list({ prefix: `portfolios/${customerHash}` }),
      list({ prefix: `portfolios/${legacyHash}`   }),
    ]));
  } catch {
    return res.status(500).json({ error: "cloud storage unavailable" });
  }

  // ── Happy path: data already at the customer-keyed path ──────────────────
  if (blobs.length) {
    const data = await fetchBlob(blobs[0].url);
    if (!data) return res.status(502).json({ error: "fetch failed" });
    return res.status(200).json(data);
  }

  // ── Migration: data exists at the old license-key path ───────────────────
  // Move it to the customer-keyed path so future saves land in the right place.
  if (legacyBlobs.length) {
    const data = await fetchBlob(legacyBlobs[0].url);
    if (!data) return res.status(502).json({ error: "fetch failed" });

    // Write to new customer-keyed path and clean up the old one
    try {
      await put(`portfolios/${customerHash}.json`, JSON.stringify(data), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      await del(legacyBlobs[0].url);
    } catch { /* migration best-effort — don't fail the load */ }

    return res.status(200).json(data);
  }

  return res.status(404).json({ error: "not found" });
}
