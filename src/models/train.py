"""Model definitions for dropout classification (Phase 3)."""

from typing import Dict

from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier


def get_model_candidates() -> Dict[str, object]:
    """
    Unfitted estimators for sklearn Pipeline(..., classifier).

    Keys are display names printed in evaluation output.
    """
    return {
        "Logistic": LogisticRegression(
            max_iter=1000,
            random_state=42,
            class_weight="balanced",
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=100,
            random_state=42,
        ),
        "XGBoost": XGBClassifier(
            random_state=42,
            eval_metric="logloss",
        ),
    }
