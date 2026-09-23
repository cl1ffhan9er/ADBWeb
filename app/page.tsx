"use client";

import { useState, useRef } from "react";
import UploadZone from "@/components/UploadZone";
import HelpDialog from "@/components/HelpDialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import ChunkProgress from "@/components/ChunkingProgress";
import DetectionReport from "@/components/DetectionReport";
import { getAudioDuration } from "@/lib/validation";
import { getExpectedChunkCount } from "@/lib/chunking";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [result, setResult] = useState<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleFileAccepted(f: File) {
    setFile(f);
    setResult(null);
    try {
      setAudioDuration(await getAudioDuration(f));
    } catch {
      setAudioDuration(null);
    }
  }

  function handleFileCleared() {
    setFile(null);
    setAudioDuration(null);
    setResult(null);
  }

  async function handleAnalyze() {
    if (!file) return;

    const totalChunks = audioDuration ? getExpectedChunkCount(audioDuration) : 1;

    setIsAnalyzing(true);
    setResult(null);
    setCurrentChunk(totalChunks > 1 ? 1 : 0);

    // SIMULATED progress: backend returns all chunk results at once,
    // it doesn't stream per-chunk completion. This ticks a counter up
    // while waiting, then snaps to 100% when the real response lands.
    if (totalChunks > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentChunk((prev) => (prev < totalChunks - 1 ? prev + 1 : prev));
      }, 900);
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await response.json();
      setResult(data);
      setCurrentChunk(totalChunks);
    } catch {
      setResult({ error: "Something went wrong. Please try again." });
    } finally {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsAnalyzing(false);
    }
  }

  const totalChunks = audioDuration ? getExpectedChunkCount(audioDuration) : 1;

  return (
    <div className="max-w-xl mx-auto mt-20 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">ADBWeb</h1>
        <button onClick={() => setShowHelp(true)} className="w-8 h-8 rounded-full border border-gray-300 text-gray-500">
          ?
        </button>
      </div>

      <UploadZone onFileAccepted={handleFileAccepted} onFileCleared={handleFileCleared} />

      <button
        onClick={handleAnalyze}
        disabled={!file || isAnalyzing}
        className="mt-6 w-full py-3 rounded-lg bg-blue-600 text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Analyze Audio
      </button>

      {result && !result.error ? (
        <DetectionReport
          result={result}
          onReturnHome={() => { setFile(null); setAudioDuration(null); setResult(null); }}
        />
      ) : null}
      {result?.error ? <p className="mt-6 text-red-600 text-sm">{result.error}</p> : null}

      {showHelp ? <HelpDialog onClose={() => setShowHelp(false)} /> : null}

      {isAnalyzing ? (
        totalChunks > 1 ? (
          <ChunkProgress currentChunk={currentChunk} totalChunks={totalChunks} />
        ) : (
          <LoadingSpinner />
        )
      ) : null}
    </div>
  );
}