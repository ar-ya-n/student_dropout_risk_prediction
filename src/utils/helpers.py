"""Miscellaneous helpers."""

from pathlib import Path
from typing import Iterable, List, Union

import pandas as pd


def get_project_root() -> Path:
    """Return the repository root (directory containing `data/`, `src/`, etc.)."""
    return Path(__file__).resolve().parent.parent.parent


# Preferred names for the binary/multiclass dropout target (exact match first, then case-insensitive).
_TARGET_CANDIDATES: List[str] = ["Dropout", "Status", "Target", "Class"]


def detect_target_column(columns: Union[pd.Index, Iterable[str]]) -> str:
    """
    Infer the label column from common academic ML naming conventions.

    Raises ValueError if no known candidate is present (no hardcoded feature columns).
    """
    col_list = list(columns)
    if not col_list:
        raise ValueError("DataFrame has no columns; cannot detect target.")

    as_str = [str(c) for c in col_list]

    for cand in _TARGET_CANDIDATES:
        for orig, s in zip(col_list, as_str):
            if s == cand:
                return str(orig)

    lower_map = {str(c).lower(): str(c) for c in col_list}
    for cand in _TARGET_CANDIDATES:
        key = cand.lower()
        if key in lower_map:
            return lower_map[key]

    raise ValueError(
        "Could not infer target column. Expected one column named like: "
        f"{_TARGET_CANDIDATES} (case-insensitive). "
        f"Found columns: {col_list}"
    )


def class_imbalance_ratio(y: pd.Series) -> float:
    """Return minority class share in [0, 1] (1 = perfectly balanced)."""
    counts = y.value_counts()
    if len(counts) < 2:
        return 1.0
    return float(counts.min() / counts.max())
