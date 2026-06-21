# Ctrl+C — Take Control of Your Carbon

try at https://project-ctrlc.vercel.app
  
A carbon footprint tracker for urban Indians aged 18–30 that makes
environmental impact visible, trackable, and actually reducible.

---

## Vertical

**Climate tech / consumer sustainability**

Ctrl+C sits at the intersection of personal finance tracking and
behavioral nudge design. The core insight driving the product is that
carbon emissions are invisible — unlike money, you never feel them
leaving. The app's job is to make CO₂ as legible and emotionally
real as a bank balance, then give users a specific, low-friction
path to reduce it.

The target user is an urban Indian in their 20s — smartphone-native,
already using Swiggy, Uber, and UPI daily, environmentally aware but
not evangelical about it, and deeply skeptical of products that
lecture them. The design and tone reflect this throughout.

---

## Approach and Logic

The product is built around three interlocking pillars:

### Pillar 1 — Understand

Most carbon apps fail at the first screen by showing a raw number
(e.g. "8.2 tonnes/year") with no context. A tonne of CO₂ means
nothing to a 22-year-old in Jalandhar.

Ctrl+C translates numbers into things people can picture:

- **Trees** — how many mature trees would need to absorb this annually
- **Car kilometres** — equivalent distance driven in a petrol car
- **Peer benchmarks** — comparison against India average (1.9t),
  global average (4.7t), and the Paris 2050 target (2.0t)

The onboarding quiz (4 questions, no account required) estimates a
baseline in under 3 minutes. The user sees their number before being
asked to sign up — value before friction.

### Pillar 2 — Track

The tracking layer uses three data ingestion methods, each designed
to minimise friction for a different type of activity:

**AI plain text entry** — the default. User describes what they did
in natural language ("took an Ola to the airport, about 18 km"). A
Gemini API call parses the text into structured data (activity type,
mode, distance, CO₂). The user sees what the AI understood and
confirms before anything is saved. The parse-and-confirm pattern
builds trust — the app never saves blindly.

**Train journey lookup** — user types origin and destination city
using a local fuzzy search (Fuse.js against a bundled Indian cities
dataset, zero API calls during typing). On submit, a single Google
Distance Matrix API call returns the distance. CO₂ is then calculated
client-side using per-class emission factors across all nine Indian
Railways travel classes (1A, 2A, 3A, 3E, EC, CC, SL, 2S, General).
Changing class updates the CO₂ estimate instantly with no additional
API call.

**Flight lookup** — user enters a flight number (e.g. 6E 2341).
AviationStack API returns the route and distance. CO₂ is calculated
using the standard economy class emission factor with a 1.9×
radiative forcing multiplier, which accounts for the additional
warming effect of NOₓ and contrails at altitude beyond CO₂ alone.

**Manual entry** — structured form for anything not covered above:
home energy use, shopping, cooking at home, appliance usage.

SMS parsing and bank/UPI data sync were explicitly considered and
rejected. Both require permissions that Indian users correctly
perceive as high-risk, and the onboarding friction they introduce
kills retention before the product delivers any value.

### Pillar 3 — Reduce

Behavioral research consistently shows that presenting people with
too many options produces no action. The reduce pillar is built
around constraint:

**3 Monday Action Cards** — exactly three, never more. Generated
each Monday by Gemini based on the user's actual emission patterns
from the previous four weeks. Ranked by the formula:

```
score = (emission_impact × ease_score) / lifestyle_disruption
```

Where ease and disruption are 1–5 internal scales. This means the
app never suggests going vegan to someone who eats meat daily — it
finds the highest-impact realistic change for that specific person.

Each card has a commit button. Tapping it creates a pledge. Connected
data (train entries, manual logs) is used to probabilistically verify
follow-through at end of week. Verified pledges earn more points than
uncommitted ones.

**Gamification** — streaks, badges (12 total), a friends leaderboard
ranked by weekly emissions (lowest wins), and group challenges.
Financial incentive layer: carbon cashback points redeemable with
partner brands, and an optional eco deposit (lock money, get it back
only if monthly target is hit — uses loss aversion, which is more
motivating than reward).

---

## How the Solution Works

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Backend | Node.js + Express 5 |
| Database | PostgreSQL + Prisma ORM |
| Hosted DB | Neon (serverless PostgreSQL) |
| AI | Google Gemini API |
| Maps | Google Distance Matrix API |
| Flights | AviationStack API |
| City search | Fuse.js (local, no API) |
| Auth | Google OAuth + Phone OTP |

### Architecture

```
Browser (React/Vite :5173)
        ↓
Express Backend (:3000)
        ↓              ↓              ↓
  PostgreSQL      Gemini API    Google Maps API
  (Neon)         (parse +       (Distance
                  actions +      Matrix)
                  insights)
```

### Key Data Flows

**Entry logging via AI text:**
```
User types → 900ms debounce → POST /api/entries/parse
→ Gemini parses text → structured JSON returned
→ user confirms → POST /api/entries → streak updated
→ badge checks run → entry saved
```

**Train journey:**
```
User types city → Fuse.js searches local JSON (0 API calls)
→ user selects origin + destination + class
→ POST /api/lookup/train → Google Distance Matrix called
→ distanceKm returned → CO₂ = distanceKm × classFactor
(calculated client-side) → user saves entry
```

**Monday action cards:**
```
GET /api/actions/weekly (Monday)
→ last 4 weeks of entries aggregated by category
→ Gemini generates 3 ranked action cards
→ stored in DB → returned to frontend
→ user commits → POST /api/pledges
```

### Emission Factors

All emission factors are stored in `/src/lib/emissionFactors.ts`
and used consistently across frontend (previews) and backend
(final calculations).

**Transport (kg CO₂e per km):**
| Mode | Factor |
|---|---|
| Petrol cab (Uber/Ola) | 0.21 |
| Auto-rickshaw | 0.10 |
| Personal petrol car | 0.21 |
| Electric cab | 0.07 |
| Metro | 0.022 |
| City bus | 0.089 |
| Train — General | 0.012 |
| Train — 2S | 0.014 |
| Train — SL | 0.016 |
| Train — 3E | 0.019 |
| Train — 3A | 0.021 |
| Train — 2A | 0.024 |
| Train — CC | 0.029 |
| Train — EC | 0.038 |
| Train — 1A | 0.043 |
| Flight economy | 0.255 × 1.9 RF |

**Food (kg CO₂e per meal):**
| Type | Factor |
|---|---|
| Vegan | 0.7 |
| Vegetarian | 1.2 |
| Non-vegetarian | 3.0 |
| Delivery packaging | +0.05 flat |

### Database Schema (simplified)

```
User
  ├── OnboardingResponse (baseline estimate)
  ├── Entry[] (all logged activities)
  ├── Pledge[] (committed action cards)
  └── Badge[] (earned achievements)
```

### Deployment

- **Frontend** → Vercel (auto-detects Vite, deploys on push)
- **Backend** → Render (free tier, Express server)
- **Database** → Neon (serverless PostgreSQL, free tier)

All secrets managed via environment variables. The Google Maps API
key is server-side only and never exposed to the browser.

---

## Assumptions Made

**Emission factor sources and accuracy**
Emission factors are derived from published sources including IPCC
AR6, Indian Railways annual reports, and DEFRA conversion factors.
Train class multipliers are estimated from passenger density data —
a 1A compartment carries ~18 passengers vs ~90 in a Sleeper class
coach on the same train, making per-passenger emissions
proportionally higher in premium classes. These are reasonable
approximations, not lab-measured values.

**Flight radiative forcing**
A radiative forcing multiplier of 1.9× is applied to all flights.
This is the IPCC central estimate and is contested in the scientific
literature (estimates range from 1.5× to 4×). The app labels this
clearly so users understand it is an estimate.

**Google Distance Matrix for train distances**
The Distance Matrix API is called in `transit` mode to approximate
train distances between cities. Rail routes are not straight lines
and differ from road routes. Transit mode returns the best available
public transport distance which is a reasonable proxy for rail
distance, typically within 5–10% of the actual track distance.
This is acceptable for a carbon estimate where the goal is order-of-
magnitude accuracy, not precision.

**City disambiguation via state name**
When calling the Distance Matrix API, cities are passed as
"CityName, StateName, India" (e.g. "Aurangabad, Maharashtra, India")
to disambiguate cities that share names across states. This assumes
the user selects their city from the autocomplete list and does not
type a freeform city name, which the UI enforces.

**Weekly carbon budget default**
The default weekly budget is set at 85% of the user's estimated
annual baseline divided by 52. The 15% reduction target is applied
from day one as a gentle nudge without being so aggressive it
discourages new users. Users can adjust this in settings.

**Onboarding baseline accuracy**
The 4-question onboarding quiz estimates a baseline from broad
lifestyle categories. It is intentionally approximate — the goal
is to give users a starting reference point, not a scientifically
precise number. The app communicates this clearly ("This is an
estimate — your precision improves as you log entries").

**India-specific scope**
Emission factors, city data, travel class definitions, and
benchmarks are all calibrated for India. The India average (1.9t
per capita per year) is significantly lower than the global average
(4.7t) because it reflects a lower-consumption baseline, not
because Indian lifestyles are inherently greener. The app notes
this context so urban upper-middle-class users — who emit
significantly more than the national average — are not misled into
thinking they are already doing well.

**No real-time third-party app sync**
Connected app integrations (Uber, Rapido, Swiggy, Zomato) were
scoped out of the initial build. The Uber developer API requires
business partnership approval that is not available to independent
developers, and Rapido has no public API. The manual and AI text
entry methods cover the same use cases with slightly more user
effort. This was a deliberate product decision, not a technical
limitation.

---

## Running Locally

**Prerequisites:** Node.js 18+, PostgreSQL (or a Neon account)

```bash
# Clone and install
cd Harit
npm install

# Set up environment
copy .env.example .env
# Fill in DATABASE_URL, GEMINI_API_KEY, JWT_SECRET,
# GOOGLE_MAPS_API_KEY, AVIATIONSTACK_API_KEY

# Set up database
npx prisma generate
npx prisma db push

# Run (three terminals)
npx json-server --watch db.json --port 3001   # mock API
npm run dev                                    # frontend :5173
npm run server:dev                             # backend :3000
```

Open `http://localhost:5173`

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| DATABASE_URL | Yes | PostgreSQL connection string |
| GEMINI_API_KEY | Yes | AI parsing + action cards |
| JWT_SECRET | Yes | Auth token signing |
| GOOGLE_MAPS_API_KEY | Yes | Train distance calculation |
| AVIATIONSTACK_API_KEY | No | Flight route lookup (mocked without it) |
| GOOGLE_CLIENT_ID | No | Google OAuth (mocked without it) |
| GOOGLE_CLIENT_SECRET | No | Google OAuth (mocked without it) |

---

*Built with Google Antigravity · Designed for urban India*
