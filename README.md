# Student Dropout Prediction System

## Problem statement

This project supports **student dropout prediction**: using academic and contextual signals to estimate dropout risk early enough for counseling or intervention. It includes exploratory analysis, preprocessing, multi-model training and comparison, persistence of the best model, and a downstream **risk scoring**, **ranking**, and **counseling recommendation** layer for deployment-style scoring on new or labeled CSV data.

## What the pipeline does

| Phase | Description |
| ----- | ----------- |
| **EDA** | `notebooks/eda.ipynb` — distributions, missing data, correlations, target analysis. |
| **Data** | Load and validate CSV; optional `id` column stored separately from features; target inferred from common names (`Dropout`, `Status`, `Target`, `Class`). |
| **Preprocessing** | Numeric: mean imputation + `StandardScaler`. Categorical: most-frequent imputation + `OneHotEncoder(handle_unknown="ignore")`. Wrapped in a sklearn `Pipeline` with each classifier (fit on training split only). |
| **Training** | Trains **Logistic Regression** (class-balanced), **Random Forest**, and **XGBoost**, reports accuracy, precision, recall, F1, and ROC-AUC, picks the **best** model by ROC-AUC (then F1), saves `models/saved_models/best_model.pkl`. |
| **Inference** | Loads the saved artifact, scores rows, assigns **risk tier** and **recommendations**, **ranks** students by dropout probability (rank 1 = highest risk), optionally writes `data/processed/final_predictions.csv`. |

## Project structure

| Path | Role |
| ---- | ---- |
| `data/raw/dataset.csv` | Input data — place your CSV here (keep one target column among the supported names). |
| `data/processed/` | Outputs such as `final_predictions.csv` (and optional train/test exports if you generate them). |
| `notebooks/eda.ipynb` | Exploratory data analysis. |
| `src/data/` | `load_data.py`, `preprocess.py` (ColumnTransformer builders, `id` handling). |
| `src/features/` | `feature_engineering.py` (hook for future features). |
| `src/models/` | `train.py`, `evaluate.py`, `predict.py`, `risk_scoring.py`, `counseling.py`. |
| `src/pipelines/` | `training_pipeline.py` (train + evaluate + save best), `inference_pipeline.py` (score + rank + recommend). |
| `src/utils/` | Helpers (e.g. target detection). |
| `models/saved_models/best_model.pkl` | Serialized artifact: fitted `Pipeline` plus metadata (`target_column`, label encoder, etc.). |
| `main.py` | Trains all models and saves the best artifact. |
| `api/app.py` | **FastAPI** app: health check and CSV upload → JSON predictions. |

## Setup

1. Create and activate a virtual environment (recommended).

2. From the **project root** (`student-dropout-project/`):

   ```bash
   pip install -r requirements.txt
   ```

## How to run

### Train models and save the best pipeline

```bash
python main.py
```

This loads `data/raw/dataset.csv`, prepares features, fits each model in a full sklearn `Pipeline`, prints metrics, selects the best model, and writes **`models/saved_models/best_model.pkl`**. Run this **before** inference if the artifact is missing or after you change the training data.

### Risk scoring and counseling (inference)

```bash
python -m src.pipelines.inference_pipeline
```

Loads the saved model, reads the same (or new) CSV with **the same feature columns** as training, outputs predictions, probabilities, risk scores, risk levels, ranks, and recommendations. By default saves **`data/processed/final_predictions.csv`** and prints the **top 10** highest-risk students plus counts for High / Medium / Low risk tiers.

Risk tiers use predicted dropout probability: **High** ≥ 0.7, **Medium** ≥ 0.4, **Low** otherwise.

### REST API (FastAPI)

From the **project root**, after installing dependencies and training (`python main.py`):

```bash
uvicorn api.app:app --reload
```

- **GET** `http://127.0.0.1:8000/` — health message.
- **POST** `http://127.0.0.1:8000/predict` — `multipart/form-data` with field **`file`**: upload a `.csv` (same schema as training). Response JSON: `{ "results": [...], "count": N }` where each item has `id`, `prediction`, `probability`, `risk_level`, `rank`, `recommendation`. Uploads are capped at **5 MB**; **CORS** is enabled for browser frontends.
- **POST** `http://127.0.0.1:8000/predict-single` — JSON body with one student’s features (`attendance_rate`, `gpa`, `age`, `num_failed_courses`, `parental_education`, `scholarship`, `internet_access`). Returns `prediction`, `probability`, `risk_level`, `rank` (always `1`), and a primary `recommendation` line. Unknown extra fields return **422**.

Interactive docs: `http://127.0.0.1:8000/docs`.

### Exploratory analysis

Open `notebooks/eda.ipynb` in Jupyter or VS Code. Run from the `notebooks/` directory so paths to `../data/raw/dataset.csv` resolve correctly.

## Data expectations

- **Target**: one column named like `Dropout`, `Status`, `Target`, or `Class` (case-insensitive matching supported).
- **Identifier**: optional column `id` (case-insensitive) is excluded from features but preserved for reporting in inference output.
- **Inference** on new files: include the same feature columns as in training; if the target is present it is dropped before prediction so you can score labeled exports.

## License / usage

Use and adapt for academic or institutional purposes according to your local data-governance rules; ensure student data is handled in compliance with applicable privacy regulations.
