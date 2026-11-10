# Home Cafe Menu — Project Plan (v3)

A chalkboard-style, data-driven drinks menu for the home coffee bar, served from GitHub Pages on your own domain.
How to edit and publish lives in [README.md](README.md); this file tracks decisions and what's next.

---

## Decisions

| Topic | Decision |
|---|---|
| Name | Home Cafe |
| Editing | One file in the repo: `menu.yml` (no Google Sheet) |
| Beans | One coffee; drinks just `need` Coffee, no bean choice |
| Composition | Options are defined once (`options:`) and offered per section or per drink as `required` / `optional` / `none` |
| Shared options | Options every drink in a section offers are written once under the section heading |
| Out of stock | Listed under `out:`; drinks and choices fade (half-erased chalk), text unchanged, "(out today)" for screen readers |
| Required + all out | A drink whose required option has no choices left fades too (a latte with every milk out) |
| Look | Chalkboard: slate board with chalk dust and smudges, wooden frame, Fredericka the Great + Patrick Hand, a chalk color per section, cup drawn in chalk on load |
| Audience | Guests on phones via your domain (QR code at the bar) |
| Hosting | GitHub Pages (public repo), deployed by GitHub Actions after `menu.yml` passes the checker |

## How it fits together

```
menu.yml ──▶ assets/menu.js (rules) ──▶ assets/app.js (draws the board)
                    │
                    └──▶ scripts/validate.mjs (same rules) ──▶ GitHub Actions: check → publish
```

The page and the checker share `menu.js`, so whatever passes the check is exactly what the page draws.

## Status

### Done
- [x] `menu.yml` with starter drinks: Espresso, Americano, Cortado, Flat White, Cappuccino, Latte, French Press, Pot of Tea, Iced Tea, Tea Latte
- [x] Options: Milk, Sweetener, Extras (extra shot), Tea
- [x] Menu rules + checker (typos, unknown options, bad indentation, `out:` names that match nothing)
- [x] Chalkboard page, phone-first, two columns on wide screens, print style
- [x] Docker preview + checker (`docker compose up`, `docker compose run --rm validate`)
- [x] GitHub Actions workflow: check → publish

### Next (you)
- [ ] `git init`, create a **public** GitHub repo, push to `main`
- [ ] Settings → Pages → Source: **GitHub Actions**
- [ ] Domain: verify it in account settings, add the DNS record, set the custom domain, enforce HTTPS (README has the steps)
- [ ] Fill in the rest of the menu: more drinks, your real milks, syrups and teas
- [ ] Print a QR code for the bar

## Ideas for later

- Filters on the page: hot, iced, caffeine-free, dairy-free (would need `caffeine:` / `dairy:` fields)
- Seasonal drinks with start and end dates
- A "house favorite" mark on a drink
- Choices with a short note (e.g. Honey: "local")
- Photos per drink
- "Ask for this" button that opens a prefilled text message
