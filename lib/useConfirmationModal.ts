import { useState, useCallback } from 'react';

interface ConfirmationModalConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface UseConfirmationModalReturn {
  isOpen: boolean;
  openModal: (config: ConfirmationModalConfig) => Promise<boolean>;
  closeModal: () => void;
  modalConfig: ConfirmationModalConfig | null;
  handleConfirm: () => void;
}

export function useConfirmationModal(): UseConfirmationModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ConfirmationModalConfig | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const openModal = useCallback((config: ConfirmationModalConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalConfig(config);
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
    setModalConfig(null);
  }, [resolvePromise]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
    setModalConfig(null);
  }, [resolvePromise]);

  return {
    isOpen,
    openModal,
    closeModal,
    modalConfig,
    handleConfirm: handleConfirm,
  };
}
