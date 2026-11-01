---
name: website-design
description: "Start here for any new page, redesign, restyle or visual direction. Gathers the design inputs in a fixed order (the human's references and documents, then an awesome-design-md base, then taste-skill's art direction, then real sites for this page's needs), records them in design/DESIGN.md, then conducts the build and review skills (frontend-design, web-design-guidelines, writing-guidelines, web-perf)."
---

# Website design

Each project gets its own look, grounded in its subject and real references. This skill holds the order of work and
this project's files; the craft comes from the design skills installed next to it.

## The gate
No page or component code until `design/DESIGN.md` → **Design inputs** has all four lines filled, in order: a source
or "none" for each, written by you. A small tweak to an existing design is the only exception (see Rules).

## 1. Gather the inputs, in this order
Each step reads what the steps before it decided. An earlier input always wins over a later one.

1. **The human's references and design documents** (highest priority).
   - Read `design/DESIGN.md`. If it's filled in (the colour tokens have values), it's the base: go to step 3.
   - `design/references/`: read each image once and write one line per image into DESIGN.md → References
     (`file → take: … · avoid: …`). Work from that text afterwards.
   - Links, brand guides, logos, colours or fonts the human gave you in the conversation, and PROJECT.md.
   - Brief empty? Ask the human 3 short questions in one message: what it is and for whom; three words for the feel;
     sites they like or dislike. Write the answers into DESIGN.md → Brief.
   - Write **Design inputs → References** (what you found, or "none").
2. **If step 1 gave no design language: an awesome-design-md base.**
   - `{{run}} design:md list` prints the catalog by category with one line per entry (`--category <word>` narrows
     it). Propose 2–3 that fit the brief, each with one sentence on why, and let the human pick.
   - `{{run}} design:md use <name>` copies it to `design/DESIGN.md` with the credit. Replace every brand name, logo
     and trademark with this project's own.
   - Skip this step if step 1 gave a design language, or if DESIGN.md already starts from an entry (its header says
     so).
   - Write **Design inputs → Base** (the entry, or "none: built from the human's references").
3. **taste-skill (skill `design-taste-frontend`): the art direction.**
   - Run its steps 1–4 (brief and subject inventory, the argument, the direction, the idea) for this page.
   - When steps 1–2 fixed colours and type, deal with `--keep palette,type` so it plans composition, imagery and
     sections inside the design language instead of replacing it.
   - Write the chosen direction into DESIGN.md's sections (theme, layout, components), and **Design inputs →
     Direction** (the direction id and one line on why).
4. **Real sites for this site's requirements.**
   - Open your project type's section in `references/project-types.md` (`rg -n "^## " <file>`) and, for the
     specific patterns this page needs (pricing, checkout, docs, dashboard, onboarding…), the galleries in
     `references/inspiration.md`.
   - Study 2–3 live sites for those patterns (hierarchy, density, how they explain things), in a browser tool.
     Write one line each into DESIGN.md → References.
   - Write **Design inputs → Reference sites**.

## 2. Build
- **Tokens:** map DESIGN.md's tokens to the theme in {{#tanstack-start}}`src/styles.css`{{/tanstack-start}}{{#next}}`src/app/globals.css`{{/next}}{{#shadcn}} (shadcn/ui's `--background`, `--primary`, `--radius`…){{/shadcn}}. No raw
  hex values in components.
- **Build** with skill `frontend-design`, following taste-skill's direction sheet (its steps 5–6).
{{#shadcn}}
  Use shadcn/ui components (skill `shadcn`; `{{dlx}} shadcn@latest add <component>`).
{{/shadcn}}
  Component and icon choices: `references/libraries.md`.
- **Content:** real content. Ask for it, or write specific plain copy. No lorem ipsum, no fake logos, stats or
  testimonials. Make one thing memorable and keep the rest quiet.
- **Baseline:** responsive from 360px, visible focus, `prefers-reduced-motion`, WCAG 2.2 AA contrast, and empty,
  loading and error states.

## 3. Review
- taste-skill's gate and look steps (its steps 7–8), with screenshots at 390, 768 and 1440px (skill
  `playwright-cli`{{#next}}, or `next-dev-loop` against the dev server{{/next}}).
- Skill `web-design-guidelines` for accessibility and UX, skill `writing-guidelines` for every piece of copy, and
  skill `web-perf` for loading performance on the main pages.
- Fix the top 3 problems, then remove one decoration before you finish.

## Rules
- Learn principles from references (hierarchy, rhythm, density, type, colour). Never copy a site's layout, text,
  logos, illustrations or code, and never ship another brand's name, logo or trademark.
- The human's brief and references beat the awesome-design-md base, which beats taste-skill's defaults, which beat
  your own taste.
- A small visual tweak to an existing design (spacing, a colour within the palette, one component) is a Quick
  change: follow DESIGN.md and don't rerun the inputs.
