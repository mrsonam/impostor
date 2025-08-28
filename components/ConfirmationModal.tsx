import React, { useEffect } from "react";

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
  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          bg: "bg-red-600",
          border: "border-red-400",
          confirmBg: "bg-red-500 hover:bg-red-600",
          confirmText: "text-white",
        };
      case "warning":
        return {
          bg: "bg-[#656d4a]",
          border: "border-[#333d29]",
          confirmBg: "bg-[#333d29] hover:bg-[#414833]",
          confirmText: "text-white",
        };
      default:
        return {
          bg: "bg-[#640d14]",
          border: "border-yellow-200/30",
          confirmBg: "bg-yellow-500 hover:bg-yellow-600",
          confirmText: "text-white",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-message"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-md ${styles.bg} rounded-2xl shadow-2xl border ${styles.border} transform transition-all duration-300 ease-out`}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: styles.bg === "bg-[#640d14]" ? "#640d14" : undefined,
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <h2
            id="modal-title"
            className="text-xl font-bold text-white text-center"
          >
            {title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p
            id="modal-message"
            className="text-white/90 text-center leading-relaxed"
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 ${styles.confirmBg} ${styles.confirmText} font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
