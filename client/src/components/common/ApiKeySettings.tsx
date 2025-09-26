import { useState, useEffect } from "react";
import { FiEye, FiEyeOff, FiKey, FiCheckCircle, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { saveApiKey, loadApiKey, saveApiMode, loadApiMode } from "../../services/aiExtraction";

interface ApiKeySettingsProps {
  onApiKeyChange?: (key: string) => void;
  onApiModeChange?: (mode: "mock" | "live") => void;
  resetSignal?: number;
}

export const ApiKeySettings = ({ onApiKeyChange, onApiModeChange, resetSignal }: ApiKeySettingsProps) => {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiMode, setApiMode] = useState<"mock" | "live">("mock");
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    // Load saved settings
    const savedKey = loadApiKey();
    const savedMode = loadApiMode();
    setApiKey(savedKey);
    setApiMode(savedMode);
  }, []);

  useEffect(() => {
    if (resetSignal === undefined) {
      return;
    }

    const savedKey = loadApiKey();
    const savedMode = loadApiMode();
    setApiKey(savedKey);
    setApiMode(savedMode);
    setValidationStatus("idle");
    setValidationMessage("");
  }, [resetSignal]);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    saveApiKey(value);
    onApiKeyChange?.(value);
    setValidationStatus("idle");
    setValidationMessage("");
  };

  const handleApiModeChange = (mode: "mock" | "live") => {
    setApiMode(mode);
    saveApiMode(mode);
    onApiModeChange?.(mode);
  };

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationStatus("invalid");
      setValidationMessage("Vui lòng nhập API key");
      return;
    }

    setIsValidating(true);
    setValidationStatus("idle");
    setValidationMessage("");

    try {
      // Test API key with a simple request
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
        headers: {
          "X-Goog-Api-Key": apiKey,
        },
      });

      if (response.ok) {
        setValidationStatus("valid");
        setValidationMessage("API key hợp lệ và có thể sử dụng");
      } else {
        setValidationStatus("invalid");
        setValidationMessage("API key không hợp lệ hoặc không có quyền truy cập");
      }
    } catch (error) {
      setValidationStatus("invalid");
      setValidationMessage("Không thể kết nối đến Gemini API. Vui lòng kiểm tra kết nối mạng");
    } finally {
      setIsValidating(false);
    }
  };

  const getValidationIcon = () => {
    switch (validationStatus) {
      case "valid":
        return <FiCheckCircle className="text-green-500" />;
      case "invalid":
        return <FiAlertTriangle className="text-red-500" />;
      default:
        return null;
    }
  };

  const getValidationColor = () => {
    switch (validationStatus) {
      case "valid":
        return "text-green-600";
      case "invalid":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="api-key-settings">
      <div className="settings-section">
        <h3 className="section-title">
          <FiKey /> Cấu hình Gemini AI
        </h3>
        <p className="section-description">
          Nhập API key từ Google AI Studio để sử dụng Gemini AI cho việc phân tích hình ảnh và trích xuất dữ liệu tour.
        </p>
        
        <div className="api-mode-selector">
          <label className="mode-label">Chế độ hoạt động:</label>
          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-button ${apiMode === "mock" ? "active" : ""}`}
              onClick={() => handleApiModeChange("mock")}
            >
              Mock Data
            </button>
            <button
              type="button"
              className={`mode-button ${apiMode === "live" ? "active" : ""}`}
              onClick={() => handleApiModeChange("live")}
            >
              Live API
            </button>
          </div>
          <div className="mode-description">
            {apiMode === "mock" ? (
              <span className="text-blue-600">
                Sử dụng dữ liệu mẫu để test giao diện và luồng xử lý
              </span>
            ) : (
              <span className="text-green-600">
                Kết nối trực tiếp với Gemini AI để phân tích hình ảnh thực tế
              </span>
            )}
          </div>
        </div>

        {apiMode === "live" && (
          <div className="api-key-input-section">
            <label className="input-label">
              <span>Google AI Studio API Key</span>
              <div className="input-help">
                Lấy API key từ{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  Google AI Studio
                </a>
              </div>
            </label>
            <div className="api-key-input-group">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Nhập API key của bạn..."
                className="api-key-input"
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowApiKey(!showApiKey)}
                title={showApiKey ? "Ẩn API key" : "Hiện API key"}
              >
                {showApiKey ? <FiEyeOff /> : <FiEye />}
              </button>
              <button
                type="button"
                className="validate-button"
                onClick={validateApiKey}
                disabled={isValidating || !apiKey.trim()}
              >
                {isValidating ? <FiRefreshCw className="spin" /> : "Kiểm tra"}
              </button>
            </div>
            
            {validationMessage && (
              <div className={`validation-message ${getValidationColor()}`}>
                {getValidationIcon()} {validationMessage}
              </div>
            )}
          </div>
        )}

        <div className="api-info">
          <h4>Hướng dẫn sử dụng:</h4>
          <ol>
            <li>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></li>
            <li>Đăng nhập bằng tài khoản Google của bạn</li>
            <li>Tạo API key mới hoặc sử dụng key có sẵn</li>
            <li>Copy API key và paste vào ô trên</li>
            <li>Nhấn "Kiểm tra" để xác thực key</li>
            <li>Chuyển sang chế độ "Live API" để sử dụng</li>
          </ol>
          
          <div className="security-notice">
            <FiAlertTriangle className="text-yellow-500" />
            <span>
              <strong>Lưu ý bảo mật:</strong> API key được lưu trữ cục bộ trên trình duyệt của bạn. 
              Không chia sẻ API key với người khác và thường xuyên kiểm tra việc sử dụng.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};