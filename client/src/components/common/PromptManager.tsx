import { useState, useEffect, useCallback } from "react";
import { FiEdit, FiRefreshCw, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import type { Timestamp } from "firebase/firestore";
import type { Prompt } from "../../types/prompt";
import { getLatestPrompt } from "../../services/promptService";
import { PromptModal } from "./PromptModal";

interface PromptManagerProps {
  onPromptChange?: () => void;
}

export const PromptManager = ({ onPromptChange }: PromptManagerProps) => {
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const loadLatestPrompt = useCallback(async (options?: { silent?: boolean }) => {
    if (options?.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const prompt = await getLatestPrompt();
      setCurrentPrompt(prompt);
      return prompt;
    } catch (error) {
      console.error("Error loading prompt:", error);
      setError(error instanceof Error ? error.message : "Không thể tải prompt mới nhất");
      return null;
    } finally {
      if (options?.silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadLatestPrompt();
  }, [loadLatestPrompt]);

  const handleRefresh = () => {
    void loadLatestPrompt();
  };

  const handleEditPrompt = async () => {
    const prompt = await loadLatestPrompt({ silent: true });
    if (!prompt) {
      setError("Không tìm thấy prompt để chỉnh sửa.");
      return;
    }

    setEditingPrompt(prompt);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingPrompt(null);
  };

  const handleModalSave = async () => {
    await loadLatestPrompt({ silent: true });
    onPromptChange?.();
  };

  const formatDate = (value: Timestamp | Date | string | number | null | undefined) => {
    if (!value) return "N/A";

    if (value instanceof Date) {
      return value.toLocaleString("vi-VN");
    }

    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString("vi-VN");
    }

    if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
      return value.toDate().toLocaleString("vi-VN");
    }

    return "N/A";
  };

  return (
    <div className="prompt-manager">
      <div className="prompt-manager-header">
        <div className="section-title">
          <span>Prompt Gemini AI</span>
          <div className="prompt-actions">
            <button
              className="ghost-button small"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              title="Tải prompt mới nhất"
            >
              <FiRefreshCw className={refreshing ? "spin" : undefined} /> Làm mới
            </button>
            <button
              className="primary-button small"
              onClick={handleEditPrompt}
              disabled={loading || refreshing || !currentPrompt}
            >
              <FiEdit /> Chỉnh sửa
            </button>
          </div>
        </div>
        <p className="section-description">
          Prompt mới nhất được lưu trên Firebase sẽ được sử dụng cho mọi lần trích xuất Gemini.
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <FiAlertTriangle /> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <FiRefreshCw className="spin" />
          <span>Đang tải prompt mới nhất...</span>
        </div>
      ) : currentPrompt ? (
        <div className="prompt-preview-section">
          <div className="prompt-header">
            <h3 className="prompt-title">
              {currentPrompt.name}
              {currentPrompt.isActive && <FiCheckCircle className="active-indicator" />}
            </h3>
            <div className="prompt-meta">
              <span className="prompt-date">Cập nhật: {formatDate(currentPrompt.updatedAt)}</span>
              <span className="prompt-size">{currentPrompt.content.length} ký tự</span>
            </div>
          </div>

          <div className="prompt-description">
            <strong>Mô tả:</strong> {currentPrompt.description}
          </div>

          <div className="prompt-content-preview">
            <h4>Nội dung prompt:</h4>
            <div className="prompt-content-display">{currentPrompt.content}</div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <FiAlertTriangle />
          <h3>Chưa có prompt nào</h3>
          <p>Vui lòng thêm prompt vào Firebase để sử dụng cùng Gemini AI.</p>
        </div>
      )}

      <PromptModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        prompt={editingPrompt}
        onSave={handleModalSave}
      />
    </div>
  );
};