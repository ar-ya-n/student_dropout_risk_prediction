"""Classification metrics for model comparison (Phase 3)."""

from typing import Dict, Optional

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def compute_classification_metrics(
    y_true,
    y_pred,
    y_score: Optional[np.ndarray] = None,
) -> Dict[str, float]:
    """
    Accuracy, Precision, Recall, F1, ROC-AUC (binary classification).

    y_score: predicted probability of the positive class (column 1), or None to skip AUC.
    """
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)

    metrics: Dict[str, float] = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(
            precision_score(y_true, y_pred, average="binary", zero_division=0)
        ),
        "recall": float(recall_score(y_true, y_pred, average="binary", zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, average="binary", zero_division=0)),
    }

    classes = np.unique(y_true)
    if y_score is None or len(classes) < 2:
        metrics["roc_auc"] = float("nan")
        return metrics

    try:
        metrics["roc_auc"] = float(roc_auc_score(y_true, y_score))
    except ValueError:
        metrics["roc_auc"] = float("nan")

    return metrics


def format_metrics_lines(model_label: str, metrics: Dict[str, float]) -> str:
    """Human-readable block matching the requested output shape."""
    roc = metrics["roc_auc"]
    roc_line = f"ROC-AUC: {roc:.4f}" if not np.isnan(roc) else "ROC-AUC: nan"
    lines = [
        f"Model: {model_label}",
        f"Accuracy: {metrics['accuracy']:.4f}",
        f"Precision: {metrics['precision']:.4f}",
        f"Recall: {metrics['recall']:.4f}",
        f"F1: {metrics['f1']:.4f}",
        roc_line,
    ]
    return "\n".join(lines)
