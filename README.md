# Personal academic website

Source for the personal site of Siddhant Manav Pagare, Research Assistant in the Department of Political Economy at King's College London.

Live site: https://smpagare.github.io/personal-site/

## Structure

| File | Purpose |
|------|---------|
| index.html | Home: introduction, at a glance facts, research highlights, writing, background, contact |
| research.html | Working papers, current projects, dissertation, research areas, code and data |
| writing.html | Commentary and policy writing, media coverage |
| resources.html | Public Goods: a filterable library of free resources for economics students and research assistants |
| 404.html | Not found page served by GitHub Pages |
| style.css | Design system: colour tokens (light and dark), typography, layout, components |
| site.js | Theme toggle, mobile menu, site search, filters, scroll reveal, contents bar, copy to clipboard |
| cv.pdf | Current curriculum vitae |
| photo-340 to photo-1000 (.jpg and .webp), og-image.jpg | Portrait at four widths for the hero srcset, and the social preview image |
| favicon.svg, favicon-32x32.png, apple-touch-icon.png | Site icons: SVG favicon, 32 pixel PNG fallback, iOS home screen icon |
| kcl-logo.svg | Department logo in the footer of the four main pages, linking to the department website |
| googled1384377132a171d.html | Google Search Console ownership verification, keep in the repository root |
| presentation.pdf | Dissertation slides, February 2026 |
| sitemap.xml, robots.txt | Search engine files |

## How it works

The site is static HTML, CSS and JavaScript with no build step. GitHub Pages serves the main branch from the repository root.

Site search needs no index file. On first use it fetches the four pages, reads every section with an id and every element carrying a data-index attribute, and searches titles, text and the keywords in data-index. Adding content to a page makes it searchable automatically.

## Updating content

1. New paper: add an article card inside the relevant section of research.html and, if it should appear on the home page, a matching card in index.html. Give it a data-index attribute with keywords.
2. New commentary or press coverage: add an entry in writing.html.
3. New link: add a link-item to the appropriate group in resources.html.
4. New CV: replace cv.pdf and update the month shown in the contact section of index.html.
5. New photo: crop to 4 by 5, then regenerate photo-340, photo-440, photo-680 and photo-1000 in JPEG and WebP, and og-image.jpg at 1200 by 630.
6. Bump the version query on style.css and site.js in every page if browsers cache old assets.

Prose on the site avoids hyphens and dashes; paper titles keep their published punctuation.

## Author

Siddhant Manav Pagare, siddhantpagare2014@gmail.com
