#!/usr/bin/env node
// refresh-scanner.mjs — fetches live fundamental data from Yahoo Finance
// and updates src/data/stockUniverse.json in place.
//
// Run:  node scripts/refresh-scanner.mjs
// No npm dependencies required — uses Node 18+ built-in fetch.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../src/data/stockUniverse.json');
const DELAY_MS  = 350; // polite delay between Yahoo Finance requests

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchFundamentals(ticker) {
  const encoded = encodeURIComponent(ticker);
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encoded}` +
              `?modules=summaryDetail,financialData,defaultKeyStatistics`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
      'Accept':     'application/json',
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  const result = json.quoteSummary?.result?.[0];
  if (!result) throw new Error('empty result');

  const sd = result.summaryDetail          || {};
  const fd = result.financialData          || {};
  const ks = result.defaultKeyStatistics   || {};

  const r1 = v => Math.round(v * 10)  / 10;   // 1 decimal place
  const r2 = v => Math.round(v * 100) / 100;  // 2 decimal places

  // Raw values from Yahoo Finance
  const rawPe    = sd.trailingPE?.raw;
  const rawFwdPe = sd.forwardPE?.raw;
  // Yahoo earningsGrowth: decimal (0.20 = +20% YoY). Use financialData first, fallback to ks.
  const rawEpsG  = fd.earningsGrowth?.raw  ?? ks.earningsGrowth?.raw;
  const rawRoe   = fd.returnOnEquity?.raw;   // decimal (0.15 = 15%)
  const rawDe    = fd.debtToEquity?.raw;     // percentage (150 = D/E 1.50)
  const rawDivY  = sd.dividendYield?.raw;    // decimal (0.038 = 3.8%)
  const rawGm    = fd.grossMargins?.raw;     // decimal (0.46 = 46%)
  const rawFcf   = fd.freeCashflow?.raw;     // dollars
  const rawMcap  = sd.marketCap?.raw;        // dollars

  const pe         = rawPe    != null ? r1(rawPe)               : null;
  const fwdPe      = rawFwdPe != null ? r1(rawFwdPe)            : null;
  const epsGrowth  = rawEpsG  != null ? Math.round(rawEpsG*100) : null;  // 0.20 → 20
  const roe        = rawRoe   != null ? Math.round(rawRoe*100)  : null;  // 0.15 → 15
  const de         = rawDe    != null ? r2(rawDe / 100)         : null;  // 150 → 1.50
  const divYield   = rawDivY  != null ? r1(rawDivY * 100)       : null;  // 0.038 → 3.8
  const grossMargin= rawGm    != null ? Math.round(rawGm * 100) : null;  // 0.46 → 46
  const fcfYield   = (rawFcf != null && rawMcap != null && rawMcap > 0)
                     ? r1((rawFcf / rawMcap) * 100) : null;

  // Recompute PEG if we have both PE and positive EPS growth
  const peg = (pe != null && epsGrowth != null && epsGrowth > 0)
              ? r2(pe / epsGrowth) : null;

  return { pe, fwdPe, epsGrowth, roe, de, divYield, grossMargin, fcfYield, peg };
}

async function main() {
  const universe = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  let updated = 0, skipped = 0;

  for (const stock of universe.stocks) {
    try {
      const live = await fetchFundamentals(stock.ticker);

      // Apply only non-null values — keeps existing data when Yahoo returns nothing
      let changed = false;
      for (const [key, val] of Object.entries(live)) {
        if (val !== null && isFinite(val)) {
          stock[key] = val;
          changed = true;
        }
      }
      if (changed) updated++;
      console.log(`✓  ${stock.ticker.padEnd(8)} pe=${stock.pe} peg=${stock.peg} roe=${stock.roe}% div=${stock.divYield}%`);
    } catch (err) {
      skipped++;
      console.error(`✗  ${stock.ticker.padEnd(8)} ${err.message} — keeping existing values`);
    }

    await sleep(DELAY_MS);
  }

  // Stamp the update month
  const now = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  universe.lastUpdated = `${months[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  writeFileSync(DATA_PATH, JSON.stringify(universe, null, 2) + '\n');

  console.log(`\n── Summary ──────────────────────────────`);
  console.log(`   Updated with live data : ${updated}`);
  console.log(`   Kept existing (no data): ${skipped}`);
  console.log(`   lastUpdated            : ${universe.lastUpdated}`);
}

main().catch(err => { console.error(err); process.exit(1); });
