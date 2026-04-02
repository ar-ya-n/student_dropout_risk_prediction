"""Load persisted model and produce risk-ranked predictions + counseling text (Phase 4)."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional, Union

import joblib
import numpy as np
import pandas as pd

from src.data.load_data import load_raw_data
from src.data.preprocess import pop_id_column
from src.features.feature_engineering import apply_feature_engineering
from src.models.counseling import recommendation_for_risk_category
from src.models.predict import positive_class_proba, predict_batch
from src.models.risk_scoring import rank_by_risk_probability, risk_score_and_category

logger = logging.getLogger("src.pipelines.inference_pipeline")

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_DEFAULT_ARTIFACT = _PROJECT_ROOT / "models" / "saved_models" / "best_model.pkl"
_DEFAULT_OUTPUT_CSV = _PROJECT_ROOT / "data" / "processed" / "final_predictions.csv"


def _resolve_student_ids(ids: Optional[pd.Series], n_rows: int) -> np.ndarray:
    if ids is not None:
        return ids.to_numpy()
    return np.arange(1, n_rows + 1, dtype=int)


def run_inference_pipeline(
    raw_csv_path: Optional[Union[str, Path]] = None,
    artifact_path: Optional[Union[str, Path]] = None,
    save_csv: bool = True,
    output_csv_path: Optional[Union[str, Path]] = None,
) -> pd.DataFrame:
    """
    Load raw data and saved training artifact, score all rows, rank by risk, attach counseling.

    Does not retrain. Drops target column for prediction when present (holdout / scoring on labeled file).
    """
    path_model = Path(artifact_path) if artifact_path else _DEFAULT_ARTIFACT
    if not path_model.is_file():
        raise FileNotFoundError(f"Saved model not found: {path_model.resolve()}")

    artifact: Dict[str, Any] = joblib.load(path_model)
    pipeline = artifact["pipeline"]
    target_column = artifact["target_column"]

    df = load_raw_data(raw_csv_path)
    df, student_ids = pop_id_column(df)
    df = apply_feature_engineering(df)

    if target_column in df.columns:
        X = df.drop(columns=[target_column])
    else:
        X = df

    predictions = predict_batch(pipeline, X)
    probabilities = positive_class_proba(pipeline, X)

    n = len(X)
    ids_out = _resolve_student_ids(student_ids, n)

    risk_scores = []
    risk_levels = []
    recommendations = []
    for pred, prob in zip(predictions, probabilities):
        score, cat = risk_score_and_category(int(pred), float(prob))
        risk_scores.append(score)
        risk_levels.append(cat)
        recommendations.append(recommendation_for_risk_category(cat))

    ranks = rank_by_risk_probability(probabilities)

    result = pd.DataFrame(
        {
            "ID": ids_out,
            "Prediction": predictions.astype(int),
            "Probability": np.asarray(probabilities, dtype=float),
            "Risk_Score": risk_scores,
            "Risk Level": risk_levels,
            "Rank": ranks,
            "Recommendation": recommendations,
        }
    )

    # Sort for readability: highest risk first
    result = result.sort_values("Rank", kind="mergesort").reset_index(drop=True)

    out_path = Path(output_csv_path) if output_csv_path else _DEFAULT_OUTPUT_CSV
    if save_csv:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        result.to_csv(out_path, index=False)
        logger.info("Wrote final predictions to %s", out_path.resolve())

    return result


def print_inference_summary(results: pd.DataFrame, top_k: int = 10) -> None:
    """Top-k highest-risk students and risk-level counts."""
    top = results.nsmallest(top_k, "Rank")
    print(f"\nTop {top_k} highest-risk students (by dropout probability rank):")
    cols = ["ID", "Prediction", "Probability", "Risk Level", "Rank", "Recommendation"]
    print(top[cols].to_string(index=False))

    print("\nRisk level counts:")
    counts = results["Risk Level"].value_counts()
    for level in ("High Risk", "Medium Risk", "Low Risk"):
        c = int(counts.get(level, 0))
        print(f"  {level}: {c}")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    df = run_inference_pipeline()
    print_inference_summary(df, top_k=10)


if __name__ == "__main__":
    main()
