import { useState } from "react";
import { FiEdit, FiSave, FiX, FiPlus, FiTrash2, FiInfo } from "react-icons/fi";
import type { ExtractionGeneralInfo } from "../../types";

interface GeminiSuggestionsGridProps {
  suggestions: Partial<ExtractionGeneralInfo>;
  onUpdateSuggestions: (suggestions: Partial<ExtractionGeneralInfo>) => void;
  masterData: {
    catalogs: {
      nationalities: string[];
    };
    guides: Array<{ name: string }>;
  };
}

interface FieldDefinition {
  key: keyof ExtractionGeneralInfo;
  label: string;
  description: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  optional?: boolean;
}

const fieldDefinitions: FieldDefinition[] = [
  {
    key: "tourCode",
    label: "Mã Tour",
    description: "Mã tour hoặc booking duy nhất cho đoàn khách",
    type: "text",
  },
  {
    key: "customerName", 
    label: "Tên Khách Hàng",
    description: "Tên khách hàng chính hoặc trưởng đoàn",
    type: "text",
  },
  {
    key: "clientCompany",
    label: "Công Ty",
    description: "Tên công ty/đơn vị đặt tour",
    type: "text",
    optional: true,
  },
  {
    key: "nationality",
    label: "Quốc Tịch",
    description: "Quốc tịch của đoàn khách theo danh mục chuẩn",
    type: "select",
  },
  {
    key: "pax",
    label: "Số Khách",
    description: "Tổng số khách tham gia tour",
    type: "number",
  },
  {
    key: "startDate",
    label: "Ngày Bắt Đầu",
    description: "Ngày bắt đầu tour theo định dạng ISO 8601",
    type: "date",
  },
  {
    key: "endDate",
    label: "Ngày Kết Thúc", 
    description: "Ngày kết thúc tour theo định dạng ISO 8601",
    type: "date",
  },
  {
    key: "guideName",
    label: "Hướng Dẫn Viên",
    description: "Tên hướng dẫn viên xuất hiện trong tài liệu",
    type: "select",
  },
  {
    key: "driverName",
    label: "Lái Xe",
    description: "Tên lái xe phục vụ đoàn",
    type: "text",
    optional: true,
  },
  {
    key: "notes",
    label: "Ghi Chú",
    description: "Ghi chú bổ sung về tour",
    type: "text",
    optional: true,
  },
];

export const GeminiSuggestionsGrid = ({ 
  suggestions, 
  onUpdateSuggestions, 
  masterData 
}: GeminiSuggestionsGridProps) => {
  const [editingField, setEditingField] = useState<keyof ExtractionGeneralInfo | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleEdit = (field: keyof ExtractionGeneralInfo, currentValue: any) => {
    setEditingField(field);
    setEditValue(currentValue?.toString() || "");
  };

  const handleSave = () => {
    if (!editingField) return;

    const fieldDef = fieldDefinitions.find(f => f.key === editingField);
    if (!fieldDef) return;

    let processedValue: any = editValue.trim();

    // Process value based on field type
    if (fieldDef.type === "number") {
      const numValue = Number(processedValue);
      processedValue = isNaN(numValue) ? undefined : numValue;
    } else if (fieldDef.type === "date") {
      // Convert to ISO format if it's a valid date
      const date = new Date(processedValue);
      processedValue = isNaN(date.getTime()) ? undefined : date.toISOString();
    } else if (fieldDef.type === "text" || fieldDef.type === "select") {
      processedValue = processedValue || undefined;
    }

    // Update suggestions
    const updatedSuggestions = {
      ...suggestions,
      [editingField]: processedValue,
    };

    // Remove undefined values
    Object.keys(updatedSuggestions).forEach(key => {
      if (updatedSuggestions[key as keyof ExtractionGeneralInfo] === undefined) {
        delete updatedSuggestions[key as keyof ExtractionGeneralInfo];
      }
    });

    onUpdateSuggestions(updatedSuggestions);
    setEditingField(null);
    setEditValue("");
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleDelete = (field: keyof ExtractionGeneralInfo) => {
    const updatedSuggestions = { ...suggestions };
    delete updatedSuggestions[field];
    onUpdateSuggestions(updatedSuggestions);
  };

  const handleClearAll = () => {
    onUpdateSuggestions({});
  };

  const getFieldOptions = (fieldDef: FieldDefinition): string[] => {
    if (fieldDef.key === "nationality") {
      return masterData.catalogs.nationalities;
    }
    if (fieldDef.key === "guideName") {
      return masterData.guides.map(g => g.name);
    }
    return [];
  };

  const formatDisplayValue = (fieldDef: FieldDefinition, value: any): string => {
    if (!value) return "";
    
    if (fieldDef.type === "date") {
      try {
        return new Date(value).toLocaleDateString("vi-VN");
      } catch {
        return value.toString();
      }
    }
    
    return value.toString();
  };

  const suggestionCount = Object.keys(suggestions).length;

  return (
    <div className="gemini-suggestions-grid">
      <div className="suggestions-header">
        <div className="suggestions-title">
          <FiInfo /> Gợi ý thông tin chung cho Gemini
          {suggestionCount > 0 && (
            <span className="badge primary">{suggestionCount} gợi ý</span>
          )}
        </div>
        <p className="suggestions-description">
          Các trường dưới đây sẽ được truyền vào buildGeneralInfo để ưu tiên khi Gemini chuẩn hóa dữ liệu. 
          Để trống nếu muốn AI tự suy luận từ hình ảnh.
        </p>
        {suggestionCount > 0 && (
          <button 
            className="ghost-button small"
            onClick={handleClearAll}
            type="button"
          >
            <FiTrash2 /> Xóa tất cả
          </button>
        )}
      </div>

      <div className="suggestions-table">
        <div className="table-header">
          <div className="table-cell">Tên Trường</div>
          <div className="table-cell">Mô Tả</div>
          <div className="table-cell">Giá Trị</div>
          <div className="table-cell">Thao Tác</div>
        </div>
        
        {fieldDefinitions.map((fieldDef) => {
          const currentValue = suggestions[fieldDef.key];
          const isEditing = editingField === fieldDef.key;
          const hasValue = currentValue !== undefined && currentValue !== null && currentValue !== "";
          
          return (
            <div key={fieldDef.key} className={`table-row ${hasValue ? 'has-value' : ''}`}>
              <div className="table-cell field-name">
                <code>{fieldDef.key}</code>
                {fieldDef.optional && <span className="badge neutral">Tùy chọn</span>}
              </div>
              
              <div className="table-cell field-description">
                {fieldDef.description}
              </div>
              
              <div className="table-cell field-value">
                {isEditing ? (
                  <div className="edit-input">
                    {fieldDef.type === "select" ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="form-input"
                      >
                        <option value="">-- Chọn --</option>
                        {getFieldOptions(fieldDef).map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : fieldDef.type === "number" ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="form-input"
                        placeholder="Nhập số"
                      />
                    ) : fieldDef.type === "date" ? (
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="form-input"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="form-input"
                        placeholder={`Nhập ${fieldDef.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ) : (
                  <div className="display-value">
                    {hasValue ? (
                      <span className="value-text">
                        {formatDisplayValue(fieldDef, currentValue)}
                      </span>
                    ) : (
                      <span className="empty-value">Chưa có giá trị</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="table-cell field-actions">
                {isEditing ? (
                  <div className="action-buttons">
                    <button
                      className="icon-button success"
                      onClick={handleSave}
                      title="Lưu"
                    >
                      <FiSave />
                    </button>
                    <button
                      className="icon-button danger"
                      onClick={handleCancel}
                      title="Hủy"
                    >
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <div className="action-buttons">
                    <button
                      className="icon-button primary"
                      onClick={() => handleEdit(fieldDef.key, currentValue)}
                      title="Chỉnh sửa"
                    >
                      <FiEdit />
                    </button>
                    {hasValue && (
                      <button
                        className="icon-button danger"
                        onClick={() => handleDelete(fieldDef.key)}
                        title="Xóa"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};