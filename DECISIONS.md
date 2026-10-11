# ClearClass decisions

Record dated choices, rejected alternatives, source and effect on requirements. This file is implementation evidence only for the choices recorded, not deployed-product evidence.

## 2026-10-10 — Location portability

- **Choice:** GeoNames-backed Open-Meteo location IDs/timezones and CAMS Global forecasts; one Cedar reference advisory everywhere, local-authority packs only for verified registered jurisdictions.
- **Why:** Explicit user revision asks for arbitrary supported locations without building a geospatial platform; reference advice is not local law.
- **Rejected:** Delhi-only hard coding; automatic worldwide legislation scraping; applying GRAP from a city-name match.
- **Sources:** [Geocoding](https://open-meteo.com/en/docs/geocoding-api), [air-quality API](https://open-meteo.com/en/docs/air-quality-api), [WHO AQI caution](https://www.who.int/news-room/questions-and-answers/item/air-pollution-personal-interventions-and-risk-communication).
- **MUST impact:** Authorized geographic change from original brief; policy distinction remains mandatory.

## 2026-10-10 — Open-Meteo service entitlement

- **Choice:** Treat the initial free public API only as a non-commercial educational hackathon demo with no subscriptions/advertising, subject to explicit GeoNames/Open-Meteo/CAMS attribution and server request caps. If the product becomes commercial/promotional, switch to the customer endpoint under a paid API agreement rather than silently reuse free service.
- **Why:** [Open-Meteo terms](https://open-meteo.com/en/terms) expressly include private/non-profit apps without ads and educational content under non-commercial examples, and restrict free API usage below 10,000/day, 5,000/hour and 600/minute. Hackathon prize eligibility alone does not establish paid subscription or advertising, but future use classification must be revisited.
- **Rejected:** Building an AQI model or interpreting data licence as a commercial API-service grant.
- **MUST impact:** None for an ad-free educational demo; do not claim broader commercial entitlement.

## 2026-10-10 — Global provider and validated snapshot contracts

- **Choice:** `httpx` 0.28.1 (BSD-3-Clause, 73,517-byte wheel), `pydantic` 2.14.0 (MIT, 487,109-byte wheel plus native core), Python `zoneinfo` with `tzdata` 2026.5 (Apache-2.0, 347,996-byte wheel), and Lambda runtime boto3 for S3/DynamoDB. Open-Meteo GeoNames IDs and CAMS Global model provide external semantics; do not build geospatial/forecast engines.
- **Why:** Open-Meteo serves a stable ID get-by-ID path and explicit CAMS global domain. Live response uses `hourly_units.us_aqi = "USAQI"` on the wire (documentation describes U.S. AQI in prose); parser validates the actual wire units, not the display label. Python 3.12 slim SAM build and deployed four-place M1 route passed 2026-10-11.
- **Rejected:** Names as stable IDs, cross-location fallback, invented AQI conversion, automatic synthetic fallback, custom timezone lookup.
- **Sources:** [Geocoder API](https://open-meteo.com/en/docs/geocoding-api), [air API](https://open-meteo.com/en/docs/air-quality-api), [terms](https://open-meteo.com/en/terms), [HTTPX PyPI](https://pypi.org/project/httpx/), [Pydantic PyPI](https://pypi.org/project/pydantic/), [tzdata PyPI](https://pypi.org/project/tzdata/). Package release/size checked 2026-10-10; all support Python 3.12. Dependencies are pinned in `backend/requirements.lock`.
- **MUST impact:** None; model data explicitly disclaimed as not measured or official local AQI.

## 2026-10-10 — Python Lambda spike dependencies

- **Choice:** Python 3.12 x86_64 Lambda uses `cedarpy` 4.12.1 for Cedar authorization/schema validation and `strands-agents` 1.59.0 for a bounded Bedrock call. The deployed `clearclass-spike` completed both paths on 2026-10-10; chosen/transitive versions are pinned in `backend/requirements.lock`.
- **Why:** Official Strands SDK supports Python and community Cedar binding exposes both APIs; the matching native manylinux wheel executed in Lambda. SAM build measured 87,204,444 bytes uncompressed and 37,565,403 compressed before M1 additions; measure again for changed packages.
- **Rejected:** Simulated Cedar, local-only packaging proof, mixed backend languages and all-in-one Strands tools extra.
- **Sources:** [cedarpy PyPI](https://pypi.org/project/cedarpy/) and [Apache-2.0 LICENSE](https://github.com/k9securityio/cedar-py/blob/main/LICENSE), [Strands PyPI](https://pypi.org/project/strands-agents/), [Strands Lambda guide](https://strandsagents.com/docs/user-guide/sdk/deploy/deploy_to_aws_lambda/), [Lambda Python packages](https://docs.aws.amazon.com/lambda/latest/dg/python-package.html).
- **Maintenance/compatibility:** Cedar 4.12.1 community-maintained, not AWS-supported, wheels CPython 3.10–3.14 including manylinux x86_64; Strands 1.59.0 AWS open-source Apache-2.0 Python >=3.10. Recheck actual packages/install tree when locked.
- **MUST impact:** None planned; if native packaging cannot execute in Lambda use the specified all-TypeScript fallback, not a mock.

## 2026-10-10 — Regional model access conflict

- **Choice:** Do not invoke an inference profile with any destination outside the selected `ap-southeast-2` Region. The user prefers Claude if possible but authorized an alternative if it conflicts with Region restrictions. Choose `amazon.nova-micro-v1:0`, listed as Sydney `ON_DEMAND`, subject to real in-Region invocation after spending gates clear. This is a documented provider deviation, not permission to deploy outside Sydney.
- **Why:** `list-foundation-models` lists Claude Haiku 4.5/5.5 as `INFERENCE_PROFILE` only; `list-inference-profiles` showed `au.` Haiku destinations Sydney **and Melbourne** and `global.` destinations potentially global. A `length(models)==1` query returned no Sydney-only system-defined profile. Listing is not an invocation or proof of access denial, but using known cross-Region routing contradicts this project's selected-Region constraint.
- **Rejected:** Silently using `au.`/`apac.`/`global.` inference or provisioned capacity to bypass an access gate.
- **Sources:** live read-only AWS CLI `--profile sai --region ap-southeast-2` queries on 2026-10-10; [Bedrock supported inference profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html), [regional restrictions](https://docs.aws.amazon.com/accounts/latest/reference/project-regions.html).
- **MUST impact:** Preferred Claude model changed to Nova Micro with explicit user approval; M0 deployed invocation succeeded 2026-10-10. No cross-Region routing approved.

## 2026-10-10 — Deployment cost and repository gates

- **Choice:** The user subsequently overruled the spend-limit and budget-alert prerequisites: “you can do whatever really you dont need to set a spend limit ... just dont overdo it and use up all my credits.” Proceed with bounded on-demand resources, retaining the earlier $5 development-spend target as an operational stop/review threshold, **not a hard cap**. No NAT/provisioned services; monitor credits and stop on unexpected burn. Public repository creation was authorized and completed; push only tested milestones.
- **Why:** Free project reports $100 remaining credits at 2026-10-10T21:01Z but credits are not spend controls; stack inventory queries (CloudFormation, Lambda, API Gateway HTTP, DynamoDB, S3) returned empty lists but are not full inventory. `describe-budgets` returned no visible data; email alert remains unverified.
- **Rejected:** Treating credits or an empty partial inventory as $0 liability or blanket deployment authorization.
- **Sources:** AWS CLI `freetier get-account-plan-state`, `list-stacks`, `list-functions`, `get-apis`, `list-tables`, `list-buckets`, `budgets describe-budgets` on 2026-10-10; [new-experience Free Tier services](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-free-tier).
- **MUST impact:** Explicit user override of the roadmap's pre-deployment spend-limit/email-alert gate, recorded before deployment. One Sydney app stack and a SAM-managed artifact stack exist. Public repository https://github.com/Skrisps26/clearclass has tested M0 commits pushed; no Git configuration altered.

## 2026-10-11 — Lean, repeatable air-slice packaging

- **Choice:** Use a per-function SAM make target for the brief Lambda with pinned HTTPX/Pydantic/tzdata dependencies (plus Lambda runtime boto3), and reuse the already-deployed immutable M0 spike object when deploying M1. `scripts/deploy_air.py` builds, zips, SHA-256-addresses and uploads only the brief bundle, then deploys the same SAM stack. The M1 brief archive is 3,627,403 bytes rather than the redundant combined ~34 MB archive.
- **Why:** Two direct 34 MB SAM artifact uploads timed out after 360 seconds; even parallel 5 MiB parts timed out after 120 seconds each. A single 3.6 MB S3 upload succeeded; the compact Lambda subsequently served the four-place public smoke. An S3 missing-key `GetObject` returned 403 without bucket-list permission, so the dedicated private snapshot bucket grants its brief role `ListBucket` to distinguish cache misses from storage failures.
- **Rejected:** Duplicating the full Strands/Cedar package in the read-only brief Lambda, turning S3 cache misses into silent 503s, or widening the function's write scope outside the three cache prefixes. This M1 helper assumes an existing M0 spike; future stack evolution should package additional functions by their actual dependencies rather than pin its artifact forever.
- **Sources:** live SAM build/deploy, S3 upload response and deployed route smoke on 2026-10-11; [S3 GetObject missing-key permission semantics](https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html), [Lambda Python package requirements](https://docs.aws.amazon.com/lambda/latest/dg/python-package.html).
- **MUST impact:** One Sydney stack retained; no cross-Region resources.
