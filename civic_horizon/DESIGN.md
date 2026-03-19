# Design System Document: Civic Intelligence & Transparency

## 1. Overview & Creative North Star
### The Creative North Star: "The Digital Architect"
This design system rejects the cluttered, bureaucratic aesthetic of traditional government portals. Instead, it adopts the persona of **The Digital Architect**—an interface that feels authoritative, structural, and meticulously organized. 

The goal is to move beyond a "standard dashboard" by utilizing **Intentional Asymmetry** and **Tonal Depth**. By breaking the rigid 12-column grid with overlapping data modules and varying surface heights, we create a sense of bespoke craftsmanship. We prioritize "Breathing Room" (generous white space) to reduce cognitive load for city officials managing complex datasets, ensuring the interface feels as efficient as it is trustworthy.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep, institutional blues and vibrant, action-oriented emeralds, balanced by a sophisticated grayscale.

### The "No-Line" Rule
**Strict Mandate:** 1px solid borders are prohibited for defining sections. 
Structure must be created through **Background Shifts**. Use `surface-container-low` for the main canvas and `surface-container-lowest` for primary content modules. The human eye perceives the transition between these subtle tonal shifts as a cleaner, more modern boundary than a harsh line.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, semi-transparent layers rather than a flat plane.
- **Base:** `surface` (#f8f9fb)
- **Secondary Layout Areas:** `surface-container-low` (#f2f4f6)
- **Primary Content Cards:** `surface-container-lowest` (#ffffff)
- **Active/Hover States:** `surface-container-high` (#e6e8ea)

### The Glass & Gradient Rule
To prevent the dashboard from feeling "flat," use **Glassmorphism** for floating utility panels (e.g., filter drawers or profile menus). Apply `surface_variant` with a 70% opacity and a `20px` backdrop-blur. 
**Signature CTA Texture:** Use a linear gradient from `primary` (#00346f) to `primary_container` (#004a99) at a 135-degree angle to give buttons a "jewel-like" depth that feels premium.

---

## 3. Typography
The system uses a dual-font pairing to balance authority with utility.

*   **Display & Headlines (Public Sans):** A sturdy, geometric sans-serif that communicates stability. Use `headline-lg` for page titles to establish an editorial feel.
*   **UI & Body (Inter):** Chosen for its exceptional legibility in data-heavy contexts. Use `body-md` for standard administrative text and `label-sm` for high-density data tables.

**Hierarchy as Identity:** 
Always over-emphasize the contrast between `display-sm` titles and `body-sm` metadata. This "Big/Small" typographic rhythm creates an elite, curated look commonly found in high-end financial or architectural journals.

---

## 4. Elevation & Depth
We abandon the "drop shadow" of the 2010s in favor of **Tonal Layering**.

*   **The Layering Principle:** A card does not need a shadow to be "above" the background; it simply needs to be `surface-container-lowest` sitting on `surface-container-low`.
*   **Ambient Shadows:** For "floating" elements like Modals or Tooltips, use an ultra-diffused shadow: `box-shadow: 0 12px 40px rgba(25, 28, 30, 0.06)`. Note the use of `on_surface` (#191c1e) at a very low 6% opacity to mimic natural light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., in high-contrast modes), use `outline-variant` (#c2c6d3) at **15% opacity**. Never use 100% opacity borders.

---

## 5. Components

### Buttons
*   **Primary:** Gradient (Primary to Primary-Container), `lg` rounding (0.5rem), `on_primary` text.
*   **Secondary:** `surface-container-high` background with `on_surface` text. No border.
*   **Tertiary:** Text-only using `primary` color, with a subtle `surface-fixed-dim` background on hover.

### Input Fields
*   **Style:** Background-filled using `surface-container-highest` (#e0e3e5). 
*   **Interaction:** On focus, the background shifts to `surface-container-lowest` with a 2px "Ghost Border" using `primary`.
*   **Validation:** Error states use `error` (#ba1a1a) for the label and a soft `error_container` (#ffdad6) for the input background.

### Cards & Data Lists
*   **Rule:** Forbid divider lines. 
*   **Implementation:** Use a `1.5` (0.3rem) spacing gap between list items, or alternating backgrounds of `surface-container-low` and `surface-container-lowest`.
*   **Rounding:** Apply `xl` (0.75rem) to major dashboard cards to soften the "institutional" feel.

### Status Indicators & Heatmaps
*   **Success/Action:** Use `secondary` (#006c47).
*   **Urgency:** Use `error` (#ba1a1a).
*   **Neutral/Pending:** Use `tertiary_container` (#404e5a).
*   **Heatmaps:** Transition from `primary_fixed` (light blue) to `secondary` (emerald) to visualize "efficiency" or "density" without using "danger" colors (red/yellow) unless absolutely necessary.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use `20` (4.5rem) spacing between major functional sections to allow the eye to rest.
*   **DO** overlap elements (e.g., a small stats chip overlapping the edge of a chart container) to create a bespoke, non-template look.
*   **DO** use `primary_fixed_dim` for background accents in data visualizations to maintain brand harmony.

### Don't
*   **DON’T** use pure black (#000000) for text. Always use `on_surface` (#191c1e) to maintain a sophisticated tonal range.
*   **DON’T** use the `DEFAULT` (0.25rem) rounding for cards; it feels "bootstrap-generic." Stick to `lg` or `xl`.
*   **DON’T** use standard grid-line charts. Use "Ghost Grids" (lines at 5% opacity) or remove them entirely, relying on the `body-sm` labels for context.