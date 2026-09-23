"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="max-w-xl mx-auto mt-20 px-4">
      <h1 className="text-2xl font-semibold mb-6">ADBWeb</h1>

      <UploadZone
        onFileAccepted={(f) => setFile(f)}
        onFileCleared={() => setFile(null)}
      />

      <button
        disabled={!file}
        className="mt-6 w-full py-3 rounded-lg bg-blue-600 text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Analyze Audio
      </button>
    </div>
  );
}