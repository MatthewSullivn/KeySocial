"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CountdownOverlayProps {
  count: number;
  show: boolean;
}

export default function CountdownOverlay({ count, show }: CountdownOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/90 backdrop-blur-sm"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={count}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center"
            >
              {count > 0 ? (
                <div className="relative">
                  <span className="text-9xl font-black text-neon-green text-glow-green">
                    {count}
                  </span>
                  <div className="absolute inset-0 blur-3xl bg-neon-green/10 rounded-full" />
                </div>
              ) : (
                <div className="relative">
                  <span className="text-7xl sm:text-8xl font-black bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">
                    GO!
                  </span>
                  <div className="absolute inset-0 blur-3xl bg-neon-green/20 rounded-full" />
                </div>
              )}
              <p className="mt-4 text-lg text-slate-400 font-medium">
                {count > 0 ? "Get ready to type..." : "Type the words as fast as you can!"}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
