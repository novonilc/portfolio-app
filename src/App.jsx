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
const BLANK_FORM = { ticker:"", name:"", current:"", costBasis:"", target:"", divYield:"", cagr:"", notes:"" };

// Canadian-listed tickers exempt from US withholding tax
const CAD_EXEMPT = new Set(["CNQ","XIU","VFV.TO","BTCC","GOLD","ZAG.TO","XRE.TO","XEG.TO","XIU.TO","ZCN.TO"]);

// Per-portfolio accent colors — TFSA/RRSP fixed, extras cycle
const PORTFOLIO_COLORS = {
  TFSA: { accent:"#fbbf24", rgb:"251,191,36" },
  RRSP: { accent:"#22d3ee", rgb:"34,211,238" },
};
const EXTRA_COLORS = [
  { accent:"#a78bfa", rgb:"167,139,250" },
  { accent:"#34d399", rgb:"52,211,153"  },
  { accent:"#fb923c", rgb:"251,146,60"  },
  { accent:"#f472b6", rgb:"244,114,182" },
  { accent:"#60a5fa", rgb:"96,165,250"  },
];

// Quick ticker lookup for search tab
const TICKER_DB = Object.fromEntries(RECOMMENDATIONS.map(r => [r.ticker, r]));

function AppLogo() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="38" rx="10" fill="rgba(251,191,36,0.07)" stroke="rgba(251,191,36,0.22)" strokeWidth="1"/>
      <rect x="6"  y="23" width="5.5" height="9"  rx="1.5" fill="#fbbf24" opacity="0.45"/>
      <rect x="15" y="14" width="5.5" height="18" rx="1.5" fill="#fbbf24" opacity="0.9"/>
      <rect x="24" y="19" width="5.5" height="13" rx="1.5" fill="#fbbf24" opacity="0.6"/>
      <path d="M8.5 21.5 L17.5 12.5 L26.5 17" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="26.5" cy="17" r="2.2" fill="#22d3ee"/>
    </svg>
  );
}

export default function App() {
  const [portfolios,       setPortfolios]      = useState(["TFSA","RRSP"]);
  const [account,          setAccount]         = useState("TFSA");
  const [cashHolding,      setCashHolding]     = useState({ TFSA: 0, RRSP: 0 });
  const [dcaWeeks,         setDcaWeeks]        = useState(20);
  const [holdings,         setHoldings]        = useState({ TFSA: INITIAL_TFSA, RRSP: INITIAL_RRSP });
  const [saveStatus,       setSaveStatus]      = useState("");
  const [tab,              setTab]             = useState("rebalance");
  const [addForm,          setAddForm]         = useState(null);
  const [recFilter,        setRecFilter]       = useState("all");
  const [pendingRemove,    setPendingRemove]   = useState(null);
  const [rebalMode,        setRebalMode]       = useState("cash");
  const [showReset,        setShowReset]       = useState(false);
  const [addPortfolioForm, setAddPortfolioForm]= useState(null);
  const [searchQuery,      setSearchQuery]     = useState("");
  const [searchResult,     setSearchResult]    = useState(null);

  // ── Load from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const listData = localStorage.getItem("portfolio:list");
      const pList = listData ? JSON.parse(listData) : ["TFSA","RRSP"];
      setPortfolios(pList);
      const nextH = { TFSA: INITIAL_TFSA, RRSP: INITIAL_RRSP };
      for (const p of pList) {
        const hData = localStorage.getItem(`portfolio:${p}`);
        if (hData) nextH[p] = JSON.parse(hData);
        else if (!nextH[p]) nextH[p] = [];
      }
      setHoldings(nextH);
      const cashData = localStorage.getItem("portfolio:cash");
      if (cashData) setCashHolding(JSON.parse(cashData));
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

  function persistCash(next) {
    localStorage.setItem("portfolio:cash", JSON.stringify(next));
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
      name:      addForm.name.trim() || ticker,
      current:   Number(addForm.current)   || 0,
      costBasis: Number(addForm.costBasis) || 0,
      target:    Number(addForm.target)    || 0,
      divYield:  Number(addForm.divYield)  || 0,
      cagr:      Number(addForm.cagr)      || DEFAULT_CAGR[ticker] || 10,
      locked:    "✅ Keep",
      notes:     addForm.notes.trim(),
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
      ticker:    rec.ticker,
      name:      rec.name,
      current:   0,
      costBasis: 0,
      target:    0,
      divYield:  rec.divYield,
      cagr:      DEFAULT_CAGR[rec.ticker] || 10,
      locked:    "✅ Keep",
      notes:     rec.thesis.slice(0, 120) + "…",
    }];
    setHoldings(next);
    persist(targetAccount, next[targetAccount]);
    setAccount(targetAccount);
    setTab("targets");
  }

  // ── Cash holding ───────────────────────────────────────────────────────
  function handleCash(val) {
    const next = { ...cashHolding, [account]: Number(val) || 0 };
    setCashHolding(next);
    persistCash(next);
  }

  // ── Reset / Export / Import ────────────────────────────────────────────
  function addPortfolio(name) {
    const clean = name.trim().replace(/\s+/g,"_").toUpperCase().slice(0,20);
    if (!clean || portfolios.includes(clean)) return;
    const next = [...portfolios, clean];
    setPortfolios(next);
    localStorage.setItem("portfolio:list", JSON.stringify(next));
    const nextH = { ...holdings, [clean]: [] };
    setHoldings(nextH);
    const nextC = { ...cashHolding, [clean]: 0 };
    setCashHolding(nextC);
    persistCash(nextC);
    setAccount(clean);
    setAddPortfolioForm(null);
  }

  function removePortfolio(pName) {
    if (["TFSA","RRSP"].includes(pName)) return;
    const next = portfolios.filter(p => p !== pName);
    setPortfolios(next);
    localStorage.setItem("portfolio:list", JSON.stringify(next));
    localStorage.removeItem(`portfolio:${pName}`);
    const nextH = { ...holdings };
    delete nextH[pName];
    setHoldings(nextH);
    const nextC = { ...cashHolding };
    delete nextC[pName];
    setCashHolding(nextC);
    persistCash(nextC);
    if (account === pName) setAccount(next[0] || "TFSA");
  }

  function doReset() {
    const defaultData = account === "TFSA" ? INITIAL_TFSA : account === "RRSP" ? INITIAL_RRSP : [];
    const next = { ...holdings, [account]: defaultData };
    setHoldings(next);
    persist(account, next[account]);
    setShowReset(false);
  }

  function exportData() {
    const data = JSON.stringify({ holdings, cashHolding, portfolios }, null, 2);
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
        const h = data.holdings || data;
        if (h.TFSA && h.RRSP) {
          const pList = data.portfolios || ["TFSA","RRSP"];
          setPortfolios(pList);
          localStorage.setItem("portfolio:list", JSON.stringify(pList));
          setHoldings(h);
          for (const p of pList) { if (h[p]) persist(p, h[p]); }
          if (data.cashHolding) { setCashHolding(data.cashHolding); persistCash(data.cashHolding); }
          alert("✅ Portfolio imported successfully!");
        } else { alert("⚠ Invalid file format"); }
      } catch { alert("⚠ Could not read file"); }
    };
    reader.readAsText(file);
  }

  // ── Derived values ─────────────────────────────────────────────────────
  const current       = holdings[account];
  const currentTotal  = current.reduce((s, h) => s + h.current, 0);
  const cash          = cashHolding[account] || 0;
  const newTotal      = currentTotal + cash;

  // P&L (uses costBasis per position, summed)
  const totalCostBasis = current.reduce((s, h) => s + (h.costBasis || 0), 0);
  const totalPnL       = totalCostBasis > 0 ? currentTotal - totalCostBasis : null;
  const totalPnLPct    = totalCostBasis > 0 ? ((currentTotal - totalCostBasis) / totalCostBasis) * 100 : null;

  // Annual dividend income + TFSA withholding tax estimate
  const annualDivIncome = current.reduce((s, h) => s + h.current * (h.divYield || 0) / 100, 0);
  const whtEstimate     = account === "TFSA"
    ? current.filter(h => !CAD_EXEMPT.has(h.ticker))
              .reduce((s, h) => s + h.current * (h.divYield || 0) / 100 * 0.15, 0)
    : 0;

  // Cash-constrained rebalance
  const rawItems = current.map(h => {
    const targetDollar = newTotal * h.target / 100;
    const rawDelta     = targetDollar - h.current;
    return { ...h, currentDollar: h.current, targetDollar, rawDelta,
             currentPct: currentTotal > 0 ? (h.current / currentTotal) * 100 : 0 };
  });
  const rawBuyTotal    = rawItems.filter(r => r.rawDelta > 0).reduce((s, r) => s + r.rawDelta, 0);
  const scaleFactor    = rebalMode === "cash" && cash > 0 && rawBuyTotal > cash ? cash / rawBuyTotal : 1;
  const isCashConstrained = scaleFactor < 1;

  const rebalance = rawItems.map(r => ({
    ...r,
    delta: rebalMode === "cash"
      ? (r.rawDelta > 0 ? r.rawDelta * scaleFactor : 0)
      : r.rawDelta,
  }));

  const totalBuys      = rebalance.filter(r => r.delta > 0).reduce((s, r) => s + r.delta, 0);
  const totalSells     = rebalance.filter(r => r.delta < 0).reduce((s, r) => s + Math.abs(r.delta), 0);
  const cashRemaining  = Math.max(cash - totalBuys, 0);
  const buyList        = rebalance.filter(r => r.delta > 0);
  const weeklyTotalBuy = totalBuys / dcaWeeks;
  const maxAlloc       = Math.max(...current.map(h => Math.max(h.target, (h.current / Math.max(currentTotal, 1)) * 100)), 1);

  // Concentration warnings (>20% of current portfolio)
  const concentrationWarnings = current.filter(h =>
    currentTotal > 0 && (h.current / currentTotal) * 100 > 20
  );

  // WHT sell recommendations — TFSA positions losing ≥$20/yr to IRS withholding
  const whtSellRecs = account === "TFSA"
    ? current
        .filter(h => {
          const wht = h.current * (h.divYield || 0) / 100 * 0.15;
          return !CAD_EXEMPT.has(h.ticker) && (h.divYield || 0) >= 3 && wht > 0;
        })
        .map(h => ({
          ...h,
          annualDiv: h.current * h.divYield / 100,
          annualWHT: h.current * h.divYield / 100 * 0.15,
          priority:  h.current * h.divYield / 100 * 0.15 >= 80,
        }))
        .sort((a, b) => b.annualWHT - a.annualWHT)
    : [];

  // Buy recommendations with contextual tax + allocation reasons
  const enrichedBuys = rebalance
    .filter(r => r.delta > 5)
    .sort((a, b) => b.delta - a.delta)
    .map(r => {
      const gap = (r.target - r.currentPct).toFixed(1);
      const reasons = [];
      if (r.current === 0) {
        reasons.push(`New position — ${r.target}% target, currently unowned`);
      } else {
        reasons.push(`${gap}% underweight — ${r.currentPct.toFixed(1)}% held vs ${r.target}% target`);
      }
      if (account === "TFSA") {
        if (!(r.divYield) || r.divYield === 0)
          reasons.push("No dividend drag — 100% of appreciation compounds tax-free in TFSA");
        else if (CAD_EXEMPT.has(r.ticker))
          reasons.push(`WHT-exempt (CAD-listed) — full ${r.divYield}% yield retained in TFSA`);
        else
          reasons.push(`⚠ US dividend attracts 15% IRS withholding in TFSA (~$${Math.round(r.current*(r.divYield||0)/100*0.15)}/yr drag) — consider RRSP`);
      } else if (account === "RRSP") {
        if ((r.divYield || 0) > 0.4)
          reasons.push(`${r.divYield}% yield — 0% withholding under Canada-US tax treaty in RRSP`);
        else if (!(r.divYield) || r.divYield === 0)
          reasons.push("Growth stock — tax-deferred compounding in RRSP until withdrawal");
      }
      return { ...r, reasons };
    });

  const gaps      = detectGaps(holdings.TFSA, holdings.RRSP);
  const targetSum = current.reduce((s, h) => s + h.target, 0);

  const filteredRecs = RECOMMENDATIONS.filter(r => {
    if (recFilter === "tfsa") return r.bestFor === "TFSA" || r.bestFor === "both";
    if (recFilter === "rrsp") return r.bestFor === "RRSP" || r.bestFor === "both";
    if (recFilter === "gaps") return r.fills.some(f => gaps.includes(f));
    return true;
  }).filter(r => {
    const allTickers = new Set([...holdings.TFSA, ...holdings.RRSP].map(h => h.ticker));
    return !allTickers.has(r.ticker);
  });

  const accountIdx  = portfolios.indexOf(account);
  const colorInfo   = PORTFOLIO_COLORS[account] ?? EXTRA_COLORS[Math.max(0, accountIdx - 2) % EXTRA_COLORS.length];
  const accentColor = colorInfo.accent;
  const accentRGB   = colorInfo.rgb;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#080c16", color:"#f1f5f9",
      fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#080c16;margin:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:10px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.2)}
        input,button,select,textarea{font-family:inherit}
        input[type=number],input[type=text],textarea{
          background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);
          color:#f1f5f9;padding:8px 12px;border-radius:8px;font-size:13px;
          font-family:'JetBrains Mono',monospace;width:100%;transition:all 0.2s;
        }
        input[type=number]:focus,input[type=text]:focus,textarea:focus{
          outline:none;border-color:${accentColor};background:rgba(255,255,255,0.07);
          box-shadow:0 0 0 3px ${accentColor}18;
        }
        input[type=range]{accent-color:${accentColor};width:100%}
        .tab-btn{
          padding:7px 16px;border-radius:8px;font-size:12px;font-weight:500;
          border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);
          color:rgba(255,255,255,0.38);cursor:pointer;transition:all 0.2s;
          font-family:inherit;letter-spacing:0.03em;
        }
        .tab-btn.on{
          background:rgba(${accentRGB},0.15);border-color:${accentColor}55;
          color:${accentColor};box-shadow:0 0 20px ${accentColor}22;
        }
        .tab-btn:hover:not(.on){color:rgba(255,255,255,0.72);border-color:rgba(255,255,255,0.14);background:rgba(255,255,255,0.04)}
        .card{
          background:rgba(255,255,255,0.028);border:1px solid rgba(255,255,255,0.07);
          border-radius:14px;padding:18px 20px;transition:border-color 0.2s;
        }
        .card:hover{border-color:rgba(255,255,255,0.11)}
        .stat-card{
          position:relative;overflow:hidden;
          background:rgba(255,255,255,0.028);border:1px solid rgba(255,255,255,0.07);
          border-radius:14px;padding:14px 16px;transition:all 0.22s;
        }
        .stat-card::before{
          content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:var(--accent);border-radius:14px 14px 0 0;opacity:0.7;
        }
        .stat-card:hover{border-color:rgba(255,255,255,0.12);transform:translateY(-1px)}
        .th{
          text-align:left;font-size:10px;font-weight:600;letter-spacing:0.12em;
          color:rgba(255,255,255,0.28);text-transform:uppercase;padding:10px 14px;
          border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.025);
        }
        .td{
          padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.04);
          font-size:12px;color:rgba(255,255,255,0.68);vertical-align:middle;
          font-family:'JetBrains Mono',monospace;
        }
        .td-main{color:#f1f5f9;font-weight:500}
        .bar{height:4px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden;margin-top:5px}
        .bar-fill{height:100%;border-radius:2px;transition:width 0.5s cubic-bezier(.4,0,.2,1)}
        .pill{display:inline-block;padding:2px 9px;border-radius:5px;font-size:10px;font-weight:500;letter-spacing:0.03em}
        .hold{background:rgba(148,163,184,0.07);color:#94a3b8;border:1px solid rgba(148,163,184,0.14)}
        .new-tag{background:rgba(52,211,153,0.1);color:#34d399;border:1px solid rgba(52,211,153,0.22);
          padding:1px 7px;border-radius:4px;font-size:9px;font-weight:600;letter-spacing:0.06em}
        .sec{font-size:9.5px;letter-spacing:0.15em;text-transform:uppercase;
          color:rgba(255,255,255,0.27);margin-bottom:10px;font-weight:600}
        .btn{
          background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.58);padding:7px 14px;border-radius:8px;
          cursor:pointer;font-size:12px;transition:all 0.2s;white-space:nowrap;
        }
        .btn:hover{border-color:${accentColor}55;color:${accentColor};background:rgba(${accentRGB},0.07)}
        .btn-danger{border-color:rgba(244,63,94,0.22);color:rgba(244,63,94,0.65);background:rgba(244,63,94,0.04)}
        .btn-danger:hover{border-color:#f43f5e;color:#f43f5e;background:rgba(244,63,94,0.09)}
        .btn-primary{background:rgba(${accentRGB},0.1);border-color:${accentColor}50;color:${accentColor}}
        .btn-primary:hover{background:rgba(${accentRGB},0.18);border-color:${accentColor}}
        .dca-week{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);
          border-radius:10px;padding:14px 16px;margin-bottom:8px}
        .rec-card{
          background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);
          border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px;transition:all 0.22s;
        }
        .rec-card:hover{border-color:rgba(255,255,255,0.13);transform:translateY(-1px);box-shadow:0 8px 32px rgba(0,0,0,0.35)}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes slideUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .pulse{animation:pulse 1.5s ease infinite}
        .slide-up{animation:slideUp 0.25s ease forwards}
        .gap-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;
          border-radius:20px;font-size:10px;font-weight:500;letter-spacing:0.05em;
          background:rgba(249,115,22,0.1);color:#f97316;border:1px solid rgba(249,115,22,0.2);text-transform:capitalize}
        .add-form{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);
          border-radius:12px;padding:18px;margin-top:14px}
        .warn{background:rgba(249,115,22,0.05);border:1px solid rgba(249,115,22,0.16);
          border-left:3px solid #f97316;border-radius:10px;padding:11px 16px;
          font-size:11px;color:#f97316;line-height:1.65;margin-bottom:14px}
        .action-card{transition:filter 0.15s,border-color 0.2s}
        .action-card:hover{filter:brightness(1.12)}
        tbody tr:hover .td{background:rgba(255,255,255,0.02)}
        .buy-row .td{background:rgba(34,211,238,0.014)}
        .sell-row .td{background:rgba(244,63,94,0.014)}
        .action-divider{display:flex;align-items:center;gap:10px;margin-bottom:14px}
        .action-divider-bar{width:3px;border-radius:2px;flex-shrink:0}
      `}</style>

      {/* ── Header ── */}
      <div style={{ position:"sticky", top:0, zIndex:100 }}>
        <div style={{
          background:"rgba(8,12,22,0.88)", backdropFilter:"blur(24px) saturate(180%)",
          WebkitBackdropFilter:"blur(24px) saturate(180%)",
          padding:"13px 28px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          flexWrap:"wrap", gap:10
        }}>
          {/* Brand */}
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <AppLogo/>
            <div>
              <p style={{ fontSize:9, letterSpacing:"0.25em", color:`${accentColor}88`,
                textTransform:"uppercase", fontWeight:600, marginBottom:4 }}>
                PRB · DCA Planner
              </p>
              <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                <h1 style={{ fontFamily:"'Instrument Serif', serif", fontSize:20, fontWeight:400,
                  background:`linear-gradient(125deg, #f1f5f9 0%, ${accentColor} 48%, #a78bfa 100%)`,
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.1 }}>
                  Portfolio ReBalancer &amp; DCA Planner
                </h1>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            {saveStatus && (
              <span className="pulse" style={{ fontSize:11, color:accentColor, marginRight:4 }}>
                {saveStatus}
              </span>
            )}

            {/* Utility */}
            <label className="btn" style={{ cursor:"pointer", fontSize:11, padding:"6px 12px" }}>
              ⬇ Import
              <input type="file" accept=".json" style={{ display:"none" }} onChange={importData}/>
            </label>
            <button className="btn" style={{ fontSize:11, padding:"6px 12px" }} onClick={exportData}>
              ⬆ Export
            </button>
            {showReset ? (
              <>
                <button className="btn btn-danger" onClick={doReset} style={{ fontSize:11, padding:"6px 12px" }}>
                  Confirm Reset
                </button>
                <button className="btn" onClick={() => setShowReset(false)}
                  style={{ fontSize:11, padding:"6px 10px" }}>✕</button>
              </>
            ) : (
              <button className="btn" onClick={() => setShowReset(true)}
                style={{ fontSize:11, padding:"6px 10px" }}>↻</button>
            )}

            <div style={{ width:1, height:22, background:"rgba(255,255,255,0.08)", margin:"0 4px" }}/>

            {/* Portfolio tabs */}
            {portfolios.map(p => (
              <button key={p} className={`tab-btn ${account===p?"on":""}`}
                style={{ padding:"5px 12px", fontSize:11 }}
                onClick={() => { setAccount(p); setShowReset(false); setPendingRemove(null); }}>
                {p === "TFSA" ? "💰 TFSA" : p === "RRSP" ? "🏦 RRSP" : `📁 ${p}`}
              </button>
            ))}

            {addPortfolioForm !== null ? (
              <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                <input type="text" value={addPortfolioForm}
                  onChange={e => setAddPortfolioForm(e.target.value.toUpperCase())}
                  onKeyDown={e => {
                    if (e.key === "Enter") addPortfolio(addPortfolioForm);
                    if (e.key === "Escape") setAddPortfolioForm(null);
                  }}
                  placeholder="NAME" autoFocus style={{ width:88, fontSize:11, padding:"5px 8px" }}/>
                <button className="btn btn-primary" onClick={() => addPortfolio(addPortfolioForm)}
                  style={{ fontSize:11, padding:"5px 10px" }}>Add</button>
                <button className="btn" onClick={() => setAddPortfolioForm(null)}
                  style={{ fontSize:11, padding:"5px 8px" }}>✕</button>
              </div>
            ) : (
              <button className="btn" onClick={() => setAddPortfolioForm("")}
                style={{ fontSize:11, padding:"5px 10px" }}>+ Portfolio</button>
            )}
            {!["TFSA","RRSP"].includes(account) && (
              <button className="btn btn-danger" onClick={() => removePortfolio(account)}
                style={{ fontSize:11, padding:"5px 10px" }}>✕ Delete</button>
            )}
          </div>
        </div>
        {/* Dynamic gradient accent line under header */}
        <div style={{
          height:1,
          background:`linear-gradient(90deg, transparent 0%, ${accentColor}55 25%, ${accentColor}55 75%, transparent 100%)`
        }}/>
      </div>

      {/* ── Concentration warning ── */}
      {concentrationWarnings.length > 0 && (
        <div style={{ padding:"12px 28px 0" }}>
          <div className="warn" style={{ marginBottom:0, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:16 }}>⚠</span>
            <span>
              Concentration risk in {account}: {concentrationWarnings.map(h =>
                <strong key={h.ticker} style={{ color:"#f97316" }}>
                  {h.ticker} ({((h.current/currentTotal)*100).toFixed(1)}%)
                </strong>
              ).reduce((a, b) => [a, ", ", b])} {concentrationWarnings.length > 1 ? "exceed" : "exceeds"} 20% — consider spreading risk.
            </span>
          </div>
        </div>
      )}

      {/* ── Summary cards ── */}
      <div style={{ padding:"18px 28px 0", display:"grid",
        gridTemplateColumns:"repeat(auto-fit, minmax(152px, 1fr))", gap:10 }}>

        {/* Cash */}
        <div className="stat-card" style={{ "--accent":"#34d399" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Cash ({account})</p>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
            <span style={{ fontSize:13, color:"rgba(255,255,255,0.22)", fontFamily:"'JetBrains Mono',monospace" }}>$</span>
            <input type="number" value={cash || ""} onChange={e => handleCash(e.target.value)}
              placeholder="0"
              style={{ fontSize:21, fontWeight:600, color:"#34d399", border:"none",
                background:"transparent", padding:0, width:"100%",
                fontFamily:"'JetBrains Mono',monospace" }}/>
          </div>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>available to invest</p>
        </div>

        {/* Total invested */}
        <div className="stat-card" style={{ "--accent":"#64748b" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Total invested</p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color: totalCostBasis > 0 ? "#94a3b8" : "rgba(255,255,255,0.18)", marginBottom:4 }}>
            {totalCostBasis > 0 ? `$${Math.round(totalCostBasis).toLocaleString()}` : "—"}
          </p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>cost basis</p>
        </div>

        {/* Portfolio value */}
        <div className="stat-card" style={{ "--accent":accentColor }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Portfolio value</p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color:accentColor, marginBottom:4 }}>
            ${Math.round(currentTotal).toLocaleString()}
          </p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>market value</p>
        </div>

        {/* Unrealized P&L */}
        {totalPnL !== null && (
          <div className="stat-card"
            style={{ "--accent": totalPnL >= 0 ? "#34d399" : "#f43f5e" }}>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
              marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Unrealized P&amp;L</p>
            <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
              color: totalPnL >= 0 ? "#34d399" : "#f43f5e", marginBottom:4 }}>
              {totalPnL >= 0 ? "+" : ""}${Math.round(totalPnL).toLocaleString()}
            </p>
            <p style={{ fontSize:9, color: totalPnL >= 0 ? "#34d399" : "#f43f5e", opacity:0.8 }}>
              {totalPnLPct >= 0 ? "+" : ""}{totalPnLPct.toFixed(1)}% total return
            </p>
          </div>
        )}

        {/* Annual dividends */}
        {annualDivIncome > 1 && (
          <div className="stat-card" style={{ "--accent":"#a78bfa" }}>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
              marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Annual dividends</p>
            <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
              color:"#a78bfa", marginBottom:4 }}>
              ${Math.round(annualDivIncome).toLocaleString()}
            </p>
            {account === "TFSA" && whtEstimate > 1 ? (
              <p style={{ fontSize:9, color:"#f97316" }}>−${Math.round(whtEstimate)} WHT/yr</p>
            ) : (
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>estimated/yr</p>
            )}
          </div>
        )}

        {/* After deploy */}
        <div className="stat-card" style={{ "--accent":"#7c3aed" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>After deploy</p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color:"#c4b5fd", marginBottom:4 }}>
            ${Math.round(newTotal).toLocaleString()}
          </p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>portfolio + cash</p>
        </div>

        {/* To buy */}
        <div className="stat-card" style={{ "--accent":"#22d3ee" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>To buy</p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color:"#22d3ee", marginBottom:4 }}>
            ${Math.round(totalBuys).toLocaleString()}
          </p>
          <p style={{ fontSize:9, color: isCashConstrained ? "#f97316" : "rgba(255,255,255,0.22)" }}>
            {isCashConstrained ? "scaled to cash" : "at target weights"}
          </p>
        </div>

        {/* Cash remaining / To sell */}
        <div className="stat-card" style={{
          "--accent": rebalMode==="full" ? "#f43f5e" : cashRemaining > 0 ? "#34d399" : "#475569"
        }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>
            {rebalMode === "full" ? "To sell" : "Cash remaining"}
          </p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color: rebalMode==="full" ? "#f43f5e" : cashRemaining > 0 ? "#34d399" : "#475569",
            marginBottom:4 }}>
            ${Math.round(rebalMode === "full" ? totalSells : cashRemaining).toLocaleString()}
          </p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>
            {rebalMode === "full" ? "overweight positions" : "after all buys"}
          </p>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding:"20px 28px 0", display:"flex", gap:6, flexWrap:"wrap",
        borderBottom:"1px solid rgba(255,255,255,0.05)", paddingBottom:0 }}>
        {[["rebalance","⚖️ Rebalance"],["dca","📅 DCA Plan"],["targets","🎯 Edit Targets"],
          ["recommend","💡 Ideas"],["search","🔍 Search"]].map(([v,l]) => (
          <button key={v} className={`tab-btn ${tab===v?"on":""}`}
            onClick={() => setTab(v)}
            style={{ borderBottom:"none", borderRadius:"8px 8px 0 0", marginBottom:0,
              paddingBottom:10 }}>
            {l}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB: REBALANCE
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "rebalance" && (
        <div style={{ padding:"22px 28px" }}>
          <div className="card" style={{ marginBottom:16, display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ flex:"1 1 220px" }}>
              <p className="sec">Cash available to deploy ({account})</p>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20, color:"rgba(255,255,255,0.4)" }}>$</span>
                <input type="number" value={cash || ""} onChange={e => handleCash(e.target.value)}
                  placeholder="0" style={{ fontSize:22, fontWeight:500, color:"#34d399", maxWidth:200 }}/>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>CAD</span>
              </div>
            </div>
            <div style={{ flex:"1 1 240px" }}>
              <p className="sec">Quick add</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[500,1000,2500,5000,7000,10000].map(v => (
                  <button key={v} className="btn" onClick={() => handleCash(cash + v)}>+${v.toLocaleString()}</button>
                ))}
              </div>
            </div>
            <div style={{ flex:"0 0 auto" }}>
              <p className="sec">Mode</p>
              <div style={{ display:"flex", gap:6 }}>
                <button className={`tab-btn ${rebalMode==="cash"?"on":""}`}
                  onClick={() => setRebalMode("cash")} style={{ fontSize:11, padding:"5px 12px" }}>
                  Cash-only
                </button>
                <button className={`tab-btn ${rebalMode==="full"?"on":""}`}
                  onClick={() => setRebalMode("full")} style={{ fontSize:11, padding:"5px 12px" }}>
                  Full rebalance
                </button>
              </div>
            </div>
            <div style={{ flex:"0 0 170px" }}>
              <p className="sec">Contribution limits (2026)</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>TFSA: $7,000/yr</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>RRSP: $32,490/yr</p>
            </div>
          </div>

          {isCashConstrained && (
            <div className="warn">
              ⚠ Buys scaled to cash: optimal deploy is ${Math.round(rawBuyTotal).toLocaleString()} but
              only ${Math.round(cash).toLocaleString()} available — each position scaled to {(scaleFactor*100).toFixed(0)}% of optimal.
            </div>
          )}

          {/* ── WHT sell recommendations ───────────────────────────────── */}
          {whtSellRecs.length > 0 && (
            <div style={{ marginBottom:22 }}>
              <div className="action-divider">
                <div className="action-divider-bar" style={{ height:20, background:"#fb923c" }}/>
                <p className="sec" style={{ marginBottom:0, color:"#fb923c" }}>
                  WHT Alert — {whtSellRecs.length} position{whtSellRecs.length>1?"s":""} bleeding
                  ~${Math.round(whtSellRecs.reduce((s,h)=>s+h.annualWHT,0)).toLocaleString()}/yr to IRS withholding in {account}
                </p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {whtSellRecs.map(h => (
                  <div key={h.ticker} className="action-card" style={{
                    background:"rgba(251,146,60,0.04)",
                    border:"1px solid rgba(251,146,60,0.18)",
                    borderLeft:"3px solid #fb923c",
                    borderRadius:10, padding:"14px 18px",
                    display:"flex", gap:20, flexWrap:"wrap", alignItems:"center"
                  }}>
                    {/* Ticker */}
                    <div style={{ minWidth:90 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                        <span style={{ fontSize:16, fontFamily:"'JetBrains Mono',monospace",
                          fontWeight:700, color:"#fb923c" }}>{h.ticker}</span>
                        {h.priority && (
                          <span style={{ fontSize:9, padding:"1px 6px", borderRadius:3,
                            background:"rgba(239,68,68,0.15)", color:"#ef4444",
                            border:"1px solid rgba(239,68,68,0.3)", fontWeight:700,
                            letterSpacing:"0.05em" }}>PRIORITY</span>
                        )}
                      </div>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{h.name}</p>
                    </div>

                    {/* Reason */}
                    <div style={{ flex:"1 1 260px" }}>
                      <div style={{ marginBottom:7 }}>
                        <span style={{ fontSize:11, padding:"3px 10px", borderRadius:4,
                          background:"rgba(239,68,68,0.1)", color:"#ef4444",
                          border:"1px solid rgba(239,68,68,0.22)",
                          fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>
                          ▼ SELL · MOVE TO RRSP
                        </span>
                      </div>
                      <p style={{ fontSize:12, color:"rgba(255,255,255,0.65)", lineHeight:1.65 }}>
                        <span style={{ color:"#ef4444", fontWeight:700 }}>
                          ~${Math.round(h.annualWHT).toLocaleString()}/yr
                        </span>{" "}
                        lost to IRS — 15% withholding × {h.divYield}% yield × ${Math.round(h.current).toLocaleString()} position value
                      </p>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.38)", marginTop:5 }}>
                        Moving to RRSP recovers this permanently under Canada-US Tax Treaty (Article XXI).
                        RRSP exempts US dividends from the 15% withholding that TFSA does not.
                      </p>
                    </div>

                    {/* Math breakdown */}
                    <div style={{ textAlign:"right", minWidth:120,
                      borderLeft:"1px solid rgba(255,255,255,0.06)", paddingLeft:16 }}>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:4 }}>Annual dividend</p>
                      <p style={{ fontSize:17, fontFamily:"'JetBrains Mono',monospace",
                        fontWeight:700, color:"#a78bfa" }}>
                        ${Math.round(h.annualDiv).toLocaleString()}
                      </p>
                      <div style={{ marginTop:6, borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:6 }}>
                        <p style={{ fontSize:10, color:"#ef4444" }}>
                          − ${Math.round(h.annualWHT).toLocaleString()} kept by IRS
                        </p>
                        <p style={{ fontSize:10, color:"#34d399", marginTop:3 }}>
                          = ${Math.round(h.annualDiv - h.annualWHT).toLocaleString()} you receive
                        </p>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:4 }}>
                          {h.divYield}% yield → effective {(h.divYield * 0.85).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.22)", paddingLeft:4 }}>
                  Total WHT drag: ~${Math.round(whtSellRecs.reduce((s,h)=>s+h.annualWHT,0)).toLocaleString()}/yr ·
                  This compounds against you every year the positions stay in {account}
                </p>
              </div>
            </div>
          )}

          {/* ── Buy recommendations ────────────────────────────────────── */}
          {enrichedBuys.length > 0 && (
            <div style={{ marginBottom:22 }}>
              <div className="action-divider">
                <div className="action-divider-bar" style={{ height:20, background:"#22d3ee" }}/>
                <p className="sec" style={{ marginBottom:0, color:"#22d3ee" }}>
                  Buy plan — ${Math.round(totalBuys).toLocaleString()} across {enrichedBuys.length} position{enrichedBuys.length>1?"s":""}
                  {isCashConstrained ? ` · scaled to $${Math.round(cash).toLocaleString()} cash` : ""}
                </p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {enrichedBuys.map((h, rank) => (
                  <div key={h.ticker} className="action-card" style={{
                    background:"rgba(34,211,238,0.025)",
                    border:"1px solid rgba(34,211,238,0.1)",
                    borderLeft:"3px solid #22d3ee",
                    borderRadius:10, padding:"14px 18px",
                    display:"flex", gap:20, flexWrap:"wrap", alignItems:"center"
                  }}>
                    {/* Rank + Ticker */}
                    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:115 }}>
                      <span style={{ fontSize:17, fontFamily:"'JetBrains Mono',monospace",
                        color:"rgba(255,255,255,0.1)", fontWeight:700, minWidth:22, textAlign:"right" }}>
                        {rank + 1}
                      </span>
                      <div>
                        <p style={{ fontSize:16, fontFamily:"'JetBrains Mono',monospace",
                          fontWeight:700, color:"#22d3ee" }}>{h.ticker}</p>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{h.name}</p>
                      </div>
                    </div>

                    {/* Reasons */}
                    <div style={{ flex:"1 1 260px" }}>
                      {h.reasons.map((r, i) => (
                        <p key={i} style={{
                          fontSize: i===0 ? 12 : 11,
                          color: i===0 ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.4)",
                          fontWeight: i===0 ? 500 : 400,
                          lineHeight:1.65, marginTop: i===0 ? 0 : 4
                        }}>
                          {i > 0 && <span style={{ opacity:0.4, marginRight:5 }}>↳</span>}{r}
                        </p>
                      ))}
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign:"right", minWidth:120,
                      borderLeft:"1px solid rgba(255,255,255,0.06)", paddingLeft:16 }}>
                      <span style={{ fontSize:10, padding:"2px 10px", borderRadius:4,
                        background:"rgba(34,211,238,0.1)", color:"#22d3ee",
                        border:"1px solid rgba(34,211,238,0.22)",
                        fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                        display:"block", marginBottom:7, textAlign:"center" }}>
                        ▲ BUY
                      </span>
                      <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace",
                        fontWeight:700, color:"#22d3ee" }}>
                        ${Math.round(h.delta).toLocaleString()}
                      </p>
                      {isCashConstrained && Math.round(h.rawDelta) !== Math.round(h.delta) && (
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:3 }}>
                          full: ${Math.round(h.rawDelta).toLocaleString()}
                        </p>
                      )}
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:4 }}>
                        {h.currentPct.toFixed(1)}% → {h.target}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Full breakdown table ───────────────────────────────────── */}
          <p className="sec" style={{ marginBottom:8 }}>Full breakdown — {account}</p>
          <div className="card" style={{ padding:0, overflow:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:980 }}>
              <thead>
                <tr>
                  <th className="th">Ticker</th>
                  <th className="th">Status</th>
                  <th className="th" style={{ textAlign:"right" }}>Current $</th>
                  <th className="th" style={{ textAlign:"right" }}>P&amp;L</th>
                  <th className="th" style={{ textAlign:"right" }}>Current %</th>
                  <th className="th" style={{ textAlign:"right" }}>Target %</th>
                  <th className="th" style={{ textAlign:"right" }}>Target $</th>
                  <th className="th" style={{ textAlign:"right" }}>Action</th>
                  <th className="th">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {rebalance.map(h => {
                  const action    = Math.abs(h.delta) < 5 ? "hold" : h.delta > 0 ? "buy" : "sell";
                  const cb        = h.costBasis || 0;
                  const posPnl    = cb > 0 ? h.current - cb : null;
                  const posPnlPct = cb > 0 ? ((h.current - cb) / cb) * 100 : null;
                  return (
                    <tr key={h.ticker}
                      className={action==="buy" ? "buy-row" : action==="sell" ? "sell-row" : ""}>
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
                      <td className="td" style={{ textAlign:"right" }}>
                        {posPnl !== null ? (
                          <div>
                            <span style={{ color: posPnl >= 0 ? "#34d399" : "#ef4444" }}>
                              {posPnl >= 0 ? "+" : ""}${Math.round(posPnl).toLocaleString()}
                            </span>
                            <div style={{ fontSize:10, color: posPnl >= 0 ? "#34d399" : "#ef4444", opacity:0.75 }}>
                              {posPnlPct >= 0 ? "+" : ""}{posPnlPct.toFixed(1)}%
                            </div>
                          </div>
                        ) : <span style={{ color:"rgba(255,255,255,0.2)", fontSize:11 }}>—</span>}
                      </td>
                      <td className="td" style={{ textAlign:"right", color:"rgba(255,255,255,0.5)" }}>{h.currentPct.toFixed(1)}%</td>
                      <td className="td" style={{ textAlign:"right", color:accentColor }}>{h.target}%</td>
                      <td className="td" style={{ textAlign:"right" }}>${Math.round(h.targetDollar).toLocaleString()}</td>
                      <td className="td" style={{ textAlign:"right" }}>
                        {action==="buy"  && <span style={{ color:"#22d3ee" }}>▲ BUY ${Math.round(h.delta).toLocaleString()}</span>}
                        {action==="sell" && <span style={{ color:"#ef4444" }}>▼ SELL ${Math.round(Math.abs(h.delta)).toLocaleString()}</span>}
                        {action==="hold" && <span style={{ color:"#94a3b8" }}>● HOLD</span>}
                        {rebalMode === "cash" && h.rawDelta < 0 && (
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)", marginTop:2 }}>overweight</div>
                        )}
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
        <div style={{ padding:"22px 28px" }}>
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ flex:"1 1 280px" }}>
                <p className="sec">Spread buying over weeks (DCA)</p>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <input type="range" min={4} max={26} value={dcaWeeks}
                    onChange={e => setDcaWeeks(Number(e.target.value))}/>
                  <span style={{ fontSize:18, fontWeight:500, color:accentColor,
                    fontFamily:"'JetBrains Mono',monospace", minWidth:100 }}>
                    {dcaWeeks} weeks
                  </span>
                </div>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:6 }}>
                  ≈ {(dcaWeeks/4).toFixed(1)} months · ${Math.round(weeklyTotalBuy).toLocaleString()}/wk
                </p>
              </div>
              <div style={{ flex:"0 0 180px", textAlign:"center" }}>
                <p className="sec">Weekly spend</p>
                <p style={{ fontSize:24, fontWeight:500, color:"#22d3ee", fontFamily:"'JetBrains Mono',monospace" }}>
                  ${Math.round(weeklyTotalBuy).toLocaleString()}
                </p>
              </div>
              <div style={{ flex:"0 0 180px", textAlign:"center" }}>
                <p className="sec">Total to deploy</p>
                <p style={{ fontSize:24, fontWeight:500, color:accentColor, fontFamily:"'JetBrains Mono',monospace" }}>
                  ${Math.round(totalBuys).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {totalBuys === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"40px 20px" }}>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.5)" }}>
                No buys needed — enter cash to deploy in the Rebalance tab
              </p>
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
                      return (
                        <tr key={h.ticker}>
                          <td className="td td-main"><strong style={{ color:accentColor }}>{h.ticker}</strong></td>
                          <td className="td" style={{ color:"rgba(255,255,255,0.5)" }}>{h.name}</td>
                          <td className="td" style={{ textAlign:"right" }}>${Math.round(h.delta).toLocaleString()}</td>
                          <td className="td" style={{ textAlign:"right", color:"#22d3ee", fontWeight:500 }}>${Math.round(weekly).toLocaleString()}</td>
                          <td className="td" style={{ textAlign:"right" }}>{((weekly/weeklyTotalBuy)*100).toFixed(1)}%</td>
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
                        <div key={h.ticker} style={{ display:"flex", justifyContent:"space-between",
                          fontSize:10, padding:"2px 0", fontFamily:"'JetBrains Mono',monospace" }}>
                          <span style={{ color:"rgba(255,255,255,0.5)" }}>{h.ticker}</span>
                          <span style={{ color:"rgba(255,255,255,0.75)" }}>${Math.round(h.delta/dcaWeeks).toLocaleString()}</span>
                        </div>
                      ))}
                      <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:8, paddingTop:6,
                        display:"flex", justifyContent:"space-between" }}>
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
        <div style={{ padding:"22px 28px" }}>
          <p className="sec">Edit holdings, cost basis &amp; targets — {account}</p>
          <div className="card" style={{ padding:0, overflow:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1280 }}>
              <thead>
                <tr>
                  <th className="th">Ticker / Name</th>
                  <th className="th" style={{ width:115 }}>Current $</th>
                  <th className="th" style={{ width:115 }}>Cost Basis $</th>
                  <th className="th" style={{ textAlign:"right", width:120 }}>P&amp;L $</th>
                  <th className="th" style={{ textAlign:"right", width:75 }}>P&amp;L %</th>
                  <th className="th" style={{ width:75 }}>Target %</th>
                  <th className="th" style={{ width:85 }}>CAGR %</th>
                  <th className="th" style={{ textAlign:"right", width:105 }}>10yr</th>
                  <th className="th" style={{ textAlign:"right", width:105 }}>15yr</th>
                  <th className="th" style={{ textAlign:"right", width:105 }}>20yr</th>
                  <th className="th" style={{ width:110 }}></th>
                </tr>
              </thead>
              <tbody>
                {current.map((h, idx) => {
                  const cagr      = h.cagr ?? DEFAULT_CAGR[h.ticker] ?? 10;
                  const cb        = h.costBasis || 0;
                  const posPnl    = cb > 0 ? h.current - cb : null;
                  const posPnlPct = cb > 0 ? ((h.current - cb) / cb) * 100 : null;
                  const proj = yrs => h.current > 0
                    ? `$${Math.round(h.current * Math.pow(1 + cagr/100, yrs)).toLocaleString()}`
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
                        <input type="number" value={cb || ""}
                          placeholder="0"
                          onChange={e => updateHolding(idx, "costBasis", e.target.value)}
                          style={{ color:"#94a3b8" }}/>
                      </td>
                      <td className="td" style={{ textAlign:"right" }}>
                        {posPnl !== null ? (
                          <span style={{ color: posPnl >= 0 ? "#34d399" : "#ef4444", fontWeight:500 }}>
                            {posPnl >= 0 ? "+" : ""}${Math.round(posPnl).toLocaleString()}
                          </span>
                        ) : <span style={{ color:"rgba(255,255,255,0.2)" }}>—</span>}
                      </td>
                      <td className="td" style={{ textAlign:"right" }}>
                        {posPnlPct !== null ? (
                          <span style={{ color: posPnlPct >= 0 ? "#34d399" : "#ef4444", fontSize:11 }}>
                            {posPnlPct >= 0 ? "+" : ""}{posPnlPct.toFixed(1)}%
                          </span>
                        ) : <span style={{ color:"rgba(255,255,255,0.2)" }}>—</span>}
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
                      <td className="td" style={{ textAlign:"right", color:"#34d399" }}>{proj(10)}</td>
                      <td className="td" style={{ textAlign:"right", color:"#22d3ee" }}>{proj(15)}</td>
                      <td className="td" style={{ textAlign:"right", color:accentColor, fontWeight:600 }}>{proj(20)}</td>
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
                            style={{ padding:"3px 8px", fontSize:11 }}>✕</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr style={{ background:"rgba(255,255,255,0.03)" }}>
                  <td className="td td-main"><strong>TOTAL</strong></td>
                  <td className="td" style={{ color:accentColor, fontWeight:500 }}>${Math.round(currentTotal).toLocaleString()}</td>
                  <td className="td" style={{ color:"#94a3b8", fontWeight:500 }}>
                    {totalCostBasis > 0 ? `$${Math.round(totalCostBasis).toLocaleString()}` : "—"}
                  </td>
                  <td className="td" style={{ textAlign:"right", fontWeight:500,
                    color: totalPnL !== null ? (totalPnL >= 0 ? "#34d399" : "#ef4444") : "rgba(255,255,255,0.2)" }}>
                    {totalPnL !== null ? `${totalPnL >= 0 ? "+" : ""}$${Math.round(totalPnL).toLocaleString()}` : "—"}
                  </td>
                  <td className="td" style={{ textAlign:"right", fontWeight:500,
                    color: totalPnLPct !== null ? (totalPnLPct >= 0 ? "#34d399" : "#ef4444") : "rgba(255,255,255,0.2)" }}>
                    {totalPnLPct !== null ? `${totalPnLPct >= 0 ? "+" : ""}${totalPnLPct.toFixed(1)}%` : "—"}
                  </td>
                  <td className="td" style={{ color: Math.abs(targetSum-100) > 0.5 ? "#ef4444" : "#34d399", fontWeight:500 }}>
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
                  <td className="td" style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>
                    {Math.abs(targetSum-100) > 0.5 ? `⚠ off by ${Math.abs(targetSum-100).toFixed(1)}%` : "✓ balanced"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Add ticker */}
          <div style={{ marginTop:12, display:"flex", gap:8 }}>
            <button className={`btn ${addForm ? "btn-primary" : ""}`}
              onClick={() => setAddForm(addForm ? null : { ...BLANK_FORM })}>
              {addForm ? "✕ Cancel" : "+ Add Ticker"}
            </button>
          </div>

          {addForm && (
            <div className="add-form">
              <p className="sec" style={{ marginBottom:14 }}>New position — {account}</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(155px, 1fr))", gap:10, marginBottom:12 }}>
                {[
                  ["Ticker *",      "text",   "ticker",    "e.g. AAPL"],
                  ["Name",          "text",   "name",      "e.g. Apple"],
                  ["Current $",     "number", "current",   "0"],
                  ["Cost Basis $",  "number", "costBasis", "0"],
                  ["Target %",      "number", "target",    "0"],
                  ["Div yield %",   "number", "divYield",  "0.0"],
                  ["Est. CAGR %",   "number", "cagr",      "10"],
                ].map(([label, type, field, ph]) => (
                  <div key={field}>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>{label}</p>
                    <input type={type} value={addForm[field]} placeholder={ph}
                      onChange={e => setAddForm({ ...addForm,
                        [field]: type==="text" ? (field==="ticker" ? e.target.value.toUpperCase() : e.target.value) : e.target.value
                      })}/>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:12 }}>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Notes (optional)</p>
                <input type="text" value={addForm.notes} placeholder="Investment thesis or notes…"
                  onChange={e => setAddForm({ ...addForm, notes: e.target.value })}/>
              </div>
              <button className="btn btn-primary" onClick={addTicker}>+ Add to {account}</button>
            </div>
          )}

          <div style={{ marginTop:14, padding:"12px 14px", background:"rgba(251,191,36,0.05)",
            border:"1px solid rgba(251,191,36,0.15)", borderRadius:8, fontSize:11,
            color:"rgba(251,191,36,0.8)", lineHeight:1.6 }}>
            ⚠ Not financial advice. Data stored in your browser only. Export regularly to back up. Consult a licensed CFP before trading.
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: RECOMMENDATIONS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "recommend" && (
        <div style={{ padding:"22px 28px" }}>

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

      {/* ════════════════════════════════════════════════════════════════════
          TAB: TICKER SEARCH
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "search" && (
        <div style={{ padding:"22px 28px" }}>

          {/* Search bar */}
          <div className="card" style={{ marginBottom:20 }}>
            <p className="sec" style={{ marginBottom:10 }}>Ticker Lookup &amp; Analysis</p>
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value.toUpperCase())}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const q = searchQuery.trim();
                    setSearchResult(q ? (TICKER_DB[q] || { ticker:q, notFound:true }) : null);
                  }
                }}
                placeholder="Type ticker and press Enter — e.g. NVDA, COST, BRK.B…"
                style={{ fontSize:14, flex:"1 1 280px", maxWidth:420 }}
              />
              <button className="btn btn-primary" onClick={() => {
                const q = searchQuery.trim();
                setSearchResult(q ? (TICKER_DB[q] || { ticker:q, notFound:true }) : null);
              }}>Search</button>
              {searchResult && (
                <button className="btn" onClick={() => { setSearchResult(null); setSearchQuery(""); }}>✕ Clear</button>
              )}
            </div>
            <div>
              <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:7 }}>Quick access — curated picks:</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {RECOMMENDATIONS.slice(0, 16).map(r => (
                  <button key={r.ticker} className="btn"
                    onClick={() => { setSearchQuery(r.ticker); setSearchResult(r); }}
                    style={{ padding:"3px 10px", fontSize:11,
                      borderColor: r.bestFor==="TFSA" ? "rgba(251,191,36,0.25)" : "rgba(34,211,238,0.25)",
                      color: r.bestFor==="TFSA" ? "rgba(251,191,36,0.75)" : "rgba(34,211,238,0.75)" }}>
                    {r.ticker}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result: found in curated DB */}
          {searchResult && !searchResult.notFound && (() => {
            const rec = searchResult;
            const cagr = DEFAULT_CAGR[rec.ticker];
            return (
              <div style={{ maxWidth:640 }}>
                <div className="rec-card" style={{ borderColor:`${accentColor}30` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                        <span style={{ fontSize:24, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                          color: rec.bestFor==="TFSA" ? "#fbbf24" : rec.bestFor==="RRSP" ? "#22d3ee" : "#a78bfa" }}>
                          {rec.ticker}
                        </span>
                        <span style={{ fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:4,
                          background: rec.conviction==="High" ? "rgba(52,211,153,0.12)" : "rgba(148,163,184,0.1)",
                          color: rec.conviction==="High" ? "#34d399" : "#94a3b8",
                          border: `1px solid ${rec.conviction==="High" ? "rgba(52,211,153,0.3)" : "rgba(148,163,184,0.2)"}` }}>
                          {rec.conviction} conviction
                        </span>
                      </div>
                      <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginBottom:3 }}>{rec.name}</p>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{rec.sector}</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <span style={{ fontSize:11, padding:"3px 10px", borderRadius:4,
                        background: rec.bestFor==="TFSA" ? "rgba(251,191,36,0.1)" : rec.bestFor==="RRSP" ? "rgba(34,211,238,0.1)" : "rgba(167,139,250,0.1)",
                        color: rec.bestFor==="TFSA" ? "#fbbf24" : rec.bestFor==="RRSP" ? "#22d3ee" : "#a78bfa",
                        border: `1px solid ${rec.bestFor==="TFSA" ? "rgba(251,191,36,0.25)" : rec.bestFor==="RRSP" ? "rgba(34,211,238,0.25)" : "rgba(167,139,250,0.25)"}` }}>
                        Best for {rec.bestFor==="both" ? "TFSA / RRSP" : rec.bestFor}
                      </span>
                      <p style={{ fontSize:11, color: rec.divYield > 0 ? "#a78bfa" : "#34d399", marginTop:6 }}>
                        {rec.divYield > 0 ? `${rec.divYield}% dividend yield` : "No dividend — growth only"}
                      </p>
                      {cagr && <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:3 }}>Est. CAGR: {cagr}%/yr</p>}
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4,
                      background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.4)",
                      border:"1px solid rgba(255,255,255,0.08)" }}>{rec.sector}</span>
                    {rec.tags.map(tag => (
                      <span key={tag} style={{ fontSize:10, padding:"2px 7px", borderRadius:4,
                        background:"rgba(167,139,250,0.06)", color:"rgba(167,139,250,0.6)",
                        border:"1px solid rgba(167,139,250,0.15)" }}>{tag}</span>
                    ))}
                  </div>

                  <div style={{ background:"rgba(255,255,255,0.02)", borderRadius:8, padding:"12px 14px",
                    border:"1px solid rgba(255,255,255,0.05)" }}>
                    <p style={{ fontSize:10, color:`${accentColor}88`, letterSpacing:"0.1em",
                      textTransform:"uppercase", marginBottom:6, fontWeight:500 }}>Investment thesis</p>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.65)", lineHeight:1.7 }}>{rec.thesis}</p>
                  </div>

                  {cagr && (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                      {[10,15,20].map(yrs => (
                        <div key={yrs} style={{ background:"rgba(255,255,255,0.02)", borderRadius:8,
                          padding:"9px 12px", border:"1px solid rgba(255,255,255,0.05)", textAlign:"center" }}>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em",
                            textTransform:"uppercase", marginBottom:5 }}>{yrs}yr @ {cagr}%</p>
                          <p style={{ fontSize:14, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                            color: yrs===10 ? "#34d399" : yrs===15 ? "#22d3ee" : accentColor }}>
                            {Math.pow(1+cagr/100,yrs).toFixed(1)}×
                          </p>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:3 }}>
                            $10K → ${Math.round(10000*Math.pow(1+cagr/100,yrs)/1000)}K
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {portfolios.map(p => {
                      const already = (holdings[p]||[]).some(h => h.ticker === rec.ticker);
                      const col = PORTFOLIO_COLORS[p] ?? EXTRA_COLORS[(portfolios.indexOf(p)-2+EXTRA_COLORS.length)%EXTRA_COLORS.length];
                      return (
                        <button key={p} className="btn"
                          onClick={() => already ? null : addRecommendedTicker(rec, p)}
                          style={{ flex:1, fontSize:11, padding:"7px 10px", opacity: already ? 0.4 : 1,
                            borderColor:`rgba(${col.rgb},0.3)`, color:`rgba(${col.rgb},0.85)`,
                            cursor: already ? "default" : "pointer" }}>
                          {already ? `✓ In ${p}` : `+ Add to ${p}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Result: not in DB */}
          {searchResult && searchResult.notFound && searchResult.ticker && (
            <div className="card" style={{ maxWidth:640 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <span style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:accentColor }}>
                  {searchResult.ticker}
                </span>
                <span style={{ fontSize:11, padding:"3px 10px", borderRadius:4,
                  background:"rgba(148,163,184,0.07)", color:"#64748b",
                  border:"1px solid rgba(148,163,184,0.15)" }}>Not in database</span>
              </div>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.65, marginBottom:14 }}>
                This ticker isn't in our curated database. You can add it manually or get a deep AI analysis
                using the prompt below at <span style={{ color:accentColor }}>claude.ai</span>.
              </p>
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:10, color:`${accentColor}88`, letterSpacing:"0.1em", textTransform:"uppercase",
                  marginBottom:8, fontWeight:500 }}>Copy this prompt for Claude AI:</p>
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                  borderRadius:8, padding:"12px 14px", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:11, color:"rgba(255,255,255,0.55)", lineHeight:1.75, userSelect:"all" }}>
                  Analyze {searchResult.ticker} as a long-term investment for a Canadian investor using
                  registered accounts (TFSA/RRSP). Cover: business model, growth catalysts, key risks,
                  fair value estimate, dividend info, and whether it is better suited for TFSA or RRSP.
                  Include an estimated 5-year CAGR and a conviction rating (High / Medium / Low).
                </div>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {portfolios.map(p => {
                  const col = PORTFOLIO_COLORS[p] ?? EXTRA_COLORS[(portfolios.indexOf(p)-2+EXTRA_COLORS.length)%EXTRA_COLORS.length];
                  return (
                    <button key={p} className="btn"
                      onClick={() => addRecommendedTicker({
                        ticker:searchResult.ticker, name:searchResult.ticker,
                        divYield:0, thesis:"Added via ticker search",
                      }, p)}
                      style={{ fontSize:11, padding:"7px 14px",
                        borderColor:`rgba(${col.rgb},0.3)`, color:`rgba(${col.rgb},0.85)` }}>
                      + Add to {p}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Default: browse all curated tickers */}
          {!searchResult && (
            <>
              <p className="sec" style={{ marginBottom:10 }}>
                Curated database — {RECOMMENDATIONS.length} tickers analyzed
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:8 }}>
                {RECOMMENDATIONS.map(rec => (
                  <button key={rec.ticker}
                    onClick={() => { setSearchQuery(rec.ticker); setSearchResult(rec); }}
                    style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
                      borderRadius:10, padding:"12px 14px", cursor:"pointer", textAlign:"left",
                      display:"flex", alignItems:"center", gap:10, fontFamily:"inherit",
                      transition:"border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.06)"}>
                    <div style={{ minWidth:54 }}>
                      <p style={{ fontSize:14, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
                        color: rec.bestFor==="TFSA" ? "#fbbf24" : "#22d3ee" }}>{rec.ticker}</p>
                      <p style={{ fontSize:9, color: rec.conviction==="High" ? "#34d399" : "#64748b", marginTop:2 }}>
                        {rec.conviction}
                      </p>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", whiteSpace:"nowrap",
                        overflow:"hidden", textOverflow:"ellipsis" }}>{rec.name}</p>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{rec.sector}</p>
                    </div>
                    <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, whiteSpace:"nowrap",
                      background: rec.bestFor==="TFSA" ? "rgba(251,191,36,0.08)" : "rgba(34,211,238,0.08)",
                      color: rec.bestFor==="TFSA" ? "rgba(251,191,36,0.6)" : "rgba(34,211,238,0.6)",
                      border: `1px solid ${rec.bestFor==="TFSA" ? "rgba(251,191,36,0.15)" : "rgba(34,211,238,0.15)"}` }}>
                      {rec.bestFor}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:20, lineHeight:1.5 }}>
            ⚠ Not financial advice. Analysis is for educational purposes only.
            Consult a licensed financial advisor before investing.
          </p>
        </div>
      )}
    </div>
  );
}
