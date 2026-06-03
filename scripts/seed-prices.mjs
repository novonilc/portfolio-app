#!/usr/bin/env node
// seed-prices.mjs — adds approximate June 2026 prices to stockUniverse.json
// for stocks that have no price yet (price === 0 or field missing).
// Real prices will be overwritten by the daily cron (refresh-scanner.mjs).
// Run once: node scripts/seed-prices.mjs

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../src/data/stockUniverse.json');

// Approximate prices as of June 2026 (USD; CAD tickers are in USD equivalent)
const PRICES = {
  // Technology
  AAPL:200,  MSFT:432,  NVDA:1100, GOOGL:176, META:588,  AMZN:198,  AVGO:243,
  ORCL:174,  AMD:147,   MU:118,    QCOM:166,  TSM:188,   ARM:148,   NOW:1005,
  CRWD:398,  PLTR:124,  MRVL:93,   ANET:368,  PANW:198,  FICO:1685,
  // Financials
  JPM:246,   BAC:44,    GS:541,    V:332,     MA:519,    AXP:266,
  'BRK.B':474, SCHW:81, BLK:998,   MSCI:548,  PYPL:80,   KKR:134,
  // Healthcare
  LLY:848,   JNJ:167,   ABBV:194,  UNH:291,   ISRG:541,  NVO:90,
  MRK:131,   AMGN:312,  IDXX:418,  HIMS:44,
  // Consumer Staples
  KO:71,     PG:174,    COST:938,  WMT:94,    MNST:52,
  // Consumer Discretionary
  HD:399,    NFLX:1268, TSLA:332,  NKE:75,    MCD:299,   SBUX:89,
  // Energy
  XOM:114,   CVX:158,   OXY:48,    COP:104,   SLB:40,
  // Defense & Industrials
  RTX:131,   LMT:491,   GE:224,    HON:214,   AXON:688,
  CAT:371,   DE:416,    ITW:261,   TDG:1518,  ODFL:201,
  // Telecom
  T:22,      VZ:42,     TMUS:244,
  // Materials / Real Estate / Utilities
  LIN:441,   SHW:339,   AMT:224,   PLD:131,   NEE:73,    AEP:104,
  // Canadian (US-listed ADRs or cross-listed prices in USD)
  ENB:39,    CNQ:32,    'SU.TO':38,
  TD:62,     RY:121,    BNS:54,    BMO:93,    CM:63,
  MFC:27,    SLF:53,    ATD:50,    SHOP:107,  TRP:43,
  BAM:41,    'CP.TO':74,'CNR.TO':118, TFII:111,'WSP.TO':170,
};

const universe = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
let seeded = 0, skipped = 0;

for (const stock of universe.stocks) {
  const approx = PRICES[stock.ticker];
  if (approx && (!stock.price || stock.price <= 0)) {
    stock.price = approx;
    seeded++;
  } else if (stock.price > 0) {
    skipped++;
  }
}

writeFileSync(DATA_PATH, JSON.stringify(universe, null, 2) + '\n');
console.log(`Seeded ${seeded} prices, skipped ${skipped} (already had price).`);
console.log('Run the daily cron (node scripts/refresh-scanner.mjs) to replace with live prices.');
