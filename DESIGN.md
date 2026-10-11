# ClearClass Design System

<!-- impeccable:design-schema 1 -->

## Mode

Operate (Fast morning operational decision-making for school headteachers, staff, and PE coordinators under time pressure).

## Thesis

"Rules and physics decide; typography and layout communicate."
ClearClass avoids generic, decorative weather dashboard tropes. It organizes complex atmospheric and regulatory inputs into immediate, high-contrast operational action cards with complete provenance and bilingual transparency.

## Color System

- **Background & Canvas:**
  - Base canvas: `bg-slate-100/70` (`#f1f5f9` at 70% opacity)
  - Card surfaces: `bg-white` (`#ffffff`)
  - Sub-cards / Insets: `bg-slate-50` (`#f8fafc`)
  - Elevated sticky headers: `bg-white/95` with `backdrop-blur-sm` and `border-slate-200`

- **Brand & Primary:**
  - Educational Navy: `text-blue-900` (`#1e3a8a`), badge bg `bg-blue-900`
  - Primary interactive accents: `text-blue-800` (`#1e40af`), hover `text-blue-900`

- **Decision Badges (Semantic & Accessible):**
  - **ALLOW:** `bg-emerald-100`, `text-emerald-800`, `border-emerald-300`, icon `CheckCircle2` (green `#059669`)
  - **MODIFY:** `bg-amber-100`, `text-amber-800`, `border-amber-300`, icon `AlertTriangle` (amber `#d97706`)
  - **DENY:** `bg-rose-100`, `text-rose-800`, `border-rose-300`, icon `XCircle` (rose `#dc2626`)
  - **WITHHELD / UNAVAILABLE:** `bg-slate-100`, `text-slate-700`, `border-slate-200`, icon `HelpCircle` (slate `#64748b`)

- **Ventilation Indicators:**
  - Feasible / Safe flushing: `bg-teal-50`, `text-teal-800`, `border-teal-200`
  - Infeasible / Exceeded: `bg-amber-50`, `text-amber-800`, `border-amber-200`

## Typography & Hierarchy

- **Font Family:**
  - Primary UI: Geist Sans / Inter / system-ui stack
  - Numerical & Code: Geist Mono / monospace for AQI values, PM concentrations, ppm levels, and Cedar policy rule IDs
  - Devanagari Support: System Devanagari fallback for natural, highly legible Hindi parent messages

- **Scale:**
  - Page Title: `text-xl font-bold tracking-tight text-slate-900`
  - Operational Stance: `text-base sm:text-lg font-bold text-slate-900`
  - Cohort Headers: `text-sm font-bold tracking-tight text-slate-900`
  - Section Labels: `text-[10px] font-bold uppercase tracking-wider text-slate-500`
  - Body & Parent Messages: `text-xs leading-relaxed text-slate-800`

## Responsive & Accessible Design

- Cohort decision cards use `grid-cols-1 lg:grid-cols-2`, stacking cleanly on mobile viewports (<768px) with zero horizontal overflow.
- All decisions use text labels and distinct icons in addition to color.
- Charts provide a full text table alternative accessible via toggle for screen readers and compact inspection.
- Parent message circulars support one-click copy to clipboard with instant visual feedback.
