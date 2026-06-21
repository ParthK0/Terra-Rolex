# TerraRolex: Carbon Modeling & Gamified Sustainability Platform

TerraRolex is a full-stack, progressive web application (PWA) designed to calculate, track, and gamify personal and team-based carbon footprints.

---

## 2. Problem & Approach

**The Problem:** Most carbon tracking applications rely on static, infrequent, or generic estimations that fail to drive persistent user engagement, while lacking the real-time context necessary to prompt actual behavioral changes.

**Our Approach:** TerraRolex combines high-fidelity, server-side carbon calculation engines with localized emission factors (e.g., regional grid emissions and specific fuel types) and gamified loops (streaks, badges, and team leaderboards) to turn carbon tracking into a daily habit. Furthermore, the dashboard couples the user's rolling 7-day carbon logs with a Gemini AI coaching engine that generates context-aware, personalized sustainability recommendations ("nudges") directly tailored to their largest emission categories.

---

## 3. Screenshots & Demo

- **Glassmorphic Hero Dashboard:** A real-time, high-fidelity visualization of weekly carbon budget utilization, streak count, and contextual AI coaching advice.
- **Granular Activity Logger:** An interactive logging interface with specific options for transport, energy, food, and flight emissions.
- **Ranked Leaderboards:** Clean standings lists showing average carbon footprints, sorting individuals and teams to drive friendly competition.

* **Live Vercel Deployment:** [terra-rolex.vercel.app](https://terra-rolex.vercel.app)
* **Demo Video walkthrough:** [YouTube Demo Link](https://www.youtube.com/)

---

## 4. Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, Google Maps JS API
- **Backend:** FastAPI, Python, Cloud Firestore (Firebase Admin SDK)
- **AI Engine:** Google Gemini API (Personalized coaching and dynamic challenges)
- **Deployment:** Vercel (Monorepo serverless hosting)
- **Testing Frameworks:** Vitest (Frontend), Pytest (Backend)

---

## 5. Project Structure

```text
terra-rolex/
├── backend/            # Python backend (FastAPI, Pytest, Docker configuration)
│   ├── app/            # Source directory for backend app modules
│   │   ├── models/     # Pydantic validation schemas
│   │   ├── routers/    # FastAPI route controller endpoints
│   │   ├── services/   # Firestore repositories, Gemini engine, and CO2 calculation services
│   │   └── tests/      # Automated pytest suite
│   ├── requirements.txt# Backend python dependencies
│   ├── Dockerfile      # Container build configuration
│   └── mock_db.json    # Thread-safe database fallback mock data
├── frontend/           # React client application (Vite, TypeScript, Tailwind)
│   ├── src/            # Source directory for client-side React code
│   │   ├── components/ # Shared UI elements and controls
│   │   ├── hooks/      # Custom state hooks (auth, footprints, leaderboard)
│   │   ├── pages/      # Application router views
│   │   ├── services/   # API connectors, offline queue, and Firebase settings
│   │   └── utils/      # Client-side math calculators and benchmarks
│   ├── public/         # Static assets and PWA service workers
│   ├── package.json    # Node dependencies and scripts
│   └── vite.config.ts  # Vite build configuration
└── vercel.json         # Vercel monorepo deployment config
```

---

## 6. Setup & Installation

### Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables template and configure your keys:
   ```bash
   cp .env.example .env
   ```
5. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

#### Required Backend Environment Variables (`backend/.env`):
- `GEMINI_API_KEY`: Required. Google Gemini API key used to generate sustainability recommendations and dynamic challenges.
- `FIREBASE_CREDENTIALS_PATH`: Optional. Filepath to your Firebase service account JSON. If omitted, the backend automatically falls back to utilizing the local `mock_db.json`.
- `PORT`: Optional. The port to bind Uvicorn to (default: `8000`).

---

### Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables template:
   ```bash
   cp .env.example .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

#### Required Frontend Environment Variables (`frontend/.env.local`):
- `VITE_API_BASE_URL`: Required. Base URL of the running FastAPI server (typically `http://localhost:8000`).
- `VITE_FIREBASE_API_KEY` to `VITE_FIREBASE_APP_ID`: Required. Firebase Web SDK credentials for auth and collection management.

---

## 7. Running Tests

### Backend Tests
Navigate to the backend directory and run the pytest suite:
```bash
cd backend
pytest
```
* **Coverage Status:** The backend test suite covers the mathematical accuracy of the CO₂ calculation engine under various parameters, validation constraints of Pydantic models, and security/access scopes of API routers.

### Frontend Tests
Navigate to the frontend directory and run vitest:
```bash
cd frontend
npm run test
```
* **Coverage Status:** The frontend test suite covers core rendering of components, offline IndexedDB log queue synchronization, and hook state changes.

---

## 8. API Overview

FastAPI automatically generates interactive API documentation (Swagger UI) at `http://localhost:8000/docs`.

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/auth/register` | `POST` | Registers a new user session |
| `/api/auth/login` | `POST` | Authenticates a user session |
| `/api/log` | `POST` | Logs a daily action and calculates emission outputs |
| `/api/log/history` | `GET` | Fetches historical list of user footprint entries |
| `/api/insights/rolling` | `GET` | Computes rolling 7-day footprints and weekly budget percentages |
| `/api/insights/coaching` | `GET` | Generates personalized, rolling-habit coaching suggestions using Gemini AI |
| `/api/actions/challenges` | `GET` | Fetches sustainability challenges (AI-generated or fallback list) |
| `/api/actions/verify` | `POST` | Validates a completed challenge and updates user points/streaks |
| `/api/leaderboard` | `GET` | Fetches global and team rank standings |

---

## 9. Key Design Decisions

- **Server-Side Carbon Validation:** Carbon math (CO₂ calculations) is executed purely on the backend. This ensures validation integrity, allows us to update regional emission factors without forcing frontend reinstalls, and guarantees a uniform source of truth for both web clients and potential future API integrations.
- **Repository Interface Decoupling:** Implemented the Repository Pattern to decouple database storage. By coding against a generic `Repository` interface, we can swap between the serverless `FirestoreRepository` and a local file-based `MockRepository` via environment flags. This allows the system to boot instantly in restricted environments while enabling database-isolated test suites.
- **Service Worker Offline Cache:** Implemented an IndexedDB-backed service worker queue in the frontend. When network connections drop, user carbon logs are queued locally, then automatically synchronized to the server once the connection is restored, ensuring a resilient user experience in low-connectivity areas.

---

## 10. Known Limitations & Next Steps

- **Serverless Cold Starts:** Using free-tier serverless functions (Vercel) might introduce latency on the initial `/api/insights/coaching` endpoint load due to cold starts and remote Gemini AI API handshakes.
- **Local Fallback DB Persistence:** When running without Firebase Admin credentials, the local database helper operates in memory, meaning data clears whenever the FastAPI process resets.
- **Google Maps API Dependency:** If Google Maps API keys are not supplied, distance-based commute tracking falls back to standard keyboard mileage logging instead of automated route measurements.
