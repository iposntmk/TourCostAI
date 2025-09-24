import { FiWifiOff, FiRefreshCw, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { useMasterData } from "../../contexts/MasterDataContext";

export const SyncStatus = () => {
  const { syncStatus, forceSync, isLoading } = useMasterData();

  const getStatusIcon = () => {
    if (isLoading) return <FiRefreshCw className="spin" />;
    if (!syncStatus.isOnline) return <FiWifiOff />;
    if (syncStatus.pendingChanges) return <FiAlertTriangle />;
    return <FiCheckCircle />;
  };

  const getStatusText = () => {
    if (isLoading) return "Đang tải...";
    if (!syncStatus.isOnline) return "Offline";
    if (syncStatus.pendingChanges) return "Có thay đổi chưa sync";
    return "Đồng bộ với Firebase";
  };

  const getStatusColor = () => {
    if (isLoading) return "text-blue-500";
    if (!syncStatus.isOnline) return "text-red-500";
    if (syncStatus.pendingChanges) return "text-yellow-500";
    return "text-green-500";
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSync) return "Chưa sync";
    const now = new Date();
    const lastSync = syncStatus.lastSync;
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  const handleForceSync = async () => {
    try {
      await forceSync();
    } catch (error) {
      console.warn("Force sync failed:", error);
    }
  };

  return (
    <div className="sync-status">
      <div className="sync-status-main">
        <span className={`sync-icon ${getStatusColor()}`}>
          {getStatusIcon()}
        </span>
        <div className="sync-info">
          <div className="sync-text">{getStatusText()}</div>
          <div className="sync-time">{formatLastSync()}</div>
        </div>
      </div>
      
      {syncStatus.isOnline && syncStatus.pendingChanges && (
        <button
          className="sync-button"
          onClick={handleForceSync}
          disabled={isLoading}
          title="Đồng bộ ngay"
        >
          <FiRefreshCw className={isLoading ? "spin" : ""} />
        </button>
      )}
    </div>
  );
};