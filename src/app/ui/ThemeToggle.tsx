import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../lib/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
      style={{ background: 'var(--surface)' }}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      {theme === "dark" ? (
        <Sun size={17} style={{ color: 'var(--label2)' }} />
      ) : (
        <Moon size={17} style={{ color: 'var(--label2)' }} />
      )}
    </button>
  );
}
