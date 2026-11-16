# Bespoke Jewellery: "Rani & Marigold"

This is the design authority for the third Bespoke Jewellery demo. The content is the same as Website 1 and the look is completely different. It deliberately avoids:
- **Website 1:** ivory and velvet teal, an editorial serif with italics, pill buttons.
- **Website 2:** black and champagne, the wide Krona One typeface, the rings mark.

The idea is a festive Indian jewel box: saturated, warm, a little celebratory, and still calm enough to let the jewellery lead.

## Identity

- **Wordmark:** "BESPOKE JEWELLERY" in Bricolage Grotesque 800, condensed (75% width), with 0.08em tracking. It follows a small two-line arch icon in rani.
- **Signature shape:** the **jharokha arch**, a semicircular top on straight sides. It is used for:
  - photos (categories, products, occasion edits, atelier, bag thumbnails);
  - offer cards;
  - the empty state;
  - the button hover fill, which rises as an arch and flattens;
  - the phone menu, which drops as an arch;
  - the intro curtains;
  - the line-art arches drawn behind the hero.
- **Edges:** sections meet with **scalloped** edges, each drawn in the lower section's colour. They are small (16px) between light sections, larger (36px) above the occasions, and 22px above the footer.
- **Garland (toran):** a string of alternating marigold and rani beads under the header, shown once the page scrolls.

## Colour

| Token | Value | Use |
|---|---|---|
| `--cream` / `--cream-2` | `#FFF6EC` / `#FBE8D4` | Page, collection, atelier; bag footer and photo plates |
| `--blush` / `--blush-2` | `#F8D7E3` / `#F0BFD2` | Categories band, the first occasion edit; tracks and plates |
| `--rani` | `#C2185B` | Primary buttons (white text 5.9:1), emphasised words, focus rings |
| `--rani-deep` | `#9C1149` | Small accent text on light (7.6:1 on cream, 6.1:1 on blush), the second occasion edit |
| `--rani-soft` | `#E0457F` | Decorative only (petals, the footer gradient) |
| `--plum` / `--plum-2` | `#3B0A24` / `#521236` | Text, dark cards, the third occasion edit, footer |
| `--marigold` / `--marigold-soft` | `#F4A300` / `#FFD98A` | Accent on dark (8.0:1 on plum), offer figures, the filter marker, the highlighter |
| `--leaf` | `#1F5C4A` | WhatsApp "Ask" buttons and the floating chat button (white text 7.8:1) |
| `--ink-2` | `#6E3552` | Secondary text on light (8.6:1 on cream) |

**Rules:**
- Marigold is never used as text on light backgrounds.
- On the rani-deep edit, emphasis switches to `--marigold-soft`, and body text uses `#F6D3E2`.

## Type

- **Display:** Bricolage Grotesque (variable: weight 200–800, width 75–100%).
  - Headings are 800 weight at 75% width with tight leading (0.86–0.92).
  - Sizes:
    - hero `clamp(66px, 10.4vw, 168px)`
    - section titles `clamp(46px, 7vw, 104px)`
    - card names 32–50px
- **Emphasis inside a heading** (the `<em>`) switches to **300 weight at 100% width** in rani. The contrast stays inside one family, with no italics.
- **Body:** Figtree (variable 300–900), 16px, weight 450, 1.6 line height. Labels are 12px, 700 weight, uppercase, 0.14em tracking.
- **Outlined numerals:** the occasion numbers (01–03) are drawn with a 1.5px text stroke.
- **Files:** both fonts are self-hosted as Latin woff2 files.

## Shape, space, depth

- **Layout:** gutter `clamp(16px, 4vw, 48px)`, content max width 1320px, sections `clamp(80px, 10vw, 150px)` apart.
- **Radii:** arches are `999px 999px 14px 14px`. Buttons and controls are squared "tags" (6px), never pills. The bag panel is 18px (26px as a phone sheet).
- **Shadows:** one soft plum shadow (`--shadow`) for lifted cards, the offer deck and the bag.

## Motion

The page must work fully without motion. GSAP and ScrollTrigger drive scroll; the Web Animations and View Transitions APIs drive interface feedback. There is **no smooth-scroll library and no character splitting**.

| Where | What happens |
|---|---|
| Intro (once per session) | BESPOKE letters drop in, then plum and rani arch curtains lift away |
| Hero | Words rise from masks, the offer deck is dealt and fans open, the line-art arches draw themselves |
| Offers | The front card flies off to the left and joins the back of the deck. The discount counts up. The ring round the pause button is the 6.5s clock. |
| Header | Hides going down and returns going up. A marigold dot marks the current section. |
| Categories (desktop) | The section pins while the rail travels sideways. Cards settle from a tilt, and photos drift inside their arches. |
| Collection | Filtering glides cards to their new places (View Transitions). Cards settle in with a small turn. On hover, the arch opens into a rectangle. Saving bursts petals. Adding flies the photo into the bag, which shakes. |
| Occasions (desktop) | The section pins. Scrolling moves through the three edits, and snapping keeps one edit on screen at a time. Each new photo rises as an arch. The background moves from blush to rani-deep to plum. |
| Atelier | The arch grows in, the photo drifts, and a marigold highlighter draws behind each word. |
| Footer | The giant wordmark rises letter by letter. |
| Bag | A panel that unrolls from the bag button on desktop, a bottom sheet on phones |

**Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` for most arrivals, `expo.inOut` for reveals and pins.

**Reduced motion:** turns off all of it, including the offers autoplay (the pause button is then hidden).

## Photography

Photos sit inside arches on warm plates. The photo files are 300–813px wide, so the 300px ones are kept to category cards and one product. Photos never used:
- anything with a brand logo or baked-in text;
- `gifting.jpg`, `gold-coins.jpg`, `uncut-diamonds-*`, `under-50k-*`;
- the photos of models.
