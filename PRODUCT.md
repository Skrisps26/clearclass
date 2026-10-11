# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui components, Lucide icons, Recharts (via shadcn charts), TanStack Query, Zod runtime validation, i18next (English & Hindi). Static export (`output: 'export'`) served via private S3 with CloudFront OAC / HTTPS, backed by Sydney API Gateway HTTP API and Python 3.12 Lambdas.

## Users

Primary users are school headteachers, classroom teachers, physical education coordinators, sports coaches, and school administrators responsible for student safety and daily scheduling.
Their situation: Making fast operational decisions between 06:30 and 08:30 in the morning before school opens, often on a mobile device while monitoring weather and pollution conditions.
Their job: Determine whether morning assembly, PE, outdoor recess, and prolonged sports can safely proceed or must be modified/relocated indoors; determine when to air classrooms; and generate clear parent notifications in English and Hindi.

## Product Purpose

ClearClass is a location-agnostic school decision engine, not an AQI dashboard. It answers:
1. What outdoor activities can students do today, broken down by cohort (all students vs. sensitive pupils)?
2. What are the specific modifications or indoor relocations required, grounded in published guidelines and formal Cedar policies?
3. When and how should classrooms be ventilated, balancing outdoor PM2.5 infiltration against indoor CO2 accumulation?
4. What exact ready-to-copy message should be sent to parents in English and Hindi?
5. What answers can staff get to specific questions about the day's conditions, policy sources, and room physics?

Success means staff make confident, documented decisions in under 60 seconds with complete transparency into why the decision was reached.

## Positioning

"Rules and physics decide; the LLM explains, translates, and converses."
Unlike generic weather/AQI dashboards that show raw numbers without actionable guidance, ClearClass evaluates typed Cedar policy sets and a physical mass-balance model to provide concrete recommendations. Unlike AI wrappers that invent arbitrary health claims, ClearClass grounds all decisions in deterministic logic, discloses model assumptions, highlights data age and provenance, and disclaims legal compliance or medical guarantees.

## Operating Context

- Used in schools worldwide, with initial demonstration profiles in Delhi, Bengaluru, and London, plus arbitrary global place search via Open-Meteo / GeoNames.
- Operational environments vary from low-connectivity mobile networks in school grounds to desktop computers in administrative offices.
- Decisions must be readable at a glance on mobile screens, with accessible color contrast, clear typography, and touch-friendly controls.

## Capabilities

- Global location search with GeoNames-backed resolution and IANA timezone slicing.
- Live CAMS Global hourly forecasts and synthetic benchmark scenarios (`good-day`, `moderate-day`, `very-poor-day`, `severe-day`).
- Formal Cedar authorization evaluation across activity cohorts with source citations.
- Analytic 5-minute single-zone ventilation schedule simulation with open/closed window intervals.
- Bilingual parent messaging in English and Hindi.
- Grounded conversational assistant using tool-governed Bedrock Nova Micro execution.

## Constraints

- AWS Sydney deployment (`ap-southeast-2`) exclusively.
- Reference guidance is not local law: official directives (like CAQM GRAP in Delhi) are verified separately and never fabricated.
- Forecasts are model estimates, not campus station measurements; ventilation schedules are single-zone mass-balance models, not sensor-confirmed airflow.
- No user accounts, passwords, or persistent PII collected or stored.
