export type ScoreBand = {
  label: string;
  colorClass: string; // Tailwind classes for styling
};

export function getScoreBand(score: number): ScoreBand {
  if (score < 0.2) return { label: "Highly Likely Real", colorClass: "text-green-700 bg-green-50" };
  if (score < 0.4) return { label: "Likely Real", colorClass: "text-green-600 bg-green-50" };
  if (score < 0.6) return { label: "Uncertain", colorClass: "text-gray-600 bg-gray-100" };
  if (score < 0.8) return { label: "Likely Fake", colorClass: "text-orange-600 bg-orange-50" };
  return { label: "Highly Likely Fake", colorClass: "text-red-700 bg-red-50" };
}