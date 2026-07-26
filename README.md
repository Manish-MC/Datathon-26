# KSP Intelligence — AI-Powered Analytics Platform for Karnataka Police

**Decision-support intelligence layer for Karnataka Police — built for KSP Datathon 2026**

KSP Intelligence unifies fragmented FIR, complaint, and incident records into a single searchable database, applies fully offline AI to summarize case narratives and detect patterns, and layers a complete rank-based access control system on top — mirroring the real Karnataka Police command hierarchy from Police Constable to DGP.

> **Positioning:** This platform is a decision-support layer over existing police record systems (CCTNS, PoliceIT) — not a replacement for them. Every AI output states its reasoning; nothing here is a black box, and no AI feature ever takes action on its own without human review.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [Rank-Based Access Control](#rank-based-access-control)
- [Demo Login Credentials](#demo-login-credentials)
- [Tech Stack](#tech-stack)
- [Algorithms Used](#algorithms-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Known Issues](#known-issues)
- [Future Scope](#future-scope)
- [License](#license)

---

## Problem Statement

Karnataka Police already maintains a strong digital record foundation through CCTNS and PoliceIT — crime, law-and-order, traffic, and investigation modules, GIS-based crime mapping, and performance dashboards. What's missing isn't digitization — it's an **intelligence layer** that turns those records into actionable, explainable insights fast enough for proactive policing rather than retrospective reporting.

## Key Features

### Core Intelligence Layer
- **Unified case database** — FIR, complaint, and incident records normalized into one schema mirroring the official Karnataka Police FIR ER design
- **AI Case Summarizer** — fully offline extractive summarization (TF-IDF), no external API dependency
- **Similar-Case Matching** — weighted scoring across text similarity, category, and spatial-temporal proximity, with a plain-language "matched on" explanation for every match
- **Explainable Alerts** — cluster and hotspot-spike alerts generated automatically, each with a human-readable reason; reviewable and dismissible, never auto-actioned
- **Spatial Analysis Map** — Leaflet-based hotspot mapping with grid-based concentration detection
- **Live FIR Intake** — "File New FIR" form that re-runs similarity matching and alerting on submission

### Evidence & Investigation Workflow
- Evidence upload (photo/video/audio/document) linked to case, location, suspects, and victims
- Multi-level verification (Head Constable / ASI) and separate approval (Sub-Inspector)
- Investigation creation and officer assignment with automatic notifications
- Station-wide urgent case alert broadcasting (Inspector/SHO)

### Command & Predictive Intelligence
- District investigation orders (SP/DCP)
- Multi-district comparison with auto-generated insights (DIG)
- Regional heatmaps and explainable district risk index (IGP)
- Department KPI dashboards and cross-department case flagging (ADGP)
- AI Copilot, statistical anomaly detection, criminal network graph, and executive decision timeline (DGP)

### Access, Identity & Security
- 11-tier rank-based access control, capability-driven (not hardcoded by rank name)
- Separate Admin identity for officer account provisioning — no police rank has implicit admin access
- Officer self-service profile with editable contact details and photo upload
- Secure password change flow: current password → email OTP → new password, with full session invalidation
- Real-time-style notification system (rank/station/district-scoped, polling-based)

## Rank-Based Access Control

Capabilities are cumulative — each rank inherits everything below it, plus what's added at that level. Scope widens from a single station to the entire state as rank increases.

| Rank | Scope | Key Capabilities |
|---|---|---|
| Police Constable | Station | Upload evidence, view assigned FIRs, patrol updates |
| Head Constable | Station | + Verify evidence/patrol reports, station diary, seized property |
| Assistant Sub-Inspector | Station | Same capability set as Head Constable |
| Sub-Inspector | Station | + Register FIR, create/assign investigations, approve evidence |
| Inspector / SHO | Station | + Approve FIR, urgent case alert broadcast, station staff management |
| DySP / ACP | Station cluster | *Planned — not yet implemented* |
| SP / DCP | District | + District dashboard, order investigations to Inspectors |
| DIG | Range (multi-district) | + Multi-district comparison with auto-generated insights |
| IGP | Zone (multi-range) | + Regional heatmap, explainable district risk index |
| ADGP | Department (statewide) | + Department KPI dashboard, inter-department case flagging |
| DGP | State (full access) | + AI Copilot, anomaly detection, criminal network graph, decision timeline |
| **Admin** *(separate identity)* | System | Create/manage officer accounts — not part of the police rank chain |

## Demo Login Credentials

> **For hackathon evaluation only.** These are seeded demo accounts on synthetic, anonymized data — not real officer credentials. All officer accounts share one demo password for ease of judging.

**Shared officer password:** `ksp_1709`

| Rank | Login ID |
|---|---|
| Police Constable | `PC_10452_2015` |
| Head Constable | `HC_10218_2011` |
| Assistant Sub-Inspector | `ASI_10084_2009` |
| Sub-Inspector | `SI_10021_2007` |
| Inspector / SHO | `PI_0007_2003` |
| SP / DCP | `SP_0042_1995` |
| DIG | `DIG_0028_1993` |
| IGP | `IGP_0011_1991` |
| ADGP | `ADGP_0004_1987` |
| DGP | `DGP_0001_1983` |

**Admin login** (separate credential space, distinct password):

| Login ID | Password |
|---|---|
| `ADMIN_001` | `ksp_admin_1709` |

To reset all demo data and credentials to their original seeded state at any time, use the **Reset Demo Data** button available in the app sidebar.

## Tech Stack

### Frontend
| Component | Choice |
|---|---|
| Framework | React (Vite) |
| Styling | Tailwind CSS |
| Routing | React Router |
| Maps | Leaflet.js (react-leaflet) |
| Charts | Recharts |
| State | React useState / useEffect / Context API |
| HTTP client | Native fetch API |

### Backend
| Component | Choice |
|---|---|
| Framework | FastAPI (Python) |
| ORM | SQLAlchemy |
| Database | SQLite (MVP; PostgreSQL-ready schema) |
| Auth | JWT tokens + passlib/bcrypt |
| Email | smtplib + Gmail SMTP (OTP delivery) |
| Data loading | pandas (seed_db.py) |

## Algorithms Used

No trained ML models or LLM APIs are used anywhere in this platform — every AI feature is built on classical, deterministic algorithms specifically to stay fully offline (zero network-dependency risk) and fully explainable (no black-box output).

| Algorithm | Where Used | What It Does |
|---|---|---|
| TF-IDF | Summarizer, similarity matcher | Scores word/sentence distinctiveness |
| Extractive summarization | `nlp_summarizer.py` | Picks top-scoring sentences from case narratives |
| Cosine similarity | `similarity_matcher.py` | Measures closeness between two case text vectors |
| Haversine formula | `similarity_matcher.py`, hotspot detection | Real-world GPS distance calculation |
| Grid-based spatial binning | `/analytics/hotspots` | Groups cases into lat/lon cells to detect concentration |
| Weighted linear scoring | `find_similar_cases()` | Combines text (0.5) + category (0.3) + spatial (0.2) |
| Rule-based threshold alerting | `alert_engine.py` | Fires an alert when a cluster/grid exceeds a defined count |
| Weighted composite risk index | District risk rating (IGP) | Volume trend + hotspot density + severity mix, fully transparent |
| Statistical deviation (z-score style) | Anomaly detection (DGP) | Flags districts diverging from their own historical baseline |
| Intent pattern-matching | `copilot_engine.py` (DGP) | Routes natural-language queries to existing analytics endpoints |
| Graph construction from relational data | Criminal network graph (DGP) | Builds a person/case graph from existing case relationships |

## Project Structure

```
police-ai-platform/
├── backend/
│   ├── app/
│   │   ├── main.py              # App entry point, router registration, CORS
│   │   ├── db.py                # Database engine and session management
│   │   ├── permissions.py       # Single source of truth for rank capabilities
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── routers/              # API endpoints (cases, alerts, auth, admin, etc.)
│   │   └── services/             # Business logic (summarizer, similarity, alerts, copilot)
│   ├── sample_data/               # Synthetic, anonymized seed data
│   └── seed_db.py                 # Database seeding script
└── frontend/
    └── src/
        ├── api/                   # API client functions
        ├── components/            # Reusable UI components
        ├── pages/                 # Route-level page components
        └── context/                # Auth and capability context
```

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt --break-system-packages
python seed_db.py             # seed the database with demo data
uvicorn app.main:app --reload --port 8000
```
Backend runs at `http://localhost:8000` — interactive API docs at `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

## Environment Variables

Create a `.env` file inside `backend/`:

```env
GMAIL_ADDRESS=your-sending-address@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
DEMO_MODE=false
```

`GMAIL_APP_PASSWORD` must be a Gmail **App Password** (requires 2-Step Verification on the sending account), not the account's regular password — used for OTP delivery during password changes. Set `DEMO_MODE=true` to log OTPs to the server console instead of sending real email, useful for local development.

## Known Issues

- **DySP / ACP** does not yet have a dedicated feature set — the only rank in the original hierarchy not yet fully built out.
- Email OTP delivery depends on correct Gmail App Password configuration in `.env` — if OTPs aren't arriving, verify `DEMO_MODE=false` and that the App Password is valid.

## Future Scope

- Complete the DySP / ACP rank tier
- Migrate from SQLite to PostgreSQL with PostGIS for production-scale geospatial queries
- Add Kafka/RabbitMQ for real-time ingestion at district/state scale
- Mobile app for field officers with offline-first support
- Multilingual support (Kannada, Hindi, English)
- Body camera and drone surveillance integration
- Inter-state crime intelligence sharing

## License

**Team:** *nyxie*
**Built for:** KSP Datathon 2026, Karnataka State Police