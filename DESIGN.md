---
name: Retro-Futurist Sports System
colors:
  surface: '#1a0b2e'
  surface-dim: '#1a0b2e'
  surface-bright: '#413256'
  surface-container-lowest: '#150628'
  surface-container-low: '#231436'
  surface-container: '#27183b'
  surface-container-high: '#322346'
  surface-container-highest: '#3d2e51'
  on-surface: '#eddcff'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#eddcff'
  inverse-on-surface: '#38294d'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dce6'
  primary: '#e3fdff'
  on-primary: '#00373a'
  primary-container: '#00f3ff'
  on-primary-container: '#006b71'
  inverse-primary: '#00696f'
  secondary: '#fface8'
  on-secondary: '#5e0053'
  secondary-container: '#ff24e4'
  on-secondary-container: '#520049'
  tertiary: '#f1ffc2'
  on-tertiary: '#283500'
  tertiary-container: '#bded00'
  on-tertiary-container: '#526800'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ff6ff'
  primary-fixed-dim: '#00dce6'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f53'
  secondary-fixed: '#ffd7f0'
  secondary-fixed-dim: '#fface8'
  on-secondary-fixed: '#3a0033'
  on-secondary-fixed-variant: '#840076'
  tertiary-fixed: '#c3f400'
  tertiary-fixed-dim: '#abd600'
  on-tertiary-fixed: '#161e00'
  on-tertiary-fixed-variant: '#3c4d00'
  background: '#1a0b2e'
  on-background: '#eddcff'
  surface-variant: '#3d2e51'
typography:
  display-lg:
    fontFamily: Anybody
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Anybody
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Anybody
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1280px
  gutter: 20px
---

## Brand & Style
This design system captures the high-octane energy of international football through a "Cyber-Stadium" lens. The aesthetic is a sophisticated blend of **Retro-Futurism** and **Modern Glassmorphism**, designed to evoke the feeling of a high-stakes digital arena. It targets a competitive audience that values speed, precision, and the "hype" culture surrounding global sports.

The visual narrative is driven by deep-space atmospheres punctuated by high-frequency neon signals. Grid patterns inspired by 80s computer graphics provide a structured foundation, while frosted surfaces and vibrant glows ensure the interface feels premium and contemporary rather than nostalgic. The emotional goal is to make every prediction feel like a high-tech event.

## Colors
The palette is built on a "Deep Space" foundation to ensure neon accents achieve maximum luminosity. 

- **Primary (Electric Cyan):** Used for primary actions, active states, and critical navigation. It represents the "pulse" of the digital arena.
- **Secondary (Vibrant Magenta):** Used for highlighting stakes, live matches, and promotional elements.
- **Tertiary (Lime Green):** Reserved for "Success" states, winning predictions, and positive data trends (e.g., odds increasing).
- **Surface Neutrals:** A range of deep purples and near-blacks with slight blue tints are used to create layered depth.
- **High-Contrast White:** Used exclusively for primary text and iconography to ensure AAA accessibility against dark backgrounds.

## Typography
Typography is used to communicate momentum and technical precision. 

- **Headlines:** Set in *Anybody* with a heavy weight and italicized slant to suggest speed, movement, and the aggressive nature of competitive sports.
- **Body Text:** *Hanken Grotesk* provides a clean, geometric contrast that remains legible during high-density data viewing (like match statistics or league tables).
- **Data Labels:** *JetBrains Mono* is used for odds, scores, and timestamps to reinforce the futuristic, "coded" nature of the prediction system.

All headings should utilize tight letter spacing to maintain a compact, "heavyweight" appearance.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a 12-column structure for desktop and a 4-column structure for mobile. 

- **The Grid Overlay:** A subtle, 5% opacity cyan grid pattern should be visible in the background of main content areas to reinforce the technical theme.
- **Rhythm:** An 8px linear scale drives all padding and margins. 
- **Mobile Reflow:** On mobile devices, side-by-side match cards should stack vertically, while data visualizations (like win probability bars) should scale to fill the viewport width.
- **Safe Areas:** Maintain a minimum 20px horizontal margin on mobile to ensure content does not bleed into bezel edges.

## Elevation & Depth
Depth is achieved through **Glassmorphism** and **Luminescent Borders** rather than traditional shadows.

1.  **Base Layer:** The deep purple gradient background with a subtle grid pattern.
2.  **Surface Layer (Cards):** Semi-transparent (15-25% opacity) backgrounds with a 20px `backdrop-filter: blur()`. 
3.  **Border Glow:** Surfaces should feature a 1px solid border. Use a linear gradient for the border (e.g., Primary to Transparent) to create a "scanning" light effect.
4.  **Active Elevation:** When a user interacts with a component, increase the `box-shadow` using a diffused colored glow (e.g., `0 0 15px rgba(0, 243, 255, 0.4)`) rather than a black shadow.

## Shapes
This design system utilizes a **Soft (Level 1)** roundedness profile to maintain a technical, sharp-edged feel while avoiding the harshness of 0px corners.

- **Standard Components:** 0.25rem (4px) radius. This applies to input fields, small buttons, and tags.
- **Container Elements:** 0.75rem (12px) radius for match cards and prediction modules to provide a modern, contained look.
- **Interactive States:** Maintain consistent radii even when elements scale or hover to ensure the grid-like structure remains intact.

## Components
- **Buttons:** Primary buttons use a solid Neon Cyan fill with black text for maximum contrast. Secondary buttons use a "Ghost" style with a glowing border and a subtle hover-state inner glow.
- **Match Cards:** Features a glass-morphic background. Team flags/logos should be treated with a slight desaturation until hovered to keep the UI clean.
- **Prediction Sliders:** Use the Tertiary (Lime Green) for the track to indicate the "active" prediction value. The handle should be a sharp, technical diamond or square shape.
- **Data Visualizations:** Charts and graphs should use neon lines with "area-glow" (a gradient fill below the line with low opacity). No axes should be visible—only a minimal grid background.
- **Chips/Badges:** Small, high-contrast labels for "LIVE," "HOT," or "FINAL." Use `label-sm` typography with a 1px border matching the accent color.
- **Inputs:** Darker than the card surface (10% opacity white) with a 1px cyan bottom-border that glows when focused.
