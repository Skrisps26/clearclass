# ClearClass progress and handoff context

This is the live evidence ledger. `AGENTS.md` contains the implementation roadmap. Update this file after each meaningful verified slice and at every handoff. Record facts with source/date; `unknown` is not zero, empty, or complete.

## Project identity and current scope

- Product: ClearClass, a location-agnostic school air-quality decision-support tool for staff.
- Authorized scope: arbitrary supported place search, global reference forecasts/advisory, explicitly verified local policy packs. Delhi is an optional local overlay, not a global default.
- Geographic research examples: Delhi, Bengaluru and London, with an additional unseeded place in acceptance tests.
- Languages: English/Hindi. AWS experience: new experience; AWS CLI profile: `sai`; selected AWS Region: `ap-southeast-2`.
- School local time: selected place's IANA timezone; not fixed to Delhi/Sydney.
- Start/resume by reading [AGENTS.md](AGENTS.md), [DECISIONS.md](DECISIONS.md) and this ledger. `SPEC.md` is planned only if the original brief becomes available; the original is not a file in this directory.
- Policy semantics: global reference advice is not local law; only verified jurisdiction-matched packs carry local authority status. No worldwide regulatory-coverage claim.

## Status legend

- `not_started`: no work/evidence yet.
- `in_progress`: work has started; listed gate not passed.
- `blocked`: a named prerequisite prevents the milestone.
- `verified`: dated command/scenario and observed output prove the acceptance gate.
- `deferred`: explicitly postponed; never imply shipped.

Code/file presence or planned architecture alone never qualifies as `verified`.

## Milestones

| ID | Status | Acceptance gate | Evidence / next action |
| --- | --- | --- | --- |
| M0 Setup and packaging spike | `verified` (2026-10-10) | Verify official skill discovery/MCP fallback, current credentials/access, repository/cost gates; prove Cedar+schema+Strands+Bedrock in real Lambda. | `sam validate --lint` and Python 3.12 SAM build succeeded; deployed `clearclass-spike` in Sydney. `.venv/bin/python scripts/smoke_spike.py` returned real Cedar schema permit/forbid/default-deny; `--model` returned `ready` through Strands+Sydney Nova Micro. M1 next. |
| M1 Place and air-data slice | `not_started` | Deployed place selection and global model forecast/cache/scenario work for seeded and unseeded place; failure never cross-leaks locations. | No application files/deployment/URL established. |
| M2 Cedar reference/local policies and ventilation | `not_started` | Cited Cedar reference guidance and source-backed portable mass-balance tests; no invented local law or constants. | Current CAQM clauses and ventilation constants not verified. |
| M3 Deterministic daily brief | `not_started` | Versioned brief combines air, policy evidence, ventilation and deterministic EN/HI messages. | No API/card exists. |
| M4 Daily card UI | `not_started` | Deployed mobile/desktop card, location reset, provenance, scenario, Why and copy interactions. | No UI exists. |
| M5 Strands chat | `not_started` | Bounded bilingual chat grounded in the same school/location/time/card; caps and failure paths proven. | No agent or Bedrock invocation verified. |
| M6 P1 editor/scheduler/rooms | `not_started` (conditional after P0) | Protected pack-aware editor, school-local scheduling and classroom configuration. | No P1 work exists. |
| M7 P2 observability/CADR | `not_started` (conditional after P1) | Optional sourced work only after P0/P1/submission readiness. | No P2 work exists. |
| M8 Submission | `not_started` | Clean-browser deployed smoke, actual README/demo/blog artifacts, public URLs and resource/cost handoff. | Public repository exists but no code pushed, no app URL, video or blog evidence. |

## Historical setup evidence — not current verification

These results were reported in the prior setup session. They are historical CLI outputs, not evidence of current credentials/MCP/model access or of ClearClass implementation:

- AWS CLI v2 `2.37.12` installed under `/home/skrisps/.local/bin`; PATH addition was appended to `~/.bashrc`.
- Profile `sai` configured to `ap-southeast-2`; browser-based `aws login` exited successfully.
- Prior `aws sts get-caller-identity --profile sai` returned a project identifier and an assumed-role ARN ending in `AccountFullAccessRole`; do not publish the identifier.
- Prior `aws configure agent-toolkit --yes --region us-east-1 --profile sai` reported 23 default AWS skills installed under `~/.agents/skills/` and global MCP entries for Codex/Cursor/Gemini/OpenCode. OMP itself was not part of that detected automatic configuration.
- Earlier follow-up configured `.mcp.json` with `aws-mcp` and `AWS_MCP_PROXY_PROFILES=sai`; `.mcp.json` presence does not prove a live OMP connection. The managed MCP endpoint is `us-east-1`; all regional ClearClass deployment remains `ap-southeast-2`.
- A previous `aws agent-toolkit list-available-skills --region us-east-1 --profile sai` returned catalog entries. This was catalog verification, not a test of every installed skill or OMP's skill discovery.

## Research evidence and boundaries

### Public geocoding/forecast API exercise (planning-time evidence)

A read-only scout exercised public Open-Meteo endpoints; no repository files, AWS resources or authenticated/billable calls were created:

- Bengaluru geocoding returned a selected-place candidate with WGS84 coordinates and `Asia/Kolkata`.
- Reykjavik geocoding returned Reykjavik and airport candidates with `Atlantic/Reykjavik`; explicit selection is required for ambiguous results.
- One-day CAMS Global requests succeeded for both places and returned 24 hourly PM rows with snapped grid-center coordinates differing from the requested city coordinates.
- A nonsense query returned success with no result list; an invalid timezone produced HTTP 400.
- These two public API requests prove feasibility of those API paths only, not universal place coverage, ClearClass behavior, app deployment, accuracy, uptime or legal policy coverage.

Sources: [Open-Meteo geocoding](https://open-meteo.com/en/docs/geocoding-api), [air quality](https://open-meteo.com/en/docs/air-quality-api), [terms](https://open-meteo.com/en/terms), [licence](https://open-meteo.com/en/licence), [GeoNames](https://www.geonames.org). Free API terms restrict use to non-commercial use and have request limits; confirm project classification/licensing and pay for an appropriately licensed service if needed. Forecast model is coarse (~45 km/three-hour CAMS Global source resolution); returned hourly rows are not monitor-grade measurements. Attribute GeoNames, Open-Meteo and CAMS, disclose transformations, use Unix timestamps plus IANA timezone handling.

### Air/policy research boundaries

- [WHO risk communication](https://www.who.int/news-room/questions-and-answers/item/air-pollution-personal-interventions-and-risk-communication): AQIs are not internationally harmonized. Keep the scheme named and pollutant concentrations/units alongside it.
- [EPA/AirNow school outdoor-activity guidance](https://document.airnow.gov/air-quality-and-outdoor-guidance-for-schools.pdf): provides a reusable activity/intensity/break/alternative pattern but no universal safe outdoor duration. Do not invent minutes or apply it as local law.
- Open-Meteo `us_aqi` may be shown only as **modelled U.S.-AQI reference forecast, not official local AQI**. Do not reinterpret it as CPCB/UK/other authority index.
- [CPCB calculation method](https://cpcb.gov.in/displaypdf.php?id=bmF0aW9uYWwtYWlyLXF1YWxpdHktaW5kZXgvSG93X0FRSV9DYWxjdWxhdGVkLnBkZg): National AQI uses pollutant averaging/eligibility and overall AQI needs at least three pollutants including PM2.5 or PM10. A PM-only instantaneous model forecast is not CPCB AQI.
- CAQM [orders](https://caqm.nic.in/landingpage/pages/grap/grap-orders) and [schedule](https://caqm.nic.in/landingpage/pages/grap/grap-schedule) were consulted; a usable current operative schedule/school clauses were not verified. GRAP stage is an authority action and must not be inferred locally from AQI. Keep Delhi overlay disabled until authoritative text, timestamps and jurisdiction are validated.
- [DfE classroom ventilation](https://www.gov.uk/government/publications/ventilation-and-air-quality-in-education-and-childcare-settings/ventilation-and-air-quality-in-education-and-childcare-settings), [CDC ventilation FAQ](https://www.cdc.gov/niosh/ventilation/faq/index.html), [Python zoneinfo](https://docs.python.org/3/library/zoneinfo.html). Published CO2 bands are context-specific and are not universal Indian legal limits. Exact ACH, penetration, deposition, occupant generation and thresholds remain unverified; do not implement guessed numbers.

## Prerequisites, blockers and human gates

| Gate | Current status | Required evidence/action |
| --- | --- | --- |
| Git repository/remote/owner | `public destination created; no local Git` | User authorized creation; `gh repo create Skrisps26/clearclass --public` returned https://github.com/Skrisps26/clearclass on 2026-10-10. No local git init, commit, remote or push yet; inspect staged files/secrets before first tested milestone commit. |
| Exact event deadline/timezone | `unknown` | [Official rules](https://www.wemakedevs.org/aws/rules) require submission before deadline on event page/form; its clock time/timezone did not appear in accessible page text. Video must be uploaded to YouTube, public/unlisted, under three minutes; public repo and short writeup required. |
| Current AWS credentials/service permissions | `partially verified` | STS succeeded 2026-10-10; specific CloudFormation/Lambda/Bedrock invoke/IAM permissions unproven. |
| Current skill discovery/MCP connection | `partially verified` | Locally installed skills read; OMP MCP tools are not exposed in this session, so CLI plus official skills/docs is the documented fallback. Config alone is not connection evidence. |
| Bedrock model in-region access | `approved alternative; invocation pending` | User prefers Claude but approves a working alternative given known cross-Region Claude profiles. Sydney-only on-demand `amazon.nova-micro-v1:0` is configured for the M0 spike; actual access/invocation pending. |
| Account plan, remaining credits, AWS spend limit and deployed inventory | `partially verified` | `get-account-plan-state` returned active FREE/$100 remaining credits 2026-10-10; human waived spend-limit requirement. CloudFormation/Lambda/API Gateway/DynamoDB/S3 initial queries empty but are not a complete inventory. |
| Email budget alert | `not configured/verified; user waived gate` | No visible budget details in CLI; user said a spend limit was not required. Recommend an email alert later; do not claim one exists. |
| Deployment cost envelope | `authorized bounded spend` | User explicitly waived requiring spend limit/email alert, asked not to exhaust credits. Retain earlier $5 development-spend review target (not hard cap), check credits/inventory after deployment and stop on unexpected burn. |
| Open-Meteo commercial-use classification | `conditional non-commercial demo` | Current ad-free educational hackathon demo fits examples in provider terms; do not add subscriptions/ads/promotion. Reassess before commercial use; attribution and request caps required. |
| OpenAQ key | `optional; absent/unverified` | Not required for P0; only if measured station observations become necessary, use human-provided key via SSM, never chat/files. |
| SES email preference/verification | `optional; absent/unverified` | Ask only if optional email delivery is pursued. |
| CAQM operative order/schedule | `blocked for local overlay` | Retrieve and validate current official text, effective/revocation times and jurisdiction before enabling pack. Reference pack work remains possible. |
| Scientific ventilation constants | `blocked for numeric model` | Source each value with units, applicable context and uncertainty; if unavailable report cannot estimate rather than inventing. |
| Student verification / public demo/blog | `unknown` | Human verifies Builder Center eligibility, records/submits the video and publishes the blog; capture actual links. |

Do not store passwords, keys, authorization headers or personal email addresses in this ledger.

## Resource and cost inventory

Partial read-only inventory checked 2026-10-10: CloudFormation stacks, Lambda functions, API Gateway HTTP APIs, DynamoDB tables and S3 buckets returned `[]`. Other resources/global-service inventory was not checked. **Partial absence does not prove a completely empty project.**

| Stack/resource | Region | Name/ID | URL | Status | Last verified |
| --- | --- | --- | --- | --- | --- |
| `clearclass` | `ap-southeast-2` | Lambda `clearclass-spike`, IAM role, 7-day log group | no public URL yet | `CREATE_COMPLETE`, Cedar/Bedrock Lambda smoke passed | 2026-10-10T21:26Z |
| SAM-managed artifact stack | `ap-southeast-2` | bucket `aws-sam-cli-managed-default-samclisourcebucket-zy8sytzlsrsu` | internal only | Created by `sam deploy --resolve-s3`; inspect/retain for future deploys | 2026-10-10 |
| ClearClass public application | `ap-southeast-2` | API/frontend not deployed yet | none | `not_started` | 2026-10-10 |

| Timestamp | Source | Spend so far | Credits remaining | Billing lag / caveat |
| --- | --- | --- | --- | --- |
| 2026-10-10T21:26Z | `aws freetier get-account-plan-state` | `unknown` (not $0; billing lag) | $100 reported remaining, active FREE plan | Unchanged credit report shortly after deploy does not prove zero cost. $5 operational review target, not hard cap. |

## Session and milestone log (append-only)

### 2026-10-10 — roadmap and location research (prior session)

- **Module/files:** planning only; approved documentation targets `AGENTS.md` and `CONTEXT.md`. No app code, infrastructure or deployment changed.
- **Research:** read official toolkit/Strands/Cedar/Bedrock/Lambda/Next.js/Open-Meteo/WHO/EPA/AirNow/CPCB source guidance; public Open-Meteo GeoNames/CAMS calls were exercised for Bengaluru and Reykjavik as above.
- **Outcome:** design changed from Delhi-only to global geocoder-supported locations with a universal reference advisory plus jurisdiction-matched local overlays. No local GRAP pack enabled by assumption.
- **Push/commit/deployment:** none. Directory was not a Git repository; no app URL.
- **Spend/credits:** not checked; unknown.
- **Open blockers:** live MCP/credentials/model access, repository, credits/budget/inventory, event cutoff, commercial API entitlement, current CAQM schedule and ventilation constants.
- **Next action:** when implementation is authorized, verify gates in M0; create DECISIONS.md and preserve the supplied SPEC.md before building. Do not deploy until cost envelope and Region/permissions are verified.

### 2026-10-10 — M0 local implementation and AWS preflight

- **Module/files:** `DECISIONS.md`, `.gitignore`, `backend/requirements.txt`, `backend/src/spike.py`, `backend/tests/test_spike.py`, plus roadmap/context status edits. Local `.venv/` and `.aws-sam/spike-package/` are ignored build artifacts.
- **Read-only AWS:** STS identity succeeded in `ap-southeast-2`; Free Tier plan ACTIVE with $100 remaining credits. Sydney CloudFormation/Lambda/API Gateway/DynamoDB/S3 queries returned empty arrays, not a complete resource inventory. `budgets describe-budgets` produced no visible result; email alert unverified. The installed local AWS skills are readable; OMP MCP invocation was not available through the exposed tools; CLI plus official documentation used.
- **Model routing:** `list-foundation-models` shows Claude Haiku 4.5/5.5 as profile-only. `list-inference-profiles` shows `au.` Haiku routing to Sydney and Melbourne; no single-destination system profile from query. `amazon.nova-micro-v1:0` appears as Sydney `ON_DEMAND`; access/invocation and cost unverified. Do not treat model listing as invocation.
- **Local verification:** `.venv/bin/python -m unittest discover -s backend/tests -v` ran three Cedar schema/permit/forbid/default-deny tests successfully. `pip install` with Python 3.12 and manylinux 2.34+2014 wheel tags produced a native x86_64 dependency tree with 5,595 files, 101,078,828 uncompressed bytes and 43,241,209 zip bytes; first single-platform pip attempt could not find Cedar; adding manylinux2014 resolved it. `sam validate --lint` passed; `sam build` with local Python 3.12.13 succeeded. Actual SAM build: 4,546 files, 87,204,444 uncompressed bytes, 37,565,403 zip bytes, Cedar CPython 3.12/manylinux2014 wheel. Packaged Python 3.12 ran `handler({\"mode\":\"cedar\"}, None)` and returned validation/allow/forbid/default-deny all true with no model call; packaged Strands `BedrockModel` constructed with Nova Micro without invocation. None of this proves Lambda runtime or Bedrock access.
- **Deployment/commit:** no AWS deployment or Git commit/push; no app URL. **Spend:** not inspected; credits report is not spend. **Next action:** user confirms spend limit and email budget alert, then run a real Sydney Lambda and bounded Nova invocation; evaluate M0 gate before M1. No M1 gate passed.
- **Human gates resolved after preflight:** user prefers Claude but accepts working Sydney-only alternative (Nova Micro candidate); chose conditional $5 spend-target approval **after** checking alerts; authorized a public GitHub repository. `gh repo create Skrisps26/clearclass --public` returned https://github.com/Skrisps26/clearclass; no local Git/commit/push. `sam validate --lint` passed for `infra/template.yaml`. No AWS resources created.


### 2026-10-10 — M0 deployed packaging gate

- **Module/files:** `infra/template.yaml`, `backend/requirements.txt`, `backend/requirements.lock`, `backend/src/spike.py`, `backend/tests/test_spike.py`, `scripts/requirements.txt`, `scripts/smoke_spike.py`, `.gitignore`, `DECISIONS.md`.
- **Commands/results:** `sam validate --lint` valid; `sam build` Python 3.12 x86_64 succeeded (locked rebuild also passed). `sam deploy --stack-name clearclass --resolve-s3 --region ap-southeast-2 --profile sai` created Lambda, IAM role, seven-day log group and ancillary SAM-managed artifact bucket/stack. `.venv/bin/python scripts/smoke_spike.py` → “Verified deployed Cedar/schema and cedar path”; `--model` → model response `ready`, “Verified deployed Cedar/schema and model path”. First smoke attempt lacked `botocore[crt]` required by AWS-login credentials; added separate local smoke dependency and reran successfully. No assertion that local-only proof substitutes for deployed invocation.
- **Observed model:** Strands `BedrockModel` with `amazon.nova-micro-v1:0`, `ap-southeast-2`, max_tokens 64, non-streaming; one explicit billable smoke call. Preferred Claude regional path unavailable without profile routing beyond Sydney; user approved working alternative.
- **Resources:** `clearclass` CloudFormation status `CREATE_COMPLETE` with Lambda `clearclass-spike` and no public URL. Managed SAM artifact bucket `aws-sam-cli-managed-default-samclisourcebucket-zy8sytzlsrsu`. Initial inventory was empty for selected services; post-deploy stack resources list has Lambda, IAM role and log group. Avoid deleting resources without user approval.
- **Credits/spend:** Free plan returned $100 remaining at 2026-10-10T21:26Z, unchanged shortly after deployment; actual spend unknown due billing lag. User waived budget/spend-limit prerequisite but requested bounded usage; $5 review target retained.
- **Git:** public empty repository https://github.com/Skrisps26/clearclass created; no commit/push at time of this entry. Next: secret-scan and push tested M0 slice, then implement M1 global place/air path.

## Update protocol

For each session/milestone append a dated entry with: milestone, changed files, exact commands and input scenario, observed result, deployed stack/URL/Region, test or browser evidence, commit hash/push result, spend/remaining-credit source/time/lag, decisions/deviations, blockers and next command. Update only statuses supported by new evidence. Report the real deployed inventory before/after sessions and major deploys. Never mark implementation verified from a plan, mock, config file, background job or stale historical CLI output alone.
