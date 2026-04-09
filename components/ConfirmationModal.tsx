import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
}: ConfirmationModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          confirmBg: "bg-red-600 hover:bg-red-500 shadow-red-900/40",
          confirmRing: "ring-red-500/50",
          icon: "⚠️",
        };
      case "warning":
        return {
          confirmBg: "bg-orange-600 hover:bg-orange-500 shadow-orange-900/40",
          confirmRing: "ring-orange-500/50",
          icon: "⚡",
        };
      default:
        return {
          confirmBg: "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40",
          confirmRing: "ring-blue-500/50",
          icon: "ℹ️",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[5000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="glass relative w-full max-w-sm rounded-[2.5rem] p-8 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Icon */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl shadow-inner border border-white/10">
                {styles.icon}
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-white tracking-wide">
                {title}
              </h2>
              <p className="text-white/60 text-sm leading-relaxed max-w-[240px]">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`py-4 rounded-2xl ${styles.confirmBg} text-white font-heading font-bold tracking-widest shadow-xl ring-1 ring-inset ${styles.confirmRing} transition-all`}
              >
                {confirmText.toUpperCase()}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-heading font-bold tracking-widest transition-all border border-white/10"
              >
                {cancelText.toUpperCase()}
              </motion.button>
            </div>

            {/* Decor */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-white/[0.02] blur-3xl rounded-full" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
