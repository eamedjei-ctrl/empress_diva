---
name: Empress Divas
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#564149'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#897179'
  outline-variant: '#dcbfc9'
  surface-tint: '#ac2471'
  primary: '#ac2471'
  on-primary: '#ffffff'
  primary-container: '#ff69b4'
  on-primary-container: '#6e0044'
  inverse-primary: '#ffb0d0'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#5e5e5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#9f9f9f'
  on-tertiary-container: '#363636'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd8e6'
  primary-fixed-dim: '#ffb0d0'
  on-primary-fixed: '#3d0024'
  on-primary-fixed-variant: '#8c0058'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md-mobile:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  title-sm:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.5'
    letterSpacing: 0.05em
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin-mobile: 20px
  container-margin-desktop: 80px
  gutter: 24px
  section-gap-lg: 120px
  section-gap-sm: 60px
---

## Brand & Style

The design system is built for a Ghanaian luxury fashion house, blending contemporary elegance with a premium editorial feel. The brand personality is feminine, confident, and sophisticated, targeting a high-end audience that values quality and craftsmanship.

The visual style is **Modern Luxury with a Minimalist influence**. It prioritizes generous whitespace to let high-resolution photography breathe, creating an "uncluttered" boutique atmosphere. The UI utilizes soft depth and subtle motion to evoke a sense of high-touch service and exclusivity.

- **Feminine & Classy:** Use of soft pink as a signature accent against a monochromatic base.
- **Modern & Premium:** High-contrast typography and razor-sharp layouts.
- **Atmospheric:** Incorporate full-bleed imagery and "lifestyle" transitions.

## Colors

The palette is anchored by a high-fashion interplay between deep black and pure white, with the signature pink used strategically for emphasis and brand recognition.

- **Primary (Pink):** Used for primary calls to action, active states, and small brand accents. 
- **Base (White/Light Grey):** White is the primary surface color to maximize "airiness." Light Grey (#F5F5F5) is used for secondary sections and background differentiation.
- **Contrast (Black):** Reserved for high-impact typography, primary buttons, and navigational elements to maintain a grounded, luxury feel.

## Typography

This design system uses a classic pairing of a high-contrast serif for editorial flair and a clean geometric sans-serif for functional clarity.

- **Playfair Display:** Used for headlines and display text. It provides the "Empress" character—authoritative yet graceful.
- **Montserrat:** Used for all body copy, navigation items, and labels. Its geometric neutrality ensures the interface feels modern and accessible.
- **Styling Note:** Use uppercase treatment for section labels and small titles to enhance the luxury "label" aesthetic.

## Layout & Spacing

The layout follows a **Mobile-First, Fluid Grid** philosophy. On mobile, the system uses a single-column layout with generous side margins to prevent a cramped feeling. On desktop, it expands to a 12-column grid.

- **Whitespace:** Spacing between sections should be intentionally large (60px to 120px) to signify a premium, unhurried shopping experience.
- **Alignment:** Content is generally center-aligned for landing pages and left-aligned for functional shopping interfaces (Product grids, Checkout).
- **Safe Zones:** Always maintain a minimum 20px gutter on mobile devices to ensure readability against the screen edges.

## Elevation & Depth

Depth is used sparingly to maintain a "flat-luxury" aesthetic. Instead of heavy shadows, the system utilizes:

- **Soft Ambient Shadows:** Applied only to floating elements (Cards, Modals). Use a very high blur radius (30px+) with low opacity (approx. 4-6%) black or a subtle pink-tinted grey.
- **Tonal Layering:** Using the neutral #F5F5F5 against white backgrounds to create "contained" areas without physical borders.
- **Hover States:** Interactive elements should lift slightly (translate Y-axis -4px) or utilize a subtle scale increase (1.02x) rather than a drastic shadow change.

## Shapes

The shape language is **Softly Rounded**, moving away from sharp industrial edges to a more approachable, feminine silhouette.

- **Cards & Containers:** Use `rounded-lg` (1rem/16px) as the standard for product cards and featured content blocks.
- **Buttons:** Use `rounded-xl` or fully pill-shaped (3rem) for primary actions to contrast against the structured grid.
- **Form Inputs:** Stick to `rounded-lg` to match the cards, ensuring a consistent visual container.

## Components

### Buttons
- **Primary:** Solid Black background with White text. Pill-shaped. On hover, background shifts to Primary Pink.
- **Secondary:** Transparent background with Black 1px border. Pill-shaped.
- **Tertiary/Ghost:** Text-only with an underline that expands on hover.

### Cards
- **Product Card:** Image-first. No border, only a soft ambient shadow on hover. Typography is placed below the image with the price in a subtle Montserrat semi-bold.
- **Category Card:** Uses a full-bleed background image with a centered White label using `title-sm` typography.

### Input Fields
- **Text Fields:** Subtle #F5F5F5 background with no border, becoming a 1px Black bottom-border on focus.
- **Checkboxes/Radios:** Use the Primary Pink for active states.

### Additional Elements
- **Image Carousels:** Use thin, minimal dash indicators rather than bulky arrows.
- **Product Badges:** Small, pill-shaped tags (e.g., "New In", "Limited") using `label-caps` typography with a Black background and White text.