"""Project entry point — full training, evaluation, and best-model export (Phase 3)."""

import logging

from src.pipelines.training_pipeline import run_training_pipeline

logger = logging.getLogger(__name__)


def main() -> None:
    out = run_training_pipeline()
    logger.info(
        "Done — best=%r ROC-AUC=%s artifact=%s",
        out["best_model_name"],
        out["best_metrics"].get("roc_auc"),
        out["artifact_path"],
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    main()
