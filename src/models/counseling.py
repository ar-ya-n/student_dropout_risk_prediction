"""Counseling-style recommendations from risk tier."""

from typing import Dict, List

# Exact labels must match risk_scoring.risk_score_and_category output
_MESSAGES: Dict[str, List[str]] = {
    "High Risk": [
        "Immediate counseling required",
        "Check academic performance and attendance",
    ],
    "Medium Risk": [
        "Monitor student regularly",
        "Provide mentorship support",
    ],
    "Low Risk": [
        "No immediate action needed",
    ],
}


def recommendation_for_risk_category(risk_category: str) -> str:
    """Single-line recommendation string for reporting tables."""
    lines = _MESSAGES.get(risk_category)
    if not lines:
        return "Review student profile; risk tier not recognized."
    return " | ".join(lines)


def recommendation_bullets(risk_category: str) -> List[str]:
    """Structured messages for UI or logging."""
    return list(_MESSAGES.get(risk_category, []))
