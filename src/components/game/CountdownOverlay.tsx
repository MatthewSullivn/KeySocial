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
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm"
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
                  <span className="text-9xl font-black text-purple-500">
                    {count}
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <span className="text-7xl sm:text-8xl font-black bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">
                    GO!
                  </span>
                </div>
              )}
              <p className="mt-4 text-lg text-gray-500 font-medium">
                {count > 0 ? "Get ready to type..." : "Type the words as fast as you can!"}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
