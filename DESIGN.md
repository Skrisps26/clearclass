---
name: ClearClass
description: School-day decision sheet for staff
colors:
  canvas: "hsl(200 17.6% 96.7%)"
  sheet: "hsl(0 0% 100%)"
  ink: "hsl(210 30.3% 12.9%)"
  secondary-ink: "hsl(207.1 17.9% 33.9%)"
  rule: "hsl(201.4 20% 86.3%)"
  action-blue: "hsl(199 52.3% 29.6%)"
  quiet-surface: "hsl(200 21.4% 94.5%)"
  allow-bg: "hsl(147.3 35.5% 93.9%)"
  allow-ink: "hsl(158.2 62.6% 24.1%)"
  modify-bg: "hsl(37.5 100% 93.7%)"
  modify-ink: "hsl(34 81.1% 29%)"
  deny-bg: "hsl(356.7 81.8% 95.7%)"
  deny-ink: "hsl(357.8 53.2% 40.2%)"
  unknown-bg: "hsl(200 21.4% 94.5%)"
  unknown-ink: "hsl(203.6 16.9% 32.5%)"
typography:
  headline:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  detail:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  status-allow:
    backgroundColor: "{colors.allow-bg}"
    textColor: "{colors.allow-ink}"
    rounded: "{rounded.pill}"
  status-unknown:
    backgroundColor: "{colors.unknown-bg}"
    textColor: "{colors.unknown-ink}"
    rounded: "{rounded.pill}"
---

# Design System: ClearClass

## Overview

**Creative North Star: "The morning duty sheet"**

Staff consult ClearClass before school opens, often on a phone. The interface reads like an operational risk-assessment sheet: a short assessed stance, the cohort switch, then one ruled activity list. It is deliberately a reading surface rather than a dashboard of repeated metrics. Air provenance, unavailable guidance, and model limitations remain visible where they affect the decision.

**Key Characteristics:** cool off-white canvas; white sheets; ink-first hierarchy; quiet blue actions; thin rules; explicit text status labels; compact mobile controls.

## Colors

- **Primary:** action blue marks tabs, links, controls, and focus. It is not a severity scale.
- **Neutral:** canvas separates sheets; ink carries instructions; secondary ink carries source and explanation; rules separate facts rather than framing every item as a card.
- **Decision states:** allow green, modify amber, deny red, and unknown neutral appear only with readable status text. Unknown or withheld is never rendered as assessed deny.

**The Provenance Rule.** A model forecast, cached forecast, demo scenario, stale forecast, and unavailable forecast are labeled as different states. No reference AQI appears when the API value is null; no forecast is presented as a campus measurement.

## Typography

Geist Sans is the workhorse face already loaded locally; Devanagari falls back to a capable system face. Geist Mono is reserved for measurements, local time, and Cedar rule IDs. The stance uses 23px on phones and 28px from the small breakpoint; activity headings are 16px and section headings 18px. Instructions and notices use 15–16px, evidence and compact controls 14px. Supporting text remains sentence case and typically below 75 characters per line.

**The Instruction Rule.** Name the action before its rationale. A row never relies on its status color alone.

## Layout

The shell and sheets align to a maximum 1152px reading width. A compact masthead carries identity, location, scenario, language, and refresh; a single underlined navigation row follows. The decision sheet precedes a four-row activity list in API order. Desktop rows keep their badge at the end of the heading line; on phones rows wrap without squeezing instructions. At 390×844, the stance, cohort switch, and first two activity rows fit in the opening viewport. Mobile uses short complete navigation labels so all four sections remain visible; full names are retained for accessible tab labels. Forecast tables scroll inside their own sheet, not the document.

## Elevation & Depth

Flat by default. White sheets and horizontal gray rules establish hierarchy; no decorative card shadow, translucent sticky bar, gradient AQI gauge, or status pulse. The Radix dialog retains its accessible modal overlay.

## Shapes

Primitives use a restrained 8px radius family (4px small, 6px medium, 8px large). Main reading surfaces and activity rows are squared ruled sheets. Status tags can be pill-shaped because they are short labels, not controls.

## Components

- **Buttons and fields:** registry-generated shadcn/ui Button, Input, and Select on semantic color tokens. Focus is a visible blue outline/ring; disabled actions remain visibly disabled.
- **Navigation and cohorts:** Radix Tabs. Underlined main navigation is a single row; the cohort control uses a quiet segmented background. Mobile labels are visible without clipping.
- **Activity rows:** one instruction, modification and caveat text directly beneath it, status badge, then a closed-by-default evidence Accordion with real Cedar IDs, source links and input description. An unevaluated row says “Not evaluated” if it has no rule IDs.
- **Secondary sheets:** ventilation uses a definition list and Recharts combined PM/AQI chart with separate axes plus a generated Table alternative; parent notices retain line breaks and explicit copy/share controls; the assistant uses starter-question rows and a role-labeled transcript; location search is a ruled Dialog with distinct no-results and network-error states.

## Do's and Don'ts

### Do:
- **Do** keep decisions attached to the affected activity and cohort, especially when guidance is mixed or withheld.
- **Do** show status words and source context alongside tint; permit scanning without color vision.
- **Do** let long Hindi and source names wrap naturally without horizontal document overflow.

### Don't:
- **Don't** duplicate the four verdicts in a hero tile grid above their actual instructions.
- **Don't** present synthetic, stale, unavailable or modelled data as live campus observations.
- **Don't** use decorative gradients, pulsing badges, micro-labels, or nested icon-card panels in the operating surface.
