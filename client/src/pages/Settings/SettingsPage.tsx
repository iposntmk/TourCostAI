import { useState } from "react";
import { FiSettings, FiSave, FiRefreshCw } from "react-icons/fi";
import { PageHeader } from "../../components/common/PageHeader";
import { ApiKeySettings } from "../../components/common/ApiKeySettings";
import { saveApiKey, loadApiKey, saveApiMode, loadApiMode } from "../../services/aiExtraction";

export const SettingsPage = () => {
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleApiKeyChange = (key: string) => {
    setHasChanges(true);
  };

  const handleApiModeChange = (mode: "mock" | "live") => {
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Settings are automatically saved when changed, but we can add additional logic here
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save operation
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const savedKey = loadApiKey();
    const savedMode = loadApiMode();
    setHasChanges(false);
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Cài đặt hệ thống"
        description="Quản lý cấu hình API và các tùy chọn hệ thống"
      />
      
      <div className="layout-single-column">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <FiSettings /> Cài đặt chung
            </div>
            <p className="panel-description">
              Cấu hình các thông số hệ thống và kết nối API
            </p>
          </div>
          <div className="panel-body">
            <ApiKeySettings 
              onApiKeyChange={handleApiKeyChange}
              onApiModeChange={handleApiModeChange}
            />
            
            <div className="settings-actions">
              <button
                className="primary-button"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? <FiRefreshCw className="spin" /> : <FiSave />}
                {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
              </button>
              <button
                className="ghost-button"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                Đặt lại
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              Thông tin hệ thống
            </div>
          </div>
          <div className="panel-body">
            <div className="system-info">
              <div className="info-item">
                <span className="info-label">Phiên bản:</span>
                <span className="info-value">TourCostAI v1.0.0</span>
              </div>
              <div className="info-item">
                <span className="info-label">Chế độ API hiện tại:</span>
                <span className="info-value">
                  {loadApiMode() === "live" ? "Live API" : "Mock Data"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Trạng thái API key:</span>
                <span className="info-value">
                  {loadApiKey() ? "Đã cấu hình" : "Chưa cấu hình"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Lần cập nhật cuối:</span>
                <span className="info-value">
                  {new Date().toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};