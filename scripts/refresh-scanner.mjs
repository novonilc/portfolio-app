#!/usr/bin/env node
// refresh-scanner.mjs — refreshes src/data/stockUniverse.json with live
// Yahoo Finance fundamentals for a curated set of ~95 mega/large/mid-cap stocks.
//
// Run:  node scripts/refresh-scanner.mjs
// Requires Node.js 18+ (built-in fetch). No npm packages needed.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../src/data/stockUniverse.json');
const DELAY_MS  = 400;  // polite delay between Yahoo Finance requests

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function getYahooCrumb() {
  const r1 = await fetch('https://fc.yahoo.com', { headers: { 'User-Agent': UA } });
  const cookies = r1.headers.get('set-cookie') || '';
  const r2 = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, 'Cookie': cookies },
    signal: AbortSignal.timeout(10000),
  });
  if (!r2.ok) throw new Error(`Crumb fetch HTTP ${r2.status}`);
  const crumb = await r2.text();
  return { crumb, cookies };
}

// ── Curated universe — 77 US + 18 CA = 95 tickers ───────────────────────────
// Only mega, large, and select mid-cap names. Intentionally < 100 tickers so
// the full scan finishes in ~35 s and the git push window stays tiny.
const US_STOCKS = [
  // Technology (20)
  { ticker:'AAPL',  name:'Apple',                  sector:'Technology',            mktCap:'mega'  },
  { ticker:'MSFT',  name:'Microsoft',               sector:'Technology',            mktCap:'mega'  },
  { ticker:'NVDA',  name:'Nvidia',                  sector:'Technology',            mktCap:'mega'  },
  { ticker:'GOOGL', name:'Alphabet',                sector:'Technology',            mktCap:'mega'  },
  { ticker:'META',  name:'Meta Platforms',          sector:'Technology',            mktCap:'mega'  },
  { ticker:'AMZN',  name:'Amazon',                  sector:'Technology',            mktCap:'mega'  },
  { ticker:'AVGO',  name:'Broadcom',                sector:'Technology',            mktCap:'mega'  },
  { ticker:'ORCL',  name:'Oracle',                  sector:'Technology',            mktCap:'large' },
  { ticker:'AMD',   name:'AMD',                     sector:'Technology',            mktCap:'large' },
  { ticker:'MU',    name:'Micron Technology',       sector:'Technology',            mktCap:'large' },
  { ticker:'QCOM',  name:'Qualcomm',                sector:'Technology',            mktCap:'large' },
  { ticker:'TSM',   name:'Taiwan Semiconductor',   sector:'Technology',            mktCap:'mega'  },
  { ticker:'ARM',   name:'ARM Holdings',            sector:'Technology',            mktCap:'large' },
  { ticker:'NOW',   name:'ServiceNow',              sector:'Technology',            mktCap:'large' },
  { ticker:'CRWD',  name:'CrowdStrike',             sector:'Technology',            mktCap:'large' },
  { ticker:'PLTR',  name:'Palantir',                sector:'Technology',            mktCap:'large' },
  { ticker:'MRVL',  name:'Marvell Technology',      sector:'Technology',            mktCap:'large' },
  { ticker:'ANET',  name:'Arista Networks',         sector:'Technology',            mktCap:'large' },
  { ticker:'PANW',  name:'Palo Alto Networks',      sector:'Technology',            mktCap:'large' },
  { ticker:'FICO',  name:'Fair Isaac (FICO)',        sector:'Technology',            mktCap:'large' },
  { ticker:'INTC',  name:'Intel',                   sector:'Technology',            mktCap:'large' },
  // Financials (12)
  { ticker:'JPM',   name:'JPMorgan Chase',          sector:'Financials',            mktCap:'mega'  },
  { ticker:'BAC',   name:'Bank of America',         sector:'Financials',            mktCap:'mega'  },
  { ticker:'GS',    name:'Goldman Sachs',           sector:'Financials',            mktCap:'large' },
  { ticker:'V',     name:'Visa',                    sector:'Financials',            mktCap:'mega'  },
  { ticker:'MA',    name:'Mastercard',              sector:'Financials',            mktCap:'mega'  },
  { ticker:'AXP',   name:'American Express',        sector:'Financials',            mktCap:'large' },
  { ticker:'BRK.B', name:'Berkshire Hathaway B',   sector:'Financials',            mktCap:'mega'  },
  { ticker:'SCHW',  name:'Charles Schwab',          sector:'Financials',            mktCap:'large' },
  { ticker:'BLK',   name:'BlackRock',               sector:'Financials',            mktCap:'large' },
  { ticker:'MSCI',  name:'MSCI Inc',                sector:'Financials',            mktCap:'large' },
  { ticker:'PYPL',  name:'PayPal',                  sector:'Fintech',               mktCap:'large' },
  { ticker:'KKR',   name:'KKR & Co',                sector:'Financials',            mktCap:'large' },
  // Healthcare (10)
  { ticker:'LLY',   name:'Eli Lilly',               sector:'Healthcare',            mktCap:'mega'  },
  { ticker:'JNJ',   name:'Johnson & Johnson',       sector:'Healthcare',            mktCap:'mega'  },
  { ticker:'ABBV',  name:'AbbVie',                  sector:'Healthcare',            mktCap:'large' },
  { ticker:'UNH',   name:'UnitedHealth',            sector:'Healthcare',            mktCap:'mega'  },
  { ticker:'ISRG',  name:'Intuitive Surgical',      sector:'Healthcare',            mktCap:'large' },
  { ticker:'NVO',   name:'Novo Nordisk',            sector:'Healthcare',            mktCap:'mega'  },
  { ticker:'MRK',   name:'Merck',                   sector:'Healthcare',            mktCap:'large' },
  { ticker:'AMGN',  name:'Amgen',                   sector:'Healthcare',            mktCap:'large' },
  { ticker:'IDXX',  name:'IDEXX Laboratories',      sector:'Healthcare',            mktCap:'large' },
  { ticker:'HIMS',  name:'Hims & Hers Health',      sector:'Healthcare',            mktCap:'mid'   },
  // Consumer Staples (5)
  { ticker:'KO',    name:'Coca-Cola',               sector:'Consumer Staples',      mktCap:'mega'  },
  { ticker:'PG',    name:'Procter & Gamble',        sector:'Consumer Staples',      mktCap:'mega'  },
  { ticker:'COST',  name:'Costco',                  sector:'Consumer Staples',      mktCap:'mega'  },
  { ticker:'WMT',   name:'Walmart',                 sector:'Consumer Staples',      mktCap:'mega'  },
  { ticker:'MNST',  name:'Monster Beverage',        sector:'Consumer Staples',      mktCap:'large' },
  // Consumer Discretionary (6)
  { ticker:'HD',    name:'Home Depot',              sector:'Consumer Discretionary', mktCap:'mega' },
  { ticker:'NFLX',  name:'Netflix',                 sector:'Consumer Discretionary', mktCap:'large'},
  { ticker:'TSLA',  name:'Tesla',                   sector:'Consumer Discretionary', mktCap:'mega' },
  { ticker:'NKE',   name:'Nike',                    sector:'Consumer Discretionary', mktCap:'large'},
  { ticker:'MCD',   name:"McDonald's",              sector:'Consumer Discretionary', mktCap:'mega' },
  { ticker:'SBUX',  name:'Starbucks',               sector:'Consumer Discretionary', mktCap:'large'},
  // Energy (5)
  { ticker:'XOM',   name:'ExxonMobil',              sector:'Energy',                mktCap:'mega'  },
  { ticker:'CVX',   name:'Chevron',                 sector:'Energy',                mktCap:'mega'  },
  { ticker:'OXY',   name:'Occidental Petroleum',    sector:'Energy',                mktCap:'large' },
  { ticker:'COP',   name:'ConocoPhillips',          sector:'Energy',                mktCap:'large' },
  { ticker:'SLB',   name:'SLB (Schlumberger)',      sector:'Energy',                mktCap:'large' },
  // Defense & Industrials (10)
  { ticker:'RTX',   name:'RTX Corporation',         sector:'Defense',               mktCap:'large' },
  { ticker:'LMT',   name:'Lockheed Martin',         sector:'Defense',               mktCap:'large' },
  { ticker:'GE',    name:'GE Aerospace',            sector:'Industrials',           mktCap:'large' },
  { ticker:'HON',   name:'Honeywell',               sector:'Industrials',           mktCap:'large' },
  { ticker:'AXON',  name:'Axon Enterprise',         sector:'Defense',               mktCap:'mid'   },
  { ticker:'CAT',   name:'Caterpillar',             sector:'Industrials',           mktCap:'large' },
  { ticker:'DE',    name:'Deere & Co',              sector:'Industrials',           mktCap:'large' },
  { ticker:'ITW',   name:'Illinois Tool Works',     sector:'Industrials',           mktCap:'large' },
  { ticker:'TDG',   name:'TransDigm Group',         sector:'Industrials',           mktCap:'large' },
  { ticker:'ODFL',  name:'Old Dominion Freight',    sector:'Industrials',           mktCap:'large' },
  // Telecom (3)
  { ticker:'T',     name:'AT&T',                    sector:'Telecom',               mktCap:'large' },
  { ticker:'VZ',    name:'Verizon',                 sector:'Telecom',               mktCap:'large' },
  { ticker:'TMUS',  name:'T-Mobile US',             sector:'Telecom',               mktCap:'large' },
  // Materials (2)
  { ticker:'LIN',   name:'Linde',                   sector:'Materials',             mktCap:'mega'  },
  { ticker:'SHW',   name:'Sherwin-Williams',        sector:'Materials',             mktCap:'large' },
  // Real Estate (2)
  { ticker:'AMT',   name:'American Tower',          sector:'Real Estate',           mktCap:'large' },
  { ticker:'PLD',   name:'Prologis',                sector:'Real Estate',           mktCap:'large' },
  // Utilities (2)
  { ticker:'NEE',   name:'NextEra Energy',          sector:'Utilities',             mktCap:'large' },
  { ticker:'AEP',   name:'American Electric Power', sector:'Utilities',             mktCap:'large' },
];

const CA_STOCKS = [
  { ticker:'ENB',    name:'Enbridge',                    sector:'Energy Infra',    market:'CA', mktCap:'large' },
  { ticker:'CNQ',    name:'Canadian Natural Resources',   sector:'Energy',          market:'CA', mktCap:'large' },
  { ticker:'SU.TO',  name:'Suncor Energy',                sector:'Energy',          market:'CA', mktCap:'large' },
  { ticker:'TD',     name:'TD Bank',                      sector:'Financials',      market:'CA', mktCap:'mega'  },
  { ticker:'RY',     name:'Royal Bank of Canada',         sector:'Financials',      market:'CA', mktCap:'mega'  },
  { ticker:'BNS',    name:'Scotiabank',                   sector:'Financials',      market:'CA', mktCap:'large' },
  { ticker:'BMO',    name:'Bank of Montreal',             sector:'Financials',      market:'CA', mktCap:'large' },
  { ticker:'CM',     name:'CIBC',                         sector:'Financials',      market:'CA', mktCap:'large' },
  { ticker:'MFC',    name:'Manulife Financial',           sector:'Financials',      market:'CA', mktCap:'large' },
  { ticker:'SLF',    name:'Sun Life Financial',           sector:'Financials',      market:'CA', mktCap:'large' },
  { ticker:'ATD.TO', name:'Alimentation Couche-Tard',     sector:'Consumer Staples',market:'CA', mktCap:'large' },
  { ticker:'SHOP',   name:'Shopify',                      sector:'Technology',      market:'CA', mktCap:'large' },
  { ticker:'TRP',    name:'TC Energy',                    sector:'Energy Infra',    market:'CA', mktCap:'large' },
  { ticker:'BAM',    name:'Brookfield Asset Management',  sector:'Financials',      market:'CA', mktCap:'large' },
  { ticker:'CP.TO',  name:'Canadian Pacific Kansas City', sector:'Industrials',     market:'CA', mktCap:'large' },
  { ticker:'CNR.TO', name:'Canadian National Railway',    sector:'Industrials',     market:'CA', mktCap:'large' },
  { ticker:'TFII',   name:'TFI International',            sector:'Industrials',     market:'CA', mktCap:'mid'   },
  { ticker:'WSP.TO', name:'WSP Global',                   sector:'Industrials',     market:'CA', mktCap:'mid'   },
  { ticker:'SPCX',   name:'Harvest S&P 500 Covered Call ETF', sector:'ETF',         market:'CA', mktCap:'large' },
];

// ── Manually curated moat descriptions ───────────────────────────────────────
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
  INTC:'x86 CPU + IFS Foundry',
  JPM:'Global Banking Scale',          BAC:'Retail Banking Scale',
  GS:'Investment Banking Franchise',   V:'Global Payment Network',
  MA:'Global Payment Network',         AXP:'Premium Brand / Network',
  'BRK.B':'Diversified Conglomerate',  SCHW:'Brokerage Scale',
  BLK:'Asset Management Scale',        MSCI:'Index Licensing Oligopoly',
  PYPL:'Digital Payments Network',     KKR:'Alternative Asset Management',
  LLY:'GLP-1 IP Pipeline',            JNJ:'Diversified Pharma / MedTech',
  ABBV:'Immunology IP',               UNH:'MCO Scale & Data Advantage',
  ISRG:'Robotic Surgery Platform',     NVO:'GLP-1 Dual IP Estate',
  MRK:'Pharma Pipeline + Keytruda',    AMGN:'Biotech IP Portfolio',
  IDXX:'Vet Diagnostic Platform',      HIMS:'D2C Telehealth + GLP-1',
  KO:'Global Consumer Brand',          PG:'Brand Portfolio',
  COST:'Membership / Cost Leader',     WMT:'Scale / Supply Chain',
  MNST:'Energy Drink + Coke Distrib',  HD:'Home Improvement Duopoly',
  NFLX:'Content Scale + Network',      TSLA:'EV Brand / Charging Network',
  NKE:'Global Athletic Brand',         MCD:'Franchise System + Real Estate',
  SBUX:'Premium Coffee Brand',         XOM:'Integrated Oil Major',
  CVX:'Integrated Oil Major',          OXY:'Permian Basin Acreage',
  COP:'Low-Cost E&P Operator',         SLB:'Oil Services Technology',
  RTX:'Gov Contracts / Missile Backlog', LMT:'Defense Prime Monopoly',
  GE:'Jet Engine Duopoly (LEAP)',       HON:'Industrial Automation Scale',
  AXON:'Police Tech Ecosystem Lock-in', CAT:'Heavy Equipment + Aftermarket',
  DE:'Precision Ag Equipment',          ITW:'80/20 Industrial Niche',
  TDG:'FAA Sole-Source Aerospace Parts', ODFL:'LTL Service Excellence',
  T:'Wireless Network Infrastructure',  VZ:'Wireless Network Infrastructure',
  TMUS:'Network + Spectrum Assets',     LIN:'Industrial Gas Oligopoly',
  SHW:'Architectural Coatings Leader',  AMT:'Cell Tower Real Estate',
  PLD:'Logistics Real Estate Scale',    NEE:'Renewable Energy + Regulated Grid',
  AEP:'Regulated Electric Utility',
  ENB:'Regulated Pipeline Monopoly',    TRP:'Regulated Canadian Pipeline',
  TD:'Canadian Banking Oligopoly',      RY:'Canadian Banking Oligopoly',
  BNS:'LatAm Banking Franchise',        BMO:'Canadian Banking Oligopoly',
  CM:'Canadian Banking Oligopoly',      MFC:'Insurance Distribution Network',
  SLF:'Insurance Distribution Scale',  'ATD.TO':'Convenience + Fuel Scale',
  SHOP:'E-Commerce Platform',           BAM:'Alternative Asset Management',
  'CP.TO':'North American Rail Duopoly', 'CNR.TO':'North American Rail Duopoly',
  CNQ:'Low-Cost Oil Sands',             'SU.TO':'$45/bbl Break-Even Advantage',
  TFII:'Trucking + Last Mile Scale',    'WSP.TO':'Global Engineering Consulting',
  SPCX:'Covered Call Premium Income on S&P 500',
};

// ── Banks / insurers — D/E excluded from scoring ─────────────────────────────
const BANK_TICKERS = new Set([
  'JPM','BAC','GS','WFC','C','SCHW','AXP','BLK','KKR',
  'TD','RY','BNS','BMO','CM','MFC','SLF','BAM',
]);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchFundamentals(ticker, crumb, cookies) {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}` +
              `?modules=summaryDetail,financialData,defaultKeyStatistics&crumb=${encodeURIComponent(crumb)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Cookie': cookies },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const result = json.quoteSummary?.result?.[0];
  if (!result) throw new Error('empty result');

  const sd = result.summaryDetail          || {};
  const fd = result.financialData          || {};
  const ks = result.defaultKeyStatistics   || {};

  const r1 = v => Math.round(v * 10) / 10;
  const r2 = v => Math.round(v * 100) / 100;

  const rawPe    = sd.trailingPE?.raw;
  const rawFwdPe = sd.forwardPE?.raw;
  const rawEpsG  = fd.earningsGrowth?.raw  ?? ks.earningsGrowth?.raw;
  const rawRoe   = fd.returnOnEquity?.raw;
  const rawDe    = fd.debtToEquity?.raw;
  const rawDivY  = sd.dividendYield?.raw;
  const rawGm    = fd.grossMargins?.raw;
  const rawFcf   = fd.freeCashflow?.raw;
  const rawMcap  = sd.marketCap?.raw;
  const rawPrice = fd.currentPrice?.raw ?? sd.regularMarketPrice?.raw ?? sd.previousClose?.raw;

  const pe          = rawPe    != null ? r1(rawPe)               : null;
  const fwdPe       = rawFwdPe != null ? r1(rawFwdPe)            : null;
  const epsGrowth   = rawEpsG  != null ? Math.round(rawEpsG*100) : null;
  const roe         = rawRoe   != null ? Math.round(rawRoe*100)  : null;
  const de          = rawDe    != null ? r2(rawDe / 100)         : null;
  const divYield    = rawDivY  != null ? r1(rawDivY * 100)       : null;
  const grossMargin = rawGm    != null ? Math.round(rawGm * 100) : null;
  const fcfYield    = (rawFcf != null && rawMcap != null && rawMcap > 0)
                      ? r1((rawFcf / rawMcap) * 100) : null;
  const peg         = (pe != null && epsGrowth != null && epsGrowth > 0)
                      ? r2(pe / epsGrowth) : null;
  const price       = rawPrice != null ? r2(rawPrice)            : null;

  return { pe, fwdPe, epsGrowth, roe, de, divYield, grossMargin, fcfYield, peg, price };
}

async function main() {
  const allStocks = [
    ...US_STOCKS.map(s => ({ ...s, market: 'US' })),
    ...CA_STOCKS,
  ];

  console.log(`Refreshing ${allStocks.length} tickers (mega + large/mid cap)...\n`);
  console.log('Fetching Yahoo Finance session crumb...');
  const { crumb, cookies } = await getYahooCrumb();
  console.log(`Crumb acquired. Starting ticker fetch...\n`);

  const stocks = [];
  let updated = 0, kept = 0;

  for (const base of allStocks) {
    try {
      const live = await fetchFundamentals(base.ticker, crumb, cookies);
      const stock = {
        ticker:      base.ticker,
        name:        base.name,
        sector:      base.sector,
        market:      base.market,
        mktCap:      base.mktCap,
        isBank:      BANK_TICKERS.has(base.ticker),
        moat:        CURATED_MOATS[base.ticker] || '',
        // Live fundamentals (fall back to 0 when Yahoo returns nothing)
        price:       live.price       ?? 0,
        pe:          live.pe          ?? 0,
        fwdPe:       live.fwdPe       ?? 0,
        epsGrowth:   live.epsGrowth   ?? 0,
        roe:         live.roe         ?? 0,
        de:          live.de          ?? 0,
        divYield:    live.divYield    ?? 0,
        grossMargin: live.grossMargin ?? 0,
        fcfYield:    live.fcfYield    ?? 0,
        peg:         live.peg         ?? 0,
      };
      stocks.push(stock);
      updated++;
      console.log(`✓  ${base.ticker.padEnd(9)} pe=${stock.pe} peg=${stock.peg} roe=${stock.roe}% div=${stock.divYield}%`);
    } catch (err) {
      kept++;
      console.error(`✗  ${base.ticker.padEnd(9)} ${err.message} — skipped`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`\n── Summary ──────────────────────────────────────`);
  console.log(`   Tickers fetched  : ${updated}`);
  console.log(`   Tickers skipped  : ${kept}`);

  // Abort if too few tickers succeeded — Yahoo likely blocked the run.
  // Writing empty/partial data would erase the deployed universe and break the app.
  const MIN_REQUIRED = Math.floor(allStocks.length * 0.5);
  if (updated < MIN_REQUIRED) {
    console.error(`\n⚠  Only ${updated}/${allStocks.length} tickers fetched (need ≥ ${MIN_REQUIRED}).`);
    console.error('   Yahoo Finance likely blocked this run. Aborting write to preserve existing data.');
    process.exit(1);
  }

  const now = new Date();

  const output = {
    lastUpdated: now.toISOString().slice(0, 10),  // "YYYY-MM-DD" — parseable for staleness checks
    note: 'Live data from Yahoo Finance. Moats are manually curated.',
    stocks,
  };

  writeFileSync(DATA_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`   lastUpdated      : ${output.lastUpdated}`);
  console.log(`   Output           : src/data/stockUniverse.json`);
}

main().catch(err => { console.error(err); process.exit(1); });
