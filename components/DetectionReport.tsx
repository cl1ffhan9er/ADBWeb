"use client";

import { useState } from "react";
import { getScoreBand } from "@/lib/scoreBands";
import ScoreExplainerDialog from "@/components/ScoreExplainerDialog";

type DetectionReportProps = {
  result: {
    filename: string;
    duration_seconds: number;
    overall_label: string;
    overall_score: number;
  };
  onReturnHome: () => void;
};

export default function DetectionReport({ result, onReturnHome }: DetectionReportProps) {
  const [showExplainer, setShowExplainer] = useState(false);
  const band = getScoreBand(result.overall_score);

  return (
    <div className="border border-gray-200 rounded-lg p-6 mt-6">
      <div className={`rounded-lg px-4 py-3 text-center font-semibold ${band.colorClass}`}>
        {band.label}
      </div>

      <button
        onClick={() => setShowExplainer(true)}
        className="text-xs text-blue-600 underline mt-2 block text-center w-full"
      >
        What is Authenticity Score?
      </button>

      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Authenticity Score</dt>
          <dd className="font-medium">{result.overall_score.toFixed(4)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">File Name</dt>
          <dd className="font-medium">{result.filename}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Duration</dt>
          <dd className="font-medium">{result.duration_seconds}s</dd>
        </div>
      </dl>

      <button
        onClick={onReturnHome}
        className="mt-6 w-full py-2 rounded-lg border border-gray-300 text-sm"
      >
        ← Back to Home
      </button>

      {showExplainer ? <ScoreExplainerDialog onClose={() => setShowExplainer(false)} /> : null}
    </div>
  );
}