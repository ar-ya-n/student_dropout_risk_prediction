# 🎓 Dropout Insight — AI-Powered Student Risk Prediction System

A full-stack, production-grade academic analytics platform that combines a trained machine learning pipeline with a role-based web application to detect, explain, and act on student dropout risk in real-time.

---

## 📸 Overview

Dropout Insight is a two-sided platform built for **educational institutions**:

- **Teachers / Admins** — Upload CSVs of student cohorts, view AI-ranked risk tables, and get per-student counseling recommendations.
- **Students** — Submit a self-assessment, view a personalized risk report with smart explanations, receive a prioritized action plan, and track daily academic habits with streak monitoring.

---

## 🏗️ Architecture

```
.
├── main.py                     # ML training entry point
├── requirements.txt            # Python dependencies
├── api/
│   └── app.py                  # FastAPI backend — inference only
├── src/
│   ├── data/                   # Raw data loading + preprocessing
│   ├── features/               # Feature engineering hook
│   ├── models/                 # Training, evaluation, risk scoring, counseling
│   ├── pipelines/              # Training + inference orchestration
│   └── utils/                  # Shared helpers
├── models/
│   └── saved_models/
│       └── best_model.pkl      # Serialised sklearn pipeline artifact
├── data/                       # Raw CSVs
├── notebooks/                  # Exploratory analysis
└── frontend/                   # React + Vite web application
    └── src/
        ├── App.jsx             # Router + role-based layout guards
        ├── context/            # Firebase AuthContext
        ├── firebase/           # Firebase SDK config
        ├── pages/              # All full-page React components
        ├── components/         # Shared UI components
        ├── services/           # API + Firestore access layers
        └── utils/              # Frontend analytics engine
```

---

## 🤖 Machine Learning Pipeline

### Training (`python main.py`)

The training pipeline (`src/pipelines/training_pipeline.py`) executes a complete end-to-end flow:

1. **Load** — reads raw CSV via `src/data/load_data.py`
2. **ID Extraction** — separates student ID columns before training
3. **Feature Engineering** — applies a composable hook in `src/features/feature_engineering.py`
4. **Target Detection** — auto-detects the dropout label column
5. **Label Encoding + Stratified Split** — 80/20 train-test split with class imbalance detection
6. **Multi-Model Training** — three `sklearn.Pipeline` candidates are trained and compared:
   - **Logistic Regression**
   - **Random Forest**
   - **XGBoost**
7. **Evaluation** — each model is scored on Accuracy, Precision, Recall, F1-Score, and **ROC-AUC**
8. **Best Model Selection** — best model selected by ROC-AUC (F1 as tiebreaker), saved to `models/saved_models/best_model.pkl` via `joblib`
9. **Feature Importance** — top-10 feature importances are logged for tree-based models

> The artifact bundle stores: `pipeline`, `label_encoder`, `target_column`, `best_model_name`, and `best_metrics`.

### Risk Scoring (`src/models/risk_scoring.py`)

After inference, raw probabilities are mapped to three discrete risk tiers:

| Probability | Risk Level    |
|-------------|---------------|
| ≥ 0.70      | 🔴 High Risk   |
| 0.40 – 0.69 | 🟡 Medium Risk |
| < 0.40      | 🟢 Low Risk    |

Students are ranked 1 to N by dropout probability (rank 1 = highest risk).

### Counseling (`src/models/counseling.py`)

Risk categories are mapped to human-readable, actionable recommendation bullets served directly through the API response.

---

## 🚀 FastAPI Backend (`api/app.py`)

Runs from project root:
```bash
python -m uvicorn api.app:app --reload
```

Interactive API docs available at: `http://127.0.0.1:8000/docs`

### Endpoints

| Method | Path              | Description                                                     |
|--------|-------------------|-----------------------------------------------------------------|
| `GET`  | `/`               | Health check                                                    |
| `POST` | `/predict-single` | Score a single student from a JSON payload                      |
| `POST` | `/predict`        | Upload a CSV file and score an entire student cohort in a batch |

### `POST /predict-single` — Input Schema

```json
{
  "Age at enrollment": 20,
  "Gender": 0,
  "Sem1_SGPA": 7.5,
  "Sem2_SGPA": 6.8,
  "CGPA": 7.2,
  "Attendance": 82.0,
  "Backlogs": 1
}
```

### `POST /predict-single` — Response Schema

```json
{
  "prediction": 1,
  "probability": 0.734561,
  "risk_level": "High Risk",
  "rank": 1,
  "recommendation": "Attend at least 80% of classes this semester."
}
```

### `POST /predict` — CSV Batch

Upload a `.csv` file (max 5 MB) with the same feature columns as training. Returns an array of `PredictionRecord` objects with `id`, `probability`, `risk_level`, `rank`, `recommendation`, and raw `input` data.

---

## 🌐 Frontend (`frontend/`)

Built with **React + Vite + Tailwind CSS + Framer Motion**.

### Running Locally

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Framework     | React 18 + Vite                   |
| Styling       | Tailwind CSS (custom design system)|
| Animations    | Framer Motion                     |
| Charts        | Recharts                          |
| Auth          | Firebase Authentication           |
| Database      | Cloud Firestore                   |
| HTTP Client   | Axios                             |
| Routing       | React Router v6                   |

---

## 🔐 Authentication & Role System

Firebase Authentication is used with Firestore-backed role storage.

- On **signup**, a `/users/{uid}` document is created with `{ uid, email, role }`.
- On **login**, the role is fetched from Firestore and stored in `AuthContext`.
- React Router's `<RoleRoute>` guards all protected pages — mismatched roles are redirected automatically.

### Roles

| Role      | Access                                                          |
|-----------|-----------------------------------------------------------------|
| `teacher` | Dashboard, Single Prediction, CSV Batch Upload                  |
| `student` | Student Portal (dashboard), Self-Assessment (predict), Habits   |

### Auth Flow — Signup

1. User fills the form and selects their role (Student / Teacher).
2. Firebase creates the account; Firestore writes the role document.
3. The user is immediately signed out to enforce manual login.
4. A **3-second countdown animation** plays, then redirects to the Login page.

---

## 📄 Pages

### Teacher / Admin Views

#### `Dashboard.jsx`
- Summary statistics (total students analyzed, high/medium/low risk counts)
- Charts visualizing risk distribution across uploaded cohort data

#### `SinglePrediction.jsx`
- Form with 7 input fields matching the model's feature schema
- Calls `POST /predict-single` via `api.js`
- Displays risk badge, probability percentage, recommendation
- Saves result to Firestore (`predictions` collection) scoped to teacher UID

#### `BatchUpload.jsx`
- Drag-and-drop CSV file upload
- Calls `POST /predict` to score the full file
- Results shown in a sortable, filterable `ResultsTable`
- Batch-saves all predictions to Firestore

---

### Student Views

#### `StudentPortal.jsx` (Student Dashboard)
- **Current Risk Trajectory card** — latest risk badge + score + recommendation
- **Daily Habit Tracker** (via `StudentHabits.jsx`) — three daily goals with streak monitoring
- **Current Academic Standing chart** — a color-coded `BarChart` (Recharts) mapping Sem 1 SGPA, Sem 2 SGPA, CGPA, and Attendance on a unified 0–10 scale
  - Attendance is normalized: `85% → 8.5` for visual consistency
  - Hovering the Attendance bar shows the real-world `85.0%` value in the tooltip
- **Assessment History table** — all past self-submissions

#### `StudentPredict.jsx` (Self-Assessment)
- Full 7-field input form identical to the teacher's prediction page
- On submit, calls `POST /predict-single` and saves to Firestore
- Displays enhanced results:
  - Risk Score + Badge + Recommendation
  - **Smart Risk Explanations** (via `studentAnalytics.js`) — top 3 color-coded risk factors with estimated percentage contributions
  - **Priority Action Plan** — urgency-tiered (`URGENT`, `HIGH`, `LOW`) behavioral recommendations

---

## 🧠 Smart Analytics Engine (`src/utils/studentAnalytics.js`)

A frontend-only utility that post-processes ML output to provide human-readable insights without modifying the backend.

### `getSmartExplanations(form, probability)`

Parses form inputs and derives **top risk factor contributions**:

| Condition                   | Factor       | Est. Contribution |
|-----------------------------|--------------|-------------------|
| Attendance < 75%            | 📅 Attendance | Up to 40%         |
| Attendance < 85%            | 📅 Attendance | Up to 15%         |
| CGPA < 6.0                  | 📉 Grades     | Up to 35%         |
| CGPA < 7.0                  | 📉 Grades     | Up to 20%         |
| Backlogs > 0                | 📚 Backlogs   | Up to 25%         |
| Probability > 0.4 (no flags)| 🧠 AI Profile | Up to 50%         |

### `getActionPlan(form, probability, riskLevel)`

Generates a triage-style action list:

| Condition              | Action                                           | Priority |
|------------------------|--------------------------------------------------|----------|
| Attendance < 75%       | Attend at least 80% of classes next month        | 🚨 URGENT |
| Probability > 0.6      | Schedule a session with academic counselor       | 🚨 URGENT |
| Backlogs > 0           | Schedule office hours to clear `N` backlogs      | ⚡ HIGH   |
| CGPA < 6.5             | Focus on core subjects, 2 hrs/day revision       | ⚡ HIGH   |
| No flags / good profile| Maintain habits / join advanced study groups     | ✅ LOW    |

---

## 🔥 Daily Habit Tracker (`StudentHabits.jsx`)

A persistent Firebase-backed habit tracking system:

- **Three daily habits**: Attended Classes 🎓, Studied 2+ Hours 📚, Reviewed Old Notes 📝
- Each checkbox click is saved to `Firestore: habits/{userId}` as a `{ dates: { "YYYY-MM-DD": ["classes", "study", ...] } }` document
- **Streak calculation** — counts consecutive days where at least one habit was completed
- Animated check states using Framer Motion

---

## 🗄️ Firestore Schema

```
/users/{uid}
  uid: string
  email: string
  role: "teacher" | "student"

/predictions/{docId}
  userId: string
  input: { ... }           # Raw form fields
  output: { prediction, probability, risk_level, recommendation, rank }
  createdAt: Timestamp

/habits/{userId}
  dates: {
    "2026-04-06": ["classes", "study", "revision"],
    "2026-04-05": ["classes"]
  }
```

---

## 🧩 Shared Components

| Component         | Purpose                                                               |
|-------------------|-----------------------------------------------------------------------|
| `Sidebar.jsx`     | Role-aware navigation with student/teacher link sets + logout         |
| `Navbar.jsx`      | Top bar with user info and theme controls                             |
| `ResultsTable.jsx`| Sortable, color-coded results table with risk badges and detail modal |
| `StudentModal.jsx`| Detailed view modal showing full assessment input + output            |
| `Charts.jsx`      | Teacher dashboard risk distribution charts                            |
| `StatCard.jsx`    | Metric summary card component used in Dashboard                       |
| `FileUpload.jsx`  | Drag-and-drop CSV upload component                                    |
| `Loader.jsx`      | Animated full-screen loading spinner                                  |

---

## 📦 Installation & Setup

### Prerequisites

- Python 3.9+
- Node.js 18+
- A Firebase project with **Authentication** and **Firestore** enabled

### 1. Clone & Install Python Dependencies

```bash
git clone <your-repo-url>
cd student-dropout-project
pip install -r requirements.txt
```

### 2. Train the ML Model

```bash
python main.py
```

This saves `models/saved_models/best_model.pkl`.

### 3. Start the FastAPI Backend

```bash
python -m uvicorn api.app:app --reload
```

API runs at `http://127.0.0.1:8000`.

### 4. Configure Firebase

Create `frontend/src/firebase/config.js`:

```js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 5. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

## 📊 Model Performance

After running `python main.py`, model comparison metrics are printed to the console. The best model (chosen by ROC-AUC) is saved automatically. Typical results across the three candidates:

| Model               | Key Metric  |
|---------------------|-------------|
| Logistic Regression | Baseline    |
| Random Forest       | High AUC    |
| XGBoost             | Highest AUC |

> Actual metrics depend on the training dataset used.

---

## 🗂️ CSV Format for Batch Upload

Your CSV file must contain the following columns:

| Column               | Type    | Description                 |
|----------------------|---------|-----------------------------|
| `Age at enrollment`  | integer | Student's age at enrollment |
| `Gender`             | int     | 0 or 1                      |
| `Sem1_SGPA`          | float   | Semester 1 GPA (0–10)       |
| `Sem2_SGPA`          | float   | Semester 2 GPA (0–10)       |
| `CGPA`               | float   | Cumulative GPA (0–10)       |
| `Attendance`         | float   | Attendance rate (0–100)     |
| `Backlogs`           | integer | Number of active backlogs   |

Optional: include a student `ID` column — it will be preserved in output but excluded from model features.

---

## 🔒 Security Notes

- Role assignment happens at signup from the frontend (acceptable for development/demo environments). For production, move role assignment to Firebase Cloud Functions or a secure backend.
- Firestore security rules should be configured to enforce that users can only read/write their own documents.
- The `firebase/config.js` file is excluded from version control via `.gitignore`.

---

## 📁 Key File Reference

| File | Purpose |
|------|---------|
| `main.py` | ML training entry point |
| `api/app.py` | FastAPI inference server |
| `src/pipelines/training_pipeline.py` | Full training orchestration |
| `src/pipelines/inference_pipeline.py` | Batch inference orchestration |
| `src/models/risk_scoring.py` | Probability → risk tier mapping |
| `src/models/counseling.py` | Risk → recommendation text |
| `frontend/src/App.jsx` | React router + role guards |
| `frontend/src/context/AuthContext.jsx` | Firebase auth state + role |
| `frontend/src/pages/StudentPortal.jsx` | Student dashboard |
| `frontend/src/pages/StudentPredict.jsx` | Student self-assessment |
| `frontend/src/utils/studentAnalytics.js` | Smart risk + action plan engine |
| `frontend/src/components/StudentHabits.jsx` | Habit tracker + streak logic |
| `frontend/src/services/firestoreService.js` | Firestore data access layer |
| `frontend/src/services/api.js` | Axios client for FastAPI |

---

## 🛣️ Roadmap

- [ ] Firebase Security Rules enforcement per-user
- [ ] Push notifications for high-risk streaks
- [ ] Teacher view of individual student portal data
- [ ] Model retraining trigger from admin dashboard
- [ ] Export risk reports as PDF

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

*Built with ❤️ — designed to keep students on track.*
