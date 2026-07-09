import { useTheme } from '../context/ThemeContext';
import { AppIcon } from './AppIcon';
import { faMoon, faSun } from '../icons';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn-ghost touch-target !min-h-[40px] !min-w-[40px] !rounded-full !px-2.5"
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      <AppIcon icon={theme === 'dark' ? faSun : faMoon} />
    </button>
  );
}
