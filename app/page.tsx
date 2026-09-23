"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import HelpDialog from "@/components/HelpDialog";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  async function handleAnalyze() {
    if (!file) return;

    setIsAnalyzing(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Something went wrong. Please try again." });
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-20 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">ADBWeb</h1>
        <button
          onClick={() => setShowHelp(true)}
          className="w-8 h-8 rounded-full border border-gray-300 text-gray-500"
        >
          ?
        </button>
      </div>

      <UploadZone
        onFileAccepted={(f) => { setFile(f); setResult(null); }}
        onFileCleared={() => { setFile(null); setResult(null); }}
      />

      <button
        onClick={handleAnalyze}
        disabled={!file || isAnalyzing}
        className="mt-6 w-full py-3 rounded-lg bg-blue-600 text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Analyze Audio
      </button>

      {/* TEMPORARY raw output -- real report screen comes Day 7 */}
      {result ? (
        <pre className="mt-6 bg-gray-100 text-black p-4 rounded text-xs overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}

      {showHelp ? <HelpDialog onClose={() => setShowHelp(false)} /> : null}
      {isAnalyzing ? <LoadingSpinner /> : null}
    </div>
  );
}