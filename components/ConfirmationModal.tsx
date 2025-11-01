import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen, onClose, onConfirm, title, message,
  confirmText = 'Confirm', cancelText = 'Cancel', isConfirming = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div className="bg-[var(--color-card-bg)] rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2 text-[var(--color-main-text)]">{title}</h3>
        <div className="text-sm text-[var(--color-light-text)] mb-6">{message}</div>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-[var(--color-secondary-btn-bg)] text-[var(--color-secondary-btn-text)] hover:opacity-90 transition-opacity">
            {cancelText}
          </button>
          <button onClick={onConfirm} disabled={isConfirming} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-opacity">
            {isConfirming ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
