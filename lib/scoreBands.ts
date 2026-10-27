export type ScoreBand = {
  label: string;
  colorClass: string; // Tailwind classes for styling
};

export type ScoreTone = "real" | "uncertain" | "fake";

// 0.5 is the calibrated decision threshold. Keep in sync with inference/scoring.py.
export const SCORE_BANDS = [
  {
    min: 0.8,
    range: "80–100",
    label: "Highly Likely Real",
    tone: "real",
    colorClass: "text-green-700 bg-green-50",
    description: "The audio strongly appears to be genuine human speech.",
  },
  {
    min: 0.6,
    range: "60–79",
    label: "Likely Real",
    tone: "real",
    colorClass: "text-green-600 bg-green-50",
    description: "The audio appears to be genuine human speech.",
  },
  {
    min: 0.5,
    range: "50–59",
    label: "Possibly Real",
    tone: "uncertain",
    colorClass: "text-gray-600 bg-gray-100",
    description: "The audio appears somewhat more likely to be real, but the result is uncertain.",
  },
  {
    min: 0.4,
    range: "40–49",
    label: "Possibly Fake",
    tone: "uncertain",
    colorClass: "text-gray-600 bg-gray-100",
    description: "The audio shows some signs of AI-generated speech, but the result is uncertain.",
  },
  {
    min: 0.2,
    range: "20–39",
    label: "Likely Fake",
    tone: "fake",
    colorClass: "text-orange-600 bg-orange-50",
    description: "The audio appears likely to be AI-generated.",
  },
  {
    min: 0,
    range: "0–19",
    label: "Highly Likely Fake",
    tone: "fake",
    colorClass: "text-red-700 bg-red-50",
    description: "The audio strongly appears to be AI-generated.",
  },
] as const satisfies readonly {
  min: number;
  range: string;
  label: string;
  tone: ScoreTone;
  colorClass: string;
  description: string;
}[];

export type ScoreBandDetails = (typeof SCORE_BANDS)[number];

export function getBandDetails(score: number): ScoreBandDetails {
  return SCORE_BANDS.find((b) => score >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
}

export function getScoreBand(score: number): ScoreBand {
  const band = getBandDetails(score);
  return { label: band.label, colorClass: band.colorClass };
}

// Floor so a score just below the threshold never shows as 50.
export function formatScore(score: number): number {
  return Math.floor(Math.min(1, Math.max(0, score)) * 100 + 1e-9);
}
