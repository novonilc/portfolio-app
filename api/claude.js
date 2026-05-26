// Vercel serverless proxy — keeps ANTHROPIC_API_KEY server-side.
// Validates the Lemon Squeezy license key on every request (skipped on localhost).
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-license-key");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST")    { res.status(405).json({ error: "Method not allowed" }); return; }

  // ── License validation (skip on localhost) ──────────────────────────────
  const host    = req.headers.host || "";
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");

  if (!isLocal) {
    const licenseKey = req.headers["x-license-key"];
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
    } catch {
      res.status(502).json({ error: "Could not validate license — try again in a moment." });
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
