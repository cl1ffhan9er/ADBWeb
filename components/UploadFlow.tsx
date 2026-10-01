"use client";

import { useState, useRef } from "react";
import UploadZone from "@/components/UploadZone";
import HelpDialog from "@/components/HelpDialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import ChunkProgress from "@/components/ChunkingProgress";
import DetectionReport from "@/components/DetectionReport";
import { getAudioDuration } from "@/lib/validation";
import { getExpectedChunkCount } from "@/lib/chunking";
import { useEffect } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import { motion } from "motion/react";
import ReportSheet from "@/components/ReportSheet";
import NoDataYet from "@/components/NoDataYet"

export default function UploadFlow() {
  const [file, setFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [result, setResult] = useState<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [showReport, setShowReport] = useState(false);

  // Abort any in-flight analysis if the user closes/refreshes the tab
  useEffect(() => {
    function handleBeforeUnload() {
      abortControllerRef.current?.abort();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

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
    const TICK_MS = 400;
    const minDisplayMs = totalChunks > 1 ? totalChunks * TICK_MS : 0;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsAnalyzing(true);
    setResult(null);
    setCurrentChunk(totalChunks > 1 ? 1 : 0);

    if (totalChunks > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentChunk((prev) => (prev < totalChunks - 1 ? prev + 1 : prev));
      }, TICK_MS);
    }

    const startTime = Date.now();
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const data = await response.json();

      const elapsed = Date.now() - startTime;
      if (elapsed < minDisplayMs) {
        await new Promise((resolve) => setTimeout(resolve, minDisplayMs - elapsed));
      }

      setResult(data);
      setCurrentChunk(totalChunks);
      if (!data.error) setShowReport(true);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // Request was intentionally cancelled (tab closed/refreshed) -- no error UI needed,
        // the page is going away anyway.
        return;
      }
      setResult({ error: "Something went wrong. Please check your connection and try again." });
    } finally {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsAnalyzing(false);
    }
  }

  const totalChunks = audioDuration ? getExpectedChunkCount(audioDuration) : 1;

  return (
    <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
    >
    <div className="min-h-screen bg-adb-50 flex items-center justify-center px-4 sm:px-6">
      <div className="h-full w-full max-w-5xl px-8 p-4 rounded-3xl shadow-2xl space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-adb-300">ADBWeb</h1>
          <button onClick={() => setShowHelp(true)} className="w-8 h-8 rounded-full border border-adb-200 text-adb-300">
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
    

        <ReportSheet isOpen={showReport} onToggle={() => setShowReport((prev) => !prev)}>
            {result && !result.error ? <DetectionReport result={result} /> : <NoDataYet/>}
        </ReportSheet>

        {result?.error ? (
          <ErrorBanner
            message={result.error}
            onRetry={() => { setResult(null); }}
          />
        ) : null}

        {showHelp ? <HelpDialog onClose={() => setShowHelp(false)} /> : null}

        {isAnalyzing ? (
          totalChunks > 1 ? (
            <ChunkProgress currentChunk={currentChunk} totalChunks={totalChunks} />
          ) : (
            <LoadingSpinner />
          )
        ) : null}
      </div>
    </div>
    </motion.div>
  );
}