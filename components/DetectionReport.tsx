"use client";

import { useState } from "react";
import { getScoreBand } from "@/lib/scoreBands";
import ScoreExplainerDialog from "@/components/ScoreExplainerDialog";

type ChunkResult = { chunk_index: number; label: string; score: number };

type DetectionReportProps = {
  result: {
    filename: string;
    duration_seconds: number;
    overall_label: string;
    overall_score: number;
    chunks?: ChunkResult[];
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

      {result.chunks && result.chunks.length > 1 ? (
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Per-Chunk Results</p>
          <div className="space-y-2">
            {result.chunks.map((chunk) => {
              const chunkBand = getScoreBand(chunk.score);
              return (
                <div
                  key={chunk.chunk_index}
                  className="flex justify-between items-center text-sm border border-gray-100 rounded px-3 py-2"
                >
                  <span className="text-gray-500">Chunk {chunk.chunk_index + 1}</span>
                  <span className={`px-2 py-0.5 rounded ${chunkBand.colorClass}`}>{chunkBand.label}</span>
                  <span className="text-gray-500">{chunk.score.toFixed(4)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

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