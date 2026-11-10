# Home Cafe menu

A chalkboard-style drinks menu for the home coffee bar. Everything on it comes from one file, [`menu.yml`](menu.yml).

## Everyday edits

All of these happen in `menu.yml`. Save, commit and push; the live menu updates in about a minute.

**Mark something as out**: add it under `out:`. It shows faded on the menu with the same text.

```yaml
out:
  - Oat          # oat milk fades everywhere it's offered
  - Cortado      # just this drink fades
  - Coffee       # every drink that needs coffee fades
```

Remove the line when it's back in stock. A latte also fades by itself if every milk is out, because milk is `required` for it.

**Add a drink**: copy a drink block inside the right section and change it.

```yaml
      - name: Mocha
        description: Espresso, chocolate and steamed milk.
        temps: [hot, iced]
        options:
          milk: required
```

**Add a new option** (toppings, syrups, an extra shot…): define it once under `options:`, then offer it.

```yaml
options:
  toppings:
    label: Toppings
    choices: [Whipped cream, Cinnamon, Cocoa]
```

Offer it to a whole section:

```yaml
  - name: Espresso
    options:
      toppings: optional
```

…or to one drink (`toppings: optional` under that drink's `options:`). Use `required` when the drink can't be made without picking one, and `none` to turn off a section's option for a single drink.

**Hide a drink without deleting it**: add `hidden: true`.

## Preview on your computer

With Docker:

```sh
docker compose up                   # menu at http://localhost:8080
docker compose run --rm validate    # check menu.yml for mistakes
```

With Node instead: `npm run validate`, and any static server for the preview (`npx serve .`). Opening `index.html` directly from disk won't work, because browsers block loading `menu.yml` from a `file://` page.

## How publishing works

On every push to `main`, GitHub Actions ([`.github/workflows/pages.yml`](.github/workflows/pages.yml)):

1. **Checks `menu.yml`** with `scripts/validate.mjs`: valid YAML, every option a drink uses is defined, `required`/`optional`/`none` spelled right. It also warns about unknown fields and `out:` names that don't match anything.
2. **Publishes** the site to GitHub Pages, but only if the check passed. A broken edit leaves the current menu live, and GitHub emails you the error.

## First-time setup

1. Create a **public** repository on GitHub (free accounts need public repos for Pages) and push this folder to `main`.
2. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push (or run the workflow from the **Actions** tab). The site appears at `https://<username>.github.io/<repo>/`.

### Your own domain

A subdomain like `menu.yourdomain.com` is simplest:

1. In your GitHub **account** settings → **Pages**, add and verify the domain (protects it from being claimed by someone else).
2. At your DNS provider, add `CNAME  menu  →  <username>.github.io`.
3. Repo → **Settings → Pages → Custom domain**: enter `menu.yourdomain.com` and save.
4. Tick **Enforce HTTPS** once it's offered (can take up to a day).

For the bare domain (`yourdomain.com`) use four `A` records instead: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Don't use wildcard DNS records for GitHub Pages.

Print a QR code of the final URL and put it on the bar.

## Files

| Path | What it is |
|---|---|
| `menu.yml` | The menu. The only file you normally edit. |
| `index.html` | Page shell |
| `assets/menu.js` | Menu rules: shared options, out-of-stock fading. Used by the page and the checker. |
| `assets/app.js` | Draws the menu on the page |
| `assets/styles.css` | Chalkboard look |
| `assets/fonts/` | Fredericka the Great and Patrick Hand (SIL Open Font License) |
| `assets/vendor/js-yaml.js` | YAML reader (MIT License) |
| `scripts/validate.mjs` | The checker |
| `docker-compose.yml` | Local preview and checker |
| `PLAN.md` | Project plan and ideas for later |
