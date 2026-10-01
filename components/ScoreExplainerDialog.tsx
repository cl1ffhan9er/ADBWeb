"use client";

import { createPortal } from "react-dom";

const BANDS = [
  { range: "0.0 – 0.2", label: "Highly Likely Real" },
  { range: "0.2 – 0.4", label: "Likely Real" },
  { range: "0.4 – 0.6", label: "Uncertain" },
  { range: "0.6 – 0.8", label: "Likely Fake" },
  { range: "0.8 – 1.0", label: "Highly Likely Fake" },
];

export default function ScoreExplainerDialog({ onClose }: { onClose: () => void }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Authenticity Score</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          A score from 0 to 1 representing the model&apos;s confidence that the audio is synthetic.
        </p>
        <table className="w-full text-sm">
          <tbody>
            {BANDS.map((b) => (
              <tr key={b.label} className="border-t border-gray-100">
                <td className="py-2 text-gray-500">{b.range}</td>
                <td className="py-2 font-medium">{b.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    document.body
  );
}