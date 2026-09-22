# sumit-sah.com.np

Personal website of Sumit Sah — Computer Science student (B.Sc. CSIT, St. Xavier's College, Kathmandu) building web applications and machine-learning projects.

**Live:** [www.sumit-sah.com.np](https://www.sumit-sah.com.np)

## What's here

A single editorial page plus a resources page, built with plain HTML, CSS and JavaScript — no framework, no build step.

| Page | Contents |
| --- | --- |
| `index.html` | Hero → Selected work (featured project, bento cards, compact list, GitHub strip) → About → Stack → Journey → Contact → Footer |
| `resources.html` | Curated courses, books, tools and websites, plus a "recommend a resource" form |
| `about.html`, `projects.html`, `contact.html` | Redirect stubs for the old multi-page URLs (`/#about`, `/#work`, `/#contact`) |
| `v2/` | The previous version of the site, kept browsable at [/v2/](https://www.sumit-sah.com.np/v2/) (`noindex`). Also tagged `v2.0` in git. |
| `v4/` | An alternative **Neo-Brutalist** design of the same content, browsable at [/v4/](https://www.sumit-sah.com.np/v4/) (`noindex`). Same projects, links and forms; its own `v4/css/style.css` and `v4/js/script.js`. |

In `v4/`, the stack is three drifting rows of tech marks. Brand icons come from [Simple Icons](https://simpleicons.org) (CC0; trademarks belong to their owners) and the concepts without a logo — RAG, embeddings, data structures and so on — use glyphs drawn for this site. Both live in an inline sprite as `<symbol id="t-…">`; `ICONS` in the page generator maps each label to one. Rows pause on hover and on keyboard focus, and wrap into a static grid when motion is reduced or JS is off.

### Design

The site ships two complete designs over one set of content:

| | `/` (v3, live) | `/v4/` (alternative) |
| --- | --- | --- |
| Direction | Dark editorial + bento | Neo-brutalist editorial poster |
| Surface | Near-black, thin borders, soft grain | Warm paper, 3px ink borders, hard offset shadows |
| Accent | One indigo | Yellow / coral / blue / mint, used structurally |
| Type | Manrope + JetBrains Mono | Archivo Black + Space Grotesk + JetBrains Mono |

Both share `/images`, `/fonts`, the Formspree endpoint and the same project data.

**Switching between them.** Every page with a header carries a `.vswitch` control — in the header on desktop, and as a full-width row in the mobile menu, since the header copy is hidden below the nav breakpoint. Both copies are plain relative links (`index.html` ↔ `v4/index.html`, `resources.html` ↔ `v4/resources.html`), so they work with JavaScript off and when the repo is opened from disk; when the site is actually served, `sync()` rewrites them to the clean `/` and `/v4/` URLs. With JS on, `initVersionSwitch()` appends the section you are currently reading, so switching halfway down the page lands on the same section in the other design. It reads the section from the DOM at the moment the link is used rather than from the scroll-spy, which can lag a frame behind a jump. The ids it may use are taken from the nav's own hrefs, so it can only ever point at a section that exists in both designs.

To add a third design, give it a directory, add an option to the `.vswitch` group on every page (the `data-to` attribute is the target; `aria-current="page"` marks the one you are on) and style `.vswitch` in that design's stylesheet.

- Dark, near-black surfaces with one indigo accent (`--accent`), thin borders and a light grain.
- Typography: [Manrope](https://fonts.google.com/specimen/Manrope) for display and body, [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) for labels and metadata.
- Motion is limited to scroll reveals, hover states and the hero dot lattice. Everything respects `prefers-reduced-motion` and the page reads fully with JavaScript disabled.
- All design tokens live at the top of `css/style.css`.

### Behaviour (`js/script.js`)

- Sticky header with elevated state, active-section indicator, mobile overlay menu.
- Design switcher (`initVersionSwitch`): carries the current section across to the other design.
- Hero dot lattice on a `<canvas>` (pointer-aware; static under reduced motion).
- Case-study `<dialog>` filled from each project card and its `<template class="project__detail">`.
- Contact and recommendation forms post to Formspree (`FORMSPREE_ENDPOINT`); both also work as plain HTML form posts.
- GitHub strip: static links, progressively annotated with language and last push from the public GitHub API (one request, cached in `sessionStorage`, silent on failure, no token).

## Editing content

- **Projects:** each project is one `<article class="project …">` in `index.html`. The card holds the summary; the `<template class="project__detail">` inside it holds the case-study copy and facts. Covers live in `images/covers/`.
- **Journey:** copy an `<li>` in the `#journey` list. `.timeline__when` takes a year, season or label; add `timeline__item--now` to the current entry.
- **Stack:** pills in the `#stack` groups.
- **Resources:** cards in `resources.html`.
- **Social preview:** `images/og.png` (1200×630). Favicons: `favicon.svg` (source), `favicon-32.png`, `apple-touch-icon.png`.

## Content slots ready to fill

- **Résumé:** save it as `cv/sumit-sah-cv.pdf`, then uncomment the two `Résumé` links (hero meta row and footer) in `index.html`.
- **Screenshots:** put images in `images/screens/` and add a `<section class="case-study__gallery">` inside a project's `<template class="project__detail">` — there is a commented example in the VoxTube card. One figure spans the dialog; several form a grid.
- **Journey dates / roles:** copy an `<li>` in `#journey`; the commented example shows a dated internship entry.
- **Stack counts:** the number on a Stack pill is computed from the cards' `.project__stack` lists. A pill whose label differs from how cards name the tech carries `data-match="alias|alias"`.

## Running locally

```bash
python -m http.server 8000
# then open http://localhost:8000
```

Any static server works. The site is deployed with GitHub Pages using the custom domain in `CNAME`.

Every link and asset path in the pages is **relative**, so you can also just open `index.html` from the file manager and click through the whole site, `/v4/` included. One caveat: browsers refuse to load `@font-face` files over `file://` (CORS), so opened that way the pages fall back to system fonts. Use the server above to see the real typography. `404.html` is the deliberate exception — it keeps absolute paths, because GitHub Pages serves it from whatever URL was missed.

## Structure

```
my-portfolio-site/
├── index.html
├── resources.html
├── about.html · projects.html · contact.html   # redirects
├── 404.html               # branded not-found page (GitHub Pages picks it up)
├── css/style.css
├── fonts/                 # self-hosted woff2: Manrope, Space Grotesk, Archivo Black, JetBrains Mono
├── js/script.js
├── images/
│   ├── covers/            # project cover illustrations (SVG)
│   ├── og.png             # social sharing image
│   ├── profile.jpg
│   ├── ims.jpg
│   └── todo_app_cover.jpg
├── favicon.svg · favicon-32.png · apple-touch-icon.png
├── v2/                    # archived previous version (git tag v2.0)
├── v4/                    # alternative neo-brutalist design (same content)
├── robots.txt · sitemap.xml · CNAME
└── README.md
```

## Contact

Sumit Sah — [sumitsah6511@gmail.com](mailto:sumitsah6511@gmail.com) · [GitHub](https://github.com/sumit6511) · [LinkedIn](https://linkedin.com/in/sumit-sah-9930bb300)
