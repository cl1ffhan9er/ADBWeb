"use client";

import { useState, useRef } from "react";
import { validateAudioFile } from "@/lib/validation";

type UploadZoneProps = {
  onFileAccepted: (file: File) => void;
  onFileCleared: () => void;
  disabled?: boolean;
};

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function UploadZone({ onFileAccepted, onFileCleared, disabled = false }: UploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    const result = await validateAudioFile(file);

    if (!result.valid) {
      setError(result.error ?? "Invalid file.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    onFileAccepted(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleBrowseChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleClear() {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onFileCleared();
  }

  return (
    <div className="h-48 w-full">
      {error ? (
        <div className="h-full w-full border-2 border-red-400 bg-red-50 rounded-lg flex flex-col items-center justify-center text-center px-6">
          <p className="text-red-700 font-medium">{error}</p>
          <button onClick={handleClear} className="mt-3 text-sm underline text-red-700">
            Try again
          </button>
        </div>
      ) : selectedFile ? (
        <div className="h-full w-full border-2 border-gray-300 rounded-lg flex items-center justify-between gap-4 px-6">
          <div className="min-w-0">
            <p className="truncate font-medium" title={selectedFile.name}>{selectedFile.name}</p>
            <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            aria-label={`Clear ${selectedFile.name}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adb-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
            Clear
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`h-full w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors px-6 ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
        >
          <p className="text-gray-600">Drag and drop an audio file, or click to browse</p>
          <p className="text-sm text-gray-400 mt-1">.wav or .mp3 &middot; 3&ndash;60 seconds &middot; max 10MB</p>
          <input ref={inputRef} type="file" accept=".wav,.mp3" onChange={handleBrowseChange} className="hidden" />
        </div>
      )}
    </div>
  );
}