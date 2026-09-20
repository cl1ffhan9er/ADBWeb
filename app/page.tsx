"use client";

import { validateAudioFile } from "@/lib/validation";

export default function Home() {
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await validateAudioFile(file);
    console.log(result);
  }

  return (
    <div>
      <input type="file" accept=".wav,.mp3" onChange={handleFileChange} />
    </div>
  );
}