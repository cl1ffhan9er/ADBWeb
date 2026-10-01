"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import Hero from "@/components/Hero";
import UploadFlow from "@/components/UploadFlow";

export default function Home() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="overflow-hidden">
      <AnimatePresence mode="wait">
        {!showUpload ? (
          <Hero key="hero" onGetStarted={() => setShowUpload(true)} />
        ) : (
          <UploadFlow key="upload" />
        )}
      </AnimatePresence>
    </div>
  );
}