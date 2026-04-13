"""
explain_backend.py — Walk through every layer of the backend and print a clear explanation.

Run from the project root:
    python explain_backend.py
"""

import textwrap


# ─── helpers ─────────────────────────────────────────────────────────────────

def section(title: str) -> None:
    width = 70
    print("\n" + "═" * width)
    print(f"  {title}")
    print("═" * width)


def sub(title: str) -> None:
    print(f"\n▶  {title}")
    print("─" * 60)


def info(text: str) -> None:
    for line in textwrap.dedent(text).strip().splitlines():
        print("   " + line)


def show_flow(steps: list[str]) -> None:
    for i, step in enumerate(steps):
        connector = "   ↓\n" if i < len(steps) - 1 else ""
        print(f"   [{i + 1}] {step}")
        if connector:
            print(connector, end="")


# ─── 1. Project structure ─────────────────────────────────────────────────────

section("1. PROJECT STRUCTURE")
info("""
The backend is a pure Python package split into four layers:

  src/
  ├── data/
  │   ├── load_data.py          ← read & validate the raw CSV
  │   └── preprocess.py         ← imputation, encoding, scaling
  ├── features/
  │   └── feature_engineering.py ← domain-specific transforms (extensible)
  ├── models/
  │   ├── train.py              ← model catalogue (Logistic, RF, XGBoost)
  │   ├── evaluate.py           ← classification metrics (Acc/P/R/F1/AUC)
  │   ├── predict.py            ← batch predict + dropout probability
  │   ├── risk_scoring.py       ← probability → risk tier + rank
  │   └── counseling.py         ← risk tier → counseling messages
  ├── pipelines/
  │   ├── training_pipeline.py  ← full offline train-and-save flow
  │   └── inference_pipeline.py ← load saved model → score → rank → counsel
  └── utils/
      └── helpers.py            ← project-root, target-column detection, imbalance ratio

  api/
  └── app.py                    ← FastAPI: /predict-single (JSON) + /predict (CSV upload)

  main.py                       ← entry point: runs the training pipeline
""")


# ─── 2. Data layer ────────────────────────────────────────────────────────────

section("2. DATA LAYER  (src/data/)")

sub("load_data.py — Load & validate raw CSV")
info("""
Function: load_raw_data(csv_path=None)

  • Default path : data/raw/dropout_prediction.csv
  • Checks       : file exists, non-empty, contains ALL required columns
  • Required columns:
      Age at enrollment, Gender, Sem1_SGPA, Sem2_SGPA,
      CGPA, Attendance, Backlogs, Dropout
  • Returns      : pandas DataFrame
  • On error     : FileNotFoundError or ValueError with a clear message
""")

sub("preprocess.py — Imputation, Encoding, Scaling")
info("""
Key functions:

  pop_id_column(df)
    └─ Removes the optional 'id' column and returns it separately
       so it does not contaminate feature training.

  separate_X_y(df, target_column)
    └─ Splits DataFrame into X (features) and y (label series).
       Also drops any remaining 'id' columns from X.

  build_column_transformer(X)
    └─ Inspects X dtype-by-dtype and builds a sklearn ColumnTransformer:
         Numeric  → SimpleImputer(mean)    → StandardScaler
         Categorical/bool → SimpleImputer(most_frequent) → OneHotEncoder

  fit_transform_train_test(preprocessor, X_train, X_test)
    └─ Fits ONLY on training data; transforms both train and test.
       Prevents data leakage.
""")


# ─── 3. Feature engineering ───────────────────────────────────────────────────

section("3. FEATURE ENGINEERING  (src/features/)")

sub("feature_engineering.py")
info("""
Function: apply_feature_engineering(df)

  Currently a pass-through (returns df.copy() unchanged).
  This is a deliberate extension point — add domain-specific transforms
  here (e.g. derived attendance buckets, GPA trends) without touching
  the pipeline orchestration code.

  Called at the START of both training and inference pipelines to ensure
  both paths stay in sync.
""")


# ─── 4. Model layer ───────────────────────────────────────────────────────────

section("4. MODEL LAYER  (src/models/)")

sub("train.py — Model catalogue")
info("""
Function: get_model_candidates() → dict

  Returns three unfitted sklearn-compatible estimators:

  "Logistic"      → LogisticRegression(max_iter=1000, class_weight='balanced')
  "Random Forest" → RandomForestClassifier(n_estimators=100)
  "XGBoost"       → XGBClassifier(eval_metric='logloss')

  All are wrapped inside sklearn Pipelines (preprocessor → classifier)
  during training so preprocessing is always part of the fitted artifact.
""")

sub("evaluate.py — Classification metrics")
info("""
Function: compute_classification_metrics(y_true, y_pred, y_score)

  Computes for each model:
    • Accuracy   — overall correctness
    • Precision  — of predicted dropouts, how many actually dropped out
    • Recall     — of actual dropouts, how many were caught
    • F1 Score   — harmonic mean of Precision + Recall
    • ROC-AUC    — area under the ROC curve (requires probability scores)

  format_metrics_lines() formats them for console output.
""")

sub("predict.py — Batch predict + probabilities")
info("""
  predict_batch(model, X)
    └─ Calls model.predict(X) → integer labels (0 = stayed, 1 = dropout)

  positive_class_proba(pipeline, X)
    └─ Calls pipeline.predict_proba(X) and extracts the column for
       class label 1 (dropout), even if the classifier reorders classes.
       Returns probabilities in [0.0, 1.0].
""")

sub("risk_scoring.py — Risk tier + ranking")
info("""
  risk_score_and_category(prediction, probability)
    └─ Maps probability to a risk tier:
         probability ≥ 0.70  →  "High Risk"
         probability ≥ 0.40  →  "Medium Risk"
         probability < 0.40  →  "Low Risk"
       Returns (risk_score, risk_category).

  rank_by_risk_probability(probabilities)
    └─ Ranks all students 1..N where rank 1 = highest dropout probability.
       Uses stable sort (ties broken by row order).
""")

sub("counseling.py — Recommendations per risk tier")
info("""
  recommendation_for_risk_category(risk_category) → str
    └─ Returns a pipe-separated single line for reports/tables:
         High Risk   → "Immediate counseling required | Check academic
                        performance and attendance"
         Medium Risk → "Monitor student regularly | Provide mentorship support"
         Low Risk    → "No immediate action needed"

  recommendation_bullets(risk_category) → List[str]
    └─ Same messages as a Python list, intended for UI rendering.
""")


# ─── 5. Pipeline orchestration ────────────────────────────────────────────────

section("5. PIPELINE ORCHESTRATION  (src/pipelines/)")

sub("training_pipeline.py — Full offline training flow")
info("run_training_pipeline() performs these steps in order:")
print()
show_flow([
    "load_raw_data()                   ← validate & read CSV",
    "pop_id_column()                   ← keep student IDs aside",
    "apply_feature_engineering()       ← domain transforms (extensible)",
    "detect_target_column()            ← find 'Dropout' column automatically",
    "separate_X_y()                    ← split features from label",
    "LabelEncoder().fit_transform(y)   ← encode target to 0/1 integers",
    "class_imbalance_ratio()           ← warn if minority < 35% of majority",
    "train_test_split(stratify=y)      ← 80% train / 20% test",
    "build_column_transformer()        ← numeric+categorical preprocessing",
    "For each model candidate:         ← Logistic, Random Forest, XGBoost",
    "  Pipeline(preprocessor+clf).fit(X_train, y_train)",
    "  predict & positive_class_proba  ← get labels + dropout probabilities",
    "  compute_classification_metrics  ← Acc, P, R, F1, ROC-AUC",
    "select best by ROC-AUC then F1",
    "joblib.dump(artifact)             ← save to models/saved_models/best_model.pkl",
])
print()
info("""
  Saved artifact contains:
    • pipeline       — fitted sklearn Pipeline (preprocessor + best classifier)
    • label_encoder  — maps predictions back to original label names
    • target_column  — column name ('Dropout')
    • best_model_name, best_metrics
""")

sub("inference_pipeline.py — Score new students without retraining")
info("run_inference_pipeline() performs these steps:")
print()
show_flow([
    "joblib.load(best_model.pkl)       ← load saved artifact",
    "load_raw_data()                   ← read new CSV",
    "pop_id_column()                   ← separate IDs",
    "apply_feature_engineering()       ← same transform as training",
    "Drop target column if present     ← prevent label leakage",
    "predict_batch()                   ← class predictions (0 or 1)",
    "positive_class_proba()            ← dropout probabilities [0, 1]",
    "risk_score_and_category()         ← 'High' / 'Medium' / 'Low' Risk per student",
    "rank_by_risk_probability()        ← rank 1 = most at risk",
    "recommendation_for_risk_category()← attach counseling message",
    "Build result DataFrame            ← ID, Prediction, Probability, Risk Level, Rank, Recommendation",
    "Sort by Rank ascending            ← highest-risk students first",
    "Optionally save to data/processed/final_predictions.csv",
])


# ─── 6. API layer ─────────────────────────────────────────────────────────────

section("6. API LAYER  (api/app.py — FastAPI)")

sub("POST /predict-single — Score one student from JSON")
info("""
  Request body (JSON, field aliases shown):
    {
      "Age at enrollment": 20,
      "Gender":            1,
      "Sem1_SGPA":         7.5,
      "Sem2_SGPA":         6.8,
      "CGPA":              7.1,
      "Attendance":        72.0,
      "Backlogs":          2
    }

  Processing:
    1. Validate with Pydantic (SingleStudentInput)
    2. Build a single-row DataFrame
    3. apply_feature_engineering()
    4. Load best_model.pkl → predict_batch + positive_class_proba
    5. risk_score_and_category()
    6. recommendation_bullets() → first bullet as recommendation

  Response:
    { "prediction": 1, "probability": 0.84, "risk_level": "High Risk",
      "rank": 1, "recommendation": "Immediate counseling required" }

  Errors: 400 bad features, 503 model not found (run training first)
""")

sub("POST /predict — Score a batch from a CSV upload")
info("""
  Request: multipart/form-data with a .csv file (max 5 MB)

  Processing:
    1. Validate file extension (.csv) and size (≤ 5 MB)
    2. Write upload to a temp file
    3. run_inference_pipeline(tmp_path, save_csv=False)
    4. Convert result DataFrame to list of PredictionRecord objects

  Response:
    {
      "count": 250,
      "results": [
        { "id": 1, "prediction": 1, "probability": 0.91,
          "risk_level": "High Risk", "rank": 1,
          "recommendation": "Immediate counseling required | ...",
          "input": { ...original CSV row... } },
        ...
      ]
    }

  Temp file is always deleted in a finally block (no disk leaks).
  Errors: 400 wrong format/columns, 413 file too large, 503 model missing
""")

sub("CORS & middleware")
info("""
  allow_origins=["*"] — frontend (React/Vite) can call from any origin.
  Allows all HTTP methods and headers.
""")


# ─── 7. Entry point ───────────────────────────────────────────────────────────

section("7. ENTRY POINT  (main.py)")
info("""
  python main.py
    └─ Calls run_training_pipeline() with default settings.
       Prints per-model metrics, best model name, ROC-AUC, and top-5
       feature importances to stdout.
       Saves best model to models/saved_models/best_model.pkl.

  After training, start the API:
    uvicorn api.app:app --reload

  The frontend (React/Vite) then calls the API endpoints to display
  risk rankings and counseling recommendations.
""")


# ─── 8. Full data-flow summary ────────────────────────────────────────────────

section("8. END-TO-END DATA FLOW SUMMARY")
print()
print("  TRAINING (offline, once)")
show_flow([
    "data/raw/dropout_prediction.csv",
    "Validate + Load",
    "Feature Engineering",
    "Preprocess (impute → scale/encode)",
    "Train Logistic / RandomForest / XGBoost",
    "Evaluate → pick best by ROC-AUC",
    "models/saved_models/best_model.pkl",
])
print()
print("  INFERENCE (online, on demand)")
show_flow([
    "New CSV upload  OR  Single-student JSON  (via FastAPI)",
    "Feature Engineering  (same hook as training)",
    "Load best_model.pkl → predict",
    "Risk Tier:  High / Medium / Low",
    "Rank students by dropout probability",
    "Attach counseling recommendation",
    "JSON response → React Frontend",
])

print("\n" + "═" * 70)
print("  Backend explanation complete.")
print("═" * 70 + "\n")
