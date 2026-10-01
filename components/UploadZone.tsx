"use client";

import { useState, useRef } from "react";
import { validateAudioFile } from "@/lib/validation";

type UploadZoneProps = {
  onFileAccepted: (file: File) => void;
  onFileCleared: () => void;
};

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function UploadZone({ onFileAccepted, onFileCleared }: UploadZoneProps) {
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
        <div className="h-full w-full border-2 border-gray-300 rounded-lg flex items-center justify-between px-6">
          <div>
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
          </div>
          <button onClick={handleClear} className="text-sm text-gray-500 underline">
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