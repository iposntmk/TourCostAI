import { type ReactNode } from "react";

interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabMenuProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const TabMenu = ({ tabs, activeTab, onTabChange }: TabMenuProps) => {
  return (
    <div className="tab-menu-container">
      <div className="tab-menu">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-menu-item ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="tab-indicator" style={{ 
        transform: `translateX(${tabs.findIndex(tab => tab.id === activeTab) * 100}%)`,
        width: `${100 / tabs.length}%`
      }} />
    </div>
  );
};