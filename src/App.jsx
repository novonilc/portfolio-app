import { useState, useEffect, useRef } from "react";
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

// Options constants
const SECTOR_IV_MULT = {
  "Semiconductor":3.0, "Technology":2.4, "Aerospace/Defense":1.6,
  "Healthcare":1.7, "Financials":1.3, "Energy":2.0, "Payments":1.6,
  "Consumer Staples":1.1, "Consumer Cyclical":1.9, "Industrials":1.6,
  "Real Estate":1.5, "Utilities":1.2,
};
const OPT_EXPIRIES = [
  { label:"21 DTE",  days:21 },
  { label:"30 DTE",  days:30 },
  { label:"45 DTE",  days:45 },
];
const OPT_STATUS_LABELS = {
  open:"Open", expired:"Expired worthless",
  assigned:"Assigned", closed_profit:"Closed — profit", closed_loss:"Closed — loss",
};
const DEFAULT_OPT_TRADE = {
  type:"cc", ticker:"", account:"TFSA", contracts:1,
  strike:"", expiry:"", premium:"", underlyingPrice:"", notes:"",
};

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
  const [backupStatus,     setBackupStatus]    = useState("");
  const [autoSaveAt,       setAutoSaveAt]      = useState(() => localStorage.getItem("portfolio:autosave:ts") || null);
  const autoSaveRef = useRef(null);
  // Options trading
  const [optionTrades,        setOptionTrades]       = useState([]);
  const [optionPrices,        setOptionPrices]       = useState({});
  const [optionPricesLoading, setOptionPricesLoading]= useState(false);
  const [optionPriceError,    setOptionPriceError]   = useState(null);
  const [optionSubTab,        setOptionSubTab]       = useState("cc");
  const [optionNewTrade,      setOptionNewTrade]     = useState(null);
  const [optionClosing,       setOptionClosing]      = useState(null);
  const [optionWatchlist,     setOptionWatchlist]    = useState(() => JSON.parse(localStorage.getItem("portfolio:options:watchlist") || "[]"));
  const [optionWatchInput,    setOptionWatchInput]   = useState("");
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
    try {
      const c = localStorage.getItem("pulse:cache");
      if (!c) return marketPulseData;
      const cached = JSON.parse(c);
      // Backfill any fields added after the cache was written (e.g. newsSignals)
      return { ...marketPulseData, ...cached };
    } catch { return marketPulseData; }
  });
  const [pulseLoading,     setPulseLoading]    = useState(false);
  const [pulseError,       setPulseError]      = useState(null);
  const [pulseRefreshedAt, setPulseRefreshedAt]= useState(() => localStorage.getItem("pulse:refreshedAt") || null);
  const [pulseCopyLoading, setPulseCopyLoading]= useState(false);
  const [pulseCopied,      setPulseCopied]     = useState(false);
  const [pulsePasteOpen,   setPulsePasteOpen]  = useState(false);
  const [pulsePasteText,   setPulsePasteText]  = useState("");
  // Quick-trade state for Action Center
  const [pulseTradeOpen,   setPulseTradeOpen]  = useState(null); // actionIdx or null
  const [pulseTradeAcct,   setPulseTradeAcct]  = useState("TFSA");
  const [pulseTradeAmt,    setPulseTradeAmt]   = useState("");
  const [pulseReducePct,   setPulseReducePct]  = useState(25);
  const [pulseTradeLog,    setPulseTradeLog]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("pulse:tradeLog") || "[]"); } catch { return []; }
  });
  const [pulseTradeFlash,  setPulseTradeFlash] = useState(null); // { msg, ok }
  const [pulsePasteError,  setPulsePasteError] = useState(null);
  const [pulseApplyDone,   setPulseApplyDone]  = useState(false);
  const [brokerImportLoading, setBrokerImportLoading] = useState(false);
  const [brokerImportError,   setBrokerImportError]   = useState(null);
  const [brokerImportPreview, setBrokerImportPreview] = useState(null); // { rows, summary }
  const [aiTargetsLoading,    setAiTargetsLoading]    = useState(false);
  const [aiTargetsError,      setAiTargetsError]      = useState(null);
  const [aiTargetsPreview,    setAiTargetsPreview]    = useState(null); // { suggestions, account }
  const [diversifyLoading,    setDiversifyLoading]    = useState(false);
  const [diversifyError,      setDiversifyError]      = useState(null);
  const [diversifySuggestions,setDiversifySuggestions]= useState(() => {
    try { return JSON.parse(localStorage.getItem("diversify:suggestions") || "null"); } catch { return null; }
  });
  const [aiOptionsLoading,    setAiOptionsLoading]    = useState(false);
  const [aiOptionsError,      setAiOptionsError]      = useState(null);
  const [aiOptionsAnalysis,   setAiOptionsAnalysis]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("options:aiAnalysis") || "null"); } catch { return null; }
  });

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
      const optData = localStorage.getItem("portfolio:options");
      if (optData) setOptionTrades(JSON.parse(optData));
    } catch (e) { console.warn("Could not load saved data:", e); }
  }, []);

  // Keep the ref pointing at the latest state on every render — lets the
  // interval fire without needing to re-mount when state changes.
  autoSaveRef.current = () => {
    try {
      const snapshot = JSON.stringify({
        backupVersion: 2,
        exportedAt: new Date().toISOString(),
        portfolios,
        holdings,
        cashHolding,
        contribPlan,
        usdCadRate,
        pulse: { cache: marketPulse, refreshedAt: pulseRefreshedAt },
      });
      localStorage.setItem("portfolio:autosave", snapshot);
      const ts = new Date().toISOString();
      localStorage.setItem("portfolio:autosave:ts", ts);
      setAutoSaveAt(ts);
    } catch (e) { console.warn("Auto-save failed:", e); }
  };

  // Periodic auto-save every 5 minutes
  useEffect(() => {
    const id = setInterval(() => autoSaveRef.current?.(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Debounced auto-save — 10 s after the last meaningful data change
  useEffect(() => {
    const t = setTimeout(() => autoSaveRef.current?.(), 10_000);
    return () => clearTimeout(t);
  }, [holdings, cashHolding, contribPlan, usdCadRate]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Options trading helpers ─────────────────────────────────────────────
  function persistOptions(next) {
    localStorage.setItem("portfolio:options", JSON.stringify(next));
  }

  function persistWatchlist(next) {
    localStorage.setItem("portfolio:options:watchlist", JSON.stringify(next));
  }

  function addWatchlistTicker(raw) {
    const sym = raw.trim().toUpperCase().replace(/[^A-Z0-9.^-]/g, "");
    if (!sym || optionWatchlist.includes(sym)) return;
    const next = [...optionWatchlist, sym];
    setOptionWatchlist(next);
    persistWatchlist(next);
    setOptionWatchInput("");
  }

  function removeWatchlistTicker(sym) {
    const next = optionWatchlist.filter(s => s !== sym);
    setOptionWatchlist(next);
    persistWatchlist(next);
  }

  async function fetchOptionPrices() {
    setOptionPricesLoading(true);
    setOptionPriceError(null);
    const tickers = [...new Set(
      portfolios.flatMap(p => (holdings[p] || []).map(h => h.ticker))
        .concat(RECOMMENDATIONS.map(r => r.ticker))
        .concat(optionWatchlist)
    )];
    const prices = {};
    await Promise.allSettled(tickers.map(async sym => {
      try {
        const r = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`,
          { signal: AbortSignal.timeout(7000) }
        );
        if (!r.ok) return;
        const d = await r.json();
        const closes = d.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
        const last = closes?.filter(Boolean).pop();
        if (last) prices[sym] = last;
      } catch { /* silent */ }
    }));
    setOptionPrices(prices);
    setOptionPricesLoading(false);
    if (!Object.keys(prices).length) setOptionPriceError("Could not fetch prices — check your connection.");
  }

  function estimateIV(ticker, vix = 17) {
    const rec = TICKER_DB[ticker];
    const sector = rec?.sector || "";
    const mult = SECTOR_IV_MULT[sector] || 1.8;
    return vix * mult;
  }

  // Simplified Black-Scholes inspired premium estimate (annualised IV in %)
  function estimatePremium(price, strikeDistance, daysToExpiry, annualIVpct) {
    const T = daysToExpiry / 365;
    const IV = annualIVpct / 100;
    const moneyness = Math.abs(strikeDistance) / price;
    const atm = price * IV * Math.sqrt(T) * 0.4;
    return Math.max(atm * Math.exp(-3.8 * moneyness), 0.01);
  }

  // Three strike suggestions for a given strategy direction
  function getStrikeSuggestions(price, type, daysToExpiry, iv) {
    const offsets = type === "cc"
      ? [0.05, 0.08, 0.12]   // OTM call: 5%, 8%, 12% above
      : [0.05, 0.09, 0.13];  // OTM put: 5%, 9%, 13% below
    return offsets.map((pct, i) => {
      const strike = type === "cc"
        ? Math.round(price * (1 + pct) * 2) / 2   // round to $0.50
        : Math.round(price * (1 - pct) * 2) / 2;
      const dist = Math.abs(strike - price);
      const premiumPerShare = estimatePremium(price, dist, daysToExpiry, iv);
      const contractPremium = premiumPerShare * 100;
      const collateral = type === "csp" ? strike * 100 : price * 100;
      const monthlyYield = (contractPremium / collateral) * (30 / daysToExpiry) * 100;
      return {
        label: ["Conservative","Moderate","Aggressive"][i],
        strike,
        pct: Math.round(pct * 100),
        premiumPerShare: Math.round(premiumPerShare * 100) / 100,
        contractPremium: Math.round(contractPremium),
        monthlyYield: Math.round(monthlyYield * 10) / 10,
        annualYield:  Math.round(monthlyYield * 12 * 10) / 10,
      };
    });
  }

  function addOptionTrade(tradeRaw) {
    const trade = {
      ...tradeRaw,
      id: Date.now().toString(),
      openedAt: new Date().toISOString().split("T")[0],
      status: "open",
      closePrice: null,
      closedAt: null,
    };
    const next = [trade, ...optionTrades];
    setOptionTrades(next);
    persistOptions(next);
    setOptionNewTrade(null);
  }

  function closeOptionTrade(id, status, closePrice) {
    const next = optionTrades.map(t =>
      t.id === id
        ? { ...t, status, closePrice: Number(closePrice) || 0, closedAt: new Date().toISOString().split("T")[0] }
        : t
    );
    setOptionTrades(next);
    persistOptions(next);
    setOptionClosing(null);
  }

  function deleteOptionTrade(id) {
    const next = optionTrades.filter(t => t.id !== id);
    setOptionTrades(next);
    persistOptions(next);
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

  // ── Pulse Quick Trade helpers ──────────────────────────────────────────
  function logPulseTrade(entry) {
    const next = [entry, ...pulseTradeLog].slice(0, 50);
    setPulseTradeLog(next);
    localStorage.setItem("pulse:tradeLog", JSON.stringify(next));
  }

  function executePulseBuy(ticker, name, acct, amtStr) {
    const amt = parseFloat(amtStr);
    if (!amt || amt <= 0) { setPulseTradeFlash({ msg:"Enter a valid amount", ok:false }); return; }
    const next = { ...holdings };
    const idx = next[acct].findIndex(h => h.ticker === ticker);
    if (idx >= 0) {
      next[acct] = [...next[acct]];
      next[acct][idx] = { ...next[acct][idx], current: next[acct][idx].current + amt };
    } else {
      next[acct] = [...next[acct], {
        ticker, name: name || ticker, current: amt, costBasis: amt,
        target: 0, divYield: 0, cagr: DEFAULT_CAGR[ticker] || 10,
        currencyOverride: "", locked: "✅ Keep", notes: "Added from Market Pulse action.",
      }];
    }
    setHoldings(next);
    persist(acct, next[acct]);
    logPulseTrade({ date: new Date().toISOString(), ticker, type:"Buy", account: acct, amount: amt, note:`+C$${amt.toLocaleString()}` });
    setPulseTradeFlash({ msg:`✓ Added C$${amt.toLocaleString()} of ${ticker} to ${acct}`, ok:true });
    setPulseTradeAmt("");
    setPulseTradeOpen(null);
    setTimeout(() => setPulseTradeFlash(null), 4000);
  }

  function executePulseReduce(ticker, acct, reducePct) {
    const next = { ...holdings };
    const idx = next[acct]?.findIndex(h => h.ticker === ticker);
    if (idx === undefined || idx < 0) { setPulseTradeFlash({ msg:`${ticker} not found in ${acct}`, ok:false }); return; }
    const holding = next[acct][idx];
    const removed = holding.current * (reducePct / 100);
    const newVal  = Math.max(0, holding.current - removed);
    next[acct] = [...next[acct]];
    next[acct][idx] = { ...holding, current: newVal };
    setHoldings(next);
    persist(acct, next[acct]);
    logPulseTrade({ date: new Date().toISOString(), ticker, type:"Reduce", account: acct, amount: -removed, note:`-${reducePct}% → C$${Math.round(newVal).toLocaleString()} remaining` });
    setPulseTradeFlash({ msg:`✓ Reduced ${ticker} by ${reducePct}% in ${acct} — C$${Math.round(newVal).toLocaleString()} remaining`, ok:true });
    setPulseTradeOpen(null);
    setTimeout(() => setPulseTradeFlash(null), 4000);
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

  function relTime(ts) {
    if (!ts) return null;
    const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function exportData() {
    const today = new Date().toISOString().split("T")[0];
    const data = JSON.stringify({
      backupVersion: 2,
      exportedAt: new Date().toISOString(),
      portfolios,
      holdings,
      cashHolding,
      contribPlan,
      usdCadRate,
      pulse: {
        cache:       marketPulse,
        refreshedAt: pulseRefreshedAt,
      },
    }, null, 2);
    const blob = new Blob([data], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `portfolio-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus("✓ Backup saved");
    setTimeout(() => setBackupStatus(""), 3000);
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
          setBackupStatus(`✓ Imported ${rows.length} holding${rows.length === 1 ? "" : "s"} from CSV`);
          setTimeout(() => setBackupStatus(""), 4000);
          event.target.value = "";
          return;
        }

        const data = JSON.parse(text);
        const h = data.holdings || data;
        if (!(h.TFSA && h.RRSP)) throw new Error("Invalid backup — missing TFSA/RRSP holdings");
        const pList = data.portfolios || ["TFSA","RRSP"];

        // Restore portfolios + holdings
        setPortfolios(pList);
        localStorage.setItem("portfolio:list", JSON.stringify(pList));
        setHoldings(h);
        for (const p of pList) { if (h[p]) persist(p, h[p]); }

        // Restore cash
        if (data.cashHolding) { setCashHolding(data.cashHolding); persistCash(data.cashHolding); }

        // Restore contrib plan (with frequency validation)
        if (data.contribPlan) {
          const nextContrib = Object.fromEntries(pList.map(p => {
            const existing = data.contribPlan?.[p];
            const freq = CONTRIB_FREQUENCY_OPTIONS.some(o => o.value === existing?.frequency)
              ? existing.frequency : "monthly";
            return [p, { amount: Number(existing?.amount) || 0, frequency: freq }];
          }));
          setContribPlan(nextContrib);
          persistContrib(nextContrib);
        } else if (data.monthlyContrib) {
          const nextContrib = Object.fromEntries(pList.map(p => [
            p, { amount: Number(data.monthlyContrib[p]) || 0, frequency:"monthly" },
          ]));
          setContribPlan(nextContrib);
          persistContrib(nextContrib);
        }

        // Restore FX rate
        if (data.usdCadRate) {
          setUsdCadRate(Number(data.usdCadRate));
          persistFxRate(Number(data.usdCadRate));
        }

        // Restore Market Pulse cache (v2 backup format)
        if (data.pulse?.cache?.regime) {
          setMarketPulse(data.pulse.cache);
          localStorage.setItem("pulse:cache", JSON.stringify(data.pulse.cache));
          if (data.pulse.refreshedAt) {
            setPulseRefreshedAt(data.pulse.refreshedAt);
            localStorage.setItem("pulse:refreshedAt", data.pulse.refreshedAt);
          }
        }

        const isFullBackup = !!data.backupVersion;
        setBackupStatus(isFullBackup ? "✓ Full backup restored" : "✓ Portfolio imported");
        setTimeout(() => setBackupStatus(""), 4000);
      } catch (err) {
        setBackupStatus(`⚠ ${err?.message || "Could not read file"}`);
        setTimeout(() => setBackupStatus(""), 5000);
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  // ── Broker CSV import via Claude ──────────────────────────────────────
  async function importBrokerHoldings(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";

    if (!claudeApiKey.trim()) {
      setBrokerImportError("Enter your Anthropic API key in the Market Pulse tab first.");
      return;
    }

    setBrokerImportLoading(true);
    setBrokerImportError(null);
    setBrokerImportPreview(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvText = String(e.target.result || "");
        const rate = usdCadRate || 1.38;

        // Pre-scan CSV to find tickers that are managed funds or private equity
        const csvLines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
        const rawHdrs  = parseCsvLine(csvLines[0] || "").map(h => h.toLowerCase().trim().replace(/\s+/g, " "));
        const secTypeIdx      = rawHdrs.findIndex(h => h === "security type");
        const classIdx        = rawHdrs.findIndex(h => h.includes("account classification"));
        const symbolIdx       = rawHdrs.findIndex(h => h === "symbol");
        const excludedTickers = new Set();
        for (let i = 1; i < csvLines.length; i++) {
          const cells = parseCsvLine(csvLines[i]);
          const secType = (cells[secTypeIdx] || "").toUpperCase().trim();
          const cls     = (cells[classIdx]   || "").toLowerCase().trim();
          const sym     = (cells[symbolIdx]  || "").toUpperCase().trim();
          if (sym && (secType === "MUTUAL_FUND" || cls === "managed")) excludedTickers.add(sym);
        }

        const prompt = `You are converting a Wealthsimple brokerage CSV export into portfolio app holdings.

Current USD/CAD rate: ${rate}

CSV data:
${csvText}

Rules:
- Include holdings where Quantity > 0 EXCEPT:
  - SKIP any row where Security Type is "MUTUAL_FUND" (private equity, managed funds)
  - SKIP any row where Account Classification is "Managed"
  - These tickers must be excluded entirely: ${[...excludedTickers].join(", ") || "none"}
- Use "Account Type" column to set the "account" field (TFSA, RRSP, RESP, or Crypto)
- For "current" (market value in CAD):
  - If "Market Value Currency" is CAD: use the "Market Value" column value
  - If "Market Value Currency" is USD: multiply "Market Value" by ${rate}
- Use "Book Value (CAD)" column for "costBasis"
- Use "Symbol" for "ticker", "Name" for "name"
- "currencyOverride": set to "USD" if the Market Value Currency is USD, "CAD" if CAD, else ""
- Suggest "target" % allocation per account (integers; each account's targets must sum to 100)
  - TFSA: favor no/low-dividend growth stocks (no IRS WHT drag)
  - RRSP: favor US-listed dividend/income stocks (WHT-exempt in RRSP)
  - RESP: keep proportional to current market values
  - Crypto: split proportionally by market value
- Estimate "divYield" (0–5) and "cagr" (5–20) per ticker
- Set "locked" to "✅ Keep" for all
- "notes": one-line rationale for the target

Return ONLY a valid JSON array — no markdown fences, no explanation.
Example element:
{"account":"TFSA","ticker":"NVDA","name":"NVIDIA Corp","current":1767.91,"costBasis":2053.54,"target":15,"divYield":0.03,"cagr":18,"currencyOverride":"USD","notes":"AI infrastructure leader","locked":"✅ Keep"}`;

        // Client-side safety filter applied after Claude responds (see below)

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
            max_tokens: 8000,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `API error ${res.status}`);
        }

        const data = await res.json();
        const text = (data.content?.[0]?.text || "").trim();
        const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        const rows = JSON.parse(stripped);

        if (!Array.isArray(rows) || !rows.length) throw new Error("Claude returned no holdings");

        // Client-side safety filter: remove any managed/private-equity tickers Claude may have slipped through
        const cleanRows = rows.filter(r => !excludedTickers.has((r.ticker || "").toUpperCase()));

        // Summarise by account
        const byAccount = {};
        for (const r of cleanRows) {
          const acct = r.account || "UNKNOWN";
          if (!byAccount[acct]) byAccount[acct] = { count: 0, totalCAD: 0 };
          byAccount[acct].count++;
          byAccount[acct].totalCAD += r.current || 0;
        }
        setBrokerImportPreview({ rows: cleanRows, byAccount, skipped: rows.length - cleanRows.length });
      } catch (err) {
        setBrokerImportError(err.message || "Failed to parse broker CSV");
      } finally {
        setBrokerImportLoading(false);
      }
    };
    reader.readAsText(file);
  }

  function applyBrokerImport() {
    if (!brokerImportPreview?.rows) return;
    try {
      applyCsvImport(brokerImportPreview.rows);
      setBackupStatus(`✓ Imported ${brokerImportPreview.rows.length} holdings from broker CSV`);
      setTimeout(() => setBackupStatus(""), 4000);
    } catch (err) {
      setBrokerImportError(err.message);
    }
    setBrokerImportPreview(null);
  }

  // ── AI target suggestions for the active account ──────────────────────
  async function suggestTargetsWithAI() {
    if (!claudeApiKey.trim()) {
      setAiTargetsError("Enter your Anthropic API key in the Market Pulse tab first.");
      return;
    }
    const snap = holdings[account];
    if (!snap || !snap.length) { setAiTargetsError("No holdings to analyse."); return; }

    setAiTargetsLoading(true);
    setAiTargetsError(null);
    setAiTargetsPreview(null);

    try {
      // Build a CAD-valued summary without exposing cost-basis / personal details
      const fxRate    = usdCadRate || 1.38;
      const totalCAD  = snap.reduce((s, h) => {
        const cur = getTickerCurrency(h.ticker, h.currencyOverride);
        return s + (cur === "USD" ? h.current * fxRate : h.current);
      }, 0);

      const lines = snap.map(h => {
        const cur    = getTickerCurrency(h.ticker, h.currencyOverride);
        const cadVal = cur === "USD" ? h.current * fxRate : h.current;
        const pct    = totalCAD > 0 ? ((cadVal / totalCAD) * 100).toFixed(1) : "0.0";
        return `${h.ticker} | ${h.name} | ${cur} | C$${Math.round(cadVal).toLocaleString()} (${pct}% of portfolio) | divYield:${h.divYield ?? 0}% | currentTarget:${h.target}%`;
      }).join("\n");

      const regime      = marketPulse?.regime?.label    || "Unknown";
      const riskScore   = marketPulse?.riskMeter?.score ?? 50;
      const riskLabel   = riskScore < 40 ? "risk-off — bias defensive"
                        : riskScore > 60 ? "risk-on — lean growth"
                        : "neutral — balanced";

      const acctRules = {
        TFSA:   "Favour zero/low-dividend growth stocks — IRS withholding tax (15%) on US dividends is unrecoverable in a TFSA. US dividend payers should get lower targets. Canadian-listed ETFs and crypto ETFs are fine.",
        RRSP:   "Favour US-listed dividend/income stocks — WHT is 0% under the Canada-US treaty in an RRSP. Balance income and growth. Bond ETFs/T-bills (SGOV) are good for capital preservation.",
        RESP:   "Conservative and balanced. Mirror current market-value proportions. Bond ETFs should anchor at 20-30%.",
        Crypto: "Split proportionally by current market value between BTC, ETH, and any crypto ETFs.",
      };

      const prompt = `You are a Canadian portfolio advisor. Suggest optimal target allocations for a ${account} account.

Market regime: ${regime} | Risk score: ${riskScore}/100 (${riskLabel})
Account: ${account}
Total value: C$${Math.round(totalCAD).toLocaleString()}
USD/CAD: ${fxRate}

Account-specific rule:
${acctRules[account] || "Optimise for long-term growth."}

Current holdings (ticker | name | currency | CAD value | divYield | currentTarget):
${lines}

Instructions:
- Assign a "target" integer % to each ticker — they must sum to EXACTLY 100
- Maximum 25% for any single equity; broad-market ETFs (XEQT, QQQM, QUU, etc.) may go up to 30%
- Set target to 0 only if you have a strong reason to exit the position
- Also provide updated "cagr" (5-yr estimate, integer 5-25) and "divYield" (%, one decimal) per ticker
- "rationale": one sharp sentence — what drives the target change

Return ONLY a JSON array, no markdown:
[{"ticker":"NVDA","target":18,"cagr":18,"divYield":0.0,"rationale":"AI compute moat; TFSA-optimal growth with minimal WHT drag"}]`;

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

      const data     = await res.json();
      const rawText  = (data.content?.[0]?.text || "").trim();
      const stripped = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const parsed   = JSON.parse(stripped);

      if (!Array.isArray(parsed) || !parsed.length) throw new Error("Claude returned no suggestions");

      // Merge with current holdings so we keep the right order and old targets
      const suggestions = snap.map(h => {
        const s = parsed.find(x => x.ticker === h.ticker);
        return {
          ticker:     h.ticker,
          name:       h.name,
          oldTarget:  h.target,
          target:     s ? Math.max(0, Math.round(Number(s.target) || 0)) : h.target,
          cagr:       s ? Math.max(1, Math.round(Number(s.cagr)   || h.cagr || 10)) : (h.cagr || 10),
          divYield:   s ? Math.max(0, Number(s.divYield) || 0) : (h.divYield || 0),
          rationale:  s?.rationale || "",
        };
      });

      setAiTargetsPreview({ suggestions, account });
    } catch (err) {
      setAiTargetsError(err.message || "Failed to get AI suggestions");
    } finally {
      setAiTargetsLoading(false);
    }
  }

  function applyAiTargets() {
    if (!aiTargetsPreview?.suggestions) return;
    const { suggestions } = aiTargetsPreview;
    const next = { ...holdings };
    next[account] = next[account].map(h => {
      const s = suggestions.find(x => x.ticker === h.ticker);
      if (!s) return h;
      return { ...h, target: s.target, cagr: s.cagr, divYield: s.divYield };
    });
    setHoldings(next);
    persist(account, next[account]);
    setAiTargetsPreview(null);
  }

  // ── AI diversification suggestions (cross-account) ───────────────────
  async function fetchDiversificationSuggestions() {
    if (!claudeApiKey.trim()) {
      setDiversifyError("Enter your Anthropic API key in the Market Pulse tab first.");
      return;
    }
    setDiversifyLoading(true);
    setDiversifyError(null);

    try {
      const fxRate = usdCadRate || 1.38;

      // Summarise every account — CAD values, currency, divYield
      const accountSummaries = portfolios.map(p => {
        const h = holdings[p] || [];
        if (!h.length) return null;
        const total = h.reduce((s, x) => {
          const cur = getTickerCurrency(x.ticker, x.currencyOverride);
          return s + (cur === "USD" ? x.current * fxRate : x.current);
        }, 0);
        const lines = h.map(x => {
          const cur    = getTickerCurrency(x.ticker, x.currencyOverride);
          const cadVal = cur === "USD" ? x.current * fxRate : x.current;
          const pct    = total > 0 ? ((cadVal / total) * 100).toFixed(1) : "0.0";
          return `  ${x.ticker} | ${x.name} | ${cur} | C$${Math.round(cadVal).toLocaleString()} (${pct}%) | div:${x.divYield ?? 0}%`;
        }).join("\n");
        return `${p} (total C$${Math.round(total).toLocaleString()}):\n${lines}`;
      }).filter(Boolean).join("\n\n");

      // All tickers currently held (to avoid duplicates)
      const heldTickers = new Set(
        portfolios.flatMap(p => (holdings[p] || []).map(x => x.ticker))
      );

      // Combined total for portfolio-level context
      const grandTotal = portfolios.reduce((s, p) => {
        return s + (holdings[p] || []).reduce((a, x) => {
          const cur = getTickerCurrency(x.ticker, x.currencyOverride);
          return a + (cur === "USD" ? x.current * fxRate : x.current);
        }, 0);
      }, 0);

      // Detected gaps
      const tfsaH = holdings.TFSA || [];
      const rrspH = holdings.RRSP || [];
      const gapList = Object.entries(SECTOR_TICKERS)
        .filter(([, tickers]) => !tickers.some(t => [...heldTickers].includes(t)))
        .map(([sector]) => sector);

      const regime    = marketPulse?.regime?.label    || "Unknown";
      const riskScore = marketPulse?.riskMeter?.score ?? 50;
      const riskCtx   = riskScore < 40 ? "risk-off — prefer defensive, quality positions"
                      : riskScore > 60 ? "risk-on — lean growth, accept more volatility"
                      : "neutral — balance growth and quality";

      const prompt = `You are a portfolio advisor for a Canadian investor with TFSA, RRSP, and other registered accounts.

Combined portfolio: C$${Math.round(grandTotal).toLocaleString()} across ${portfolios.length} accounts
Market regime: ${regime} | Risk score: ${riskScore}/100 (${riskCtx})
Detected sector gaps: ${gapList.length ? gapList.join(", ") : "none — well covered"}
USD/CAD rate: ${fxRate}

Current holdings by account (ticker | name | currency | CAD value (% of account) | div yield):
${accountSummaries}

Already held tickers: ${[...heldTickers].join(", ")}

TASK A — Suggest exactly 3–6 NEW positions that would meaningfully diversify this portfolio.

Addition rules:
- NEVER suggest a ticker already in the held list above
- Prefer broad ETFs over single stocks for filling sector/geographic gaps
- Do not duplicate exposure (e.g. if QQQM is held, don't suggest QQQ or ONEQ)
- Account assignment:
  - TFSA: only zero/minimal dividend payers (avoid IRS 15% WHT drain)
  - RRSP: US dividend payers welcome (WHT = 0% under Canada-US treaty)
  - CAD-listed ETFs can go in either
- Suggest initial target % of 3–8% of the target account — keep each position modest
- Focus on filling real gaps: geography, asset class, sector
- Consider the regime: in risk-off, lean toward defensive ETFs, bonds, gold; in risk-on, lean toward growth sectors
- Stop at 6 — do not pad with unnecessary positions

TASK B — Identify any existing positions that should be trimmed or removed.

Trim rules (flag a position if ANY of these apply):
- Single-stock position exceeds 20% of its account (concentration risk)
- Single-stock position exceeds 15% of total portfolio
- Two or more positions with substantially overlapping exposure (e.g. QQQ + QQQM, multiple semi ETFs)
- Position is misplaced for tax efficiency (high-dividend US stock in TFSA instead of RRSP)
- Position is speculative/high-risk and oversized given the current risk score
- Only flag genuine concerns — do NOT invent trims; return an empty array if holdings are well-balanced

Return ONLY a valid JSON object, no markdown:
{
  "additions": [{
    "ticker": "ENB",
    "name": "Enbridge Inc.",
    "account": "TFSA",
    "targetPct": 5,
    "sector": "Energy Infrastructure",
    "divYield": 7.2,
    "cagr": 8,
    "fillsGap": "Energy infrastructure — pipeline/midstream completely absent from portfolio",
    "thesis": "North America's largest pipeline operator with 30+ years of dividend growth. Regulated cash flows make it bond-like in volatility. CAD-listed, so no WHT in TFSA.",
    "placementReason": "CAD-listed — zero WHT drag regardless of account; TFSA preferred for tax-free dividend compounding"
  }],
  "trims": [{
    "ticker": "NVDA",
    "account": "TFSA",
    "currentPct": 28.5,
    "suggestedPct": 15,
    "action": "Reduce",
    "reason": "At 28.5% of TFSA this single semi position dominates the account. A 15% cap reduces concentration risk while keeping meaningful upside exposure."
  }]
}`;

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

      const data     = await res.json();
      const rawText  = (data.content?.[0]?.text || "").trim();
      const stripped = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const parsed   = JSON.parse(stripped);

      if (!parsed.additions || !Array.isArray(parsed.additions)) throw new Error("Claude returned no suggestions");

      // Safety: strip any tickers that are already held
      const clean      = parsed.additions.filter(s => s.ticker && !heldTickers.has(s.ticker.toUpperCase())).slice(0, 6);
      const cleanTrims = (parsed.trims || []).filter(s => s.ticker && heldTickers.has(s.ticker.toUpperCase())).slice(0, 6);

      const result = { suggestions: clean, trims: cleanTrims, generatedAt: new Date().toISOString(), regime, riskScore };
      setDiversifySuggestions(result);
      localStorage.setItem("diversify:suggestions", JSON.stringify(result));
    } catch (err) {
      setDiversifyError(err.message || "Failed to generate suggestions");
    } finally {
      setDiversifyLoading(false);
    }
  }

  // ── AI Options Analysis ───────────────────────────────────────────────
  async function fetchAIOptionsAnalysis() {
    if (!claudeApiKey.trim()) {
      setAiOptionsError("Enter your Anthropic API key in the Market Pulse tab first.");
      return;
    }
    setAiOptionsLoading(true);
    setAiOptionsError(null);

    try {
      const fxRate = usdCadRate || 1.38;
      const mp     = marketPulse;
      const vix    = Number(mp.macroSignals?.find(c => c.category === "Equities")
        ?.signals?.find(s => s.label === "VIX")?.value?.replace(/[^0-9.]/g, "")) || 17;
      const riskScore  = mp.riskMeter?.score ?? 50;
      const regime     = mp.regime?.label || "Unknown";

      // ── Pre-compute CC candidates ──────────────────────────────────────
      // TFSA = non-registered-linked, so TFSA + RRSP are both options-eligible
      const ccCandidates = portfolios.flatMap(acct =>
        (holdings[acct] || []).map(h => {
          const price = optionPrices[h.ticker];
          if (!price) return null;
          const estShares = Math.round(h.current / price);
          const contracts = Math.floor(estShares / 100);
          if (contracts < 1) return null;
          const iv      = estimateIV(h.ticker, vix);
          const strikes = getStrikeSuggestions(price, "cc", 30, iv);
          const cur     = getTickerCurrency(h.ticker, h.currencyOverride);
          return { ticker: h.ticker, name: h.name || h.ticker, acct, cur, price, estShares, contracts, iv: Math.round(iv), strikes };
        }).filter(Boolean)
      ).filter((x, i, arr) => arr.findIndex(y => y.ticker === x.ticker) === i); // dedupe

      // ── Cash buying power for CSPs ─────────────────────────────────────
      const cashBlocks = portfolios.map(p => {
        const cadCash = cashHolding[p] || 0;
        const usdCash = cadCash / fxRate;
        return { account: p, cadCash: Math.round(cadCash), usdCash: Math.round(usdCash) };
      }).filter(x => x.cadCash > 100);

      const totalCashCAD = cashBlocks.reduce((s, x) => s + x.cadCash, 0);

      // ── Format CC section for prompt ──────────────────────────────────
      const ccLines = ccCandidates.length
        ? ccCandidates.map(h => {
            const [cons, mod, agg] = h.strikes;
            return [
              `${h.ticker} (${h.acct}, ${h.cur}) — price $${h.price.toFixed(2)} | ${h.contracts} contract${h.contracts>1?"s":""} | IV ~${h.iv}%`,
              `  Conservative: strike $${cons.strike} (+${cons.pct}% OTM) | ~$${cons.premiumPerShare}/sh | $${cons.contractPremium}/contract | ${cons.monthlyYield}%/mo`,
              `  Moderate:     strike $${mod.strike}  (+${mod.pct}% OTM) | ~$${mod.premiumPerShare}/sh | $${mod.contractPremium}/contract | ${mod.monthlyYield}%/mo`,
              `  Aggressive:   strike $${agg.strike}  (+${agg.pct}% OTM) | ~$${agg.premiumPerShare}/sh | $${agg.contractPremium}/contract | ${agg.monthlyYield}%/mo`,
            ].join("\n");
          }).join("\n\n")
        : "No positions with 100+ shares currently available for covered calls. (Load live prices first if you haven't.)";

      // ── Format cash section ───────────────────────────────────────────
      const cashLines = cashBlocks.length
        ? cashBlocks.map(x =>
            `${x.account}: C$${x.cadCash.toLocaleString()} (≈ US$${x.usdCash.toLocaleString()}) — can secure 1 CSP on stocks priced up to $${x.usdCash} (or C$${x.cadCash} for CAD names)`
          ).join("\n")
        : "No significant cash available. Focus on covered calls only.";

      // ── Existing open option trades ────────────────────────────────────
      const openTrades = optionTrades.filter(t => t.status === "open");
      const openLines  = openTrades.length
        ? openTrades.map(t => `  ${t.type.toUpperCase()} ${t.ticker} ${t.account} strike $${t.strike} exp ${t.expiry}`).join("\n")
        : "  None";

      const prompt = `You are an options strategy advisor for a Canadian investor.

ACCOUNT CONTEXT:
- TFSA acts as a non-registered account for options (covered calls and CSPs are permitted)
- RRSP: covered calls and cash-secured puts permitted per broker rules
- Treat TFSA + RRSP holdings equally as options-eligible

MARKET ENVIRONMENT:
- VIX: ${vix} | Regime: ${regime} | Risk score: ${riskScore}/100
- IV environment: ${vix >= 25 ? "High — excellent for selling premium" : vix >= 18 ? "Elevated — good conditions" : vix >= 14 ? "Low — be selective" : "Very low — consider skipping"}
- Regime bias: ${riskScore >= 60 ? "Risk-On: CCs on extended positions; be cautious on new CSPs" : riskScore >= 40 ? "Neutral: balanced premium selling" : "Risk-Off: prefer CSPs on quality; avoid CCs that cap upside recovery"}

COVERED CALL CANDIDATES (pre-computed — only positions with 100+ shares):
${ccLines}

CASH AVAILABLE FOR CASH-SECURED PUTS:
${cashLines}
Total cash across accounts: C$${Math.round(totalCashCAD).toLocaleString()}

CURRENTLY OPEN OPTION TRADES (do not double up on these tickers):
${openLines}

TASK:
Generate 4–8 specific options trade recommendations. Mix CCs and CSPs based on what the portfolio and market support.

RISK CLASSIFICATION RULES (apply carefully):
- LOW risk: Conservative strike (5% OTM), IV < 25%, stable sector (ETFs, Financials, Utilities), DTE 30–45
- MEDIUM risk: Moderate strike (8% OTM), IV 25–40%, diversified sector, DTE 21–30
- HIGH risk: Aggressive strike (12%+ OTM) OR IV > 40% OR volatile sector (Semis, Biotech) OR DTE < 21

For CSPs: suggest specific tickers the investor might want to own at a discount (from their existing wish-list or quality names). Use the cash available per account to size.

VERDICT OPTIONS: "Strong" (execute now), "Consider" (good setup, minor reservations), "Skip" (unfavorable risk/reward)

Return ONLY a valid JSON object, no markdown:
{
  "summary": "2-3 sentence overall strategy recommendation given the regime and IV environment",
  "trades": [
    {
      "type": "cc",
      "ticker": "XEQT",
      "account": "TFSA",
      "risk": "Low",
      "strike": 46.00,
      "dte": 30,
      "premiumEst": 0.45,
      "contractPremium": 45,
      "contracts": 1,
      "monthlyYieldPct": 1.0,
      "rationale": "One paragraph explaining why this trade makes sense given regime, IV, and position size",
      "risks": ["Risk 1", "Risk 2"],
      "verdict": "Strong"
    }
  ]
}`;

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

      const data     = await res.json();
      const rawText  = (data.content?.[0]?.text || "").trim();
      const stripped = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const parsed   = JSON.parse(stripped);

      if (!parsed.trades || !Array.isArray(parsed.trades)) throw new Error("Invalid response structure");

      const result = {
        ...parsed,
        generatedAt: new Date().toISOString(),
        regime,
        riskScore,
        vix,
      };
      setAiOptionsAnalysis(result);
      localStorage.setItem("options:aiAnalysis", JSON.stringify(result));
    } catch (err) {
      setAiOptionsError(err.message || "Failed to generate analysis");
    } finally {
      setAiOptionsLoading(false);
    }
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
    if (recFilter === "tfsa")  return r.bestFor === "TFSA" || r.bestFor === "both";
    if (recFilter === "rrsp")  return r.bestFor === "RRSP" || r.bestFor === "both";
    if (recFilter === "gaps")  return r.fills.some(f => gaps.includes(f));
    if (recFilter === "pulse") {
      // Keep ideas whose sector is explicitly aligned with the base-case 3M sector rotation
      const rotation = marketPulse?.outlooks?.[0]?.scenarios
        ?.find(s => s.label === "Base case")?.sectorRotation?.toLowerCase() || "";
      const sectorWord = (r.sector || "").toLowerCase().split(" ")[0];
      return ["overweight", "add", "rotate into", "favor", "tilt to"].some(term => {
        const idx = rotation.indexOf(term);
        return idx !== -1 && rotation.slice(idx, idx + 90).includes(sectorWord);
      });
    }
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
    // FRED public CSV — may fail due to CORS; silently ignored via allSettled
    const tryFetchFredCSV = async (seriesId, timeout = 6000) => {
      const r = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`, { signal: AbortSignal.timeout(timeout) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = await r.text();
      const rows = text.trim().split("\n").filter(l => !l.startsWith("DATE") && l.trim());
      const last = rows[rows.length - 1]?.split(",");
      if (!last || isNaN(last[1])) throw new Error("no data");
      return parseFloat(last[1]);
    };

    await Promise.allSettled([
      tryFetch("https://api.alternative.me/fng/?limit=1").then(d => {
        live.fearGreedValue = Number(d.data[0].value);
        live.fearGreedLabel = d.data[0].value_classification;
      }),
      tryFetch("https://open.er-api.com/v6/latest/USD").then(d => {
        live.usdCad = d.rates?.CAD;
      }),
      tryFetchFredCSV("T10YIE").then(v => { live.breakeven10y = v; }),
      tryFetchFredCSV("DFII10").then(v => { live.realYield10y = v; }),
      ...[
        ["sp500",        "^GSPC"],
        ["tsx",          "^GSPTSE"],
        ["vix",          "^VIX"],
        ["gold",         "GC=F"],
        ["oil",          "CL=F"],
        ["treasury3m",   "^IRX"],
        ["treasury5y",   "^FVX"],
        ["treasury10y",  "^TNX"],
        ["treasury30y",  "^TYX"],
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
    if (live.treasury3m)   lines.push(`- 3M US Treasury yield: ${live.treasury3m.toFixed(2)}%`);
    if (live.treasury10y)  lines.push(`- 10Y US Treasury yield: ${live.treasury10y.toFixed(2)}%`);
    if (live.treasury5y)   lines.push(`- 5Y US Treasury yield: ${live.treasury5y.toFixed(2)}%`);
    if (live.treasury30y)  lines.push(`- 30Y US Treasury yield: ${live.treasury30y.toFixed(2)}%`);
    if (live.breakeven10y) lines.push(`- 10Y Breakeven Inflation (FRED T10YIE): ${live.breakeven10y.toFixed(2)}%`);
    if (live.realYield10y != null) {
      lines.push(`- 10Y Real Yield (FRED DFII10 TIPS): ${live.realYield10y.toFixed(2)}%`);
    } else if (live.treasury10y && live.breakeven10y) {
      lines.push(`- 10Y Real Yield (computed nominal−breakeven): ${(live.treasury10y - live.breakeven10y).toFixed(2)}%`);
    }

    const spreadLines = [];
    if (live.treasury3m && live.treasury10y)
      spreadLines.push(`- 3M–10Y spread: ${Math.round((live.treasury10y - live.treasury3m) * 100)} bps (${live.treasury10y - live.treasury3m >= 0 ? "normal" : "INVERTED — recession signal"})`);
    if (live.treasury5y && live.treasury30y)
      spreadLines.push(`- 5Y–30Y spread: ${Math.round((live.treasury30y - live.treasury5y) * 100)} bps`);
    if (live.treasury10y && live.treasury3m && live.treasury30y)
      spreadLines.push(`- Curve shape: ${live.treasury10y - live.treasury3m < -0.20 ? "Deeply inverted" : live.treasury10y - live.treasury3m < 0 ? "Mildly inverted" : live.treasury10y - live.treasury3m < 0.30 ? "Flat to slightly positive" : "Normal/Steepening"}`);

    // Build a compact holdings summary for holdings-aware action generation
    const buildHoldingSummary = (acct, hList) => {
      if (!hList || !hList.length) return "";
      const rows = hList
        .filter(h => h.current > 0)
        .map(h => `    ${h.ticker} (${h.name}): C$${Math.round(h.current).toLocaleString()} current value, ${h.divYield || 0}% div yield, target ${h.target}%`)
        .join("\n");
      return rows ? `  ${acct}:\n${rows}` : "";
    };
    const tfsaSummary = buildHoldingSummary("TFSA", holdings.TFSA || []);
    const rrspSummary = buildHoldingSummary("RRSP", holdings.RRSP || []);
    const holdingsBlock = [tfsaSummary, rrspSummary].filter(Boolean).join("\n");

    return `You are a senior macro analyst writing a monthly market pulse briefing for a Canadian investor managing a TFSA and RRSP portfolio.

Today's date: ${today}
3-month target period: ${fmt3}
6-month target period: ${fmt6}

Live market data fetched right now:
${lines.length ? lines.join("\n") : "(fetch failed — use your best current knowledge)"}
${spreadLines.length ? "\nComputed yield curve spreads:\n" + spreadLines.join("\n") : ""}

Current portfolio holdings (use these to generate specific, personalised actions):
${holdingsBlock || "(no holdings data available)"}

Using the live data as your anchor, apply your macro knowledge to fill in anything not directly measured above: Fed/BoC policy stance, full yield curve shape (3M/2Y/5Y/10Y/30Y), CPI trend, unemployment, sector rotation, geopolitical context, earnings revisions, sentiment indicators, credit spreads, DXY, copper, global macro. Weight the live numbers heavily; they override your training data.

For the yieldCurve section: classify the curve shape, report all five benchmark yields, compute spreads in bps, estimate the NY Fed 12-month recession probability, describe the inversion history, and give a trajectory outlook.

For newsSignals: provide 6 recent, specific news headlines from Bloomberg, CNBC, Reuters, Financial Times, or WSJ that are most relevant to this portfolio. Each headline must name the source and include a direct implication for the specific tickers held above.

For portfolioImplication.actions: generate 8–10 specific, actionable items referencing actual tickers from the holdings above. Classify each as "Buy", "Hold", "Reduce", "Watch", or "Rebalance". Include a rationale tied to the current macro regime. At least 3 actions must be "High" priority.

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
  "yieldCurve": {
    "shapeLabel": "Normal | Flat | Inverted | Bear-Steepening | Bull-Flattening | Bull-Steepening | Bear-Flattening",
    "shapeColor": "#22c55e (normal/steepening) or #fbbf24 (flat) or #ef4444 (inverted)",
    "currentYields": [
      { "maturity": "3M",  "yield": 0.00 },
      { "maturity": "2Y",  "yield": 0.00 },
      { "maturity": "5Y",  "yield": 0.00 },
      { "maturity": "10Y", "yield": 0.00 },
      { "maturity": "30Y", "yield": 0.00 }
    ],
    "spreads": [
      { "label": "3M–10Y", "description": "NY Fed recession predictor", "bps": 0, "status": "normal|warning|inverted", "note": "one-line interpretation" },
      { "label": "2Y–10Y", "description": "Classic 2s10s",              "bps": 0, "status": "normal|warning|inverted", "note": "one-line interpretation" },
      { "label": "5Y–30Y", "description": "Long-end slope",              "bps": 0, "status": "normal|warning|inverted", "note": "one-line interpretation" }
    ],
    "inversionStatus": "e.g. Dis-inverted Apr 2026 after 22-month inversion | Currently inverted X months",
    "recessionProbability": "~X% (NY Fed 12-month model)",
    "recessionProbabilityScore": 15,
    "trajectory": "One sentence on where the curve is heading and why",
    "canadianCurve": "One sentence on BoC curve dynamics relevant to a Canadian TFSA/RRSP investor"
  },
  "macroSignals": [
    { "category": "Equities", "icon": "📈", "signals": [
        { "label": "S&P 500",       "value": "~X,XXX", "trend": "up|down|sideways", "status": "bullish|bearish|caution|neutral", "note": "one line" },
        { "label": "TSX Composite", "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "VIX",           "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Nasdaq / Tech", "value": "...", "trend": "...", "status": "...", "note": "..." }
    ]},
    { "category": "Rates & Bonds", "icon": "🏦", "signals": [
        { "label": "Fed Funds Rate",           "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "10Y US Treasury",          "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Yield Curve (2s10s)",      "value": "+/- XX bps", "trend": "...", "status": "...", "note": "..." },
        { "label": "10Y Real Yield",           "value": "X.XX%", "trend": "...", "status": "...", "note": "..." },
        { "label": "10Y Breakeven Inflation",  "value": "X.XX%", "trend": "...", "status": "...", "note": "..." },
        { "label": "BoC Rate",                 "value": "...", "trend": "...", "status": "...", "note": "..." }
    ]},
    { "category": "Macro", "icon": "🌐", "signals": [
        { "label": "US CPI (YoY)",    "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "US Unemployment", "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Oil (WTI)",       "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Gold",            "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "USD/CAD",         "value": "...", "trend": "...", "status": "...", "note": "..." }
    ]},
    { "category": "Credit & Risk", "icon": "💳", "signals": [
        { "label": "HY Credit Spread (CDX HY)", "value": "~XXX bps", "trend": "...", "status": "bullish (<350 bps) | caution (350–500) | bearish (>500)", "note": "one line — widening spreads = credit stress, risk-off signal" },
        { "label": "IG Credit Spread",          "value": "~XX bps",  "trend": "...", "status": "...", "note": "..." },
        { "label": "US HY Default Rate",        "value": "X.X%",     "trend": "...", "status": "...", "note": "..." },
        { "label": "Bank Lending Standards",    "value": "...",       "trend": "...", "status": "...", "note": "..." }
    ]},
    { "category": "Global & Commodities", "icon": "🌍", "signals": [
        { "label": "DXY (US Dollar Index)", "value": "~XXX",  "trend": "...", "status": "...", "note": "strong USD = headwind for EM, commodities, and CAD" },
        { "label": "Copper (front-month)",  "value": "~$X.XX/lb", "trend": "...", "status": "bullish|bearish|neutral", "note": "copper is a leading global growth indicator" },
        { "label": "China PMI",             "value": "...",    "trend": "...", "status": "...", "note": "..." },
        { "label": "Eurozone CPI",          "value": "...",    "trend": "...", "status": "...", "note": "..." }
    ]},
    { "category": "Sentiment", "icon": "🧠", "signals": [
        { "label": "Fear & Greed",       "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "AAII Bull/Bear",     "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Put/Call Ratio",     "value": "...", "trend": "...", "status": "...", "note": "..." },
        { "label": "Earnings Revisions", "value": "...", "trend": "...", "status": "...", "note": "..." }
    ]}
  ],
  "newsSignals": [
    {
      "source": "Bloomberg|CNBC|Reuters|FT|WSJ",
      "headline": "Specific headline text — must be a real or very plausible current headline",
      "date": "Month DD, YYYY",
      "impact": "bullish|bearish|neutral",
      "portfolioImpact": "One sentence: which holdings are directly affected and how (name the tickers)"
    }
  ],
  "outlooks": [
    {
      "horizon": "3 months", "period": "${fmt3}",
      "scenarios": [
        { "label": "Bull case",  "probability": 30, "color": "#22c55e", "icon": "🟢",
          "trigger": "...", "marketTarget": "S&P X,XXX–X,XXX", "canadianAngle": "TSX/CAD/oil implications",
          "positioning": "TFSA/RRSP action referencing actual portfolio tickers",
          "sectorRotation": "e.g. Overweight Financials + Tech; underweight Utilities" },
        { "label": "Base case",  "probability": 45, "color": "#fbbf24", "icon": "🟡",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "...", "sectorRotation": "..." },
        { "label": "Bear case",  "probability": 25, "color": "#ef4444", "icon": "🔴",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "...",
          "sectorRotation": "e.g. Rotate to Staples, Healthcare, Gold — avoid rate-sensitives" }
      ],
      "keyEvents": [ { "date": "Mon DD", "event": "description" } ]
    },
    {
      "horizon": "6 months", "period": "${fmt6}",
      "scenarios": [
        { "label": "Bull case",  "probability": 28, "color": "#22c55e", "icon": "🟢",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "...", "sectorRotation": "..." },
        { "label": "Base case",  "probability": 42, "color": "#fbbf24", "icon": "🟡",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "...", "sectorRotation": "..." },
        { "label": "Bear case",  "probability": 30, "color": "#ef4444", "icon": "🔴",
          "trigger": "...", "marketTarget": "...", "canadianAngle": "...", "positioning": "...", "sectorRotation": "..." }
      ],
      "keyEvents": [ { "date": "Mon YYYY", "event": "description" } ]
    }
  ],
  "catalysts": {
    "bullish": [ { "icon": "emoji", "label": "specific catalyst relevant to current environment" } ],
    "bearish":  [ { "icon": "emoji", "label": "specific risk relevant to current environment" } ]
  },
  "portfolioImplication": {
    "summary": "2-3 sentences specific to a Canadian TFSA/RRSP investor given the current regime and actual holdings",
    "actions": [
      { "priority": "High",   "type": "Hold|Buy|Reduce|Watch|Rebalance", "ticker": "TICKER or null", "action": "Specific actionable guidance referencing actual portfolio tickers" },
      { "priority": "High",   "type": "...", "ticker": "...", "action": "..." },
      { "priority": "High",   "type": "...", "ticker": "...", "action": "..." },
      { "priority": "Medium", "type": "...", "ticker": "...", "action": "..." },
      { "priority": "Medium", "type": "...", "ticker": "...", "action": "..." },
      { "priority": "Medium", "type": "...", "ticker": "...", "action": "..." },
      { "priority": "Low",    "type": "...", "ticker": "...", "action": "..." },
      { "priority": "Low",    "type": "...", "ticker": "...", "action": "..." }
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
      setPulsePasteOpen(true);
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

            {/* Backup / Restore */}
            {backupStatus ? (
              <span style={{ fontSize:11, fontWeight:600, marginRight:4,
                color: backupStatus.startsWith("⚠") ? "#ef4444" : "#22c55e" }}>
                {backupStatus}
              </span>
            ) : autoSaveAt ? (
              <span title={`Auto-saved at ${new Date(autoSaveAt).toLocaleTimeString()}`}
                style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginRight:2,
                  display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", flexShrink:0,
                  background: (Date.now() - new Date(autoSaveAt).getTime()) < 2 * 60 * 1000
                    ? "#22c55e" : "rgba(255,255,255,0.2)" }} />
                {relTime(autoSaveAt)}
              </span>
            ) : null}
            <button className="btn" style={{ fontSize:11, padding:"6px 12px" }} onClick={exportData}
              title="Download a full backup — holdings, cash, contrib plan, FX rate, and Market Pulse cache">
              💾 Backup
            </button>
            <label className="btn" style={{ cursor:"pointer", fontSize:11, padding:"6px 12px" }}
              title="Restore from a JSON backup, or import holdings from CSV">
              📂 Restore / Import
              <input type="file" accept=".json,.csv,text/csv,application/json" style={{ display:"none" }} onChange={importData}/>
            </label>
            <label className="btn" style={{
              cursor: brokerImportLoading ? "wait" : "pointer",
              fontSize:11, padding:"6px 12px",
              background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.35)",
              color:"#fbbf24", opacity: brokerImportLoading ? 0.6 : 1,
            }} title="Upload your Wealthsimple holdings CSV — Claude will parse and import it automatically">
              {brokerImportLoading ? "⏳ Analysing…" : "🏦 Import from Broker"}
              <input type="file" accept=".csv,text/csv" style={{ display:"none" }}
                disabled={brokerImportLoading}
                onChange={importBrokerHoldings}/>
            </label>
            {brokerImportError && (
              <span style={{ fontSize:11, color:"#f87171", maxWidth:260 }}>
                ⚠ {brokerImportError}
                <button onClick={() => setBrokerImportError(null)}
                  style={{ marginLeft:6, background:"none", border:"none", color:"#f87171", cursor:"pointer" }}>✕</button>
              </span>
            )}
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
          ["recommend","💡 Ideas"],["search","🔍 Search"],["pulse","📡 Market Pulse"],["options","⚡ Options"]].map(([v,l]) => (
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
            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              <p className="sec" style={{ margin:0 }}>Edit holdings, cost basis &amp; targets — {account}</p>
              <button
                onClick={suggestTargetsWithAI}
                disabled={aiTargetsLoading}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"6px 14px", fontSize:12, fontWeight:600, borderRadius:8,
                  border:"1px solid rgba(167,139,250,0.45)",
                  background: aiTargetsLoading ? "rgba(167,139,250,0.06)" : "rgba(167,139,250,0.1)",
                  color:"#a78bfa", cursor: aiTargetsLoading ? "wait" : "pointer",
                  opacity: aiTargetsLoading ? 0.7 : 1, transition:"all 0.15s",
                }}
                title="Send current holdings to Claude and get suggested target allocations"
              >
                <span style={{ fontSize:14 }}>{aiTargetsLoading ? "⏳" : "✨"}</span>
                {aiTargetsLoading ? "Analysing…" : "Suggest Targets with AI"}
              </button>
              {aiTargetsError && (
                <span style={{ fontSize:11, color:"#f87171", display:"flex", alignItems:"center", gap:4 }}>
                  ⚠ {aiTargetsError}
                  <button onClick={() => setAiTargetsError(null)}
                    style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", padding:0, lineHeight:1 }}>✕</button>
                </span>
              )}
            </div>
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

          {/* ── AI Diversification panel ───────────────────────────────── */}
          {(() => {
            const ds = diversifySuggestions;
            const tealAccent = "#2dd4bf";
            const relAge = ds?.generatedAt
              ? (() => {
                  const m = Math.round((Date.now() - new Date(ds.generatedAt).getTime()) / 60000);
                  if (m < 1)  return "just now";
                  if (m < 60) return `${m}m ago`;
                  const h = Math.floor(m / 60);
                  return h < 24 ? `${h}h ago` : `${Math.floor(h/24)}d ago`;
                })()
              : null;

            return (
              <div className="card" style={{
                marginBottom:16, padding:"16px 20px",
                background:"rgba(45,212,191,0.03)",
                border:"1px solid rgba(45,212,191,0.18)",
              }}>
                {/* Header row */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  flexWrap:"wrap", gap:10, marginBottom: ds ? 16 : 0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <p style={{ margin:0, fontSize:13, fontWeight:700, color:tealAccent }}>
                      🤖 AI Diversification Analysis
                    </p>
                    {ds && (
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)",
                        fontFamily:"'JetBrains Mono',monospace" }}>
                        {ds.regime} · risk {ds.riskScore}/100 · {relAge}
                      </span>
                    )}
                    {diversifyError && (
                      <span style={{ fontSize:11, color:"#f87171", display:"flex",
                        alignItems:"center", gap:4 }}>
                        ⚠ {diversifyError}
                        <button onClick={() => setDiversifyError(null)}
                          style={{ background:"none", border:"none", color:"#f87171",
                            cursor:"pointer", padding:0, lineHeight:1 }}>✕</button>
                      </span>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    {ds && (
                      <button onClick={() => {
                        setDiversifySuggestions(null);
                        localStorage.removeItem("diversify:suggestions");
                      }} style={{ fontSize:10, padding:"4px 10px", borderRadius:6,
                        background:"rgba(255,255,255,0.04)",
                        border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)",
                        cursor:"pointer" }}>
                        Clear
                      </button>
                    )}
                    <button
                      onClick={fetchDiversificationSuggestions}
                      disabled={diversifyLoading}
                      style={{
                        display:"flex", alignItems:"center", gap:6,
                        padding:"7px 16px", fontSize:12, fontWeight:600, borderRadius:8,
                        border:`1px solid ${tealAccent}55`,
                        background: diversifyLoading ? `rgba(45,212,191,0.06)` : `rgba(45,212,191,0.1)`,
                        color: tealAccent, cursor: diversifyLoading ? "wait" : "pointer",
                        opacity: diversifyLoading ? 0.7 : 1,
                      }}
                    >
                      <span style={{ fontSize:14 }}>{diversifyLoading ? "⏳" : "✨"}</span>
                      {diversifyLoading ? "Analysing portfolio…" : ds ? "Re-analyse" : "Analyse my portfolio"}
                    </button>
                  </div>
                </div>

                {/* Empty state */}
                {!ds && !diversifyLoading && (
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", lineHeight:1.6, margin:0 }}>
                    Claude will analyse your complete portfolio across all accounts, identify real gaps in
                    sector, geography, and asset class coverage, and suggest 3–6 specific additions — with
                    account placement rationale and a suggested initial weight each.
                  </p>
                )}

                {/* ── Trim / Reduce alerts ── */}
                {ds?.trims?.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <p style={{ fontSize:11, fontWeight:600, color:"#f97316", marginBottom:8,
                      display:"flex", alignItems:"center", gap:6 }}>
                      ✂ Trim / Reduce Alerts
                      <span style={{ fontSize:10, fontWeight:400, color:"rgba(255,255,255,0.35)" }}>
                        — positions flagged for concentration or tax-placement concerns
                      </span>
                    </p>
                    <div style={{ display:"grid", gap:8,
                      gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))" }}>
                      {ds.trims.map((tr, i) => {
                        const isRemove = tr.action === "Remove";
                        const accentColor = isRemove ? "#ef4444" : "#f97316";
                        return (
                          <div key={i} style={{
                            background:"rgba(249,115,22,0.06)",
                            border:"1px solid rgba(249,115,22,0.2)",
                            borderLeft:`3px solid ${accentColor}`,
                            borderRadius:10, padding:"12px 14px",
                          }}>
                            <div style={{ display:"flex", justifyContent:"space-between",
                              alignItems:"flex-start", marginBottom:6 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                <span style={{ fontSize:16, fontWeight:800,
                                  fontFamily:"'JetBrains Mono',monospace", color:accentColor }}>
                                  {tr.ticker}
                                </span>
                                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                                  background:`${accentColor}15`, color:accentColor,
                                  border:`1px solid ${accentColor}30`, fontWeight:600 }}>
                                  {tr.account}
                                </span>
                                <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4,
                                  background:"rgba(0,0,0,0.2)", color:accentColor, fontWeight:700 }}>
                                  {tr.action}
                                </span>
                              </div>
                              {!isRemove && tr.currentPct != null && tr.suggestedPct != null && (
                                <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                                  <p style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                                    color:"rgba(255,255,255,0.55)", margin:0 }}>
                                    <span style={{ color:"#ef4444" }}>{tr.currentPct}%</span>
                                    {" → "}
                                    <span style={{ color:"#22c55e" }}>{tr.suggestedPct}%</span>
                                  </p>
                                  <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", margin:0 }}>of account</p>
                                </div>
                              )}
                            </div>
                            <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)",
                              lineHeight:1.5, marginBottom:10 }}>
                              {tr.reason}
                            </p>
                            <button
                              onClick={() => setTab("targets")}
                              style={{ width:"100%", padding:"6px 0", fontSize:10, fontWeight:600,
                                background:`${accentColor}10`, border:`1px solid ${accentColor}30`,
                                borderRadius:6, color:accentColor, cursor:"pointer" }}>
                              Adjust in Edit Targets →
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Suggestion cards */}
                {ds?.suggestions?.length > 0 && (
                  <div>
                  {ds.trims?.length > 0 && (
                    <p style={{ fontSize:11, fontWeight:600, color:tealAccent, marginBottom:8,
                      display:"flex", alignItems:"center", gap:6 }}>
                      ✦ New Positions to Add
                    </p>
                  )}
                  <div style={{ display:"grid", gap:12,
                    gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))" }}>
                    {ds.suggestions.map((s, i) => {
                      const alreadyHeld = portfolios.some(p =>
                        (holdings[p] || []).some(h => h.ticker === s.ticker)
                      );
                      const acctColor = s.account === "RRSP" ? "#22d3ee" : "#fbbf24";
                      return (
                        <div key={i} style={{
                          background:"rgba(255,255,255,0.03)",
                          border:`1px solid rgba(45,212,191,0.14)`,
                          borderLeft:`3px solid ${tealAccent}`,
                          borderRadius:10, padding:"14px 16px",
                        }}>
                          {/* Card header */}
                          <div style={{ display:"flex", justifyContent:"space-between",
                            alignItems:"flex-start", marginBottom:8 }}>
                            <div>
                              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                                <span style={{ fontSize:16, fontWeight:800,
                                  fontFamily:"'JetBrains Mono',monospace", color:tealAccent }}>
                                  {s.ticker}
                                </span>
                                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                                  background:`${acctColor}15`, color:acctColor,
                                  border:`1px solid ${acctColor}30`, fontWeight:600 }}>
                                  {s.account}
                                </span>
                                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                                  background:"rgba(45,212,191,0.08)",
                                  color:"rgba(45,212,191,0.7)",
                                  border:"1px solid rgba(45,212,191,0.2)" }}>
                                  {s.sector}
                                </span>
                              </div>
                              <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)",
                                margin:0 }}>{s.name}</p>
                            </div>
                            <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                              <p style={{ fontSize:14, fontWeight:700, color:tealAccent,
                                fontFamily:"'JetBrains Mono',monospace", margin:0 }}>
                                {s.targetPct}%
                              </p>
                              <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)",
                                margin:0 }}>suggested</p>
                            </div>
                          </div>

                          {/* Fills gap pill */}
                          <div style={{ fontSize:10, color:"rgba(45,212,191,0.75)",
                            background:"rgba(45,212,191,0.06)",
                            border:"1px solid rgba(45,212,191,0.15)",
                            borderRadius:5, padding:"3px 8px", marginBottom:8,
                            display:"inline-block", lineHeight:1.4 }}>
                            🎯 {s.fillsGap}
                          </div>

                          {/* Thesis */}
                          <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)",
                            lineHeight:1.55, marginBottom:8 }}>{s.thesis}</p>

                          {/* Placement reason */}
                          {s.placementReason && (
                            <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)",
                              lineHeight:1.4, marginBottom:10,
                              borderTop:"1px solid rgba(255,255,255,0.05)",
                              paddingTop:7, margin:"0 0 10px" }}>
                              📍 {s.placementReason}
                            </p>
                          )}

                          {/* Metrics row */}
                          <div style={{ display:"flex", gap:12, marginBottom:10 }}>
                            {[
                              ["Div yield", `${s.divYield ?? 0}%`],
                              ["Est. CAGR",  `${s.cagr ?? 10}%`],
                            ].map(([label, val]) => (
                              <div key={label}>
                                <p style={{ fontSize:9, color:"rgba(255,255,255,0.28)",
                                  margin:0, textTransform:"uppercase",
                                  letterSpacing:"0.07em" }}>{label}</p>
                                <p style={{ fontSize:12, fontWeight:600,
                                  color:"rgba(255,255,255,0.7)", margin:0,
                                  fontFamily:"'JetBrains Mono',monospace" }}>{val}</p>
                              </div>
                            ))}
                          </div>

                          {/* Add button */}
                          {alreadyHeld ? (
                            <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>
                              ✓ Already in portfolio
                            </span>
                          ) : (
                            <button
                              className="btn btn-primary"
                              style={{ width:"100%", fontSize:11, padding:"7px 0",
                                borderColor:`${acctColor}50`, color:acctColor,
                                background:`${acctColor}10` }}
                              onClick={() => {
                                addRecommendedTicker({
                                  ticker:   s.ticker,
                                  name:     s.name,
                                  divYield: s.divYield ?? 0,
                                  thesis:   s.thesis,
                                  bestFor:  s.account,
                                }, s.account);
                              }}
                            >
                              + Add to {s.account}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  </div>
                )}
              </div>
            );
          })()}

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

          {/* ── Market context card — live from Market Pulse ── */}
          {(() => {
            const mp  = marketPulse;
            const ctx = portfolioIdeas.marketContext;
            const regime   = mp.regime;
            const risk     = mp.riskMeter;
            const outlook3m = mp.outlooks?.[0];
            const baseCase  = outlook3m?.scenarios?.find(s => s.label === "Base case");
            const yc        = mp.yieldCurve;

            return (
              <div className="card" style={{ marginBottom:16, padding:"14px 18px",
                background:"rgba(34,211,238,0.03)", borderColor:"rgba(34,211,238,0.1)" }}>

                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  marginBottom:12, flexWrap:"wrap", gap:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <p className="sec" style={{ margin:0, color:"#22d3ee88" }}>
                      Market context — {mp.period}
                    </p>
                    {pulseRefreshedAt
                      ? <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                          background:"rgba(167,139,250,0.1)", color:"rgba(167,139,250,0.6)",
                          border:"1px solid rgba(167,139,250,0.2)", fontFamily:"'JetBrains Mono',monospace" }}>
                          ✨ AI live
                        </span>
                      : <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"'JetBrains Mono',monospace" }}>
                          updated {mp.lastUpdated}
                        </span>
                    }
                  </div>
                  {/* Regime + risk meter pills */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                    <span style={{ fontSize:10, fontWeight:600, padding:"2px 9px", borderRadius:4,
                      background:`${regime.color}18`, color: regime.color,
                      border:`1px solid ${regime.color}35` }}>
                      {regime.label}
                    </span>
                    <span style={{ fontSize:10, padding:"2px 9px", borderRadius:4,
                      background:`${risk.color}12`, color: risk.color,
                      border:`1px solid ${risk.color}25` }}>
                      Risk {risk.score}/100 — {risk.label}
                    </span>
                    {yc && (
                      <span style={{ fontSize:10, padding:"2px 9px", borderRadius:4,
                        background:`${yc.shapeColor || "#fbbf24"}12`,
                        color: yc.shapeColor || "#fbbf24",
                        border:`1px solid ${yc.shapeColor || "#fbbf24"}25` }}>
                        Curve: {yc.shapeLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Base-case 3-month snapshot + sector rotation */}
                {baseCase && (
                  <div style={{ background:"rgba(251,191,36,0.05)", border:"1px solid rgba(251,191,36,0.15)",
                    borderLeft:"3px solid #fbbf24", borderRadius:8, padding:"10px 14px", marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      marginBottom:6, flexWrap:"wrap", gap:4 }}>
                      <p style={{ fontSize:10, fontWeight:600, color:"#fbbf24" }}>
                        🟡 Base case ({outlook3m.horizon}) — {baseCase.probability}% probability
                      </p>
                      <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                        color:"#fbbf24" }}>{baseCase.marketTarget}</span>
                    </div>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.5, marginBottom:6 }}>
                      {baseCase.trigger}
                    </p>
                    {baseCase.sectorRotation && (
                      <div style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
                        <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase",
                          letterSpacing:"0.05em", whiteSpace:"nowrap", marginTop:1 }}>Sector rotation</span>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.55)", lineHeight:1.4 }}>
                          {baseCase.sectorRotation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Investment themes from recommendations.json (curated) */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))", gap:8 }}>
                  {ctx.themes.map(c => (
                    <div key={c.label} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ fontSize:15, flexShrink:0 }}>{c.icon}</span>
                      <div>
                        <p style={{ fontSize:11, fontWeight:500,
                          color: c.color || "rgba(255,255,255,0.7)", marginBottom:2 }}>{c.label}</p>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.33)", lineHeight:1.4 }}>{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Signal → Trade panel (from Market Pulse portfolioImplication) ── */}
          {(() => {
            const actions = marketPulse?.portfolioImplication?.actions || [];
            if (!actions.length) return null;

            // Extract known tickers from action text
            const knownTickers = new Set(RECOMMENDATIONS.map(r => r.ticker));
            const extractTickers = txt =>
              [...new Set((txt.match(/\b([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\b/g) || [])
                .filter(t => knownTickers.has(t)))];

            const pColor = p => p === "High" ? "#ef4444" : p === "Medium" ? "#fbbf24" : "#64748b";

            return (
              <div className="card" style={{ marginBottom:16, padding:"14px 18px",
                background:"rgba(167,139,250,0.03)", borderColor:"rgba(167,139,250,0.12)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <p style={{ fontSize:11, fontWeight:600, color:"#a78bfa" }}>
                    🎯 Pulse signals → trade actions
                  </p>
                  <span style={{ fontSize:9, color:"rgba(167,139,250,0.4)" }}>
                    from current Market Pulse · click tickers to filter Ideas
                  </span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {actions.map((a, i) => {
                    const tickers = extractTickers(a.action);
                    const pc = pColor(a.priority);
                    return (
                      <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start",
                        padding:"8px 12px", borderRadius:8,
                        background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4,
                          whiteSpace:"nowrap", marginTop:1, fontWeight:600,
                          background:`${pc}18`, color: pc, border:`1px solid ${pc}30` }}>
                          {a.priority}
                        </span>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.55)",
                          lineHeight:1.5, flex:1 }}>{a.action}</p>
                        {tickers.length > 0 && (
                          <div style={{ display:"flex", gap:5, flexShrink:0, flexWrap:"wrap",
                            alignItems:"center" }}>
                            {tickers.map(t => {
                              const rec = RECOMMENDATIONS.find(r => r.ticker === t);
                              return (
                                <button key={t}
                                  onClick={() => addRecommendedTicker(rec, rec?.bestFor === "RRSP" ? "RRSP" : "TFSA")}
                                  title={`Add ${t} to ${rec?.bestFor === "RRSP" ? "RRSP" : "TFSA"}`}
                                  style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                                    fontWeight:600, padding:"3px 8px", borderRadius:4, cursor:"pointer",
                                    background:"rgba(167,139,250,0.12)",
                                    border:"1px solid rgba(167,139,250,0.3)",
                                    color:"#a78bfa" }}>
                                  + {t}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Filter bar */}
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginRight:4 }}>Filter:</span>
            {[
              ["all",   "All ideas"],
              ["tfsa",  "Best for TFSA"],
              ["rrsp",  "Best for RRSP"],
              ["gaps",  "Fills Gaps"],
              ["pulse", "✨ Pulse aligned"],
            ].map(([v,l]) => (
              <button key={v} className={`tab-btn ${recFilter===v?"on":""}`}
                onClick={() => setRecFilter(v)}
                style={{ padding:"5px 12px", fontSize:11,
                  ...(v === "pulse" && recFilter !== "pulse"
                    ? { borderColor:"rgba(167,139,250,0.3)", color:"rgba(167,139,250,0.7)" }
                    : {}) }}>
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
              {filteredRecs.map(rec => {
                // Compute regime alignment from base-case 3M sector rotation
                const rotation = marketPulse?.outlooks?.[0]?.scenarios
                  ?.find(s => s.label === "Base case")?.sectorRotation?.toLowerCase() || "";
                const sectorWord = (rec.sector || "").toLowerCase().split(" ")[0];
                let alignment = null;
                if (rotation) {
                  const isAligned = ["overweight","add","rotate into","favor","tilt to"]
                    .some(t => { const i = rotation.indexOf(t); return i !== -1 && rotation.slice(i, i+90).includes(sectorWord); });
                  const isAvoid = ["underweight","avoid","reduce","trim","rotate out"]
                    .some(t => { const i = rotation.indexOf(t); return i !== -1 && rotation.slice(i, i+90).includes(sectorWord); });
                  if (isAligned) alignment = { label:"Regime aligned", color:"#22c55e" };
                  else if (isAvoid) alignment = { label:"Regime avoid", color:"#ef4444" };
                }

                return (
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
                        {alignment && (
                          <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, fontWeight:600,
                            background:`${alignment.color}15`, color: alignment.color,
                            border:`1px solid ${alignment.color}35` }}>
                            {alignment.label === "Regime aligned" ? "✓" : "✗"} {alignment.label}
                          </span>
                        )}
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

                  {/* Sector + tags */}
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
                );
              })}
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
            <div className="card" style={{ marginBottom:16, padding:"16px 20px",
              background:"rgba(167,139,250,0.03)", borderColor:"rgba(167,139,250,0.12)" }}>

              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ fontSize:13 }}>✨</span>
                  <p style={{ fontSize:11, fontWeight:600, color:"#a78bfa" }}>Refresh with Claude AI</p>
                </div>
                {pulseRefreshedAt && (
                  <span style={{ fontSize:9, color:"rgba(167,139,250,0.5)", fontFamily:"'JetBrains Mono',monospace" }}>
                    last refreshed {new Date(pulseRefreshedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Step 1 — two options side by side */}
              <p style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.35)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                Step 1 — Choose how to run Claude
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>

                {/* Option A — claude.ai */}
                <div style={{ border:"1px solid rgba(167,139,250,0.2)", borderRadius:8, padding:"12px 14px",
                  background:"rgba(167,139,250,0.05)" }}>
                  <p style={{ fontSize:10, fontWeight:600, color:"rgba(167,139,250,0.8)", marginBottom:4 }}>
                    claude.ai <span style={{ fontWeight:400, color:"rgba(167,139,250,0.45)" }}>— uses your Pro plan</span>
                  </p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:10, lineHeight:1.5 }}>
                    Copy the prompt (live data pre-filled), paste into claude.ai, then paste the JSON response back in Step 2 below.
                  </p>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
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
                  </div>
                </div>

                {/* Option B — API key */}
                <div style={{ border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"12px 14px",
                  background:"rgba(255,255,255,0.02)" }}>
                  <p style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.45)", marginBottom:4 }}>
                    API key <span style={{ fontWeight:400, color:"rgba(255,255,255,0.25)" }}>— one-click, ~$0.004/refresh</span>
                  </p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginBottom:10, lineHeight:1.5 }}>
                    Fully automated — no copy/paste needed. Get a free key at console.anthropic.com
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

              {/* Step 2 — paste area, full width, always visible when pulsePasteOpen */}
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:14 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <p style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.05em" }}>
                    Step 2 — Paste Claude's response
                    <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"rgba(255,255,255,0.2)", marginLeft:6 }}>
                      (claude.ai option only)
                    </span>
                  </p>
                  <button className="btn" onClick={() => { setPulsePasteOpen(o => !o); setPulsePasteError(null); }}
                    style={{ fontSize:10, padding:"4px 10px",
                      background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.08)",
                      color:"rgba(255,255,255,0.35)" }}>
                    {pulsePasteOpen ? "▲ Hide" : "▼ Show"}
                  </button>
                </div>

                {pulsePasteOpen && (
                  <div>
                    <textarea
                      value={pulsePasteText}
                      onChange={e => { setPulsePasteText(e.target.value); setPulsePasteError(null); }}
                      placeholder="Paste Claude's full response here — the app will extract the JSON automatically even if there is text around it…"
                      rows={8}
                      style={{ width:"100%", fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                        background:"rgba(255,255,255,0.03)", border:"1px solid rgba(167,139,250,0.2)",
                        borderRadius:8, padding:"10px 12px", color:"rgba(255,255,255,0.65)",
                        resize:"vertical", boxSizing:"border-box", lineHeight:1.5 }}
                    />
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8 }}>
                      <button className="btn btn-primary" onClick={applyPastedPulse}
                        disabled={!pulsePasteText.trim()}
                        style={{ fontSize:11, padding:"7px 20px",
                          background:"rgba(167,139,250,0.2)", borderColor:"rgba(167,139,250,0.4)",
                          color:"#a78bfa", opacity: pulsePasteText.trim() ? 1 : 0.4 }}>
                        Apply &amp; Refresh Dashboard
                      </button>
                      {pulsePasteText.trim() && (
                        <button className="btn" onClick={() => { setPulsePasteText(""); setPulsePasteError(null); }}
                          style={{ fontSize:10, padding:"7px 14px", color:"rgba(255,255,255,0.3)",
                            borderColor:"rgba(255,255,255,0.07)" }}>
                          Clear
                        </button>
                      )}
                    </div>
                    {pulsePasteError && (
                      <p style={{ fontSize:10, color:"#ef4444", marginTop:8, padding:"6px 10px",
                        background:"rgba(239,68,68,0.07)", borderRadius:6, border:"1px solid rgba(239,68,68,0.2)" }}>
                        ⚠ {pulsePasteError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {pulseError && (
                <p style={{ fontSize:10, color:"#ef4444", marginTop:10, padding:"6px 10px",
                  background:"rgba(239,68,68,0.07)", borderRadius:6, border:"1px solid rgba(239,68,68,0.2)" }}>
                  ⚠ {pulseError}
                </p>
              )}
              {pulseApplyDone && (
                <p style={{ fontSize:10, color:"#22c55e", marginTop:10, padding:"8px 12px",
                  background:"rgba(34,197,94,0.07)", borderRadius:6, border:"1px solid rgba(34,197,94,0.2)" }}>
                  ✓ Market Pulse updated — scroll down to see the refreshed dashboard.
                </p>
              )}
            </div>

            {/* ── ACTION CENTER ── */}
            {mp.portfolioImplication?.actions?.length > 0 && (() => {
              const typeStyles = {
                Buy:       { bg:"rgba(34,197,94,0.10)",   border:"rgba(34,197,94,0.30)",  color:"#22c55e", icon:"↑ Buy"    },
                Hold:      { bg:"rgba(34,211,238,0.07)",  border:"rgba(34,211,238,0.20)", color:"#22d3ee", icon:"◆ Hold"   },
                Reduce:    { bg:"rgba(239,68,68,0.10)",   border:"rgba(239,68,68,0.28)",  color:"#ef4444", icon:"↓ Reduce" },
                Watch:     { bg:"rgba(251,191,36,0.08)",  border:"rgba(251,191,36,0.25)", color:"#fbbf24", icon:"◎ Watch"  },
                Rebalance: { bg:"rgba(167,139,250,0.09)", border:"rgba(167,139,250,0.28)",color:"#a78bfa", icon:"⇄ Rebalance" },
              };
              const pBorder = p => p==="High"?"#ef4444":p==="Medium"?"#fbbf24":"#64748b";

              // For each ticker find where it's held and its current CAD value
              const holdingInfo = ticker => {
                if (!ticker || ticker==="null") return [];
                return portfolios.flatMap(p =>
                  (holdings[p]||[])
                    .filter(h => h.ticker === ticker)
                    .map(h => ({ acct:p, h, valCAD: toCAD(h.current, ticker, h.currencyOverride) }))
                ).filter(x => x.valCAD > 0 || x.h.current > 0);
              };

              return (
                <div className="card" style={{ marginBottom:16, padding:"18px 20px",
                  background:"rgba(167,139,250,0.03)", borderColor:"rgba(167,139,250,0.16)",
                  borderLeft:"3px solid #a78bfa" }}>

                  {/* Header */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                    marginBottom:12, flexWrap:"wrap", gap:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:16 }}>🎯</span>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:"#a78bfa", margin:0 }}>Action Center</p>
                        <p style={{ fontSize:10, color:"rgba(167,139,250,0.5)", margin:0, marginTop:1 }}>
                          {mp.period} · click Buy / Reduce on any card to log a trade
                        </p>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {["High","Medium","Low"].map(p => {
                        const cnt = mp.portfolioImplication.actions.filter(a => a.priority===p).length;
                        if (!cnt) return null;
                        const c = pBorder(p);
                        return <span key={p} style={{ fontSize:10, padding:"3px 9px", borderRadius:12,
                          background:`${c}15`, color:c, border:`1px solid ${c}35`, fontWeight:600 }}>{cnt} {p}</span>;
                      })}
                    </div>
                  </div>

                  {/* Global trade flash */}
                  {pulseTradeFlash && (
                    <div style={{ padding:"8px 12px", borderRadius:6, marginBottom:12, fontSize:11,
                      background: pulseTradeFlash.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      border:`1px solid ${pulseTradeFlash.ok?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`,
                      color: pulseTradeFlash.ok ? "#22c55e" : "#ef4444" }}>
                      {pulseTradeFlash.msg}
                    </div>
                  )}

                  {/* Summary */}
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", lineHeight:1.6,
                    marginBottom:14, paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    {mp.portfolioImplication.summary}
                  </p>

                  {/* Action cards */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:10 }}>
                    {mp.portfolioImplication.actions.map((a, i) => {
                      const ts      = typeStyles[a.type] || typeStyles.Watch;
                      const pc      = pBorder(a.priority);
                      const ticker  = a.ticker && a.ticker !== "null" ? a.ticker : null;
                      const held    = holdingInfo(ticker);
                      const isOpen  = pulseTradeOpen === i;
                      const canBuy  = a.type === "Buy" || a.type === "Rebalance";
                      const canSell = a.type === "Reduce";
                      const showBtn = ticker && (canBuy || canSell);

                      // For reduce: pick first account that holds the ticker; prefer the noted account
                      const reduceAcct = held[0]?.acct || "TFSA";
                      const reduceHolding = held.find(x => x.acct === reduceAcct) || held[0];
                      const reducedNewVal = reduceHolding
                        ? Math.max(0, reduceHolding.h.current * (1 - pulseReducePct / 100))
                        : 0;

                      return (
                        <div key={i} style={{ border:`1px solid ${ts.border}`, borderLeft:`3px solid ${pc}`,
                          background:ts.bg, borderRadius:8, padding:"12px 14px",
                          display:"flex", flexDirection:"column", gap:6 }}>

                          {/* Card header */}
                          <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4,
                              background:`${pc}18`, color:pc, border:`1px solid ${pc}30`, whiteSpace:"nowrap" }}>
                              {a.priority}
                            </span>
                            <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:4,
                              color:ts.color, border:`1px solid ${ts.border}`, background:ts.bg, whiteSpace:"nowrap" }}>
                              {ts.icon}
                            </span>
                            {ticker && (
                              <span style={{ fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                                padding:"2px 8px", borderRadius:4,
                                background: held.length ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.04)",
                                color: held.length ? "#22d3ee" : "rgba(255,255,255,0.4)",
                                border: held.length ? "1px solid rgba(34,211,238,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
                                {ticker}
                              </span>
                            )}
                            {/* Current value chips */}
                            {held.map(x => (
                              <span key={x.acct} style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                                color:"rgba(255,255,255,0.45)", fontFamily:"'JetBrains Mono',monospace" }}>
                                {x.acct} C${Math.round(x.h.current).toLocaleString()}
                              </span>
                            ))}
                          </div>

                          {/* Rationale */}
                          <p style={{ fontSize:11, color:"rgba(255,255,255,0.68)", lineHeight:1.55, margin:0 }}>
                            {a.action}
                          </p>

                          {/* Action button row */}
                          {showBtn && !isOpen && (
                            <div style={{ display:"flex", gap:6, marginTop:2 }}>
                              {canBuy && (
                                <button onClick={() => { setPulseTradeOpen(i); setPulseTradeAmt("");
                                  const def = held[0]?.acct || (ticker && RECOMMENDATIONS.find(r=>r.ticker===ticker)?.bestFor) || "TFSA";
                                  setPulseTradeAcct(def); }}
                                  style={{ fontSize:10, fontWeight:700, padding:"5px 14px", borderRadius:5,
                                    cursor:"pointer", background:"rgba(34,197,94,0.18)",
                                    border:"1px solid rgba(34,197,94,0.4)", color:"#22c55e" }}>
                                  ↑ Buy / Add
                                </button>
                              )}
                              {canSell && held.length > 0 && (
                                <button onClick={() => { setPulseTradeOpen(i); setPulseReducePct(25); }}
                                  style={{ fontSize:10, fontWeight:700, padding:"5px 14px", borderRadius:5,
                                    cursor:"pointer", background:"rgba(239,68,68,0.15)",
                                    border:"1px solid rgba(239,68,68,0.35)", color:"#ef4444" }}>
                                  ↓ Reduce
                                </button>
                              )}
                              {canSell && held.length === 0 && (
                                <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:3 }}>
                                  Not currently held
                                </span>
                              )}
                            </div>
                          )}

                          {/* ── Inline BUY panel ── */}
                          {isOpen && canBuy && (
                            <div style={{ marginTop:6, padding:"12px 14px", borderRadius:6,
                              background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.2)" }}>
                              <p style={{ fontSize:10, fontWeight:600, color:"#22c55e", marginBottom:10 }}>
                                ↑ Buy / Add to position
                              </p>
                              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:8 }}>
                                <div style={{ display:"flex", gap:4 }}>
                                  {portfolios.map(p => (
                                    <button key={p} onClick={() => setPulseTradeAcct(p)}
                                      style={{ fontSize:10, fontWeight:600, padding:"4px 10px", borderRadius:4,
                                        cursor:"pointer",
                                        background: pulseTradeAcct===p ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.04)",
                                        border: pulseTradeAcct===p ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(255,255,255,0.08)",
                                        color: pulseTradeAcct===p ? "#22c55e" : "rgba(255,255,255,0.4)" }}>
                                      {p}
                                    </button>
                                  ))}
                                </div>
                                <div style={{ display:"flex", alignItems:"center", gap:4, flex:"1 1 120px", minWidth:0 }}>
                                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", whiteSpace:"nowrap" }}>C$</span>
                                  <input type="number" min="0" placeholder="Amount"
                                    value={pulseTradeAmt}
                                    onChange={e => setPulseTradeAmt(e.target.value)}
                                    onKeyDown={e => e.key==="Enter" && executePulseBuy(ticker, a.action.split(" ")[0], pulseTradeAcct, pulseTradeAmt)}
                                    style={{ flex:1, minWidth:0, fontSize:11, fontFamily:"'JetBrains Mono',monospace",
                                      background:"rgba(255,255,255,0.05)", border:"1px solid rgba(34,197,94,0.3)",
                                      borderRadius:4, padding:"5px 8px", color:"rgba(255,255,255,0.8)" }} />
                                </div>
                              </div>
                              {held.find(x=>x.acct===pulseTradeAcct) && (
                                <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:8 }}>
                                  Currently C${Math.round(held.find(x=>x.acct===pulseTradeAcct).h.current).toLocaleString()} in {pulseTradeAcct}
                                  {pulseTradeAmt && !isNaN(pulseTradeAmt) && ` → C${Math.round(held.find(x=>x.acct===pulseTradeAcct).h.current + Number(pulseTradeAmt)).toLocaleString()} after`}
                                </p>
                              )}
                              <div style={{ display:"flex", gap:7 }}>
                                <button onClick={() => executePulseBuy(ticker, ticker, pulseTradeAcct, pulseTradeAmt)}
                                  style={{ fontSize:11, fontWeight:700, padding:"6px 18px", borderRadius:5,
                                    cursor:"pointer", background:"rgba(34,197,94,0.22)",
                                    border:"1px solid rgba(34,197,94,0.5)", color:"#22c55e" }}>
                                  Confirm Buy
                                </button>
                                <button onClick={() => setPulseTradeOpen(null)}
                                  style={{ fontSize:10, padding:"6px 12px", borderRadius:5, cursor:"pointer",
                                    background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                                    color:"rgba(255,255,255,0.35)" }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* ── Inline REDUCE panel ── */}
                          {isOpen && canSell && (
                            <div style={{ marginTop:6, padding:"12px 14px", borderRadius:6,
                              background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)" }}>
                              <p style={{ fontSize:10, fontWeight:600, color:"#ef4444", marginBottom:10 }}>
                                ↓ Reduce position
                              </p>
                              {held.map(x => (
                                <div key={x.acct} style={{ marginBottom:12 }}>
                                  <div style={{ display:"flex", justifyContent:"space-between",
                                    alignItems:"center", marginBottom:6 }}>
                                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>
                                      {x.acct} — C${Math.round(x.h.current).toLocaleString()} held
                                    </span>
                                    <span style={{ fontSize:11, fontWeight:700,
                                      fontFamily:"'JetBrains Mono',monospace", color:"#ef4444" }}>
                                      −{pulseReducePct}%
                                      <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400, marginLeft:6, fontSize:10 }}>
                                        → C${Math.round(Math.max(0, x.h.current*(1-pulseReducePct/100))).toLocaleString()} remaining
                                      </span>
                                    </span>
                                  </div>
                                  <input type="range" min="5" max="100" step="5"
                                    value={pulseReducePct}
                                    onChange={e => setPulseReducePct(Number(e.target.value))}
                                    style={{ width:"100%", accentColor:"#ef4444", marginBottom:8 }} />
                                  <div style={{ display:"flex", justifyContent:"space-between",
                                    fontSize:9, color:"rgba(255,255,255,0.25)", marginBottom:10 }}>
                                    <span>5%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                                  </div>
                                  <div style={{ display:"flex", gap:7 }}>
                                    <button onClick={() => executePulseReduce(ticker, x.acct, pulseReducePct)}
                                      style={{ fontSize:11, fontWeight:700, padding:"6px 18px", borderRadius:5,
                                        cursor:"pointer", background:"rgba(239,68,68,0.2)",
                                        border:"1px solid rgba(239,68,68,0.45)", color:"#ef4444" }}>
                                      Confirm Reduce
                                    </button>
                                    <button onClick={() => setPulseTradeOpen(null)}
                                      style={{ fontSize:10, padding:"6px 12px", borderRadius:5, cursor:"pointer",
                                        background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                                        color:"rgba(255,255,255,0.35)" }}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

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
                <div style={{ minWidth:220, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
                  borderRadius:10, padding:"14px 16px" }}>

                  {/* Title + numeric score */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.06em",
                      textTransform:"uppercase", margin:0 }}>Risk Meter</p>
                    <span style={{ fontSize:12, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                      color: risk.color }}>{risk.score}/100</span>
                  </div>

                  {/* Zone labels */}
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:8, color:"rgba(239,68,68,0.6)", textTransform:"uppercase", letterSpacing:"0.04em" }}>Risk-Off</span>
                    <span style={{ fontSize:8, color:"rgba(251,191,36,0.6)", textTransform:"uppercase", letterSpacing:"0.04em" }}>Neutral</span>
                    <span style={{ fontSize:8, color:"rgba(34,197,94,0.6)", textTransform:"uppercase", letterSpacing:"0.04em" }}>Risk-On</span>
                  </div>

                  {/* Track + thumb — wrapper tall enough for thumb to render without clipping */}
                  <div style={{ position:"relative", height:22, marginBottom:10 }}>
                    {/* Track: dark background, fill clips at score% so unvisited zones stay dark */}
                    <div style={{ position:"absolute", top:"50%", transform:"translateY(-50%)",
                      left:0, right:0, height:8, borderRadius:4,
                      background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
                      <div style={{
                        position:"absolute", left:0, top:0, bottom:0,
                        width:`${risk.score}%`,
                        background:"linear-gradient(90deg, #ef4444 0%, #f97316 25%, #eab308 50%, #84cc16 75%, #22c55e 100%)"
                      }} />
                    </div>
                    {/* Tick marks at zone boundaries */}
                    {[20,40,60,80].map(p => (
                      <div key={p} style={{ position:"absolute", top:"50%", left:`${p}%`,
                        transform:"translate(-50%,-50%)",
                        width:1.5, height:14, background:"rgba(0,0,0,0.5)", zIndex:2 }} />
                    ))}
                    {/* Thumb — sibling of the track, NOT inside overflow:hidden */}
                    <div style={{
                      position:"absolute", top:"50%",
                      left:`${Math.min(Math.max(risk.score,1),99)}%`,
                      transform:"translate(-50%,-50%)",
                      width:18, height:18, borderRadius:"50%", zIndex:3,
                      background: risk.color,
                      border:"2.5px solid rgba(255,255,255,0.95)",
                      boxShadow:`0 0 10px ${risk.color}90, 0 0 4px rgba(0,0,0,0.7)`
                    }} />
                  </div>

                  <p style={{ fontSize:13, fontWeight:700, color: risk.color,
                    textAlign:"center", marginBottom:3 }}>{risk.label}</p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)",
                    textAlign:"center", lineHeight:1.4 }}>{risk.sublabel}</p>
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

            {/* ── News Flash Panel ── */}
            {mp.newsSignals?.length > 0 && (
              <div className="card" style={{ marginBottom:16, padding:"16px 20px",
                background:"rgba(34,211,238,0.02)", borderColor:"rgba(34,211,238,0.1)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:14 }}>📰</span>
                  <p style={{ fontSize:11, fontWeight:700, color:"#22d3ee", margin:0 }}>News Flash</p>
                  <span style={{ fontSize:9, color:"rgba(34,211,238,0.4)", marginLeft:4 }}>
                    Bloomberg · CNBC · Reuters · FT · WSJ — portfolio impact analysis
                  </span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {mp.newsSignals.map((n, i) => {
                    const impactColor = n.impact === "bullish" ? "#22c55e"
                      : n.impact === "bearish" ? "#ef4444" : "#fbbf24";
                    const impactIcon = n.impact === "bullish" ? "▲" : n.impact === "bearish" ? "▼" : "→";
                    return (
                      <div key={i} style={{
                        display:"flex", gap:12, alignItems:"flex-start",
                        padding:"10px 14px", borderRadius:8,
                        background:`${impactColor}08`,
                        border:`1px solid ${impactColor}20`,
                        borderLeft:`3px solid ${impactColor}`
                      }}>
                        <div style={{ flexShrink:0, paddingTop:1 }}>
                          <span style={{ fontSize:11, fontWeight:700, color: impactColor }}>
                            {impactIcon}
                          </span>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                            <span style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:3,
                              background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.5)",
                              border:"1px solid rgba(255,255,255,0.1)", textTransform:"uppercase",
                              letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
                              {n.source}
                            </span>
                            <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)",
                              fontFamily:"'JetBrains Mono',monospace" }}>{n.date}</span>
                          </div>
                          <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.8)",
                            lineHeight:1.45, marginBottom:5 }}>{n.headline}</p>
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", lineHeight:1.5, margin:0 }}>
                            <span style={{ color: impactColor, fontWeight:600 }}>Portfolio impact: </span>
                            {n.portfolioImpact}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Yield Curve Panel ── */}
            {mp.yieldCurve && (() => {
              const yc = mp.yieldCurve;

              // SVG chart helpers
              const maturityX = { "3M": 18, "2Y": 68, "5Y": 130, "10Y": 210, "30Y": 290 };
              const yields = (yc.currentYields || []).filter(y => maturityX[y.maturity] !== undefined);
              const yVals  = yields.map(y => y.yield);
              const yMin   = Math.max(0, Math.min(...yVals) - 0.3);
              const yMax   = Math.max(...yVals) + 0.3;
              const yRange = yMax - yMin || 1;
              const toSvgY = v => 8 + (1 - (v - yMin) / yRange) * 74; // maps yield → SVG y (8–82)

              const spreadStatusColor = s =>
                s === "inverted" ? "#ef4444" : s === "warning" ? "#fbbf24" : "#22c55e";

              const points = yields.map(y => `${maturityX[y.maturity]},${toSvgY(y.yield).toFixed(1)}`).join(" ");

              return (
                <div className="card" style={{ marginBottom:16, padding:"16px 20px",
                  background:"rgba(34,211,238,0.02)", borderColor:"rgba(34,211,238,0.1)" }}>

                  {/* Header row */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" }}>
                    <p className="sec" style={{ margin:0, color:"#22d3ee88" }}>Yield Curve</p>
                    <span style={{ fontSize:11, fontWeight:600, padding:"2px 9px", borderRadius:4,
                      background: `${yc.shapeColor || "#fbbf24"}18`,
                      color: yc.shapeColor || "#fbbf24",
                      border: `1px solid ${yc.shapeColor || "#fbbf24"}35` }}>
                      {yc.shapeLabel}
                    </span>
                    {yc.inversionStatus && (
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)",
                        fontFamily:"'JetBrains Mono',monospace" }}>
                        {yc.inversionStatus}
                      </span>
                    )}
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:20, alignItems:"start" }}>

                    {/* Left: SVG curve chart */}
                    <div style={{ minWidth:200 }}>
                      <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginBottom:4,
                        textTransform:"uppercase", letterSpacing:"0.05em" }}>
                        US Treasury Yield Curve
                      </p>
                      <svg viewBox="0 0 310 100" style={{ width:"100%", maxWidth:310, display:"block",
                        background:"rgba(255,255,255,0.02)", borderRadius:6, border:"1px solid rgba(255,255,255,0.06)" }}>
                        {/* Horizontal grid lines */}
                        {[0.25, 0.5, 0.75].map(f => (
                          <line key={f} x1="12" x2="298" y1={8 + f * 74} y2={8 + f * 74}
                            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        ))}
                        {/* Zero-spread reference (horizontal at mid) */}
                        {yields.length >= 2 && (
                          <line x1="12" x2="298"
                            y1={toSvgY((yMax + yMin) / 2).toFixed(1)}
                            y2={toSvgY((yMax + yMin) / 2).toFixed(1)}
                            stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="3,3" />
                        )}
                        {/* Yield curve path */}
                        {yields.length >= 2 && (
                          <polyline points={points} fill="none"
                            stroke={yc.shapeColor || "#22d3ee"} strokeWidth="2"
                            strokeLinejoin="round" strokeLinecap="round" />
                        )}
                        {/* Dots + labels */}
                        {yields.map(y => {
                          const cx = maturityX[y.maturity];
                          const cy = toSvgY(y.yield);
                          return (
                            <g key={y.maturity}>
                              <circle cx={cx} cy={cy} r="3.5"
                                fill={yc.shapeColor || "#22d3ee"}
                                stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
                              <text x={cx} y={cy - 7} textAnchor="middle"
                                style={{ fontSize:"6.5px", fill:"rgba(255,255,255,0.55)",
                                  fontFamily:"'JetBrains Mono',monospace" }}>
                                {y.yield.toFixed(2)}%
                              </text>
                              <text x={cx} y={94} textAnchor="middle"
                                style={{ fontSize:"6px", fill:"rgba(255,255,255,0.3)",
                                  fontFamily:"'JetBrains Mono',monospace" }}>
                                {y.maturity}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Right: spreads + recession probability + context */}
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

                      {/* Recession probability bar */}
                      {yc.recessionProbability && (
                        <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:8,
                          border:"1px solid rgba(255,255,255,0.07)", padding:"10px 12px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                            <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)",
                              textTransform:"uppercase", letterSpacing:"0.05em" }}>
                              12-Month Recession Probability
                            </p>
                            <span style={{ fontSize:13, fontWeight:700,
                              fontFamily:"'JetBrains Mono',monospace",
                              color: (yc.recessionProbabilityScore || 0) >= 50 ? "#ef4444"
                                   : (yc.recessionProbabilityScore || 0) >= 25 ? "#fbbf24" : "#22c55e" }}>
                              {yc.recessionProbability}
                            </span>
                          </div>
                          {yc.recessionProbabilityScore != null && (
                            <div style={{ position:"relative", height:5, background:"rgba(255,255,255,0.06)",
                              borderRadius:3, overflow:"hidden" }}>
                              <div style={{ position:"absolute", left:0, top:0, bottom:0,
                                width:`${Math.min(yc.recessionProbabilityScore, 100)}%`,
                                background: yc.recessionProbabilityScore >= 50 ? "#ef4444"
                                          : yc.recessionProbabilityScore >= 25 ? "#fbbf24" : "#22c55e",
                                borderRadius:3, transition:"width 0.5s" }} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Spreads */}
                      {(yc.spreads || []).map(sp => (
                        <div key={sp.label} style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                          <div style={{ flex:1 }}>
                            <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>
                              {sp.label}
                              <span style={{ color:"rgba(255,255,255,0.2)", marginLeft:5, fontWeight:400 }}>
                                {sp.description}
                              </span>
                            </p>
                            <p style={{ fontSize:12, fontWeight:700, marginTop:1,
                              fontFamily:"'JetBrains Mono',monospace",
                              color: spreadStatusColor(sp.status) }}>
                              {sp.bps >= 0 ? "+" : ""}{sp.bps} bps
                            </p>
                          </div>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)", lineHeight:1.4,
                            maxWidth:160, textAlign:"right", marginTop:2 }}>{sp.note}</p>
                        </div>
                      ))}

                      {/* Trajectory + Canadian curve */}
                      {yc.trajectory && (
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", lineHeight:1.5,
                          borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:8 }}>
                          <span style={{ color:"rgba(255,255,255,0.2)", fontSize:9,
                            textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:2 }}>
                            Trajectory
                          </span>
                          {yc.trajectory}
                        </p>
                      )}
                      {yc.canadianCurve && (
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", lineHeight:1.5,
                          borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:8 }}>
                          <span style={{ color:"rgba(255,255,255,0.2)", fontSize:9,
                            textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:2 }}>
                            CAD curve
                          </span>
                          {yc.canadianCurve}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Scenario cards now also show Sector Rotation */}
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
                        {sc.sectorRotation && (
                          <div style={{ borderTop:`1px solid ${sc.color}20`, paddingTop:5 }}>
                            <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>Sector rotation</p>
                            <p style={{ fontSize:10, color:`${sc.color}cc`, lineHeight:1.4 }}>{sc.sectorRotation}</p>
                          </div>
                        )}
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

            {/* ── Trade Log ── */}
            {pulseTradeLog.length > 0 && (
              <div className="card" style={{ marginBottom:16, padding:"14px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.5)", margin:0 }}>
                    📋 Trade log <span style={{ fontSize:9, fontWeight:400, color:"rgba(255,255,255,0.25)", marginLeft:4 }}>logged from Action Center</span>
                  </p>
                  <button onClick={() => { setPulseTradeLog([]); localStorage.removeItem("pulse:tradeLog"); }}
                    style={{ fontSize:9, padding:"2px 8px", borderRadius:4, cursor:"pointer",
                      background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                      color:"rgba(255,255,255,0.25)" }}>
                    Clear
                  </button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {pulseTradeLog.slice(0, 20).map((t, i) => {
                    const isBuy = t.type === "Buy";
                    const tc    = isBuy ? "#22c55e" : "#ef4444";
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
                        padding:"6px 10px", borderRadius:6,
                        background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize:10, fontWeight:700, color:tc, minWidth:42 }}>{t.type}</span>
                        <span style={{ fontSize:11, fontWeight:600, fontFamily:"'JetBrains Mono',monospace",
                          color:"rgba(255,255,255,0.7)", minWidth:52 }}>{t.ticker}</span>
                        <span style={{ fontSize:9, padding:"1px 6px", borderRadius:3,
                          background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                          color:"rgba(255,255,255,0.4)" }}>{t.account}</span>
                        <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                          color:tc, fontWeight:600 }}>{t.note}</span>
                        <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", marginLeft:"auto",
                          whiteSpace:"nowrap" }}>
                          {new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

      {/* ════════════════════════════════════════════════════════════════════
          TAB: OPTIONS TRADING
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "options" && (() => {
        const mp       = marketPulse;
        const vix      = Number(mp.macroSignals?.find(c => c.category === "Equities")
          ?.signals?.find(s => s.label === "VIX")?.value?.replace(/[^0-9.]/g,"")) || 17;
        const ivEnv    = vix >= 25 ? { label:"High IV — great for selling premium", color:"#22c55e", icon:"🔥" }
                       : vix >= 18 ? { label:"Elevated IV — good conditions",       color:"#22c55e", icon:"✅" }
                       : vix >= 14 ? { label:"Low IV — be selective, smaller premiums", color:"#fbbf24", icon:"⚠" }
                       :             { label:"Very low IV — consider skipping",       color:"#ef4444", icon:"🔕" };
        const riskScore = mp.riskMeter?.score ?? 50;
        const regimeBias = riskScore >= 60
          ? "Risk-On: sell CCs on extended positions to lock in gains. Be cautious on new CSPs."
          : riskScore >= 40
          ? "Neutral: balanced premium selling. CCs on full positions, CSPs on names you want to own."
          : "Risk-Off: favour CSPs on quality at a discount. Avoid CCs that cap upside during recovery.";
        const baseRotation = mp.outlooks?.[0]?.scenarios?.find(s => s.label === "Base case")?.sectorRotation?.toLowerCase() || "";

        const fmt2 = n => Number(n).toFixed(2);
        const fmtK = n => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${Number(n).toFixed(0)}`;

        // ─ Covered call candidates: held positions + any watchlist tickers
        const heldTickers = new Set(
          portfolios.flatMap(acct => (holdings[acct] || []).map(h => h.ticker))
        );
        const ccFromHoldings = portfolios.flatMap(acct =>
          (holdings[acct] || []).map(h => {
            const price      = optionPrices[h.ticker];
            const estShares  = price ? Math.round(h.current / price) : null;
            const contracts  = estShares ? Math.floor(estShares / 100) : null;
            const iv         = estimateIV(h.ticker, vix);
            const sectorWord = (TICKER_DB[h.ticker]?.sector || "").toLowerCase().split(" ")[0];
            const ccSuggested = !baseRotation || !["underweight","avoid"].some(t => {
              const i = baseRotation.indexOf(t); return i !== -1 && baseRotation.slice(i,i+80).includes(sectorWord);
            });
            return { ticker: h.ticker, name: TICKER_DB[h.ticker]?.name || h.ticker, acct, price, estShares, contracts, iv, ccSuggested, fromHolding: true };
          })
        ).filter((h, idx, arr) => arr.findIndex(x => x.ticker === h.ticker) === idx);

        const ccFromWatchlist = optionWatchlist
          .filter(sym => !heldTickers.has(sym))
          .map(sym => {
            const price      = optionPrices[sym];
            const iv         = estimateIV(sym, vix);
            const ccSuggested = true;
            return { ticker: sym, name: TICKER_DB[sym]?.name || sym, acct: "—", price, estShares: null, contracts: null, iv, ccSuggested, fromHolding: false };
          });

        const ccCandidates = [...ccFromHoldings, ...ccFromWatchlist]
          .sort((a, b) => (b.contracts||0) - (a.contracts||0));

        // ─ CSP candidates: recommendations aligned with regime + watchlist tickers
        const cspFromRecs = RECOMMENDATIONS.filter(r => {
          const sectorWord = (r.sector || "").toLowerCase().split(" ")[0];
          const isAligned  = !baseRotation || ["overweight","add","rotate into","favor","tilt to"].some(t => {
            const i = baseRotation.indexOf(t); return i !== -1 && baseRotation.slice(i,i+90).includes(sectorWord);
          });
          return isAligned;
        }).map(r => ({
          ...r,
          price: optionPrices[r.ticker],
          iv: estimateIV(r.ticker, vix),
          fromWatchlist: false,
        })).slice(0, 12);

        const cspRecTickers = new Set(cspFromRecs.map(r => r.ticker));
        const cspFromWatchlist = optionWatchlist
          .filter(sym => !cspRecTickers.has(sym))
          .map(sym => ({
            ticker: sym, name: TICKER_DB[sym]?.name || sym,
            sector: TICKER_DB[sym]?.sector || "—",
            thesis: "Custom watchlist ticker.",
            bestFor: "TFSA",
            price: optionPrices[sym],
            iv: estimateIV(sym, vix),
            fromWatchlist: true,
          }));

        const cspCandidates = [...cspFromRecs, ...cspFromWatchlist];

        // ─ Trade log stats
        const openTrades   = optionTrades.filter(t => t.status === "open");
        const closedTrades = optionTrades.filter(t => t.status !== "open");
        const totalPremiumCollected = optionTrades.reduce((s, t) => s + (Number(t.premium) * 100 * Number(t.contracts)), 0);
        const realizedPnL = closedTrades.reduce((s, t) => {
          const received = Number(t.premium) * 100 * Number(t.contracts);
          const closed   = (Number(t.closePrice) || 0) * 100 * Number(t.contracts);
          return s + (t.status === "expired" ? received : t.status === "closed_profit" ? received - closed : -(closed - received));
        }, 0);
        const winCount  = closedTrades.filter(t => ["expired","closed_profit","assigned"].includes(t.status)).length;
        const winRate   = closedTrades.length ? Math.round(winCount / closedTrades.length * 100) : null;

        // ─ Shared watchlist ticker input (used by both CC and CSP)
        const renderWatchlistInput = (accentColor = "#22d3ee") => (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", whiteSpace:"nowrap" }}>+ Add any ticker:</span>
            <input
              value={optionWatchInput}
              onChange={e => setOptionWatchInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && addWatchlistTicker(optionWatchInput)}
              placeholder="e.g. NVDA, SPY, PLTR"
              style={{ fontSize:11, padding:"5px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.12)",
                background:"rgba(255,255,255,0.04)", color:"#fff", width:160, fontFamily:"'JetBrains Mono',monospace" }}
            />
            <button className="btn" onClick={() => addWatchlistTicker(optionWatchInput)}
              style={{ fontSize:10, padding:"5px 12px", color:accentColor, borderColor:`rgba(${accentColor==="a78bfa"?"167,139,250":"34,211,238"},0.3)` }}>
              Add
            </button>
            {optionWatchlist.map(sym => (
              <span key={sym} style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10,
                padding:"3px 8px", borderRadius:5, background:"rgba(255,255,255,0.05)",
                border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.65)",
                fontFamily:"'JetBrains Mono',monospace" }}>
                {sym}
                <button onClick={() => removeWatchlistTicker(sym)}
                  style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:11, padding:"0 0 0 4px", lineHeight:1 }}>
                  ×
                </button>
              </span>
            ))}
          </div>
        );

        // Sub-tab: Covered Calls
        const renderCC = () => (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.6, flex:"1 1 400px" }}>
                Sell call options on any stock — your holdings or any ticker you add. Collect premium upfront;
                if the stock stays below your strike at expiry you keep the premium. Ideal in neutral-to-mildly-bullish markets.
              </p>
              <button className="btn btn-primary" onClick={fetchOptionPrices} disabled={optionPricesLoading}
                style={{ fontSize:11, padding:"7px 16px", opacity: optionPricesLoading ? 0.6 : 1,
                  background:"rgba(34,211,238,0.12)", borderColor:"rgba(34,211,238,0.35)", color:"#22d3ee" }}>
                {optionPricesLoading ? "Loading…" : optionPrices && Object.keys(optionPrices).length ? "⟳ Refresh prices" : "📡 Load live prices"}
              </button>
            </div>
            {renderWatchlistInput("#22d3ee")}
            {optionPriceError && <p style={{ fontSize:10, color:"#ef4444", marginBottom:10 }}>⚠ {optionPriceError}</p>}

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {ccCandidates.map(h => {
                const selectedDTE = 30;
                const strikes = h.price ? getStrikeSuggestions(h.price, "cc", selectedDTE, h.iv) : [];
                return (
                  <div key={h.ticker + h.acct} className="card" style={{ padding:"14px 18px",
                    borderColor: h.ccSuggested ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.06)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:18, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#22d3ee" }}>
                          {h.ticker}
                        </span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{h.name}</span>
                        <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4,
                          background:"rgba(34,211,238,0.08)", color:"rgba(34,211,238,0.7)",
                          border:"1px solid rgba(34,211,238,0.2)" }}>{h.acct}</span>
                        {h.ccSuggested
                          ? <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, fontWeight:600,
                              background:"rgba(239,68,68,0.1)", color:"#ef4444",
                              border:"1px solid rgba(239,68,68,0.25)" }}>Regime: consider selling CC</span>
                          : <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4,
                              background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.3)",
                              border:"1px solid rgba(255,255,255,0.08)" }}>Regime: hold / no CC</span>
                        }
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ fontSize:12, fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,0.7)" }}>
                          {h.price ? `$${fmt2(h.price)}` : "—"} /share
                        </p>
                        {h.fromHolding ? (
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>
                            ~{h.estShares ?? "?"} shares · <span style={{ fontWeight:700,
                              color: (h.contracts||0) >= 1 ? "#22c55e" : "#ef4444" }}>
                              {(h.contracts||0) >= 1 ? `${h.contracts} contract${h.contracts>1?"s":""}` : "< 1 contract (need 100 shares)"}
                            </span>
                          </p>
                        ) : (
                          <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>
                            <span style={{ padding:"2px 6px", borderRadius:4, fontSize:9,
                              background:"rgba(251,191,36,0.08)", color:"#fbbf24",
                              border:"1px solid rgba(251,191,36,0.2)" }}>Watchlist</span>
                            {" "}enter contracts when logging
                          </p>
                        )}
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)" }}>Est. IV {Math.round(h.iv)}% · VIX×{(h.iv/vix).toFixed(1)}</p>
                      </div>
                    </div>

                    {/* Strike table — show for watchlist tickers regardless of share count */}
                    {h.price && (h.fromHolding ? (h.contracts||0) >= 1 : true) ? (
                      <div style={{ overflowX:"auto" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
                          <thead>
                            <tr style={{ color:"rgba(255,255,255,0.3)", textAlign:"left" }}>
                              {["","Strike","OTM %","Est. premium/sh","Per contract","Monthly yield","Ann. yield","Action"].map(col => (
                                <th key={col} style={{ padding:"4px 8px", fontWeight:500, whiteSpace:"nowrap" }}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {strikes.map(s => (
                              <tr key={s.label} style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                                <td style={{ padding:"6px 8px", color:"rgba(255,255,255,0.4)", fontWeight:600, fontSize:9 }}>{s.label}</td>
                                <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", color:"#22d3ee", fontWeight:700 }}>${s.strike}</td>
                                <td style={{ padding:"6px 8px", color:"rgba(255,255,255,0.5)" }}>+{s.pct}%</td>
                                <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>${fmt2(s.premiumPerShare)}</td>
                                <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>${s.contractPremium}</td>
                                <td style={{ padding:"6px 8px", color:"#fbbf24", fontWeight:600 }}>{s.monthlyYield}%</td>
                                <td style={{ padding:"6px 8px", color:"#a78bfa", fontWeight:600 }}>{s.annualYield}%</td>
                                <td style={{ padding:"6px 8px" }}>
                                  <button className="btn" onClick={() => setOptionNewTrade({
                                    ...DEFAULT_OPT_TRADE, type:"cc", ticker:h.ticker,
                                    account: h.fromHolding ? h.acct : "TFSA",
                                    contracts: h.fromHolding ? h.contracts : 1,
                                    strike: s.strike,
                                    expiry: new Date(Date.now() + 30*864e5).toISOString().split("T")[0],
                                    premium: s.premiumPerShare, underlyingPrice: h.price,
                                  })}
                                    style={{ fontSize:9, padding:"3px 9px", color:"#22d3ee",
                                      borderColor:"rgba(34,211,238,0.3)" }}>
                                    Log
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.2)", marginTop:6, fontStyle:"italic" }}>
                          ★ Premiums estimated from IV≈VIX×{(h.iv/vix).toFixed(1)} · 30 DTE · verify with your broker before trading
                        </p>
                      </div>
                    ) : !h.price ? (
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontStyle:"italic" }}>Load live prices to see strike suggestions.</p>
                    ) : (
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontStyle:"italic" }}>
                        Need at least 100 shares (~{fmtK(h.price * 100)} total) for 1 covered call contract.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

        // Sub-tab: CSPs
        const renderCSP = () => (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.6, flex:"1 1 400px" }}>
                Sell put options on any stock you want to own (or any ticker). You get paid premium upfront;
                if the stock stays above the strike you keep it. If assigned, you own shares at an effective discount.
                Best in neutral-to-bullish markets.
              </p>
              <button className="btn btn-primary" onClick={fetchOptionPrices} disabled={optionPricesLoading}
                style={{ fontSize:11, padding:"7px 16px", opacity: optionPricesLoading ? 0.6 : 1,
                  background:"rgba(167,139,250,0.12)", borderColor:"rgba(167,139,250,0.35)", color:"#a78bfa" }}>
                {optionPricesLoading ? "Loading…" : Object.keys(optionPrices).length ? "⟳ Refresh prices" : "📡 Load live prices"}
              </button>
            </div>
            {renderWatchlistInput("#a78bfa")}
            {optionPriceError && <p style={{ fontSize:10, color:"#ef4444", marginBottom:10 }}>⚠ {optionPriceError}</p>}

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(460px, 1fr))", gap:12 }}>
              {cspCandidates.map(r => {
                const strikes = r.price ? getStrikeSuggestions(r.price, "csp", 30, r.iv) : [];
                return (
                  <div key={r.ticker} className="card" style={{ padding:"14px 18px",
                    background:"rgba(167,139,250,0.03)", borderColor:"rgba(167,139,250,0.1)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                          <span style={{ fontSize:16, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:"#a78bfa" }}>
                            {r.ticker}
                          </span>
                          {r.fromWatchlist ? (
                            <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                              background:"rgba(251,191,36,0.08)", color:"#fbbf24",
                              border:"1px solid rgba(251,191,36,0.2)" }}>Watchlist</span>
                          ) : (
                            <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4,
                              background:"rgba(167,139,250,0.1)", color:"rgba(167,139,250,0.7)",
                              border:"1px solid rgba(167,139,250,0.2)" }}>✓ Regime aligned</span>
                          )}
                          <button onClick={() => removeWatchlistTicker(r.ticker)}
                            style={{ display: r.fromWatchlist ? "inline" : "none",
                              background:"none", border:"none", color:"rgba(255,255,255,0.25)", cursor:"pointer", fontSize:11, padding:0 }}>
                            ×
                          </button>
                        </div>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{r.name} · {r.sector}</p>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.55)", lineHeight:1.5, marginTop:4, maxWidth:320 }}>
                          {r.thesis.length > 100 ? r.thesis.slice(0,100) + "…" : r.thesis}
                        </p>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <p style={{ fontSize:13, fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,0.7)", fontWeight:600 }}>
                          {r.price ? `$${fmt2(r.price)}` : "—"}
                        </p>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)" }}>Est. IV {Math.round(r.iv)}%</p>
                        <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4, display:"inline-block", marginTop:3,
                          background: r.bestFor === "TFSA" ? "rgba(251,191,36,0.1)" : "rgba(34,211,238,0.1)",
                          color: r.bestFor === "TFSA" ? "#fbbf24" : "#22d3ee",
                          border:`1px solid ${r.bestFor === "TFSA" ? "rgba(251,191,36,0.25)" : "rgba(34,211,238,0.25)"}` }}>
                          {r.bestFor === "both" ? "TFSA / RRSP" : r.bestFor}
                        </span>
                      </div>
                    </div>

                    {r.price ? (
                      <>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
                          <thead>
                            <tr style={{ color:"rgba(255,255,255,0.3)", textAlign:"left" }}>
                              {["","Strike","OTM %","Premium/sh","Collateral","Monthly yield","Ann. yield","Action"].map(h => (
                                <th key={h} style={{ padding:"4px 6px", fontWeight:500, whiteSpace:"nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {strikes.map(s => (
                              <tr key={s.label} style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                                <td style={{ padding:"5px 6px", fontSize:9, color:"rgba(255,255,255,0.4)", fontWeight:600 }}>{s.label}</td>
                                <td style={{ padding:"5px 6px", fontFamily:"'JetBrains Mono',monospace", color:"#a78bfa", fontWeight:700 }}>${s.strike}</td>
                                <td style={{ padding:"5px 6px", color:"rgba(255,255,255,0.4)" }}>-{s.pct}%</td>
                                <td style={{ padding:"5px 6px", fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>${fmt2(s.premiumPerShare)}</td>
                                <td style={{ padding:"5px 6px", fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,0.5)" }}>{fmtK(s.strike * 100)}</td>
                                <td style={{ padding:"5px 6px", color:"#fbbf24", fontWeight:600 }}>{s.monthlyYield}%</td>
                                <td style={{ padding:"5px 6px", color:"#a78bfa", fontWeight:600 }}>{s.annualYield}%</td>
                                <td style={{ padding:"5px 6px" }}>
                                  <button className="btn" onClick={() => setOptionNewTrade({
                                    ...DEFAULT_OPT_TRADE, type:"csp", ticker:r.ticker, account: r.bestFor === "RRSP" ? "RRSP" : "TFSA",
                                    contracts:1, strike: s.strike,
                                    expiry: new Date(Date.now() + 30*864e5).toISOString().split("T")[0],
                                    premium: s.premiumPerShare, underlyingPrice: r.price,
                                  })}
                                    style={{ fontSize:9, padding:"3px 9px", color:"#a78bfa",
                                      borderColor:"rgba(167,139,250,0.3)" }}>
                                    Log
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.2)", marginTop:5, fontStyle:"italic" }}>
                          ★ Estimated premiums — confirm with your broker. Collateral = strike × 100 per contract.
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontStyle:"italic" }}>Load live prices to see strike table.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

        // Sub-tab: Trade Log
        const renderTradeLog = () => {
          const today = new Date().toISOString().split("T")[0];
          const tradeColor = t => t.type === "cc" ? "#22d3ee" : "#a78bfa";
          const statusColor = s => s === "open" ? "#fbbf24" : ["expired","closed_profit","assigned"].includes(s) ? "#22c55e" : "#ef4444";

          const tradePnl = t => {
            const received = Number(t.premium) * 100 * Number(t.contracts);
            if (t.status === "open")         return { val: received, label:"Max", color:"#fbbf24" };
            if (t.status === "expired")      return { val: received, label:"Realized", color:"#22c55e" };
            if (t.status === "assigned")     return { val: received, label:"Premium kept", color:"#22c55e" };
            const closeAmt = (Number(t.closePrice)||0) * 100 * Number(t.contracts);
            if (t.status === "closed_profit") return { val: received - closeAmt, label:"Realized", color:"#22c55e" };
            return { val: -(closeAmt - received), label:"Loss",    color:"#ef4444" };
          };

          return (
            <div>
              {/* Summary stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:10, marginBottom:16 }}>
                {[
                  { label:"Total premium collected", value: `$${Math.round(totalPremiumCollected)}`, color:"#22c55e" },
                  { label:"Realized P&L",             value: `${realizedPnL >= 0 ? "+" : ""}$${Math.round(realizedPnL)}`, color: realizedPnL >= 0 ? "#22c55e" : "#ef4444" },
                  { label:"Open positions",           value: openTrades.length, color:"#fbbf24" },
                  { label:"Win rate",                 value: winRate != null ? `${winRate}%` : "—", color: winRate >= 70 ? "#22c55e" : winRate >= 50 ? "#fbbf24" : "#ef4444" },
                ].map(s => (
                  <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
                    borderRadius:8, padding:"10px 14px" }}>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{s.label}</p>
                    <p style={{ fontSize:18, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Log new trade button / form */}
              {optionNewTrade === null ? (
                <button className="btn btn-primary" onClick={() => setOptionNewTrade({ ...DEFAULT_OPT_TRADE })}
                  style={{ marginBottom:14, fontSize:11, padding:"7px 18px",
                    background:"rgba(34,197,94,0.1)", borderColor:"rgba(34,197,94,0.3)", color:"#22c55e" }}>
                  + Log new trade
                </button>
              ) : (
                <div className="card" style={{ marginBottom:14, padding:"16px 20px",
                  background:"rgba(34,197,94,0.03)", borderColor:"rgba(34,197,94,0.15)" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <p style={{ fontSize:11, fontWeight:600, color:"#22c55e" }}>Log trade</p>
                    <button className="btn" onClick={() => setOptionNewTrade(null)}
                      style={{ fontSize:10, padding:"3px 9px", color:"rgba(255,255,255,0.35)" }}>✕</button>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:10, marginBottom:12 }}>
                    {[
                      { field:"type",           label:"Type",        type:"select",  opts:[["cc","Covered Call"],["csp","Cash-Secured Put"]] },
                      { field:"ticker",         label:"Ticker",      type:"text",    placeholder:"NVDA" },
                      { field:"account",        label:"Account",     type:"select",  opts: portfolios.map(p => [p, p]) },
                      { field:"contracts",      label:"Contracts",   type:"number",  placeholder:"1" },
                      { field:"strike",         label:"Strike ($)",  type:"number",  placeholder:"800" },
                      { field:"expiry",         label:"Expiry",      type:"date" },
                      { field:"premium",        label:"Premium/sh ($)", type:"number", placeholder:"5.20" },
                      { field:"underlyingPrice",label:"Stock price ($)",type:"number", placeholder:"750" },
                    ].map(({ field, label, type, opts, placeholder }) => (
                      <div key={field}>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginBottom:3, textTransform:"uppercase" }}>{label}</p>
                        {type === "select" ? (
                          <select value={optionNewTrade[field] || ""} onChange={e => setOptionNewTrade(t => ({ ...t, [field]: e.target.value }))}
                            style={{ width:"100%", fontSize:11, padding:"6px 8px", background:"rgba(255,255,255,0.05)",
                              border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, color:"rgba(255,255,255,0.7)" }}>
                            {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        ) : (
                          <input type={type} value={optionNewTrade[field] || ""} placeholder={placeholder}
                            onChange={e => setOptionNewTrade(t => ({ ...t, [field]: e.target.value }))}
                            style={{ width:"100%", fontSize:11, padding:"6px 8px", background:"rgba(255,255,255,0.05)",
                              border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, color:"rgba(255,255,255,0.7)",
                              boxSizing:"border-box" }} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginBottom:3, textTransform:"uppercase" }}>Notes</p>
                    <input type="text" value={optionNewTrade.notes || ""} placeholder="Optional — thesis, adjustment plan…"
                      onChange={e => setOptionNewTrade(t => ({ ...t, notes: e.target.value }))}
                      style={{ width:"100%", fontSize:11, padding:"6px 8px", background:"rgba(255,255,255,0.05)",
                        border:"1px solid rgba(255,255,255,0.12)", borderRadius:6, color:"rgba(255,255,255,0.7)",
                        boxSizing:"border-box", marginBottom:10 }} />
                  </div>
                  {/* Preview P&L */}
                  {optionNewTrade.premium && optionNewTrade.contracts && (
                    <div style={{ display:"flex", gap:16, marginBottom:12, padding:"8px 12px",
                      background:"rgba(34,197,94,0.07)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:8 }}>
                      <div>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>Premium collected</p>
                        <p style={{ fontSize:14, color:"#22c55e", fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
                          ${Math.round(Number(optionNewTrade.premium) * 100 * Number(optionNewTrade.contracts))}
                        </p>
                      </div>
                      {optionNewTrade.strike && (
                        <div>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>
                            {optionNewTrade.type === "csp" ? "Collateral req." : "Breakeven"}
                          </p>
                          <p style={{ fontSize:14, color:"#fbbf24", fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
                            {optionNewTrade.type === "csp"
                              ? fmtK(Number(optionNewTrade.strike) * 100 * Number(optionNewTrade.contracts))
                              : `$${fmt2(Number(optionNewTrade.strike) + Number(optionNewTrade.premium))}`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <button className="btn btn-primary" onClick={() => addOptionTrade(optionNewTrade)}
                    disabled={!optionNewTrade.ticker || !optionNewTrade.strike || !optionNewTrade.premium || !optionNewTrade.expiry}
                    style={{ fontSize:11, padding:"7px 20px", background:"rgba(34,197,94,0.15)",
                      borderColor:"rgba(34,197,94,0.4)", color:"#22c55e",
                      opacity: (!optionNewTrade.ticker || !optionNewTrade.strike || !optionNewTrade.premium || !optionNewTrade.expiry) ? 0.4 : 1 }}>
                    Save trade
                  </button>
                </div>
              )}

              {/* Open positions */}
              {openTrades.length > 0 && (
                <div className="card" style={{ marginBottom:14, padding:"14px 18px" }}>
                  <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.6)", marginBottom:10 }}>Open positions</p>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
                      <thead>
                        <tr style={{ color:"rgba(255,255,255,0.3)", textAlign:"left" }}>
                          {["Type","Ticker","Acct","Contracts","Strike","Expiry","Premium/sh","Max P&L","DTE","Action"].map(h => (
                            <th key={h} style={{ padding:"4px 8px", fontWeight:500, whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {openTrades.map(t => {
                          const dte = Math.ceil((new Date(t.expiry) - new Date()) / 864e5);
                          const pnl = tradePnl(t);
                          return (
                            <tr key={t.id} style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                              <td style={{ padding:"7px 8px" }}>
                                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, fontWeight:600,
                                  background:`${tradeColor(t)}15`, color: tradeColor(t),
                                  border:`1px solid ${tradeColor(t)}35` }}>
                                  {t.type === "cc" ? "CC" : "CSP"}
                                </span>
                              </td>
                              <td style={{ padding:"7px 8px", fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:"rgba(255,255,255,0.8)" }}>{t.ticker}</td>
                              <td style={{ padding:"7px 8px", color:"rgba(255,255,255,0.4)" }}>{t.account}</td>
                              <td style={{ padding:"7px 8px", textAlign:"center", color:"rgba(255,255,255,0.6)" }}>{t.contracts}</td>
                              <td style={{ padding:"7px 8px", fontFamily:"'JetBrains Mono',monospace", color: tradeColor(t) }}>${t.strike}</td>
                              <td style={{ padding:"7px 8px", color:"rgba(255,255,255,0.5)" }}>{t.expiry}</td>
                              <td style={{ padding:"7px 8px", fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>${fmt2(t.premium)}</td>
                              <td style={{ padding:"7px 8px", fontFamily:"'JetBrains Mono',monospace", color: pnl.color, fontWeight:700 }}>${Math.round(pnl.val)}</td>
                              <td style={{ padding:"7px 8px", color: dte <= 7 ? "#ef4444" : dte <= 14 ? "#fbbf24" : "rgba(255,255,255,0.5)", fontWeight: dte <= 7 ? 700 : 400 }}>{dte}d</td>
                              <td style={{ padding:"7px 8px" }}>
                                {optionClosing?.id === t.id ? (
                                  <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
                                    <input type="number" placeholder="Close $" value={optionClosing.closePrice || ""}
                                      onChange={e => setOptionClosing(c => ({ ...c, closePrice: e.target.value }))}
                                      style={{ width:68, fontSize:10, padding:"3px 6px" }} />
                                    {[["expired","Expired"],["closed_profit","Profit"],["closed_loss","Loss"],["assigned","Assigned"]].map(([s,l]) => (
                                      <button key={s} className="btn" onClick={() => closeOptionTrade(t.id, s, optionClosing.closePrice)}
                                        style={{ fontSize:9, padding:"3px 7px", color: statusColor(s),
                                          borderColor:`${statusColor(s)}40` }}>{l}</button>
                                    ))}
                                    <button className="btn" onClick={() => setOptionClosing(null)}
                                      style={{ fontSize:9, padding:"3px 7px" }}>✕</button>
                                  </div>
                                ) : (
                                  <div style={{ display:"flex", gap:5 }}>
                                    <button className="btn" onClick={() => setOptionClosing({ id: t.id, closePrice: "" })}
                                      style={{ fontSize:9, padding:"3px 9px", color:"#fbbf24",
                                        borderColor:"rgba(251,191,36,0.3)" }}>Close</button>
                                    <button className="btn" onClick={() => deleteOptionTrade(t.id)}
                                      style={{ fontSize:9, padding:"3px 7px", color:"rgba(239,68,68,0.6)",
                                        borderColor:"rgba(239,68,68,0.2)" }}>✕</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Closed trades */}
              {closedTrades.length > 0 && (
                <div className="card" style={{ padding:"14px 18px" }}>
                  <p style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:10 }}>Trade history</p>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
                      <thead>
                        <tr style={{ color:"rgba(255,255,255,0.3)", textAlign:"left" }}>
                          {["Type","Ticker","Acct","Strike","Opened","Closed","Premium/sh","Outcome","P&L"].map(h => (
                            <th key={h} style={{ padding:"4px 8px", fontWeight:500, whiteSpace:"nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {closedTrades.map(t => {
                          const pnl = tradePnl(t);
                          return (
                            <tr key={t.id} style={{ borderTop:"1px solid rgba(255,255,255,0.05)", opacity:0.75 }}>
                              <td style={{ padding:"6px 8px" }}>
                                <span style={{ fontSize:9, padding:"2px 5px", borderRadius:4, fontWeight:600,
                                  background:`${tradeColor(t)}12`, color: tradeColor(t) }}>
                                  {t.type === "cc" ? "CC" : "CSP"}
                                </span>
                              </td>
                              <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,0.6)" }}>{t.ticker}</td>
                              <td style={{ padding:"6px 8px", color:"rgba(255,255,255,0.35)" }}>{t.account}</td>
                              <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", color:"rgba(255,255,255,0.5)" }}>${t.strike}</td>
                              <td style={{ padding:"6px 8px", color:"rgba(255,255,255,0.35)" }}>{t.openedAt}</td>
                              <td style={{ padding:"6px 8px", color:"rgba(255,255,255,0.35)" }}>{t.closedAt || "—"}</td>
                              <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace", color:"#22c55e" }}>${fmt2(t.premium)}</td>
                              <td style={{ padding:"6px 8px" }}>
                                <span style={{ fontSize:9, color: statusColor(t.status) }}>{OPT_STATUS_LABELS[t.status]}</span>
                              </td>
                              <td style={{ padding:"6px 8px", fontFamily:"'JetBrains Mono',monospace",
                                color: pnl.color, fontWeight:600 }}>
                                {pnl.val >= 0 ? "+" : ""}${Math.round(pnl.val)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {optionTrades.length === 0 && (
                <div className="card" style={{ textAlign:"center", padding:"40px 20px" }}>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:6 }}>No trades logged yet.</p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>Use the Covered Calls or CSP tabs to find setups, then click "Log" to track them here.</p>
                </div>
              )}
            </div>
          );
        };

        // Sub-tab: AI Analysis
        const renderAIAnalysis = () => {
          const riskColor  = { Low:"#22c55e", Medium:"#fbbf24", High:"#ef4444" };
          const riskBg     = { Low:"rgba(34,197,94,0.12)", Medium:"rgba(251,191,36,0.12)", High:"rgba(239,68,68,0.12)" };
          const riskBorder = { Low:"rgba(34,197,94,0.25)", Medium:"rgba(251,191,36,0.25)", High:"rgba(239,68,68,0.25)" };
          const verdictColor = { Strong:"#22c55e", Consider:"#fbbf24", Skip:"rgba(255,255,255,0.35)" };
          const typeColor    = { cc:"#22d3ee", csp:"#a78bfa" };
          const typeBg      = { cc:"rgba(34,211,238,0.10)", csp:"rgba(167,139,250,0.10)" };
          const an = aiOptionsAnalysis;

          return (
            <div>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>
                    Claude analyses your holdings and cash to surface specific CC and CSP trades, rated by risk.
                    Load live prices first for best results.
                  </p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                  <button className="btn btn-primary" onClick={fetchAIOptionsAnalysis}
                    disabled={aiOptionsLoading}
                    style={{ fontSize:11, padding:"7px 18px",
                      background:"rgba(167,139,250,0.15)", borderColor:"rgba(167,139,250,0.4)",
                      color:"#a78bfa", opacity: aiOptionsLoading ? 0.6 : 1 }}>
                    {aiOptionsLoading ? "⏳ Analysing…" : an ? "⟳ Regenerate" : "🤖 Generate Analysis"}
                  </button>
                  {an?.generatedAt && (
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.25)" }}>
                      Last generated {new Date(an.generatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {aiOptionsError && (
                <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.08)",
                  border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, marginBottom:12,
                  fontSize:11, color:"#ef4444" }}>
                  ⚠ {aiOptionsError}
                </div>
              )}

              {!an && !aiOptionsLoading && (
                <div className="card" style={{ textAlign:"center", padding:"48px 24px" }}>
                  <p style={{ fontSize:28, marginBottom:10 }}>🤖</p>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>No analysis yet</p>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.25)", maxWidth:360, margin:"0 auto" }}>
                    Click "Generate Analysis" to have Claude evaluate your holdings and cash and recommend
                    specific CC and CSP trades rated Low / Medium / High risk.
                  </p>
                </div>
              )}

              {an && (
                <>
                  {/* Context pills + summary */}
                  <div className="card" style={{ padding:"14px 18px", marginBottom:14,
                    background:"rgba(167,139,250,0.05)", borderColor:"rgba(167,139,250,0.18)" }}>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
                      <span style={{ fontSize:10, padding:"2px 9px", borderRadius:20,
                        background:"rgba(167,139,250,0.12)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.3)" }}>
                        {an.regime}
                      </span>
                      <span style={{ fontSize:10, padding:"2px 9px", borderRadius:20,
                        background:"rgba(234,179,8,0.10)", color:"#fbbf24", border:"1px solid rgba(234,179,8,0.25)" }}>
                        VIX {an.vix}
                      </span>
                      <span style={{ fontSize:10, padding:"2px 9px", borderRadius:20,
                        background: an.riskScore >= 60 ? "rgba(34,197,94,0.1)" : an.riskScore >= 40 ? "rgba(234,179,8,0.1)" : "rgba(239,68,68,0.1)",
                        color:      an.riskScore >= 60 ? "#22c55e"             : an.riskScore >= 40 ? "#fbbf24"             : "#ef4444",
                        border:`1px solid ${an.riskScore >= 60 ? "rgba(34,197,94,0.25)" : an.riskScore >= 40 ? "rgba(234,179,8,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                        Risk score {an.riskScore}/100
                      </span>
                    </div>
                    <p style={{ fontSize:12, color:"rgba(255,255,255,0.7)", lineHeight:1.65, margin:0 }}>
                      {an.summary}
                    </p>
                  </div>

                  {/* Trade cards */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(440px, 1fr))", gap:12 }}>
                    {(an.trades || []).map((tr, i) => {
                      const rc = riskColor[tr.risk]  || "#fbbf24";
                      const rb = riskBg[tr.risk]     || "rgba(251,191,36,0.08)";
                      const rbo= riskBorder[tr.risk] || "rgba(251,191,36,0.2)";
                      const tc = typeColor[tr.type]  || "#a78bfa";
                      const tb = typeBg[tr.type]     || "rgba(167,139,250,0.08)";
                      const vc = verdictColor[tr.verdict] || "#fbbf24";
                      const cashReq = tr.type === "csp"
                        ? `$${(tr.strike * 100 * (tr.contracts || 1)).toLocaleString()} collateral`
                        : null;

                      return (
                        <div key={i} className="card" style={{ padding:"16px 18px",
                          background: rb, border:`1px solid ${rbo}` }}>
                          {/* Card top row */}
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, flexWrap:"wrap" }}>
                            {/* Type badge */}
                            <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:4,
                              background: tb, color: tc, border:`1px solid ${tc}30`, textTransform:"uppercase" }}>
                              {tr.type === "cc" ? "CC" : "CSP"}
                            </span>
                            {/* Risk badge */}
                            <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:4,
                              background:"rgba(0,0,0,0.25)", color: rc, border:`1px solid ${rc}50` }}>
                              {tr.risk} Risk
                            </span>
                            {/* Verdict */}
                            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4,
                              background:"rgba(0,0,0,0.2)", color: vc }}>
                              {tr.verdict === "Strong" ? "✓ Strong" : tr.verdict === "Consider" ? "○ Consider" : "✕ Skip"}
                            </span>
                            <span style={{ flex:1 }} />
                            {/* Account chip */}
                            <span style={{ fontSize:9, padding:"1px 7px", borderRadius:3,
                              background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.45)",
                              border:"1px solid rgba(255,255,255,0.1)", letterSpacing:"0.04em" }}>
                              {tr.account}
                            </span>
                          </div>

                          {/* Ticker + name */}
                          <p style={{ fontSize:18, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                            color:"rgba(255,255,255,0.92)", marginBottom:2 }}>
                            {tr.ticker}
                          </p>
                          {tr.name && (
                            <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:10 }}>{tr.name}</p>
                          )}

                          {/* Strike / DTE / contracts grid */}
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:12 }}>
                            {[
                              ["Strike",    `$${tr.strike}`],
                              ["DTE",       `${tr.dte}d`],
                              ["Contracts", tr.contracts],
                              tr.type === "csp"
                                ? ["Collateral", cashReq]
                                : ["Yield/mo",   `${tr.monthlyYieldPct?.toFixed(1)}%`],
                            ].map(([label, val]) => (
                              <div key={label} style={{ textAlign:"center", padding:"6px 4px",
                                background:"rgba(0,0,0,0.18)", borderRadius:6, border:"1px solid rgba(255,255,255,0.06)" }}>
                                <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", textTransform:"uppercase",
                                  letterSpacing:"0.06em", marginBottom:2 }}>{label}</p>
                                <p style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.85)",
                                  fontFamily:"'JetBrains Mono',monospace" }}>{val}</p>
                              </div>
                            ))}
                          </div>

                          {/* Premium row */}
                          <div style={{ display:"flex", gap:16, marginBottom:12, padding:"8px 12px",
                            background:"rgba(34,197,94,0.06)", borderRadius:8, border:"1px solid rgba(34,197,94,0.12)" }}>
                            <div>
                              <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>Per share</p>
                              <p style={{ fontSize:14, fontWeight:700, color:"#22c55e",
                                fontFamily:"'JetBrains Mono',monospace" }}>
                                ${tr.premiumEst?.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>Per contract</p>
                              <p style={{ fontSize:14, fontWeight:700, color:"#22c55e",
                                fontFamily:"'JetBrains Mono',monospace" }}>
                                ${tr.contractPremium}
                              </p>
                            </div>
                            {tr.contracts > 1 && (
                              <div>
                                <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>Total est.</p>
                                <p style={{ fontSize:14, fontWeight:700, color:"#22c55e",
                                  fontFamily:"'JetBrains Mono',monospace" }}>
                                  ${(tr.contractPremium * tr.contracts).toLocaleString()}
                                </p>
                              </div>
                            )}
                            {tr.type === "cc" && tr.monthlyYieldPct && (
                              <div>
                                <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginBottom:2 }}>Monthly yield</p>
                                <p style={{ fontSize:14, fontWeight:700, color:"#84cc16",
                                  fontFamily:"'JetBrains Mono',monospace" }}>
                                  {tr.monthlyYieldPct.toFixed(1)}%
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Rationale */}
                          <p style={{ fontSize:11, color:"rgba(255,255,255,0.6)", lineHeight:1.6, marginBottom:10 }}>
                            {tr.rationale}
                          </p>

                          {/* Risks */}
                          {tr.risks?.length > 0 && (
                            <div style={{ marginBottom:12 }}>
                              <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase",
                                letterSpacing:"0.06em", marginBottom:4 }}>Key risks</p>
                              <ul style={{ margin:0, paddingLeft:16 }}>
                                {tr.risks.map((r, ri) => (
                                  <li key={ri} style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginBottom:2 }}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Log Trade button */}
                          {tr.verdict !== "Skip" && (
                            <button
                              onClick={() => {
                                setOptionNewTrade({
                                  type:     tr.type,
                                  ticker:   tr.ticker,
                                  account:  tr.account,
                                  strike:   String(tr.strike),
                                  premium:  String(tr.premiumEst?.toFixed(2) || ""),
                                  contracts:String(tr.contracts || 1),
                                  dte:      String(tr.dte),
                                  expiry:   "",
                                  notes:    tr.rationale?.slice(0, 120) || "",
                                  status:   "open",
                                });
                                setOptionSubTab(tr.type === "cc" ? "cc" : "csp");
                              }}
                              style={{ width:"100%", padding:"7px 0", fontSize:11, fontWeight:600,
                                background:`${tc}18`, border:`1px solid ${tc}40`, borderRadius:7,
                                color: tc, cursor:"pointer", letterSpacing:"0.03em" }}>
                              ↗ Pre-fill in {tr.type === "cc" ? "Covered Calls" : "CSP"} tab
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        };

        return (
          <div style={{ padding:"22px 28px" }}>

            {/* ── IV environment + regime bias strip ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div className="card" style={{ padding:"12px 16px",
                background:`${ivEnv.color}08`, borderColor:`${ivEnv.color}20` }}>
                <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase",
                  letterSpacing:"0.06em", marginBottom:4 }}>IV Environment · VIX {vix.toFixed(1)}</p>
                <p style={{ fontSize:13, fontWeight:600, color: ivEnv.color }}>
                  {ivEnv.icon} {ivEnv.label}
                </p>
              </div>
              <div className="card" style={{ padding:"12px 16px",
                background:"rgba(167,139,250,0.03)", borderColor:"rgba(167,139,250,0.1)" }}>
                <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase",
                  letterSpacing:"0.06em", marginBottom:4 }}>Regime bias · {mp.regime?.label}</p>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", lineHeight:1.5 }}>{regimeBias}</p>
              </div>
            </div>

            {/* ── Sub-tab navigation ── */}
            <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
              {[
                ["cc",     "📞 Covered Calls"],
                ["csp",    "🛡 Cash-Secured Puts"],
                ["trades", "📋 Trade Log"],
                ["ai",     "🤖 AI Analysis"],
              ].map(([v,l]) => (
                <button key={v} className={`tab-btn ${optionSubTab===v?"on":""}`}
                  onClick={() => setOptionSubTab(v)}
                  style={{
                    padding:"6px 14px", fontSize:11,
                    ...(v === "ai" && optionSubTab !== "ai"
                      ? { borderColor:"rgba(167,139,250,0.35)", color:"rgba(167,139,250,0.8)" }
                      : {}),
                  }}>
                  {l}
                </button>
              ))}
            </div>

            {optionSubTab === "cc"     && renderCC()}
            {optionSubTab === "csp"    && renderCSP()}
            {optionSubTab === "trades" && renderTradeLog()}
            {optionSubTab === "ai"     && renderAIAnalysis()}

            <p style={{ fontSize:10, color:"rgba(255,255,255,0.15)", marginTop:20, lineHeight:1.6 }}>
              ⚠ Not financial advice. Premium estimates are mathematical approximations based on VIX-derived IV and are not live options quotes —
              always verify with your broker before trading. Options trading involves significant risk of loss and may not be suitable for all investors.
              Covered calls and CSPs in registered Canadian accounts (TFSA/RRSP) are generally permitted but rules vary by broker.
            </p>
          </div>
        );
      })()}

      {/* ── Broker import preview modal ── */}
      {brokerImportPreview && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", zIndex:9999,
          display:"flex", alignItems:"center", justifyContent:"center", padding:24,
        }} onClick={() => setBrokerImportPreview(null)}>
          <div style={{
            background:"#1e293b", border:"1px solid rgba(251,191,36,0.3)",
            borderRadius:14, padding:"28px 32px", maxWidth:480, width:"100%",
            boxShadow:"0 24px 60px rgba(0,0,0,0.6)",
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize:15, fontWeight:700, color:"#f1f5f9", marginBottom:16 }}>
              Broker import ready
            </p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:16 }}>
              Claude analysed your holdings CSV. Review the summary below, then confirm to load into the app.
              Existing holdings in these accounts will be replaced.
              {brokerImportPreview.skipped > 0 && (
                <span style={{ display:"block", marginTop:6, color:"#94a3b8" }}>
                  ✂ {brokerImportPreview.skipped} managed / private-equity position{brokerImportPreview.skipped !== 1 ? "s" : ""} excluded automatically.
                </span>
              )}
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
              {Object.entries(brokerImportPreview.byAccount).map(([acct, { count, totalCAD }]) => (
                <div key={acct} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"10px 14px",
                  border:"1px solid rgba(255,255,255,0.07)",
                }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"#fbbf24" }}>{acct}</span>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.55)" }}>
                    {count} position{count !== 1 ? "s" : ""} &nbsp;·&nbsp;
                    C${Math.round(totalCAD).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn btn-primary" style={{ flex:1, padding:"10px 0", fontSize:13 }}
                onClick={applyBrokerImport}>
                ✓ Import {brokerImportPreview.rows.length} holdings
              </button>
              <button className="btn" style={{ padding:"10px 16px", fontSize:13 }}
                onClick={() => setBrokerImportPreview(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Targets preview modal ── */}
      {aiTargetsPreview && (() => {
        const { suggestions } = aiTargetsPreview;
        const newSum = suggestions.reduce((s, x) => s + x.target, 0);
        const oldSum = suggestions.reduce((s, x) => s + x.oldTarget, 0);
        return (
          <div style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:9999,
            display:"flex", alignItems:"center", justifyContent:"center", padding:24,
          }} onClick={() => setAiTargetsPreview(null)}>
            <div style={{
              background:"#1e293b", border:"1px solid rgba(167,139,250,0.35)",
              borderRadius:14, padding:"28px 32px", maxWidth:680, width:"100%",
              maxHeight:"85vh", overflowY:"auto",
              boxShadow:"0 24px 60px rgba(0,0,0,0.65)",
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                <p style={{ fontSize:15, fontWeight:700, color:"#f1f5f9", margin:0 }}>
                  ✨ AI Target Suggestions — {aiTargetsPreview.account}
                </p>
                <span style={{
                  fontSize:11, padding:"3px 10px", borderRadius:20,
                  background: Math.abs(newSum - 100) <= 1 ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)",
                  border: `1px solid ${Math.abs(newSum - 100) <= 1 ? "rgba(52,211,153,0.4)" : "rgba(239,68,68,0.4)"}`,
                  color: Math.abs(newSum - 100) <= 1 ? "#34d399" : "#ef4444",
                  fontWeight:600,
                }}>
                  Total: {newSum}%
                </span>
              </div>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:18 }}>
                Review before applying — targets, CAGR, and dividend yield will be updated. Cost basis and current values are unchanged.
              </p>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                      {["Ticker","Was →  Now","Δ","CAGR","Div%","Rationale"].map(h => (
                        <th key={h} style={{ padding:"6px 10px", textAlign:"left", color:"rgba(255,255,255,0.4)", fontWeight:500, fontSize:10, letterSpacing:"0.08em", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map(s => {
                      const delta = s.target - s.oldTarget;
                      const deltaColor = delta > 0 ? "#34d399" : delta < 0 ? "#f87171" : "rgba(255,255,255,0.25)";
                      return (
                        <tr key={s.ticker} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding:"8px 10px", fontWeight:700, color:"#a78bfa" }}>{s.ticker}</td>
                          <td style={{ padding:"8px 10px", whiteSpace:"nowrap", fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>
                            <span style={{ color:"rgba(255,255,255,0.35)" }}>{s.oldTarget}%</span>
                            <span style={{ color:"rgba(255,255,255,0.2)", margin:"0 4px" }}>→</span>
                            <span style={{ color:"#f1f5f9", fontWeight:600 }}>{s.target}%</span>
                          </td>
                          <td style={{ padding:"8px 10px", color:deltaColor, fontWeight:600, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>
                            {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${delta}%`}
                          </td>
                          <td style={{ padding:"8px 10px", color:"#a78bfa" }}>{s.cagr}%</td>
                          <td style={{ padding:"8px 10px", color:"rgba(255,255,255,0.55)" }}>{s.divYield}%</td>
                          <td style={{ padding:"8px 10px", color:"rgba(255,255,255,0.5)", fontSize:11, maxWidth:240 }}>{s.rationale}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.02)" }}>
                      <td style={{ padding:"8px 10px", fontWeight:700, color:"rgba(255,255,255,0.6)", fontSize:11 }}>TOTAL</td>
                      <td style={{ padding:"8px 10px", fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>
                        <span style={{ color:"rgba(255,255,255,0.35)" }}>{oldSum}%</span>
                        <span style={{ color:"rgba(255,255,255,0.2)", margin:"0 4px" }}>→</span>
                        <span style={{ color: Math.abs(newSum - 100) <= 1 ? "#34d399" : "#ef4444", fontWeight:700 }}>{newSum}%</span>
                      </td>
                      <td colSpan={4}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:20 }}>
                <button className="btn btn-primary" style={{ flex:1, padding:"10px 0", fontSize:13 }}
                  onClick={applyAiTargets}>
                  ✓ Apply targets
                </button>
                <button className="btn" style={{ padding:"10px 16px", fontSize:13 }}
                  onClick={() => setAiTargetsPreview(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
