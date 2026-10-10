<!-- BEGIN AWS Agent Toolkit rules -->
# AWS Guidance for the new AWS experience

This user has signed up for the new AWS experience. This experience lets you sign into AWS using a social provider and requires the following additional context.

Where this guidance conflicts with the project's own instructions, the project's instructions take precedence.

## Context

### Terminology:

- Say "project" instead of "account" — a project contains an AWS account and settings for sharing with other collaborators
- Say "team member" instead of "IAM user" — users are invited by email, not created or federated in IAM
- Say "AWS Settings" when referring to management tasks at [settings.aws.com](https://settings.aws.com/) (project management, billing, team members, spend limits). Users view their actual AWS resources in the AWS Management Console.
- Say "selected Region" when referring to the user's Region — not "home Region"
- The user has a managed IAM experience. This includes a managed service control policies (SCP) and resource control policies (RCP) that govern the use of AWS. They will still need to use IAM to create policies to let services work with each other. If there are questions about the SCPs or RCPs, go to the documentation at https://docs.aws.amazon.com/accounts/latest/reference/scps-and-rcps-for-projects.html

### Constraints:

- All projects share a single AWS Region determined by the user's contact address. Resources cannot be created in other Regions
- When developing:
  - MUST create all Regional resources in the project's assigned Region
  - You CAN create AWS WAF and Cloudwatch Logs resources in us-east-1 when there are global resources (like a global WAF instance) that require a connection to dependencies in us-east-1. You should not use these for any other reason, because resources in the selected Region will provide lower cost (due to no cross-Region traffic), increased availability (due to no cross-Region traffic), and easier manageability (due to not needing to look in another Region). When you need to do an inventory of resources, you need to look in both the selected Region and us-east-1 for Cloudwatch Logs or WAF resources.
  - MUST NOT attempt to create Lambda, API Gateway, or other Regional resources in any other Region
  - MUST direct users to confirm their Region in AWS Settings > View all projects > Overview > Additional Info > Region. If the user cannot confirm their Region, check in ~/.aws/config
  - MUST NOT use Lambda@Edge — excluded from both Lambda and CloudFront
  - MUST NOT use CloudFormation StackSets — no multi-account or multi-Region deployments
  - MUST NOT attempt cross-Region actions — no cross-Region replication for DynamoDB/S3/RDS, no multi-Region KMS keys
  - MUST NOT use Route 53 cross-Region routing — geolocation, latency-based, and failover routing policies are not available
  - CloudFront is a global service and its actions ARE allowed in `us-east-1`. A user can create a CloudFront distribution pointing to their project-region Lambda function URL or API Gateway. However, Lambda and API Gateway themselves MUST NOT be created in `us-east-1` — they must be in the project Region.
  - Reduced availability in `eu-north-1` specifically: Amazon Rekognition, Amazon Textract, Amazon Personalize, AWS App Runner are not available in that Region.
- IAM permissions for human access are managed by AWS. Don't assign roles to team members unless absolutely necessary
- The user may have a spend limit if they are on the paid plan. The limit that pauses their project if it's exceeded. If resources suddenly become inaccessible, ask if they have a spend limit configured. Only project owners can modify a spend limit.
- When developing:
  - MUST ask about spend limit status if the user reports sudden "Access Denied" errors on operations that previously worked
  - MUST direct users to check spend status in AWS Settings > Billing
  - MUST check if a user has upgraded their account to the paid plan
  - MUST ask the user if they want to clean up the successfully created resources or keep them to reduce cost
- The user sets up billing, creates spend limits, and retrieves and pays invoices in AWS Settings. The user creates budgets and optimizes their costs in the AWS Billing and Cost Management console
- Not all AWS services are available. If a service isn't working, do the following:
  1. Run the command `aws freetier get-account-plan-state`
  2. If accountPlanType": "FREE", check the [Free Tier supported services list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-free-tier) next,
  3. If accountPlanType": "PAID", check the [Paid Tier supported services list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-paid-plan).
  4. If neither list shows the service, check the [Not supported for this experience list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#unsupported-services). The user will need to activate advanced features to access this service.
- Users can activate advanced AWS services and capabilities for their account.
- Before starting a task, check whether a relevant AWS skill is available. Load the skill with retrieve_skill and prefer its guidance over general knowledge.

### Help level

- help_level (required): LOW, MEDIUM, or HIGH. While a user is building, you MUST ask the user: "How much guidance would you like from me? Low (I only flag security risks), medium (I ask a couple of clarifying questions if something seems off), or high (I explain what I'm doing, suggest alternatives, and flag best practices)."

You CAN update this rule file to save a user's help_level.

Constraints for each level:

**LOW:**

- MUST follow all constraints in this context file
- MUST execute the user’s request without modification
- MUST NOT ask clarifying questions unless the action would create a security vulnerability
- MUST NOT suggest alternatives or improvements

**MEDIUM:**

- MUST execute the user's request
- MAY ask up to two clarifying questions per task if the request has an ambiguity or a potential issue
- MUST NOT repeat a question or suggestion the user has already dismissed
- MUST NOT explain trade-offs or alternatives unless the user asks

**HIGH:**

- MUST explain what each step does and why before executing it
- MUST suggest alternatives when a better approach exists
- MUST flag best practices and explain trade-offs
- MUST still execute the user's choice if they disagree with a suggestion
<!-- END AWS Agent Toolkit rules -->

<!-- BEGIN ClearClass implementation plan -->
# ClearClass implementation roadmap

## Start here

Read this roadmap and [CONTEXT.md](CONTEXT.md) at every session start. This is the approved implementation specification, not evidence that the application exists. All application paths below are **planned** until the progress ledger records otherwise.

The initial documentation-only authorization has been superseded by the user's 2026-10-10 request to implement the project step by step. Implementation is authorized; paid deployments, Git ownership/visibility, regional model deviations and publication still require the gates below. Preserve the AWS guidance above. Keep this roadmap between its markers; do not create a competing lowercase `agents.md`.

`DECISIONS.md` now records dated choice/rationale/rejected alternative/source/MUST-impact entries; update it for each substantive choice. Preserve the supplied original brief as `SPEC.md` if provided; it is not present in this directory. Flag any further MUST deviation before acting.

## Product contract and priorities

ClearClass is a **location-agnostic school decision engine**, not an AQI dashboard. Staff select a place and school/classroom profile and receive:

- Assembly, PE, recess and sports recommendations by cohort, with the actual Cedar rule and source.
- Estimated ventilation windows balancing indoor PM2.5 exposure and CO2.
- Ready-to-copy English/Hindi parent messages.
- Grounded questions and answers using the same place, time, data and policies.

**Rules and physics decide; the LLM explains, translates and converses.** Forecasts and model estimates are never measurements. Show data age, provenance, uncertainty and advisory language; make no medical or health-outcome guarantees. Follow applicable official directives.

The user's geographic revision replaces the brief's Delhi-only/multi-city exclusion. Support arbitrary geocoder-supported places, not merely seeded cities. Reuse one worldwide **reference advisory** pack and small explicitly scoped local-authority packs. Delhi is a demonstrable local-policy example, not the product boundary. Do not claim worldwide legal coverage. Global places do not require global language support: retain EN/HI.

| Priority | Required outcomes |
| --- | --- |
| P0 | Global place selection; live/modelled air fetch, same-place cache and fixed scenarios; Cedar policy/schema evaluation and Why evidence; sourced ventilation model; bilingual card/chart/messages; four-tool Strands chat and validated generation; public AWS deployment and clean-browser end-to-end proof. |
| P1, after P0 passes | Protected policy editor first; 06:30 school-local scheduled briefs second, optional email; per-classroom settings third. |
| P2, only with submission readiness protected | Read-only observability view; sourced purifier CADR input. |

Do not silently drop P0 when a prerequisite fails. Do not build sign-up/accounts, payments, WhatsApp/SMS, maps, hardware sensors, native apps, automatic worldwide regulation scraping or multi-agent orchestration.

### Hackathon delivery

Environmental Hacks, Bharat Builds Tour event 02, October 8–11 2026, Track 01 Air. User-supplied judging criteria: impact, purposeful AWS use, usability, working execution and a three-minute recorded video. AWS open-source usage **or** AWS deployment is required; target both with Cedar/Strands and AWS hosting.

Deliver a public deployed app, repository/README, three-minute demo video and AWS Builder Center blog. Verify student eligibility on AWS Builder Center. Exact cutoff and timezone are **unverified**; confirm the official event page rather than reuse the pasted countdown. Reserve two hours for submission. Human recording/uploading/publishing is not complete merely because scripts and drafts exist.

## Implementation operating rules

### Library-first and current documentation

Before each nontrivial module, search official docs and package registries for suitable existing libraries. Record current release/maintenance, permissive license, compatibility and package/bundle size in `DECISIONS.md`; pin actual chosen versions in lockfiles after the spike. Do not invent versions or rely on remembered APIs.

Use libraries for UI components, charting, forms, validation, i18n, timezone conversion, HTTP, retries, chat UI, logging, Lambda event parsing and AWS integration. Custom code is limited to ClearClass domain logic and documented gaps where no suitable equivalent exists.

### Official AWS skills and setup

Use the relevant installed official AWS skill before every AWS task: deployment/IaC, serverless, Bedrock, IAM, data, observability and billing. Verify OMP actually discovers skills; files alone do not prove discovery.

Confirm current toolkit README/quick-start commands before installation changes. Check maintained `aws-agents` and `deploy-on-aws`/`aws-serverless` plugins where compatible; do not blindly install Claude-specific plugins into OMP. Verify MCP by listing AWS Regions, then report discoverable skills. If MCP/plugin setup cannot work within 15 minutes, log the failure and use CLI plus official skills/docs. Do not claim MCP connectivity from configuration alone.

Historical setup evidence is recorded in CONTEXT.md. Current credentials, service permissions, model access and deployed inventory still require verification.

### Region, cost and security

- Use AWS profile **`sai`**, selected Region **`ap-southeast-2`**. Global school locations do not change deployment Region. The AWS MCP endpoint in `us-east-1` is not permission to deploy regional resources there.
- Original gate: confirm remaining credits, AWS plan/spend-limit status and email AWS Budgets alert before resources. On 2026-10-10 the user explicitly waived requiring a spend limit/alert and authorized bounded implementation spending, asking not to exhaust credits. Retain a $5 development-spend *review target* (not a technical cap); monitor reported credits/inventory and stop on unexpected burn. User can configure a low-dollar email alert in AWS Billing and Cost Management when convenient.
- One `clearclass` application stack in Sydney; SAM may create a packaging artifact stack. No duplicate experimental app stacks, NAT gateways, always-on endpoints, load balancers or provisioned databases.
- Inspect deployed inventory at each implementation-session start/end and after major deploys. Stop and investigate unexpected resources or credit burn.
- Report spend/remaining credits after major deploys and milestones with source/time/lag. If unavailable, say **unknown**, not $0. Avoid repeatedly calling potentially paid Cost Explorer APIs.
- Use least privilege: separate read/brief, chat and policy-write roles; scope S3 prefixes, DynamoDB tables, SSM parameters and the verified Bedrock model. Avoid wildcard resources unless the action requires them.
- No secrets in repository, logs, frontend bundle or persistent browser storage. API keys/admin secrets go in SSM SecureString, not plain Lambda environment values.
- Use bounded Bedrock input/output/turn counts, cached generated results, request caps and short logs. Seven-day CloudWatch retention by default; modest Lambda timeout/memory, no VPC.
- Offer inventory and teardown commands at handoff/submission; never tear down without permission.

### Git workflow

The directory was not a Git repository during planning. Before the first push, obtain the human's repository URL or authorization to create one under their authenticated identity. Use existing credentials; never request/display/store tokens.

Before the first commit, create `.gitignore` covering `.env*`, `node_modules/`, build outputs, virtualenvs/Python caches, `.aws-sam/`, `cdk.out/`, local MCP/config/credential files and other secrets. Inspect staged filenames and scan staged contents for secrets before **every** commit; findings block commit.

Default to focused tested commits on `main` after repository ownership is confirmed. Commit/push after each working milestone, not broken/untested slices; hold unfinished work back. Report module, commit message, hash and push result, and record them in CONTEXT.md.

Never force-push, rewrite history, delete branches, change Git config/remotes or change repository visibility without permission. Confirm public-repository requirements and visibility with the human.

## Architecture and stable contracts

### Runtime and deployment

- **Backend:** Python, one shared domain package, Strands, a maintained Cedar binding that supports authorization **and schema validation**, Powertools, Pydantic, HTTPX and pytest. Confirm exact package APIs/versions.
- **Packaging gate:** deploy a real Lambda spike before committing to the language. Verify Linux-compatible native dependencies, runtime/architecture, package size and model access. If native Python Cedar packaging fails the 15-minute spike, switch the entire backend to TypeScript with maintained Strands TS/Cedar WASM; prove that in Lambda too. Do not mix backend languages, emulate Cedar or claim local imports prove deployment.
- **IaC:** SAM, one reproducible `clearclass` stack in Sydney, explicit profile/Region. No LocalStack or `sam local` prerequisite; develop and verify application slices on AWS from the first slice. Pure logic tests may run locally.
- **API:** API Gateway HTTP API; separate brief/read, chat and policy-write Lambda functions sharing domain logic. Short, stateless, non-streaming chat; bound total execution to the HTTP API budget. AgentCore is not introduced without a documented constraint deviation and human approval.
- **Storage:** S3 for versioned policy/schema objects, snapshots and scenarios; DynamoDB on-demand for schools, cards and conditional request counters. TTL is cleanup, not freshness enforcement.
- **Frontend:** Next.js App Router/TypeScript, static-export-capable client; all runtime domain logic remains in Lambda. Amplify Hosting first. After 30 minutes of hosting problems, use private S3 plus CloudFront OAC/HTTPS, no Lambda@Edge. No runtime Next.js server actions, request-dependent server routes or default server image optimization in the static path.
- **Model:** The original preference was a low-cost Claude model; 2026-10-10 read-only catalog queries found only Claude inference profiles with destinations beyond Sydney. User approved a working in-Region alternative. Use on-demand Sydney-only `amazon.nova-micro-v1:0` for the spike, subject to verified bounded invocation and pricing/access; configure `BEDROCK_MODEL_ID` and restrict IAM to that model. Do not use cross-Region inference profiles or silently change Region. If no suitable model works, report the access blocker; the deterministic card still works but P0 agent is not complete. No paid model calls in unit tests.

### API contract

Freeze the response schema before frontend integration:

| Route | Behavior |
| --- | --- |
| `GET /locations?query=<text>&lang=en|hi` | Bounded place search with explicit selection. |
| `GET /schools` | Seeded fictional school/classroom templates. |
| `GET /schools/{id}/brief?locationId=<geonames-id>&scenario=<fixture>&lang=en|hi` | Location-aware daily card. Omitted locationId uses stored school location. |
| `POST /schools/{id}/chat` | Message, language, bounded history, locationId, scenario and current card/policy-set version. |
| P1 `GET /policy?packId=<id>` | Read selected pack. |
| P1 `POST /policy/validate`, `PUT /policy` | Pack ID, text and expected version; authenticated bounded validation/write. |

Use the school-scoped brief route from slice 1; no temporary `/brief` alias. School IDs are allowlisted templates. Location overrides are ephemeral previews, not public persistent school creation. Resolve selected location IDs server-side through provider get-by-ID; do not trust client coordinates, country, timezone or policy assignment.

Define Pydantic models, export JSON Schema and derive/check frontend response types with Zod runtime validation. Retain `schoolId`, `date`, `generatedAt`, `dataSource`, `dataAsOf`, `air`, `verdicts`, `ventilation`, `parentMessage.en` and `.hi`. Add:

- Location ID/name/coordinates/country/IANA timezone.
- Observation versus forecast provenance, model/grid coordinates, valid times, age/staleness, scenario ID.
- `air.referenceAqi`: scheme/value/provider/modelled; separate optional authoritative local AQI.
- `regulatoryCoverage: verified_local | reference_only | local_status_unknown`.
- Versioned policy set, source/rule evidence and model assumptions.
- Verdict `decision: allow | modify | deny`, separate `status: evaluated | insufficient_data | stale | unavailable`. Missing facts/default-deny are not evidence of an official pollution prohibition.

GRAP is nullable and not applicable outside verified jurisdiction. Never represent unknown as stage zero/clean air. Source/data adequacy qualifies advice; stale/unknown official state cannot yield definitive legal clearance.

Cache identity includes school/template, resolved location ID/coordinates, IANA timezone, local date, live/scenario, snapshot revision, all policy-pack versions and classroom/model configuration. Language may be omitted only when storing both languages. Never return another place's forecast, directive or parent message as fallback.

## Geographic portability: reuse, not a new platform

### Places and time

Use Open-Meteo's GeoNames-backed geocoding search/get-by-ID. Reuse HTTPX/Pydantic, shadcn Combobox and TanStack Query. Search from three characters, debounce 300 ms, return at most five results. Show city/admin area/country; require explicit selection and never silently pick the first ambiguous result.

This is approximate city/place selection, not guaranteed school-address precision. Do not build maps, a gazetteer, polygon/boundary database, reverse-geocoding stack or browser GPS flow.

Absent/empty search results are an empty state, not an exception. On lookup failure retain the previous selection without relabelling its card. A result missing usable coordinates/timezone is unusable, never defaulted to Delhi.

Use Python `zoneinfo` plus first-party `tzdata`; browser `Intl.DateTimeFormat` receives the explicit school timezone. In an all-TypeScript backend use a maintained IANA-aware library. Provider timezone metadata avoids adding geopy/timezonefinder/GIS. Dates and school hours use selected-location time, never Lambda's Region or browser time.

### Global forecasts and cache

Request Open-Meteo `domains=cams_global`, `timeformat=unixtime`, two forecast days and only necessary PM/reference-AQI variables. Convert each epoch independently through the IANA zone: fixed-offset local timestamps can mishandle DST transitions.

Expose CAMS Global's roughly 45 km spatial/three-hour source resolution and returned grid-center coordinates even when API arrays are hourly. These are coarse model estimates, not campus/roadside station measurements. Do not build forecasting models or national AQI converters.

Cache place records by provider ID and searches by normalized query. Forecast fetch interval defaults to 30 minutes per location/domain/time range; source validity and timestamp remain separate from retrieval/cache time. Rate-limit search/brief as well as chat below provider limits. On 429 use same-place cache or unavailable/backoff, not tight retries.

OpenAQ is an optional observation enhancement with an SSM-stored API key, not a global forecast dependency. Show observation gaps/staleness separately; do not blend modelled and measured values into one falsely precise reading.

Before deployment verify Open-Meteo service terms/licensing: the free endpoint is non-commercial with rate limits. Include GeoNames, Open-Meteo and applicable CAMS attribution/license links and disclose transformations. Commercial use needs an appropriately licensed endpoint and cost approval; CC BY data terms alone do not grant free API-service rights.

### Reference and local policy packs

Keep one Cedar evaluator and small versioned manifests under planned `backend/policies/packs/`:

1. `reference-school-activity`: project reference adaptation of cited published school guidance, usable globally with clearly qualified modelled U.S.-AQI inputs.
2. `in-delhi-grap`: verified authority clauses only for trusted registered school/jurisdiction assignments; disabled if current sources cannot be verified.

Manifest fields: pack ID/version, `reference_advisory | local_authority` basis, jurisdiction, source URLs/dates, expected index scheme, schema and policy object keys. No plugin framework or automatic regulation scraper.

The server loads the reference pack and adds local packs only when trusted stored-school jurisdiction and requested location match. A geocoder city result does **not** prove legal NCR membership. Unregistered locations, including arbitrary Delhi previews, use reference-only guidance. Additional jurisdictions require cited policy/configuration plus tests, not new handler code.

Return reference recommendations separately from applicable official restrictions. Verified official restrictions can tighten, never be relaxed by, reference advice. Unknown/stale local status leaves reference advice visible with a warning, not legal clearance. Display: **“Reference guidance; local school directives not integrated.”** Never infer legal coverage from language, country or AQI scheme.

Seed fictional Delhi, Bengaluru and London profiles; a fourth unseeded searched place must work without deployment. Keep EN/HI independent of location.

## Ordered implementation milestones

Complete and exercise each gate before proceeding. After a verified implementation milestone, update CONTEXT.md, scan staged secrets, commit/push the tested slice, report its URL/works/blockers and check spend/inventory. Optional milestones never delay mandatory submission preparation.

### M0 — setup, evidence and deployed packaging spike

1. Verify official skill discovery/MCP or document CLI fallback; current credentials, project/service restrictions, repository destination, credits/budget, inventory and exact cutoff.
2. Create DECISIONS.md; record current libraries, sources and geographic-scope revision. Obtain deployment cost approval.
3. In the single eventual stack deploy a minimal Lambda evaluating actual Cedar permit/forbid cases against a schema and running Strands with one bounded Bedrock call. Record runtime/architecture, compatible native dependencies, package size, actual model ID and invocation evidence.
4. Apply the language fallback above if required. Reuse the stack for M1, not duplicate infrastructure.

**Gate:** real Lambda result/logs prove Cedar authorization/validation and Strands/model execution. Local-only imports, placeholders or mocked deployment results do not pass.

### M1 — first deployed place/air-data slice

Planned files: `backend/src/domain/air.py`, `backend/src/handlers/brief.py`, `backend/fixtures/`, `infra/template.yaml`, `scripts/deploy.sh`, `scripts/seed.py`, `scripts/smoke.py`. Use equivalent TS modules only if M0 chose the all-TS path. No incumbent application modules exist; reuse libraries for parsing, HTTP and validation.

Resolve selected places, fetch modelled current/hourly PM2.5/PM10 and reference-index data, normalize PM to µg/m³ and cache every validated successful snapshot in S3 by location. Preserve source response/provenance and UTC valid instants. Slice school hours in the selected IANA timezone.

Never transform an instantaneous PM reading or US/European AQI into official CPCB AQI. CPCB requires pollutant/averaging/eligibility rules absent from a PM-only forecast. Show concentrations and unknown official local AQI.

Seed `severe-day`, `very-poor-day`, `moderate-day`, `good-day` synthetic profiles with declared reference scheme/concentrations. Their names are demo labels, not universal local categories. Instantiate fixed local dates/school-hour offsets in each demo location's timezone. Validate monotonic instants, finite nonnegative values and coverage. Do not relabel Delhi data as London's actual weather.

Failure behavior:
- Provider timeout/malformed/stale response: selected place's latest valid cache, original timestamp, cached/stale label.
- No same-place cache: explanatory unavailable card plus explicit “Try a synthetic scenario”; never silently switch place/mode or blank the screen.
- Unknown school/scenario/location: 404; malformed request: 400; unavailable location resolution: 503.
- Bounded retries/timeouts; log request/location/mode, no secrets or prompts.

**Gate:** deployed route works for Delhi, Bengaluru, London and a fourth search-only place without code changes. Fixed scenarios repeat. Failure fetching London after Delhi returns London's cache or unavailable, never Delhi's values. Ambiguous/no-result/unusable searches never silently change selection. Capture deployed smoke evidence.

### M2 — sourced Cedar and ventilation domain

Planned files: `backend/policies/packs/`, `backend/config/ventilation.json`, `backend/src/domain/policy.py`, `backend/src/domain/ventilation.py`, `backend/tests/`.

**Cedar reference policy:** use the EPA/AirNow school outdoor-activity guide and named U.S.-AQI categories. Distinguish ordinary activity from prolonged/intense sport; map source-backed breaks, reduced intensity, indoor relocation/rescheduling and sensitive-pupil caveats. The guide provides no exact universally safe outdoor duration: do not invent minutes, age bans or cancellation thresholds.

Label numeric input **“Open-Meteo/CAMS forecast — U.S. AQI reference, not official local AQI.”** Keep pollutant concentrations/units visible. This is a project adaptation outside its issuing jurisdiction. WHO guidelines are not school closure rules; AQI methods are not internationally harmonized.

**Local overlay:** retrieve current official CAQM schedule/orders before encoding Delhi clauses. Record URL, issue/effective/revocation/access dates, clause/page and jurisdiction. GRAP activation is an authority action, not a locally inferred AQI threshold. If current clauses cannot be verified, keep the overlay disabled with a blocker and ship working reference guidance with an explicit local-coverage limitation. Do not fabricate official restrictions.

**Evaluation:** typed cohort/action/school schema; baseline permits and explicit forbids, deny by default; stable namespaced engine-policy IDs mapped to `@id`/`@source`. Evaluate normal and source-defined modified alternatives separately; choose the least restrictive permitted alternative deterministically as allow/modify/deny, plus independent evidence status. No-match means no applicable permission, not an invented matched forbid. Show sensitive-pupil caveats without collecting medical data. Indoor alternatives require suitable indoor air and cannot override school closure.

Load validated S3 pack revisions at invocation with short cache; record policy-set version. Invalid edits retain last valid pack; missing initial reference policy returns unavailable, never allow. Test source category boundaries, activity intensity, missing/scheme-mismatched index, forbid precedence, stale/foreign/inactive local packs and all scenario/cohort/activity combinations.

**Ventilation:** source every constant—open/closed ACH, penetration, deposition, occupant CO2 generation, outdoor CO2, comfort/concern thresholds—with units, issuer/jurisdiction, revision/page, citation and uncertainty. These values are not yet verified; no silent guessed constants or Indian-legal-limit claims. Hypothetical classroom/initial assumptions are permitted if explicit; missing essential inputs produce cannot estimate, not invented values.

Use five-minute steps, default 08:00–14:30 in school-local time, configurable school hours. Equations:

- PM: `dC/dt = λ P C_out − (λ + k) C`.
- CO2: generation converted consistently into ppm/hour plus `λ(C_out − C)`.

Use analytic exponential updates for constant forcing within each step, including zero-removal limit and correct volume-to-ppm conversion. Record initial concentrations and occupancy. Reuse the same equations everywhere; location changes forcing/time, not physics.

Search a bounded set of short flush intervals allowed by a separately sourced project ventilation policy. Sports AQI advice does not justify window-opening thresholds. Prefer CO2-feasible schedules minimizing integrated PM exposure; explicitly report infeasible constraints. If all opening is disallowed, return closed windows and rising-CO2 warning, not safety assurance. Every result says **estimated from a model, not measured** and exposes assumptions.

**Gate:** Cedar fixture/boundary/error tests; ventilation steady-state, zero-removal, dimensions, occupancy/outdoor-PM monotonicity, prohibited-opening/infeasibility tests; timezone/DST/non-hour-offset tests. Test London dates on both sides of DST. Domain logic passes before agent work.

### M3 — complete deterministic brief

Combine air, policy and ventilation into the frozen schema, store versioned cards in DynamoDB and render deterministic EN/HI templates before generation. Distinguish normal/modified/indoor/cancelled actions and insufficient information; an outdoor prohibition does not prove indoor schooling is permitted.

Official orders carry dates/jurisdiction; historic cache never masquerades as a current order. Synthetic stage inputs remain visibly synthetic. Do not default unknown official state to clean air.

**Gate:** every scenario card shows exact rule/source, pack version, data age, model caveats and translated actions. Missing live/model services cannot erase deterministic decisions based on valid available inputs.

### M4 — deployed daily card UI

Planned root `frontend/`. Reuse current compatible Next.js, shadcn/ui/Tailwind/lucide, shadcn/Recharts chart, TanStack Query, Zod, i18next and shadcn Combobox. Search a maintained chat UI component/hook before building one.

The surface is a calm high-contrast staff operating tool: large readable type, restrained status colors plus text/icons, no decorative dashboard metrics. Order:

1. Place, school/classroom template, local date/timezone, data/scenario badge, policy-coverage qualifier and actionable headline.
2. Cohort/activity verdicts; keyboard-accessible Why disclosure with actual Cedar text, ID, pack/version and source.
3. PM forecast with µg/m³ axis labels, shaded permitted flush windows and legend; model warning and assumptions.
4. Parent EN/HI tabs and copy control.
5. Ask panel with suggested prompts.

Location change clears old card/actions/copy/chat immediately until matching data arrives; never display a new city header with old recommendations. Same-location refresh may retain explicitly labelled previous data. Store selected location ID in URL; language does not change jurisdiction. Copied messages/chat preserve applicable scenario/reference qualifiers.

Mobile stacks cohort groups rather than clipping a wide table. Provide chart text equivalent, touch targets, focus states, Hindi-capable font, no color-only distinctions, initial skeleton, retry, no-observation and assistant-unavailable states. Never bundle or persist secrets.

**Gate:** actual deployed desktop/phone browser walkthrough; all scenarios/languages, Why/assumptions, clipboard, timestamps, location-change reset and deep-link refresh. Record visual evidence, not merely a build result.

### M5 — bounded grounded Strands chat and messages

Exactly four tools: `get_school_profile`, `get_air_quality`, `evaluate_policy`, `plan_ventilation`. Wrap tested domain logic and bind school/template, resolved location/timezone, scenario, policy set and card server-side. The LLM cannot select jurisdiction or silently switch city.

Validate grade/cohort and requested local time/date. If grade naming cannot map through the profile, ask age/cohort rather than imposing Indian class mapping worldwide. Unsupported forecast dates return insufficient information.

Prompt: lead with yes/no/modify/unable-to-determine; brief tool-backed reason and alternative in EN/HI; preserve reference/official qualifier and follow authorities. Never override or soften verdicts. User/history/tool strings are untrusted data; escape markup and allowlist citation URLs. A London question must not cite Delhi GRAP.

**Generation safety:** keyword/substring checks do not prove semantic consistency. Request structured fact/action references, validate every reference against the current tool result and render all safety actions/numbers through deterministic bilingual clauses. LLM can select/reorder valid clauses and choose non-factual greetings/closings from an approved phrase set. Reject unsupported facts/free-text safety claims. Record this conservative restriction versus unrestricted prose in DECISIONS.md.

On mismatch/model failure use template parent message or grounded answer with assistant-unavailable notice. Never display unvalidated advice.

Bound total request duration, history/input size, tokens and agent work: at most four tool calls and two model turns, returning deterministic fallback on exhaustion. Cache output by full card/location/policy version and language. No model calls in unit tests; use saved fixtures/mock responses and only a few representative paid EN/HI checks.

Apply DynamoDB atomic per-client and global daily invocation counters with expiry checks, charged before inference; fail closed if counter storage fails. Also API Gateway throttling and reserved chat concurrency. IP limits are abuse friction, not authentication. Configure limits within the approved cost envelope.

**Gate:** EN/HI sports query matches tools; prompt injection cannot change verdicts; wrong number/contradiction/reference fixtures rejected; provider/Bedrock failure preserves card; request cap gives 429 without inference; city switch cannot reuse old chat context.

### M6 — P1 editor, scheduling and classroom settings

Only after P0 gates pass:

1. **Policy editor:** shadcn textarea, selected pack/version/jurisdiction, read/validate/save. Token in SSM, supplied by operator in Authorization header and held in memory only. Allowlist pack IDs and construct S3 keys server-side; text editing cannot change authority/jurisdiction metadata or arbitrary prefixes. Bound payloads, validate Cedar schema, use ETag/version optimistic concurrency: 409 stale, 422 invalid, 401/403 unauthorized. Invalidate only affected cards. Demonstrate a project-reference scenario change, never relax official directives for spectacle.
2. **Morning scheduler:** only persisted seeded schools; EventBridge 06:30 with each school's IANA timezone, resources still Sydney. Previews create no schedules. Idempotency keys school/location/local date/revision; retries cannot repeat model spend. Verify service DST behavior. Email only after explicit opt-in and SES verification.
3. **Classroom settings:** validate volume/headcount, include configuration version in cache identity. Persistent changes need admin gate; ephemeral what-if inputs do not mutate profiles.

**Gates:** unauthorized/invalid/stale policy writes never mutate; valid edit flips a relevant fixture verdict without deployment while other packs/authority status stay unchanged. India/London schedules remain 06:30 local across DST. Classroom changes visibly change CO2 estimates.

### M7 — optional P2

After P0/P1 and submission readiness, add read-only structured request/tool timing observability without secret/prompt leakage or verbose paid trace loops. Add sourced purifier PM removal term `CADR/V`, dimensionally tested; never claim CO2 removal. Mark unbuilt features deferred and omit them from architecture claims.

### M8 — submission and final proof

README: actual URL, architecture, one-command reproducible deploy, AWS/OSS purpose, data attribution, limitations, setup and teardown. Commit/push README, DECISIONS.md, demo script and blog draft only after actual checks and staged-secret scan.

`docs/demo-script.md` must specify exact fixtures/clicks:

| Time | Segment |
| --- | --- |
| 0:00–0:20 | School morning decision/problem hook. |
| 0:20–1:10 | Card, cohort decisions and Why rule/source. |
| 1:10–1:40 | Ventilation chart, flush windows, estimated label/assumptions. |
| 1:40–2:10 | Grounded EN/HI questions. |
| 2:10–2:35 | Policy flip if shipped; otherwise scenario/location contrast. |
| 2:35–3:00 | Actual architecture; rules decide, LLM explains. |

Use `docs/blog-draft.md` for an honest AWS Builder Center account of problem, implementation and tradeoffs. Human records/uploads video and publishes blog; track actual public links separately from drafts. Verify student eligibility and repository public status with human, not automatic visibility changes.

Run final deployed smoke tests and a clean-browser walkthrough; report URL/works/gaps, inventory, spend and credits with timestamps/unknowns. Offer teardown commands without running them. Remove unbuilt services from the demo architecture.

## Geographic acceptance matrix

These are required future implementation checks, **not checks already run**:

1. Delhi, Bengaluru, London and a fourth unseeded selected place resolve without redeploy.
2. Identical synthetic reference inputs yield identical reference guidance across countries.
3. Only a verified Delhi school assignment adds GRAP; switching that school template to Bengaluru removes the overlay. If overlay is disabled for missing sources, test explicit reference-only behavior instead and retain the blocker.
4. London school hours and 06:30 schedule remain local across DST; UTC offsets change correctly. Non-hour timezone offsets work.
5. Provider/cache failure never leaks another location's card.
6. Place change resets chart, Why/copy provenance and chat together.
7. Unknown jurisdiction is reference-only, never legally cleared.

## Progress and handoff protocol

CONTEXT.md is the live ledger, not this roadmap. Use `not_started`, `in_progress`, `blocked`, `verified`, `deferred`. Verification requires dated commands/scenarios and observed output; configuration, code presence and agent claims alone are insufficient.

After every meaningful verified slice and at handoff, record changed files, exact checks/results, deployment names/URLs, commit/push status, spend/credit evidence, decisions, blockers and next actionable command. Maintain an append-only session log and current milestone/resource/cost tables. Never invent URLs, zero spend, credential freshness or empty inventory.

At resume: read both documents, inspect intervening changes, load relevant AWS skill, verify actual state and choose the earliest actionable milestone. Respect human-reported failures instead of rerunning them merely for confirmation. No background progress is implied between sessions.

## Source register and remaining research gates

Sources were consulted during planning; confirm current contracts/versions before use:

- [Official AWS Agent Toolkit](https://github.com/aws/agent-toolkit-for-aws) and [user guide](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/).
- [Strands Lambda deployment](https://strandsagents.com/docs/user-guide/sdk/deploy/deploy_to_aws_lambda/) and [Lambda Python packaging](https://docs.aws.amazon.com/lambda/latest/dg/python-package.html).
- Cedar [authorization](https://docs.cedarpolicy.com/auth/authorization.html), [validation](https://docs.cedarpolicy.com/policies/validation.html), [schema](https://docs.cedarpolicy.com/schema/schema.html).
- [Bedrock model/Region compatibility](https://docs.aws.amazon.com/bedrock/latest/userguide/models-region-compatibility.html); actual in-Region execution/access remains unverified.
- [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports).
- Open-Meteo [geocoding](https://open-meteo.com/en/docs/geocoding-api), [air quality](https://open-meteo.com/en/docs/air-quality-api), [terms](https://open-meteo.com/en/terms), [licence](https://open-meteo.com/en/licence); [Python zoneinfo](https://docs.python.org/3/library/zoneinfo.html).
- [EPA/AirNow school activity guidance](https://document.airnow.gov/air-quality-and-outdoor-guidance-for-schools.pdf), [AQI basics](https://www.airnow.gov/aqi/aqi-basics/), [WHO risk communication](https://www.who.int/news-room/questions-and-answers/item/air-pollution-personal-interventions-and-risk-communication).
- CAQM [orders](https://caqm.nic.in/landingpage/pages/grap/grap-orders) and [schedules](https://caqm.nic.in/landingpage/pages/grap/grap-schedule). Current operative schedule text/school clauses were not verified; do not encode search snippets as official policy.
- [CPCB calculation methodology](https://cpcb.gov.in/displaypdf.php?id=bmF0aW9uYWwtYWlyLXF1YWxpdHktaW5kZXgvSG93X0FRSV9DYWxjdWxhdGVkLnBkZg): averaged pollutant subindices/eligibility, not instantaneous PM; overall AQI requires at least three pollutants including PM2.5 or PM10.
- [England DfE classroom ventilation guidance](https://www.gov.uk/government/publications/ventilation-and-air-quality-in-education-and-childcare-settings/ventilation-and-air-quality-in-education-and-childcare-settings) and [CDC ventilation FAQ](https://www.cdc.gov/niosh/ventilation/faq/index.html). Context-specific CO2 reference values are not universal Indian legal limits. Exact ACH, penetration, deposition and child-generation constants still need scientific citations.

Remaining gates: current toolkit discovery/connectivity, repository ownership, credits/budget/cost approval, deployed inventory, Bedrock regional access, packaging, source/constant validation, exact event deadline and student/publication requirements. Do not label these completed until evidence exists.
<!-- END ClearClass implementation plan -->
