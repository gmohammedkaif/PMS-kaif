import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ onMenuClick, title }) {
  const { dark, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="font-display font-bold text-slate-900 dark:text-white text-xl hidden sm:block">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        {user?.photoURL ? (
          <img src={user.photoURL} alt="avatar" className="w-9 h-9 rounded-full object-cover border-2 border-brand-200 dark:border-brand-800" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold border-2 border-brand-200">
            {(user?.displayName || user?.email || "U")[0].toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
