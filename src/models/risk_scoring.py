"""Map model outputs to continuous risk score and discrete risk bands."""

from typing import Tuple, Union

import numpy as np

# Probability thresholds for counseling tiers
HIGH_RISK_MIN = 0.7
MEDIUM_RISK_MIN = 0.4


def risk_score_and_category(
    prediction: Union[int, float],
    probability: float,
) -> Tuple[float, str]:
    """
    Derive risk score and label from classifier outputs.

    risk_score: clipped dropout probability in [0, 1].
    risk_category:
      - "High Risk" if probability >= 0.7
      - "Medium Risk" if 0.4 <= probability < 0.7
      - "Low Risk" if probability < 0.4

    prediction is accepted for API compatibility; tiers use probability only.
    """
    _ = prediction  # reserved for future rules (e.g. hard override)
    p = float(np.clip(probability, 0.0, 1.0))
    risk_score = p
    if p >= HIGH_RISK_MIN:
        category = "High Risk"
    elif p >= MEDIUM_RISK_MIN:
        category = "Medium Risk"
    else:
        category = "Low Risk"
    return risk_score, category


def rank_by_risk_probability(probabilities: np.ndarray) -> np.ndarray:
    """
    Ranks where 1 = highest dropout probability (highest risk).

    Unique ranks 1..n; ties broken by row order (stable sort on -probability).
    """
    s = np.asarray(probabilities, dtype=float)
    n = len(s)
    if n == 0:
        return np.array([], dtype=int)
    desc_order = np.argsort(-s, kind="mergesort")
    ranks = np.empty(n, dtype=int)
    ranks[desc_order] = np.arange(1, n + 1)
    return ranks

