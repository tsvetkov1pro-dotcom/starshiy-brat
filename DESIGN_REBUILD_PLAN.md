# DESIGN REBUILD — GOLDEN MASTER

Status: mandatory execution plan
Reference: latest approved desktop screenshot supplied by the product owner

## Core rule
The approved screenshot is a Golden Master, not a moodboard. A visible deviation from its geometry, density, proportions, hierarchy or approved visual language is a defect unless explicitly approved.

## Prohibited previous workflow
The following approaches produced rejected results and MUST NOT be used in this rebuild:

- stacking new hotfix CSS over old layout CSS;
- retaining obsolete component geometry because it is already implemented;
- procedural SVG replacements for approved hero/logo/avatar/sphere graphics;
- interpreting the reference as an approximate visual direction;
- treating green CI or HTTP 200 as visual acceptance;
- deploying before side-by-side visual QA;
- keeping duplicate search UX implementations with divergent behaviour;
- using giant directory cards with mostly empty space;
- stretching low-resolution raster assets beyond their useful pixel size;
- patching defects with `!important`, `transition: all`, arbitrary absolute positioning or extra overlay layers.

## Phase 0 — Remove rejected visual stack
1. Stop importing `globals.css`, `hotfix.css`, and `qa-fixes.css` into the application shell.
2. Replace them with one clean Golden Master stylesheet.
3. Keep only functional TypeScript/data logic that is already verified: parser, IndexedDB, classification, search engine, recommendation engine, favorites and import.
4. Do not use procedural placeholder artwork when an approved asset exists.

Acceptance: one visual stylesheet is responsible for the application layout; no dependency on hotfix geometry.

## Phase 1 — Golden Master geometry
Desktop target: 1440×1024.

Required composition:
- sidebar approximately 228 px;
- main working area starts after sidebar and uses a centered max-width canvas;
- compact cinematic hero, not a full-screen banner;
- search bridge overlaps hero bottom edge and is almost as wide as the hero;
- row 1: compact self selector + four recommendations;
- row 2: single compact horizontal favorites strip;
- row 3: community spheres ~60–64% / similar challenges ~36–40%;
- six sphere tiles in a 3×2 grid with substantial image area;
- tight but breathable section gaps, matching the reference.

Acceptance: screenshot comparison shows matching macro proportions and no unexplained layers beneath hero/search.

## Phase 2 — Unified SmartSearch
One SearchBox component is used on home and `/find`.

Requirements:
- first click focuses the actual input;
- suggestions appear from the first meaningful character;
- same autocomplete behaviour on home and `/find`;
- keyboard navigation ArrowUp/ArrowDown/Enter/Escape;
- search by name and every textual profile field;
- Russian word-form normalisation and related concepts remain enabled;
- active query and related matched terms are highlighted in results and profile modal.

Acceptance: no second click needed, no ghost caret, same suggestions on both routes.

## Phase 3 — Approved assets
- hero: approved cinematic composition, displayed without stretching;
- sidebar logo: visible, crisp, transparent/clean on sidebar surface;
- avatars: equal circular crop, centered subject, consistent scale;
- community spheres: six approved visual categories, large enough to read and evaluate;
- no low-quality procedural substitutes.

Acceptance: no blurry oversized images, no off-center avatar crop, no missing logo.

## Phase 4 — Compact directories
Routes `/find`, `/brothers`, `/domains`, `/challenges` must use dense information cards rather than large empty tiles.

Profile/result cards:
- predictable height;
- avatar + name + compact metadata + useful excerpt/reason;
- long text and URLs cannot expand the grid;
- `overflow-wrap`, line clamp and ellipsis where appropriate;
- favorite action always reachable.

Acceptance: useful information occupies the card; empty-space ratio is not dominant.

## Phase 5 — Profile modal
Desktop: centered modal / substantial drawer with strong hierarchy.
Mobile: bottom sheet.

Priority blocks:
1. Чем занимается
2. Чем может быть полезен
3. Что сейчас важно / вызов
4. Цель на 90 дней
5. Telegram/contact
6. Full questionnaire

Search highlights persist inside the profile view.

## Phase 6 — Motion
Apply official Kowalski interaction principles only after geometry is correct:
- press `scale(.97)`;
- custom easing;
- no `transition: all`;
- dropdown 150–200 ms;
- cards 150–200 ms;
- modal 240–300 ms;
- hover only on fine pointers;
- reduced-motion support.

## Phase 7 — Visual QA gate
Mandatory screenshots:
- 1440×1024
- 1280×800
- 390×844

At 1440×1024 compare application screenshot beside Golden Master and inspect:
- sidebar width;
- logo visibility/size;
- hero width/height/crop;
- search width/overlap;
- recommendation density;
- favorites strip height;
- sphere/challenge width ratio;
- tile sizes;
- avatar centering;
- typography;
- spacing;
- unexpected backgrounds/overlays.

A green CI run is not visual approval.

## Phase 8 — Functional QA gate
Required scenarios:
- import Telegram HTML;
- choose self;
- refresh recommendations changes the set/order;
- favorite/unfavorite;
- search by exact name;
- search by raw-profile word;
- search by Russian word form;
- search by related term;
- autocomplete from first meaningful character;
- profile modal and ESC;
- active-term highlighting;
- no horizontal overflow;
- no critical console errors.

## Phase 9 — Deployment
Deploy only after phases 7 and 8 pass. Verify the actual live URL, not an artifact or old alias, before providing it to the product owner.
