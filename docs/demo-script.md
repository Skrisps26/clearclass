# ClearClass · 3-Minute Hackathon Demo Script

> **Event:** Environmental Hacks (Bharat Builds Tour 2026) · Track 01 Air
> **Target Duration:** Exactly 2 minutes 50 seconds – 3 minutes 00 seconds
> **Speaker:** Human presenter / screen recording

---

## Visual Setup Checklist Before Recording

1. Open clean Chrome browser tab at the live deployed frontend: `https://main.d3njtglhf8ccp.amplifyapp.com`.
2. Set screen resolution to 1920x1080 (100% zoom).
3. Have terminal or AWS Console ready in a secondary tab showing the deployed Sydney CloudFormation stack `clearclass` (`ap-southeast-2`).

---

## Timed Video Script

### 0:00 – 0:20 | The Hook: The Morning Dilemma (20 seconds)

- **[Visual: Camera on presenter, or screen showing high AQI news / raw air dashboard]**
- **Speaker:**
  "It's 06:45 in the morning. A school principal checks her phone and sees an AQI alert of 210.
  Parents are already messaging. The PE coach wants to know if cross-country practice can run. The kindergarten teacher wants to know if morning assembly in the courtyard should be cancelled.
  A raw AQI number doesn't answer those questions. And asking a generic AI chatbot risks hallucinated medical advice or arbitrary rules.
  This is why we built **ClearClass**."

---

### 0:20 – 1:10 | The Daily Card & "Why?" Evidence (50 seconds)

- **[Visual: Switch to ClearClass interface. Show selected location 'Delhi', AQI badge, and Cohort cards]**
- **Speaker:**
  "ClearClass is a location-agnostic school decision engine. Staff select their place—whether Delhi, Bengaluru, London, or any global city.
  Immediately, ClearClass evaluates today's air forecast through formal **Cedar policies** derived from published school guidance.
  Notice how decisions are broken down by cohort:
  For general students, ordinary outdoor assembly and recess are permitted, but sports are marked **MODIFY**—mandating more breaks and lower intensity.
  For sensitive pupils with asthma, special caveats appear directly on their card.
  Most importantly, we don't ask teachers to blindly trust our system. Click **'Why? View Cedar rule & source'**:
  Here is the exact Cedar rule `@id`, the formal policy code, and direct citations to U.S. EPA AirNow guidance. Rules decide; teachers stay in control."

---

### 1:10 – 1:40 | Classroom Ventilation Physics (30 seconds)

- **[Visual: Scroll down to the Classroom Ventilation Guidance card]**
- **Speaker:**
  "Next: classroom ventilation. In polluted weather, teachers often keep windows sealed all day, causing dangerous indoor CO2 buildup, drowsiness, and headaches.
  ClearClass solves this with an analytic **mass-balance differential equation**, modeling PM2.5 infiltration and occupant CO2 generation in 5-minute time steps.
  It recommends optimal 10-minute window flush intervals during lesson breaks—for instance, 08:40 to 08:50 and 09:40 to 09:50—keeping CO2 below the 1,500 ppm benchmark while minimizing total particulate exposure.
  Click the physics disclosure to see our cited parameters: EPA deposition rates and ASHRAE metabolic emission constants."

---

### 1:40 – 2:10 | Bilingual Parent Circulars & Grounded Chat (30 seconds)

- **[Visual: Show Parent Messages side-by-side cards, click 'Copy Text', then expand the Grounded Chat drawer]**
- **Speaker:**
  "Before the bell rings, administrators need to broadcast to parents.
  ClearClass generates ready-to-copy notices in both English and natural Devanagari Hindi with one-click copying.
  Now, let's open the **ClearClass Assistant**, powered by **Amazon Bedrock Nova Micro** and AWS Strands.
  Staff can ask natural questions: *'Can students play football outside this afternoon?'*
  The agent executes server-side tools to check today's air and Cedar policies, replying with tool-grounded advice without hallucination. Toggle to Hindi, and it converses naturally in Hindi."

---

### 2:10 – 2:35 | Protected Policy Management (25 seconds)

- **[Visual: Demonstrate GET /policy and PUT /policy schema validation in Postman or terminal]**
- **Speaker:**
  "ClearClass also provides a protected policy management API.
  School networks can inspect active Cedar policies, validate proposed rule changes against our typed Cedar schema, and push versioned updates to Amazon S3 with token authorization.
  If a rule contains invalid Cedar syntax, the API rejects it with HTTP 422 before it can ever touch a classroom."

---

### 2:35 – 3:00 | Architecture & Conclusion (25 seconds)

- **[Visual: Show AWS CloudFormation stack in Sydney console, or architectural diagram]**
- **Speaker:**
  "Under the hood, ClearClass is built entirely on AWS in Sydney (`ap-southeast-2`):
  Amazon API Gateway HTTP API, three Python 3.12 Lambdas, DynamoDB atomic rate counters and card cache, private versioned S3 storage, and Bedrock Nova Micro.
  Rules and physics decide; LLMs explain and converse.
  Thank you—check out our live deployment and open-source code on GitHub!"
