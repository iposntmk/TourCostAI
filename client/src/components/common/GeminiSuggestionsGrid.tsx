import { useState, useEffect, useRef } from "react";
import { FiEdit, FiSave, FiX, FiTrash2, FiInfo, FiPlus, FiHelpCircle, FiAlertCircle, FiCheck, FiDownload, FiUpload, FiSettings } from "react-icons/fi";
import type { ExtractionGeneralInfo } from "../../types";
import "../../styles/GeminiSuggestionsGrid.css";
import {
  subscribeToFields,
  createField,
  deleteField as deleteFieldFromDb,
  updateField,
  type GeminiGeneralField,
  type GeminiGeneralFieldInput,
} from "../../services/geminiGeneralFields";

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

type FieldKey = Extract<keyof ExtractionGeneralInfo, string>;

interface FieldDefinition {
  key: FieldKey;
  label: string;
  description: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  optional?: boolean;
  isCustom?: boolean;
}

// Predefined field templates
const fieldTemplates: Record<string, FieldDefinition[]> = {
  flight: [
    { key: "flightNumber", label: "Số Chuyến Bay", description: "Số hiệu chuyến bay của hãng hàng không", type: "text" as const, optional: true, isCustom: true },
    { key: "airline", label: "Hãng Bay", description: "Tên hãng hàng không", type: "text" as const, optional: true, isCustom: true },
    { key: "departureTime", label: "Giờ Bay", description: "Thời gian khởi hành", type: "text" as const, optional: true, isCustom: true },
  ],
  hotel: [
    { key: "hotelName", label: "Tên Khách Sạn", description: "Tên khách sạn lưu trú", type: "text" as const, optional: true, isCustom: true },
    { key: "roomType", label: "Loại Phòng", description: "Loại phòng khách sạn", type: "text" as const, optional: true, isCustom: true },
    { key: "checkIn", label: "Ngày Nhận Phòng", description: "Ngày check-in khách sạn", type: "date" as const, optional: true, isCustom: true },
    { key: "checkOut", label: "Ngày Trả Phòng", description: "Ngày check-out khách sạn", type: "date" as const, optional: true, isCustom: true },
  ],
  booking: [
    { key: "bookingId", label: "Mã Booking", description: "Mã đặt chỗ từ hệ thống", type: "text" as const, optional: true, isCustom: true },
    { key: "confirmationCode", label: "Mã Xác Nhận", description: "Mã xác nhận đặt tour", type: "text" as const, optional: true, isCustom: true },
    { key: "paymentStatus", label: "Tình Trạng Thanh Toán", description: "Trạng thái thanh toán của tour", type: "text" as const, optional: true, isCustom: true },
  ],
};

const defaultFieldDefinitions: FieldDefinition[] = [
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
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>(defaultFieldDefinitions);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState<Partial<FieldDefinition>>({
    key: "",
    label: "",
    description: "",
    type: "text",
    optional: true,
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [customFieldKeyToId, setCustomFieldKeyToId] = useState<Record<string, string>>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [editingFieldDef, setEditingFieldDef] = useState<string | null>(null);
  const [fieldDefDraft, setFieldDefDraft] = useState<Partial<FieldDefinition>>({});

  // Load custom fields from Firestore and merge with defaults
  useEffect(() => {
    setIsSyncing(true);
    const unsubscribe = subscribeToFields(
      (fields: GeminiGeneralField[]) => {
        // Deduplicate by key, keep newest by updatedAt (query already ordered desc)
        const seen = new Set<string>();
        const unique = fields.filter((f) => {
          if (seen.has(f.key)) return false;
          seen.add(f.key);
          return true;
        });

        const mapping: Record<string, string> = {};
        const dbDefs: FieldDefinition[] = unique.map((f) => {
          mapping[f.key] = f.id;
          return {
            key: f.key,
            label: f.label,
            description: f.description,
            type: f.type,
            options: f.options ?? [],
            optional: f.optional,
            isCustom: Boolean(f.isCustom),
          } as FieldDefinition;
        });

        setCustomFieldKeyToId(mapping);

        if (dbDefs.length > 0) {
          setFieldDefinitions(dbDefs);
        } else {
          // No DB fields yet: show defaults immediately and seed them into DB
          setFieldDefinitions(defaultFieldDefinitions);

          const missingDefaults = defaultFieldDefinitions.map((d) => ({
            key: String(d.key).trim(),
            label: d.label,
            description: d.description,
            type: d.type,
            options: d.options,
            optional: d.optional,
            isCustom: false,
          }));
          void Promise.all(
            missingDefaults.map((input) => createField(input))
          ).catch((error) => {
            console.warn("Failed to seed default fields", error);
          });
        }

        // Also ensure any missing defaults are added to DB if some exist but not all
        if (dbDefs.length > 0) {
          const dbKeys = new Set(dbDefs.map((f) => String(f.key).trim()));
          const toSeed = defaultFieldDefinitions.filter((d) => !dbKeys.has(String(d.key)));
          if (toSeed.length > 0) {
            void Promise.all(
              toSeed.map((d) => createField({
                key: String(d.key).trim(),
                label: d.label,
                description: d.description,
                type: d.type,
                options: d.options,
                optional: d.optional,
                isCustom: false,
              }))
            ).catch((error) => {
              console.warn("Failed to backfill missing default fields", error);
            });
          }
        }

        setIsSyncing(false);
      },
      () => {
        setIsSyncing(false);
        setErrorMessage("Không thể tải trường tùy chỉnh từ cơ sở dữ liệu");
      }
    );
    return () => unsubscribe();
  }, []);

  const handleEdit = (field: string, currentValue: any) => {
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

  const handleDelete = (field: string) => {
    const updatedSuggestions = { ...suggestions };
    delete updatedSuggestions[field as keyof ExtractionGeneralInfo];
    onUpdateSuggestions(updatedSuggestions);
  };

  const handleClearAll = () => {
    onUpdateSuggestions({});
  };

  // Auto-hide messages after 3 seconds
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleAddField = () => {
    const rawKey = typeof newField.key === "string" ? newField.key : String(newField.key ?? "");
    if (!rawKey || !newField.label || !newField.description) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Validate field key format
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(rawKey)) {
      setErrorMessage("Key phải bắt đầu bằng chữ cái và chỉ chứa chữ, số, hoặc dấu gạch dưới");
      return;
    }

    // Check if field key already exists
    if (fieldDefinitions.some(f => f.key === rawKey)) {
      setErrorMessage("Trường với key này đã tồn tại!");
      return;
    }

    const sanitizedKey = rawKey.trim();

    const fieldToAdd: FieldDefinition = {
      key: sanitizedKey,
      label: newField.label,
      description: newField.description,
      type: newField.type as "text" | "number" | "date" | "select",
      optional: newField.optional,
      isCustom: true,
    };

    // Persist to Firestore
    const payload: GeminiGeneralFieldInput = {
      key: sanitizedKey,
      label: fieldToAdd.label,
      description: fieldToAdd.description,
      type: fieldToAdd.type,
      // only keep options if select
      options: fieldToAdd.type === "select" ? (fieldToAdd.options ?? []) : undefined,
      optional: fieldToAdd.optional,
      isCustom: true,
    };
    void createField(payload)
      .then(() => {
        setSaveMessage(`Đã thêm trường "${fieldToAdd.label}" và lưu vào CSDL`);
        setErrorMessage(null);
      })
      .catch((error) => {
        console.error("Failed to create field", error);
        setErrorMessage("Không thể lưu trường mới vào CSDL");
      });

    // Optimistic UI
    setFieldDefinitions([...fieldDefinitions, fieldToAdd]);
    setNewField({
      key: "",
      label: "",
      description: "",
      type: "text",
      optional: true,
    });
    setShowAddField(false);
    // saveMessage set in promise
  };

  const handleRemoveCustomField = (key: string) => {
    setFieldDefinitions(fieldDefinitions.filter(f => f.key !== key));
    // Also remove from suggestions if it exists
    const updatedSuggestions = { ...suggestions };
    delete updatedSuggestions[key as keyof ExtractionGeneralInfo];
    onUpdateSuggestions(updatedSuggestions);

    const id = customFieldKeyToId[String(key)];
    if (id) {
      void deleteFieldFromDb(id).then(() => {
        setSaveMessage(`Đã xóa trường "${key}" khỏi CSDL`);
      }).catch((error) => {
        console.error("Failed to delete field from DB", error);
        setErrorMessage("Không thể xóa trường khỏi CSDL");
      });
    }
  };

  const handleExportFields = () => {
    const customFields = fieldDefinitions.filter(f => f.isCustom);
    if (customFields.length === 0) {
      setErrorMessage("Không có trường tùy chỉnh nào để xuất");
      return;
    }
    
    const dataStr = JSON.stringify(customFields, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `custom-fields-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    setSaveMessage(`Đã xuất ${customFields.length} trường tùy chỉnh`);
  };

  const handleApplyTemplate = (templateName: keyof typeof fieldTemplates) => {
    const template = fieldTemplates[templateName];
    const existingKeys = new Set<string>(fieldDefinitions.map(f => f.key));
    const newFields = template.filter(f => !existingKeys.has(f.key));
    
    if (newFields.length === 0) {
      setErrorMessage("Tất cả các trường trong mẫu đã tồn tại");
      return;
    }
    
    setFieldDefinitions([...fieldDefinitions, ...newFields]);
    // Persist each field
    void Promise.all(newFields.map((f) => createField({
      key: String(f.key).trim(),
      label: f.label,
      description: f.description,
      type: f.type,
      options: f.type === "select" ? (f.options ?? []) : undefined,
      optional: f.optional,
      isCustom: true,
    }))).then(() => {
      setSaveMessage(`Đã thêm ${newFields.length} trường từ mẫu ${templateName} và lưu vào CSDL`);
    }).catch((error) => {
      console.error("Failed to persist template fields", error);
      setErrorMessage("Không thể lưu một số trường mẫu vào CSDL");
    });
    setShowTemplates(false);
  };

  const handleImportFields = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedFields = JSON.parse(content) as FieldDefinition[];
        
        if (!Array.isArray(importedFields)) {
          throw new Error("File không đúng định dạng");
        }
        
        // Validate and add imported fields
        let addedCount = 0;
    const existingKeys = new Set<string>(fieldDefinitions.map(f => f.key));
        
        importedFields.forEach(field => {
          if (field.key && field.label && field.description && !existingKeys.has(field.key)) {
            field.isCustom = true;
            existingKeys.add(field.key);
            addedCount++;
          }
        });
        
        if (addedCount > 0) {
          const validFields = importedFields.filter(f => 
            f.key && f.label && f.description && !fieldDefinitions.some(existing => existing.key === f.key)
          );
          setFieldDefinitions([...fieldDefinitions, ...validFields]);
          // Persist to DB
          void Promise.all(validFields.map((f) => createField({
            key: String(f.key).trim(),
            label: f.label,
            description: f.description,
            type: f.type,
            options: f.type === "select" ? (f.options ?? []) : undefined,
            optional: f.optional,
            isCustom: true,
          }))).then(() => {
            setSaveMessage(`Đã nhập ${addedCount} trường tùy chỉnh và lưu vào CSDL`);
          }).catch((error) => {
            console.error("Failed to persist imported fields", error);
            setErrorMessage("Không thể lưu một số trường đã nhập vào CSDL");
          });
        } else {
          setErrorMessage("Không có trường mới nào được thêm (có thể do trùng key)");
        }
      } catch (error) {
        setErrorMessage("Lỗi khi đọc file: " + (error as Error).message);
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const getFieldOptions = (fieldDef: FieldDefinition): string[] => {
    if (Array.isArray(fieldDef.options) && fieldDef.options.length > 0) {
      return fieldDef.options;
    }
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
  const customFieldCount = fieldDefinitions.filter(f => f.isCustom).length;
  const filledFieldCount = fieldDefinitions.filter(f => {
    const value = suggestions[f.key as keyof ExtractionGeneralInfo];
    return value !== undefined && value !== null && value !== "";
  }).length;

  return (
    <div className="gemini-suggestions-grid">
      <div className="suggestions-header">
        <div className="suggestions-title">
          <FiInfo /> Gợi ý thông tin chung cho Gemini
          <div style={{ display: 'flex', gap: '8px' }}>
            {filledFieldCount > 0 && (
              <span className="badge primary">{filledFieldCount}/{fieldDefinitions.length} đã điền</span>
            )}
            {customFieldCount > 0 && (
              <span className="badge custom">{customFieldCount} tùy chỉnh</span>
            )}
            {isSyncing && (
              <span className="badge neutral">Đồng bộ...</span>
            )}
          </div>
        </div>
        <p className="suggestions-description">
          Các trường dưới đây sẽ được truyền vào buildGeneralInfo để ưu tiên khi Gemini chuẩn hóa dữ liệu. 
          Để trống nếu muốn AI tự suy luận từ hình ảnh.
        </p>
        <div className="header-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          <button 
            className="ghost-button small"
            onClick={() => setShowAddField(!showAddField)}
            type="button"
          >
            <FiPlus /> Thêm trường mới
          </button>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button 
              className="ghost-button small"
              onClick={() => setShowTemplates(!showTemplates)}
              type="button"
            >
              <FiPlus /> Thêm từ mẫu
            </button>
            {showTemplates && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '180px'
              }}>
                <button
                  onClick={() => handleApplyTemplate('flight')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  ✈️ Thông tin chuyến bay
                </button>
                <button
                  onClick={() => handleApplyTemplate('hotel')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  🏨 Thông tin khách sạn
                </button>
                <button
                  onClick={() => handleApplyTemplate('booking')}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderBottomLeftRadius: '6px',
                    borderBottomRightRadius: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  📋 Thông tin đặt chỗ
                </button>
              </div>
            )}
          </div>
          <button 
            className="ghost-button small"
            onClick={handleExportFields}
            type="button"
            disabled={!fieldDefinitions.some(f => f.isCustom)}
          >
            <FiDownload /> Xuất cấu hình
          </button>
          <button 
            className="ghost-button small"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <FiUpload /> Nhập cấu hình
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFields}
            style={{ display: 'none' }}
          />
          {suggestionCount > 0 && (
            <button 
              className="ghost-button small"
              onClick={handleClearAll}
              type="button"
            >
              <FiTrash2 /> Xóa tất cả giá trị
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {saveMessage && (
        <div className="message-banner success fade-in">
          <FiCheck /> {saveMessage}
        </div>
      )}
      {errorMessage && (
        <div className="message-banner error fade-in">
          <FiAlertCircle /> {errorMessage}
        </div>
      )}

      {showAddField && (
        <div className="add-field-form">
          <h4>Thêm trường mới</h4>
          <div className="field-grid">
            <div className="field-group">
              <label className="field-label">
                Key (mã trường) <span className="required">*</span>
                <span className="field-tooltip">
                  <FiHelpCircle className="tooltip-icon" />
                  <span className="tooltip-content">
                    Mã định danh duy nhất cho trường. Phải bắt đầu bằng chữ cái và chỉ chứa chữ, số, hoặc dấu gạch dưới.
                  </span>
                </span>
              </label>
              <input
                type="text"
                className="field-input"
                value={newField.key || ""}
                onChange={(e) => setNewField({ ...newField, key: e.target.value })}
                placeholder="vd: bookingId, flightNumber..."
              />
            </div>
            <div className="field-group">
              <label className="field-label">
                Nhãn hiển thị <span className="required">*</span>
              </label>
              <input
                type="text"
                className="field-input"
                value={newField.label || ""}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                placeholder="vd: Mã Booking, Số Chuyến Bay..."
              />
            </div>
            <div className="field-group">
              <label className="field-label">
                Mô tả <span className="required">*</span>
                <span className="field-tooltip">
                  <FiHelpCircle className="tooltip-icon" />
                  <span className="tooltip-content">
                    Mô tả chi tiết về trường này để Gemini AI hiểu và trích xuất chính xác thông tin từ hình ảnh.
                  </span>
                </span>
              </label>
              <input
                type="text"
                className="field-input"
                value={newField.description || ""}
                onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                placeholder="vd: Mã booking từ hệ thống đặt vé..."
              />
            </div>
            <div className="field-group">
              <label className="field-label">
                Loại dữ liệu
              </label>
              <select
                className="field-input"
                value={newField.type || "text"}
                onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
              >
                <option value="text">Văn bản</option>
                <option value="number">Số</option>
                <option value="date">Ngày</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={newField.optional || false}
                onChange={(e) => setNewField({ ...newField, optional: e.target.checked })}
              />
              Trường tùy chọn (không bắt buộc)
            </label>
          </div>
          <div className="form-actions">
            <button
              className="primary-button small"
              onClick={handleAddField}
              type="button"
              disabled={!newField.key || !newField.label || !newField.description}
            >
              <FiPlus /> Thêm trường
            </button>
            <button
              className="ghost-button small"
              onClick={() => {
                setShowAddField(false);
                setNewField({
                  key: "",
                  label: "",
                  description: "",
                  type: "text",
                  optional: true,
                });
                setErrorMessage(null);
              }}
              type="button"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="suggestions-table">
        <div className="table-header">
          <div className="table-cell">Tên Trường</div>
          <div className="table-cell">Mô Tả</div>
          <div className="table-cell">Giá Trị</div>
          <div className="table-cell">Thao Tác</div>
        </div>
        
        {fieldDefinitions.length === 0 ? (
          <div className="empty-state">
            <FiInfo />
            <p>Chưa có trường nào được định nghĩa</p>
            <p>Nhấn "Thêm trường mới" để bắt đầu</p>
          </div>
        ) : (
          fieldDefinitions.map((fieldDef) => {
            const currentValue = suggestions[fieldDef.key];
            const isEditing = editingField === fieldDef.key;
            const hasValue = currentValue !== undefined && currentValue !== null && currentValue !== "";
            
            return (
            <div key={fieldDef.key} className={`table-row ${hasValue ? 'has-value' : ''}`}>
              <div className="table-cell field-name">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <code>{fieldDef.key}</code>
                  {fieldDef.optional && <span className="badge neutral">Tùy chọn</span>}
                  {fieldDef.isCustom && <span className="badge custom">Tùy chỉnh</span>}
                </div>
              </div>
              
              <div className="table-cell field-description">
                {editingFieldDef === fieldDef.key ? (
                  <div className="field-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="field-group">
                      <label className="field-label">Nhãn hiển thị</label>
                      <input
                        className="field-input"
                        value={String(fieldDefDraft.label ?? fieldDef.label)}
                        onChange={(e) => setFieldDefDraft((d) => ({ ...d, label: e.target.value }))}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Loại dữ liệu</label>
                      <select
                        className="field-input"
                        value={String(fieldDefDraft.type ?? fieldDef.type)}
                        onChange={(e) => setFieldDefDraft((d) => ({ ...d, type: e.target.value as any }))}
                      >
                        <option value="text">Văn bản</option>
                        <option value="number">Số</option>
                        <option value="date">Ngày</option>
                        <option value="select">Chọn từ danh sách</option>
                      </select>
                    </div>
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="field-label">Mô tả</label>
                      <input
                        className="field-input"
                        value={String(fieldDefDraft.description ?? fieldDef.description)}
                        onChange={(e) => setFieldDefDraft((d) => ({ ...d, description: e.target.value }))}
                      />
                    </div>
                    {(fieldDefDraft.type ?? fieldDef.type) === 'select' && (
                      <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="field-label">Tùy chọn (phân tách bởi dấu phẩy)</label>
                        <input
                          className="field-input"
                          placeholder="vd: A, B, C"
                          value={(Array.isArray(fieldDefDraft.options) ? fieldDefDraft.options : (fieldDef.options ?? [])).join(', ')}
                          onChange={(e) => {
                            const arr = e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter((s) => s.length > 0);
                            setFieldDefDraft((d) => ({ ...d, options: arr }));
                          }}
                        />
                      </div>
                    )}
                    <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={Boolean(fieldDefDraft.optional ?? fieldDef.optional)}
                          onChange={(e) => setFieldDefDraft((d) => ({ ...d, optional: e.target.checked }))}
                        />
                        Trường tùy chọn (không bắt buộc)
                      </label>
                    </div>
                  </div>
                ) : (
                  fieldDef.description
                )}
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
                ) : editingFieldDef === fieldDef.key ? (
                  <div className="action-buttons">
                    <button
                      className="icon-button success"
                      onClick={async () => {
                        const keyStr = String(fieldDef.key).trim();
                        const updates = {
                          key: keyStr,
                          label: String(fieldDefDraft.label ?? fieldDef.label),
                          description: String(fieldDefDraft.description ?? fieldDef.description),
                          type: (fieldDefDraft.type ?? fieldDef.type) as any,
                          options:
                            (fieldDefDraft.type ?? fieldDef.type) === 'select'
                              ? (Array.isArray(fieldDefDraft.options)
                                  ? fieldDefDraft.options
                                  : fieldDef.options ?? [])
                              : undefined,
                          optional: Boolean(fieldDefDraft.optional ?? fieldDef.optional),
                          isCustom: Boolean(fieldDef.isCustom),
                        } as GeminiGeneralFieldInput;
                        try {
                          const id = customFieldKeyToId[keyStr] || keyStr;
                          await updateField(id, updates);
                          setFieldDefinitions((prev) =>
                            prev.map((d) =>
                              String(d.key) === keyStr
                                ? {
                                    ...d,
                                    label: updates.label,
                                    description: updates.description,
                                    type: updates.type,
                                    options: updates.type === 'select' ? (updates.options as string[] | undefined) : undefined,
                                    optional: updates.optional,
                                  }
                                : d,
                            ),
                          );
                          setSaveMessage(`Đã cập nhật cấu hình "${keyStr}"`);
                          setEditingFieldDef(null);
                          setFieldDefDraft({});
                        } catch (e) {
                          console.error(e);
                          setErrorMessage('Không thể cập nhật cấu hình trường');
                        }
                      }}
                      title="Lưu cấu hình"
                    >
                      <FiSave />
                    </button>
                    <button
                      className="icon-button danger"
                      onClick={() => {
                        setEditingFieldDef(null);
                        setFieldDefDraft({});
                      }}
                      title="Hủy cấu hình"
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
                    <button
                      className="icon-button"
                      onClick={() => {
                        setEditingFieldDef(String(fieldDef.key));
                        setFieldDefDraft({
                          key: String(fieldDef.key),
                          label: fieldDef.label,
                          description: fieldDef.description,
                          type: fieldDef.type,
                          options: fieldDef.options ?? [],
                          optional: fieldDef.optional,
                          isCustom: fieldDef.isCustom,
                        });
                      }}
                      title="Sửa cấu hình trường"
                    >
                      <FiSettings />
                    </button>
                    {hasValue && (
                      <button
                        className="icon-button danger"
                        onClick={() => handleDelete(fieldDef.key)}
                        title="Xóa giá trị"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                    {fieldDef.isCustom && (
                      <button
                        className="icon-button danger"
                        onClick={() => handleRemoveCustomField(fieldDef.key)}
                        title="Xóa trường tùy chỉnh"
                        style={{ marginLeft: '4px' }}
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
};