import type { MouseEvent } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "danger",
  isLoading = false,
}: ConfirmationDialogProps) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconColor: "text-red-500",
          iconBg: "bg-red-50",
          confirmButton: "danger-button",
        };
      case "warning":
        return {
          iconColor: "text-yellow-500",
          iconBg: "bg-yellow-50",
          confirmButton: "ghost-button",
        };
      case "info":
        return {
          iconColor: "text-blue-500",
          iconBg: "bg-blue-50",
          confirmButton: "primary-button",
        };
      default:
        return {
          iconColor: "text-red-500",
          iconBg: "bg-red-50",
          confirmButton: "danger-button",
        };
    }
  };

  const styles = getVariantStyles();

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="confirmation-dialog-overlay" onClick={handleBackdropClick}>
      <div className="confirmation-dialog">
        <div className="confirmation-dialog-header">
          <div className="confirmation-dialog-icon">
            <div className={`confirmation-icon-bg ${styles.iconBg}`}>
              <FiAlertTriangle className={`confirmation-icon ${styles.iconColor}`} />
            </div>
          </div>
          <button
            className="confirmation-dialog-close"
            onClick={onClose}
            disabled={isLoading}
          >
            <FiX />
          </button>
        </div>

        <div className="confirmation-dialog-content">
          <h3 className="confirmation-dialog-title">{title}</h3>
          <p className="confirmation-dialog-message">{message}</p>
        </div>

        <div className="confirmation-dialog-actions">
          <button
            className="ghost-button"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spin" style={{ width: '16px', height: '16px', border: '2px solid currentColor', borderTop: '2px solid transparent' }} />
                Đang xóa...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};