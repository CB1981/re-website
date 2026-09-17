# Re. — website

The Re. landing page: a single-page site for the hospitality advisory, built as plain
HTML, CSS and JavaScript. No build step, no framework, no dependencies.

**Live at:** https://re-consultancy.me

---

## What's in here

```
index.html            The whole site — home, contact page, intake page
404.html              Branded not-found page
assets/css/           styles.css (the design system), fonts.css (@font-face)
assets/js/site.js     Page routing, contact form, branching intake questionnaire
assets/fonts/         Poppins + Inter, self-hosted (Latin + Latin-Ext subsets)
assets/img/           Photography, favicon, social share image
CNAME                 Custom domain for GitHub Pages
.github/workflows/    Publishes the site on every push to main
design/               The original Claude Design handoff — not published
```

`design/` holds the source design files, the brand document and the full design
conversation. It stays in the repository as a record but is deliberately excluded
from the published site.

## How it works

The site is one HTML file with three views — **home**, **contact** and **intake** —
switched in the browser rather than served as separate pages. `#contact` and
`#intake` are deep-linkable, so you can send someone straight to either.

Design tokens live as CSS custom properties at the top of `styles.css`:

| Token | Value | Use |
| --- | --- | --- |
| `--forest` | `#1B2E27` | Dark ground, buttons, body text |
| `--ivory` | `#F6F2EA` | Page ground, type on dark |
| `--gold` | `#D4AF37` | The dot, accents, progress bar |
| `--sage` | `#3E5248` | Secondary text on light |
| `--stone` | `#C8C0B0` | Secondary text on dark |

Type is Poppins (900 for display, 600 for subheads) and Inter for everything else.

## Forms

Both forms POST JSON to [Formspree](https://formspree.io); submissions arrive by
email at Hello@re-consultancy.me and in the Formspree dashboard.

| Form | Endpoint |
| --- | --- |
| Contact | `https://formspree.io/f/xppwayoj` |
| Intake | `https://formspree.io/f/xkjgwqpq` |

If a request fails the form shows a fallback asking the visitor to email instead.
The endpoints are in `ENDPOINTS` at the top of `assets/js/site.js`.

> The first submission on each form triggers a one-time confirmation email from
> Formspree — click the link in it and the rest flow through.

## Editing the content

Almost everything is plain text in `index.html`. The two exceptions live in
`assets/js/site.js`:

- **Intake questions** — `PATHS` (the four entry paths) and `BRANCHES` (the
  questions each path asks). Adding a question is one object in the right array.
- **Contact form chips** — venue type, outlets and preferred contact are in
  `index.html` as `<button class="chip">` elements.

To swap a photo, drop the new file into `assets/img/` and update the `src`,
`width` and `height` on that `<img>` in `index.html`.

## Running it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly from the file system also works, though the fonts
load more reliably over HTTP.

## Deploying

Every push to `main` triggers `.github/workflows/deploy.yml`, which assembles the
site and publishes it to GitHub Pages. Nothing to build and nothing to install.

**First-time setup:** in **Settings → Pages**, set *Source* to **GitHub Actions**.

**DNS for re-consultancy.me** — at your domain registrar, create:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `<your-github-username>.github.io` |

DNS takes anywhere from a few minutes to a few hours. Once it resolves, tick
**Enforce HTTPS** in Settings → Pages.

---

© 2026 Re. LLC · Abu Dhabi · Rethink. Rebuild. Perform.
