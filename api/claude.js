// Vercel serverless proxy — keeps ANTHROPIC_API_KEY server-side.
// Validates the Lemon Squeezy license key on every request (skipped on localhost).

// ── In-memory rate limiter (best-effort per function instance) ────────────
// For strict cross-instance limits upgrade to Vercel KV (vercel.com/docs/storage/vercel-kv)
const rlMap = new Map();
const RL_MAX    = 10;                      // calls per window per license key
const RL_WINDOW = 24 * 60 * 60 * 1000;    // 24 hours in ms

function checkRateLimit(key) {
  const now    = Date.now();
  const record = rlMap.get(key) || { count: 0, start: now };
  if (now - record.start > RL_WINDOW) { record.count = 0; record.start = now; }
  record.count++;
  rlMap.set(key, record);
  return record.count > RL_MAX;            // true = over limit
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-license-key");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST")    { res.status(405).json({ error: "Method not allowed" }); return; }

  // ── License validation ───────────────────────────────────────────────────
  // Skip on localhost, and also skip when GATE_ENABLED env var is not "true"
  // (mirrors the GATE_ENABLED constant in main.jsx — set it in Vercel env vars)
  const host        = req.headers.host || "";
  const isLocal     = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const gateEnabled = process.env.GATE_ENABLED === "true";

  const licenseKey = req.headers["x-license-key"] || "";

  if (!isLocal && gateEnabled) {
    if (!licenseKey) {
      res.status(401).json({ error: "Subscription required. Purchase at portfolio-manager-for-canada.lemonsqueezy.com" });
      return;
    }
    try {
      const lsRes  = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ license_key: licenseKey }),
      });
      const lsData = await lsRes.json();
      if (!lsData.valid) {
        res.status(403).json({ error: "Invalid or expired license. Check your subscription at lemonsqueezy.com." });
        return;
      }
      // Enforce Pro tier — Basic plan holders cannot use AI features
      const variantName = (lsData.meta?.variant_name || lsData.data?.meta?.variant_name || "").toLowerCase();
      if (variantName && variantName.includes("basic")) {
        res.status(403).json({ error: "AI features require the Pro plan. Upgrade at portfolio-manager-for-canada.lemonsqueezy.com" });
        return;
      }
    } catch {
      res.status(502).json({ error: "Could not validate license — try again in a moment." });
      return;
    }
  }

  // ── Rate limiting — 20 AI calls per license key per 24 hours ────────────
  if (!isLocal) {
    const rlKey = licenseKey || req.headers["x-forwarded-for"] || "anon";
    if (checkRateLimit(rlKey)) {
      res.status(429).json({ error: "Daily AI limit reached (20 calls/day). Resets at midnight UTC — try again tomorrow." });
      return;
    }
  }

  // ── Forward to Anthropic ────────────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "AI service not configured — contact support." });
    return;
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await anthropicRes.json();
    res.status(anthropicRes.status).json(data);
  } catch {
    res.status(502).json({ error: "AI service temporarily unavailable — try again in a moment." });
  }
}
