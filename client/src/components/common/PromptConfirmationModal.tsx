import { useState, useEffect } from "react";
import { FiX, FiPlay, FiRefreshCw, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import type { Prompt } from "../../types/prompt";
import { getLatestPrompt } from "../../services/promptService";

interface PromptConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing?: boolean;
}

export const PromptConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isProcessing = false 
}: PromptConfirmationModalProps) => {
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCurrentPrompt();
    }
  }, [isOpen]);

  const loadCurrentPrompt = async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = await getLatestPrompt();
      setCurrentPrompt(prompt);
    } catch (error) {
      console.error("Error loading current prompt:", error);
      setError(error instanceof Error ? error.message : "Không thể tải prompt hiện tại");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("vi-VN");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2 className="modal-title">
            <FiCheckCircle /> Xác nhận trích xuất Gemini AI
          </h2>
          <button className="modal-close" onClick={onClose} disabled={isProcessing}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div className="confirmation-info">
            <p className="confirmation-description">
              Bạn sắp chạy trích xuất dữ liệu tour bằng Gemini AI. Dưới đây là prompt sẽ được sử dụng:
            </p>
          </div>

          {loading ? (
            <div className="loading-state">
              <FiRefreshCw className="spin" />
              <span>Đang tải prompt...</span>
            </div>
          ) : error ? (
            <div className="error-banner">
              <FiAlertTriangle /> {error}
              <div className="error-actions">
                <button
                  className="ghost-button small"
                  onClick={loadCurrentPrompt}
                  disabled={loading}
                >
                  <FiRefreshCw /> Thử lại
                </button>
              </div>
            </div>
          ) : currentPrompt ? (
            <div className="prompt-preview-section">
              <div className="prompt-header">
                <h3 className="prompt-title">
                  {currentPrompt.name}
                  {currentPrompt.isActive && <FiCheckCircle className="active-indicator" />}
                </h3>
                <div className="prompt-meta">
                  <span className="prompt-date">
                    Cập nhật: {formatDate(currentPrompt.updatedAt)}
                  </span>
                  <span className="prompt-size">
                    {currentPrompt.content.length} ký tự
                  </span>
                </div>
              </div>

              <div className="prompt-description">
                <strong>Mô tả:</strong> {currentPrompt.description}
              </div>

              <div className="prompt-content-preview">
                <h4>Nội dung prompt:</h4>
                <div className="prompt-content-display">
                  {currentPrompt.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <FiAlertTriangle />
              <h3>Không có prompt nào</h3>
              <p>Vui lòng tạo prompt trước khi chạy trích xuất.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="ghost-button" 
            onClick={onClose} 
            disabled={isProcessing}
          >
            Hủy
          </button>
          <button 
            className="primary-button" 
            onClick={handleConfirm}
            disabled={!currentPrompt || isProcessing}
          >
            {isProcessing ? <FiRefreshCw className="spin" /> : <FiPlay />}
            {isProcessing ? "Đang xử lý..." : "Xác nhận và chạy Gemini"}
          </button>
        </div>
      </div>
    </div>
  );
};