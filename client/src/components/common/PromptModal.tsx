import { useState, useEffect } from "react";
import { FiX, FiSave, FiRefreshCw, FiAlertTriangle } from "react-icons/fi";
import type { Prompt } from "../../types/prompt";
import { updatePrompt } from "../../services/promptService";

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt?: Prompt | null;
  onSave: () => void | Promise<void>;
}

export const PromptModal = ({ isOpen, onClose, prompt, onSave }: PromptModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prompt) {
      setFormData({
        name: prompt.name,
        description: prompt.description,
        content: prompt.content,
        isActive: prompt.isActive
      });
      setError(null);
    } else if (isOpen) {
      setFormData({
        name: "",
        description: "",
        content: "",
        isActive: true
      });
      setError("Không tìm thấy prompt để chỉnh sửa.");
    }
  }, [prompt, isOpen]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      setError("Vui lòng nhập tên và nội dung prompt");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (!prompt) {
        throw new Error("Không có prompt để cập nhật");
      }

      await updatePrompt(prompt.id, formData);
      await onSave();
      onClose();
    } catch (error) {
      console.error("Error saving prompt:", error);
      setError(error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu prompt");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2 className="modal-title">
            Chỉnh sửa Prompt
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-banner">
              <FiAlertTriangle /> {error}
            </div>
          )}

          <div className="form-grid">
            <label className="full-width">
              <span>Tên prompt *</span>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="vd: Prompt trích xuất tour cơ bản"
              />
            </label>

            <label className="full-width">
              <span>Mô tả</span>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Mô tả ngắn về mục đích của prompt này"
              />
            </label>

            <label className="full-width">
              <span>Nội dung prompt *</span>
              <textarea
                rows={28}
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                placeholder="Nhập nội dung prompt cho Gemini AI..."
                className="prompt-textarea"
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange("isActive", e.target.checked)}
              />
              <span>Kích hoạt prompt này</span>
            </label>
          </div>

          <div className="prompt-help">
            <h4>Hướng dẫn viết prompt:</h4>
            <ul>
              <li>Sử dụng tiếng Việt để Gemini hiểu rõ hơn</li>
              <li>Mô tả rõ ràng định dạng JSON mong muốn</li>
              <li>Bao gồm các ví dụ cụ thể</li>
              <li>Hướng dẫn xử lý các trường hợp đặc biệt</li>
              <li>Prompt sẽ được sử dụng cho tất cả các lần trích xuất tiếp theo</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="ghost-button" onClick={onClose} disabled={isSaving}>
            Hủy
          </button>
          <button
            className="primary-button"
            onClick={handleSave}
            disabled={isSaving || !prompt}
          >
            {isSaving ? <FiRefreshCw className="spin" /> : <FiSave />}
            {isSaving ? "Đang lưu..." : "Lưu prompt"}
          </button>
        </div>
      </div>
    </div>
  );
};