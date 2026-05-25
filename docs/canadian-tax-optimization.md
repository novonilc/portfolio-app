# TFSA vs RRSP Optimization

The single highest-impact decision a Canadian investor can make is placing the right security in the right account. This guide explains the rules, the math, and the practical framework the app uses.

---

## The core rule

| Account | US dividends | Canadian dividends | Capital gains |
|---|---|---|---|
| TFSA | 15% IRS withholding — gone forever | Tax-free | Tax-free |
| RRSP | 0% withholding (Canada-US treaty) | Taxed as income on withdrawal | Taxed as income on withdrawal |

The key insight: **US dividends belong in RRSP**. Canadian dividends and growth stocks belong in TFSA.

---

## Withholding tax (WHT) — why it matters

When a US company pays a dividend to a Canadian investor holding in a TFSA, the IRS deducts 15% at source. This is called withholding tax. Example:

```
MSFT pays $1.00 dividend
15% withheld = $0.15 goes to IRS
You receive = $0.85
```

You cannot claim this back. It is not a foreign tax credit in a registered account. It is permanent dead money.

The same dividend in an **RRSP** is exempt under Article XXI of the Canada-US Income Tax Convention. You receive the full $1.00.

### Annual drag calculation

The app estimates your WHT drag as:

```
WHT drag = Σ (market_value × dividend_yield × 0.15)
```

for all US-listed, non-CAD-exempt holdings in your TFSA.

On a $100,000 TFSA with an average 1.5% yield:

```
$100,000 × 0.015 × 0.15 = $225/year lost to IRS
```

Over 20 years, compounded at 8%: **~$10,000 in lost growth**.

---

## The placement framework

### Hold in TFSA

| Security type | Why |
|---|---|
| US growth stocks paying no dividend | All gains 100% tax-free; no WHT drag |
| Canadian-listed ETFs (XEQT, ZCN, XIU) | Canadian dividends, no US WHT |
| Canadian dividend stocks (CNQ, ENB) | Canadian dividends attract no US WHT |
| Bitcoin/crypto ETFs (BTCC) | No dividends; speculative gains tax-free |
| CAD-denominated precious metals (GOLD) | No WHT; inflation hedge |

### Hold in RRSP

| Security type | Why |
|---|---|
| US-listed dividend ETFs (VTI, VXUS, QQQM) | 0% WHT; high tax efficiency |
| US dividend-paying stocks (MSFT, AVGO, TSM) | Treaty exemption eliminates WHT |
| Long-duration bonds (TLT, SGOV) | Interest income sheltered from full marginal rate |
| US REITs (O, VNQ) | High dividend yield = highest WHT savings |
| Balanced ETFs blending US dividends | Shelter the income component |

### Either account works

| Security type | Notes |
|---|---|
| Pure growth stocks (NVDA, AMZN) with no dividend | No WHT either way; TFSA preferred for tax-free gains |
| Short-duration bond parking (HISA, SGOV) | RRSP preferred (interest income sheltered) |

---

## CAD-exempt securities

The following Canadian-listed securities are **exempt from US withholding tax regardless of account** because they are not US-listed and do not distribute US-source income:

```
CNQ, XIU, XIU.TO, VFV.TO, BTCC, GOLD, ZAG.TO, XRE.TO, XEG.TO, ZCN.TO
```

These can be held in either TFSA or RRSP — but TFSA is usually better for them because capital gains are tax-free in TFSA and there is no tax friction from dividends.

To add more CAD-exempt tickers, edit the `CAD_EXEMPT` set in `src/App.jsx` (around line 104).

---

## Worked examples from the sample portfolio

### NVDA — correct in TFSA

NVIDIA pays a $0.01 quarterly dividend ($0.04/yr) on a ~$200 stock — a 0.02% yield. WHT on this is negligible. The stock is primarily a growth story. Holding in TFSA means all capital gains are tax-free. **Correct placement.**

### AVGO — correct in RRSP

Broadcom pays ~1.2% dividend. On a $2,000 position that's $24/yr in dividends. Without treaty protection: $3.60/yr lost to WHT. In RRSP: $0 WHT. Marginal benefit, but scales up as the position grows. **RRSP is correct.**

### RTX — should be in RRSP

RTX Corp pays ~2.1% dividend. On a $4,600 position: ~$97/yr in dividends. WHT in TFSA: $14.50/yr. Moving to RRSP saves that permanently. The app flags this in the WHT Alert section of the Rebalance tab.

### SGOV — correct in RRSP

A 0–3 month T-bill ETF paying ~5% interest. In TFSA: 15% WHT on the interest = $75/yr loss on a $10,000 position. In RRSP: $0 WHT, and interest is sheltered from marginal tax until withdrawal. **RRSP is strictly better.**

### ZEQT — correct in TFSA

BMO All-Equity ETF (Canadian-listed). No US WHT. Canadian dividends taxed favourably anyway. Gains are tax-free in TFSA. **TFSA is correct.**

---

## How the app enforces this

### WHT Alert (Rebalance tab)

The orange "WHT Alert" banner appears above the rebalance table whenever your active account (TFSA) contains US-listed dividend payers. It shows:

- Which positions are causing the drag
- Annual WHT cost per position (at 15% of dividend income)
- Total annual drag across all flagged positions

### Dashboard WHT card

The Portfolio Health section shows the total WHT drag across both accounts and the amount you would recover by moving the worst offenders to RRSP.

### Ideas tab placement badge

Every recommendation in the Ideas tab has a **Best for: TFSA / RRSP / Either** badge. This is the most direct placement guidance — check it before adding any new position.

### Broker import targeting

When you use **🏦 Import from Broker**, Claude automatically assigns lower targets to US dividend payers in TFSA and higher targets to them in RRSP — implementing this framework automatically as a starting point for your review.

---

## The WHT recovery workflow

If the Dashboard is showing significant WHT drag, here's the step-by-step recovery:

1. **Identify the offenders** — check the WHT Alert in the Rebalance tab (TFSA selected)
2. **Check RRSP room** — confirm you have enough RRSP contribution room for the transfer
3. **Transfer in-kind** — most brokers (Wealthsimple, Questrade, RBC DI) support transferring securities between registered accounts without selling. This avoids triggering capital gains.
4. **Update the app** — go to Edit Targets, reduce the position's value in TFSA and add/increase it in RRSP
5. **Rebalance** — set targets in RRSP to accommodate the new position

An in-kind transfer to RRSP is treated as a contribution at fair market value on the date of transfer. Consult your broker's specific process and ensure you have the contribution room.

---

## Contribution limits (2026)

| Account | 2026 annual limit |
|---|---|
| TFSA | C$7,000 |
| RRSP | 18% of 2025 earned income, max C$32,490 |

TFSA limits are cumulative since 2009 if you've never contributed. If you turned 18 in 2009 or earlier and have never opened a TFSA, your total room as of 2026 is C$95,000.

Check your personal limits at [My Account — CRA](https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-individuals/account-individuals.html).
