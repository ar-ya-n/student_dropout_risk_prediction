"""
Student Dropout Prediction — FastAPI layer over the inference pipeline.

Run from project root:
    uvicorn api.app:app --reload
"""

from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from typing import Any, List, Optional, Union

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from src.features.feature_engineering import apply_feature_engineering
from src.models.counseling import recommendation_bullets, recommendation_for_risk_category
from src.models.predict import positive_class_proba, predict_batch
from src.models.risk_scoring import risk_score_and_category
from src.pipelines.inference_pipeline import run_inference_pipeline

logger = logging.getLogger("api.app")

# Project root = parent of api/
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Bonus: reject very large uploads (bytes)
MAX_UPLOAD_BYTES = 5 * 1024 * 1024

DEFAULT_ARTIFACT_PATH = PROJECT_ROOT / "models" / "saved_models" / "best_model.pkl"


class SingleStudentInput(BaseModel):
    """Feature payload for one student (matches training feature names)."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    age_at_enrollment: int = Field(..., alias="Age at enrollment", ge=10, le=100, description="Age at enrollment")
    gender: int = Field(..., alias="Gender", ge=0, le=1, description="Gender (0 or 1)")
    sem1_sgpa: float = Field(..., alias="Sem1_SGPA", ge=0.0, description="Semester 1 SGPA")
    sem2_sgpa: float = Field(..., alias="Sem2_SGPA", ge=0.0, description="Semester 2 SGPA")
    cgpa: float = Field(..., alias="CGPA", ge=0.0, description="Cumulative GPA")
    attendance: float = Field(..., alias="Attendance", ge=0.0, le=100.0, description="Attendance rate (%)")
    backlogs: int = Field(..., alias="Backlogs", ge=0, description="Number of backlogs")


class SingleStudentResponse(BaseModel):
    prediction: int
    probability: float
    risk_level: str
    rank: int = Field(1, description="Single-student request always rank 1")
    recommendation: str


class PredictionRecord(BaseModel):
    """One row of scoring output for the frontend."""

    id: Union[int, str] = Field(..., description="Student identifier from CSV or synthetic row id")
    prediction: int
    probability: float
    risk_level: str
    rank: int
    recommendation: str
    input: Optional[dict] = None


class PredictResponse(BaseModel):
    results: List[PredictionRecord]
    count: int


def _json_safe_id(value: Any) -> Union[int, str]:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        raise HTTPException(status_code=400, detail="Invalid id value in output row.")
    if isinstance(value, (bool, np.bool_)):
        return int(value)
    if isinstance(value, (np.integer, int)):
        return int(value)
    if isinstance(value, float) and float(value).is_integer():
        return int(value)
    return str(value)


def _dataframe_to_results(model: pd.DataFrame) -> List[PredictionRecord]:
    rows: List[PredictionRecord] = []
    for _, r in model.iterrows():
        rows.append(
            PredictionRecord(
                id=_json_safe_id(r["ID"]),
                prediction=int(r["Prediction"]),
                probability=float(r["Probability"]),
                risk_level=str(r["Risk Level"]),
                rank=int(r["Rank"]),
                recommendation=str(r["Recommendation"]),
                input=r.get("Input_Data") if "Input_Data" in r else None,
            )
        )
    return rows


def _load_artifact() -> dict:
    if not DEFAULT_ARTIFACT_PATH.is_file():
        raise FileNotFoundError(f"Saved model not found: {DEFAULT_ARTIFACT_PATH.resolve()}")
    return joblib.load(DEFAULT_ARTIFACT_PATH)


def _primary_recommendation(risk_level: str) -> str:
    """First counseling line (matches concise single-student JSON examples)."""
    bullets = recommendation_bullets(risk_level)
    if bullets:
        return bullets[0]
    return recommendation_for_risk_category(risk_level)


app = FastAPI(
    title="Student Dropout API",
    description="CSV batch upload or single-student JSON — saved sklearn pipeline only (no training).",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> str:
    return "Student Dropout API is running"


@app.post("/predict-single", response_model=SingleStudentResponse)
def predict_single(body: SingleStudentInput) -> SingleStudentResponse:
    """
    Score one student from JSON features (no CSV).
    Uses the same preprocessing + model as batch inference; rank is always 1.
    """
    try:
        artifact = _load_artifact()
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=f"{e} Train the model first (python main.py).",
        ) from e

    pipeline = artifact["pipeline"]
    df = pd.DataFrame([body.model_dump(by_alias=True)])
    df = apply_feature_engineering(df)

    try:
        predictions = predict_batch(pipeline, df)
        probabilities = positive_class_proba(pipeline, df)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid feature data: {e}") from e
    except Exception as e:
        msg = str(e)
        if "feature" in msg.lower() or "column" in msg.lower():
            raise HTTPException(status_code=400, detail=f"Input does not match model schema: {msg}") from e
        logger.exception("predict-single failed")
        raise HTTPException(status_code=500, detail="Prediction failed. Check logs.") from e

    prediction = int(predictions[0])
    probability = float(probabilities[0])
    _, risk_level = risk_score_and_category(prediction, probability)

    return SingleStudentResponse(
        prediction=prediction,
        probability=round(probability, 6),
        risk_level=risk_level,
        rank=1,
        recommendation=_primary_recommendation(risk_level),
    )


@app.post("/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(..., description="CSV with same feature columns as training")):
    """
    Upload a CSV file; receive per-student predictions, risk tier, rank, and recommendations.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided; upload a .csv file.")

    lower = file.filename.lower()
    if not lower.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a CSV file (.csv).",
        )

    body = await file.read()
    if not body:
        raise HTTPException(status_code=400, detail="Empty file.")

    if len(body) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )

    tmp_path: Optional[Path] = None
    try:
        with tempfile.NamedTemporaryFile(mode="wb", suffix=".csv", delete=False) as tmp:
            tmp.write(body)
            tmp_path = Path(tmp.name)

        try:
            out_df = run_inference_pipeline(
                raw_csv_path=tmp_path,
                save_csv=False,
            )
        except FileNotFoundError as e:
            logger.exception("Model artifact missing")
            raise HTTPException(
                status_code=503,
                detail=str(e) + " Train the model first (python main.py).",
            ) from e
        except (ValueError, KeyError) as e:
            raise HTTPException(
                status_code=400,
                detail=f"Data or column error: {e}",
            ) from e
        except Exception as e:
            msg = str(e)
            if "feature names" in msg.lower() or "columns" in msg.lower() or "could not convert" in msg.lower():
                raise HTTPException(
                    status_code=400,
                    detail=f"CSV does not match the expected schema: {msg}",
                ) from e
            logger.exception("Inference failed")
            raise HTTPException(
                status_code=500,
                detail="Inference failed. Check server logs and CSV format.",
            ) from e

        results = _dataframe_to_results(out_df)
        return PredictResponse(results=results, count=len(results))

    finally:
        if tmp_path is not None and tmp_path.is_file():
            try:
                tmp_path.unlink()
            except OSError:
                logger.warning("Could not delete temp file %s", tmp_path)
