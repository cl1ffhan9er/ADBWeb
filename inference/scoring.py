"""
Raw score (2*cos - 1, higher = more bona fide) -> verdict and 0-1 display score.
The display scale is piecewise-linear with the calibrated threshold at 0.5;
it is not a probability.
"""

# Medians of the Both model's validation scores; override via model_meta.json "display_anchors".
DEFAULT_ANCHORS = {"spoof_median": -1.0020, "bonafide_median": 0.88135}

# Must match lib/scoreBands.ts
BANDS = [
    (0.80, "Highly Likely Real"),
    (0.60, "Likely Real"),
    (0.50, "Possibly Real"),
    (0.40, "Possibly Fake"),
    (0.20, "Likely Fake"),
    (0.00, "Highly Likely Fake"),
]


class ScoreScale:
    def __init__(self, threshold: float, anchors: dict | None = None):
        anchors = {**DEFAULT_ANCHORS, **(anchors or {})}
        self.threshold = float(threshold)
        self.spoof_anchor = float(anchors["spoof_median"])
        self.bonafide_anchor = float(anchors["bonafide_median"])

        if not self.spoof_anchor < self.threshold < self.bonafide_anchor:
            raise ValueError(
                "Display anchors must satisfy spoof_median < threshold < bonafide_median "
                f"(got {self.spoof_anchor}, {self.threshold}, {self.bonafide_anchor})."
            )

    def is_bonafide(self, raw: float) -> bool:
        return raw >= self.threshold

    def to_display(self, raw: float) -> float:
        t = self.threshold
        if raw >= t:
            d = 0.5 + 0.45 * (raw - t) / (self.bonafide_anchor - t)
        else:
            d = 0.5 - 0.45 * (t - raw) / (t - self.spoof_anchor)
            # keep fake verdicts below 50 on screen
            d = min(d, 0.4994)
        return min(1.0, max(0.0, d))

    @staticmethod
    def band(display: float) -> str:
        for lower, label in BANDS:
            if display >= lower:
                return label
        return BANDS[-1][1]
