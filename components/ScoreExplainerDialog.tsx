"use client";

import { createPortal } from "react-dom";
import { SCORE_BANDS } from "@/lib/scoreBands";

export default function ScoreExplainerDialog({ onClose }: { onClose: () => void }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Authenticity Score</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          The <strong>Authenticity Score</strong> shows how likely your audio is to be real human speech or
          AI-generated speech. A higher score means the audio appears more likely to be real, while a lower
          score means it appears more likely to be AI-generated. Audio scoring 50 or above is classified as real.
        </p>
        <ul className="space-y-3 text-sm">
          {SCORE_BANDS.map((b) => (
            <li key={b.label}>
              <p className="font-semibold">
                {b.range} — {b.label}
              </p>
              <p className="text-gray-600">{b.description}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-gray-500">The score is a rescaled model output, not a probability.</p>
      </div>
    </div>,
    document.body
  );
}
