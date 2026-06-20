// Server-side proxy for FMP quarterly financials.
// Fetches income statement, cash flow, and earnings surprises in parallel.
// Usage: GET /api/financials?ticker=NVDA
// Requires env var: FMP_API_KEY

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

function fmpTicker(ticker) {
  // FMP uses "-" not "." for TSX stocks (e.g. SU-TO instead of SU.TO)
  return ticker.replace(".TO", "-TO").toUpperCase();
}

async function fmpFetch(path, apiKey) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${FMP_BASE}${path}${sep}apikey=${apiKey}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return Array.isArray(json) ? json : null;
}

function fmt(n) {
  if (n == null) return null;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function pct(n) {
  if (n == null) return null;
  return `${(n * 100).toFixed(1)}%`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "GET") { res.status(405).end(); return; }

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "ticker is required" });

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "FMP_API_KEY not configured" });

  const sym = fmpTicker(ticker);

  // Fetch all three in parallel
  const [income, cashflow, surprises] = await Promise.all([
    fmpFetch(`/income-statement/${sym}?period=quarter&limit=5`, apiKey),
    fmpFetch(`/cash-flow-statement/${sym}?period=quarter&limit=5`, apiKey),
    fmpFetch(`/earnings-surprises/${sym}`, apiKey),
  ]);

  if (!income || income.length === 0) {
    return res.status(404).json({ error: `No financial data found for ${ticker}` });
  }

  // ── Income statement (last 5 quarters) ───────────────────────────────
  const incomeRows = income.slice(0, 5).map(q => ({
    period:          q.period || q.date?.slice(0, 7),
    date:            q.date,
    revenue:         fmt(q.revenue),
    revenueRaw:      q.revenue,
    grossProfit:     fmt(q.grossProfit),
    grossMargin:     pct(q.grossProfit / q.revenue),
    operatingIncome: fmt(q.operatingIncome),
    operatingMargin: pct(q.operatingIncome / q.revenue),
    netIncome:       fmt(q.netIncome),
    netMargin:       pct(q.netIncome / q.revenue),
    eps:             q.eps != null ? `$${q.eps.toFixed(2)}` : null,
    epsDiluted:      q.epsdiluted != null ? `$${q.epsdiluted.toFixed(2)}` : null,
  }));

  // ── Cash flow (last 5 quarters) ───────────────────────────────────────
  const cfMap = {};
  (cashflow || []).slice(0, 5).forEach(q => {
    cfMap[q.date] = {
      operatingCF: fmt(q.operatingCashFlow),
      capex:       q.capitalExpenditure != null ? fmt(q.capitalExpenditure) : null,
      freeCF:      fmt(q.freeCashFlow),
      freeCFRaw:   q.freeCashFlow,
      sbc:         fmt(q.stockBasedCompensation),
    };
  });

  const incomeWithCF = incomeRows.map(r => ({ ...r, ...(cfMap[r.date] || {}) }));

  // ── Earnings surprises (last 8 quarters) ─────────────────────────────
  const surpriseRows = (surprises || []).slice(0, 8).map(s => ({
    date:          s.date,
    actualEPS:     s.actualEarningResult != null ? `$${s.actualEarningResult.toFixed(2)}` : null,
    estimatedEPS:  s.estimatedEarning != null ? `$${s.estimatedEarning.toFixed(2)}` : null,
    surprisePct:   s.estimatedEarning
      ? `${(((s.actualEarningResult - s.estimatedEarning) / Math.abs(s.estimatedEarning)) * 100).toFixed(1)}%`
      : null,
    beat:          s.actualEarningResult != null && s.estimatedEarning != null
      ? s.actualEarningResult >= s.estimatedEarning : null,
  }));

  // ── Revenue growth YoY (Q vs Q-4) ─────────────────────────────────────
  const revenueGrowth = incomeRows.length >= 5 && income[0]?.revenue && income[4]?.revenue
    ? pct((income[0].revenue - income[4].revenue) / Math.abs(income[4].revenue))
    : null;

  // Cache for 4 hours — quarterly data changes infrequently
  res.setHeader("Cache-Control", "public, max-age=14400, stale-while-revalidate=86400");
  return res.status(200).json({
    ticker: sym,
    fetchedAt: new Date().toISOString().slice(0, 10),
    latestPeriod: incomeRows[0]?.period,
    revenueGrowthYoY: revenueGrowth,
    quarterlyFinancials: incomeWithCF,
    earningsSurprises: surpriseRows,
  });
}
