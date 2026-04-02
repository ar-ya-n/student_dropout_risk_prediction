"""Load raw datasets from disk."""

import logging
from pathlib import Path
from typing import List, Optional, Union

import pandas as pd

logger = logging.getLogger(__name__)

# Columns required in the new dropout_prediction.csv dataset
_REQUIRED_COLUMNS: List[str] = [
    "Age at enrollment",
    "Gender",
    "Sem1_SGPA",
    "Sem2_SGPA",
    "CGPA",
    "Attendance",
    "Backlogs",
    "Dropout",
]

_DEFAULT_DATASET = "dropout_prediction.csv"


def _project_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def load_raw_data(csv_path: Optional[Union[str, Path]] = None) -> pd.DataFrame:
    """
    Load the raw CSV from data/raw/dropout_prediction.csv (or a custom path).

    Validates that the file exists, is non-empty, and contains the required
    columns.  Logs and prints dataset shape on success.
    """
    path = (
        Path(csv_path)
        if csv_path is not None
        else _project_root() / "data" / "raw" / _DEFAULT_DATASET
    )

    if not path.is_file():
        raise FileNotFoundError(
            f"Dataset file not found: {path.resolve()}\n"
            f"Expected the new dataset at: data/raw/{_DEFAULT_DATASET}"
        )

    if path.stat().st_size == 0:
        raise ValueError(f"Dataset file is empty: {path.resolve()}")

    df = pd.read_csv(path)

    if df.empty or len(df) == 0:
        raise ValueError("Loaded DataFrame is empty (no rows).")

    # --- Column validation ---
    missing = [c for c in _REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(
            f"Dataset is missing required columns: {missing}\n"
            f"Found columns: {df.columns.tolist()}"
        )

    # --- Logging & print confirmation ---
    n_rows, n_cols = df.shape
    msg = f"Loaded {path.name} with {n_rows} rows and {n_cols} columns"
    print(msg)
    logger.info(msg)

    return df
