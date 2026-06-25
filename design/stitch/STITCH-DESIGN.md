---
name: ALACRUZ Operational System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#444655'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2c4ede'
  primary: '#002392'
  on-primary: '#ffffff'
  primary-container: '#0234c9'
  on-primary-container: '#a7b4ff'
  inverse-primary: '#b9c3ff'
  secondary: '#0057c1'
  on-secondary: '#ffffff'
  secondary-container: '#0f6fee'
  on-secondary-container: '#fefcff'
  tertiary: '#333333'
  on-tertiary: '#ffffff'
  tertiary-container: '#494949'
  on-tertiary-container: '#b8b8b8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee1ff'
  primary-fixed-dim: '#b9c3ff'
  on-primary-fixed: '#001159'
  on-primary-fixed-variant: '#0032c4'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#aec6ff'
  on-secondary-fixed: '#001a43'
  on-secondary-fixed-variant: '#004397'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  page-title:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  section-title:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-default:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  tabular-nums:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 240px
  topbar-height: 64px
  container-padding: 32px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The design system for this industrial ERP focuses on **Efficiency, Durability, and Precision**. Given the nature of a wooden truck body factory, the UI must balance the ruggedness of the manufacturing sector with the high-performance clarity of modern B2B SaaS.

The aesthetic follows a **Corporate / Modern** approach with high information density, drawing inspiration from industry leaders like Linear and Stripe. It prioritizes clarity over decoration, using a structured layout to manage complex data workflows (inventory, production queues, and logistics). The emotional response should be one of reliability and total control over the manufacturing process.

## Colors

The palette is anchored by **Azul Royal (#0234C9)**, representing authority and industrial strength. This is the primary action color. **Preto (#000000)** provides a high-contrast foundation for navigation, ensuring the sidebar remains a distinct, grounding element of the interface.

- **Primary Actions:** Use Azul Royal for primary buttons and active indicators.
- **Interaction States:** Azul Claro (#046CEB) is reserved for hovers and focus rings to provide clear feedback.
- **Information Hierarchy:** Use the Muted Text (#6B7280) for labels and secondary metadata to keep the interface clean despite high data density.
- **Semantic Feedback:** Standard success, warning, and danger colors are utilized for production status (e.g., "Em Produção", "Atrasado", "Cancelado").

## Typography

**Inter** is the sole typeface for this design system, chosen for its exceptional legibility in data-heavy environments. 

### Localization & Formatting
- **Numbers:** Always use `font-variant-numeric: tabular-nums` for currency values (R$) and measurements to ensure columns align perfectly in tables.
- **Dates:** Format as DD/MM/AAAA.
- **Hierarchy:** Page titles use semibold weights with slight negative letter spacing to feel "tight" and professional. Body text remains at 14px to maximize information density without sacrificing readability.

## Layout & Spacing

The design system utilizes a **Fixed Sidebar + Fluid Content** model. 

- **Sidebar:** A constant 240px width provides a reliable anchor. 
- **Grid:** Content follows a 12-column fluid grid system. However, for internal dashboard views, elements often use fixed-width constraints or "Auto-layout" stacks to maintain density.
- **Density:** We utilize a "Compact" spacing rhythm. Vertical spacing between table rows should be minimized (suggested 8px-12px padding) to allow managers to see more data without scrolling.
- **Breakpoints:** 
  - Desktop: 1280px+
  - Tablet: 768px - 1279px (Sidebar collapses to icons-only).
  - Mobile: <767px (Sidebar becomes a hidden drawer; horizontal tables gain independent scroll).

## Elevation & Depth

This design system uses a **Low-contrast Outline** approach combined with **Ambient Shadows** to create a clean, layered look without visual clutter.

- **Level 0 (Background):** #FFFFFF.
- **Level 1 (Cards/Surface):** White background with a 1px border (#E5E7EB).
- **Shadows:** Use a single, very soft shadow for cards: `0px 1px 3px rgba(0, 0, 0, 0.05), 0px 10px 15px -3px rgba(0, 0, 0, 0.03)`.
- **Interactive Depth:** Buttons and Inputs should feel "flat" until focused, where a 2px outer ring of Azul Claro (#046CEB) with 20% opacity is applied.

## Shapes

The shape language is modern and approachable but retains a professional "squareness." 

- **Containers & Cards:** 12px (rounded-lg) creates a sophisticated frame for large data sections.
- **Interactive Elements:** 8px (default) for buttons, input fields, and selects. This smaller radius provides a more "tool-like" feel suited for an ERP.
- **Pills:** Status indicators use a full pill radius (999px) to differentiate them clearly from clickable buttons.

## Components

### Buttons
- **Primary:** Azul Royal background, White text. High emphasis.
- **Secondary:** White background, 1px border (#E5E7EB), Azul Royal text.
- **Ghost:** No background or border, Azul Royal text. Used for secondary actions in tables.

### Data Tables
- **Header:** Muted background (#F3F4F6), 13px bold labels, lowercase with capitalization.
- **Rows:** 1px bottom border only. Hover state uses #F9FAFB.
- **Status Pills:** Light background versions of semantic colors (e.g., Success is Light Green bg with Dark Green text).

### Form Inputs
- **Style:** 8px radius, 1px border (#E5E7EB). 
- **Focus:** Border changes to Azul Claro with a soft outer glow.
- **Labels:** 13px Medium weight, positioned above the input.

### KPI Cards
- **Structure:** Title (Caption size, Muted), Value (Section Title size, Preto), Trend (Caption size, Success/Danger text).
- **Icons:** Small 20px icons in the top right, utilizing a subtle Azul Royal tint.

### Sidebar (Navegação)
- **Background:** Preto (#000000).
- **Inactive Items:** White text at 80% opacity.
- **Active State:** Azul Royal background with a 4px solid Azul Royal border on the extreme left edge.