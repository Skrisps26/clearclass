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

## 2026-10-10 — Python Lambda spike dependencies

- **Choice:** Test Python 3.12 x86_64 Lambda with `cedarpy` 4.12.1 for actual Cedar authorization and schema validation, and `strands-agents` 1.59.0 with BedrockModel configured by environment. Versions are candidate pins until deployed packaging and invocation pass; do not claim the spike complete from local imports.
- **Why:** Official Strands SDK supports Python and community Cedar binding exposes both APIs; the matching native manylinux wheel exists for Python 3.12/x86_64. Candidate wheel sizes: Cedar 4,897,285 bytes compressed; Strands 880,205 bytes compressed. Full dependency tree/uncompressed deployment size remains unmeasured.
- **Rejected:** Simulated Cedar, local-only packaging proof, mixed backend languages and all-in-one Strands tools extra.
- **Sources:** [cedarpy PyPI](https://pypi.org/project/cedarpy/) and [Apache-2.0 LICENSE](https://github.com/k9securityio/cedar-py/blob/main/LICENSE), [Strands PyPI](https://pypi.org/project/strands-agents/), [Strands Lambda guide](https://strandsagents.com/docs/user-guide/sdk/deploy/deploy_to_aws_lambda/), [Lambda Python packages](https://docs.aws.amazon.com/lambda/latest/dg/python-package.html).
- **Maintenance/compatibility:** Cedar 4.12.1 community-maintained, not AWS-supported, wheels CPython 3.10–3.14 including manylinux x86_64; Strands 1.59.0 AWS open-source Apache-2.0 Python >=3.10. Recheck actual packages/install tree when locked.
- **MUST impact:** None planned; if native packaging cannot execute in Lambda use the specified all-TypeScript fallback, not a mock.

## 2026-10-10 — Regional model access conflict

- **Choice:** Do not invoke an inference profile with any destination outside the selected `ap-southeast-2` Region. The user prefers Claude if possible but authorized an alternative if it conflicts with Region restrictions. Choose `amazon.nova-micro-v1:0`, listed as Sydney `ON_DEMAND`, subject to real in-Region invocation after spending gates clear. This is a documented provider deviation, not permission to deploy outside Sydney.
- **Why:** `list-foundation-models` lists Claude Haiku 4.5/5.5 as `INFERENCE_PROFILE` only; `list-inference-profiles` showed `au.` Haiku destinations Sydney **and Melbourne** and `global.` destinations potentially global. A `length(models)==1` query returned no Sydney-only system-defined profile. Listing is not an invocation or proof of access denial, but using known cross-Region routing contradicts this project's selected-Region constraint.
- **Rejected:** Silently using `au.`/`apac.`/`global.` inference or provisioned capacity to bypass an access gate.
- **Sources:** live read-only AWS CLI `--profile sai --region ap-southeast-2` queries on 2026-10-10; [Bedrock supported inference profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html), [regional restrictions](https://docs.aws.amazon.com/accounts/latest/reference/project-regions.html).
- **MUST impact:** Preferred Claude model changed to Nova Micro with explicit user approval; M0 deployment/invocation remains pending budget/cost gates. No cross-Region routing approved.

## 2026-10-10 — Deployment cost and repository gates

- **Choice:** The user subsequently overruled the spend-limit and budget-alert prerequisites: “you can do whatever really you dont need to set a spend limit ... just dont overdo it and use up all my credits.” Proceed with bounded on-demand resources, retaining the earlier $5 development-spend target as an operational stop/review threshold, **not a hard cap**. No NAT/provisioned services; monitor credits and stop on unexpected burn. Public repository creation was authorized and completed; push only tested milestones.
- **Why:** Free project reports $100 remaining credits at 2026-10-10T21:01Z but credits are not spend controls; stack inventory queries (CloudFormation, Lambda, API Gateway HTTP, DynamoDB, S3) returned empty lists but are not full inventory. `describe-budgets` returned no visible data; email alert remains unverified.
- **Rejected:** Treating credits or an empty partial inventory as $0 liability or blanket deployment authorization.
- **Sources:** AWS CLI `freetier get-account-plan-state`, `list-stacks`, `list-functions`, `get-apis`, `list-tables`, `list-buckets`, `budgets describe-budgets` on 2026-10-10; [new-experience Free Tier services](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-free-tier).
- **MUST impact:** Explicit user override of the roadmap's pre-deployment spend-limit/email-alert gate, recorded before deployment. The plan remains one Sydney app stack plus any SAM-managed packaging artifact infrastructure; public repository https://github.com/Skrisps26/clearclass exists, no code pushed or Git configuration altered.
