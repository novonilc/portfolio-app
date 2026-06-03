#!/usr/bin/env node
// refresh-scanner.mjs — rebuilds src/data/stockUniverse.json daily.
//
// What it does:
//   1. Fetches the full S&P 500 constituent list from a public GitHub dataset
//   2. Adds top Canadian TSX stocks (hardcoded)
//   3. Fetches live fundamentals from Yahoo Finance for every ticker
//   4. Preserves manually curated moat descriptions and isBank flags
//   5. Writes the updated stockUniverse.json
//
// Run:  node scripts/refresh-scanner.mjs
// Requires Node.js 18+ (built-in fetch).

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../src/data/stockUniverse.json');
const DELAY_MS  = 320; // polite delay between Yahoo Finance requests

// ── Manually curated competitive moats ───────────────────────────────────────
// These are preserved across every rebuild — edit here, not in the JSON.
const CURATED_MOATS = {
  AAPL:'Brand & Ecosystem',            MSFT:'Cloud / AI Platform',
  GOOGL:'Search / AI',                 META:'Social Network Effect',
  NVDA:'AI Chip Monopoly',             AMZN:'AWS / Logistics',
  AVGO:'Custom AI ASICs',              ARM:'CPU IP Royalties',
  ORCL:'Enterprise Database',          NOW:'Enterprise Workflow Lock-in',
  CRWD:'Cybersecurity Platform',       PLTR:'AI Gov / Defense Platform',
  AMD:'CPU/GPU Architecture',          MU:'HBM AI Memory Technology',
  QCOM:'Mobile Chip Patents',          TSM:'Advanced Node Foundry',
  MRVL:'Custom AI ASIC for Hyperscalers', ANET:'AI Data Center Networking',
  PANW:'Cybersecurity Platform',       FICO:'Credit Score Monopoly',
  MSCI:'Index Licensing Oligopoly',    JPM:'Global Banking Scale',
  BAC:'Retail Banking Scale',          GS:'Investment Banking Franchise',
  V:'Global Payment Network',          MA:'Global Payment Network',
  AXP:'Premium Brand / Network',       'BRK.B':'Diversified Conglomerate',
  SCHW:'Brokerage Scale',              PYPL:'Digital Payments Network',
  LLY:'GLP-1 IP Pipeline',            JNJ:'Diversified Pharma / MedTech',
  ABBV:'Immunology IP',               UNH:'MCO Scale & Data Advantage',
  ISRG:'Robotic Surgery Platform',     NVO:'GLP-1 Dual IP Estate',
  IDXX:'Vet Diagnostic Platform',      KO:'Global Consumer Brand',
  PG:'Brand Portfolio',               COST:'Membership / Cost Leader',
  WMT:'Scale / Supply Chain',          HD:'Home Improvement Duopoly',
  NFLX:'Content Scale + Network',      TSLA:'EV Brand / Charging Network',
  NKE:'Global Athletic Brand',         MNST:'Energy Drink + Coke Distrib',
  XOM:'Integrated Oil Major',          CVX:'Integrated Oil Major',
  OXY:'Permian Basin Acreage',         RTX:'Gov Contracts / Missile Backlog',
  LMT:'Defense Prime Monopoly',        GE:'Jet Engine Duopoly (LEAP)',
  HON:'Industrial Automation Scale',   AXON:'Police Tech Ecosystem Lock-in',
  ITW:'80/20 Industrial Niche',        FAST:'Onsite Distribution Lock-in',
  TDG:'FAA Sole-Source Aerospace Parts', ODFL:'LTL Service Excellence',
  LIN:'Industrial Gas Oligopoly',      CSWI:'Niche Industrial Products',
  TREX:'Composite Decking Leader',     FIX:'HVAC/Mechanical Contracting',
  ESAB:'Industrial Welding Scale',     NVT:'Electrical Enclosure Scale',
  SFM:'Natural Grocery Niche',         COKE:'Regional Bottler Monopoly',
  CIVI:'DJ Basin Acreage',             RRC:'Appalachian Natural Gas',
  NOG:'Non-Op Working Interest',       HIMS:'D2C Telehealth + GLP-1',
  DUOL:'Gamified Learning Platform',   CAVA:'Fast Casual Med. Concept',
  BROS:'Drive-Thru Coffee Brand',      PRDO:'For-Profit College Niche',
  T:'Wireless Network Infrastructure', VZ:'Wireless Network Infrastructure',
  ENB:'Regulated Pipeline Monopoly',   TRP:'Regulated Canadian Pipeline',
  TD:'Canadian Banking Oligopoly',     RY:'Canadian Banking Oligopoly',
  BNS:'LatAm Banking Franchise',       MFC:'Insurance Distribution Network',
  SHOP:'E-Commerce Platform',          TFII:'Trucking + Last Mile Scale',
  ATD:'Convenience + Fuel Scale',      CNQ:'Low-Cost Oil Sands',
  'SU.TO':'$45/bbl Break-Even Advantage', LNTH:'Nuclear Medicine Imaging',
  SLF:'Insurance Distribution Scale',  BMO:'Canadian Banking Oligopoly',
  CM:'Canadian Banking Oligopoly',     'CP.TO':'North American Rail Duopoly',
  'CNR.TO':'North American Rail Duopoly', BAM:'Alternative Asset Management',
  'WSP.TO':'Global Engineering Consulting',
  MGRC:'Modular Space Rental',         DXPE:'Industrial MRO Distribution',
  GMS:'Wallboard Distribution Scale',  HAYW:'Pool Equipment Platform',
  AAON:'Custom HVAC Manufacturer',
};

// ── isBank overrides (banks/insurers — D/E excluded from scoring) ─────────────
const BANK_TICKERS = new Set([
  'JPM','BAC','GS','WFC','C','USB','PNC','TFC','RF','KEY','HBAN','CFG','FITB',
  'MTB','ZION','CMA','BK','STT','NTRS','SIVB','SCHW','AXP','COF','DFS','SYF',
  'BLK','TROW','IVZ','BEN','AMG','FNF','PRU','MET','AFL','ALL','TRV','CB',
  'HIG','LNC','SFG','GL','RGA','PFG','VOYA','CNO','UNM',
  'TD','RY','BNS','BMO','CM','MFC','SLF', // Canadian banks/insurers
]);

// ── Canadian stocks not in the S&P 500 ───────────────────────────────────────
const CA_STOCKS = [
  { ticker:'ENB',    name:'Enbridge',                    sector:'Energy Infra',    market:'CA' },
  { ticker:'CNQ',    name:'Canadian Natural Resources',   sector:'Energy',          market:'CA' },
  { ticker:'SU.TO',  name:'Suncor Energy',                sector:'Energy',          market:'CA' },
  { ticker:'TD',     name:'TD Bank',                      sector:'Financials',      market:'CA' },
  { ticker:'RY',     name:'Royal Bank of Canada',         sector:'Financials',      market:'CA' },
  { ticker:'BNS',    name:'Scotiabank',                   sector:'Financials',      market:'CA' },
  { ticker:'BMO',    name:'Bank of Montreal',             sector:'Financials',      market:'CA' },
  { ticker:'CM',     name:'CIBC',                         sector:'Financials',      market:'CA' },
  { ticker:'MFC',    name:'Manulife Financial',           sector:'Financials',      market:'CA' },
  { ticker:'SLF',    name:'Sun Life Financial',           sector:'Financials',      market:'CA' },
  { ticker:'ATD',    name:'Alimentation Couche-Tard',     sector:'Consumer Staples',market:'CA' },
  { ticker:'SHOP',   name:'Shopify',                      sector:'Technology',      market:'CA' },
  { ticker:'TRP',    name:'TC Energy',                    sector:'Energy Infra',    market:'CA' },
  { ticker:'TFII',   name:'TFI International',            sector:'Industrials',     market:'CA' },
  { ticker:'CP.TO',  name:'Canadian Pacific Kansas City', sector:'Industrials',     market:'CA' },
  { ticker:'CNR.TO', name:'Canadian National Railway',    sector:'Industrials',     market:'CA' },
  { ticker:'BAM',    name:'Brookfield Asset Management',  sector:'Financials',      market:'CA' },
  { ticker:'WSP.TO', name:'WSP Global',                   sector:'Industrials',     market:'CA' },
];

// ── Sector mappings ───────────────────────────────────────────────────────────
const GICS_MAP = { // from S&P 500 CSV GICS sector names
  'Information Technology': 'Technology',
  'Health Care':            'Healthcare',
  'Financials':             'Financials',
  'Communication Services': 'Communication Services',
  'Consumer Discretionary': 'Consumer Discretionary',
  'Consumer Staples':       'Consumer Staples',
  'Industrials':            'Industrials',
  'Materials':              'Materials',
  'Real Estate':            'Real Estate',
  'Utilities':              'Utilities',
  'Energy':                 'Energy',
};
const YF_MAP = { // from Yahoo Finance assetProfile.sector
  'Technology':             'Technology',
  'Financial Services':     'Financials',
  'Healthcare':             'Healthcare',
  'Consumer Cyclical':      'Consumer Discretionary',
  'Consumer Defensive':     'Consumer Staples',
  'Industrials':            'Industrials',
  'Basic Materials':        'Materials',
  'Real Estate':            'Real Estate',
  'Utilities':              'Utilities',
  'Communication Services': 'Communication Services',
  'Energy':                 'Energy',
};

function getMktCap(mc) {
  if (!mc || mc <= 0) return 'large';
  if (mc >= 200e9) return 'mega';
  if (mc >= 10e9)  return 'large';
  if (mc >= 2e9)   return 'mid';
  return 'small';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Minimal CSV line parser that handles quoted fields
function parseCSVLine(line) {
  const out = [];
  let field = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { if (inQ && line[i+1] === '"') { field += '"'; i++; } else inQ = !inQ; }
    else if (line[i] === ',' && !inQ) { out.push(field.trim()); field = ''; }
    else field += line[i];
  }
  out.push(field.trim());
  return out;
}

async function fetchSP500() {
  const url = 'https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv';
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text  = await res.text();
    const lines = text.trim().split('\n').slice(1); // skip header
    return lines.map(line => {
      const cols = parseCSVLine(line);
      const [symbol, name, gicsSector] = cols;
      if (!symbol) return null;
      return {
        ticker: symbol,
        name:   name   || symbol,
        sector: GICS_MAP[gicsSector] || gicsSector || 'Other',
        market: 'US',
      };
    }).filter(Boolean);
  } catch (err) {
    console.error(`⚠  S&P 500 fetch failed: ${err.message}`);
    return null;
  }
}

// ── Yahoo Finance crumb (required since mid-2024) ────────────────────────────
let _yfSession = null;
async function getYFSession() {
  if (_yfSession) return _yfSession;
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  // Step 1: hit finance.yahoo.com to acquire cookies
  const r1 = await fetch('https://finance.yahoo.com/', {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(20000),
  });
  const rawCookies = (r1.headers.getSetCookie?.() || []);
  const cookieStr  = rawCookies.map(c => c.split(';')[0].trim()).join('; ');
  // Step 2: exchange cookies for a crumb token
  const r2 = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, 'Cookie': cookieStr },
    signal: AbortSignal.timeout(10000),
  });
  const crumb = (await r2.text()).trim();
  if (!crumb || crumb.includes('<')) throw new Error('crumb fetch failed');
  _yfSession = { crumb, cookieStr, UA };
  return _yfSession;
}

async function fetchFundamentals(ticker) {
  const { crumb, cookieStr, UA } = await getYFSession();
  const enc = encodeURIComponent(ticker);
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${enc}` +
              `?modules=summaryDetail,financialData,defaultKeyStatistics,assetProfile` +
              `&crumb=${encodeURIComponent(crumb)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept':     'application/json',
      'Cookie':     cookieStr,
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const r0 = json.quoteSummary?.result?.[0];
  if (!r0) throw new Error('no data');

  const sd = r0.summaryDetail          || {};
  const fd = r0.financialData          || {};
  const ks = r0.defaultKeyStatistics   || {};
  const ap = r0.assetProfile           || {};

  const r1 = v => v != null ? Math.round(v * 10)  / 10  : null;
  const r2 = v => v != null ? Math.round(v * 100) / 100 : null;

  const rawPe   = sd.trailingPE?.raw;
  const rawFpe  = sd.forwardPE?.raw;
  const rawEpsG = fd.earningsGrowth?.raw ?? ks.earningsGrowth?.raw;
  const rawRoe  = fd.returnOnEquity?.raw;
  const rawDe   = fd.debtToEquity?.raw;
  const rawDivY = sd.dividendYield?.raw;
  const rawGm   = fd.grossMargins?.raw;
  const rawFcf  = fd.freeCashflow?.raw;
  const rawMcap = sd.marketCap?.raw;

  const pe          = rawPe   != null ? r1(rawPe)               : null;
  const fwdPe       = rawFpe  != null ? r1(rawFpe)              : null;
  const epsGrowth   = rawEpsG != null ? Math.round(rawEpsG*100) : null;
  const roe         = rawRoe  != null ? Math.round(rawRoe*100)  : null;
  const de          = rawDe   != null ? r2(rawDe / 100)         : null;
  const divYield    = rawDivY != null ? r1(rawDivY * 100)       : 0;
  const grossMargin = rawGm   != null ? Math.round(rawGm * 100) : null;
  const fcfYield    = (rawFcf && rawMcap) ? r1(rawFcf / rawMcap * 100) : null;
  const peg         = (pe != null && epsGrowth != null && epsGrowth > 0) ? r2(pe / epsGrowth) : null;
  const mktCap      = getMktCap(rawMcap);
  const yfSector    = YF_MAP[ap.sector] || ap.sector || null;
  const liveName    = ap.longName || ap.shortName || null;
  const industry    = ap.industry || null;

  return { pe, fwdPe, epsGrowth, roe, de, divYield, grossMargin, fcfYield, peg, mktCap, yfSector, liveName, industry };
}

async function main() {
  const existing = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  const prevMap  = Object.fromEntries(existing.stocks.map(s => [s.ticker, s]));

  // Build full ticker list
  console.log('Fetching S&P 500 list...');
  const sp500 = await fetchSP500();
  let allEntries;
  if (sp500 && sp500.length > 400) {
    const seen = new Set(sp500.map(s => s.ticker));
    const caExtras = CA_STOCKS.filter(s => !seen.has(s.ticker));
    allEntries = [...sp500, ...caExtras];
    console.log(`S&P 500: ${sp500.length} stocks + ${caExtras.length} Canadian = ${allEntries.length} total`);
  } else {
    console.log('S&P 500 fetch failed or incomplete — refreshing existing universe');
    allEntries = existing.stocks;
  }

  const results = [];
  let ok = 0, failed = 0;

  for (let i = 0; i < allEntries.length; i++) {
    const base = allEntries[i];
    const prev = prevMap[base.ticker];
    try {
      const live = await fetchFundamentals(base.ticker);
      const stock = {
        ticker:      base.ticker,
        name:        prev?.name       || live.liveName    || base.name    || base.ticker,
        sector:      prev?.sector     || live.yfSector    || base.sector  || 'Other',
        market:      base.market      || 'US',
        pe:          live.pe          ?? prev?.pe         ?? null,
        fwdPe:       live.fwdPe       ?? prev?.fwdPe      ?? null,
        epsGrowth:   live.epsGrowth   ?? prev?.epsGrowth  ?? null,
        roe:         live.roe         ?? prev?.roe        ?? null,
        de:          live.de          ?? prev?.de         ?? null,
        divYield:    live.divYield    ?? prev?.divYield   ?? 0,
        fcfYield:    live.fcfYield    ?? prev?.fcfYield   ?? null,
        grossMargin: live.grossMargin ?? prev?.grossMargin?? null,
        peg:         live.peg         ?? prev?.peg        ?? null,
        mktCap:      prev?.mktCap     || live.mktCap      || 'large',
        moat:        CURATED_MOATS[base.ticker] ?? prev?.moat ?? live.industry ?? '—',
        isBank:      BANK_TICKERS.has(base.ticker) || prev?.isBank || false,
      };
      results.push(stock);
      ok++;
      if ((i + 1) % 50 === 0) console.log(`  [${i+1}/${allEntries.length}] ${ok} updated, ${failed} failed`);
    } catch (err) {
      failed++;
      if (prev) results.push(prev); // keep previous data on failure
    }
    await sleep(DELAY_MS);
  }

  // Sort: mega first, then large, mid, small; within cap by ticker
  const capOrd = { mega:0, large:1, mid:2, small:3 };
  results.sort((a, b) => {
    const d = (capOrd[a.mktCap] ?? 1) - (capOrd[b.mktCap] ?? 1);
    return d !== 0 ? d : a.ticker.localeCompare(b.ticker);
  });

  const now    = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const output = {
    lastUpdated: `${months[now.getUTCMonth()]} ${now.getUTCFullYear()}`,
    note: 'Live fundamentals from Yahoo Finance. S&P 500 constituents + top Canadian stocks. Refreshed daily at 6AM Vancouver.',
    stocks: results,
  };

  writeFileSync(DATA_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`\n── Done ─────────────────────────────────`);
  console.log(`   Stocks written : ${results.length}`);
  console.log(`   Updated OK     : ${ok}`);
  console.log(`   Failed (kept)  : ${failed}`);
  console.log(`   lastUpdated    : ${output.lastUpdated}`);
}

main().catch(err => { console.error(err); process.exit(1); });
