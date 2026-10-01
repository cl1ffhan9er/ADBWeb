"use client";

import { useEffect, useState } from "react";
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
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const [filled, setFilled] = useState(0);
  const target = clamp01(score) * 100;

  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <div className="relative mx-auto w-full max-w-65">
      <svg viewBox="0 0 200 112" className="w-full" role="img" aria-label={`Authenticity score ${score.toFixed(2)}`}>
        <defs>
          <linearGradient id="gauge-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8FAEF2" />
            <stop offset="100%" stopColor="#6B92F2" />
          </linearGradient>
        </defs>
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          pathLength={100}
          fill="none"
          stroke="#EDF3F9"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          pathLength={100}
          fill="none"
          stroke="url(#gauge-fill)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${filled} 100`}
          className="transition-[stroke-dasharray] duration-1000 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-4xl font-semibold tabular-nums tracking-tight text-slate-900">
          {(clamp01(score) * 100).toFixed(1)}
          <span className="ml-0.5 text-lg font-medium text-slate-400">%</span>
        </p>
        <p className="text-xs text-slate-500">Authenticity score</p>
      </div>
    </div>
  );
}

export default function DetectionReport({ result }: DetectionReportProps) {
  const [showExplainer, setShowExplainer] = useState(false);
  const band = getScoreBand(result.overall_score);
  const hasChunks = !!result.chunks && result.chunks.length > 1;

  return (
    <section className="h-full w-full">
      <div className="h-full lg:gr  id lg:grid-cols-2">
        {/* LEFT column (desktop) / top block (mobile): verdict + gauge */}
        <div className="flex flex-col justify-center bg-linear-to-b from-adb-50 to-white px-6 py-6 sm:px-10 lg:border-r lg:border-adb-100">
          <div className="mb-6 flex justify-center">
            <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${band.colorClass}`}>{band.label}</span>
          </div>

          <ScoreGauge score={result.overall_score} />

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setShowExplainer(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-adb-500 transition-colors hover:bg-adb-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adb-500"
            >
              <InfoIcon />
              What is the Authenticity Score?
            </button>
          </div>
        </div>

        {/* RIGHT column (desktop) / bottom block (mobile): details + chunks */}
        <div className="pb-6 sm:px-10 lg:self-start lg:max-h-full lg:overflow-y-auto">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2">
              <dt className="text-xs text-slate-500">File name</dt>
              <dd className="mt-0.5 truncate text-sm font-medium text-slate-900" title={result.filename}>
                {result.filename}
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs text-slate-500">Duration</dt>
              <dd className="mt-0.5 text-sm font-medium tabular-nums text-slate-900">
                {formatDuration(result.duration_seconds)}
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <dt className="text-xs text-slate-500">Raw score</dt>
              <dd className="mt-0.5 font-mono text-sm font-medium tabular-nums text-slate-900">
                {result.overall_score.toFixed(4)}
              </dd>
            </div>
          </dl>

          {hasChunks ? (
            <div className="mt-8">
              <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100">
                {result.chunks!.map((chunk) => {
                  const chunkBand = getScoreBand(chunk.score);
                  return (
                    <li
                      key={chunk.chunk_index}
                      className="flex flex-col gap-1.5 px-4 py-3 text-sm transition-colors hover:bg-adb-50/60 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-medium text-slate-700">Segment {chunk.chunk_index + 1}</span>
                      <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${chunkBand.colorClass}`}>
                        {chunkBand.label}
                      </span>
                      <span className="font-mono text-xs tabular-nums text-slate-500">{chunk.score.toFixed(4)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {showExplainer ? <ScoreExplainerDialog onClose={() => setShowExplainer(false)} /> : null}
    </section>
  );
}