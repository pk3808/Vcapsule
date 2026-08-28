"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Render Portal */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2.5 pointer-events-none w-full max-w-md px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -25, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 480, damping: 28 }}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 border-black shadow-[4px_4px_0px_#18181b] w-full text-xs font-black ${
                toast.type === "warning"
                  ? "bg-[#ffd028] text-black"
                  : toast.type === "success"
                  ? "bg-[#34d399] text-black"
                  : toast.type === "error"
                  ? "bg-[#f87171] text-white"
                  : "bg-white text-[#18181b]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base shrink-0">
                  {toast.type === "warning" && "⚡"}
                  {toast.type === "success" && "🎉"}
                  {toast.type === "error" && "⚠️"}
                  {toast.type === "info" && "✦"}
                </span>
                <span className="leading-snug">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-full hover:bg-black/10 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (msg) => console.log("Toast:", msg),
    };
  }
  return context;
}
