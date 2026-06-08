#!/usr/bin/env node
// One-time script: rebuild stockUniverse.json with clean curated 95-stock data
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/stockUniverse.json');

const STOCKS = [
  // ── Technology (21 incl. ASML) ──────────────────────────────────────────────
  { ticker:'AAPL',  name:'Apple',                    sector:'Technology',             market:'US', mktCap:'mega',  isBank:false, pe:28,  fwdPe:25, epsGrowth:8,  roe:145, de:1.8, divYield:0.5, fcfYield:3.8, grossMargin:46, peg:3.50, price:200,  moat:'Brand & Ecosystem' },
  { ticker:'MSFT',  name:'Microsoft',                 sector:'Technology',             market:'US', mktCap:'mega',  isBank:false, pe:33,  fwdPe:29, epsGrowth:15, roe:38,  de:0.4, divYield:0.8, fcfYield:2.7, grossMargin:70, peg:2.20, price:432,  moat:'Cloud / AI Platform' },
  { ticker:'NVDA',  name:'Nvidia',                    sector:'Technology',             market:'US', mktCap:'mega',  isBank:false, pe:45,  fwdPe:35, epsGrowth:80, roe:80,  de:0.4, divYield:0.0, fcfYield:2.0, grossMargin:75, peg:0.56, price:135,  moat:'AI Chip Monopoly' },
  { ticker:'GOOGL', name:'Alphabet',                  sector:'Technology',             market:'US', mktCap:'mega',  isBank:false, pe:21,  fwdPe:18, epsGrowth:20, roe:25,  de:0.1, divYield:0.5, fcfYield:4.0, grossMargin:58, peg:1.05, price:176,  moat:'Search / AI' },
  { ticker:'META',  name:'Meta Platforms',            sector:'Technology',             market:'US', mktCap:'mega',  isBank:false, pe:22,  fwdPe:19, epsGrowth:25, roe:32,  de:0.2, divYield:0.4, fcfYield:4.2, grossMargin:83, peg:0.88, price:588,  moat:'Social Network Effect' },
  { ticker:'AMZN',  name:'Amazon',                    sector:'Technology',             market:'US', mktCap:'mega',  isBank:false, pe:38,  fwdPe:30, epsGrowth:55, roe:22,  de:0.4, divYield:0.0, fcfYield:2.5, grossMargin:49, peg:0.69, price:198,  moat:'AWS / Logistics' },
  { ticker:'AVGO',  name:'Broadcom',                  sector:'Technology',             market:'US', mktCap:'mega',  isBank:false, pe:34,  fwdPe:27, epsGrowth:20, roe:65,  de:0.9, divYield:1.2, fcfYield:3.1, grossMargin:68, peg:1.70, price:243,  moat:'Custom AI ASICs' },
  { ticker:'ORCL',  name:'Oracle',                    sector:'Technology',             market:'US', mktCap:'mega',  isBank:false, pe:28,  fwdPe:24, epsGrowth:12, roe:250, de:8.0, divYield:1.0, fcfYield:3.5, grossMargin:72, peg:2.33, price:174,  moat:'Enterprise Database' },
  { ticker:'AMD',   name:'AMD',                       sector:'Technology',             market:'US', mktCap:'large', isBank:false, pe:28,  fwdPe:22, epsGrowth:45, roe:10,  de:0.1, divYield:0.0, fcfYield:2.5, grossMargin:52, peg:0.62, price:147,  moat:'CPU/GPU Architecture' },
  { ticker:'MU',    name:'Micron Technology',         sector:'Technology',             market:'US', mktCap:'large', isBank:false, pe:15,  fwdPe:11, epsGrowth:35, roe:18,  de:0.2, divYield:0.5, fcfYield:5.0, grossMargin:42, peg:0.43, price:118,  moat:'HBM AI Memory Technology' },
  { ticker:'QCOM',  name:'Qualcomm',                  sector:'Technology',             market:'US', mktCap:'large', isBank:false, pe:15,  fwdPe:13, epsGrowth:10, roe:40,  de:0.8, divYield:2.2, fcfYield:6.2, grossMargin:56, peg:1.50, price:166,  moat:'Mobile Chip Patents' },
  { ticker:'TSM',   name:'Taiwan Semiconductor',      sector:'Technology',             market:'US', mktCap:'mega',  isBank:false, pe:22,  fwdPe:18, epsGrowth:25, roe:28,  de:0.3, divYield:1.5, fcfYield:3.0, grossMargin:54, peg:0.88, price:188,  moat:'Advanced Node Foundry' },
  { ticker:'ARM',   name:'ARM Holdings',              sector:'Technology',             market:'US', mktCap:'large', isBank:false, pe:120, fwdPe:88, epsGrowth:40, roe:28,  de:0.1, divYield:0.0, fcfYield:0.8, grossMargin:96, peg:3.00, price:148,  moat:'CPU IP Royalties' },
  { ticker:'NOW',   name:'ServiceNow',                sector:'Technology',             market:'US', mktCap:'large', isBank:false, pe:72,  fwdPe:55, epsGrowth:25, roe:28,  de:0.3, divYield:0.0, fcfYield:1.2, grossMargin:80, peg:2.88, price:1005, moat:'Enterprise Workflow Lock-in' },
  { ticker:'CRWD',  name:'CrowdStrike',               sector:'Technology',             market:'US', mktCap:'large', isBank:false, pe:80,  fwdPe:60, epsGrowth:30, roe:15,  de:0.2, divYield:0.0, fcfYield:1.5, grossMargin:77, peg:2.67, price:398,  moat:'Cybersecurity Platform' },
  { ticker:'PLTR',  name:'Palantir',                  sector:'Technology',             market:'US', mktCap:'large', isBank:false, pe:85,  fwdPe:68, epsGrowth:25, roe:10,  de:0.0, divYield:0.0, fcfYield:1.0, grossMargin:82, peg:3.40, price:124,  moat:'AI Gov / Defense Platform' },
  { ticker:'MRVL',  name:'Marvell Technology',        sector:'Technology',             market:'US', mktCap:'large', isBank:false, pe:48,  fwdPe:32, epsGrowth:35, roe:8,   de:0.4, divYield:0.3, fcfYield:1.8, grossMargin:50, peg:1.37, price:93,   moat:'Custom AI ASIC for Hyperscalers' },
  { ticker:'ANET',  name:'Arista Networks',           sector:'Technology',             market:'US', mktCap:'large', isBank:false, pe:42,  fwdPe:34, epsGrowth:22, roe:38,  de:0.0, divYield:0.0, fcfYield:3.5, grossMargin:64, peg:1.91, price:368,  moat:'AI Data Center Networking' },
  { ticker:'PANW',  name:'Palo Alto Networks',        sector:'Technology',             market:'US', mktCap:'large', isBank:false, pe:50,  fwdPe:38, epsGrowth:20, roe:35,  de:0.3, divYield:0.0, fcfYield:2.5, grossMargin:74, peg:2.50, price:198,  moat:'Cybersecurity Platform' },
  { ticker:'FICO',  name:'Fair Isaac (FICO)',          sector:'Technology',             market:'US', mktCap:'large', isBank:false, pe:55,  fwdPe:45, epsGrowth:18, roe:200, de:5.0, divYield:0.0, fcfYield:2.0, grossMargin:78, peg:3.06, price:1685, moat:'Credit Score Monopoly' },
  { ticker:'ASML',  name:'ASML Holding',              sector:'Technology',             market:'US', mktCap:'mega',  isBank:false, pe:35,  fwdPe:28, epsGrowth:18, roe:55,  de:0.4, divYield:1.0, fcfYield:2.5, grossMargin:52, peg:1.94, price:720,  moat:'EUV Lithography Monopoly' },
  { ticker:'INTC',  name:'Intel',                     sector:'Technology',             market:'US', mktCap:'large', isBank:false, pe:28,  fwdPe:20, epsGrowth:20, roe:8,   de:0.5, divYield:1.5, fcfYield:1.0, grossMargin:36, peg:1.40, price:22,   moat:'x86 CPU + IFS Foundry' },
  // ── Financials (12) ─────────────────────────────────────────────────────────
  { ticker:'JPM',   name:'JPMorgan Chase',            sector:'Financials',             market:'US', mktCap:'mega',  isBank:true,  pe:13,  fwdPe:12, epsGrowth:10, roe:17,  de:1.3, divYield:2.3, fcfYield:6.5, grossMargin:62, peg:1.30, price:246,  moat:'Global Banking Scale' },
  { ticker:'BAC',   name:'Bank of America',           sector:'Financials',             market:'US', mktCap:'mega',  isBank:true,  pe:14,  fwdPe:12, epsGrowth:8,  roe:12,  de:0.9, divYield:2.8, fcfYield:5.8, grossMargin:55, peg:1.75, price:44,   moat:'Retail Banking Scale' },
  { ticker:'GS',    name:'Goldman Sachs',             sector:'Financials',             market:'US', mktCap:'large', isBank:true,  pe:14,  fwdPe:12, epsGrowth:12, roe:12,  de:4.5, divYield:2.5, fcfYield:4.2, grossMargin:40, peg:1.17, price:541,  moat:'Investment Banking Franchise' },
  { ticker:'V',     name:'Visa',                      sector:'Financials',             market:'US', mktCap:'mega',  isBank:false, pe:28,  fwdPe:25, epsGrowth:12, roe:45,  de:0.5, divYield:0.8, fcfYield:3.0, grossMargin:81, peg:2.33, price:332,  moat:'Global Payment Network' },
  { ticker:'MA',    name:'Mastercard',                sector:'Financials',             market:'US', mktCap:'mega',  isBank:false, pe:36,  fwdPe:31, epsGrowth:14, roe:180, de:2.5, divYield:0.5, fcfYield:2.6, grossMargin:77, peg:2.57, price:519,  moat:'Global Payment Network' },
  { ticker:'AXP',   name:'American Express',          sector:'Financials',             market:'US', mktCap:'large', isBank:true,  pe:18,  fwdPe:16, epsGrowth:15, roe:30,  de:1.0, divYield:1.4, fcfYield:5.0, grossMargin:55, peg:1.20, price:266,  moat:'Premium Brand / Network' },
  { ticker:'BRK.B', name:'Berkshire Hathaway B',      sector:'Financials',             market:'US', mktCap:'mega',  isBank:false, pe:22,  fwdPe:20, epsGrowth:10, roe:13,  de:0.3, divYield:0.0, fcfYield:4.5, grossMargin:28, peg:2.20, price:474,  moat:'Diversified Conglomerate' },
  { ticker:'SCHW',  name:'Charles Schwab',            sector:'Financials',             market:'US', mktCap:'large', isBank:true,  pe:20,  fwdPe:17, epsGrowth:20, roe:10,  de:0.8, divYield:1.1, fcfYield:4.5, grossMargin:70, peg:1.00, price:81,   moat:'Brokerage Scale' },
  { ticker:'BLK',   name:'BlackRock',                 sector:'Financials',             market:'US', mktCap:'large', isBank:true,  pe:22,  fwdPe:19, epsGrowth:12, roe:16,  de:0.4, divYield:2.4, fcfYield:4.8, grossMargin:45, peg:1.83, price:998,  moat:'Asset Management Scale' },
  { ticker:'MSCI',  name:'MSCI Inc',                  sector:'Financials',             market:'US', mktCap:'large', isBank:false, pe:45,  fwdPe:38, epsGrowth:16, roe:200, de:6.0, divYield:1.0, fcfYield:2.2, grossMargin:80, peg:2.81, price:548,  moat:'Index Licensing Oligopoly' },
  { ticker:'PYPL',  name:'PayPal',                    sector:'Fintech',                market:'US', mktCap:'large', isBank:false, pe:12,  fwdPe:10, epsGrowth:10, roe:18,  de:0.5, divYield:0.0, fcfYield:8.5, grossMargin:46, peg:1.20, price:80,   moat:'Digital Payments Network' },
  { ticker:'KKR',   name:'KKR & Co',                  sector:'Financials',             market:'US', mktCap:'large', isBank:false, pe:28,  fwdPe:22, epsGrowth:20, roe:15,  de:0.8, divYield:0.8, fcfYield:2.5, grossMargin:60, peg:1.40, price:134,  moat:'Alternative Asset Management' },
  // ── Healthcare (10) ──────────────────────────────────────────────────────────
  { ticker:'LLY',   name:'Eli Lilly',                 sector:'Healthcare',             market:'US', mktCap:'mega',  isBank:false, pe:52,  fwdPe:38, epsGrowth:50, roe:80,  de:0.7, divYield:0.7, fcfYield:1.5, grossMargin:82, peg:1.04, price:848,  moat:'GLP-1 IP Pipeline' },
  { ticker:'JNJ',   name:'Johnson & Johnson',         sector:'Healthcare',             market:'US', mktCap:'mega',  isBank:false, pe:15,  fwdPe:14, epsGrowth:5,  roe:25,  de:0.5, divYield:3.2, fcfYield:5.8, grossMargin:70, peg:3.00, price:167,  moat:'Diversified Pharma / MedTech' },
  { ticker:'ABBV',  name:'AbbVie',                    sector:'Healthcare',             market:'US', mktCap:'large', isBank:false, pe:16,  fwdPe:14, epsGrowth:5,  roe:85,  de:3.5, divYield:4.0, fcfYield:5.5, grossMargin:71, peg:3.20, price:194,  moat:'Immunology IP' },
  { ticker:'UNH',   name:'UnitedHealth',              sector:'Healthcare',             market:'US', mktCap:'mega',  isBank:false, pe:22,  fwdPe:20, epsGrowth:12, roe:25,  de:0.7, divYield:1.4, fcfYield:4.2, grossMargin:25, peg:1.83, price:291,  moat:'MCO Scale & Data Advantage' },
  { ticker:'ISRG',  name:'Intuitive Surgical',        sector:'Healthcare',             market:'US', mktCap:'large', isBank:false, pe:58,  fwdPe:48, epsGrowth:18, roe:18,  de:0.0, divYield:0.0, fcfYield:1.5, grossMargin:68, peg:3.22, price:541,  moat:'Robotic Surgery Platform' },
  { ticker:'NVO',   name:'Novo Nordisk',              sector:'Healthcare',             market:'US', mktCap:'mega',  isBank:false, pe:28,  fwdPe:22, epsGrowth:25, roe:85,  de:0.3, divYield:1.4, fcfYield:3.2, grossMargin:84, peg:1.12, price:90,   moat:'GLP-1 Dual IP Estate' },
  { ticker:'MRK',   name:'Merck',                     sector:'Healthcare',             market:'US', mktCap:'large', isBank:false, pe:14,  fwdPe:12, epsGrowth:8,  roe:35,  de:0.6, divYield:3.5, fcfYield:6.2, grossMargin:76, peg:1.75, price:131,  moat:'Pharma Pipeline + Keytruda' },
  { ticker:'AMGN',  name:'Amgen',                     sector:'Healthcare',             market:'US', mktCap:'large', isBank:false, pe:18,  fwdPe:15, epsGrowth:10, roe:120, de:6.5, divYield:3.5, fcfYield:5.5, grossMargin:72, peg:1.80, price:312,  moat:'Biotech IP Portfolio' },
  { ticker:'IDXX',  name:'IDEXX Laboratories',        sector:'Healthcare',             market:'US', mktCap:'large', isBank:false, pe:48,  fwdPe:40, epsGrowth:14, roe:95,  de:1.2, divYield:0.0, fcfYield:2.8, grossMargin:58, peg:3.43, price:418,  moat:'Vet Diagnostic Platform' },
  { ticker:'HIMS',  name:'Hims & Hers Health',        sector:'Healthcare',             market:'US', mktCap:'mid',   isBank:false, pe:45,  fwdPe:32, epsGrowth:40, roe:8,   de:0.1, divYield:0.0, fcfYield:1.5, grossMargin:80, peg:1.13, price:44,   moat:'D2C Telehealth + GLP-1' },
  // ── Consumer Staples (5) ─────────────────────────────────────────────────────
  { ticker:'KO',    name:'Coca-Cola',                 sector:'Consumer Staples',       market:'US', mktCap:'mega',  isBank:false, pe:24,  fwdPe:22, epsGrowth:5,  roe:40,  de:2.5, divYield:3.1, fcfYield:3.8, grossMargin:60, peg:4.80, price:71,   moat:'Global Consumer Brand' },
  { ticker:'PG',    name:'Procter & Gamble',          sector:'Consumer Staples',       market:'US', mktCap:'mega',  isBank:false, pe:26,  fwdPe:24, epsGrowth:8,  roe:30,  de:0.6, divYield:2.5, fcfYield:3.5, grossMargin:52, peg:3.25, price:174,  moat:'Brand Portfolio' },
  { ticker:'COST',  name:'Costco',                    sector:'Consumer Staples',       market:'US', mktCap:'mega',  isBank:false, pe:52,  fwdPe:46, epsGrowth:12, roe:30,  de:0.3, divYield:0.5, fcfYield:1.8, grossMargin:13, peg:4.33, price:938,  moat:'Membership / Cost Leader' },
  { ticker:'WMT',   name:'Walmart',                   sector:'Consumer Staples',       market:'US', mktCap:'mega',  isBank:false, pe:32,  fwdPe:27, epsGrowth:14, roe:18,  de:0.5, divYield:1.0, fcfYield:2.8, grossMargin:25, peg:2.29, price:94,   moat:'Scale / Supply Chain' },
  { ticker:'MNST',  name:'Monster Beverage',          sector:'Consumer Staples',       market:'US', mktCap:'large', isBank:false, pe:30,  fwdPe:26, epsGrowth:10, roe:28,  de:0.0, divYield:0.0, fcfYield:3.5, grossMargin:52, peg:3.00, price:52,   moat:'Energy Drink + Coke Distrib' },
  // ── Consumer Discretionary (6) ───────────────────────────────────────────────
  { ticker:'HD',    name:'Home Depot',                sector:'Consumer Discretionary', market:'US', mktCap:'mega',  isBank:false, pe:22,  fwdPe:20, epsGrowth:8,  roe:350, de:9.0, divYield:2.6, fcfYield:4.2, grossMargin:33, peg:2.75, price:399,  moat:'Home Improvement Duopoly' },
  { ticker:'NFLX',  name:'Netflix',                   sector:'Consumer Discretionary', market:'US', mktCap:'large', isBank:false, pe:38,  fwdPe:30, epsGrowth:30, roe:35,  de:0.6, divYield:0.0, fcfYield:2.5, grossMargin:47, peg:1.27, price:1268, moat:'Content Scale + Network' },
  { ticker:'TSLA',  name:'Tesla',                     sector:'Consumer Discretionary', market:'US', mktCap:'mega',  isBank:false, pe:70,  fwdPe:55, epsGrowth:15, roe:12,  de:0.2, divYield:0.0, fcfYield:0.5, grossMargin:20, peg:4.67, price:332,  moat:'EV Brand / Charging Network' },
  { ticker:'NKE',   name:'Nike',                      sector:'Consumer Discretionary', market:'US', mktCap:'large', isBank:false, pe:28,  fwdPe:24, epsGrowth:10, roe:35,  de:0.8, divYield:1.9, fcfYield:3.2, grossMargin:44, peg:2.80, price:75,   moat:'Global Athletic Brand' },
  { ticker:'MCD',   name:"McDonald's",                sector:'Consumer Discretionary', market:'US', mktCap:'mega',  isBank:false, pe:22,  fwdPe:20, epsGrowth:10, roe:200, de:12.0,divYield:2.3, fcfYield:4.5, grossMargin:56, peg:2.20, price:299,  moat:'Global Franchise + Real Estate' },
  { ticker:'SBUX',  name:'Starbucks',                 sector:'Consumer Discretionary', market:'US', mktCap:'large', isBank:false, pe:28,  fwdPe:22, epsGrowth:12, roe:120, de:8.0, divYield:3.2, fcfYield:3.0, grossMargin:30, peg:2.33, price:89,   moat:'Premium Coffee Brand' },
  // ── Energy (5) ───────────────────────────────────────────────────────────────
  { ticker:'XOM',   name:'ExxonMobil',                sector:'Energy',                 market:'US', mktCap:'mega',  isBank:false, pe:14,  fwdPe:13, epsGrowth:5,  roe:15,  de:0.3, divYield:3.8, fcfYield:6.5, grossMargin:40, peg:2.80, price:114,  moat:'Integrated Oil Major' },
  { ticker:'CVX',   name:'Chevron',                   sector:'Energy',                 market:'US', mktCap:'mega',  isBank:false, pe:15,  fwdPe:13, epsGrowth:5,  roe:12,  de:0.2, divYield:4.3, fcfYield:7.0, grossMargin:35, peg:3.00, price:158,  moat:'Integrated Oil Major' },
  { ticker:'OXY',   name:'Occidental Petroleum',      sector:'Energy',                 market:'US', mktCap:'large', isBank:false, pe:12,  fwdPe:11, epsGrowth:8,  roe:15,  de:0.6, divYield:1.8, fcfYield:7.5, grossMargin:50, peg:1.50, price:48,   moat:'Permian Basin Acreage' },
  { ticker:'COP',   name:'ConocoPhillips',            sector:'Energy',                 market:'US', mktCap:'large', isBank:false, pe:14,  fwdPe:12, epsGrowth:8,  roe:18,  de:0.4, divYield:2.0, fcfYield:7.0, grossMargin:42, peg:1.75, price:104,  moat:'Low-Cost E&P Operator' },
  { ticker:'SLB',   name:'SLB (Schlumberger)',        sector:'Energy',                 market:'US', mktCap:'large', isBank:false, pe:16,  fwdPe:14, epsGrowth:10, roe:20,  de:0.7, divYield:2.5, fcfYield:5.5, grossMargin:20, peg:1.60, price:40,   moat:'Oil Services Technology' },
  // ── Defense & Industrials (10) ───────────────────────────────────────────────
  { ticker:'RTX',   name:'RTX Corporation',           sector:'Defense',                market:'US', mktCap:'large', isBank:false, pe:20,  fwdPe:18, epsGrowth:12, roe:15,  de:0.7, divYield:2.3, fcfYield:4.2, grossMargin:20, peg:1.67, price:131,  moat:'Gov Contracts / Missile Backlog' },
  { ticker:'LMT',   name:'Lockheed Martin',           sector:'Defense',                market:'US', mktCap:'large', isBank:false, pe:18,  fwdPe:17, epsGrowth:8,  roe:70,  de:2.0, divYield:2.8, fcfYield:5.5, grossMargin:12, peg:2.25, price:491,  moat:'Defense Prime Monopoly' },
  { ticker:'GE',    name:'GE Aerospace',              sector:'Industrials',            market:'US', mktCap:'large', isBank:false, pe:28,  fwdPe:22, epsGrowth:25, roe:20,  de:0.5, divYield:0.8, fcfYield:3.5, grossMargin:30, peg:1.12, price:224,  moat:'Jet Engine Duopoly (LEAP)' },
  { ticker:'HON',   name:'Honeywell',                 sector:'Industrials',            market:'US', mktCap:'large', isBank:false, pe:22,  fwdPe:20, epsGrowth:8,  roe:32,  de:0.7, divYield:2.2, fcfYield:4.5, grossMargin:35, peg:2.75, price:214,  moat:'Industrial Automation Scale' },
  { ticker:'AXON',  name:'Axon Enterprise',           sector:'Defense',                market:'US', mktCap:'mid',   isBank:false, pe:85,  fwdPe:65, epsGrowth:25, roe:15,  de:0.1, divYield:0.0, fcfYield:1.0, grossMargin:62, peg:3.40, price:688,  moat:'Police Tech Ecosystem Lock-in' },
  { ticker:'CAT',   name:'Caterpillar',               sector:'Industrials',            market:'US', mktCap:'large', isBank:false, pe:16,  fwdPe:14, epsGrowth:10, roe:55,  de:1.8, divYield:1.8, fcfYield:5.0, grossMargin:37, peg:1.60, price:371,  moat:'Heavy Equipment + Aftermarket' },
  { ticker:'DE',    name:'Deere & Co',                sector:'Industrials',            market:'US', mktCap:'large', isBank:false, pe:16,  fwdPe:14, epsGrowth:10, roe:38,  de:2.2, divYield:1.5, fcfYield:4.5, grossMargin:42, peg:1.60, price:416,  moat:'Precision Ag Equipment' },
  { ticker:'ITW',   name:'Illinois Tool Works',       sector:'Industrials',            market:'US', mktCap:'large', isBank:false, pe:22,  fwdPe:20, epsGrowth:8,  roe:95,  de:3.5, divYield:2.2, fcfYield:5.0, grossMargin:45, peg:2.75, price:261,  moat:'80/20 Industrial Niche' },
  { ticker:'TDG',   name:'TransDigm Group',           sector:'Industrials',            market:'US', mktCap:'large', isBank:false, pe:38,  fwdPe:32, epsGrowth:14, roe:80,  de:8.0, divYield:0.0, fcfYield:3.0, grossMargin:55, peg:2.71, price:1518, moat:'FAA Sole-Source Aerospace Parts' },
  { ticker:'ODFL',  name:'Old Dominion Freight',      sector:'Industrials',            market:'US', mktCap:'large', isBank:false, pe:28,  fwdPe:24, epsGrowth:10, roe:30,  de:0.1, divYield:0.5, fcfYield:3.8, grossMargin:32, peg:2.80, price:201,  moat:'LTL Service Excellence' },
  // ── Telecom (3) ──────────────────────────────────────────────────────────────
  { ticker:'T',     name:'AT&T',                      sector:'Telecom',                market:'US', mktCap:'large', isBank:false, pe:10,  fwdPe:9,  epsGrowth:3,  roe:12,  de:1.5, divYield:6.2, fcfYield:10.0,grossMargin:55, peg:3.33, price:22,   moat:'Wireless Network Infrastructure' },
  { ticker:'VZ',    name:'Verizon',                   sector:'Telecom',                market:'US', mktCap:'large', isBank:false, pe:9,   fwdPe:8,  epsGrowth:3,  roe:23,  de:2.0, divYield:6.8, fcfYield:9.5, grossMargin:59, peg:3.00, price:42,   moat:'Wireless Network Infrastructure' },
  { ticker:'TMUS',  name:'T-Mobile US',               sector:'Telecom',                market:'US', mktCap:'large', isBank:false, pe:24,  fwdPe:20, epsGrowth:15, roe:14,  de:1.5, divYield:1.8, fcfYield:4.5, grossMargin:48, peg:1.60, price:244,  moat:'Network + Spectrum Assets' },
  // ── Materials (2) ────────────────────────────────────────────────────────────
  { ticker:'LIN',   name:'Linde',                     sector:'Materials',              market:'US', mktCap:'mega',  isBank:false, pe:32,  fwdPe:28, epsGrowth:10, roe:20,  de:0.5, divYield:1.3, fcfYield:3.5, grossMargin:48, peg:3.20, price:441,  moat:'Industrial Gas Oligopoly' },
  { ticker:'SHW',   name:'Sherwin-Williams',          sector:'Materials',              market:'US', mktCap:'large', isBank:false, pe:30,  fwdPe:26, epsGrowth:10, roe:80,  de:2.8, divYield:0.8, fcfYield:3.8, grossMargin:48, peg:3.00, price:339,  moat:'Architectural Coatings Leader' },
  // ── Real Estate (2) ──────────────────────────────────────────────────────────
  { ticker:'AMT',   name:'American Tower',            sector:'Real Estate',            market:'US', mktCap:'large', isBank:false, pe:40,  fwdPe:35, epsGrowth:8,  roe:14,  de:3.0, divYield:3.5, fcfYield:3.5, grossMargin:72, peg:5.00, price:224,  moat:'Cell Tower Real Estate' },
  { ticker:'PLD',   name:'Prologis',                  sector:'Real Estate',            market:'US', mktCap:'large', isBank:false, pe:38,  fwdPe:32, epsGrowth:10, roe:8,   de:0.8, divYield:3.8, fcfYield:3.2, grossMargin:75, peg:3.80, price:131,  moat:'Logistics Real Estate Scale' },
  // ── Utilities (2) ────────────────────────────────────────────────────────────
  { ticker:'NEE',   name:'NextEra Energy',            sector:'Utilities',              market:'US', mktCap:'large', isBank:false, pe:20,  fwdPe:18, epsGrowth:8,  roe:12,  de:1.8, divYield:3.2, fcfYield:2.5, grossMargin:40, peg:2.50, price:73,   moat:'Renewable Energy + Regulated Grid' },
  { ticker:'AEP',   name:'American Electric Power',   sector:'Utilities',              market:'US', mktCap:'large', isBank:false, pe:18,  fwdPe:16, epsGrowth:7,  roe:10,  de:2.0, divYield:4.2, fcfYield:2.0, grossMargin:35, peg:2.57, price:104,  moat:'Regulated Electric Utility' },
  // ── Canadian (18) ────────────────────────────────────────────────────────────
  { ticker:'ENB',   name:'Enbridge',                  sector:'Energy Infra',           market:'CA', mktCap:'large', isBank:false, pe:18,  fwdPe:16, epsGrowth:3,  roe:14,  de:1.2, divYield:6.8, fcfYield:5.5, grossMargin:35, peg:6.00, price:39,   moat:'Regulated Pipeline Monopoly' },
  { ticker:'CNQ',   name:'Canadian Natural Resources', sector:'Energy',               market:'CA', mktCap:'large', isBank:false, pe:13,  fwdPe:12, epsGrowth:10, roe:25,  de:0.3, divYield:4.5, fcfYield:8.0, grossMargin:55, peg:1.30, price:32,   moat:'Low-Cost Oil Sands' },
  { ticker:'SU.TO', name:'Suncor Energy',              sector:'Energy',                market:'CA', mktCap:'large', isBank:false, pe:12,  fwdPe:11, epsGrowth:8,  roe:18,  de:0.3, divYield:4.5, fcfYield:9.0, grossMargin:45, peg:1.50, price:38,   moat:'$45/bbl Break-Even Advantage' },
  { ticker:'TD',    name:'TD Bank',                    sector:'Financials',            market:'CA', mktCap:'mega',  isBank:true,  pe:12,  fwdPe:11, epsGrowth:5,  roe:15,  de:1.0, divYield:5.0, fcfYield:7.5, grossMargin:50, peg:2.40, price:62,   moat:'Canadian Banking Oligopoly' },
  { ticker:'RY',    name:'Royal Bank of Canada',       sector:'Financials',            market:'CA', mktCap:'mega',  isBank:true,  pe:13,  fwdPe:12, epsGrowth:8,  roe:16,  de:1.0, divYield:4.2, fcfYield:6.5, grossMargin:55, peg:1.63, price:121,  moat:'Canadian Banking Oligopoly' },
  { ticker:'BNS',   name:'Scotiabank',                 sector:'Financials',            market:'CA', mktCap:'large', isBank:true,  pe:10,  fwdPe:9,  epsGrowth:5,  roe:12,  de:1.1, divYield:6.5, fcfYield:8.0, grossMargin:48, peg:2.00, price:54,   moat:'LatAm Banking Franchise' },
  { ticker:'BMO',   name:'Bank of Montreal',           sector:'Financials',            market:'CA', mktCap:'large', isBank:true,  pe:12,  fwdPe:11, epsGrowth:6,  roe:13,  de:1.0, divYield:4.8, fcfYield:7.0, grossMargin:48, peg:2.00, price:93,   moat:'Canadian Banking Oligopoly' },
  { ticker:'CM',    name:'CIBC',                       sector:'Financials',            market:'CA', mktCap:'large', isBank:true,  pe:11,  fwdPe:10, epsGrowth:6,  roe:14,  de:1.0, divYield:5.2, fcfYield:7.5, grossMargin:48, peg:1.83, price:63,   moat:'Canadian Banking Oligopoly' },
  { ticker:'MFC',   name:'Manulife Financial',         sector:'Financials',            market:'CA', mktCap:'large', isBank:true,  pe:10,  fwdPe:9,  epsGrowth:8,  roe:13,  de:1.0, divYield:4.5, fcfYield:7.0, grossMargin:40, peg:1.25, price:27,   moat:'Insurance Distribution Network' },
  { ticker:'SLF',   name:'Sun Life Financial',         sector:'Financials',            market:'CA', mktCap:'large', isBank:true,  pe:12,  fwdPe:11, epsGrowth:8,  roe:14,  de:0.8, divYield:4.0, fcfYield:6.5, grossMargin:42, peg:1.50, price:53,   moat:'Insurance Distribution Scale' },
  { ticker:'ATD',   name:'Alimentation Couche-Tard',   sector:'Consumer Staples',     market:'CA', mktCap:'large', isBank:false, pe:18,  fwdPe:16, epsGrowth:12, roe:28,  de:0.8, divYield:1.0, fcfYield:5.5, grossMargin:25, peg:1.50, price:50,   moat:'Convenience + Fuel Scale' },
  { ticker:'SHOP',  name:'Shopify',                    sector:'Technology',            market:'CA', mktCap:'large', isBank:false, pe:68,  fwdPe:52, epsGrowth:22, roe:12,  de:0.1, divYield:0.0, fcfYield:0.8, grossMargin:58, peg:3.09, price:107,  moat:'E-Commerce Platform' },
  { ticker:'TRP',   name:'TC Energy',                  sector:'Energy Infra',          market:'CA', mktCap:'large', isBank:false, pe:20,  fwdPe:18, epsGrowth:5,  roe:10,  de:1.5, divYield:7.0, fcfYield:4.5, grossMargin:35, peg:4.00, price:43,   moat:'Regulated Canadian Pipeline' },
  { ticker:'BAM',   name:'Brookfield Asset Management', sector:'Financials',           market:'CA', mktCap:'large', isBank:false, pe:28,  fwdPe:22, epsGrowth:20, roe:15,  de:0.8, divYield:3.0, fcfYield:2.5, grossMargin:60, peg:1.40, price:41,   moat:'Alternative Asset Management' },
  { ticker:'CP.TO', name:'Canadian Pacific Kansas City',sector:'Industrials',          market:'CA', mktCap:'large', isBank:false, pe:22,  fwdPe:18, epsGrowth:12, roe:14,  de:0.8, divYield:0.8, fcfYield:4.5, grossMargin:50, peg:1.83, price:74,   moat:'North American Rail Duopoly' },
  { ticker:'CNR.TO',name:'Canadian National Railway',  sector:'Industrials',           market:'CA', mktCap:'large', isBank:false, pe:20,  fwdPe:17, epsGrowth:10, roe:28,  de:0.8, divYield:2.0, fcfYield:5.0, grossMargin:55, peg:2.00, price:118,  moat:'North American Rail Duopoly' },
  { ticker:'TFII',  name:'TFI International',          sector:'Industrials',           market:'CA', mktCap:'mid',   isBank:false, pe:18,  fwdPe:15, epsGrowth:14, roe:22,  de:0.9, divYield:1.5, fcfYield:5.5, grossMargin:30, peg:1.29, price:111,  moat:'Trucking + Last Mile Scale' },
  { ticker:'WSP.TO',name:'WSP Global',                 sector:'Industrials',           market:'CA', mktCap:'mid',   isBank:false, pe:35,  fwdPe:28, epsGrowth:15, roe:12,  de:0.5, divYield:1.0, fcfYield:3.5, grossMargin:35, peg:2.33, price:170,  moat:'Global Engineering Consulting' },
];

// Auto-correct PEG = PE / epsGrowth if stored value is off by more than 0.05
let fixed = 0;
for (const s of STOCKS) {
  if (s.pe > 0 && s.epsGrowth > 0) {
    const correct = Math.round(s.pe / s.epsGrowth * 100) / 100;
    if (Math.abs(correct - s.peg) > 0.05) { s.peg = correct; fixed++; }
  }
}

const output = {
  lastUpdated: 'Jun 2026',
  note: 'Curated 97-stock universe. Live fundamentals refreshed daily at 6AM Vancouver via GitHub Actions. Moats are manually curated.',
  stocks: STOCKS,
};

writeFileSync(OUT, JSON.stringify(output, null, 2) + '\n');
console.log(`Written ${STOCKS.length} stocks. PEG corrections: ${fixed}.`);

// Final validation pass
let errors = 0;
for (const s of STOCKS) {
  if (!s.price || s.price <= 0)    { console.error(`NO PRICE: ${s.ticker}`); errors++; }
  if (!s.peg   || s.peg   <= 0)    { console.error(`NO PEG:   ${s.ticker}`); errors++; }
  if (!s.pe    || s.pe    <= 0)    { console.error(`NO PE:    ${s.ticker}`); errors++; }
  if (!s.moat  || !s.moat.length)  { console.error(`NO MOAT:  ${s.ticker}`); errors++; }
  if (!s.mktCap)                    { console.error(`NO CAP:   ${s.ticker}`); errors++; }
}
console.log(errors === 0 ? '✓ All validation checks passed.' : `${errors} validation errors.`);
