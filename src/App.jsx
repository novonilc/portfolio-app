import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL PORTFOLIO DATA
// ═══════════════════════════════════════════════════════════════════════════
const INITIAL_TFSA = [
  { ticker:"NVDA", name:"Nvidia",                  current:4947, target:14, divYield:0,   locked:"✅ Keep", notes:"No dividend — pure growth compounder. Perfect in TFSA." },
  { ticker:"AMZN", name:"Amazon",                  current:1388, target:10, divYield:0,   locked:"✅ Keep", notes:"No dividend — 100% tax-free growth in TFSA." },
  { ticker:"NOW",  name:"ServiceNow",              current:3971, target:10, divYield:0,   locked:"✅ Keep", notes:"No dividend — AI enterprise software leader." },
  { ticker:"GOOG", name:"Alphabet",                current:3144, target:7,  divYield:0.5, locked:"✅ Keep", notes:"Tiny dividend (acceptable drag). AI + Search moat." },
  { ticker:"PLTR", name:"Palantir",                current:1425, target:8,  divYield:0,   locked:"✅ Keep", notes:"No dividend — high-conviction AI defense play." },
  { ticker:"MU",   name:"Micron Technology",       current:2803, target:8,  divYield:0.5, locked:"✅ Keep", notes:"Tiny dividend. AI memory monopoly." },
  { ticker:"CNQ",  name:"Cdn Natural Resources",   current:3174, target:10, divYield:4.5, locked:"✅ Keep", notes:"Canadian dividend — full tax credit in TFSA." },
  { ticker:"XIU",  name:"iShares S&P/TSX 60",      current:1885, target:8,  divYield:2.8, locked:"✅ Keep", notes:"Canadian ETF — no WHT. Core Canadian exposure." },
  { ticker:"BTCC", name:"Purpose Bitcoin ETF",     current:1387, target:5,  divYield:0,   locked:"✅ Keep", notes:"CAD-listed, crypto exposure capped at 5%." },
  { ticker:"GOLD", name:"Physically Backed Gold",  current:1308, target:5,  divYield:0,   locked:"✅ Keep", notes:"Inflation hedge. CAD-denominated." },
  { ticker:"VFV.TO",name:"Vanguard S&P 500 (CAD)", current:0,   target:15, divYield:1.3, locked:"🆕 NEW",  notes:"NEW. Replaces MSFT/AAPL/META/TSM/ADI/THE moved to RRSP." },
  { ticker:"MSFT", name:"Microsoft",               current:4260, target:0,  divYield:0.8, locked:"❌ SELL", notes:"MOVE TO RRSP — 0.8% dividend leaks 15% WHT." },
  { ticker:"AAPL", name:"Apple",                   current:3636, target:0,  divYield:0.5, locked:"❌ SELL", notes:"MOVE TO RRSP — save withholding on dividends." },
  { ticker:"META", name:"Meta Platforms",          current:2224, target:0,  divYield:0.4, locked:"❌ SELL", notes:"MOVE TO RRSP — dividend growing." },
  { ticker:"TSM",  name:"Taiwan Semiconductor",    current:4178, target:0,  divYield:1.5, locked:"❌ SELL", notes:"MOVE TO RRSP — 1.5% dividend = highest drag." },
  { ticker:"ADI",  name:"Analog Devices",          current:1274, target:0,  divYield:1.8, locked:"❌ SELL", notes:"MOVE TO RRSP — highest yield in TFSA." },
  { ticker:"THE",  name:"TD Intl Equity ETF",      current:2668, target:0,  divYield:2.0, locked:"❌ SELL", notes:"Consolidate — replace with VFV.TO." },
];

const INITIAL_RRSP = [
  { ticker:"QQQM", name:"Invesco Nasdaq 100 ETF",  current:500,  target:15, divYield:0.6, locked:"✅ Keep",        notes:"Keep existing. U.S.-listed = 0% WHT." },
  { ticker:"SPDR", name:"SPDR S&P 500 (VOO)",      current:300,  target:0,  divYield:1.3, locked:"❌ SELL",        notes:"Consolidate into VTI for broader exposure." },
  { ticker:"VXUS", name:"Vanguard Total Intl",     current:200,  target:5,  divYield:3.0, locked:"✅ Keep",        notes:"Keep existing. International diversification." },
  { ticker:"VTI",  name:"Vanguard Total US Market",current:0,    target:30, divYield:1.3, locked:"🆕 NEW",         notes:"NEW core ETF. 0% WHT in RRSP. MER 0.03%." },
  { ticker:"MSFT", name:"Microsoft",               current:0,    target:8,  divYield:0.8, locked:"🆕 FROM TFSA",   notes:"Transfer from TFSA. No WHT here." },
  { ticker:"AAPL", name:"Apple",                   current:0,    target:6,  divYield:0.5, locked:"🆕 FROM TFSA",   notes:"Transfer from TFSA." },
  { ticker:"TSM",  name:"Taiwan Semiconductor",    current:0,    target:7,  divYield:1.5, locked:"🆕 FROM TFSA",   notes:"Transfer from TFSA — biggest WHT saver." },
  { ticker:"META", name:"Meta Platforms",          current:0,    target:5,  divYield:0.4, locked:"🆕 FROM TFSA",   notes:"Transfer from TFSA." },
  { ticker:"ADI",  name:"Analog Devices",          current:0,    target:4,  divYield:1.8, locked:"🆕 FROM TFSA",   notes:"Transfer from TFSA." },
  { ticker:"LLY",  name:"Eli Lilly",               current:0,    target:10, divYield:0.7, locked:"🆕 NEW",         notes:"NEW. GLP-1 + Alzheimer's. 20-year healthcare play." },
  { ticker:"AVGO", name:"Broadcom",                current:0,    target:10, divYield:1.2, locked:"🆕 NEW",         notes:"NEW. Custom AI chips. Revenue doubling YoY." },
];

// ═══════════════════════════════════════════════════════════════════════════
// RECOMMENDATIONS — curated for April 2026 market environment
// ═══════════════════════════════════════════════════════════════════════════
const RECOMMENDATIONS = [
  {
    ticker:"BRK.B", name:"Berkshire Hathaway B", sector:"Financials",
    bestFor:"TFSA", conviction:"High", divYield:0,
    thesis:"Sitting on $330B+ cash amid tariff volatility — Buffett deploys aggressively in corrections. Natural market hedge with zero dividend drag. Complements tech-heavy TFSA with value ballast.",
    tags:["Value","Defensive","Cash-Rich"],
    fills:["financials","value"]
  },
  {
    ticker:"V", name:"Visa", sector:"Financials",
    bestFor:"TFSA", conviction:"High", divYield:0.8,
    thesis:"Digital payments toll-road untouched by tariffs. Global cross-border volume growing as travel rebounds. Asset-light royalty model: $0.001 per transaction × billions of transactions = immense free cash flow.",
    tags:["Payments","Global","Asset-Light"],
    fills:["financials","payments"]
  },
  {
    ticker:"ISRG", name:"Intuitive Surgical", sector:"Healthcare",
    bestFor:"TFSA", conviction:"High", divYield:0,
    thesis:"7,000+ da Vinci robotic systems installed creates razor/blade recurring revenue. New Ion bronchoscopy expanding TAM. Secular shift to minimally invasive surgery = 20-year compounding runway.",
    tags:["Robotic Surgery","Recurring","Monopoly"],
    fills:["healthcare","medtech"]
  },
  {
    ticker:"NVO", name:"Novo Nordisk", sector:"Healthcare",
    bestFor:"RRSP", conviction:"High", divYield:1.4,
    thesis:"GLP-1 peer to your LLY at a cheaper valuation. Ozempic/Wegovy demand still exceeds supply. Oral semaglutide + next-gen CagriSema data due in 2026. Portfolio: LLY + NVO = dual GLP-1 coverage.",
    tags:["GLP-1","Obesity","Europe"],
    fills:["healthcare","pharma"]
  },
  {
    ticker:"ARM", name:"ARM Holdings", sector:"Semiconductor",
    bestFor:"TFSA", conviction:"High", divYield:0,
    thesis:"CPU architecture royalty on every advanced chip. Powers all Apple silicon, Nvidia data center CPUs, and AI edge devices. Scales to $100B revenue with zero manufacturing risk — the ultimate AI leverage play.",
    tags:["AI Infrastructure","IP Royalties","Monopoly"],
    fills:["ai-infra","semis"]
  },
  {
    ticker:"AXON", name:"Axon Enterprise", sector:"Defense Tech",
    bestFor:"TFSA", conviction:"High", divYield:0,
    thesis:"AI law enforcement platform (Taser + cameras + Evidence.com SaaS). Government contracts = recession-proof revenue. International expansion accelerating amid global security concerns. Zero dividend = pure TFSA compounder.",
    tags:["AI","Defense","SaaS"],
    fills:["defense","government-tech"]
  },
  {
    ticker:"COST", name:"Costco Wholesale", sector:"Consumer Staples",
    bestFor:"TFSA", conviction:"High", divYield:0.5,
    thesis:"Membership model is recession-proof — members don't cancel during downturns, they shop more. International expansion accelerating. Tariff pressure minimal as private-label pricing power offsets costs.",
    tags:["Defensive","Membership","Recession-Proof"],
    fills:["consumer","defensive"]
  },
  {
    ticker:"RTX", name:"RTX Corporation", sector:"Defense",
    bestFor:"RRSP", conviction:"High", divYield:2.3,
    thesis:"NATO 2% GDP defense commitment drives decade-long procurement. F-35 engine sole supplier, Patriot missile systems sold out through 2028. Geopolitical uncertainty = indefinite demand surge.",
    tags:["Defense","Aerospace","Dividend"],
    fills:["defense","industrials"]
  },
  {
    ticker:"ENB", name:"Enbridge", sector:"Energy Infrastructure",
    bestFor:"TFSA", conviction:"High", divYield:6.8,
    thesis:"Largest North American pipeline — 30% of US crude imports. 7% dividend eligible for Canadian dividend tax credit (0% effective WHT in TFSA). 29 consecutive years of dividend growth. Rate-regulated = predictable cash flows.",
    tags:["Pipeline","Canadian Dividend","Income"],
    fills:["energy-infra","income"]
  },
  {
    ticker:"MELI", name:"MercadoLibre", sector:"Emerging Markets",
    bestFor:"TFSA", conviction:"Medium", divYield:0,
    thesis:"Latin America's Amazon + PayPal combined. 220M+ users, 50M+ credit card holders. Tariff war benefits regional champions vs global platforms. Brazil and Mexico economies more insulated from US-China tensions.",
    tags:["LatAm","E-Commerce","Fintech","Growth"],
    fills:["latam","emerging-markets"]
  },
  {
    ticker:"INDA", name:"iShares MSCI India ETF", sector:"Emerging Markets",
    bestFor:"RRSP", conviction:"Medium", divYield:0.5,
    thesis:"India = China replacement manufacturing hub. Apple, Samsung shifting production. 1.4B population, median age 28, 7%+ GDP growth. Modi infrastructure boom. Demographics + manufacturing shift = generational opportunity.",
    tags:["India","Demographics","Manufacturing"],
    fills:["asia","emerging-markets"]
  },
  {
    ticker:"VGK", name:"Vanguard European ETF", sector:"International",
    bestFor:"RRSP", conviction:"Medium", divYield:3.1,
    thesis:"European stocks at 40-year discount to US on P/E. Defense spending surge (NATO commitment). ECB cutting rates faster than Fed. Deep diversification away from your US concentration.",
    tags:["Europe","Diversification","Value"],
    fills:["europe","international"]
  },
  {
    ticker:"EWJ", name:"iShares MSCI Japan ETF", sector:"International",
    bestFor:"RRSP", conviction:"Medium", divYield:1.8,
    thesis:"Tokyo Stock Exchange governance reforms forcing buybacks + ROE improvement. Yen weakness creates value for CAD investors. Buffett's Japan trading house bets validated. Cheap valuations uncorrelated to US tariff drama.",
    tags:["Japan","Corporate Reform","Value"],
    fills:["japan","international"]
  },
  {
    ticker:"TLT", name:"iShares 20+ Year Treasury Bond", sector:"Fixed Income",
    bestFor:"RRSP", conviction:"Medium", divYield:4.2,
    thesis:"If Fed cuts 2-3x in 2026 amid tariff slowdown, long-duration bonds capture 15-25% capital gain. High 4%+ yield provides carry while waiting. Contrarian — most investors are underweight duration entering a rate-cut cycle.",
    tags:["Bonds","Rate Play","Income"],
    fills:["bonds","fixed-income"]
  },
  {
    ticker:"ZAG.TO", name:"BMO Aggregate Bond ETF", sector:"Fixed Income",
    bestFor:"TFSA", conviction:"Medium", divYield:3.2,
    thesis:"As Bank of Canada continues rate-cut cycle, bond prices rise. Canadian aggregate bonds: zero currency risk, no WHT. Portfolio ballast — rises when equities fall. Reduces overall portfolio volatility.",
    tags:["CAD","Bonds","Defensive"],
    fills:["bonds","canadian-fixed-income"]
  },
  {
    ticker:"XRE.TO", name:"iShares Canadian REIT ETF", sector:"Real Estate",
    bestFor:"TFSA", conviction:"Medium", divYield:4.5,
    thesis:"Canadian REITs deeply oversold from rate cycle. As BoC cuts rates, cap rate compression lifts valuations. Canadian-listed = no WHT in TFSA. Diversified industrial, retail, and residential REIT exposure.",
    tags:["REIT","CAD","Real Estate","Rate Play"],
    fills:["reit","real-estate"]
  },
  {
    ticker:"WMT", name:"Walmart", sector:"Consumer Staples",
    bestFor:"RRSP", conviction:"Medium", divYield:1.1,
    thesis:"Walmart has become an ad-tech company: $4B+ advertising revenue growing 50% YoY. Flipkart + international. Tariff-resilient: US supply chain more diversified than Target or Amazon peers.",
    tags:["Retail","Ad Platform","Defensive"],
    fills:["consumer","defensive"]
  },
  {
    ticker:"SHOP", name:"Shopify", sector:"Technology",
    bestFor:"TFSA", conviction:"Medium", divYield:0,
    thesis:"Canadian fintech/commerce platform powering 10%+ of US e-commerce. AI tools (Sidekick) driving merchant GMV growth. Freed from logistics. Expanding into B2B commerce globally. Zero dividend = pure tax-free TFSA growth.",
    tags:["Canadian","E-Commerce","AI","Fintech"],
    fills:["canadian-tech","fintech"]
  },
  {
    ticker:"ACN", name:"Accenture", sector:"Technology",
    bestFor:"RRSP", conviction:"Medium", divYield:1.6,
    thesis:"Every Fortune 500 firm needs AI implementation. Accenture's AI practice growing 40%+ YoY — $3B+ annual revenue. Captures 5-15% of every enterprise AI budget as the execution layer regardless of which model wins.",
    tags:["Enterprise AI","Consulting","Secular"],
    fills:["enterprise-software","ai-consulting"]
  },
  {
    ticker:"VIG", name:"Vanguard Dividend Appreciation ETF", sector:"Dividend Growth",
    bestFor:"RRSP", conviction:"Medium", divYield:1.7,
    thesis:"Companies growing dividends 10+ consecutive years: Visa, Microsoft, J&J, UnitedHealth. Quality factor in disguise — these firms have durable moats. RRSP: 0% WHT. Outperforms in drawdowns. MER 0.06%.",
    tags:["Dividend Growth","Quality","ETF"],
    fills:["income","quality-factor"]
  },
];

// Sector gap detection — which categories are missing from the portfolio
const SECTOR_TICKERS = {
  financials:       ["JPM","GS","BAC","BRK.B","V","MA","AXP","TD","RY","BNS"],
  healthcare:       ["LLY","NVO","UNH","ISRG","JNJ","ABBV","MRK","PFE"],
  defense:          ["RTX","LMT","NOC","GD","AXON","HII"],
  consumer:         ["COST","WMT","AMZN","TGT","HD","PG","KO"],
  "fixed income":   ["TLT","BND","ZAG.TO","ZAG","AGG","SHY"],
  "real estate":    ["O","VNQ","XRE.TO","ZRE.TO","SPG"],
  international:    ["VGK","EWJ","EFA","VEA","INDA","EWZ"],
  "energy infra":   ["ENB","TRP","PPL","KMI"],
};

function detectGaps(tfsa, rrsp) {
  const allTickers = new Set([...tfsa, ...rrsp].map(h => h.ticker));
  return Object.entries(SECTOR_TICKERS)
    .filter(([, tickers]) => !tickers.some(t => allTickers.has(t)))
    .map(([sector]) => sector);
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CAGR ESTIMATES — used when a holding has no custom cagr set
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_CAGR = {
  NVDA:18, AMZN:15, NOW:16, GOOG:12, PLTR:18, MU:15, CNQ:8, XIU:9, BTCC:20,
  GOLD:6, "VFV.TO":10, MSFT:13, AAPL:11, META:14, TSM:14, ADI:12, THE:8,
  QQQM:12, SPDR:10, VXUS:7, VTI:10, LLY:14, AVGO:16,
  "BRK.B":10, V:14, ISRG:15, NVO:13, ARM:18, AXON:20, COST:12, RTX:10,
  ENB:8, MELI:18, INDA:12, VGK:9, EWJ:8, TLT:5, "ZAG.TO":4, "XRE.TO":9,
  WMT:10, SHOP:15, ACN:12, VIG:11,
};

// ═══════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════
const BLANK_FORM = { ticker:"", name:"", current:"", target:"", divYield:"", cagr:"", notes:"" };

export default function App() {
  const [account,      setAccount]      = useState("TFSA");
  const [contribution, setContribution] = useState(0);
  const [dcaWeeks,     setDcaWeeks]     = useState(20);
  const [holdings,     setHoldings]     = useState({ TFSA: INITIAL_TFSA, RRSP: INITIAL_RRSP });
  const [baseCapital,  setBaseCapital]  = useState({ TFSA: 0, RRSP: 0 });
  const [saveStatus,   setSaveStatus]   = useState("");
  const [tab,          setTab]          = useState("rebalance");
  const [addForm,      setAddForm]      = useState(null);   // null = hidden
  const [recFilter,    setRecFilter]    = useState("all");  // all | tfsa | rrsp | gaps
  const [pendingRemove,setPendingRemove]= useState(null);   // idx awaiting confirmation

  // ── Load from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const tfsaData = localStorage.getItem("portfolio:TFSA");
      const rrspData = localStorage.getItem("portfolio:RRSP");
      const bcData   = localStorage.getItem("portfolio:baseCapital");
      const next = { TFSA: INITIAL_TFSA, RRSP: INITIAL_RRSP };
      if (tfsaData) next.TFSA = JSON.parse(tfsaData);
      if (rrspData) next.RRSP = JSON.parse(rrspData);
      setHoldings(next);
      if (bcData) setBaseCapital(JSON.parse(bcData));
    } catch (e) { console.warn("Could not load saved data:", e); }
  }, []);

  // ── Persist helpers ────────────────────────────────────────────────────
  function persist(acct, data) {
    try {
      setSaveStatus("Saving...");
      localStorage.setItem(`portfolio:${acct}`, JSON.stringify(data));
      setSaveStatus("✓ Saved");
      setTimeout(() => setSaveStatus(""), 1500);
    } catch { setSaveStatus("⚠ Save failed"); }
  }

  function persistBaseCapital(next) {
    localStorage.setItem("portfolio:baseCapital", JSON.stringify(next));
  }

  // ── Holdings mutations ─────────────────────────────────────────────────
  function updateHolding(idx, field, value) {
    const next = { ...holdings };
    next[account] = [...next[account]];
    next[account][idx] = { ...next[account][idx], [field]: Number(value) || 0 };
    setHoldings(next);
    persist(account, next[account]);
  }

  function addTicker() {
    if (!addForm || !addForm.ticker.trim()) return;
    const ticker = addForm.ticker.trim().toUpperCase();
    if (holdings[account].some(h => h.ticker === ticker)) {
      alert(`${ticker} already exists in ${account}`);
      return;
    }
    const next = { ...holdings };
    next[account] = [...next[account], {
      ticker,
      name:     addForm.name.trim() || ticker,
      current:  Number(addForm.current) || 0,
      target:   Number(addForm.target)  || 0,
      divYield: Number(addForm.divYield)|| 0,
      locked:   "✅ Keep",
      notes:    addForm.notes.trim(),
    }];
    setHoldings(next);
    persist(account, next[account]);
    setAddForm(null);
  }

  function removeTicker(idx) {
    const next = { ...holdings };
    next[account] = next[account].filter((_, i) => i !== idx);
    setHoldings(next);
    persist(account, next[account]);
    setPendingRemove(null);
  }

  function addRecommendedTicker(rec, targetAccount) {
    if (holdings[targetAccount].some(h => h.ticker === rec.ticker)) {
      alert(`${rec.ticker} already exists in ${targetAccount}`);
      return;
    }
    const next = { ...holdings };
    next[targetAccount] = [...next[targetAccount], {
      ticker:   rec.ticker,
      name:     rec.name,
      current:  0,
      target:   0,
      divYield: rec.divYield,
      locked:   "✅ Keep",
      notes:    rec.thesis.slice(0, 120) + "…",
    }];
    setHoldings(next);
    persist(targetAccount, next[targetAccount]);
    setAccount(targetAccount);
    setTab("targets");
  }

  // ── Base capital ───────────────────────────────────────────────────────
  function handleBaseCapital(val) {
    const next = { ...baseCapital, [account]: Number(val) || 0 };
    setBaseCapital(next);
    persistBaseCapital(next);
  }

  // ── Portfolio reset / import / export ─────────────────────────────────
  function resetDefaults() {
    if (!confirm("Reset to default portfolio values?")) return;
    const next = account === "TFSA"
      ? { ...holdings, TFSA: INITIAL_TFSA }
      : { ...holdings, RRSP: INITIAL_RRSP };
    setHoldings(next);
    persist(account, next[account]);
  }

  function exportData() {
    const data = JSON.stringify({ holdings, baseCapital }, null, 2);
    const blob = new Blob([data], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // Support both old format {TFSA,RRSP} and new format {holdings,baseCapital}
        const h = data.holdings || data;
        if (h.TFSA && h.RRSP) {
          setHoldings(h);
          persist("TFSA", h.TFSA);
          persist("RRSP", h.RRSP);
          if (data.baseCapital) {
            setBaseCapital(data.baseCapital);
            persistBaseCapital(data.baseCapital);
          }
          alert("✅ Portfolio imported successfully!");
        } else { alert("⚠ Invalid file format"); }
      } catch { alert("⚠ Could not read file"); }
    };
    reader.readAsText(file);
  }

  // ── Derived values ─────────────────────────────────────────────────────
  const current     = holdings[account];
  const currentTotal = current.reduce((s, h) => s + h.current, 0);
  const newTotal     = currentTotal + Number(contribution);
  const bc           = baseCapital[account] || 0;
  const pnl          = bc > 0 ? currentTotal - bc : null;
  const pnlPct       = bc > 0 ? ((currentTotal - bc) / bc) * 100 : null;

  const rebalance = current.map(h => {
    const targetDollar = newTotal * h.target / 100;
    const delta        = targetDollar - h.current;
    return { ...h, currentDollar: h.current, targetDollar, delta,
             currentPct: currentTotal > 0 ? (h.current / currentTotal) * 100 : 0 };
  });

  const totalBuys     = rebalance.filter(r => r.delta > 0).reduce((s, r) => s + r.delta, 0);
  const totalSells    = rebalance.filter(r => r.delta < 0).reduce((s, r) => s + Math.abs(r.delta), 0);
  const buyList       = rebalance.filter(r => r.delta > 0);
  const weeklyTotalBuy = totalBuys / dcaWeeks;
  const maxAlloc      = Math.max(...current.map(h => Math.max(h.target, (h.current / Math.max(currentTotal, 1)) * 100)), 1);

  const gaps          = detectGaps(holdings.TFSA, holdings.RRSP);
  const targetSum     = current.reduce((s, h) => s + h.target, 0);

  const filteredRecs = RECOMMENDATIONS.filter(r => {
    if (recFilter === "tfsa") return r.bestFor === "TFSA" || r.bestFor === "both";
    if (recFilter === "rrsp") return r.bestFor === "RRSP" || r.bestFor === "both";
    if (recFilter === "gaps") return r.fills.some(f => gaps.includes(f));
    return true;
  }).filter(r => {
    const allTickers = new Set([...holdings.TFSA, ...holdings.RRSP].map(h => h.ticker));
    return !allTickers.has(r.ticker);
  });

  const accentColor = account === "TFSA" ? "#fbbf24" : "#22d3ee";
  const accentRGB   = account === "TFSA" ? "251,191,36" : "34,211,238";

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#07090f", color:"#e2e8f0",
      fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#07090f;margin:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0f1420}
        ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        input,button,select,textarea{font-family:inherit}
        input[type=number],input[type=text],textarea{
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
          color:#e2e8f0; padding:6px 10px; border-radius:6px; font-size:13px;
          font-family:'JetBrains Mono',monospace; width:100%; transition:border 0.15s;
        }
        input[type=number]:focus,input[type=text]:focus,textarea:focus{
          outline:none; border-color:${accentColor}; background:rgba(255,255,255,0.06);
        }
        input[type=range]{accent-color:${accentColor};width:100%}
        .tab-btn{padding:7px 16px;border-radius:6px;font-size:12px;font-weight:500;
          border:1px solid rgba(255,255,255,0.08); background:transparent;
          color:rgba(255,255,255,0.4); cursor:pointer; transition:all 0.15s;
          font-family:inherit; letter-spacing:0.02em}
        .tab-btn.on{background:rgba(${accentRGB},0.12);
          border-color:${accentColor}60; color:${accentColor}}
        .tab-btn:hover:not(.on){color:rgba(255,255,255,0.7)}
        .card{background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06);
          border-radius:12px; padding:16px 18px}
        .th{text-align:left; font-size:10px; font-weight:500; letter-spacing:0.1em;
          color:rgba(255,255,255,0.35); text-transform:uppercase; padding:8px 10px;
          border-bottom:1px solid rgba(255,255,255,0.05)}
        .td{padding:9px 10px; border-bottom:1px solid rgba(255,255,255,0.03);
          font-size:12px; color:rgba(255,255,255,0.75); vertical-align:middle;
          font-family:'JetBrains Mono',monospace}
        .td-main{color:#e2e8f0; font-weight:500}
        .bar{height:4px; background:rgba(255,255,255,0.07); border-radius:2px;
          overflow:hidden; position:relative; margin-top:4px}
        .bar-fill{height:100%; border-radius:2px; transition:width 0.4s ease}
        .pill{display:inline-block; padding:2px 8px; border-radius:4px;
          font-size:10px; font-weight:500; letter-spacing:0.03em}
        .hold{background:rgba(148,163,184,0.1); color:#94a3b8; border:1px solid rgba(148,163,184,0.2)}
        .new-tag{background:rgba(52,211,153,0.12); color:#34d399; border:1px solid rgba(52,211,153,0.3);
          padding:1px 6px; border-radius:4px; font-size:9px; font-weight:500}
        .sec{font-size:10px; letter-spacing:0.15em; text-transform:uppercase;
          color:rgba(255,255,255,0.3); margin-bottom:10px; font-weight:500}
        .btn{background:transparent; border:1px solid rgba(255,255,255,0.15);
          color:rgba(255,255,255,0.7); padding:7px 14px; border-radius:6px;
          cursor:pointer; font-size:12px; transition:all 0.15s; white-space:nowrap}
        .btn:hover{border-color:${accentColor}; color:${accentColor}}
        .btn-danger{border-color:rgba(239,68,68,0.3); color:rgba(239,68,68,0.6)}
        .btn-danger:hover{border-color:#ef4444; color:#ef4444; background:rgba(239,68,68,0.06)}
        .btn-primary{background:rgba(${accentRGB},0.12); border-color:${accentColor}60; color:${accentColor}}
        .btn-primary:hover{background:rgba(${accentRGB},0.2); border-color:${accentColor}}
        .dca-week{background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);
          border-radius:8px; padding:12px 14px; margin-bottom:8px}
        .rec-card{background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06);
          border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:10px;
          transition:border-color 0.2s}
        .rec-card:hover{border-color:rgba(255,255,255,0.12)}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .pulse{animation:pulse 1.5s ease infinite}
        .gap-badge{display:inline-flex; align-items:center; gap:4px; padding:3px 10px;
          border-radius:20px; font-size:10px; font-weight:500; letter-spacing:0.05em;
          background:rgba(251,146,60,0.1); color:#fb923c; border:1px solid rgba(251,146,60,0.25);
          text-transform:capitalize}
        .add-form{background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08);
          border-radius:10px; padding:16px; margin-top:12px}
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding:"24px 24px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)",
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <p style={{ fontSize:10, letterSpacing:"0.2em", color:`${accentColor}aa`, marginBottom:4, textTransform:"uppercase" }}>
            ◈ Portfolio Rebalancer · DCA Planner
          </p>
          <h1 style={{ fontFamily:"'Instrument Serif', serif", fontSize:26, fontWeight:400,
            background:`linear-gradient(135deg, #e2e8f0 0%, ${accentColor} 60%, #a78bfa 100%)`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Your Living Portfolio Plan
          </h1>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {saveStatus && (
            <span className="pulse" style={{ fontSize:11, color:accentColor, marginRight:6 }}>{saveStatus}</span>
          )}
          <label className="btn" style={{ cursor:"pointer" }}>
            ⬇ Import
            <input type="file" accept=".json" style={{ display:"none" }} onChange={importData}/>
          </label>
          <button className="btn" onClick={exportData}>⬆ Export</button>
          <button className="btn" onClick={resetDefaults}>↻ Reset</button>
          {["TFSA","RRSP"].map(acc => (
            <button key={acc} className={`tab-btn ${account===acc?"on":""}`} onClick={() => setAccount(acc)}>
              {acc === "TFSA" ? "💰 TFSA" : "🏦 RRSP"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ padding:"20px 24px 0", display:"grid",
        gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:10 }}>
        {/* Base Capital card — editable */}
        <div className="card" style={{ padding:"11px 14px" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.12em", marginBottom:4, textTransform:"uppercase" }}>
            Base Capital ({account})
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>$</span>
            <input type="number" value={bc || ""} onChange={e => handleBaseCapital(e.target.value)}
              placeholder="Enter cost basis"
              style={{ fontSize:14, fontWeight:500, color:"#a78bfa", border:"none",
                background:"transparent", padding:0, width:"100%" }}/>
          </div>
        </div>

        {/* P&L card */}
        {pnl !== null && (
          <div className="card" style={{ padding:"11px 14px" }}>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.12em", marginBottom:3, textTransform:"uppercase" }}>
              Unrealized P&amp;L
            </p>
            <p style={{ fontSize:17, fontFamily:"'JetBrains Mono', monospace", fontWeight:500,
              color: pnl >= 0 ? "#34d399" : "#ef4444" }}>
              {pnl >= 0 ? "+" : ""}{Math.round(pnl).toLocaleString()}
            </p>
            <p style={{ fontSize:10, color: pnl >= 0 ? "#34d399" : "#ef4444", marginTop:2 }}>
              {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
            </p>
          </div>
        )}

        {[
          { l:"Current value",  v:`$${Math.round(currentTotal).toLocaleString()}`, c:accentColor },
          { l:"+ Contribution", v:`$${Number(contribution).toLocaleString()}`,     c:"#34d399" },
          { l:"New total",      v:`$${Math.round(newTotal).toLocaleString()}`,      c:"#a78bfa" },
          { l:"To buy",         v:`$${Math.round(totalBuys).toLocaleString()}`,     c:"#22d3ee" },
          { l:"To sell",        v:`$${Math.round(totalSells).toLocaleString()}`,    c:"#ef4444" },
        ].map(s => (
          <div key={s.l} className="card" style={{ padding:"11px 14px" }}>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.12em", marginBottom:3, textTransform:"uppercase" }}>{s.l}</p>
            <p style={{ fontSize:17, fontFamily:"'JetBrains Mono', monospace", fontWeight:500, color:s.c }}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding:"18px 24px 0", display:"flex", gap:8, flexWrap:"wrap" }}>
        {[["rebalance","⚖️ Rebalance"],["dca","📅 DCA Plan"],["targets","🎯 Edit Targets"],["recommend","💡 Ideas"]].map(([v,l]) => (
          <button key={v} className={`tab-btn ${tab===v?"on":""}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB: REBALANCE
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "rebalance" && (
        <div style={{ padding:"20px 24px" }}>
          <div className="card" style={{ marginBottom:16, display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ flex:"1 1 200px" }}>
              <p className="sec">Adding new contribution ({account})</p>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20, color:"rgba(255,255,255,0.4)" }}>$</span>
                <input type="number" value={contribution} onChange={e => setContribution(e.target.value)}
                  placeholder="0" style={{ fontSize:22, fontWeight:500, color:accentColor, maxWidth:200 }}/>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>CAD</span>
              </div>
            </div>
            <div style={{ flex:"1 1 250px" }}>
              <p className="sec">Quick add</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[500,1000,2500,5000,7000,10000].map(v => (
                  <button key={v} className="btn" onClick={() => setContribution(v)}>+${v.toLocaleString()}</button>
                ))}
              </div>
            </div>
            <div style={{ flex:"0 0 200px" }}>
              <p className="sec">Contribution limits (2026)</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>TFSA: $7,000/yr</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>RRSP: $32,490/yr</p>
            </div>
          </div>

          <p className="sec" style={{ marginBottom:8 }}>Rebalance actions — {account}</p>
          <div className="card" style={{ padding:0, overflow:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
              <thead>
                <tr>
                  <th className="th">Ticker</th>
                  <th className="th">Status</th>
                  <th className="th" style={{ textAlign:"right" }}>Current $</th>
                  <th className="th" style={{ textAlign:"right" }}>Current %</th>
                  <th className="th" style={{ textAlign:"right" }}>Target %</th>
                  <th className="th" style={{ textAlign:"right" }}>Target $</th>
                  <th className="th" style={{ textAlign:"right" }}>Action</th>
                  <th className="th">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {rebalance.map(h => {
                  const action = Math.abs(h.delta) < 5 ? "hold" : h.delta > 0 ? "buy" : "sell";
                  return (
                    <tr key={h.ticker}>
                      <td className="td td-main">
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <strong style={{ color:accentColor }}>{h.ticker}</strong>
                          {h.locked?.includes("NEW") && <span className="new-tag">NEW</span>}
                          {h.locked?.includes("FROM TFSA") && <span className="new-tag" style={{ background:"rgba(251,146,60,0.12)", color:"#fb923c", borderColor:"rgba(251,146,60,0.3)" }}>FROM TFSA</span>}
                        </div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{h.name}</div>
                      </td>
                      <td className="td"><span className="pill hold">{h.locked}</span></td>
                      <td className="td" style={{ textAlign:"right" }}>${Math.round(h.currentDollar).toLocaleString()}</td>
                      <td className="td" style={{ textAlign:"right", color:"rgba(255,255,255,0.5)" }}>{h.currentPct.toFixed(1)}%</td>
                      <td className="td" style={{ textAlign:"right", color:accentColor }}>{h.target}%</td>
                      <td className="td" style={{ textAlign:"right" }}>${Math.round(h.targetDollar).toLocaleString()}</td>
                      <td className="td" style={{ textAlign:"right" }}>
                        {action==="buy"  && <span style={{ color:"#22d3ee" }}>▲ BUY ${Math.round(h.delta).toLocaleString()}</span>}
                        {action==="sell" && <span style={{ color:"#ef4444" }}>▼ SELL ${Math.round(Math.abs(h.delta)).toLocaleString()}</span>}
                        {action==="hold" && <span style={{ color:"#94a3b8" }}>● HOLD</span>}
                      </td>
                      <td className="td" style={{ minWidth:140 }}>
                        <div style={{ position:"relative", height:14 }}>
                          <div className="bar" style={{ position:"absolute", top:3, width:"100%" }}>
                            <div className="bar-fill" style={{ width:`${(h.currentPct/maxAlloc)*100}%`, background:"rgba(148,163,184,0.4)" }}/>
                          </div>
                          <div className="bar" style={{ position:"absolute", top:8, width:"100%", background:"transparent" }}>
                            <div className="bar-fill" style={{ width:`${(h.target/maxAlloc)*100}%`, background:accentColor }}/>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: DCA PLAN
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "dca" && (
        <div style={{ padding:"20px 24px" }}>
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ flex:"1 1 280px" }}>
                <p className="sec">Spread buying over weeks (DCA)</p>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <input type="range" min={4} max={26} value={dcaWeeks} onChange={e => setDcaWeeks(Number(e.target.value))}/>
                  <span style={{ fontSize:18, fontWeight:500, color:accentColor, fontFamily:"'JetBrains Mono', monospace", minWidth:100 }}>
                    {dcaWeeks} weeks
                  </span>
                </div>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:6 }}>
                  Spreading over {dcaWeeks} weeks ≈ {(dcaWeeks/4).toFixed(1)} months
                </p>
              </div>
              <div style={{ flex:"0 0 180px", textAlign:"center" }}>
                <p className="sec">Weekly spend</p>
                <p style={{ fontSize:24, fontWeight:500, color:"#22d3ee", fontFamily:"'JetBrains Mono', monospace" }}>
                  ${Math.round(weeklyTotalBuy).toLocaleString()}
                </p>
              </div>
              <div style={{ flex:"0 0 180px", textAlign:"center" }}>
                <p className="sec">Total to deploy</p>
                <p style={{ fontSize:24, fontWeight:500, color:accentColor, fontFamily:"'JetBrains Mono', monospace" }}>
                  ${Math.round(totalBuys).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {totalBuys === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"40px 20px" }}>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.5)" }}>No buys needed — enter a contribution above</p>
            </div>
          ) : (
            <>
              <p className="sec">Weekly DCA plan — {account}</p>
              <div className="card" style={{ padding:0, overflow:"auto", marginBottom:16 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:600 }}>
                  <thead>
                    <tr>
                      <th className="th">Ticker</th>
                      <th className="th">Name</th>
                      <th className="th" style={{ textAlign:"right" }}>Total buy</th>
                      <th className="th" style={{ textAlign:"right" }}>Weekly</th>
                      <th className="th" style={{ textAlign:"right" }}>% of weekly</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyList.sort((a,b) => b.delta - a.delta).map(h => {
                      const weekly = h.delta / dcaWeeks;
                      const pctOfWeekly = (weekly / weeklyTotalBuy) * 100;
                      return (
                        <tr key={h.ticker}>
                          <td className="td td-main"><strong style={{ color:accentColor }}>{h.ticker}</strong></td>
                          <td className="td" style={{ color:"rgba(255,255,255,0.5)" }}>{h.name}</td>
                          <td className="td" style={{ textAlign:"right" }}>${Math.round(h.delta).toLocaleString()}</td>
                          <td className="td" style={{ textAlign:"right", color:"#22d3ee", fontWeight:500 }}>${Math.round(weekly).toLocaleString()}</td>
                          <td className="td" style={{ textAlign:"right" }}>{pctOfWeekly.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="sec">Week-by-week schedule</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10 }}>
                {Array.from({ length: Math.min(dcaWeeks, 12) }, (_, w) => {
                  const isoDate = new Date(Date.now() + w * 7 * 24 * 60 * 60 * 1000);
                  return (
                    <div key={w} className="dca-week">
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontSize:11, color:accentColor, fontWeight:500 }}>Week {w+1}</span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>
                          {isoDate.toLocaleDateString("en-CA", { month:"short", day:"numeric" })}
                        </span>
                      </div>
                      {buyList.sort((a,b) => b.delta - a.delta).slice(0, 5).map(h => (
                        <div key={h.ticker} style={{ display:"flex", justifyContent:"space-between", fontSize:10, padding:"2px 0", fontFamily:"'JetBrains Mono', monospace" }}>
                          <span style={{ color:"rgba(255,255,255,0.5)" }}>{h.ticker}</span>
                          <span style={{ color:"rgba(255,255,255,0.75)" }}>${Math.round(h.delta / dcaWeeks).toLocaleString()}</span>
                        </div>
                      ))}
                      <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:8, paddingTop:6, display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>Total</span>
                        <span style={{ fontSize:11, color:accentColor, fontWeight:500 }}>${Math.round(weeklyTotalBuy).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: EDIT TARGETS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "targets" && (
        <div style={{ padding:"20px 24px" }}>
          <p className="sec">Edit holdings &amp; targets — {account} (auto-saves to your browser)</p>
          <div className="card" style={{ padding:0, overflow:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1100 }}>
              <thead>
                <tr>
                  <th className="th">Ticker / Name</th>
                  <th className="th" style={{ width:120 }}>Current $</th>
                  <th className="th" style={{ width:80 }}>Target %</th>
                  <th className="th" style={{ width:90 }}>Est. CAGR %</th>
                  <th className="th" style={{ textAlign:"right", width:110 }}>10yr value</th>
                  <th className="th" style={{ textAlign:"right", width:110 }}>15yr value</th>
                  <th className="th" style={{ textAlign:"right", width:110 }}>20yr value</th>
                  <th className="th">Notes</th>
                  <th className="th" style={{ width:110 }}></th>
                </tr>
              </thead>
              <tbody>
                {current.map((h, idx) => {
                  const cagr = h.cagr ?? DEFAULT_CAGR[h.ticker] ?? 10;
                  const proj = (yrs) => h.current > 0
                    ? `$${Math.round(h.current * Math.pow(1 + cagr / 100, yrs)).toLocaleString()}`
                    : "—";
                  return (
                    <tr key={h.ticker}>
                      <td className="td td-main">
                        <strong style={{ color:accentColor }}>{h.ticker}</strong>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{h.name}</div>
                      </td>
                      <td className="td">
                        <input type="number" value={h.current}
                          onChange={e => updateHolding(idx, "current", e.target.value)}/>
                      </td>
                      <td className="td">
                        <input type="number" value={h.target} max="100" min="0"
                          onChange={e => updateHolding(idx, "target", e.target.value)}/>
                      </td>
                      <td className="td">
                        <input type="number" value={cagr} min="0" max="100" step="0.5"
                          onChange={e => updateHolding(idx, "cagr", e.target.value)}
                          style={{ color:"#a78bfa" }}/>
                      </td>
                      <td className="td" style={{ textAlign:"right", color:"#34d399", fontFamily:"'JetBrains Mono',monospace" }}>{proj(10)}</td>
                      <td className="td" style={{ textAlign:"right", color:"#22d3ee", fontFamily:"'JetBrains Mono',monospace" }}>{proj(15)}</td>
                      <td className="td" style={{ textAlign:"right", color:accentColor,  fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{proj(20)}</td>
                      <td className="td" style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontFamily:"inherit", lineHeight:1.5 }}>
                        {h.notes}
                      </td>
                      <td className="td" style={{ textAlign:"center" }}>
                        {pendingRemove === idx ? (
                          <div style={{ display:"flex", gap:4 }}>
                            <button className="btn btn-danger" onClick={() => removeTicker(idx)}
                              style={{ padding:"3px 7px", fontSize:10 }}>Yes</button>
                            <button className="btn" onClick={() => setPendingRemove(null)}
                              style={{ padding:"3px 7px", fontSize:10 }}>No</button>
                          </div>
                        ) : (
                          <button className="btn btn-danger" onClick={() => setPendingRemove(idx)}
                            style={{ padding:"3px 8px", fontSize:11 }} title={`Remove ${h.ticker}`}>
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background:"rgba(255,255,255,0.03)" }}>
                  <td className="td td-main"><strong>TOTAL</strong></td>
                  <td className="td" style={{ color:accentColor, fontWeight:500 }}>${Math.round(currentTotal).toLocaleString()}</td>
                  <td className="td" style={{ color: Math.abs(targetSum - 100) > 0.5 ? "#ef4444" : "#34d399", fontWeight:500 }}>
                    {targetSum}%
                  </td>
                  <td className="td"></td>
                  <td className="td" style={{ textAlign:"right", color:"#34d399", fontWeight:500 }}>
                    ${Math.round(current.filter(h=>h.current>0).reduce((s,h)=>s+h.current*Math.pow(1+(h.cagr??DEFAULT_CAGR[h.ticker]??10)/100,10),0)).toLocaleString()}
                  </td>
                  <td className="td" style={{ textAlign:"right", color:"#22d3ee", fontWeight:500 }}>
                    ${Math.round(current.filter(h=>h.current>0).reduce((s,h)=>s+h.current*Math.pow(1+(h.cagr??DEFAULT_CAGR[h.ticker]??10)/100,15),0)).toLocaleString()}
                  </td>
                  <td className="td" style={{ textAlign:"right", color:accentColor, fontWeight:600 }}>
                    ${Math.round(current.filter(h=>h.current>0).reduce((s,h)=>s+h.current*Math.pow(1+(h.cagr??DEFAULT_CAGR[h.ticker]??10)/100,20),0)).toLocaleString()}
                  </td>
                  <td className="td" style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }} colSpan={2}>
                    {Math.abs(targetSum - 100) > 0.5 ? `⚠ Off by ${Math.abs(targetSum - 100).toFixed(1)}% — targets should sum to 100%` : "✓ Targets balanced"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Add ticker toggle */}
          <div style={{ marginTop:12, display:"flex", gap:8 }}>
            <button className={`btn ${addForm ? "btn-primary" : ""}`}
              onClick={() => setAddForm(addForm ? null : { ...BLANK_FORM })}>
              {addForm ? "✕ Cancel" : "+ Add Ticker"}
            </button>
          </div>

          {/* Add ticker form */}
          {addForm && (
            <div className="add-form">
              <p className="sec" style={{ marginBottom:14 }}>New position — {account}</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:10, marginBottom:12 }}>
                <div>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Ticker *</p>
                  <input type="text" value={addForm.ticker} placeholder="e.g. AAPL"
                    onChange={e => setAddForm({ ...addForm, ticker: e.target.value.toUpperCase() })}/>
                </div>
                <div>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Name</p>
                  <input type="text" value={addForm.name} placeholder="e.g. Apple"
                    onChange={e => setAddForm({ ...addForm, name: e.target.value })}/>
                </div>
                <div>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Current $ value</p>
                  <input type="number" value={addForm.current} placeholder="0"
                    onChange={e => setAddForm({ ...addForm, current: e.target.value })}/>
                </div>
                <div>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Target %</p>
                  <input type="number" value={addForm.target} placeholder="0" min="0" max="100"
                    onChange={e => setAddForm({ ...addForm, target: e.target.value })}/>
                </div>
                <div>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Div yield %</p>
                  <input type="number" value={addForm.divYield} placeholder="0.0" step="0.1"
                    onChange={e => setAddForm({ ...addForm, divYield: e.target.value })}/>
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Notes (optional)</p>
                <input type="text" value={addForm.notes} placeholder="Investment thesis or notes…"
                  onChange={e => setAddForm({ ...addForm, notes: e.target.value })}/>
              </div>
              <button className="btn btn-primary" onClick={addTicker}>
                + Add to {account}
              </button>
            </div>
          )}

          <div style={{ marginTop:14, padding:"12px 14px", background:"rgba(251,191,36,0.05)",
            border:"1px solid rgba(251,191,36,0.15)", borderRadius:8, fontSize:11,
            color:"rgba(251,191,36,0.8)", lineHeight:1.6 }}>
            ⚠ Not financial advice. Data is stored in your browser (localStorage). Use Export/Import to back up your data. Consult a licensed CFP before trading.
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: RECOMMENDATIONS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "recommend" && (
        <div style={{ padding:"20px 24px" }}>

          {/* Gap analysis banner */}
          {gaps.length > 0 && (
            <div className="card" style={{ marginBottom:16, padding:"12px 16px" }}>
              <p className="sec" style={{ marginBottom:8 }}>Portfolio gaps detected</p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {gaps.map(g => (
                  <span key={g} className="gap-badge">⚠ {g}</span>
                ))}
              </div>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:10, lineHeight:1.5 }}>
                Your combined TFSA + RRSP portfolio has no holdings in these sectors. Filter by "Fills Gaps" below to see targeted suggestions.
              </p>
            </div>
          )}

          {/* Market context card */}
          <div className="card" style={{ marginBottom:16, padding:"12px 16px",
            background:"rgba(34,211,238,0.03)", borderColor:"rgba(34,211,238,0.1)" }}>
            <p className="sec" style={{ marginBottom:8, color:"#22d3ee88" }}>Market context — April 2026</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:8 }}>
              {[
                { icon:"📉", label:"Tariff volatility", desc:"US-China trade tensions creating entry points in multinationals" },
                { icon:"🤖", label:"AI buildout intact", desc:"Enterprise AI spending accelerating despite macro headwinds" },
                { icon:"💊", label:"Healthcare resilient", desc:"GLP-1 + aging demographics = secular demand regardless of cycle" },
                { icon:"🏦", label:"Rate-cut cycle", desc:"BoC & Fed easing — bonds and REITs poised for revaluation" },
                { icon:"🛡️", label:"Defense surge", desc:"NATO 2% commitment + geopolitical tensions driving procurement" },
                { icon:"🌏", label:"EM rotation", desc:"India + LatAm outperforming as manufacturing diversifies from China" },
              ].map(c => (
                <div key={c.label} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <span style={{ fontSize:16 }}>{c.icon}</span>
                  <div>
                    <p style={{ fontSize:11, fontWeight:500, color:"rgba(255,255,255,0.7)", marginBottom:2 }}>{c.label}</p>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", lineHeight:1.4 }}>{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter bar */}
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginRight:4 }}>Filter:</span>
            {[["all","All ideas"],["tfsa","Best for TFSA"],["rrsp","Best for RRSP"],["gaps","Fills Gaps"]].map(([v,l]) => (
              <button key={v} className={`tab-btn ${recFilter===v?"on":""}`}
                onClick={() => setRecFilter(v)} style={{ padding:"5px 12px", fontSize:11 }}>
                {l}
              </button>
            ))}
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginLeft:"auto" }}>
              {filteredRecs.length} idea{filteredRecs.length !== 1 ? "s" : ""} · already-owned tickers excluded
            </span>
          </div>

          {filteredRecs.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"40px 20px" }}>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>
                {recFilter === "gaps" ? "No gap-filling ideas available — your portfolio is well-diversified!" : "No ideas match the current filter."}
              </p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>Try clearing the filter or adding more positions.</p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:12 }}>
              {filteredRecs.map(rec => (
                <div key={rec.ticker} className="rec-card">
                  {/* Card header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:18, fontFamily:"'JetBrains Mono', monospace",
                          fontWeight:600, color: rec.bestFor === "TFSA" ? "#fbbf24" : rec.bestFor === "RRSP" ? "#22d3ee" : "#a78bfa" }}>
                          {rec.ticker}
                        </span>
                        <span style={{ fontSize:10, fontWeight:500, padding:"2px 7px", borderRadius:4,
                          background: rec.conviction === "High"
                            ? "rgba(52,211,153,0.12)" : "rgba(148,163,184,0.1)",
                          color:  rec.conviction === "High" ? "#34d399" : "#94a3b8",
                          border: `1px solid ${rec.conviction === "High" ? "rgba(52,211,153,0.3)" : "rgba(148,163,184,0.2)"}` }}>
                          {rec.conviction}
                        </span>
                      </div>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.45)" }}>{rec.name}</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4,
                        background: rec.bestFor === "TFSA"
                          ? "rgba(251,191,36,0.1)" : rec.bestFor === "RRSP"
                          ? "rgba(34,211,238,0.1)" : "rgba(167,139,250,0.1)",
                        color: rec.bestFor === "TFSA" ? "#fbbf24" : rec.bestFor === "RRSP" ? "#22d3ee" : "#a78bfa",
                        border: `1px solid ${rec.bestFor === "TFSA" ? "rgba(251,191,36,0.25)" : rec.bestFor === "RRSP" ? "rgba(34,211,238,0.25)" : "rgba(167,139,250,0.25)"}` }}>
                        {rec.bestFor === "both" ? "TFSA / RRSP" : rec.bestFor}
                      </span>
                      {rec.divYield > 0 && (
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:4 }}>{rec.divYield}% yield</p>
                      )}
                      {rec.divYield === 0 && (
                        <p style={{ fontSize:10, color:"rgba(52,211,153,0.6)", marginTop:4 }}>No dividend</p>
                      )}
                    </div>
                  </div>

                  {/* Sector */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, padding:"2px 7px", borderRadius:4,
                      background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)",
                      border:"1px solid rgba(255,255,255,0.08)" }}>
                      {rec.sector}
                    </span>
                    {rec.tags.map(tag => (
                      <span key={tag} style={{ fontSize:10, padding:"2px 7px", borderRadius:4,
                        background:"rgba(167,139,250,0.06)", color:"rgba(167,139,250,0.6)",
                        border:"1px solid rgba(167,139,250,0.15)" }}>
                        {tag}
                      </span>
                    ))}
                    {rec.fills.some(f => gaps.includes(f)) && (
                      <span style={{ fontSize:10, padding:"2px 7px", borderRadius:4,
                        background:"rgba(251,146,60,0.1)", color:"#fb923c",
                        border:"1px solid rgba(251,146,60,0.25)" }}>
                        Fills gap
                      </span>
                    )}
                  </div>

                  {/* Thesis */}
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", lineHeight:1.6 }}>{rec.thesis}</p>

                  {/* Add buttons */}
                  <div style={{ display:"flex", gap:8, marginTop:"auto" }}>
                    <button className="btn" onClick={() => addRecommendedTicker(rec, "TFSA")}
                      style={{ flex:1, fontSize:11, padding:"6px 10px",
                        borderColor:"rgba(251,191,36,0.3)", color:"rgba(251,191,36,0.8)" }}>
                      + Add to TFSA
                    </button>
                    <button className="btn" onClick={() => addRecommendedTicker(rec, "RRSP")}
                      style={{ flex:1, fontSize:11, padding:"6px 10px",
                        borderColor:"rgba(34,211,238,0.3)", color:"rgba(34,211,238,0.8)" }}>
                      + Add to RRSP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:20, lineHeight:1.5 }}>
            ⚠ Not financial advice. Recommendations are for educational purposes only. Market conditions change rapidly. Consult a licensed financial advisor before making investment decisions.
          </p>
        </div>
      )}
    </div>
  );
}
