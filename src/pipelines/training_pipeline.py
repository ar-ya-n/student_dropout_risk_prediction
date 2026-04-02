"""End-to-end training: load → id handling → split → Pipeline(train + eval) → best model (Phase 3)."""

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder

from src.data.load_data import load_raw_data
from src.data.preprocess import build_column_transformer, pop_id_column, separate_X_y
from src.features.feature_engineering import apply_feature_engineering
from src.models.evaluate import compute_classification_metrics, format_metrics_lines
from src.models.predict import positive_class_proba
from src.models.train import get_model_candidates
from src.utils.helpers import class_imbalance_ratio, detect_target_column

logger = logging.getLogger(__name__)

_IMBALANCE_WARN_THRESHOLD = 0.35
_BEST_MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "models" / "saved_models" / "best_model.pkl"


def _configure_logging() -> None:
    if not logging.getLogger().handlers:
        logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


def _maybe_stratify(y: pd.Series) -> Optional[pd.Series]:
    counts = y.value_counts()
    if len(counts) < 2:
        return None
    if (counts < 2).any():
        return None
    return y


def _print_feature_importance_bonus(pipe: Pipeline, model_label: str, top_k: int = 10) -> None:
    """Bonus: tree model feature importances."""
    clf = pipe.named_steps["classifier"]
    if not hasattr(clf, "feature_importances_"):
        return
    prep = pipe.named_steps["preprocessor"]
    names = prep.get_feature_names_out()
    imp = clf.feature_importances_
    order = np.argsort(imp)[::-1][:top_k]
    logger.info("%s — top %d feature importances:", model_label, top_k)
    for rank, i in enumerate(order, start=1):
        logger.info("  %d. %s = %.6f", rank, names[i], float(imp[i]))


def top_feature_summary(
    pipe: Pipeline, k: int = 5
) -> List[Tuple[str, float]]:
    """Top-k features for the best pipeline (trees: importance; linear: |coef|)."""
    clf = pipe.named_steps["classifier"]
    prep = pipe.named_steps["preprocessor"]
    names = prep.get_feature_names_out()
    if hasattr(clf, "feature_importances_"):
        scores = np.asarray(clf.feature_importances_, dtype=float)
    elif hasattr(clf, "coef_"):
        scores = np.abs(np.asarray(clf.coef_, dtype=float)).ravel()
    else:
        return []
    if len(names) != len(scores):
        return []
    order = np.argsort(scores)[::-1][:k]
    return [(str(names[i]), float(scores[i])) for i in order]


def _select_best_model(metrics_by_model: Dict[str, Dict[str, float]]) -> str:
    """Primary: ROC-AUC. Secondary: F1. NaN AUC treated as worst."""

    def key_fn(item: Tuple[str, Dict[str, float]]):
        _, m = item
        auc = m["roc_auc"]
        if np.isnan(auc):
            auc = -np.inf
        return (auc, m["f1"])

    return max(metrics_by_model.items(), key=key_fn)[0]


def _predictions_with_ids(
    id_test: Optional[pd.Series],
    y_test: np.ndarray,
    y_pred: np.ndarray,
    y_score: Optional[np.ndarray],
) -> pd.DataFrame:
    """Attach student id to test-set predictions when available (id column first)."""
    data: Dict[str, Any] = {}
    if id_test is not None:
        data["id"] = id_test.to_numpy()
    data["y_true"] = np.asarray(y_test)
    data["y_pred"] = np.asarray(y_pred)
    if y_score is not None:
        data["y_score_positive"] = np.asarray(y_score)
    return pd.DataFrame(data)


def run_training_pipeline(
    raw_csv_path: Optional[str] = None,
    test_size: float = 0.2,
    random_state: int = 42,
) -> Dict[str, Any]:
    """
    Full Phase 3 flow:
      load → extract id (kept aside) → target inference → X/y → label encode → split
      → for each estimator: sklearn Pipeline(preprocessor, classifier) fit on train
      → evaluate on test (acc, precision, recall, f1, ROC-AUC)
      → pick best by ROC-AUC then F1, save to models/saved_models/best_model.pkl
    """
    _configure_logging()

    logger.info("Loading raw data...")
    df = load_raw_data(raw_csv_path)

    logger.info("Extracting student id column when present...")
    df_features, student_ids = pop_id_column(df)

    logger.info("Applying feature-engineering hook...")
    df_features = apply_feature_engineering(df_features)

    target_column = detect_target_column(df_features.columns)
    logger.info("Detected target column: %r", target_column)

    X, y_raw = separate_X_y(df_features, target_column)

    le = LabelEncoder()
    y = pd.Series(le.fit_transform(y_raw), index=y_raw.index, name=target_column)

    ratio = class_imbalance_ratio(y)
    if ratio < _IMBALANCE_WARN_THRESHOLD:
        logger.warning(
            "Possible class imbalance: minority/majority count ratio=%.3f (threshold=%.2f).",
            ratio,
            _IMBALANCE_WARN_THRESHOLD,
        )

    stratify = _maybe_stratify(y)
    if student_ids is not None:
        X_train, X_test, y_train, y_test, id_train, id_test = train_test_split(
            X,
            y,
            student_ids,
            test_size=test_size,
            random_state=random_state,
            stratify=stratify,
        )
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=random_state,
            stratify=stratify,
        )
        id_train = id_test = None

    logger.info("Train shape: %s | Test shape: %s", X_train.shape, X_test.shape)
    logger.info(
        "Target distribution (train):\n%s",
        y_train.value_counts().sort_index().to_string(),
    )
    logger.info(
        "Target distribution (test):\n%s",
        y_test.value_counts().sort_index().to_string(),
    )

    preprocessor_template = build_column_transformer(X_train)
    models = get_model_candidates()

    metrics_by_model: Dict[str, Dict[str, float]] = {}
    fitted_pipes: Dict[str, Pipeline] = {}
    prediction_tables: Dict[str, pd.DataFrame] = {}

    logger.info("Training and evaluating models...")
    for model_label, estimator in models.items():
        prep = clone(preprocessor_template)
        clf = clone(estimator)
        pipe = Pipeline(
            steps=[
                ("preprocessor", prep),
                ("classifier", clf),
            ]
        )
        pipe.fit(X_train, y_train)

        y_pred = pipe.predict(X_test)
        y_score = positive_class_proba(pipe, X_test)

        metrics = compute_classification_metrics(y_test, y_pred, y_score=y_score)
        metrics_by_model[model_label] = metrics
        fitted_pipes[model_label] = pipe

        print(format_metrics_lines(model_label, metrics))
        print()

        attach = _predictions_with_ids(id_test, y_test.values, y_pred, y_score)
        prediction_tables[model_label] = attach

        if model_label in ("Random Forest", "XGBoost"):
            _print_feature_importance_bonus(pipe, model_label)

    best_name = _select_best_model(metrics_by_model)
    best_pipe = fitted_pipes[best_name]
    best_metrics = metrics_by_model[best_name]

    _BEST_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "pipeline": best_pipe,
        "label_encoder": le,
        "target_column": target_column,
        "best_model_name": best_name,
        "best_metrics": best_metrics,
    }
    joblib.dump(artifact, _BEST_MODEL_PATH)
    logger.info("Saved best model artifact to %s", _BEST_MODEL_PATH.resolve())

    top5 = top_feature_summary(best_pipe, k=5)

    best_attach = prediction_tables[best_name]
    print("Test predictions (best model, with id when available) — sample:")
    print(best_attach.head(5).to_string())
    print()

    print("=" * 48)
    print(f"Best model name: {best_name}")
    roc = best_metrics["roc_auc"]
    print(
        f"Best ROC-AUC score: {roc:.4f}" if not np.isnan(roc) else "Best ROC-AUC score: nan"
    )
    print("Top 5 important features (best model):")
    for rank, (fname, score) in enumerate(top5, start=1):
        print(f"  {rank}. {fname} — {score:.6f}")
    print("=" * 48)

    return {
        "metrics_by_model": metrics_by_model,
        "best_model_name": best_name,
        "best_pipeline": best_pipe,
        "best_metrics": best_metrics,
        "label_encoder": le,
        "target_column": target_column,
        "test_predictions": prediction_tables,
        "id_train": id_train,
        "id_test": id_test,
        "artifact_path": str(_BEST_MODEL_PATH),
        "top_features": top5,
    }
