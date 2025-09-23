import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  icon?: ReactNode;
  accent?: "blue" | "green" | "orange" | "purple";
}

export const StatCard = ({
  label,
  value,
  trend,
  icon,
  accent = "blue",
}: StatCardProps) => (
  <div className={`stat-card accent-${accent}`}>
    <div className="stat-card-icon">{icon}</div>
    <div className="stat-card-content">
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
      {trend && <span className="stat-card-trend">{trend}</span>}
    </div>
  </div>
);
