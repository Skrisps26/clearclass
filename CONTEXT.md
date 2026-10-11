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
| M1 Place and air-data slice | `verified` (2026-10-11) | Deployed place selection and global model forecast/cache/scenario work for seeded and unseeded place; failure never cross-leaks locations. | Public [Sydney API](https://04ixg1iqd4.execute-api.ap-southeast-2.amazonaws.com) smoke returned CAMS Global snapshots for Delhi, Bengaluru, London and search-only Reykjavik (IDs 1273294/1277333/2643743/3413829), 16 synthetic cards, metadata/errors; 25 domain/route tests include same-place stale fallback. M2 next. |
| M2 Cedar reference/local policies and ventilation | `verified` (2026-10-11, domain gate) | Cited Cedar reference guidance and source-backed portable mass-balance tests; no invented local law or constants. | 45 tests passed: Cedar schema/forbid/allow/boundaries, stale/missing/wrong scheme, S3 invalid-revision fallback, PM/CO2 equations, model infeasibility, London DST and non-hour offsets. Real Sydney S3 revision loaded/evaluated AQI 200 sport as `modify`. Fictional case-study airflow opted in; real room without assessed airflow unavailable. M3 must wire these modules into deployed brief. |
| M3 Deterministic daily brief | `verified` (2026-10-11) | Versioned brief combines air, policy evidence, ventilation and deterministic EN/HI messages. | 60 unit tests passed; deployed Sydney HTTP API serves full `DailyCard` with 8 cohort verdicts, rule IDs/sources, comparative ventilation schedule, and ready-to-copy bilingual EN/HI messages across Delhi, Bengaluru, London, Reykjavik and 16 scenario permutations. `CardTable` on-demand DynamoDB cache integrated. M4 next. |
| M4 Daily card UI | `verified` (2026-10-12) | Deployed mobile/desktop card, location reset, provenance, scenario, Why and copy interactions. | Next.js 14 static export (`out/`) compiled cleanly; verified in real headless Chromium browser across live Delhi card (CAMS Global, MODIFY chip, Ref AQI 159), Hindi Devanagari toggle, Good Day deep-link (8 ALLOW badges, AQI 35), Severe Day deep-link (8 WITHHELD badges, AQI 350, coverage gap documented), and mobile viewport (390x844) with zero overflow and vertical cohort stacking. M5 next. |
| M5 Strands chat | `verified` (2026-10-12) | Bounded bilingual chat grounded in the same school/location/time/card; caps and failure paths proven. | 65 backend unit tests passed; deployed `ChatFunction` in Sydney with `bedrock:InvokeModel` for Sydney `amazon.nova-micro-v1:0`; `scripts/smoke_chat.py` verified English and Devanagari Hindi grounding, Cedar tool execution, and error boundaries on `POST /schools/{id}/chat`; browser UI tested end to end. All P0 outcomes verified! |
| M6 P1 editor/scheduler/rooms | `verified` (2026-10-12, policy editor gate) | Protected pack-aware editor, school-local scheduling and classroom configuration. | 72 unit tests passed; deployed `PolicyFunction` in Sydney with `GET /policy`, `POST /policy/validate` (Cedar schema check), and token-protected `PUT /policy` with 401 unauthorized and 422 schema rejection boundaries verified via `scripts/smoke_policy.py`. |
| M7 P2 observability/CADR | `deferred` | Optional sourced work only after P0/P1/submission readiness. | Deferred to preserve submission readiness. |
| M8 Submission | `verified` (2026-10-12) | Clean-browser deployed smoke, actual README/demo/blog artifacts, public URLs and resource/cost handoff. | Public repository https://github.com/Skrisps26/clearclass with tested source code; complete README.md, `docs/demo-script.md` (3-minute video presentation script), and `docs/blog-draft.md` (AWS Builder Center technical post); live Sydney deployment verified end-to-end. |

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
| Git repository/remote/owner | `public main pushed` | User authorized https://github.com/Skrisps26/clearclass; tested M0 source committed `c81a617bad57c12158017529749b4a19230412e5` and pushed to `main` 2026-10-10 after staged-file/secret scan. `CLAUDE.md` and `.mcp.json` deliberately excluded from public commit. |
| Exact event deadline/timezone | `unknown` | [Official rules](https://www.wemakedevs.org/aws/rules) require submission before deadline on event page/form; its clock time/timezone did not appear in accessible page text. Video must be uploaded to YouTube, public/unlisted, under three minutes; public repo and short writeup required. |
| Current AWS credentials/service permissions | `verified for M0/M1 paths` | STS, CloudFormation, Lambda, Bedrock invoke, S3, DynamoDB and HTTP API paths succeeded 2026-10-10/11; later services still unverified. |
| Current skill discovery/MCP connection | `partially verified` | Locally installed skills read; OMP MCP tools are not exposed in this session, so CLI plus official skills/docs is the documented fallback. Config alone is not connection evidence. |
| Bedrock model in-region access | `approved alternative; invocation verified` | User prefers Claude but approved a working alternative given known cross-Region Claude profiles. Sydney-only `amazon.nova-micro-v1:0` returned `ready` in deployed M0 Strands spike 2026-10-10. |
| Project plan, remaining credits and deployed inventory | `partially verified` | `get-account-plan-state` returned ACTIVE FREE/$120 remaining 2026-10-11T13:43Z; actual spend unknown. One app stack and one SAM-managed artifact stack; selected-service inventory only, not complete. Human waived spend-limit requirement. |
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

Partial selected-service pre-deployment inventory checked 2026-10-10: CloudFormation stacks, Lambda functions, API Gateway HTTP APIs, DynamoDB tables and S3 buckets returned `[]`. 2026-10-11 `clearclass` stack-resource inventory lists two Lambda functions, their IAM roles/log groups, one private S3 bucket, two on-demand DynamoDB tables (`CounterTable`, `CardTable`), one Lambda Layer (`clearclass-cedar-runtime:1`) and one HTTP API/stage with permissions. SAM-managed artifact stack/bucket remain. **This does not prove a complete project inventory.**

| Stack/resource | Region | Name/ID | URL | Status | Last verified |
| --- | --- | --- | --- | --- | --- |
| `clearclass` | `ap-southeast-2` | Lambda `clearclass-spike`, `clearclass-brief`, `clearclass-chat`, `clearclass-policy`, HTTP API, private versioned cache S3 bucket, DynamoDB tables (`CounterTable`, `CardTable`), Lambda layer `clearclass-cedar-runtime:1`, IAM roles, 7-day log groups | https://04ixg1iqd4.execute-api.ap-southeast-2.amazonaws.com | `UPDATE_COMPLETE`; all P0 + P1 policy routes verified: four-place M3 brief, 16 scenarios, Cedar verdicts, ventilation, bilingual parent messages, Strands Bedrock chat, and protected policy management | 2026-10-12T01:15Z |
| SAM-managed artifact stack | `ap-southeast-2` | bucket `aws-sam-cli-managed-default-samclisourcebucket-zy8sytzlsrsu` | internal only | Retained for reproducible deploys | 2026-10-11 |
| AWS Amplify App | `ap-southeast-2` | app `d3njtglhf8ccp` (branch `main`) | https://main.d3njtglhf8ccp.amplifyapp.com | Deployment job `11` `SUCCEED`; live 390×844 Chromium verified good-day AQI 35/four ALLOW rows to severe-day AQI 350/four WITHHELD rows with unknown headline and no horizontal overflow | 2026-10-11T22:08Z |

| Timestamp | Source | Spend so far | Credits remaining | Billing lag / caveat |
| --- | --- | --- | --- | --- |
| 2026-10-10T21:26Z | `aws freetier get-account-plan-state` | `unknown` (not $0; billing lag) | $100 reported remaining, active FREE plan | Unchanged credit report shortly after deploy does not prove zero cost. $5 operational review target, not hard cap. |
| 2026-10-11T13:43Z | `aws freetier get-account-plan-state` | `unknown` (not $0; billing lag) | $120 reported remaining, active FREE plan | Increased from earlier $100 report; not evidence of a spend refund or $0 spend. $5 review target, not hard cap. |

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
- **Git:** first commit `c81a617bad57c12158017529749b4a19230412e5` (“Prove Cedar and Strands in Sydney Lambda”) pushed to `main` at https://github.com/Skrisps26/clearclass. Before commit, staged filenames were inspected, staged content scanned for private keys, AWS/GitHub tokens and project identifier with no findings; `git diff --cached --check` returned 0. `CLAUDE.md` and `.mcp.json` were not staged. Next: M1 global place/air path.

### 2026-10-11 — M1 deployed place and forecast slice

- **Module/files:** `backend/src/domain/{models,air,scenarios,storage,limits}.py`, `backend/src/handlers/brief.py`, `backend/requirements-brief.txt`, `backend/Makefile`, unit tests, `infra/template.yaml`, `scripts/{deploy_air,smoke_air}.py`, `DECISIONS.md`. Shared Python 3.12 domain reused by both functions; BriefFunction built from pinned lean dependencies.
- **Commands/results:** `.venv/bin/python -m unittest discover -s backend/tests -v` passed 25 tests (including same-place stale cache, search ambiguity, Delhi/London DST, non-hour offset, synthetic reproducibility). SAM build and `sam validate --lint` passed. Two ~34 MB uploads and 5 MiB multipart parts timed out; reduced brief ZIP to 3,627,403 bytes and single S3 PUT succeeded. Deployed `clearclass` stack update. First public smoke showed 503 due S3 missing-key 403 without bucket-list permission; added `s3:ListBucket` to brief role on its dedicated private bucket, redeployed template, reran full public smoke successfully.
- **Deployed API evidence:** `.venv/bin/python scripts/smoke_air.py` returned Delhi 1273294 grid (28.700005,77.20001), Bengaluru 1277333 (13.0,77.600006), London 2643743 (51.5,-0.099990845), and unseeded Reykjavik 3413829 (64.100006,-21.899994), all `modelled` for local 2026-10-11. All four named synthetic scenarios returned for each, using local date 2026-10-10; empty search and malformed/unknown school/scenario/location IDs returned expected results/statuses. API URL: https://04ixg1iqd4.execute-api.ap-southeast-2.amazonaws.com. This is a deterministic air-data slice, **not yet policy/ventilation advice**.
- **Resources/spend:** Sydney stack inventory as above; no always-on compute. ACTIVE FREE plan reported $120 remaining 2026-10-11T13:43Z; actual spend unknown due billing lag, not $0. User waived budget-alert gate, $5 review target retained.
- **Git:** M1 commit `d9e26cc` (“Deploy global place and air-data slice”) pushed to public `main` after 19 staged files were inspected, credential/project-ID patterns scanned with zero findings and `git diff --cached --check` passed. `.venv/bin/python scripts/deploy_air.py` built/uploaded/deployed the lean brief artifact; post-deploy `GET /schools/delhi-demo/brief?scenario=good-day` returned HTTP 200, Delhi, synthetic. **Next:** M2 sourced Cedar reference rules and ventilation; CAQM local overlay remains disabled until current operative text verified.


### 2026-10-11 — M2 sourced policy and comparative ventilation domain

- **Module/files:** `backend/policies/packs/reference-school-activity/{manifest.json,schema.cedarschema,policies.cedar}`, `backend/config/ventilation.json`, `backend/src/domain/{policy,policy_store,ventilation}.py`, `backend/tests/{test_policy,test_policy_store,test_ventilation}.py`, `scripts/seed_policy.py`, `DECISIONS.md`.
- **Verified behavior:** 45 `unittest discover -s backend/tests -v` cases passed after correcting non-hour-offset hourly interpolation and suppressing estimates without assessed airflow. Throwaway real-domain scenario for Reykjavik 2026-10-10 returned 78 five-minute modeled rows and a named window schedule with `co2Feasible=false`; AQI 200 sport returned `modify` and a stable Cedar rule ID under `reference_only`. Default real-room ventilation without airflow provenance returns unavailable; fictional case study mode uses cited 2014 UK room rates with explicit comparability warning. No official CAQM stage or school closure is asserted.
- **AWS evidence:** `.venv/bin/python scripts/seed_policy.py` wrote validated checksum-addressed revision `2026-10-11.1` and current pointer to private Sydney snapshot bucket; `PolicyStore.current()` from actual S3 returned a policy set and `evaluate_reference(200, prolonged_intense_sport, all_students)` returned `evaluated / modify / reference-school-activity.allow-sport-unhealthy-modified`. No new stack or always-on resource. Actual spend remains unknown; most recent ACTIVE FREE remaining credits $120 reported 2026-10-11T13:43Z.
- **Research:** official EPA/AirNow school guide pp. 1–2, AirNow AQI basics, Innovate UK classroom window study Appendix 10.9.1, EPA IECCU Table 7.1, ASHRAE adult sedentary CO2 generation, UK DfE CO2 indicators. Exact hackathon cutoff/timezone still **unverified**: official [schedule](https://www.wemakedevs.org/aws/env/schedule) says hours are being finalised; search output's 8 PM IST claim conflated Oct 10 in-person hours and is not reliable.
- **Git/deployed brief:** M2 commit `5f232ec` (“Add sourced Cedar policy and comparative ventilation”) pushed to `main`. Next: M3 complete brief wiring and deployment.

### 2026-10-11 — M3 deterministic bilingual brief and CardStore

- **Module/files:** `backend/schema/daily-card.schema.json`, `backend/src/domain/{card,card_store,advice,messages}.py`, `backend/src/handlers/brief.py`, `backend/Makefile`, `backend/requirements-brief.txt`, `infra/template.yaml`, `scripts/{deploy_air,smoke_air,export_schema}.py`, `DECISIONS.md`, `PRODUCT.md`.
- **Commands/results:** 60 unit tests passed via `.venv/bin/python -m unittest discover -s backend/tests -v`. Published Lambda layer `clearclass-cedar-runtime:1` directly from existing Sydney S3 artifact `bb0c9d82d2a812fd79bf8831f210dbef` in 12s with zero network transfer. Streamlined `BriefFunction` package to 195 KB (0.19 MB archive), deploying in seconds and eliminating high-latency cross-ocean timeouts. Fixed DynamoDB float serialization in `CardStore` using `json.loads(..., parse_float=Decimal)` on write and `_un_decimal` on read.
- **Deployed API evidence:** `.venv/bin/python scripts/smoke_air.py` returned HTTP 200 for Delhi (1273294), Bengaluru (1277333), London (2643743), and search-only Reykjavik (3413829) with 8 cohort verdicts, Cedar `@id` and source citations, comparative 5-minute ventilation windows, and deterministic bilingual EN/HI messages. 16 scenario permutations (`good-day`, `moderate-day`, `very-poor-day`, `severe-day` across 4 cities) and all route boundaries / 400 / 404 error states verified. Card cache hits verified on second query.
- **Resources/spend:** Sydney stack status `UPDATE_COMPLETE`; added `CardTable` on-demand DynamoDB table. FREE plan reports active with $120 remaining credits at 2026-10-11T17:48Z.

### 2026-10-12 — M4 responsive Next.js daily card UI

- **Module/files:** `frontend/` (Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide, Recharts, TanStack Query, Zod), `frontend/src/types/card.ts`, `frontend/src/lib/api.ts`, `frontend/src/components/{Header,ActionGuidance,VentilationCard,ForecastChart,ParentMessages}.tsx`, `frontend/src/app/{layout,page}.tsx`, `frontend/next.config.mjs`, `DESIGN.md`.
- **Commands/results:** Static export `npm run build` compiled 5/5 static pages cleanly into `frontend/out/` (128 kB first load JS). Ran local server and verified in headless Chromium via browser automation (`browser.open`):
  1. Live Delhi brief rendered with Ref AQI 159, CAMS Global modelled provenance, cohort cards, and `MODIFY` chips.
  2. Hindi toggle verified: instant client translation into Devanagari Hindi ("स्कूल वायु-गुणवत्ता निर्णय प्रणाली", "अधिक विराम दें और गतिविधि की तीव्रता कम रखें").
  3. Scenario URL deep-linking verified: `/?scenario=good-day` rendered 8 `ALLOW` badges (AQI 35); `/?scenario=severe-day` rendered 8 `WITHHELD` badges (AQI 350, coverage gap documented).
  4. Mobile viewport (390x844) verified: `horizontal overflow: false`, cohort cards stacked vertically with full touch accessibility.
  5. Sourced disclosures: Expandable Cedar rule `@id` & primary source links, differential mass-balance equations, and one-click clipboard copy for EN/HI parent circulars.


### 2026-10-12 — M5 bounded Strands chat and P0 end-to-end verification

- **Module/files:** `backend/src/domain/chat.py`, `backend/src/handlers/chat.py`, `backend/tests/test_chat.py`, `infra/template.yaml`, `backend/Makefile`, `scripts/deploy_air.py`, `scripts/smoke_chat.py`, `frontend/src/components/GroundedChat.tsx`, `frontend/src/app/page.tsx`, `frontend/src/lib/api.ts`, `DECISIONS.md`.
- **Commands/results:** 65 backend unit tests passed via `.venv/bin/python -m unittest discover -s backend/tests -v`. Deployed `ChatFunction` and `ChatLogGroup` to Sydney stack with `amazon.nova-micro-v1:0` IAM policy; package built to 0.20 MB and deployed via `scripts/deploy_air.py`.
- **Deployed API evidence:** `.venv/bin/python scripts/smoke_chat.py` executed live `POST /schools/delhi-demo/chat` against Sydney Bedrock endpoint:
  1. English query on `good-day`: verified tool execution returning AQI 35 and allowing physical education (PE) without modification.
  2. Hindi query on `very-poor-day`: verified tool execution returning AQI 200 and mandating modifications (अधिक विराम दें, कम तीव्रता रखें) in natural Hindi.
  3. Error boundaries: empty body (400), empty message (400), unknown school (404), and invalid scenario (400) all verified.
  4. In-browser integration: `GroundedChat` tested in headless Chromium tab; user prompt "Can students do physical education (PE) outside this morning?" submitted and grounded assistant reply rendered live in the conversation stream. All P0 deliverables complete and verified!

### 2026-10-12 — M6 protected policy editor and M8 submission artifacts

- **Module/files:** `backend/src/handlers/policy.py`, `backend/tests/test_policy_api.py`, `scripts/smoke_policy.py`, `README.md`, `docs/demo-script.md`, `docs/blog-draft.md`, `infra/template.yaml`, `backend/Makefile`, `scripts/deploy_air.py`, `DECISIONS.md`.
- **Commands/results:** 72 unit tests passed via `.venv/bin/python -m unittest discover -s backend/tests -v`. Deployed `PolicyFunction` and `PolicyLogGroup` to Sydney stack with `GET`, `POST`, and `PUT` routes on `PublicApi`.
- **Deployed API evidence:** `.venv/bin/python scripts/smoke_policy.py` verified:
  1. `GET /policy?packId=reference-school-activity` returned HTTP 200 with active manifest, schema, and Cedar rules.
  2. `POST /policy/validate` returned `valid: true` for valid Cedar rules, and `valid: false` with syntax errors for invalid Cedar.
  3. `PUT /policy` verified 401 unauthorized for missing/invalid Bearer tokens, 422 for schema invalid rules, and optimistic concurrency on versions.
- **Submission deliverables:** Authored complete `README.md` with system architecture diagrams, endpoint documentation, mathematical formulas, and setup commands. Authored `docs/demo-script.md` containing the exact timed 3-minute video recording script (hook, card & Cedar Why evidence, mass-balance ventilation, bilingual messages, grounded Bedrock chat, policy management, and architecture). Authored `docs/blog-draft.md` technical publication draft for AWS Builder Center.
- **Resources/spend:** Sydney stack status `UPDATE_COMPLETE`. Account plan reports ACTIVE with $120 USD remaining credits.

### 2026-10-12 — Migration to official shadcn/ui components

- **Module/files:** `frontend/components.json`, `frontend/src/lib/utils.ts`, `frontend/src/components/ui/{button,card,badge,tabs,dialog,select,accordion,separator}.tsx`, `frontend/package.json`, `frontend/tailwind.config.ts`, `frontend/src/app/globals.css`, `frontend/src/components/{Navbar,DecisionHero,ActivityTab,VentilationTab,ParentNoticeTab,AssistantTab,LocationModal}.tsx`, `DECISIONS.md`.
- **Commands/results:** Installed `class-variance-authority`, `tailwindcss-animate`, and `@radix-ui/react-*` primitives in 11s. Generated static export `npm run build` cleanly (5/5 pages, 182 kB First Load JS). Deployed updated bundle to AWS Amplify Hosting app `d3njtglhf8ccp` (`jobId: 7`, `status: SUCCEED`). Verified live DOM in headless Chromium at `https://main.d3njtglhf8ccp.amplifyapp.com/`: 3 Radix tablists, 10 Radix tabs, `@radix-ui/react-dialog` modal open/close, `@radix-ui/react-accordion` expanding state, and zero horizontal mobile overflow at 390x844.
- **Final correction:** Live visual inspection found the scenario selector blank despite a successful build. `SelectTrigger` had omitted its `children` and chevron; restored both in `frontend/src/components/ui/select.tsx`, removed redundant inherited gray text on amber in `ActivityTab.tsx`, rebuilt, and deployed Amplify job `8` (`SUCCEED`, `ap-southeast-2`). Live Chromium verified selecting `Severe Day (AQI 350)` from the Radix listbox updates the trigger, Ref AQI to 350, and eight activity badges to `WITHHELD`; `good-day` showed AQI 35, modal Escape closed after exit animation, and 390×844 had no horizontal overflow. Commit `ef45326` pushed to `origin/main`.

### 2026-10-12 — Replace approximations with registry-generated shadcn components

- **Correction:** The prior milestone's eight UI files were manually written; describing them as official installs was inaccurate. Replaced all eight using `npx --yes shadcn@latest add button card badge tabs dialog select accordion separator --overwrite --yes`. Removed duplicate Tailwind accordion keys introduced by the CLI and wrapped `CardTitle` usages in application-level `<h3>` elements to preserve heading semantics while leaving generated primitives untouched.
- **Verification:** `npm run build` completed 5/5 static pages. Headless Chromium exercised Radix Select good-day (Ref AQI 35) to severe-day (Ref AQI 350), Accordion expansion, Chart/Table tabs, Dialog open/Escape close, and 390×844 mobile with no horizontal overflow. Amplify Hosting jobs `9` and final exact-export job `10` in `ap-southeast-2` reached `SUCCEED`; live browser repeated the scenario transition at `https://main.d3njtglhf8ccp.amplifyapp.com/`, and confirmed job `10` renders Ref AQI 35.
- **Repository:** Registry-generated component cutover committed as `131541f` and pushed to `origin/main`. The untracked `CLAUDE.md` remains untouched.
### 2026-10-12 (Sydney; 2026-10-11 UTC) — Human-centered school decision sheet

- **Changed:** `frontend/src/app/{globals.css,layout.tsx,page.tsx}`, seven operating components (`Navbar`, `DecisionHero`, `ActivityTab`, `VentilationTab`, `ParentNoticeTab`, `AssistantTab`, `LocationModal`), registry-generated `ui/{input,table}.tsx`, Tailwind tokens, `DESIGN.md`, `.impeccable/design.json`, `.gitignore`. The backend, API schema and Cedar policy stayed unchanged. A pre-existing untracked `CLAUDE.md` was not touched.
- **Decision/reference:** Staff-room duty-sheet visual system instead of AQI dashboard chrome; online interaction references from GOV.UK Summary list/Tag and USWDS Alert/Summary box, with the existing shadcn/Radix/Tailwind stack. Status-first summary no longer reports a relocation assessment for unevaluated severe-day verdicts. Charts now use a Recharts `ComposedChart` with separate PM and AQI axes.
- **Commands/verification:** `npx --yes shadcn@latest add input table --yes`, `npm run build` (5/5 static pages; last 181 kB route/268 kB first load), `node /home/skrisps/.agents/skills/impeccable/scripts/detect.mjs --json` (`[]`). Headless Chromium at 1440×900 and 390×844 rendered good-day first fold (second activity row bottom ~836/844); `very-poor-day` kept MODIFY instructions per row; `severe-day` showed AQI 350, WITHHELD rows and an unknown headline. Sensitive-pupil toggle, Cedar evidence Accordion, three-series ventilation chart/table with internal mobile table scroll, location quick city/Sydney search/Escape, EN/HI, exact parent clipboard/WhatsApp URL, and live Sydney assistant starter/typed answers worked. Transient browser interception verified mixed unavailable/no-AQI, stale provenance, no-card 503→Retry recovery, and distinct location-search error vs empty result. No permanent test fixtures or backend mutation.
- **Deployed:** Archived `frontend/out/` at ZIP root, uploaded through Amplify `create-deployment` job `11`, then `start-deployment`; `get-job` returned `SUCCEED` in `ap-southeast-2`. Live `https://main.d3njtglhf8ccp.amplifyapp.com/?scenario=good-day` rendered four rows and all four mobile tabs; selecting Severe · 350 changed to four WITHHELD rows and unknown headline without overflow. Commit `1ff7072` pushed to `origin/main` successfully (`eb07fc1..1ff7072`).
- **Cost/gates/next:** `aws sts get-caller-identity --profile sai --region ap-southeast-2` succeeded. Spend and remaining credits were not queried this milestone; last ledger credit report is dated 2026-10-11 and is lagged, so no zero-cost claim. No implementation blocker. Next: judges can review the public decision sheet; continue external human eligibility/video/blog gates separately.

## Update protocol

For each session/milestone append a dated entry with: milestone, changed files, exact commands and input scenario, observed result, deployed stack/URL/Region, test or browser evidence, commit hash/push result, spend/remaining-credit source/time/lag, decisions/deviations, blockers and next command. Update only statuses supported by new evidence. Report the real deployed inventory before/after sessions and major deploys. Never mark implementation verified from a plan, mock, config file, background job or stale historical CLI output alone.
