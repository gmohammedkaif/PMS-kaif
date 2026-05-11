import { NavLink, useNavigate } from "react-router-dom";
import { Building2, LayoutDashboard, Home, Users, FileText, CreditCard, LogOut, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/properties", icon: Home, label: "Properties" },
  { to: "/tenants", icon: Users, label: "Tenants" },
  { to: "/leases", icon: FileText, label: "Leases" },
  { to: "/payments", icon: CreditCard, label: "Payments" },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-40 flex flex-col
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-md shadow-brand-600/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-slate-900 dark:text-white text-sm leading-tight">PropManager</p>
              <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">Pro</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 mb-3">Main Menu</p>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 mb-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">
                {(user?.displayName || user?.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user?.displayName || "Property Owner"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full sidebar-link text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
