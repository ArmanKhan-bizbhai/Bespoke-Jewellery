# Jewellery_Website3

**Bespoke Jewellery, "Rani & Marigold"** is the third Bespoke Jewellery demo site by BizBhai. It has the same content as `Jewellery_Website1`: festive offers, categories, a six-piece collection, occasion edits and the atelier. The look is new: rani pink, plum and marigold, a condensed display face, and the jharokha arch as the recurring shape.

It is a plain static site, with no build step and no server code.

## Run it locally

Open `index.html` in a browser. Or serve the folder so that saved pieces and the bag behave exactly as they will online:

```sh
npx http-server . -p 8080
```

## Deploy (Hostinger)

Point the site at this repository's `main` branch with the **repository root as `public_html`**. `index.html` sits at the root, so nothing needs to be built or installed.

## What's where

| Path | Contents |
|---|---|
| `index.html` | Every section, the icon sprite, and the arch artwork |
| `assets/css/site.css` | Colours and sizes as variables at the top, then layout, components, motion states and fallbacks |
| `assets/js/site.js` | The menu, search and filters, saved pieces, bag, offers deck and occasion edits, plus the motion layer |
| `assets/vendor/` | GSAP and ScrollTrigger |
| `assets/fonts/` | Bricolage Grotesque and Figtree (SIL OFL, see `OFL.txt`) |
| `assets/images/` | The 18 photos the page uses |
| `DESIGN.md` | Colour, type, shape and motion rules |

## Things to change for a real client

- **WhatsApp number:** replace `910000000000` in `assets/js/site.js` (`WHATSAPP_NUMBER`) **and** in the `href`s in `index.html`. The footer also shows `+91 00000 00000`.
- **Brand name:** "Bespoke Jewellery" appears in the copy, the WhatsApp messages and the footer wordmark.
- **Photos:** the photos are placeholders taken from a retailer's site and are **not licensed**. Replace them before any public or commercial use.

## Behaviour notes

- **Saved pieces and the bag** are stored in the visitor's browser (`localStorage`). There are no prices, orders or checkout: the bag sends its list to WhatsApp.
- **Motion** (GSAP, ScrollTrigger, the View Transitions API):
  - It switches off completely when the visitor has reduced motion turned on.
  - If the scripts don't load, every section still shows, and the offers and edits are laid out in the open.
- **The intro curtain** plays once per browser session.
