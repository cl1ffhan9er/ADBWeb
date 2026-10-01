"use client";

import { motion, type Variants } from "motion/react";
import { Mascot } from "page-mascot";

type HeroProps = {
  onGetStarted: () => void;
};

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
  exit: { transition: { staggerChildren: 0.06, staggerDirection: -1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.3, ease: "easeIn" } },
};

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-adb-50"
    >
      <motion.div variants={item}>
        <Mascot
          directions="/mascots/cap-directions.webp"
          reactions="/mascots/cap-reactions.webp"
          size={180}
        />
      </motion.div>

      <motion.h1 variants={item} className="text-3xl font-semibold mt-6 text-adb-500">
        ADBWeb
      </motion.h1>

      <motion.p variants={item} className="text-gray-500 mt-2 max-w-sm">
        Detect audio deepfakes in Cebuano speech, instantly.
      </motion.p>

      <motion.button
        variants={item}
        onClick={onGetStarted}
        className="mt-8 px-8 py-3 rounded-full bg-adb-500 text-white font-medium hover:bg-adb-400 transition-colors"
      >
        Get Started!
      </motion.button>
    </motion.div>
  );
}