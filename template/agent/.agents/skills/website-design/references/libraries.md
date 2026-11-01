# Component libraries, blocks and design tools (checked 2026-10)

Open source first; paid options are marked. Base everything on shadcn/ui (`src/shared/components/ui/`) and add at most 1–2
registries that fit the project's direction. Add components with the official CLI or registry URL
(`{{dlx}} shadcn@latest add <component-or-registry-url>`), check each licence, and delete unused variants afterwards.

## Primitives (accessible behaviour, no styling)
| Library | Use for |
| --- | --- |
| https://www.radix-ui.com/primitives | shadcn/ui's default primitives |
| https://base-ui.com | Headless components from the MUI and Radix teams; shadcn supports it |
| https://react-aria.adobe.com | Adobe's hooks and components; the strongest accessibility and i18n |
| https://ark-ui.com | Headless components built on state machines |
| https://headlessui.com | Tailwind Labs' headless components |

## Styled components (Tailwind, copied into the project)
| Library | Character |
| --- | --- |
| https://ui.shadcn.com | The base: plain, adaptable. Registry directory: https://ui.shadcn.com/docs/directory |
| https://coss.com/ui | Origin UI's successor: large set of polished inputs, tables, forms |
| https://www.kibo-ui.com | Composable advanced components (kanban, gantt, editors) |
| https://reui.io | Data-heavy components: tables, filters, forms |
| https://park-ui.com | Ark UI with a design system, multiple themes |
| https://www.heroui.com | Polished, rounded, friendly product UI |
| https://daisyui.com | Tailwind plugin with themeable class names; quick prototypes |
| https://flowbite.com | Large catalogue of components and marketing sections |
| https://preline.co | Components and full page examples |
| https://www.hyperui.dev | Copy-paste Tailwind sections, no JavaScript |
| https://tailwindcss.com/plus | Tailwind Labs' components and templates (paid) |
| https://www.untitledui.com | Large design system with React components (free and paid) |

## Marketing blocks and templates
| Library | Use for |
| --- | --- |
| https://tailark.com | Marketing blocks for shadcn/ui: heroes, features, pricing, footers |
| https://www.shadcnblocks.com | Hundreds of shadcn sections (free and pro) |
| https://magicui.design | Animated components and landing templates |

## Animated and visual components (use sparingly: one moment per page)
| Library | Use for |
| --- | --- |
| https://ui.aceternity.com | Showy effects and hero backgrounds |
| https://motion-primitives.com | Small, tasteful motion components |
| https://animate-ui.com | Animated shadcn-style components |
| https://www.cult-ui.com | Distinctive interactive components |
| https://reactbits.dev | Text and background effects |

## Charts and data
https://ui.shadcn.com/charts (Recharts, styled) · https://recharts.org · https://tremor.so (dashboard components)
· https://airbnb.io/visx (custom charts) · https://nivo.rocks

## Icons (one set per project)
https://lucide.dev (shadcn default) · https://phosphoricons.com (six weights) · https://tabler.io/icons ·
https://hugeicons.com · https://iconoir.com · https://heroicons.com · https://simpleicons.org (brand logos: download the SVG into `src/shared/assets/icons/`, import it with `?react`)

## Motion
https://motion.dev (React animation) · https://gsap.com (timelines, scroll; free including plugins) ·
https://lenis.darkroom.engineering (smooth scroll; use rarely) · https://auto-animate.formkit.com (list transitions)

## Fonts (self-host; check each licence)
https://fontsource.org (any Google or open font as an npm package) · https://fonts.google.com ·
https://www.fontshare.com (free quality fonts) · https://velvetyne.fr (libre display faces) ·
https://www.collletttivo.it (libre type collective)

## Colour and contrast
https://www.radix-ui.com/colors (accessible scales) · https://uicolors.app (Tailwind scales from one colour) ·
https://www.realtimecolors.com (try a palette on a page) · https://huemint.com · https://oklch.com ·
https://coolors.co · https://webaim.org/resources/contrastchecker (WCAG contrast)

## Photos
The client's own photography first. Otherwise https://unsplash.com or https://www.pexels.com: check the licence,
credit when required, and never use AI images of people or of the product.
