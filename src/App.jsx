import { useState, useEffect } from "react";
import portfolioIdeas from "./data/recommendations.json";
import marketPulseData from "./data/marketPulse.json";
const RECOMMENDATIONS = portfolioIdeas.recommendations;

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
// RECOMMENDATIONS — imported from src/data/recommendations.json (see top)
// To update monthly: edit that JSON file, no changes to this file needed.
// ═══════════════════════════════════════════════════════════════════════════
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
  "oil & gas":      ["SU.TO","SU","CNQ","CVX","XOM","COP","EOG","XEG.TO","CVE","MEG"],
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
  "BRK.B":10, V:14, ISRG:15, NVO:13, ARM:18, AXON:20, COST:12, RTX:12,
  ENB:8, MELI:18, INDA:12, VGK:9, EWJ:8, TLT:5, "ZAG.TO":4, "XRE.TO":9,
  WMT:10, SHOP:15, ACN:12, VIG:11,
  LMT:11, NOC:10, "SU.TO":9, "XEG.TO":8, HII:9,
};

// ═══════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════
const BLANK_FORM = { ticker:"", name:"", current:"", costBasis:"", target:"", divYield:"", cagr:"", currencyOverride:"", notes:"" };
const CONTRIB_FREQUENCY_OPTIONS = [
  { value:"weekly",   label:"Weekly",   periodsPerYear:52, cadenceWeeks:1, shortLabel:"wk" },
  { value:"biweekly", label:"Bi-weekly", periodsPerYear:26, cadenceWeeks:2, shortLabel:"2wk" },
  { value:"monthly",  label:"Monthly",  periodsPerYear:12, cadenceWeeks:4, shortLabel:"mo" },
];
const DEFAULT_CONTRIB_PLAN = { amount:0, frequency:"monthly" };
const CSV_HEADER_ALIASES = {
  ticker: ["ticker", "symbol"],
  name: ["name", "company", "companyname"],
  current: ["current", "current$", "currentvalue", "marketvalue", "value"],
  costBasis: ["costbasis", "cost_basis", "avgcost", "averagecost", "bookvalue", "invested"],
  target: ["target", "target%", "targetpct", "allocation", "weight"],
  divYield: ["divyield", "dividend", "dividendyield", "yield", "yield%"],
  cagr: ["cagr", "growth", "growthrate", "estcagr"],
  currencyOverride: ["currency", "ccy"],
  notes: ["notes", "note", "thesis"],
  account: ["account", "portfolio", "bucket"],
};

// Canadian-listed tickers exempt from US withholding tax
const CAD_EXEMPT = new Set(["CNQ","XIU","VFV.TO","BTCC","GOLD","ZAG.TO","XRE.TO","XEG.TO","XIU.TO","ZCN.TO"]);

function getTickerCurrency(ticker, currencyOverride = "") {
  if (currencyOverride === "CAD" || currencyOverride === "USD") return currencyOverride;
  return (ticker.endsWith(".TO") || CAD_EXEMPT.has(ticker)) ? "CAD" : "USD";
}

function getExchange(ticker, currencyOverride = "") {
  return getTickerCurrency(ticker, currencyOverride) === "CAD" ? "TSX" : "NYSE";
}

function fmtAmt(amount, ticker, currencyOverride = "") {
  const sym = getTickerCurrency(ticker, currencyOverride) === "CAD" ? "C$" : "US$";
  return `${sym}${Math.round(amount).toLocaleString()}`;
}

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

function DonutChart({ segments, size = 110, thickness = 16, centerLabel, centerSub }) {
  const cx = size / 2, cy = size / 2;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let cum = 0;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ display:"block" }}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={thickness}/>
        {segments.filter(s => s.pct > 0.5).map((seg, i) => {
          const dash = (seg.pct / 100) * circ;
          const dashOffset = -(cum / 100) * circ;
          cum += seg.pct;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={thickness - 2}
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
      </svg>
      {(centerLabel !== undefined || centerSub !== undefined) && (
        <div style={{
          position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", textAlign:"center", pointerEvents:"none"
        }}>
          {centerLabel !== undefined && (
            <div style={{ fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
              color:"#f1f5f9", lineHeight:1.2 }}>
              {centerLabel}
            </div>
          )}
          {centerSub !== undefined && (
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.38)", marginTop:2 }}>{centerSub}</div>
          )}
        </div>
      )}
    </div>
  );
}

const PIE_COLORS = [
  "#fbbf24","#22d3ee","#a78bfa","#34d399","#f87171",
  "#60a5fa","#fb923c","#f472b6","#4ade80","#818cf8",
  "#facc15","#2dd4bf","#c084fc","#86efac","#fca5a5","#93c5fd",
];

function PieChart({ slices, size = 150 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 3;
  let cum = -Math.PI / 2;
  const paths = [];
  for (const s of slices.filter(s => s.pct > 0.3)) {
    const angle = (s.pct / 100) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cum);
    const y1 = cy + r * Math.sin(cum);
    cum += angle;
    const x2 = cx + r * Math.cos(cum);
    const y2 = cy + r * Math.sin(cum);
    const d = `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r},0,${angle > Math.PI ? 1 : 0},1,${x2.toFixed(2)},${y2.toFixed(2)} Z`;
    paths.push({ ...s, d });
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ display:"block", flexShrink:0 }}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color}
          stroke="rgba(15,23,42,0.6)" strokeWidth={1.5}/>
      ))}
    </svg>
  );
}

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
  const [contribPlan,      setContribPlan]     = useState({
    TFSA: { ...DEFAULT_CONTRIB_PLAN },
    RRSP: { ...DEFAULT_CONTRIB_PLAN },
  });
  const [usdCadRate,       setUsdCadRate]      = useState(1.38);
  const [targetsFilter,    setTargetsFilter]   = useState("all");
  const [claudeApiKey,     setClaudeApiKey]    = useState(() => localStorage.getItem("pulse:apiKey") || "");
  const [marketPulse,      setMarketPulse]     = useState(() => {
    try { const c = localStorage.getItem("pulse:cache"); return c ? JSON.parse(c) : marketPulseData; } catch { return marketPulseData; }
  });
  const [pulseLoading,     setPulseLoading]    = useState(false);
  const [pulseError,       setPulseError]      = useState(null);
  const [pulseRefreshedAt, setPulseRefreshedAt]= useState(() => localStorage.getItem("pulse:refreshedAt") || null);
  const [pulseCopyLoading, setPulseCopyLoading]= useState(false);
  const [pulseCopied,      setPulseCopied]     = useState(false);
  const [pulsePasteOpen,   setPulsePasteOpen]  = useState(false);
  const [pulsePasteText,   setPulsePasteText]  = useState("");
  const [pulsePasteError,  setPulsePasteError] = useState(null);
  const [pulseApplyDone,   setPulseApplyDone]  = useState(false);

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
      const contribData = localStorage.getItem("portfolio:contrib");
      if (contribData) {
        const rawContrib = JSON.parse(contribData);
        const nextContrib = Object.fromEntries(pList.map(p => {
          const existing = rawContrib?.[p];
          if (existing && typeof existing === "object" && !Array.isArray(existing)) {
            const freq = CONTRIB_FREQUENCY_OPTIONS.some(o => o.value === existing.frequency)
              ? existing.frequency
              : "monthly";
            return [p, { amount: Number(existing.amount) || 0, frequency: freq }];
          }
          // Backward-compat for old saves where value was monthly number
          return [p, { amount: Number(existing) || 0, frequency: "monthly" }];
        }));
        setContribPlan(nextContrib);
      }
      const fxData = localStorage.getItem("portfolio:fxRate");
      if (fxData) setUsdCadRate(Number(fxData) || 1.38);
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

  function persistContrib(next) {
    localStorage.setItem("portfolio:contrib", JSON.stringify(next));
  }

  function persistFxRate(rate) {
    localStorage.setItem("portfolio:fxRate", String(rate));
  }

  function handleContribAmount(val) {
    const next = {
      ...contribPlan,
      [account]: { ...(contribPlan[account] || DEFAULT_CONTRIB_PLAN), amount: Number(val) || 0 },
    };
    setContribPlan(next);
    persistContrib(next);
  }

  function handleContribFrequency(freq) {
    const validFreq = CONTRIB_FREQUENCY_OPTIONS.some(o => o.value === freq) ? freq : "monthly";
    const next = {
      ...contribPlan,
      [account]: { ...(contribPlan[account] || DEFAULT_CONTRIB_PLAN), frequency: validFreq },
    };
    setContribPlan(next);
    persistContrib(next);
  }

  // ── Holdings mutations ─────────────────────────────────────────────────
  function updateHolding(idx, field, value) {
    const next = { ...holdings };
    next[account] = [...next[account]];
    next[account][idx] = {
      ...next[account][idx],
      [field]: field === "currencyOverride" ? value : (Number(value) || 0),
    };
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
      currencyOverride: addForm.currencyOverride || "",
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
      currencyOverride: "",
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
    const nextContrib = { ...contribPlan, [clean]: { ...DEFAULT_CONTRIB_PLAN } };
    setContribPlan(nextContrib);
    persistContrib(nextContrib);
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
    const nextContrib = { ...contribPlan };
    delete nextContrib[pName];
    setContribPlan(nextContrib);
    persistContrib(nextContrib);
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
    const data = JSON.stringify({ holdings, cashHolding, contribPlan, portfolios }, null, 2);
    const blob = new Blob([data], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function normalizeCsvHeader(header = "") {
    return header.trim().toLowerCase().replace(/[\s_-]/g, "");
  }

  function parseCsvLine(line) {
    const cells = [];
    let curr = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "\"") {
        if (inQuotes && line[i + 1] === "\"") {
          curr += "\"";
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(curr.trim());
        curr = "";
      } else {
        curr += ch;
      }
    }
    cells.push(curr.trim());
    return cells;
  }

  function parseCsvText(csvText) {
    const lines = csvText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length < 2) throw new Error("CSV must include a header and at least one data row");

    const headers = parseCsvLine(lines[0]).map(normalizeCsvHeader);
    const headerIdx = Object.fromEntries(headers.map((h, i) => [h, i]));
    const fieldIdx = {};
    for (const [field, aliases] of Object.entries(CSV_HEADER_ALIASES)) {
      const found = aliases.find(a => headerIdx[normalizeCsvHeader(a)] !== undefined);
      if (found) fieldIdx[field] = headerIdx[normalizeCsvHeader(found)];
    }

    if (fieldIdx.ticker === undefined) {
      throw new Error("Missing required column: ticker");
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]);
      const get = (field) => {
        const idx = fieldIdx[field];
        return idx === undefined ? "" : (cells[idx] ?? "").trim();
      };
      const ticker = get("ticker").toUpperCase();
      if (!ticker) continue;

      const accountRaw = get("account").toUpperCase();
      const sanitizedAccount = accountRaw
        ? accountRaw.replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "").slice(0, 20)
        : account;
      const currencyRaw = get("currencyOverride").toUpperCase();
      rows.push({
        account: sanitizedAccount || account,
        ticker,
        name: get("name") || ticker,
        current: Number(get("current")) || 0,
        costBasis: Number(get("costBasis")) || 0,
        target: Number(get("target")) || 0,
        divYield: Number(get("divYield")) || 0,
        cagr: Number(get("cagr")) || DEFAULT_CAGR[ticker] || 10,
        currencyOverride: currencyRaw === "USD" || currencyRaw === "CAD" ? currencyRaw : "",
        notes: get("notes"),
        locked: "✅ Keep",
      });
    }
    if (!rows.length) throw new Error("No valid rows found in CSV");
    return rows;
  }

  function applyCsvImport(rows) {
    const csvAccounts = [...new Set(rows.map(r => r.account).filter(Boolean))];
    const basePortfolios = [...portfolios];
    const nextPortfolios = [...new Set([...basePortfolios, ...csvAccounts])];
    const nextHoldings = { ...holdings };
    const nextCash = { ...cashHolding };
    const nextContrib = { ...contribPlan };

    for (const p of nextPortfolios) {
      if (!nextHoldings[p]) nextHoldings[p] = [];
      if (nextCash[p] === undefined) nextCash[p] = 0;
      if (!nextContrib[p]) nextContrib[p] = { ...DEFAULT_CONTRIB_PLAN };
    }

    for (const p of csvAccounts) {
      nextHoldings[p] = rows.filter(r => r.account === p).map(({ account: _a, ...rest }) => rest);
    }

    setPortfolios(nextPortfolios);
    localStorage.setItem("portfolio:list", JSON.stringify(nextPortfolios));
    setHoldings(nextHoldings);
    for (const p of csvAccounts) persist(p, nextHoldings[p]);
    setCashHolding(nextCash);
    persistCash(nextCash);
    setContribPlan(nextContrib);
    persistContrib(nextContrib);
    if (csvAccounts.length) setAccount(csvAccounts[0]);
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = String(e.target.result || "");
        const ext = (file.name.split(".").pop() || "").toLowerCase();

        if (ext === "csv") {
          const rows = parseCsvText(text);
          applyCsvImport(rows);
          alert(`✅ Imported ${rows.length} holding${rows.length === 1 ? "" : "s"} from CSV.`);
          event.target.value = "";
          return;
        }

        const data = JSON.parse(text);
        const h = data.holdings || data;
        if (!(h.TFSA && h.RRSP)) throw new Error("Invalid JSON format");
        const pList = data.portfolios || ["TFSA","RRSP"];
        setPortfolios(pList);
        localStorage.setItem("portfolio:list", JSON.stringify(pList));
        setHoldings(h);
        for (const p of pList) { if (h[p]) persist(p, h[p]); }
        if (data.cashHolding) { setCashHolding(data.cashHolding); persistCash(data.cashHolding); }
        if (data.contribPlan) {
          const nextContrib = Object.fromEntries(pList.map(p => {
            const existing = data.contribPlan?.[p];
            const freq = CONTRIB_FREQUENCY_OPTIONS.some(o => o.value === existing?.frequency)
              ? existing.frequency
              : "monthly";
            return [p, { amount: Number(existing?.amount) || 0, frequency: freq }];
          }));
          setContribPlan(nextContrib);
          persistContrib(nextContrib);
        } else if (data.monthlyContrib) {
          // Backward-compatible import support
          const nextContrib = Object.fromEntries(pList.map(p => [
            p,
            { amount: Number(data.monthlyContrib[p]) || 0, frequency:"monthly" },
          ]));
          setContribPlan(nextContrib);
          persistContrib(nextContrib);
        }
        alert("✅ Portfolio imported successfully!");
      } catch (err) {
        alert(`⚠ Import failed: ${err?.message || "Could not read file"}`);
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  // ── FX helpers (close over usdCadRate state) ───────────────────────────
  const toCAD = (amount, ticker, currencyOverride = "") =>
    getTickerCurrency(ticker, currencyOverride) === "USD" ? amount * usdCadRate : amount;
  const fromCAD = (cadAmount, ticker, currencyOverride = "") =>
    getTickerCurrency(ticker, currencyOverride) === "USD" && usdCadRate > 0 ? cadAmount / usdCadRate : cadAmount;

  // ── Derived values ─────────────────────────────────────────────────────
  const current       = holdings[account];
  // All aggregate values in CAD — USD positions converted via usdCadRate
  const currentTotal  = current.reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride), 0);
  const cash          = cashHolding[account] || 0;   // cash is always CAD
  const newTotal      = currentTotal + cash;

  // P&L in CAD (costBasis entered in native currency, converted here)
  const totalCostBasis = current.reduce((s, h) => s + toCAD(h.costBasis || 0, h.ticker, h.currencyOverride), 0);
  const totalPnL       = totalCostBasis > 0 ? currentTotal - totalCostBasis : null;
  const totalPnLPct    = totalCostBasis > 0 ? ((currentTotal - totalCostBasis) / totalCostBasis) * 100 : null;

  // Annual dividend income + TFSA withholding tax — in CAD
  const annualDivIncome = current.reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride) * (h.divYield || 0) / 100, 0);
  const whtEstimate     = account === "TFSA"
    ? current.filter(h => !CAD_EXEMPT.has(h.ticker))
              .reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride) * (h.divYield || 0) / 100 * 0.15, 0)
    : 0;

  // Cash-constrained rebalance — all deltas in CAD
  const rawItems = current.map(h => {
    const currentDollarCAD = toCAD(h.current, h.ticker, h.currencyOverride);
    const targetDollar     = newTotal * h.target / 100;     // CAD
    const rawDelta         = targetDollar - currentDollarCAD; // CAD
    return { ...h,
      currentDollar:       currentDollarCAD,
      currentDollarNative: h.current,
      targetDollar,
      rawDelta,
      currentPct: currentTotal > 0 ? (currentDollarCAD / currentTotal) * 100 : 0,
    };
  });
  const rawBuyTotal    = rawItems.filter(r => r.rawDelta > 0).reduce((s, r) => s + r.rawDelta, 0);
  const scaleFactor    = rebalMode === "cash" && cash > 0 && rawBuyTotal > cash ? cash / rawBuyTotal : 1;
  const isCashConstrained = scaleFactor < 1;

  const rebalance = rawItems.map(r => {
    const delta = rebalMode === "cash"
      ? (r.rawDelta > 0 ? r.rawDelta * scaleFactor : 0)
      : r.rawDelta;
    return {
      ...r,
      delta,                             // CAD
      deltaNative: fromCAD(delta, r.ticker, r.currencyOverride),  // native currency (USD or CAD)
      rawDeltaNative: fromCAD(r.rawDelta, r.ticker, r.currencyOverride),
    };
  });

  const totalBuys      = rebalance.filter(r => r.delta > 0).reduce((s, r) => s + r.delta, 0);
  const totalSells     = rebalance.filter(r => r.delta < 0).reduce((s, r) => s + Math.abs(r.delta), 0);
  const cashRemaining  = Math.max(cash - totalBuys, 0);
  const buyList        = rebalance.filter(r => r.delta > 0);
  const accountContribPlan = contribPlan[account] || DEFAULT_CONTRIB_PLAN;
  const contribAmount       = Number(accountContribPlan.amount) || 0;
  const contribFrequency    = CONTRIB_FREQUENCY_OPTIONS.some(o => o.value === accountContribPlan.frequency)
    ? accountContribPlan.frequency
    : "monthly";
  const contribFrequencyMeta = CONTRIB_FREQUENCY_OPTIONS.find(o => o.value === contribFrequency) || CONTRIB_FREQUENCY_OPTIONS[2];
  const annualContrib       = contribAmount * contribFrequencyMeta.periodsPerYear;
  const monthlyContribEq    = annualContrib / 12;
  const dcaPeriods          = Math.max(1, Math.ceil(dcaWeeks / contribFrequencyMeta.cadenceWeeks));
  const perPeriodTotalBuy   = totalBuys / dcaPeriods;
  // Split by currency — USD shown in native USD, CAD in native CAD
  const totalBuysCAD   = buyList.filter(r => getTickerCurrency(r.ticker, r.currencyOverride) === "CAD").reduce((s, r) => s + r.delta, 0);
  const totalBuysUSD   = buyList.filter(r => getTickerCurrency(r.ticker, r.currencyOverride) === "USD").reduce((s, r) => s + r.deltaNative, 0);
  const perPeriodUSD   = totalBuysUSD / dcaPeriods;  // native USD
  const perPeriodCAD   = totalBuysCAD / dcaPeriods;  // native CAD
  const maxAlloc       = Math.max(...current.map(h => Math.max(h.target, (toCAD(h.current, h.ticker, h.currencyOverride) / Math.max(currentTotal, 1)) * 100)), 1);

  // Concentration warnings (>20% of current portfolio) — compare in CAD
  const concentrationWarnings = current.filter(h =>
    currentTotal > 0 && (toCAD(h.current, h.ticker, h.currencyOverride) / currentTotal) * 100 > 20
  );

  // WHT sell recommendations — TFSA positions losing ≥$20/yr to IRS withholding (in CAD)
  const whtSellRecs = account === "TFSA"
    ? current
        .filter(h => {
          const whtCAD = toCAD(h.current, h.ticker, h.currencyOverride) * (h.divYield || 0) / 100 * 0.15;
          return !CAD_EXEMPT.has(h.ticker) && (h.divYield || 0) >= 3 && whtCAD > 0;
        })
        .map(h => ({
          ...h,
          annualDiv: toCAD(h.current, h.ticker, h.currencyOverride) * h.divYield / 100,
          annualWHT: toCAD(h.current, h.ticker, h.currencyOverride) * h.divYield / 100 * 0.15,
          priority:  toCAD(h.current, h.ticker, h.currencyOverride) * h.divYield / 100 * 0.15 >= 80,
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
          reasons.push(`⚠ US dividend attracts 15% IRS withholding in TFSA (~C$${Math.round(toCAD(r.current,r.ticker)*(r.divYield||0)/100*0.15)}/yr drag) — consider RRSP`);
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
  const filteredCurrent = (targetsFilter === "manual"
    ? current.filter(h => !!h.currencyOverride)
    : current
  ).map((h, idx) => ({ h, idx: current.indexOf(h) }));

  // ── Market Pulse — live data fetch ────────────────────────────────────
  async function fetchLiveSignals() {
    const live = {};
    const tryFetch = async (url, timeout = 5000) => {
      const r = await fetch(url, { signal: AbortSignal.timeout(timeout) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    };

    await Promise.allSettled([
      tryFetch("https://api.alternative.me/fng/?limit=1").then(d => {
        live.fearGreedValue = Number(d.data[0].value);
        live.fearGreedLabel = d.data[0].value_classification;
      }),
      tryFetch("https://open.er-api.com/v6/latest/USD").then(d => {
        live.usdCad = d.rates?.CAD;
      }),
      ...[
        ["sp500",        "^GSPC"],
        ["tsx",          "^GSPTSE"],
        ["vix",          "^VIX"],
        ["gold",         "GC=F"],
        ["oil",          "CL=F"],
        ["treasury10y",  "^TNX"],
      ].map(([key, sym]) =>
        tryFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`, 6000)
          .then(d => {
            const closes = d.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
            const last = closes?.filter(Boolean).pop();
            if (last) live[key] = last;
          })
      ),
    ]);
    return live;
  }

  function buildMarketPulsePrompt(live) {
    const today = new Date().toISOString().split("T")[0];
    const monthLabel = new Date().toLocaleString("default", { month: "long", year: "numeric" });
    const threeMonths = new Date(); threeMonths.setMonth(threeMonths.getMonth() + 3);
    const sixMonths   = new Date(); sixMonths.setMonth(sixMonths.getMonth() + 6);
    const fmt3 = threeMonths.toLocaleString("default", { month: "short", year: "numeric" });
    const fmt6 = sixMonths.toLocaleString("default",   { month: "short", year: "numeric" });

    const lines = [];
    if (live.fearGreedValue != null) lines.push(`- CNN Fear & Greed Index: ${live.fearGreedValue}/100 (${live.fearGreedLabel})`);
    if (live.usdCad)       lines.push(`- USD/CAD: ${live.usdCad.toFixed(4)}`);
    if (live.sp500)        lines.push(`- S&P 500: ${live.sp500.toFixed(0)}`);
    if (live.tsx)          lines.push(`- TSX Composite: ${live.tsx.toFixed(0)}`);
    if (live.vix)          lines.push(`- VIX: ${live.vix.toFixed(1)}`);
    if (live.gold)         lines.push(`- Gold (front-month futures): $${live.gold.toFixed(0)}/oz`);
    if (live.oil)          lines.push(`- WTI Crude (front-month futures): $${live.oil.toFixed(1)}/barrel`);
    if (live.treasury10y)  lines.push(`- 10Y US Treasury yield: ${live.treasury10y.toFixed(2)}%`);

    return `You are a senior macro analyst writing a monthly market pulse briefing for a Canadian investor managing a TFSA and RRSP portfolio.

Today's date: ${today}
3-month target period: ${fmt3}
6-month target period: ${fmt6}

Live market data fetched right now:
${lines.length ? lines.join("\n") : "(fetch failed — use your best current knowledge)"}

Using the live data as your anchor, apply your macro knowledge to fill in anything not directly measured above: Fed/BoC policy stance, yield curve shape, CPI trend, unemployment, sector rotation, geopolitical context, earnings revisions, sentiment indicators. Weight the live numbers heavily; they override your training data.

Generate a complete market pulse JSON for ${monthLabel}. Return the JSON inside a single \`\`\`json code block. No explanation before or after the code block — only the code block.

Required schema (fill every field; scenario probabilities within each outlook must sum to exactly 100):

{
  "lastUpdated": "${today}",
  "period": "${monthLabel}",
  "regime": {
    "label": "short label e.g. Cautious Bull",
    "sublabel": "short sub-label e.g. Recovery Mode",
    "color": "#22c55e or #fbbf24 or #ef4444",
    "description": "2-3 sentences on the current macro environment",
    "score": 0-100
  },
  "riskMeter": {
    "score": 0-100,
    "label": "e.g. Mildly Risk-Off",
    "sublabel": "one sentence context",
    "color": "#hex"
  },
  "macroSignals": [
    { "category": "Equities",     "icon": "📈", "signals": [
        { "label": "S&P 500",       "value": "~X,XXX", "trend": "up|down|sideways", "status": "bullish|bearish|caution|neutral", "note": "one line" },
        { "label": "TSX Composite", "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "VIX",           "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Nasdaq / Tech", "value": "...", "trend": "...", "status": "...", "note": "..." }
    ]},
    { "category": "Rates & Bonds", "icon": "🏦", "signals": [
        { "label": "Fed Funds Rate",      "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "10Y US Treasury",     "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Yield Curve (2s10s)", "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "BoC Rate",            "value": "...", "trend": "...", "status": "...", "note": "..." }
    ]},
    { "category": "Macro", "icon": "🌐", "signals": [
        { "label": "US CPI (YoY)",    "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "US Unemployment", "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Oil (WTI)",       "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Gold",            "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "USD/CAD",         "value": "...", "trend": "...", "status": "...", "note": "..." }
    ]},
    { "category": "Sentiment", "icon": "🧠", "signals": [
        { "label": "Fear & Greed",       "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "AAII Bull/Bear",     "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Put/Call Ratio",     "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Earnings Revisions", "value": "...", "trend": "...", "status": "...", "note": "..." }
    ]}
  ],
  "outlooks": [
    {
      "horizon": "3 months", "period": "${fmt3}",
      "scenarios": [
        { "label": "Bull case",  "probability": 30, "color": "#22c55e", "icon": "🟢",
          "trigger": "...", "marketTarget": "S&P X,XXX–X,XXX", "canadianAngle": "TSX/CAD/oil implications", "positioning": "TFSA/RRSP action" },
        { "label": "Base case",  "probability": 45, "color": "#fbbf24", "icon": "🟡",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "..." },
        { "label": "Bear case",  "probability": 25, "color": "#ef4444", "icon": "🔴",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "..." }
      ],
      "keyEvents": [
        { "date": "Mon DD", "event": "description" }
      ]
    },
    {
      "horizon": "6 months", "period": "${fmt6}",
      "scenarios": [
        { "label": "Bull case",  "probability": 28, "color": "#22c55e", "icon": "🟢",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "..." },
        { "label": "Base case",  "probability": 42, "color": "#fbbf24", "icon": "🟡",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "..." },
        { "label": "Bear case",  "probability": 30, "color": "#ef4444", "icon": "🔴",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "..." }
      ],
      "keyEvents": [
        { "date": "Mon YYYY", "event": "description" }
      ]
    }
  ],
  "catalysts": {
    "bullish": [
      { "icon": "emoji", "label": "specific catalyst relevant to current environment" }
    ],
    "bearish": [
      { "icon": "emoji", "label": "specific risk relevant to current environment" }
    ]
  },
  "portfolioImplication": {
    "summary": "2-3 sentences specific to a Canadian TFSA/RRSP investor given the current regime",
    "actions": [
      { "priority": "High",   "action": "Specific actionable guidance — name tickers (e.g. GOLD, ENB, ZAG.TO)" },
      { "priority": "Medium", "action": "..." },
      { "priority": "Low",    "action": "..." }
    ]
  }
}`;
  }

  async function refreshMarketPulse() {
    if (!claudeApiKey.trim()) { setPulseError("Enter your Anthropic API key first."); return; }
    setPulseLoading(true);
    setPulseError(null);
    try {
      const live = await fetchLiveSignals();
      const prompt = buildMarketPulsePrompt(live);

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": claudeApiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text || "";

      // Strip optional markdown fences then parse
      const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const parsed = JSON.parse(stripped);

      if (!parsed.regime || !parsed.macroSignals || !parsed.outlooks) {
        throw new Error("Response is missing required fields — try again.");
      }

      const ts = new Date().toISOString();
      setMarketPulse(parsed);
      setPulseRefreshedAt(ts);
      localStorage.setItem("pulse:cache", JSON.stringify(parsed));
      localStorage.setItem("pulse:refreshedAt", ts);
    } catch (e) {
      setPulseError(e.message);
    } finally {
      setPulseLoading(false);
    }
  }

  async function copyMarketPulsePrompt() {
    setPulseCopyLoading(true);
    setPulseCopied(false);
    setPulsePasteError(null);
    try {
      const live = await fetchLiveSignals();
      const prompt = buildMarketPulsePrompt(live);
      await navigator.clipboard.writeText(prompt);
      setPulseCopied(true);
      setTimeout(() => setPulseCopied(false), 4000);
    } catch (e) {
      setPulseError("Could not copy: " + e.message);
    } finally {
      setPulseCopyLoading(false);
    }
  }

  function applyPastedPulse() {
    setPulsePasteError(null);
    try {
      // 1. Try to pull JSON out of a ```json ... ``` fence
      // 2. Fall back to finding the outermost { ... } in the text
      // 3. Last resort: parse the whole pasted text as-is
      let jsonStr = pulsePasteText;
      const fenceMatch = pulsePasteText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (fenceMatch) {
        jsonStr = fenceMatch[1].trim();
      } else {
        const start = pulsePasteText.indexOf("{");
        const end   = pulsePasteText.lastIndexOf("}");
        if (start !== -1 && end > start) jsonStr = pulsePasteText.slice(start, end + 1);
      }

      const parsed = JSON.parse(jsonStr);
      if (!parsed.regime || !parsed.macroSignals || !parsed.outlooks) {
        throw new Error("Missing required fields — make sure you pasted the full JSON response.");
      }
      const ts = new Date().toISOString();
      setMarketPulse(parsed);
      setPulseRefreshedAt(ts);
      localStorage.setItem("pulse:cache", JSON.stringify(parsed));
      localStorage.setItem("pulse:refreshedAt", ts);
      setPulsePasteText("");
      setPulsePasteOpen(false);
      setPulseApplyDone(true);
      setTimeout(() => setPulseApplyDone(false), 4000);
    } catch (e) {
      setPulsePasteError(e.message);
    }
  }

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
          padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.04);
          font-size:12px;color:rgba(255,255,255,0.68);vertical-align:middle;
          font-family:'JetBrains Mono',monospace;
        }
        .td-main{color:#f1f5f9;font-weight:500}
        .td input[type=number],.td input[type=text]{
          padding:5px 8px;font-size:13px;border-radius:6px;box-sizing:border-box;
        }
        .td-target input[type=number]{
          padding:6px 8px;font-size:15px;font-weight:700;
          color:#f1f5f9;text-align:center;
          background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.14);
        }
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
            <label className="btn" style={{ cursor:"pointer", fontSize:11, padding:"6px 12px" }} title="Import JSON backup or CSV holdings">
              ⬇ Import (JSON/CSV)
              <input type="file" accept=".json,.csv,text/csv,application/json" style={{ display:"none" }} onChange={importData}/>
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
                  {h.ticker} ({((toCAD(h.current, h.ticker, h.currencyOverride)/currentTotal)*100).toFixed(1)}%)
                </strong>
              ).reduce((a, b) => [a, ", ", b])} {concentrationWarnings.length > 1 ? "exceed" : "exceeds"} 20% — consider spreading risk.
            </span>
          </div>
        </div>
      )}

      {/* ── Summary cards ── */}
      <div style={{ padding:"18px 28px 0", display:"grid",
        gridTemplateColumns:"repeat(auto-fit, minmax(152px, 1fr))", gap:10 }}>

        {/* Cash — always CAD */}
        <div className="stat-card" style={{ "--accent":"#34d399" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Cash CAD ({account})</p>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
            <span style={{ fontSize:13, color:"rgba(255,255,255,0.22)", fontFamily:"'JetBrains Mono',monospace" }}>C$</span>
            <input type="number" value={cash || ""} onChange={e => handleCash(e.target.value)}
              placeholder="0"
              style={{ fontSize:21, fontWeight:600, color:"#34d399", border:"none",
                background:"transparent", padding:0, width:"100%",
                fontFamily:"'JetBrains Mono',monospace" }}/>
          </div>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>available to invest</p>
        </div>

        {/* USD → CAD Rate */}
        <div className="stat-card" style={{ "--accent":"#60a5fa" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>USD → CAD Rate</p>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
            <input type="number" value={usdCadRate} step="0.001" min="1" max="2"
              onChange={e => { const r = Number(e.target.value) || 1.38; setUsdCadRate(r); persistFxRate(r); }}
              style={{ fontSize:21, fontWeight:600, color:"#60a5fa", border:"none",
                background:"transparent", padding:0, width:"100%",
                fontFamily:"'JetBrains Mono',monospace" }}/>
          </div>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>1 USD = {usdCadRate} CAD</p>
        </div>

        {/* Total invested — in CAD */}
        <div className="stat-card" style={{ "--accent":"#64748b" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Total invested</p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color: totalCostBasis > 0 ? "#94a3b8" : "rgba(255,255,255,0.18)", marginBottom:4 }}>
            {totalCostBasis > 0 ? `C$${Math.round(totalCostBasis).toLocaleString()}` : "—"}
          </p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>cost basis (CAD)</p>
        </div>

        {/* Portfolio value — in CAD */}
        <div className="stat-card" style={{ "--accent":accentColor }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Portfolio value</p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color:accentColor, marginBottom:4 }}>
            C${Math.round(currentTotal).toLocaleString()}
          </p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>market value (CAD)</p>
        </div>

        {/* Unrealized P&L — in CAD */}
        {totalPnL !== null && (
          <div className="stat-card"
            style={{ "--accent": totalPnL >= 0 ? "#34d399" : "#f43f5e" }}>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
              marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Unrealized P&amp;L</p>
            <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
              color: totalPnL >= 0 ? "#34d399" : "#f43f5e", marginBottom:4 }}>
              {totalPnL >= 0 ? "+" : ""}C${Math.round(totalPnL).toLocaleString()}
            </p>
            <p style={{ fontSize:9, color: totalPnL >= 0 ? "#34d399" : "#f43f5e", opacity:0.8 }}>
              {totalPnLPct >= 0 ? "+" : ""}{totalPnLPct.toFixed(1)}% total return
            </p>
          </div>
        )}

        {/* Annual dividends — in CAD */}
        {annualDivIncome > 1 && (
          <div className="stat-card" style={{ "--accent":"#a78bfa" }}>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
              marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>Annual dividends</p>
            <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
              color:"#a78bfa", marginBottom:4 }}>
              C${Math.round(annualDivIncome).toLocaleString()}
            </p>
            {account === "TFSA" && whtEstimate > 1 ? (
              <p style={{ fontSize:9, color:"#f97316" }}>−C${Math.round(whtEstimate)} WHT/yr</p>
            ) : (
              <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>estimated/yr (CAD)</p>
            )}
          </div>
        )}

        {/* After deploy — in CAD */}
        <div className="stat-card" style={{ "--accent":"#7c3aed" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>After deploy</p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color:"#c4b5fd", marginBottom:4 }}>
            C${Math.round(newTotal).toLocaleString()}
          </p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>portfolio + cash (CAD)</p>
        </div>

        {/* To buy — in CAD */}
        <div className="stat-card" style={{ "--accent":"#22d3ee" }}>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", letterSpacing:"0.13em",
            marginBottom:8, textTransform:"uppercase", fontWeight:600 }}>To buy</p>
          <p style={{ fontSize:21, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
            color:"#22d3ee", marginBottom:4 }}>
            C${Math.round(totalBuys).toLocaleString()}
          </p>
          <p style={{ fontSize:9, color: isCashConstrained ? "#f97316" : "rgba(255,255,255,0.22)" }}>
            {isCashConstrained ? "scaled to cash" : "at target weights"}
          </p>
        </div>

        {/* Cash remaining / To sell — in CAD */}
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
            C${Math.round(rebalMode === "full" ? totalSells : cashRemaining).toLocaleString()}
          </p>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.22)" }}>
            {rebalMode === "full" ? "overweight positions" : "after all buys"}
          </p>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding:"20px 28px 0", display:"flex", gap:6, flexWrap:"wrap",
        borderBottom:"1px solid rgba(255,255,255,0.05)", paddingBottom:0 }}>
        {[["dashboard","📊 Dashboard"],["rebalance","⚖️ Rebalance"],["dca","📅 DCA Plan"],["targets","🎯 Edit Targets"],
          ["recommend","💡 Ideas"],["search","🔍 Search"],["pulse","📡 Market Pulse"]].map(([v,l]) => (
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
              <p className="sec">Cash available to deploy — CAD ({account})</p>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20, color:"rgba(255,255,255,0.4)" }}>C$</span>
                <input type="number" value={cash || ""} onChange={e => handleCash(e.target.value)}
                  placeholder="0" style={{ fontSize:22, fontWeight:500, color:"#34d399", maxWidth:200 }}/>
              </div>
            </div>
            <div style={{ flex:"1 1 240px" }}>
              <p className="sec">Quick add</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[500,1000,2500,5000,7000,10000].map(v => (
                  <button key={v} className="btn" onClick={() => handleCash(cash + v)}>+C${v.toLocaleString()}</button>
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
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>TFSA: C$7,000/yr</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>RRSP: C$32,490/yr</p>
            </div>
          </div>

          {isCashConstrained && (
            <div className="warn">
              ⚠ Buys scaled to cash: optimal deploy is C${Math.round(rawBuyTotal).toLocaleString()} but
              only C${Math.round(cash).toLocaleString()} available — each position scaled to {(scaleFactor*100).toFixed(0)}% of optimal.
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
                  Buy plan — C${Math.round(totalBuys).toLocaleString()} across {enrichedBuys.length} position{enrichedBuys.length>1?"s":""}
                  {isCashConstrained ? ` · scaled to C${Math.round(cash).toLocaleString()} cash` : ""}
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
                        {fmtAmt(h.deltaNative, h.ticker, h.currencyOverride)}
                      </p>
                      {isCashConstrained && Math.round(h.rawDelta) !== Math.round(h.delta) && (
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:3 }}>
                          full: {fmtAmt(h.rawDeltaNative, h.ticker, h.currencyOverride)}
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
                      <td className="td" style={{ textAlign:"right" }}>{fmtAmt(h.currentDollarNative, h.ticker, h.currencyOverride)}</td>
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
                      <td className="td" style={{ textAlign:"right" }}>C${Math.round(h.targetDollar).toLocaleString()}</td>
                      <td className="td" style={{ textAlign:"right" }}>
                        {action==="buy"  && <span style={{ color:"#22d3ee" }}>▲ BUY {fmtAmt(h.deltaNative, h.ticker, h.currencyOverride)}</span>}
                        {action==="sell" && <span style={{ color:"#ef4444" }}>▼ SELL {fmtAmt(Math.abs(h.deltaNative), h.ticker, h.currencyOverride)}</span>}
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
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:0.5 }}>Cadence</span>
                  {CONTRIB_FREQUENCY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`tab-btn ${contribFrequency===opt.value?"on":""}`}
                      onClick={() => handleContribFrequency(opt.value)}
                      style={{ padding:"4px 10px", fontSize:10 }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <input type="range" min={4} max={26} value={dcaWeeks}
                    onChange={e => setDcaWeeks(Number(e.target.value))}/>
                  <span style={{ fontSize:18, fontWeight:500, color:accentColor,
                    fontFamily:"'JetBrains Mono',monospace", minWidth:100 }}>
                    {dcaWeeks} weeks
                  </span>
                </div>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:6 }}>
                  ≈ {(dcaWeeks/4).toFixed(1)} months · {dcaPeriods} {contribFrequencyMeta.label.toLowerCase()} contributions · C${Math.round(perPeriodTotalBuy).toLocaleString()}/{contribFrequencyMeta.shortLabel}
                </p>
              </div>
              <div style={{ flex:"0 0 180px", textAlign:"center" }}>
                <p className="sec">{contribFrequencyMeta.label} spend</p>
                <p style={{ fontSize:24, fontWeight:500, color:"#22d3ee", fontFamily:"'JetBrains Mono',monospace" }}>
                  C${Math.round(perPeriodTotalBuy).toLocaleString()}
                </p>
                <div style={{ marginTop:6, display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
                  {perPeriodUSD > 0 && <span style={{ fontSize:10, color:"#60a5fa" }}>US${Math.round(perPeriodUSD).toLocaleString()}</span>}
                  {perPeriodUSD > 0 && perPeriodCAD > 0 && <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>·</span>}
                  {perPeriodCAD > 0 && <span style={{ fontSize:10, color:"#fbbf24" }}>C${Math.round(perPeriodCAD).toLocaleString()}</span>}
                </div>
              </div>
              <div style={{ flex:"0 0 180px", textAlign:"center" }}>
                <p className="sec">Total to deploy</p>
                <p style={{ fontSize:24, fontWeight:500, color:accentColor, fontFamily:"'JetBrains Mono',monospace" }}>
                  C${Math.round(totalBuys).toLocaleString()}
                </p>
                <div style={{ marginTop:6, display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
                  {totalBuysUSD > 0 && <span style={{ fontSize:10, color:"#60a5fa" }}>US${Math.round(totalBuysUSD).toLocaleString()}</span>}
                  {totalBuysUSD > 0 && totalBuysCAD > 0 && <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>·</span>}
                  {totalBuysCAD > 0 && <span style={{ fontSize:10, color:"#fbbf24" }}>C${Math.round(totalBuysCAD).toLocaleString()}</span>}
                </div>
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
              <p className="sec">{contribFrequencyMeta.label} DCA plan — {account}</p>
              <div className="card" style={{ padding:0, overflow:"auto", marginBottom:16 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:600 }}>
                  <thead>
                    <tr>
                      <th className="th">Ticker</th>
                      <th className="th">Name</th>
                      <th className="th">Exchange</th>
                      <th className="th" style={{ textAlign:"right" }}>Total buy</th>
                      <th className="th" style={{ textAlign:"right" }}>Per {contribFrequencyMeta.label.toLowerCase()}</th>
                      <th className="th" style={{ textAlign:"right" }}>% of plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyList.sort((a,b) => b.delta - a.delta).map(h => {
                      const exch   = getExchange(h.ticker, h.currencyOverride);
                      const isCAD  = getTickerCurrency(h.ticker, h.currencyOverride) === "CAD";
                      return (
                        <tr key={h.ticker}>
                          <td className="td td-main"><strong style={{ color:accentColor }}>{h.ticker}</strong></td>
                          <td className="td" style={{ color:"rgba(255,255,255,0.5)" }}>{h.name}</td>
                          <td className="td">
                            <span style={{
                              fontSize:10, padding:"2px 7px", borderRadius:4, fontWeight:500,
                              background: isCAD ? "rgba(251,191,36,0.1)" : "rgba(96,165,250,0.1)",
                              color:      isCAD ? "#fbbf24"              : "#60a5fa",
                              border:     `1px solid ${isCAD ? "rgba(251,191,36,0.25)" : "rgba(96,165,250,0.25)"}`,
                            }}>
                              {exch} · {isCAD ? "C$" : "US$"}
                            </span>
                          </td>
                          <td className="td" style={{ textAlign:"right" }}>{fmtAmt(h.deltaNative, h.ticker, h.currencyOverride)}</td>
                          <td className="td" style={{ textAlign:"right", color:"#22d3ee", fontWeight:500 }}>{fmtAmt(h.deltaNative/dcaPeriods, h.ticker, h.currencyOverride)}</td>
                          <td className="td" style={{ textAlign:"right" }}>{((h.delta/totalBuys)*100).toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="sec">{contribFrequencyMeta.label} schedule</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10 }}>
                {Array.from({ length: Math.min(dcaPeriods, 12) }, (_, w) => {
                  const isoDate = new Date(Date.now() + w * contribFrequencyMeta.cadenceWeeks * 7 * 24 * 60 * 60 * 1000);
                  return (
                    <div key={w} className="dca-week">
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontSize:11, color:accentColor, fontWeight:500 }}>{contribFrequencyMeta.label} {w+1}</span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>
                          {isoDate.toLocaleDateString("en-CA", { month:"short", day:"numeric" })}
                        </span>
                      </div>
                      {buyList.sort((a,b) => b.delta - a.delta).slice(0, 5).map(h => (
                        <div key={h.ticker} style={{ display:"flex", justifyContent:"space-between",
                          fontSize:10, padding:"2px 0", fontFamily:"'JetBrains Mono',monospace" }}>
                          <span style={{ color: getTickerCurrency(h.ticker, h.currencyOverride) === "CAD" ? "#fbbf2488" : "rgba(255,255,255,0.5)" }}>
                            {h.ticker}
                          </span>
                          <span style={{ color:"rgba(255,255,255,0.75)" }}>{fmtAmt(h.deltaNative/dcaPeriods, h.ticker, h.currencyOverride)}</span>
                        </div>
                      ))}
                      <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:8, paddingTop:6,
                        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>Total</span>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:1 }}>
                          {perPeriodUSD > 0 && <span style={{ fontSize:10, color:"#60a5fa", fontFamily:"'JetBrains Mono',monospace" }}>US${Math.round(perPeriodUSD).toLocaleString()}</span>}
                          {perPeriodCAD > 0 && <span style={{ fontSize:10, color:"#fbbf24", fontFamily:"'JetBrains Mono',monospace" }}>C${Math.round(perPeriodCAD).toLocaleString()}</span>}
                        </div>
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
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:16 }}>
            <p className="sec" style={{ margin:0 }}>Edit holdings, cost basis &amp; targets — {account}</p>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"6px 10px" }}>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>Rows</span>
                {[["all","All"],["manual","Manual only"]].map(([v,l]) => (
                  <button
                    key={v}
                    className={`tab-btn ${targetsFilter===v?"on":""}`}
                    onClick={() => setTargetsFilter(v)}
                    style={{ padding:"4px 10px", fontSize:10 }}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"8px 14px" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Contribution</span>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"rgba(255,255,255,0.4)" }}>$</span>
                  <input type="number" min="0" step="100"
                    value={contribAmount || ""}
                    placeholder="0"
                    onChange={e => handleContribAmount(e.target.value)}
                    style={{ paddingLeft:18, width:100 }}/>
                </div>
                <select
                  value={contribFrequency}
                  onChange={e => handleContribFrequency(e.target.value)}
                  style={{ width:105, fontSize:11 }}
                >
                  {CONTRIB_FREQUENCY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {targetsFilter === "manual" && (
                <span style={{ fontSize:10, color:"rgba(251,191,36,0.8)" }}>
                  Showing {filteredCurrent.length} manual override row{filteredCurrent.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
          <div className="card" style={{ padding:0, overflow:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1380 }}>
              <thead>
                <tr>
                  <th className="th">Ticker / Name</th>
                  <th className="th" style={{ width:120 }}>Currency</th>
                  <th className="th" style={{ width:115 }}>Current $</th>
                  <th className="th" style={{ width:115 }}>Cost Basis $</th>
                  <th className="th" style={{ textAlign:"right", width:120 }}>P&amp;L $</th>
                  <th className="th" style={{ textAlign:"right", width:75 }}>P&amp;L %</th>
                  <th className="th" style={{ width:95 }}>Target %</th>
                  <th className="th" style={{ width:90 }}>CAGR %</th>
                  <th className="th" style={{ textAlign:"right", width:105 }}>10yr</th>
                  <th className="th" style={{ textAlign:"right", width:105 }}>15yr</th>
                  <th className="th" style={{ textAlign:"right", width:105 }}>20yr</th>
                  <th className="th" style={{ width:110 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredCurrent.map(({ h, idx }) => {
                  const cagr      = h.cagr ?? DEFAULT_CAGR[h.ticker] ?? 10;
                  const cb        = h.costBasis || 0;
                  const posPnl    = cb > 0 ? h.current - cb : null;
                  const posPnlPct = cb > 0 ? ((h.current - cb) / cb) * 100 : null;
                  const contrib     = monthlyContribEq;
                  const holdingPMT  = contrib > 0 ? (h.target / 100) * contrib : 0;
                  const currentCAD  = toCAD(h.current, h.ticker, h.currencyOverride);
                  const proj = yrs => {
                    const r = cagr / 100 / 12;
                    const n = yrs * 12;
                    if (currentCAD === 0 && holdingPMT === 0) return "—";
                    const fv = r === 0
                      ? currentCAD + holdingPMT * n
                      : currentCAD * Math.pow(1+r, n) + holdingPMT * (Math.pow(1+r,n)-1) / r;
                    return `C$${Math.round(fv).toLocaleString()}`;
                  };
                  return (
                    <tr key={h.ticker}>
                      <td className="td td-main">
                        <strong style={{ color:accentColor }}>{h.ticker}</strong>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{h.name}</div>
                      </td>
                      <td className="td">
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                          <select
                            value={h.currencyOverride || ""}
                            onChange={e => updateHolding(idx, "currencyOverride", e.target.value)}
                            style={{ fontSize:11, padding:"5px 8px", borderRadius:6 }}
                          >
                            <option value="">Auto</option>
                            <option value="CAD">CAD</option>
                            <option value="USD">USD</option>
                          </select>
                          <span
                            className="pill"
                            style={{
                              width:"fit-content",
                              padding:"1px 6px",
                              fontSize:9,
                              borderRadius:4,
                              color: h.currencyOverride ? "#fbbf24" : "rgba(255,255,255,0.65)",
                              border: h.currencyOverride ? "1px solid rgba(251,191,36,0.35)" : "1px solid rgba(148,163,184,0.22)",
                              background: h.currencyOverride ? "rgba(251,191,36,0.08)" : "rgba(148,163,184,0.08)",
                            }}
                          >
                            {h.currencyOverride ? "MANUAL" : "AUTO"} · {getTickerCurrency(h.ticker, h.currencyOverride)}
                          </span>
                        </div>
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
                      <td className="td td-target">
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <input type="number" value={h.target} max="100" min="0" step="1"
                            onChange={e => updateHolding(idx, "target", e.target.value)}
                            style={{ flex:1 }}/>
                          <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)", flexShrink:0 }}>%</span>
                        </div>
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
                  <td className="td" style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>AUTO / MANUAL</td>
                  <td className="td" style={{ color:accentColor, fontWeight:500 }}>C${Math.round(currentTotal).toLocaleString()}</td>
                  <td className="td" style={{ color:"#94a3b8", fontWeight:500 }}>
                    {totalCostBasis > 0 ? `C$${Math.round(totalCostBasis).toLocaleString()}` : "—"}
                  </td>
                  <td className="td" style={{ textAlign:"right", fontWeight:500,
                    color: totalPnL !== null ? (totalPnL >= 0 ? "#34d399" : "#ef4444") : "rgba(255,255,255,0.2)" }}>
                    {totalPnL !== null ? `${totalPnL >= 0 ? "+" : ""}C$${Math.round(totalPnL).toLocaleString()}` : "—"}
                  </td>
                  <td className="td" style={{ textAlign:"right", fontWeight:500,
                    color: totalPnLPct !== null ? (totalPnLPct >= 0 ? "#34d399" : "#ef4444") : "rgba(255,255,255,0.2)" }}>
                    {totalPnLPct !== null ? `${totalPnLPct >= 0 ? "+" : ""}${totalPnLPct.toFixed(1)}%` : "—"}
                  </td>
                  <td className="td" style={{ fontWeight:700, fontSize:14,
                    color: Math.abs(targetSum-100) > 0.5 ? "#ef4444" : "#34d399" }}>
                    {targetSum}%
                  </td>
                  <td className="td"></td>
                  <td className="td" style={{ textAlign:"right", color:"#34d399", fontWeight:500 }}>
                    C${Math.round(current.reduce((s,h)=>{
                      const r=(h.cagr??DEFAULT_CAGR[h.ticker]??10)/100/12,n=120,pmt=monthlyContribEq*(h.target/100),c=toCAD(h.current,h.ticker,h.currencyOverride);
                      if(c===0&&pmt===0)return s;
                      return s+(r===0?c+pmt*n:c*Math.pow(1+r,n)+pmt*(Math.pow(1+r,n)-1)/r);
                    },0)).toLocaleString()}
                  </td>
                  <td className="td" style={{ textAlign:"right", color:"#22d3ee", fontWeight:500 }}>
                    C${Math.round(current.reduce((s,h)=>{
                      const r=(h.cagr??DEFAULT_CAGR[h.ticker]??10)/100/12,n=180,pmt=monthlyContribEq*(h.target/100),c=toCAD(h.current,h.ticker,h.currencyOverride);
                      if(c===0&&pmt===0)return s;
                      return s+(r===0?c+pmt*n:c*Math.pow(1+r,n)+pmt*(Math.pow(1+r,n)-1)/r);
                    },0)).toLocaleString()}
                  </td>
                  <td className="td" style={{ textAlign:"right", color:accentColor, fontWeight:600 }}>
                    C${Math.round(current.reduce((s,h)=>{
                      const r=(h.cagr??DEFAULT_CAGR[h.ticker]??10)/100/12,n=240,pmt=monthlyContribEq*(h.target/100),c=toCAD(h.current,h.ticker,h.currencyOverride);
                      if(c===0&&pmt===0)return s;
                      return s+(r===0?c+pmt*n:c*Math.pow(1+r,n)+pmt*(Math.pow(1+r,n)-1)/r);
                    },0)).toLocaleString()}
                  </td>
                  <td className="td" style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>
                    {Math.abs(targetSum-100) > 0.5 ? `⚠ off by ${Math.abs(targetSum-100).toFixed(1)}%` : "✓ balanced"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Growth Milestones */}
          {(() => {
            const contrib = monthlyContribEq;
            const fv = (yrs) => current.reduce((s,h) => {
              const r = (h.cagr??DEFAULT_CAGR[h.ticker]??10)/100/12, n = yrs*12;
              const c = toCAD(h.current, h.ticker, h.currencyOverride);
              const pmt = contrib * (h.target/100);
              if (c===0 && pmt===0) return s;
              return s + (r===0 ? c+pmt*n : c*Math.pow(1+r,n)+pmt*(Math.pow(1+r,n)-1)/r);
            }, 0);
            const lump = (yrs) => current.reduce((s,h) => {
              const r = (h.cagr??DEFAULT_CAGR[h.ticker]??10)/100/12, n = yrs*12;
              const c = toCAD(h.current, h.ticker, h.currencyOverride);
              if (c===0) return s;
              return s + c*Math.pow(1+r,n);
            }, 0);
            const totalContrib = annualContrib;
            return (
              <div style={{ marginTop:20, padding:"18px 20px", background:"rgba(255,255,255,0.03)", border:`1px solid ${accentColor}33`, borderRadius:14 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:8 }}>
                  <p className="sec" style={{ margin:0 }}>Growth Milestones</p>
                  {contrib > 0 && (
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>
                      C${contribAmount.toLocaleString()}/{contribFrequencyMeta.shortLabel} · C${totalContrib.toLocaleString()}/yr in contributions
                    </span>
                  )}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {[10,15,20].map(yrs => {
                    const withC = fv(yrs);
                    const noC   = lump(yrs);
                    const boost = withC - noC;
                    return (
                      <div key={yrs} className="stat-card" style={{ "--accent": accentColor }}>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>{yrs}-Year Projection</div>
                        <div style={{ fontSize:22, fontWeight:700, color: accentColor, marginBottom:4 }}>
                          C${Math.round(withC).toLocaleString()}
                        </div>
                        {contrib > 0 ? (
                          <>
                            <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>
                              Without contributions: <span style={{ color:"rgba(255,255,255,0.6)" }}>C${Math.round(noC).toLocaleString()}</span>
                            </div>
                            <div style={{ fontSize:11, color:"#34d399", marginTop:3 }}>
                              +C${Math.round(boost).toLocaleString()} from C${Math.round(annualContrib*yrs).toLocaleString()} invested
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Add a recurring contribution above to see boost</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
                <div>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Currency</p>
                  <select
                    value={addForm.currencyOverride || ""}
                    onChange={e => setAddForm({ ...addForm, currencyOverride: e.target.value })}
                    style={{ width:"100%", fontSize:12, padding:"8px 10px", borderRadius:8 }}
                  >
                    <option value="">Auto-detect</option>
                    <option value="CAD">CAD</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
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

          {/* Market context card — data from src/data/recommendations.json */}
          {(() => {
            const ctx = portfolioIdeas.marketContext;
            return (
              <div className="card" style={{ marginBottom:16, padding:"14px 18px",
                background:"rgba(34,211,238,0.03)", borderColor:"rgba(34,211,238,0.1)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <p className="sec" style={{ margin:0, color:"#22d3ee88" }}>
                      Market context — {ctx.period}
                    </p>
                    <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"'JetBrains Mono',monospace" }}>
                      updated {portfolioIdeas.lastUpdated}
                    </span>
                  </div>
                  {ctx.conflictAlert && (
                    <span style={{ fontSize:10, padding:"2px 9px", borderRadius:4,
                      background:"rgba(239,68,68,0.1)", color:"#ef4444",
                      border:"1px solid rgba(239,68,68,0.25)", fontWeight:600, letterSpacing:"0.04em" }}>
                      ⚠ {ctx.conflictAlert}
                    </span>
                  )}
                </div>

                {ctx.conflictInsights && ctx.conflictInsights.length > 0 && (
                  <div style={{ background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.2)",
                    borderLeft:"3px solid #ef4444", borderRadius:8, padding:"10px 14px", marginBottom:12 }}>
                    <p style={{ fontSize:11, fontWeight:600, color:"#ef4444", marginBottom:5 }}>
                      {ctx.conflictAlert} — direct portfolio implications
                    </p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:6 }}>
                      {ctx.conflictInsights.map(c => (
                        <div key={c.label} style={{ display:"flex", flexDirection:"column", gap:2 }}>
                          <p style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.65)" }}>{c.label}</p>
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.32)", lineHeight:1.4 }}>{c.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))", gap:8 }}>
                  {ctx.themes.map(c => (
                    <div key={c.label} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ fontSize:15, flexShrink:0 }}>{c.icon}</span>
                      <div>
                        <p style={{ fontSize:11, fontWeight:500, color: c.color || "rgba(255,255,255,0.7)", marginBottom:2 }}>{c.label}</p>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.33)", lineHeight:1.4 }}>{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

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
            const cagr = rec.cagr ?? DEFAULT_CAGR[rec.ticker];
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

      {/* ════════════════════════════════════════════════════════════════════
          TAB: MARKET PULSE
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "pulse" && (() => {
        const mp = marketPulse;
        const regime = mp.regime;
        const risk = mp.riskMeter;

        const trendIcon = t => t === "up" ? "↑" : t === "down" ? "↓" : "→";
        const trendColor = (t, status) => {
          if (status === "bullish") return "#22c55e";
          if (status === "bearish") return "#ef4444";
          if (status === "caution") return "#fbbf24";
          if (t === "up") return "#22c55e";
          if (t === "down") return "#ef4444";
          return "rgba(255,255,255,0.45)";
        };

        return (
          <div style={{ padding:"22px 28px" }}>

            {/* ── Claude AI refresh panel ── */}
            <div className="card" style={{ marginBottom:16, padding:"14px 18px",
              background:"rgba(167,139,250,0.03)", borderColor:"rgba(167,139,250,0.12)" }}>

              {/* Header row */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ fontSize:13 }}>✨</span>
                  <p style={{ fontSize:11, fontWeight:600, color:"#a78bfa" }}>Refresh with Claude AI</p>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>—</span>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>
                    Fetches live signals then asks Claude to generate a fresh market pulse
                  </p>
                </div>
                {pulseRefreshedAt && (
                  <span style={{ fontSize:9, color:"rgba(167,139,250,0.5)", fontFamily:"'JetBrains Mono',monospace" }}>
                    last refreshed {new Date(pulseRefreshedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Two options */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>

                {/* Option 1 — claude.ai (Pro) */}
                <div style={{ border:"1px solid rgba(167,139,250,0.2)", borderRadius:8, padding:"12px 14px",
                  background:"rgba(167,139,250,0.05)" }}>
                  <p style={{ fontSize:10, fontWeight:600, color:"rgba(167,139,250,0.8)", marginBottom:4 }}>
                    Option 1 — claude.ai <span style={{ fontWeight:400, color:"rgba(167,139,250,0.45)" }}>(uses your Pro plan)</span>
                  </p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:10, lineHeight:1.5 }}>
                    Copy a pre-built prompt with live market data already filled in. Paste into claude.ai, then paste Claude's JSON response back here.
                  </p>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <button className="btn" onClick={copyMarketPulsePrompt} disabled={pulseCopyLoading}
                      style={{ fontSize:11, padding:"6px 14px",
                        background: pulseCopied ? "rgba(34,197,94,0.15)" : "rgba(167,139,250,0.1)",
                        borderColor: pulseCopied ? "rgba(34,197,94,0.3)" : "rgba(167,139,250,0.25)",
                        color: pulseCopied ? "#22c55e" : "#a78bfa",
                        opacity: pulseCopyLoading ? 0.6 : 1 }}>
                      {pulseCopyLoading ? "Fetching signals…" : pulseCopied ? "✓ Copied!" : "📋 Copy prompt"}
                    </button>
                    {pulseCopied && (
                      <a href="https://claude.ai" target="_blank" rel="noreferrer"
                        style={{ fontSize:11, padding:"6px 14px", borderRadius:6, textDecoration:"none",
                          background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)",
                          color:"#22c55e" }}>
                        Open claude.ai →
                      </a>
                    )}
                    <button className="btn" onClick={() => { setPulsePasteOpen(o => !o); setPulsePasteError(null); }}
                      style={{ fontSize:11, padding:"6px 14px",
                        background: pulsePasteOpen ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.03)",
                        borderColor: pulsePasteOpen ? "rgba(34,211,238,0.25)" : "rgba(255,255,255,0.08)",
                        color: pulsePasteOpen ? "#22d3ee" : "rgba(255,255,255,0.4)" }}>
                      {pulsePasteOpen ? "▲ Close" : "⬇ Paste response"}
                    </button>
                  </div>

                  {pulsePasteOpen && (
                    <div style={{ marginTop:10 }}>
                      <textarea
                        value={pulsePasteText}
                        onChange={e => setPulsePasteText(e.target.value)}
                        placeholder="Paste Claude's JSON response here…"
                        rows={6}
                        style={{ width:"100%", fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                          background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                          borderRadius:6, padding:"8px 10px", color:"rgba(255,255,255,0.6)",
                          resize:"vertical", boxSizing:"border-box" }}
                      />
                      <button className="btn btn-primary" onClick={applyPastedPulse}
                        disabled={!pulsePasteText.trim()}
                        style={{ marginTop:6, fontSize:11, padding:"6px 14px",
                          background:"rgba(167,139,250,0.15)", borderColor:"rgba(167,139,250,0.3)",
                          color:"#a78bfa", opacity: pulsePasteText.trim() ? 1 : 0.4 }}>
                        Apply
                      </button>
                      {pulsePasteError && (
                        <p style={{ fontSize:10, color:"#ef4444", marginTop:6, lineHeight:1.4 }}>⚠ {pulsePasteError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Option 2 — API key */}
                <div style={{ border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"12px 14px",
                  background:"rgba(255,255,255,0.02)" }}>
                  <p style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.45)", marginBottom:4 }}>
                    Option 2 — API key <span style={{ fontWeight:400, color:"rgba(255,255,255,0.25)" }}>(one-click, pay-per-use)</span>
                  </p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:10, lineHeight:1.5 }}>
                    Fully automated. Fetches live data and calls Claude directly. ~$0.004 per refresh.
                    Get a key at <span style={{ color:"rgba(255,255,255,0.4)" }}>console.anthropic.com</span>
                  </p>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    <input type="password" value={claudeApiKey}
                      onChange={e => { setClaudeApiKey(e.target.value); localStorage.setItem("pulse:apiKey", e.target.value); }}
                      placeholder="sk-ant-…"
                      style={{ fontSize:11, flex:"1 1 140px", minWidth:0, fontFamily:"'JetBrains Mono',monospace",
                        background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                        borderRadius:6, padding:"6px 10px", color:"rgba(255,255,255,0.55)" }}
                    />
                    <button className="btn" onClick={refreshMarketPulse} disabled={pulseLoading}
                      style={{ fontSize:11, padding:"6px 14px", opacity: pulseLoading ? 0.6 : 1,
                        background:"rgba(255,255,255,0.04)", borderColor:"rgba(255,255,255,0.1)",
                        color:"rgba(255,255,255,0.45)" }}>
                      {pulseLoading ? "Refreshing…" : "⟳ Refresh"}
                    </button>
                  </div>
                </div>
              </div>

              {pulseError && (
                <p style={{ fontSize:10, color:"#ef4444", marginTop:10, padding:"6px 10px",
                  background:"rgba(239,68,68,0.07)", borderRadius:6, border:"1px solid rgba(239,68,68,0.2)" }}>
                  ⚠ {pulseError}
                </p>
              )}
              {pulseApplyDone && (
                <p style={{ fontSize:10, color:"#22c55e", marginTop:10, padding:"6px 10px",
                  background:"rgba(34,197,94,0.07)", borderRadius:6, border:"1px solid rgba(34,197,94,0.2)" }}>
                  ✓ Market Pulse updated — dashboard refreshed below.
                </p>
              )}
            </div>

            {/* Header + regime */}
            <div className="card" style={{ marginBottom:16, padding:"16px 20px",
              background:"rgba(34,211,238,0.03)", borderColor:"rgba(34,211,238,0.12)" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                    <p className="sec" style={{ margin:0, color:"#22d3ee88" }}>Market Pulse — {mp.period}</p>
                    {pulseRefreshedAt
                      ? <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, fontFamily:"'JetBrains Mono',monospace",
                          background:"rgba(167,139,250,0.1)", color:"rgba(167,139,250,0.6)",
                          border:"1px solid rgba(167,139,250,0.2)" }}>✨ AI-refreshed {mp.lastUpdated}</span>
                      : <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"'JetBrains Mono',monospace" }}>
                          updated {mp.lastUpdated}
                        </span>
                    }
                  </div>
                  <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.85)", marginBottom:4 }}>
                    <span style={{ color: regime.color }}>{regime.label}</span>
                    <span style={{ color:"rgba(255,255,255,0.3)", marginLeft:8, fontWeight:400, fontSize:11 }}>{regime.sublabel}</span>
                  </p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.6, maxWidth:680 }}>
                    {regime.description}
                  </p>
                </div>

                {/* Risk-On / Risk-Off gauge */}
                <div style={{ minWidth:200, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
                  borderRadius:10, padding:"12px 16px", textAlign:"center" }}>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                    Risk-On / Risk-Off
                  </p>
                  <div style={{ position:"relative", height:8, background:"rgba(255,255,255,0.06)", borderRadius:4, marginBottom:8, overflow:"hidden" }}>
                    <div style={{ position:"absolute", left:0, top:0, bottom:0, width:"50%",
                      background:"linear-gradient(90deg, #ef4444, #fbbf24)", borderRadius:4 }} />
                    <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:"50%",
                      background:"linear-gradient(90deg, #fbbf24, #22c55e)", borderRadius:4 }} />
                    <div style={{ position:"absolute", top:"50%", transform:"translate(-50%,-50%)",
                      left:`${risk.score}%`, width:12, height:12, borderRadius:"50%",
                      background:"#fff", boxShadow:"0 0 6px rgba(0,0,0,0.8)", border:"2px solid rgba(0,0,0,0.4)" }} />
                  </div>
                  <p style={{ fontSize:14, fontWeight:700, color: risk.color, marginBottom:2 }}>{risk.label}</p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", lineHeight:1.4 }}>{risk.sublabel}</p>
                </div>
              </div>
            </div>

            {/* Macro signals grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:12, marginBottom:16 }}>
              {mp.macroSignals.map(cat => (
                <div key={cat.category} className="card" style={{ padding:"14px 16px" }}>
                  <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.55)", marginBottom:10,
                    display:"flex", alignItems:"center", gap:6 }}>
                    <span>{cat.icon}</span>{cat.category}
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {cat.signals.map(sig => (
                      <div key={sig.label} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{sig.label}</p>
                          <p style={{ fontSize:12, fontWeight:600, fontFamily:"'JetBrains Mono',monospace",
                            color: trendColor(sig.trend, sig.status), marginTop:1 }}>
                            {trendIcon(sig.trend)} {sig.value}
                          </p>
                        </div>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)", lineHeight:1.4,
                          maxWidth:130, textAlign:"right", marginTop:2 }}>{sig.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 3-month and 6-month outlooks */}
            {mp.outlooks.map(outlook => (
              <div key={outlook.horizon} className="card" style={{ marginBottom:16, padding:"16px 20px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
                  <p className="sec" style={{ margin:0 }}>
                    {outlook.horizon} outlook
                  </p>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontFamily:"'JetBrains Mono',monospace" }}>
                    target: {outlook.period}
                  </span>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:10, marginBottom:14 }}>
                  {outlook.scenarios.map(sc => (
                    <div key={sc.label} style={{ border:`1px solid ${sc.color}25`,
                      borderLeft:`3px solid ${sc.color}`,
                      background:`${sc.color}08`,
                      borderRadius:8, padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                        <p style={{ fontSize:12, fontWeight:600, color: sc.color }}>
                          {sc.icon} {sc.label}
                        </p>
                        <span style={{ fontSize:13, fontWeight:700, color: sc.color,
                          fontFamily:"'JetBrains Mono',monospace" }}>
                          {sc.probability}%
                        </span>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        <div>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>Trigger</p>
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.55)", lineHeight:1.4 }}>{sc.trigger}</p>
                        </div>
                        <div>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>Market target</p>
                          <p style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color: sc.color, fontWeight:600 }}>{sc.marketTarget}</p>
                        </div>
                        <div>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>CAD angle</p>
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.4 }}>{sc.canadianAngle}</p>
                        </div>
                        <div>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>Positioning</p>
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.6)", lineHeight:1.4 }}>{sc.positioning}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key events */}
                <div>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                    Key events to watch
                  </p>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {outlook.keyEvents.map(ev => (
                      <div key={ev.date} style={{ display:"flex", gap:6, alignItems:"center",
                        background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
                        borderRadius:6, padding:"5px 10px" }}>
                        <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace",
                          color:"#22d3ee", fontWeight:600, whiteSpace:"nowrap" }}>{ev.date}</span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>{ev.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Catalysts: bull vs bear */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div className="card" style={{ padding:"14px 16px",
                background:"rgba(34,197,94,0.03)", borderColor:"rgba(34,197,94,0.1)" }}>
                <p style={{ fontSize:11, fontWeight:600, color:"#22c55e", marginBottom:10 }}>
                  🟢 Bull catalysts
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {mp.catalysts.bullish.map(c => (
                    <div key={c.label} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ fontSize:13, flexShrink:0 }}>{c.icon}</span>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.5)", lineHeight:1.5 }}>{c.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ padding:"14px 16px",
                background:"rgba(239,68,68,0.03)", borderColor:"rgba(239,68,68,0.1)" }}>
                <p style={{ fontSize:11, fontWeight:600, color:"#ef4444", marginBottom:10 }}>
                  🔴 Bear risks
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {mp.catalysts.bearish.map(c => (
                    <div key={c.label} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ fontSize:13, flexShrink:0 }}>{c.icon}</span>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.5)", lineHeight:1.5 }}>{c.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Portfolio implication */}
            <div className="card" style={{ marginBottom:16, padding:"14px 18px",
              background:"rgba(167,139,250,0.03)", borderColor:"rgba(167,139,250,0.12)" }}>
              <p style={{ fontSize:11, fontWeight:600, color:"#a78bfa", marginBottom:8 }}>
                🎯 Portfolio implication for your TFSA / RRSP
              </p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", lineHeight:1.6, marginBottom:12 }}>
                {mp.portfolioImplication.summary}
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {mp.portfolioImplication.actions.map(a => {
                  const pColor = a.priority === "High" ? "#ef4444" : a.priority === "Medium" ? "#fbbf24" : "#64748b";
                  return (
                    <div key={a.action} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, fontWeight:600,
                        whiteSpace:"nowrap", marginTop:1,
                        background:`${pColor}18`, color: pColor,
                        border:`1px solid ${pColor}30` }}>
                        {a.priority}
                      </span>
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.55)", lineHeight:1.5 }}>{a.action}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)", lineHeight:1.5 }}>
              ⚠ Not financial advice. Market signals and outlooks are curated manually and may not reflect current conditions. Last updated {mp.lastUpdated}. Consult a licensed financial advisor before making investment decisions.
            </p>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: DASHBOARD
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "dashboard" && (() => {
        const tfsaH = holdings["TFSA"] || [];
        const rrspH = holdings["RRSP"] || [];

        // Values in CAD
        const tfsaTotalCAD = tfsaH.reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride), 0);
        const rrspTotalCAD = rrspH.reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride), 0);
        const combTotalCAD = tfsaTotalCAD + rrspTotalCAD;

        // Cash (always CAD)
        const tfsaCash = cashHolding["TFSA"] || 0;
        const rrspCash = cashHolding["RRSP"] || 0;
        const combCashTotal = tfsaCash + rrspCash;
        const tfsaGrandTotal = tfsaTotalCAD + tfsaCash;
        const rrspGrandTotal = rrspTotalCAD + rrspCash;
        const combGrandTotal = tfsaGrandTotal + rrspGrandTotal;

        // USD vs CAD splits per account (values in CAD for comparison, native USD for display)
        const tfsaUSDValCAD = tfsaH.filter(h => getTickerCurrency(h.ticker, h.currencyOverride) === "USD")
          .reduce((s, h) => s + h.current * usdCadRate, 0);
        const tfsaCADValCAD = tfsaH.filter(h => getTickerCurrency(h.ticker, h.currencyOverride) === "CAD")
          .reduce((s, h) => s + h.current, 0);
        const tfsaUSDNative = usdCadRate > 0 ? tfsaUSDValCAD / usdCadRate : 0;

        const rrspUSDValCAD = rrspH.filter(h => getTickerCurrency(h.ticker, h.currencyOverride) === "USD")
          .reduce((s, h) => s + h.current * usdCadRate, 0);
        const rrspCADValCAD = rrspH.filter(h => getTickerCurrency(h.ticker, h.currencyOverride) === "CAD")
          .reduce((s, h) => s + h.current, 0);
        const rrspUSDNative = usdCadRate > 0 ? rrspUSDValCAD / usdCadRate : 0;

        const combUSDNative = tfsaUSDNative + rrspUSDNative;
        const combCADNative = tfsaCADValCAD + rrspCADValCAD;
        const combUSDValCAD = tfsaUSDValCAD + rrspUSDValCAD;

        // P&L
        const tfsaCostCAD = tfsaH.reduce((s, h) => s + toCAD(h.costBasis || 0, h.ticker, h.currencyOverride), 0);
        const rrspCostCAD = rrspH.reduce((s, h) => s + toCAD(h.costBasis || 0, h.ticker, h.currencyOverride), 0);
        const combCostCAD = tfsaCostCAD + rrspCostCAD;
        const tfsaPnL = tfsaCostCAD > 0 ? tfsaTotalCAD - tfsaCostCAD : null;
        const rrspPnL = rrspCostCAD > 0 ? rrspTotalCAD - rrspCostCAD : null;
        const combPnL = combCostCAD > 0 ? combTotalCAD - combCostCAD : null;
        const combPnLPct = combCostCAD > 0 ? (combTotalCAD - combCostCAD) / combCostCAD * 100 : null;

        // Dividends
        const tfsaDivCAD = tfsaH.reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride) * (h.divYield || 0) / 100, 0);
        const rrspDivCAD = rrspH.reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride) * (h.divYield || 0) / 100, 0);
        const combDivCAD = tfsaDivCAD + rrspDivCAD;

        // WHT drag (TFSA — US dividends taxed at 15% by IRS)
        const tfsaWHTCAD = tfsaH.filter(h => !CAD_EXEMPT.has(h.ticker))
          .reduce((s, h) => s + toCAD(h.current, h.ticker, h.currencyOverride) * (h.divYield || 0) / 100 * 0.15, 0);

        // Effective yield (after WHT for TFSA)
        const tfsaEffDivCAD = tfsaDivCAD - tfsaWHTCAD;

        // Top holdings per account (sorted by CAD value)
        const tfsaTop = [...tfsaH]
          .map(h => ({ ...h, valueCAD: toCAD(h.current, h.ticker, h.currencyOverride) }))
          .filter(h => h.valueCAD > 0)
          .sort((a, b) => b.valueCAD - a.valueCAD)
          .slice(0, 8);
        const rrspTop = [...rrspH]
          .map(h => ({ ...h, valueCAD: toCAD(h.current, h.ticker, h.currencyOverride) }))
          .filter(h => h.valueCAD > 0)
          .sort((a, b) => b.valueCAD - a.valueCAD)
          .slice(0, 8);

        // Combined sorted across both accounts
        const allTop = [
          ...tfsaH.map(h => ({ ...h, acct:"TFSA", valueCAD: toCAD(h.current, h.ticker, h.currencyOverride) })),
          ...rrspH.map(h => ({ ...h, acct:"RRSP", valueCAD: toCAD(h.current, h.ticker, h.currencyOverride) })),
        ].filter(h => h.valueCAD > 0).sort((a, b) => b.valueCAD - a.valueCAD).slice(0, 12);

        // Target alignment health
        const tfsaTargetSum = tfsaH.reduce((s, h) => s + (h.target || 0), 0);
        const rrspTargetSum = rrspH.reduce((s, h) => s + (h.target || 0), 0);
        const tfsaConc = tfsaTotalCAD > 0
          ? tfsaH.filter(h => (toCAD(h.current, h.ticker, h.currencyOverride) / tfsaTotalCAD) * 100 > 20)
          : [];
        const rrspConc = rrspTotalCAD > 0
          ? rrspH.filter(h => (toCAD(h.current, h.ticker, h.currencyOverride) / rrspTotalCAD) * 100 > 20)
          : [];

        // Account allocation % (includes cash)
        const tfsaAcctPct = combGrandTotal > 0 ? (tfsaGrandTotal / combGrandTotal) * 100 : 0;
        const rrspAcctPct = combGrandTotal > 0 ? (rrspGrandTotal / combGrandTotal) * 100 : 0;

        // Max bar value helpers
        const tfsaMaxVal = tfsaTop[0]?.valueCAD || 1;
        const rrspMaxVal = rrspTop[0]?.valueCAD || 1;
        const allMaxVal  = allTop[0]?.valueCAD || 1;

        // Donut segments
        const acctSegments = [
          { pct: tfsaAcctPct, color:"#fbbf24", label:"TFSA" },
          { pct: rrspAcctPct, color:"#22d3ee", label:"RRSP" },
        ];
        const tfsaCurrSegments = tfsaGrandTotal > 0 ? [
          { pct: (tfsaUSDValCAD / tfsaGrandTotal) * 100, color:"#60a5fa", label:"USD" },
          { pct: ((tfsaCADValCAD + tfsaCash) / tfsaGrandTotal) * 100, color:"#34d399", label:"CAD" },
        ] : [{ pct:100, color:"rgba(255,255,255,0.07)", label:"—" }];
        const rrspCurrSegments = rrspGrandTotal > 0 ? [
          { pct: (rrspUSDValCAD / rrspGrandTotal) * 100, color:"#60a5fa", label:"USD" },
          { pct: ((rrspCADValCAD + rrspCash) / rrspGrandTotal) * 100, color:"#34d399", label:"CAD" },
        ] : [{ pct:100, color:"rgba(255,255,255,0.07)", label:"—" }];
        const combCurrSegments = combGrandTotal > 0 ? [
          { pct: (combUSDValCAD / combGrandTotal) * 100, color:"#60a5fa", label:"USD" },
          { pct: ((combCADNative + combCashTotal) / combGrandTotal) * 100, color:"#34d399", label:"CAD" },
        ] : [{ pct:100, color:"rgba(255,255,255,0.07)", label:"—" }];

        const fmt = (n) => Math.round(n).toLocaleString();
        const pnlColor = (v) => v === null ? "#64748b" : v >= 0 ? "#34d399" : "#ef4444";
        const pnlSign  = (v) => v >= 0 ? "+" : "";

        // Account panel renderer (used for both TFSA and RRSP)
        function AccountPanel({ label, color, rgb, holdings: acctH, totalCAD, grandTotal, cash,
                                usdValCAD, cadValCAD, usdNative,
                                topHoldings, maxVal, divCAD, whtCAD, pnL, costCAD, targetSum, currSegments, concWarns }) {
          const usdPct = grandTotal > 0 ? (usdValCAD / grandTotal) * 100 : 0;
          const cadPct = grandTotal > 0 ? ((cadValCAD + cash) / grandTotal) * 100 : 0;
          const effDiv = divCAD - (whtCAD || 0);
          return (
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              {/* Panel header */}
              <div style={{ padding:"14px 18px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)",
                background:`rgba(${rgb},0.04)` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.15em",
                      color, textTransform:"uppercase" }}>{label}</span>
                    <p style={{ fontSize:24, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                      color, marginTop:4 }}>
                      C${fmt(grandTotal)}
                    </p>
                    <div style={{ display:"flex", gap:8, marginTop:2, flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>
                        C${fmt(totalCAD)} invested
                      </span>
                      {cash > 0 && (
                        <>
                          <span style={{ fontSize:10, color:"rgba(255,255,255,0.15)" }}>·</span>
                          <span style={{ fontSize:10, color:"#94a3b8" }}>
                            C${fmt(cash)} cash
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    {pnL !== null ? (
                      <>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:4,
                          letterSpacing:"0.1em", textTransform:"uppercase" }}>Unrealized P&L</p>
                        <p style={{ fontSize:18, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                          color: pnlColor(pnL) }}>
                          {pnlSign(pnL)}C${fmt(pnL)}
                        </p>
                        <p style={{ fontSize:10, color: pnlColor(pnL), opacity:0.8, marginTop:2 }}>
                          {pnlSign(pnL)}{((pnL / costCAD) * 100).toFixed(1)}% return
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>No cost basis set</p>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:14 }}>
                {/* Currency exposure */}
                <div>
                  <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                    color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:10 }}>Currency Exposure</p>
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                    <DonutChart
                      segments={currSegments} size={90} thickness={14}
                      centerLabel={grandTotal > 0 ? `${Math.round(usdPct)}%` : "—"}
                      centerSub="USD"
                    />
                    <div style={{ flex:1 }}>
                      {/* USD row */}
                      <div style={{ marginBottom:8 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:10, color:"#60a5fa", fontWeight:600 }}>USD Holdings</span>
                          <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#60a5fa" }}>
                            US${fmt(usdNative)}
                          </span>
                        </div>
                        <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                          <div style={{ height:4, background:"#60a5fa", borderRadius:2,
                            width:`${usdPct}%`, transition:"width 0.5s" }}/>
                        </div>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", marginTop:3 }}>
                          C${fmt(usdValCAD)} equiv · {usdPct.toFixed(1)}%
                        </p>
                      </div>
                      {/* CAD row */}
                      <div style={{ marginBottom: cash > 0 ? 8 : 0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:10, color:"#34d399", fontWeight:600 }}>CAD Holdings</span>
                          <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#34d399" }}>
                            C${fmt(cadValCAD)}
                          </span>
                        </div>
                        <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                          <div style={{ height:4, background:"#34d399", borderRadius:2,
                            width:`${cadPct}%`, transition:"width 0.5s" }}/>
                        </div>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", marginTop:3 }}>
                          {(grandTotal > 0 ? (cadValCAD / grandTotal * 100) : 0).toFixed(1)}% of {label}
                        </p>
                      </div>
                      {/* Cash row */}
                      {cash > 0 && (() => {
                        const cashPct = grandTotal > 0 ? (cash / grandTotal) * 100 : 0;
                        return (
                          <div>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                              <span style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>Cash</span>
                              <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#94a3b8" }}>
                                C${fmt(cash)}
                              </span>
                            </div>
                            <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                              <div style={{ height:4, background:"#94a3b8", borderRadius:2,
                                width:`${cashPct}%`, transition:"width 0.5s" }}/>
                            </div>
                            <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)", marginTop:3 }}>
                              {cashPct.toFixed(1)}% of {label}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Top holdings */}
                {topHoldings.length > 0 && (
                  <div>
                    <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                      color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>
                      Top Holdings
                    </p>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {topHoldings.map((h, i) => {
                        const barPct = (h.valueCAD / maxVal) * 100;
                        const isUSD = getTickerCurrency(h.ticker, h.currencyOverride) === "USD";
                        const dispVal = isUSD
                          ? `US$${fmt(h.current)}`
                          : `C$${fmt(h.current)}`;
                        const acctPct = totalCAD > 0 ? (h.valueCAD / totalCAD) * 100 : 0;
                        return (
                          <div key={h.ticker}>
                            <div style={{ display:"flex", justifyContent:"space-between",
                              alignItems:"baseline", marginBottom:3 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                                  fontWeight:600, color }}>
                                  {i+1}. {h.ticker}
                                </span>
                                <span style={{ fontSize:9, color: isUSD ? "#60a5fa" : "#34d399",
                                  padding:"0px 5px", borderRadius:3,
                                  background: isUSD ? "rgba(96,165,250,0.1)" : "rgba(52,211,153,0.1)",
                                  border: `1px solid ${isUSD ? "rgba(96,165,250,0.2)" : "rgba(52,211,153,0.2)"}` }}>
                                  {isUSD ? "USD" : "CAD"}
                                </span>
                              </div>
                              <div style={{ textAlign:"right" }}>
                                <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                                  color:"rgba(255,255,255,0.75)", fontWeight:500 }}>
                                  {dispVal}
                                </span>
                                <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginLeft:5 }}>
                                  {acctPct.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:2 }}>
                              <div style={{ height:3, borderRadius:2, transition:"width 0.5s",
                                background:`linear-gradient(90deg, ${color}bb, ${color}55)`,
                                width:`${barPct}%` }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Holdings breakdown pie chart */}
                {(() => {
                  const holdingSlices = acctH
                    .map((h, i) => ({
                      label: h.ticker,
                      valueCAD: toCAD(h.current, h.ticker, h.currencyOverride),
                      color: PIE_COLORS[i % PIE_COLORS.length],
                    }))
                    .filter(s => s.valueCAD > 0)
                    .sort((a, b) => b.valueCAD - a.valueCAD);
                  if (cash > 0) {
                    holdingSlices.push({ label: "CASH", valueCAD: cash, color: "#94a3b8" });
                  }
                  const slices = holdingSlices.map(s => ({
                    ...s,
                    pct: grandTotal > 0 ? (s.valueCAD / grandTotal) * 100 : 0,
                  }));
                  if (slices.length === 0) return null;
                  return (
                    <div>
                      <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                        color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:10 }}>
                        Holdings Breakdown
                      </p>
                      <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                        <PieChart slices={slices} size={130} />
                        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5,
                          overflowY:"auto", maxHeight:130 }}>
                          {slices.map(s => (
                            <div key={s.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <div style={{ width:8, height:8, borderRadius:2,
                                background:s.color, flexShrink:0 }}/>
                              <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                                fontWeight:600, color:"rgba(255,255,255,0.75)", flex:1 }}>
                                {s.label}
                              </span>
                              <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                                color:"rgba(255,255,255,0.4)" }}>
                                {s.pct.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Income & alerts row */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div style={{ background:"rgba(167,139,250,0.05)", border:"1px solid rgba(167,139,250,0.15)",
                    borderRadius:8, padding:"10px 12px" }}>
                    <p style={{ fontSize:9, color:"rgba(167,139,250,0.7)", letterSpacing:"0.1em",
                      textTransform:"uppercase", marginBottom:5 }}>Annual Dividends</p>
                    <p style={{ fontSize:16, fontFamily:"'JetBrains Mono',monospace",
                      fontWeight:700, color:"#a78bfa" }}>
                      C${fmt(divCAD)}
                    </p>
                    {whtCAD > 1 && (
                      <p style={{ fontSize:9, color:"#f97316", marginTop:3 }}>
                        −C${fmt(whtCAD)} WHT drag
                      </p>
                    )}
                    {whtCAD > 1 && (
                      <p style={{ fontSize:9, color:"#34d399", marginTop:1 }}>
                        = C${fmt(effDiv)} net
                      </p>
                    )}
                  </div>
                  <div style={{
                    background: Math.abs(targetSum - 100) > 0.5
                      ? "rgba(249,115,22,0.05)" : "rgba(52,211,153,0.05)",
                    border: `1px solid ${Math.abs(targetSum - 100) > 0.5 ? "rgba(249,115,22,0.2)" : "rgba(52,211,153,0.2)"}`,
                    borderRadius:8, padding:"10px 12px"
                  }}>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em",
                      textTransform:"uppercase", marginBottom:5 }}>Target Weights</p>
                    <p style={{ fontSize:16, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                      color: Math.abs(targetSum - 100) > 0.5 ? "#f97316" : "#34d399" }}>
                      {targetSum}%
                    </p>
                    <p style={{ fontSize:9, marginTop:3,
                      color: Math.abs(targetSum - 100) > 0.5 ? "#f97316" : "rgba(52,211,153,0.7)" }}>
                      {Math.abs(targetSum - 100) > 0.5
                        ? `⚠ Off by ${Math.abs(targetSum - 100).toFixed(1)}%`
                        : "✓ Balanced"}
                    </p>
                  </div>
                </div>

                {/* Concentration warnings inside panel */}
                {concWarns.length > 0 && (
                  <div style={{ background:"rgba(249,115,22,0.04)", border:"1px solid rgba(249,115,22,0.18)",
                    borderLeft:"3px solid #f97316", borderRadius:8, padding:"8px 12px" }}>
                    <p style={{ fontSize:9, color:"#f97316", fontWeight:600, marginBottom:4 }}>
                      ⚠ Concentration risk
                    </p>
                    {concWarns.map(h => (
                      <p key={h.ticker} style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>
                        <strong style={{ color:"#f97316" }}>{h.ticker}</strong>{" "}
                        {((toCAD(h.current, h.ticker, h.currencyOverride) / totalCAD) * 100).toFixed(1)}%
                        {" "}— exceeds 20% allocation
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div style={{ padding:"22px 28px" }}>
            {/* ── Header label ── */}
            <div style={{ marginBottom:18, display:"flex", alignItems:"flex-end",
              justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <p style={{ fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.3)", fontWeight:600 }}>Portfolio Dashboard</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.28)", marginTop:3 }}>
                  Combined view — TFSA + RRSP · 1 USD = {usdCadRate} CAD
                </p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:4 }}>Total Holdings</p>
                <p style={{ fontSize:30, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  color:"#a78bfa", lineHeight:1 }}>
                  C${fmt(combGrandTotal)}
                </p>
                <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:5, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, color:"#fbbf24" }}>
                    TFSA C${fmt(tfsaGrandTotal)}
                  </span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>·</span>
                  <span style={{ fontSize:10, color:"#22d3ee" }}>
                    RRSP C${fmt(rrspGrandTotal)}
                  </span>
                  {combCashTotal > 0 && (
                    <>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>·</span>
                      <span style={{ fontSize:10, color:"#94a3b8" }}>
                        Cash C${fmt(combCashTotal)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Row 1: Combined summary stats ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:10, marginBottom:20 }}>

              {/* Combined total */}
              <div className="stat-card" style={{ "--accent":"#a78bfa" }}>
                <p style={{ fontSize:9, letterSpacing:"0.13em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>Total Portfolio</p>
                <p style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  color:"#a78bfa", marginBottom:4 }}>
                  C${fmt(combGrandTotal)}
                </p>
                <p style={{ fontSize:10, color:"rgba(96,165,250,0.85)" }}>
                  US${fmt(combGrandTotal / usdCadRate)} equiv.
                </p>
              </div>

              {/* TFSA total */}
              <div className="stat-card" style={{ "--accent":"#fbbf24" }}>
                <p style={{ fontSize:9, letterSpacing:"0.13em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>TFSA</p>
                <p style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  color:"#fbbf24", marginBottom:4 }}>
                  C${fmt(tfsaGrandTotal)}
                </p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:9, color:"#60a5fa" }}>US${fmt(tfsaUSDNative)}</span>
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>·</span>
                  <span style={{ fontSize:9, color:"#34d399" }}>C${fmt(tfsaCADValCAD)}</span>
                  {tfsaCash > 0 && (
                    <>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>·</span>
                      <span style={{ fontSize:9, color:"#94a3b8" }}>C${fmt(tfsaCash)} cash</span>
                    </>
                  )}
                </div>
              </div>

              {/* RRSP total */}
              <div className="stat-card" style={{ "--accent":"#22d3ee" }}>
                <p style={{ fontSize:9, letterSpacing:"0.13em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>RRSP</p>
                <p style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  color:"#22d3ee", marginBottom:4 }}>
                  C${fmt(rrspGrandTotal)}
                </p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:9, color:"#60a5fa" }}>US${fmt(rrspUSDNative)}</span>
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>·</span>
                  <span style={{ fontSize:9, color:"#34d399" }}>C${fmt(rrspCADValCAD)}</span>
                  {rrspCash > 0 && (
                    <>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>·</span>
                      <span style={{ fontSize:9, color:"#94a3b8" }}>C${fmt(rrspCash)} cash</span>
                    </>
                  )}
                </div>
              </div>

              {/* Combined P&L */}
              <div className="stat-card" style={{ "--accent": combPnL !== null ? (combPnL >= 0 ? "#34d399" : "#ef4444") : "#475569" }}>
                <p style={{ fontSize:9, letterSpacing:"0.13em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>Combined P&L</p>
                {combPnL !== null ? (
                  <>
                    <p style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                      color: pnlColor(combPnL), marginBottom:4 }}>
                      {pnlSign(combPnL)}C${fmt(combPnL)}
                    </p>
                    <p style={{ fontSize:10, color: pnlColor(combPnL), opacity:0.8 }}>
                      {pnlSign(combPnL)}{combPnLPct.toFixed(1)}% total return
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize:14, color:"rgba(255,255,255,0.2)", fontFamily:"'JetBrains Mono',monospace" }}>—</p>
                )}
              </div>

              {/* Annual dividends */}
              <div className="stat-card" style={{ "--accent":"#a78bfa" }}>
                <p style={{ fontSize:9, letterSpacing:"0.13em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>Annual Dividends</p>
                <p style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  color:"#a78bfa", marginBottom:4 }}>
                  C${fmt(combDivCAD)}
                </p>
                {tfsaWHTCAD > 1 && (
                  <p style={{ fontSize:9, color:"#f97316" }}>
                    −C${fmt(tfsaWHTCAD)} WHT drag (TFSA)
                  </p>
                )}
              </div>

              {/* USD exposure */}
              <div className="stat-card" style={{ "--accent":"#60a5fa" }}>
                <p style={{ fontSize:9, letterSpacing:"0.13em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>USD Exposure</p>
                <p style={{ fontSize:22, fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  color:"#60a5fa", marginBottom:4 }}>
                  US${fmt(combUSDNative)}
                </p>
                <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>
                  {combGrandTotal > 0 ? ((combUSDValCAD / combGrandTotal) * 100).toFixed(1) : 0}% of combined
                </p>
              </div>

            </div>

            {/* ── Row 2: Account split + currency donut ── */}
            <div className="card" style={{ marginBottom:20, padding:"16px 20px" }}>
              <div style={{ display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>

                {/* Account split bar */}
                <div style={{ flex:"1 1 260px" }}>
                  <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                    color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:10 }}>Account Allocation</p>
                  <div style={{ height:20, borderRadius:6, overflow:"hidden", display:"flex", marginBottom:8 }}>
                    <div style={{ width:`${tfsaAcctPct}%`, background:"linear-gradient(90deg,#fbbf24,#f59e0b)",
                      display:"flex", alignItems:"center", justifyContent:"center", transition:"width 0.5s",
                      minWidth: tfsaAcctPct > 5 ? "auto" : 0 }}>
                      {tfsaAcctPct > 8 && (
                        <span style={{ fontSize:9, fontWeight:700, color:"rgba(0,0,0,0.65)" }}>
                          TFSA {tfsaAcctPct.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div style={{ width:`${rrspAcctPct}%`, background:"linear-gradient(90deg,#22d3ee,#06b6d4)",
                      display:"flex", alignItems:"center", justifyContent:"center", transition:"width 0.5s" }}>
                      {rrspAcctPct > 8 && (
                        <span style={{ fontSize:9, fontWeight:700, color:"rgba(0,0,0,0.65)" }}>
                          RRSP {rrspAcctPct.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, color:"#fbbf24" }}>
                      TFSA — C${fmt(tfsaGrandTotal)}
                    </span>
                    <span style={{ fontSize:10, color:"#22d3ee" }}>
                      RRSP — C${fmt(rrspGrandTotal)}
                    </span>
                  </div>
                </div>

                <div style={{ width:1, height:60, background:"rgba(255,255,255,0.07)", flexShrink:0 }}/>

                {/* Currency donut */}
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <DonutChart
                    segments={combCurrSegments} size={80} thickness={13}
                    centerLabel={combGrandTotal > 0 ? `${((combUSDValCAD / combGrandTotal) * 100).toFixed(0)}%` : "—"}
                    centerSub="USD"
                  />
                  <div>
                    <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                      color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:8 }}>Combined Currency</p>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:"#60a5fa", flexShrink:0 }}/>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>
                        USD — US${fmt(combUSDNative)}
                        <span style={{ color:"rgba(255,255,255,0.3)", marginLeft:4 }}>
                          (C${fmt(combUSDValCAD)})
                        </span>
                      </span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom: combCashTotal > 0 ? 5 : 0 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:"#34d399", flexShrink:0 }}/>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>
                        CAD — C${fmt(combCADNative)}
                      </span>
                    </div>
                    {combCashTotal > 0 && (
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:"#94a3b8", flexShrink:0 }}/>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>
                          Cash — C${fmt(combCashTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ width:1, height:60, background:"rgba(255,255,255,0.07)", flexShrink:0 }}/>

                {/* WHT summary */}
                {tfsaWHTCAD > 1 && (
                  <div style={{ background:"rgba(249,115,22,0.05)", border:"1px solid rgba(249,115,22,0.2)",
                    borderRadius:8, padding:"10px 14px", minWidth:160 }}>
                    <p style={{ fontSize:9, color:"#f97316", letterSpacing:"0.1em",
                      textTransform:"uppercase", marginBottom:5 }}>WHT Annual Drag</p>
                    <p style={{ fontSize:18, fontFamily:"'JetBrains Mono',monospace",
                      fontWeight:700, color:"#f97316" }}>
                      −C${fmt(tfsaWHTCAD)}
                    </p>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginTop:3, lineHeight:1.4 }}>
                      IRS withholds 15% on US dividends in TFSA
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Row 3: TFSA | RRSP account panels ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(360px, 1fr))", gap:14, marginBottom:20 }}>
              <AccountPanel
                label="TFSA" color="#fbbf24" rgb="251,191,36"
                holdings={tfsaH} totalCAD={tfsaTotalCAD}
                grandTotal={tfsaGrandTotal} cash={tfsaCash}
                usdValCAD={tfsaUSDValCAD} cadValCAD={tfsaCADValCAD} usdNative={tfsaUSDNative}
                topHoldings={tfsaTop} maxVal={tfsaMaxVal}
                divCAD={tfsaDivCAD} whtCAD={tfsaWHTCAD}
                pnL={tfsaPnL} costCAD={tfsaCostCAD}
                targetSum={tfsaTargetSum}
                currSegments={tfsaCurrSegments}
                concWarns={tfsaConc}
              />
              <AccountPanel
                label="RRSP" color="#22d3ee" rgb="34,211,238"
                holdings={rrspH} totalCAD={rrspTotalCAD}
                grandTotal={rrspGrandTotal} cash={rrspCash}
                usdValCAD={rrspUSDValCAD} cadValCAD={rrspCADValCAD} usdNative={rrspUSDNative}
                topHoldings={rrspTop} maxVal={rrspMaxVal}
                divCAD={rrspDivCAD} whtCAD={0}
                pnL={rrspPnL} costCAD={rrspCostCAD}
                targetSum={rrspTargetSum}
                currSegments={rrspCurrSegments}
                concWarns={rrspConc}
              />
            </div>

            {/* ── Row 4: Combined top holdings ── */}
            {allTop.length > 0 && (
              <div className="card" style={{ marginBottom:20 }}>
                <p style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
                  color:"rgba(255,255,255,0.28)", fontWeight:600, marginBottom:14 }}>
                  Combined Top Holdings — largest positions across both accounts
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {allTop.map((h, i) => {
                    const isUSD = getTickerCurrency(h.ticker, h.currencyOverride) === "USD";
                    const barPct = (h.valueCAD / allMaxVal) * 100;
                    const acctColor = h.acct === "TFSA" ? "#fbbf24" : "#22d3ee";
                    const pct = combTotalCAD > 0 ? (h.valueCAD / combTotalCAD) * 100 : 0;
                    const dispVal = isUSD ? `US$${fmt(h.current)}` : `C$${fmt(h.current)}`;
                    return (
                      <div key={`${h.acct}-${h.ticker}`} style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)",
                          fontFamily:"'JetBrains Mono',monospace", minWidth:18, textAlign:"right" }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                          fontWeight:600, color:acctColor, minWidth:56 }}>
                          {h.ticker}
                        </span>
                        <span style={{ fontSize:9, padding:"1px 6px", borderRadius:3, minWidth:36, textAlign:"center",
                          background: h.acct === "TFSA" ? "rgba(251,191,36,0.1)" : "rgba(34,211,238,0.1)",
                          color:acctColor,
                          border:`1px solid ${h.acct === "TFSA" ? "rgba(251,191,36,0.22)" : "rgba(34,211,238,0.22)"}` }}>
                          {h.acct}
                        </span>
                        <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.05)", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:6, borderRadius:3, transition:"width 0.5s",
                            background:`linear-gradient(90deg, ${acctColor}cc, ${acctColor}44)`,
                            width:`${barPct}%` }}/>
                        </div>
                        <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                          color:"rgba(255,255,255,0.7)", minWidth:96, textAlign:"right" }}>
                          {dispVal}
                        </span>
                        <span style={{ fontSize:9, color:"rgba(255,255,255,0.28)",
                          minWidth:38, textAlign:"right" }}>
                          {pct.toFixed(1)}%
                        </span>
                        <span style={{ fontSize:9, padding:"1px 5px", borderRadius:3,
                          background: isUSD ? "rgba(96,165,250,0.1)" : "rgba(52,211,153,0.1)",
                          color: isUSD ? "#60a5fa" : "#34d399",
                          border:`1px solid ${isUSD ? "rgba(96,165,250,0.18)" : "rgba(52,211,153,0.18)"}` }}>
                          {isUSD ? "USD" : "CAD"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Row 5: Portfolio health summary ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:10, marginBottom:14 }}>

              {/* WHT recovery opportunity */}
              {tfsaWHTCAD > 1 && (
                <div style={{ background:"rgba(249,115,22,0.04)", border:"1px solid rgba(249,115,22,0.18)",
                  borderLeft:"3px solid #f97316", borderRadius:10, padding:"12px 14px" }}>
                  <p style={{ fontSize:9, color:"#f97316", fontWeight:700, letterSpacing:"0.08em",
                    textTransform:"uppercase", marginBottom:6 }}>WHT Recovery</p>
                  <p style={{ fontSize:14, fontFamily:"'JetBrains Mono',monospace",
                    fontWeight:700, color:"#fb923c", marginBottom:4 }}>
                    C${fmt(tfsaWHTCAD)}/yr
                  </p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.5 }}>
                    Moving US dividend payers from TFSA → RRSP recovers this permanently under the Canada–US Tax Treaty.
                  </p>
                </div>
              )}

              {/* Dividend income breakdown */}
              {combDivCAD > 1 && (
                <div style={{ background:"rgba(167,139,250,0.04)", border:"1px solid rgba(167,139,250,0.18)",
                  borderLeft:"3px solid #a78bfa", borderRadius:10, padding:"12px 14px" }}>
                  <p style={{ fontSize:9, color:"#a78bfa", fontWeight:700, letterSpacing:"0.08em",
                    textTransform:"uppercase", marginBottom:6 }}>Income Breakdown</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>TFSA dividends</span>
                      <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>
                        C${fmt(tfsaDivCAD)}/yr
                      </span>
                    </div>
                    {tfsaWHTCAD > 1 && (
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>  WHT deducted</span>
                        <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#f97316" }}>
                          −C${fmt(tfsaWHTCAD)}/yr
                        </span>
                      </div>
                    )}
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>RRSP dividends</span>
                      <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#22d3ee" }}>
                        C${fmt(rrspDivCAD)}/yr
                      </span>
                    </div>
                    <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", marginTop:3, paddingTop:5,
                      display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)", fontWeight:600 }}>Net received</span>
                      <span style={{ fontSize:13, fontFamily:"'JetBrains Mono',monospace",
                        color:"#a78bfa", fontWeight:700 }}>
                        C${fmt(combDivCAD - tfsaWHTCAD)}/yr
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sector gaps */}
              {(() => {
                const gapList = detectGaps(tfsaH, rrspH);
                return gapList.length > 0 ? (
                  <div style={{ background:"rgba(249,115,22,0.04)", border:"1px solid rgba(249,115,22,0.18)",
                    borderLeft:"3px solid #f97316", borderRadius:10, padding:"12px 14px" }}>
                    <p style={{ fontSize:9, color:"#f97316", fontWeight:700, letterSpacing:"0.08em",
                      textTransform:"uppercase", marginBottom:6 }}>Sector Gaps</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:7 }}>
                      {gapList.map(g => (
                        <span key={g} className="gap-badge">{g}</span>
                      ))}
                    </div>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", lineHeight:1.5 }}>
                      No positions in these sectors across both accounts.
                    </p>
                  </div>
                ) : (
                  <div style={{ background:"rgba(52,211,153,0.04)", border:"1px solid rgba(52,211,153,0.18)",
                    borderLeft:"3px solid #34d399", borderRadius:10, padding:"12px 14px" }}>
                    <p style={{ fontSize:9, color:"#34d399", fontWeight:700, letterSpacing:"0.08em",
                      textTransform:"uppercase", marginBottom:6 }}>Sector Coverage</p>
                    <p style={{ fontSize:14, color:"#34d399" }}>✓ All sectors covered</p>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:4 }}>
                      Your portfolio spans all tracked sectors.
                    </p>
                  </div>
                );
              })()}

              {/* Cost basis summary */}
              {combCostCAD > 0 && (
                <div style={{ background:"rgba(148,163,184,0.04)", border:"1px solid rgba(148,163,184,0.15)",
                  borderLeft:"3px solid #64748b", borderRadius:10, padding:"12px 14px" }}>
                  <p style={{ fontSize:9, color:"rgba(148,163,184,0.7)", fontWeight:700, letterSpacing:"0.08em",
                    textTransform:"uppercase", marginBottom:6 }}>Cost Basis</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>TFSA invested</span>
                      <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#fbbf24" }}>
                        C${fmt(tfsaCostCAD)}
                      </span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>RRSP invested</span>
                      <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:"#22d3ee" }}>
                        C${fmt(rrspCostCAD)}
                      </span>
                    </div>
                    <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", marginTop:3, paddingTop:5,
                      display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)", fontWeight:600 }}>Total invested</span>
                      <span style={{ fontSize:13, fontFamily:"'JetBrains Mono',monospace",
                        color:"#94a3b8", fontWeight:700 }}>
                        C${fmt(combCostCAD)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)", lineHeight:1.5 }}>
              ⚠ Not financial advice. Data stored locally in your browser. Export regularly to back up. Consult a licensed CFP before trading.
            </p>
          </div>
        );
      })()}
    </div>
  );
}
