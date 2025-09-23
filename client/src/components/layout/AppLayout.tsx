import { useEffect, useState, type ReactNode } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/new", label: "AI Intake" },
  { to: "/master-data", label: "Master Data" },
];

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <span className="brand-badge">AI</span>
          <div>
            <div className="brand-title">TourCost Intelligence</div>
            <div className="brand-subtitle">Smart tour automation & auditing</div>
          </div>
        </div>
        <button
          type="button"
          aria-label="Toggle navigation"
          className="nav-toggle"
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
        <nav className={`app-nav ${menuOpen ? "open" : ""}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
};
