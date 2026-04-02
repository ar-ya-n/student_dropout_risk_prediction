"""Batch predictions and probability extraction for sklearn Pipelines."""

from typing import Any

import numpy as np
from sklearn.pipeline import Pipeline


def predict_batch(model: Any, X: Any) -> np.ndarray:
    """Run inference using a fitted estimator or Pipeline."""
    return model.predict(X)


def positive_class_proba(pipeline: Pipeline, X: Any) -> np.ndarray:
    """
    Probability of the positive class (label 1) for binary classifiers inside a Pipeline.

    Matches training-time ROC positive-class column logic.
    """
    proba = pipeline.predict_proba(X)
    clf = pipeline.named_steps["classifier"]
    classes = getattr(clf, "classes_", None)
    if classes is None or proba.ndim != 2:
        return np.asarray(proba).ravel()
    classes = np.asarray(classes)
    if len(classes) != 2:
        return proba[:, 1] if proba.shape[1] > 1 else proba[:, 0]
    hits = np.nonzero(classes == 1)[0]
    if hits.size:
        idx = int(hits[0])
    else:
        idx = int(np.argmax(classes))
    return proba[:, idx]
