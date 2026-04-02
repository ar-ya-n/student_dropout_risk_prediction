"""Preprocessing: imputation, encoding, scaling via ColumnTransformer (no hardcoded feature names)."""

from typing import List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def pop_id_column(df: pd.DataFrame) -> Tuple[pd.DataFrame, Optional[pd.Series]]:
    """
    Remove the `id` column (case-insensitive name match) and return it separately.

    Returns (dataframe without id, id series aligned to index or None if no id column).
    """
    out = df.copy()
    id_col = None
    for c in out.columns:
        if str(c).strip().lower() == "id":
            id_col = c
            break
    if id_col is None:
        return out, None
    ids = out[id_col].copy()
    out = out.drop(columns=[id_col])
    return out, ids


def _identifier_columns_to_drop(X: pd.DataFrame) -> List[str]:
    """
    Drop obvious row-identifier columns (e.g. 'id') from features only.
    Does not use domain-specific dropout column names.
    """
    drop: List[str] = []
    for c in X.columns:
        if str(c).strip().lower() == "id":
            drop.append(str(c))
    return drop


def separate_X_y(df: pd.DataFrame, target_column: str) -> Tuple[pd.DataFrame, pd.Series]:
    """Split target from features; remove generic id column if present."""
    if target_column not in df.columns:
        raise KeyError(f"Target column '{target_column}' not in DataFrame columns.")
    y = df[target_column].copy()
    X = df.drop(columns=[target_column])
    id_drop = _identifier_columns_to_drop(X)
    if id_drop:
        X = X.drop(columns=id_drop)
    return X, y


def build_column_transformer(X: pd.DataFrame) -> ColumnTransformer:
    """
    Build an unfitted ColumnTransformer:
    - Numeric: mean imputation + StandardScaler
    - Categorical (object, category, bool): most-frequent imputation + OneHotEncoder(handle_unknown='ignore')
    """
    numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_features = X.select_dtypes(
        include=["object", "category", "bool"]
    ).columns.tolist()

    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="mean")),
            ("scaler", StandardScaler()),
        ]
    )

    try:
        ohe = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:  # scikit-learn < 1.2
        ohe = OneHotEncoder(handle_unknown="ignore", sparse=False)

    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", ohe),
        ]
    )

    transformers = []
    if numeric_features:
        transformers.append(("num", numeric_pipeline, numeric_features))
    if categorical_features:
        transformers.append(("cat", categorical_pipeline, categorical_features))

    if not transformers:
        raise ValueError(
            "No numeric or categorical feature columns found after target/id separation. "
            "Check dtypes or dataset content."
        )

    # remainder='drop' ignores any column that slipped past dtype selection (e.g. datetime)
    return ColumnTransformer(transformers=transformers, remainder="drop", verbose_feature_names_out=False)


def fit_transform_train_test(
    preprocessor: ColumnTransformer,
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
) -> Tuple[np.ndarray, np.ndarray, ColumnTransformer]:
    """
    Fit the preprocessor on training features only, then transform train and test.
    """
    X_train_t = preprocessor.fit_transform(X_train)
    X_test_t = preprocessor.transform(X_test)
    return X_train_t, X_test_t, preprocessor


def preprocess_for_modeling(
    df: pd.DataFrame,
    target_column: str,
) -> Tuple[pd.DataFrame, pd.Series, ColumnTransformer]:
    """
    Prepare features and an unfitted ColumnTransformer (convenience for inspection/tests).

    Most workflows should use train/val split then fit_transform_train_test instead.
    """
    X, y = separate_X_y(df, target_column)
    preprocessor = build_column_transformer(X)
    return X, y, preprocessor


def transformed_feature_names(preprocessor: ColumnTransformer) -> np.ndarray:
    """Output feature names after fit (requires fitted preprocessor)."""
    return preprocessor.get_feature_names_out()
