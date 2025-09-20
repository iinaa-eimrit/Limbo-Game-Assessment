# Limbo Game (Assessment)

A lightweight **frontend-only** Limbo game that matches the assignment:

- Enter **Bet Amount** and **Target Multiplier**
- Click **Place Bet**
- Watch the multiplier animate from **1.00×**
- **Win** if target is reached before a hidden **crash** value, otherwise **Lose**
- Shows **payout** on win and history of recent crash values

> Demo/learning project — no real-money gambling.

---

## Features

- Smooth counter animation (`requestAnimationFrame`)
- Hidden crash RNG each round
- Win/Loss result with payout = **bet × target**
- History of last 5 crash multipliers
- Simple, local simulation (no backend)

---

## Tech

- React + TypeScript (Vite)
- Tailwind CSS (styling)
- lucide-react (icons)

---

## Setup

**Requirements:** Node 18+ and npm

```bash
# install
npm i

# run dev server
npm run dev
# open the printed URL

# build for production
npm run build

# preview the production build
npm run preview
```
---

## How to Play

1. Enter a **Bet Amount** (> 0).
2. Enter a **Target Multiplier** (e.g., **1.50** or **2.00**; minimum **1.01**).
3. Click **Place Bet**.
4. The counter increases from **1.00×**:
   - If it reaches your **target** first → **You win** (payout shown).
   - If it hits the **crash** first → **You lose**.
5. Recent crash values appear in the **History** section.

---

## Notes

- Results are computed in a **frame-rate independent** way for fairness.
- The displayed number **snaps** to the exact **target/crash** at round end.
- This is a **local simulation** only; no backend or persistence.
