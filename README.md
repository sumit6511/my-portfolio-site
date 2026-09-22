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

### Design

- Dark, near-black surfaces with one indigo accent (`--accent`), thin borders and a light grain.
- Typography: [Manrope](https://fonts.google.com/specimen/Manrope) for display and body, [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) for labels and metadata.
- Motion is limited to scroll reveals, hover states and the hero dot lattice. Everything respects `prefers-reduced-motion` and the page reads fully with JavaScript disabled.
- All design tokens live at the top of `css/style.css`.

### Behaviour (`js/script.js`)

- Sticky header with elevated state, active-section indicator, mobile overlay menu.
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

## Structure

```
my-portfolio-site/
├── index.html
├── resources.html
├── about.html · projects.html · contact.html   # redirects
├── 404.html               # branded not-found page (GitHub Pages picks it up)
├── css/style.css
├── fonts/                 # self-hosted Manrope + JetBrains Mono (variable woff2)
├── js/script.js
├── images/
│   ├── covers/            # project cover illustrations (SVG)
│   ├── og.png             # social sharing image
│   ├── profile.jpg
│   ├── ims.jpg
│   └── todo_app_cover.jpg
├── favicon.svg · favicon-32.png · apple-touch-icon.png
├── v2/                    # archived previous version (git tag v2.0)
├── robots.txt · sitemap.xml · CNAME
└── README.md
```

## Contact

Sumit Sah — [sumitsah6511@gmail.com](mailto:sumitsah6511@gmail.com) · [GitHub](https://github.com/sumit6511) · [LinkedIn](https://linkedin.com/in/sumit-sah-9930bb300)
