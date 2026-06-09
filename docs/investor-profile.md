# Investor Profile

The Investor Profile is a short questionnaire that tells the app's AI features who you are. Without a profile, every AI request returns generic advice for a hypothetical Canadian investor. With a profile, Claude adjusts sector weightings, position sizing, account placement guidance, and option trade risk levels to match your actual age, timeline, goal, and risk appetite.

> **Plan availability:** The Investor Profile questionnaire is available on both Basic and Pro plans. However, the AI features it personalises (Market Pulse refresh, AI Target Suggestions, AI Diversification Analysis, AI Options Analysis, AI Advisor) require the **Pro plan**.

---

## Before you begin

Read the **📖 Help tab** in the app — the "TFSA vs RRSP" and "Best practices" sections explain the context behind the risk tolerance choices below.

## Setting up your profile

Click **👤 Set Profile** in the header toolbar (top-right area of the app). A modal opens with five fields. Fill them in once — answers are saved to `localStorage` immediately and persist across sessions.

| Field | Input | Notes |
|---|---|---|
| Current age | Number | Used to calculate years to retirement |
| Target retirement age | Number | Default is 65 |
| Risk tolerance | Option card | Conservative / Balanced / Growth / Aggressive |
| Primary investment goal | Option card | Retirement income / Wealth accumulation / Dividend income / Capital preservation |
| Monthly contribution capacity | CAD amount | How much you invest each month; used to personalise DCA and growth suggestions |

After saving, the button in the header updates to a compact chip — e.g. `👤 38yr · growth` — so the active profile is always visible. Click the chip at any time to re-open the questionnaire pre-filled with your current answers. To clear the profile entirely, close the modal without saving after blanking the fields.

---

## Risk tolerance levels

### Conservative

**Who it's for:** Investors close to retirement (typically within 5–10 years), those who cannot tolerate significant drawdowns, or anyone whose primary need is capital preservation.

**What changes in AI output:**
- Diversification suggestions weight bonds, GICs, and Canadian dividend payers over growth equities
- Target % suggestions cap individual growth positions at lower levels
- Options AI Analysis returns **Low-risk trades only** (far out-of-the-money calls and puts with short DTE)
- Market Pulse action cards with High-priority Buy signals are contextualised with a conservative note

### Balanced

**Who it's for:** Investors 10–20 years from retirement or anyone comfortable with moderate portfolio swings in exchange for reasonable growth.

**What changes in AI output:**
- Suggestions blend growth equities with dividend income and bond exposure
- Options AI Analysis returns Low and Medium-risk trades; High-risk trades are omitted
- TFSA/RRSP placement guidance balances WHT savings with growth potential

### Growth

**Who it's for:** Investors with a long time horizon (20+ years) or a high capacity to absorb drawdowns in exchange for maximum compounding.

**What changes in AI output:**
- Diversification suggestions weight tech, AI, and high-CAGR names
- Lower bond/defensive allocations in target suggestions
- Options AI Analysis returns all risk levels (Low, Medium, High)
- Ideas tab highlights high-conviction growth names prominently

### Aggressive

**Who it's for:** Experienced investors who understand the risks of concentrated positions and are explicitly seeking maximum wealth accumulation, accepting that a bad year could mean a 30–50% drawdown.

**What changes in AI output:**
- AI freely suggests concentrated single-stock positions and sector concentration
- No minimum defensive floor in diversification suggestions
- Options AI Analysis includes High-risk trades (near-the-money, longer DTE, concentrated positions)
- Conviction-level sizing advice uses the upper end of ranges (12–18% per core position)

---

## Primary investment goals

| Goal | What it means |
|---|---|
| Retirement income | AI emphasises income stability: dividend growth stocks, bond ladders, RRSP optimisation for tax-deferred growth |
| Wealth accumulation | AI emphasises total return: high-CAGR equities, reinvested dividends, minimal defensive drag |
| Dividend income | AI emphasises current yield: high-yielding Canadian and US dividend payers, covered-call premium income, WHT minimisation |
| Capital preservation | AI emphasises stability: broad diversification, short-duration bonds, minimal single-stock risk |

---

## How the profile is injected into AI prompts

The profile is formatted into a block labelled `INVESTOR PROFILE:` and prepended to every AI request:

```
INVESTOR PROFILE:
- Age: 38 (27 years to retirement at age 65)
- Risk tolerance: Growth — maximise long-term wealth, comfortable with significant volatility
- Primary goal: Maximising long-term wealth accumulation
- Monthly contribution capacity: C$1,000
```

This block appears before the portfolio holdings data in all AI features:

- **AI Diversification Analysis** — Claude uses the profile to weight which gaps matter most and which existing positions to flag for trimming
- **AI Target Suggestions** — Claude adjusts the allocation split between growth and income/defensive positions
- **AI Options Analysis** — Claude filters trade risk levels and adjusts DTE/strike distance to match the stated tolerance
- **AI Advisor** — all 10 templates prepend the profile block before injecting portfolio context, so every analysis is calibrated to your age, timeline, and risk level from the start

---

## Worked examples

### Example 1 — Conservative, age 58, retirement income

**Without profile:** Claude suggests NVDA at 15%, AMZN at 12%, standard growth-heavy allocation.

**With profile:** Claude caps individual growth positions at 8%, suggests increasing SGOV and ENB weighting, flags NVDA as overweight for an income-focused investor near retirement, and limits options suggestions to covered calls on existing positions 20% out-of-the-money.

---

### Example 2 — Growth, age 34, wealth accumulation

**Without profile:** Claude applies balanced defaults, hedges toward defensive coverage.

**With profile:** Claude recommends concentrating 60%+ of TFSA in high-CAGR names, suggests underweighting bonds until within 10 years of retirement, and returns Medium and High-risk options trades (e.g. 10-delta CSPs on NVDA dips as a lower-cost entry strategy).

---

## Updating your profile

Click the profile chip in the header (`👤 38yr · growth`) at any time. The questionnaire opens with your current answers. Change any field and click **Save Profile** — changes apply immediately to the next AI request.

Your profile does not affect the rebalance calculations, DCA schedule, or WHT analysis — those are purely mathematical. It only affects the three AI features and the Ideas tab presentation.
