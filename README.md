# AI-Powered Analytics Platform for Karnataka Police — Hackathon MVP

A decision-support layer designed to ingest digital records, apply pattern detection to highlight crimes, and summarize/connect cases with explainable alerts.

---

## Folder Structure

```text
police-ai-platform/
├── backend/
│   ├── app/
│   │   ├── main.py         (Application entry point, SQLite database initialization & auto-seeder, health check)
│   │   ├── models/
│   │   │   └── schema.py   (SQLAlchemy models reflecting SQLite/PostgreSQL schema)
│   │   └── db.py           (SQLite database configuration and session engine)
│   ├── sample_data/
│   │   ├── generate_data.py (Script generating synthetic data with spatial-temporal clusters)
│   │   └── fir_sample.csv  (35 rows of anonymized synthetic FIR data)
│   └── requirements.txt    (Backend package dependencies)
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js   (API client for requesting backend endpoints)
│   │   ├── App.jsx         (Decision-support dashboard visual shell)
│   │   ├── index.css       (Tailwind CSS v4 & Google Font "Outfit" configuration)
│   │   └── main.jsx        (Vite entrypoint)
│   ├── package.json        (Frontend script and dependency list)
│   └── vite.config.js      (Vite config with @tailwindcss/vite plugin integration)
└── README.md
```

---

## Installation & Setup

### 1. Backend Setup (FastAPI)

1. Navigate to the `backend/` directory:
   ```bash
   cd police-ai-platform/backend
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   *Note: On startup, the server automatically maps the database tables in SQLite (`police_mvp.db`) and seeds it using `sample_data/fir_sample.csv`.*

### 2. Frontend Setup (React + Vite + Tailwind CSS v4)

1. Navigate to the `frontend/` directory:
   ```bash
   cd police-ai-platform/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL in your browser (usually `http://localhost:5173`).
