import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Palette, 
  Check, 
  Sparkles
} from 'lucide-react';
import { 
  ThemeService, 
  ThemeMode, 
  ColorPresetId, 
  COLOR_PRESETS 
} from '../services/themeService';

interface ThemeSwitcherProps {
  onThemeChanged?: () => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ onThemeChanged }) => {
  const [mode, setMode] = useState<ThemeMode>(ThemeService.getThemeMode());
  const [preset, setPreset] = useState<ColorPresetId>(ThemeService.getColorPreset());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleMode = () => {
    const nextMode = ThemeService.toggleThemeMode();
    setMode(nextMode);
    onThemeChanged?.();
  };

  const handleSelectPreset = (newPreset: ColorPresetId) => {
    ThemeService.setColorPreset(newPreset);
    setPreset(newPreset);
    setIsOpen(false);
    onThemeChanged?.();
  };

  const currentPreset = COLOR_PRESETS[preset] || COLOR_PRESETS.kemnaker;

  return (
    <div className="flex items-center gap-1.5" ref={dropdownRef}>
      {/* Dark Mode Switcher Button */}
      <button
        type="button"
        onClick={handleToggleMode}
        title={mode === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        aria-label="Toggle dark mode"
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[var(--theme-accent)]"
      >
        {mode === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-slate-600 transition-transform duration-200 hover:-rotate-12" />
        )}
      </button>

      {/* Color Theme Preset Dropdown Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={`Tema Warna: ${currentPreset.name}`}
          aria-label="Pilih tema warna"
          className="h-9 px-2.5 rounded-xl flex items-center gap-2 transition-all bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[var(--theme-accent)]"
        >
          <div className="flex items-center -space-x-1">
            <span 
              className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-2xs" 
              style={{ backgroundColor: currentPreset.primary }}
            />
            <span 
              className="w-2.5 h-2.5 rounded-full ring-1.5 ring-white dark:ring-slate-800 shadow-2xs" 
              style={{ backgroundColor: currentPreset.accent }}
            />
          </div>
          <Palette className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Preset Tema Warna
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Pilih Gaya Visual
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                6 Pilihan
              </span>
            </div>

            <div className="py-1 space-y-1">
              {(Object.keys(COLOR_PRESETS) as ColorPresetId[]).map((key) => {
                const item = COLOR_PRESETS[key];
                const isSelected = preset === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectPreset(key)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isSelected 
                        ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white font-bold ring-1 ring-slate-300 dark:ring-slate-700' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Color Duo Swatches */}
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        <span 
                          className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shadow-2xs" 
                          style={{ backgroundColor: item.primary }}
                        />
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 shadow-2xs" 
                          style={{ backgroundColor: item.accent }}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{item.name}</span>
                          {key === 'anthropic' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                              Warm
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal leading-tight">
                          {item.tagline}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-2 mt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>Tema tersimpan otomatis</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300 capitalize">{mode} mode</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeSwitcher;
