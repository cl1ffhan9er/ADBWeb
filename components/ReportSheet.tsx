"use client";

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import type { ReactNode } from "react";

type ReportSheetProps = {
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export default function ReportSheet({ isOpen, onToggle, children }: ReportSheetProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Backdrop -- only when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* The sheet -- always mounted, slides fully off-screen when closed */}
        <motion.div
            animate={{ y: isOpen ? 0 : "calc(100% - 2.5rem)" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 w-full h-[85vh] bg-white rounded-t-2xl z-50 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
            >
            <button
                onClick={onToggle}
                className="w-full flex justify-center py-2.5 shrink-0"
                aria-label={isOpen ? "Close report" : "Open report"}
            >
                <span
                className="text-adb-500 text-xl transition-transform duration-300"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                ⌃
                </span>
            </button>
            <div className="px-6 overflow-y-auto flex-1">
                {children}
            </div>
        </motion.div>
    </>,
    document.body
  );
}