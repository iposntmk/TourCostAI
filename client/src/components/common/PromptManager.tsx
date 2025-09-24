import { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import type { Prompt } from "../../types/prompt";
import { getAllPrompts, deletePrompt } from "../../services/promptService";
import { createDetailedPrompt } from "../../services/detailedPromptService";
import { PromptModal } from "./PromptModal";

interface PromptManagerProps {
  onPromptChange?: () => void;
}

export const PromptManager = ({ onPromptChange }: PromptManagerProps) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const loadPrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      const promptsData = await getAllPrompts();
      setPrompts(promptsData);
    } catch (error) {
      console.error("Error loading prompts:", error);
      setError(error instanceof Error ? error.message : "Không thể tải danh sách prompts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const handleCreatePrompt = () => {
    setEditingPrompt(null);
    setModalOpen(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setModalOpen(true);
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa prompt này?")) {
      return;
    }

    try {
      await deletePrompt(promptId);
      await loadPrompts();
      onPromptChange?.();
    } catch (error) {
      console.error("Error deleting prompt:", error);
      setError(error instanceof Error ? error.message : "Không thể xóa prompt");
    }
  };

  const handleCreateDetailedPrompt = async () => {
    try {
      await createDetailedPrompt();
      await loadPrompts();
      onPromptChange?.();
    } catch (error) {
      console.error("Error creating detailed prompt:", error);
      setError(error instanceof Error ? error.message : "Không thể tạo prompt chi tiết");
    }
  };

  const handleModalSave = () => {
    loadPrompts();
    onPromptChange?.();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("vi-VN");
  };

  return (
    <div className="prompt-manager">
      <div className="prompt-manager-header">
        <div className="section-title">
          <span>Quản lý Prompts</span>
          <div className="prompt-actions">
            <button
              className="ghost-button small"
              onClick={handleCreateDetailedPrompt}
              disabled={loading}
            >
              <FiRefreshCw /> Chi tiết
            </button>
            <button
              className="primary-button small"
              onClick={handleCreatePrompt}
              disabled={loading}
            >
              <FiPlus /> Tạo mới
            </button>
          </div>
        </div>
        <p className="section-description">
          Quản lý các prompt để tùy chỉnh cách Gemini AI trích xuất dữ liệu từ hình ảnh tour.
          Prompt mới nhất sẽ được sử dụng cho việc trích xuất.
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
          <span>Đang tải prompts...</span>
        </div>
      ) : prompts.length === 0 ? (
        <div className="empty-state">
          <FiAlertTriangle />
          <h3>Chưa có prompt nào</h3>
          <p>Hãy tạo prompt đầu tiên để bắt đầu sử dụng tính năng trích xuất AI.</p>
          <button className="primary-button" onClick={handleCreateDetailedPrompt}>
            <FiPlus /> Tạo prompt chi tiết
          </button>
        </div>
      ) : (
        <div className="prompts-list">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="prompt-item">
              <div className="prompt-header">
                <div className="prompt-info">
                  <h4 className="prompt-name">
                    {prompt.name}
                    {prompt.isActive && <FiCheckCircle className="active-indicator" />}
                  </h4>
                  <p className="prompt-description">{prompt.description}</p>
                </div>
                <div className="prompt-actions">
                  <button
                    className="ghost-button small"
                    onClick={() => handleEditPrompt(prompt)}
                    title="Chỉnh sửa"
                  >
                    <FiEdit />
                  </button>
                  <button
                    className="ghost-button small danger"
                    onClick={() => handleDeletePrompt(prompt.id)}
                    title="Xóa"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              
              <div className="prompt-content">
                <div className="prompt-preview">
                  {prompt.content.length > 200 
                    ? `${prompt.content.substring(0, 200)}...` 
                    : prompt.content
                  }
                </div>
              </div>
              
              <div className="prompt-meta">
                <span className="prompt-date">
                  Cập nhật: {formatDate(prompt.updatedAt)}
                </span>
                <span className="prompt-size">
                  {prompt.content.length} ký tự
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <PromptModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        prompt={editingPrompt}
        onSave={handleModalSave}
      />
    </div>
  );
};