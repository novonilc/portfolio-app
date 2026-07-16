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

// ── Curated universe — mega/large/mid/small cap across US + CA ──────────────
// Mid and small cap were historically thin (13 mid, 0 small) despite the
// scanner's "Mid & Small" preset advertising both — this batch fills that out
// with diversified, profitable, quality names (not speculative story stocks)
// across sectors underrepresented in the existing mid-cap set.
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
  { ticker:'PLTR',  name:'Palantir',                sector:'Technology',            mktCap:'large' },
  { ticker:'MRVL',  name:'Marvell Technology',      sector:'Technology',            mktCap:'large' },
  { ticker:'ANET',  name:'Arista Networks',         sector:'Technology',            mktCap:'large' },
  { ticker:'FICO',  name:'Fair Isaac (FICO)',        sector:'Technology',            mktCap:'large' },
  { ticker:'INTC',  name:'Intel',                   sector:'Technology',            mktCap:'large' },
  // Cyber Security (7) — CYBR (CyberArk) removed: acquired by PANW, delisted 2026
  { ticker:'CRWD',  name:'CrowdStrike',             sector:'Cyber Security',        mktCap:'large' },
  { ticker:'PANW',  name:'Palo Alto Networks',      sector:'Cyber Security',        mktCap:'large' },
  { ticker:'FTNT',  name:'Fortinet',                sector:'Cyber Security',        mktCap:'large' },
  { ticker:'NET',   name:'Cloudflare',              sector:'Cyber Security',        mktCap:'large' },
  { ticker:'ZS',    name:'Zscaler',                 sector:'Cyber Security',        mktCap:'mid'   },
  { ticker:'OKTA',  name:'Okta',                    sector:'Cyber Security',        mktCap:'mid'   },
  { ticker:'S',     name:'SentinelOne',             sector:'Cyber Security',        mktCap:'mid'   },
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
  { ticker:'HOOD',  name:'Robinhood Markets',        sector:'Fintech',               mktCap:'mid'   },
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
  // Defense & Industrials (12)
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
  { ticker:'DOV',   name:'Dover Corporation',       sector:'Industrials',           mktCap:'large' },
  // Aerospace / Space (3)
  { ticker:'SPCX',  name:'SpaceX',                  sector:'Aerospace/Space',       mktCap:'mega'  },
  { ticker:'RKLB',  name:'Rocket Lab',              sector:'Aerospace/Space',       mktCap:'mid'   },
  { ticker:'ASTS',  name:'AST SpaceMobile',         sector:'Aerospace/Space',       mktCap:'mid'   },
  // Robotics (4)
  { ticker:'ROK',   name:'Rockwell Automation',     sector:'Robotics',              mktCap:'large' },
  { ticker:'ABB',   name:'ABB Ltd',                 sector:'Robotics',              mktCap:'large' },
  { ticker:'TER',   name:'Teradyne',                sector:'Robotics',              mktCap:'large' },
  { ticker:'SYM',   name:'Symbotic',                sector:'Robotics',              mktCap:'mid'   },
  // Telecom (3)
  { ticker:'T',     name:'AT&T',                    sector:'Telecom',               mktCap:'large' },
  { ticker:'VZ',    name:'Verizon',                 sector:'Telecom',               mktCap:'large' },
  { ticker:'TMUS',  name:'T-Mobile US',             sector:'Telecom',               mktCap:'large' },
  // Materials (6)
  { ticker:'LIN',   name:'Linde',                   sector:'Materials',             mktCap:'mega'  },
  { ticker:'SHW',   name:'Sherwin-Williams',        sector:'Materials',             mktCap:'large' },
  { ticker:'NEM',   name:'Newmont',                 sector:'Materials',             mktCap:'large' },
  { ticker:'FCX',   name:'Freeport-McMoRan',        sector:'Materials',             mktCap:'large' },
  { ticker:'NUE',   name:'Nucor',                   sector:'Materials',             mktCap:'large' },
  { ticker:'APD',   name:'Air Products and Chemicals', sector:'Materials',          mktCap:'large' },
  // Real Estate (2)
  { ticker:'AMT',   name:'American Tower',          sector:'Real Estate',           mktCap:'large' },
  { ticker:'PLD',   name:'Prologis',                sector:'Real Estate',           mktCap:'large' },
  // Utilities (2)
  { ticker:'NEE',   name:'NextEra Energy',          sector:'Utilities',             mktCap:'large' },
  { ticker:'AEP',   name:'American Electric Power', sector:'Utilities',             mktCap:'large' },
  // AI Power (5)
  { ticker:'VST',   name:'Vistra Energy',           sector:'AI Power',              mktCap:'large' },
  { ticker:'CEG',   name:'Constellation Energy',    sector:'AI Power',              mktCap:'large' },
  { ticker:'GEV',   name:'GE Vernova',              sector:'AI Power',              mktCap:'large' },
  { ticker:'PWR',   name:'Quanta Services',         sector:'AI Power',              mktCap:'large' },
  { ticker:'VRT',   name:'Vertiv Holdings',         sector:'AI Power',              mktCap:'large' },
  // ETFs (1)
  { ticker:'DRAM',  name:'Roundhill Memory ETF',    sector:'ETF',                   mktCap:'large' },
  // AI Infrastructure (1)
  { ticker:'NBIS',  name:'Nebius Group',            sector:'AI Infrastructure',     mktCap:'large' },
  // Drone & Autonomous Systems (1)
  { ticker:'ONDS',  name:'Ondas Holdings',          sector:'Drone & Autonomous Systems', mktCap:'mid' },
  // Mobility & Delivery (3)
  { ticker:'UBER',  name:'Uber Technologies',       sector:'Mobility & Delivery',   mktCap:'large' },
  { ticker:'LYFT',  name:'Lyft',                    sector:'Mobility & Delivery',   mktCap:'mid'   },
  { ticker:'DASH',  name:'DoorDash',                sector:'Mobility & Delivery',   mktCap:'large' },
  // ── Mid & small cap expansion — diversified away from the existing
  // cyber/aerospace/robotics-heavy mid-cap set into Healthcare, Industrials,
  // Financials, Materials, Consumer, and Real Estate ──────────────────────
  // Healthcare (3 mid, 1 small)
  { ticker:'ENSG',  name:'Ensign Group',            sector:'Healthcare',            mktCap:'mid'   },
  { ticker:'DOCS',  name:'Doximity',                sector:'Healthcare',            mktCap:'mid'   },
  { ticker:'ICUI',  name:'ICU Medical',             sector:'Healthcare',            mktCap:'mid'   },
  { ticker:'UFPT',  name:'UFP Technologies',        sector:'Healthcare',            mktCap:'small' },
  // Industrials (2 mid, 1 small)
  { ticker:'MLI',   name:'Mueller Industries',      sector:'Industrials',           mktCap:'mid'   },
  { ticker:'AIT',   name:'Applied Industrial Technologies', sector:'Industrials',   mktCap:'mid'   },
  { ticker:'HAYW',  name:'Hayward Holdings',        sector:'Industrials',           mktCap:'small' },
  // Financials (3 mid)
  { ticker:'WTM',   name:'White Mountains Insurance', sector:'Financials',          mktCap:'mid'   },
  { ticker:'RNR',   name:'RenaissanceRe Holdings',  sector:'Financials',            mktCap:'mid'   },
  { ticker:'FFIN',  name:'First Financial Bankshares', sector:'Financials',         mktCap:'mid'   },
  // Materials (1 mid)
  { ticker:'ATI',   name:'ATI Inc',                 sector:'Materials',             mktCap:'mid'   },
  // Consumer Staples (2 mid, 1 small)
  { ticker:'BJ',    name:"BJ's Wholesale Club",     sector:'Consumer Staples',      mktCap:'mid'   },
  { ticker:'FIZZ',  name:'National Beverage Corp',  sector:'Consumer Staples',      mktCap:'small' },
  // Consumer Discretionary (2 mid, 2 small)
  { ticker:'WING',  name:'Wingstop',                sector:'Consumer Discretionary', mktCap:'mid'  },
  { ticker:'FIVE',  name:'Five Below',              sector:'Consumer Discretionary', mktCap:'mid'  },
  { ticker:'CVCO',  name:'Cavco Industries',        sector:'Consumer Discretionary', mktCap:'small' },
  { ticker:'MLKN',  name:'MillerKnoll',             sector:'Consumer Discretionary', mktCap:'small' },
  // Real Estate (1 mid)
  { ticker:'CUBE',  name:'CubeSmart',               sector:'Real Estate',           mktCap:'mid'   },
];

const CA_STOCKS = [
  { ticker:'ENB',    name:'Enbridge',                    sector:'Energy Infra',    market:'CA', mktCap:'large' },
  { ticker:'CNQ',    name:'Canadian Natural Resources',   sector:'Energy',          market:'CA', mktCap:'large' },
  { ticker:'SU.TO',  name:'Suncor Energy',                sector:'Energy',          market:'CA', mktCap:'large' },
  { ticker:'CCO.TO', name:'Cameco Corporation',           sector:'Materials',       market:'CA', mktCap:'large' },
  { ticker:'B',      name:'Barrick Mining Corporation',   sector:'Materials',       market:'CA', mktCap:'large' },
  { ticker:'AEM',    name:'Agnico Eagle Mines',           sector:'Materials',       market:'CA', mktCap:'large' },
  { ticker:'FNV',    name:'Franco-Nevada',                sector:'Materials',       market:'CA', mktCap:'large' },
  { ticker:'WPM',    name:'Wheaton Precious Metals',      sector:'Materials',       market:'CA', mktCap:'large' },
  { ticker:'NTR',    name:'Nutrien',                      sector:'Materials',       market:'CA', mktCap:'large' },
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
  { ticker:'USCC.TO', name:'Global X S&P 500 Covered Call ETF', sector:'ETF',       market:'CA', mktCap:'large' },
  // Small cap additions
  { ticker:'GOOS',   name:'Canada Goose Holdings',        sector:'Consumer Discretionary', market:'CA', mktCap:'small' },
  { ticker:'LSPD',   name:'Lightspeed Commerce',          sector:'Technology',      market:'CA', mktCap:'small' },
];

// ── Manually curated moat descriptions ───────────────────────────────────────
const CURATED_MOATS = {
  AAPL:'Brand & Ecosystem',            MSFT:'Cloud / AI Platform',
  GOOGL:'Search / AI',                 META:'Social Network Effect',
  NVDA:'AI Chip Monopoly',             AMZN:'AWS / Logistics',
  AVGO:'Custom AI ASICs',              ARM:'CPU IP Royalties',
  ORCL:'Enterprise Database',          NOW:'Enterprise Workflow Lock-in',
  PLTR:'AI Gov / Defense Platform',
  AMD:'CPU/GPU Architecture',          MU:'HBM AI Memory Technology',
  QCOM:'Mobile Chip Patents',          TSM:'Advanced Node Foundry',
  MRVL:'Custom AI ASIC for Hyperscalers', ANET:'AI Data Center Networking',
  FICO:'Credit Score Monopoly',
  INTC:'x86 CPU + IFS Foundry',
  CRWD:'Endpoint Security Platform',   PANW:'Cybersecurity Platform Consolidation',
  FTNT:'Network Security Appliance Scale', NET:'Edge Network / Zero Trust Platform',
  ZS:'Cloud Zero Trust Architecture',
  OKTA:'Identity & Access Management', S:'AI-Native Endpoint Security',
  JPM:'Global Banking Scale',          BAC:'Retail Banking Scale',
  GS:'Investment Banking Franchise',   V:'Global Payment Network',
  MA:'Global Payment Network',         AXP:'Premium Brand / Network',
  'BRK.B':'Diversified Conglomerate',  SCHW:'Brokerage Scale',
  BLK:'Asset Management Scale',        MSCI:'Index Licensing Oligopoly',
  PYPL:'Digital Payments Network',     HOOD:'Retail Brokerage + Crypto Platform',
  KKR:'Alternative Asset Management',
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
  DOV:'Niche Industrial Leadership + Disciplined M&A',
  T:'Wireless Network Infrastructure',  VZ:'Wireless Network Infrastructure',
  TMUS:'Network + Spectrum Assets',     LIN:'Industrial Gas Oligopoly',
  SHW:'Architectural Coatings Leader',
  NEM:"World's Largest Gold Producer",  FCX:"World's Largest Public Copper Producer",
  NUE:"North America's Largest Steel Producer",
  APD:'Industrial Gas + Hydrogen Infrastructure Scale',
  B:'Tier-1 Gold & Copper Reserves',    AEM:'Premier Gold Districts (Canada/Mexico/Finland)',
  FNV:'Diversified Royalty & Streaming Portfolio',
  WPM:'Precious Metals Streaming Model', NTR:'Largest Global Potash Producer',
  AMT:'Cell Tower Real Estate',
  PLD:'Logistics Real Estate Scale',    NEE:'Renewable Energy + Regulated Grid',
  AEP:'Regulated Electric Utility',
  VST:'Nuclear + Gas Fleet for AI Data Centers',
  CEG:'Largest US Nuclear Fleet + Clean Power Contracts',
  GEV:'Gas Turbine + Grid Equipment Duopoly',
  PWR:'Electric Grid Infrastructure Build-out',
  DRAM:'Pure-Play Memory Chip Basket (Samsung, SK Hynix, Micron)',
  NBIS:'Neocloud AI GPU Infrastructure (Ex-Yandex)',
  ONDS:'Drone Networks + Counter-UAS Defense Platform',
  UBER:'Two-Sided Marketplace Network Effect', LYFT:'US Ride-Hailing Duopoly Position',
  DASH:'Local Delivery Density Network',
  ENB:'Regulated Pipeline Monopoly',    TRP:'Regulated Canadian Pipeline',
  TD:'Canadian Banking Oligopoly',      RY:'Canadian Banking Oligopoly',
  BNS:'LatAm Banking Franchise',        BMO:'Canadian Banking Oligopoly',
  CM:'Canadian Banking Oligopoly',      MFC:'Insurance Distribution Network',
  SLF:'Insurance Distribution Scale',  'ATD.TO':'Convenience + Fuel Scale',
  SHOP:'E-Commerce Platform',           BAM:'Alternative Asset Management',
  'CP.TO':'North American Rail Duopoly', 'CNR.TO':'North American Rail Duopoly',
  CNQ:'Low-Cost Oil Sands',             'SU.TO':'$45/bbl Break-Even Advantage',
  'CCO.TO':'Tier-1 Uranium Reserves + Westinghouse Stake',
  TFII:'Trucking + Last Mile Scale',    'WSP.TO':'Global Engineering Consulting',
  'USCC.TO':'Covered Call Premium Income on S&P 500',
  SPCX:'Reusable Rocket + Starlink Constellation Dominance',
  ENSG:'Post-Acute Care Operating Model',      DOCS:'Physician Network Platform Lock-in',
  ICUI:'IV Therapy & Infusion Systems Niche',  UFPT:'Medical Device Contract Manufacturing Niche',
  MLI:'Copper Tube & Fittings Manufacturing Scale',
  AIT:'Industrial MRO Distribution Density',   HAYW:'Pool Equipment Aftermarket Replacement Cycle',
  WTM:'Disciplined Insurance Capital Allocation', RNR:'Reinsurance Underwriting Scale',
  FFIN:'Texas Regional Banking Franchise',     ATI:'Aerospace-Grade Specialty Metals',
  BJ:'Membership Warehouse Value Model',       FIZZ:'Regional Beverage Brand + DSD Network',
  WING:'Franchise Unit Economics + Delivery Growth', FIVE:'Extreme Value Discount Retail Format',
  CVCO:'Manufactured Housing Scale + Distribution',  MLKN:'Commercial Furniture Design Brand Portfolio',
  CUBE:'Self-Storage REIT Density',
  GOOS:'Luxury Outerwear Brand',               LSPD:'Unified Commerce Platform for SMB Retail/Hospitality',
};

// ── Banks / insurers — D/E excluded from scoring ─────────────────────────────
const BANK_TICKERS = new Set([
  'JPM','BAC','GS','WFC','C','SCHW','AXP','BLK','KKR',
  'TD','RY','BNS','BMO','CM','MFC','SLF','BAM',
  'FFIN','WTM','RNR',
]);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchFundamentals(ticker, crumb, cookies) {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}` +
              `?modules=summaryDetail,financialData,defaultKeyStatistics,earningsTrend&crumb=${encodeURIComponent(crumb)}`;
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
  const et = result.earningsTrend          || {};

  const r1 = v => Math.round(v * 10) / 10;
  const r2 = v => Math.round(v * 100) / 100;

  const rawPe    = sd.trailingPE?.raw;
  const rawFwdPe = sd.forwardPE?.raw;
  const rawEpsG  = fd.earningsGrowth?.raw  ?? ks.earningsGrowth?.raw;
  const rawRevG  = fd.revenueGrowth?.raw;
  const rawRoe   = fd.returnOnEquity?.raw;
  const rawDe    = fd.debtToEquity?.raw;
  const rawDivY  = sd.dividendYield?.raw;
  const rawGm    = fd.grossMargins?.raw;
  const rawFcf   = fd.freeCashflow?.raw;
  const rawMcap  = sd.marketCap?.raw;
  const rawPs    = sd.priceToSalesTrailing12Months?.raw ?? ks.priceToSalesTrailing12Months?.raw;
  const rawPrice = fd.currentPrice?.raw ?? sd.regularMarketPrice?.raw ?? sd.previousClose?.raw;
  // Forward EPS growth (next fiscal year consensus) — far less distorted by one-time
  // GAAP items (SBC, M&A integration costs, buyback timing) than trailing earningsGrowth.
  // Falls back through +1y → 0y → +5y trend entries; whichever the analyst panel covers.
  const trend    = et.trend || [];
  const fwdTrend = trend.find(t => t.period === '+1y') || trend.find(t => t.period === '0y') || trend.find(t => t.period === '+5y');
  const rawFwdEpsG = fwdTrend?.growth?.raw;

  const pe          = rawPe    != null ? r1(rawPe)               : null;
  const fwdPe       = rawFwdPe != null ? r1(rawFwdPe)            : null;
  const epsGrowth   = rawEpsG  != null ? Math.round(rawEpsG*100) : null;
  const revGrowth   = rawRevG  != null ? Math.round(rawRevG*100) : null;
  const fwdEpsGrowth= rawFwdEpsG != null ? Math.round(rawFwdEpsG*100) : null;
  const roe         = rawRoe   != null ? Math.round(rawRoe*100)  : null;
  const de          = rawDe    != null ? r2(rawDe / 100)         : null;
  const divYield    = rawDivY  != null ? r1(rawDivY * 100)       : null;
  const grossMargin = rawGm    != null ? Math.round(rawGm * 100) : null;
  const fcfYield    = (rawFcf != null && rawMcap != null && rawMcap > 0)
                      ? r1((rawFcf / rawMcap) * 100) : null;
  const peg         = (pe != null && epsGrowth != null && epsGrowth > 0)
                      ? r2(pe / epsGrowth) : null;
  const price       = rawPrice != null ? r2(rawPrice)            : null;
  const ps          = rawPs    != null ? r2(rawPs)                : null;

  return { pe, fwdPe, epsGrowth, revGrowth, fwdEpsGrowth, roe, de, divYield, grossMargin, fcfYield, peg, price, ps };
}

// ── Price-action technicals — same SMA/RSI math as api/refresh-options-signals.js ──
function computeSMA(closes, period) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return parseFloat((slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(2));
}

function computeRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return parseFloat((100 - 100 / (1 + avgGain / avgLoss)).toFixed(1));
}

// Trading days since the most recent 1y-low close — proxy for "has this stock
// stopped making new lows", the core signal behind a Wyckoff-style accumulation base.
function computeDaysSinceLow(closes) {
  let lowIdx = 0, lowVal = Infinity;
  closes.forEach((c, i) => { if (c < lowVal) { lowVal = c; lowIdx = i; } });
  return closes.length - 1 - lowIdx;
}

// High-low range over the trailing `period` closes, as a % of the period low —
// used to compare recent vs. prior volatility (range compression = base forming).
function computeRange(closes, period) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const hi = Math.max(...slice), lo = Math.min(...slice);
  return lo > 0 ? parseFloat(((hi - lo) / lo * 100).toFixed(1)) : null;
}

// Recent (20d) vs prior (20-80d ago) average volume — <1 means volume is drying up,
// a classic late-stage-base characteristic ("nobody is talking about it anymore").
function computeVolRatio(volumes) {
  const clean = volumes.filter(v => v != null);
  if (clean.length < 80) return null;
  const recent20 = clean.slice(-20);
  const prior60  = clean.slice(-80, -20);
  if (recent20.length < 10 || prior60.length < 30) return null;
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const priorAvg = avg(prior60);
  return priorAvg > 0 ? parseFloat((avg(recent20) / priorAvg).toFixed(2)) : null;
}

async function fetchTechnicals(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error('empty chart result');

  const quote  = result.indicators?.quote?.[0] || {};
  const closes = (quote.close || []).filter(c => c != null);
  const empty  = { sma50: null, sma200: null, rsi14: null, daysSinceLow: null, range20d: null, range60d: null, volRatio: null, pctOffHigh: null };
  if (closes.length < 50) return empty;

  const high52w    = Math.max(...closes);
  const lastClose  = closes[closes.length - 1];
  const pctOffHigh = high52w > 0 ? parseFloat(((high52w - lastClose) / high52w * 100).toFixed(1)) : null;

  return {
    sma50:        computeSMA(closes, 50),
    sma200:       computeSMA(closes, 200),
    rsi14:        computeRSI(closes, 14),
    daysSinceLow: computeDaysSinceLow(closes),
    range20d:     computeRange(closes, 20),
    range60d:     computeRange(closes, 60),
    volRatio:     computeVolRatio(quote.volume || []),
    pctOffHigh,
  };
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
      // Technicals are a bonus signal — a failed chart fetch shouldn't drop the
      // whole ticker when fundamentals succeeded, so this is isolated.
      let tech = { sma50: null, sma200: null, rsi14: null, daysSinceLow: null, range20d: null, range60d: null, volRatio: null, pctOffHigh: null };
      try {
        tech = await fetchTechnicals(base.ticker);
      } catch { /* leave technicals null — price-action score just skips this ticker */ }
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
        revGrowth:   live.revGrowth   ?? 0,
        fwdEpsGrowth:live.fwdEpsGrowth?? 0,
        roe:         live.roe         ?? 0,
        de:          live.de          ?? 0,
        divYield:    live.divYield    ?? 0,
        grossMargin: live.grossMargin ?? 0,
        fcfYield:    live.fcfYield    ?? 0,
        peg:         live.peg         ?? 0,
        ps:          live.ps          ?? 0,
        // Price action (null when chart history is too short/unavailable)
        sma50:       tech.sma50,
        sma200:      tech.sma200,
        rsi14:       tech.rsi14,
        // Base/accumulation inputs — see computeBaseScore in App.jsx
        daysSinceLow:tech.daysSinceLow,
        range20d:    tech.range20d,
        range60d:    tech.range60d,
        volRatio:    tech.volRatio,
        pctOffHigh:  tech.pctOffHigh,
      };
      stocks.push(stock);
      updated++;
      console.log(`✓  ${base.ticker.padEnd(9)} pe=${stock.pe} peg=${stock.peg} ps=${stock.ps} roe=${stock.roe}% div=${stock.divYield}% rsi=${stock.rsi14 ?? "n/a"}`);
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
