export type ThemeMode = 'light' | 'dark';

export type ColorPresetId = 'kemnaker' | 'anthropic' | 'emerald' | 'violet' | 'amber' | 'slate';

export interface ColorPreset {
  id: ColorPresetId;
  name: string;
  tagline: string;
  primary: string;       // Primary brand hex
  primaryHover: string;
  accent: string;        // Accent / action hex
  accentHover: string;
  headerBg: string;      // Top banner / header background hex
  swatch: string;        // Preview color circle
  accentSwatch: string;  // Preview secondary color
  badgeClass: string;
}

export const COLOR_PRESETS: Record<ColorPresetId, ColorPreset> = {
  kemnaker: {
    id: 'kemnaker',
    name: 'Kemnaker Blue (Default)',
    tagline: 'Biru Resmi Kemnaker RI',
    primary: '#003B73',
    primaryHover: '#002B49',
    accent: '#0066FF',
    accentHover: '#0052CC',
    headerBg: '#002B49',
    swatch: '#003B73',
    accentSwatch: '#0066FF',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800'
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Warm',
    tagline: 'Warm Terracotta & Sand (Claude style)',
    primary: '#CC5A36',
    primaryHover: '#B34927',
    accent: '#D97757',
    accentHover: '#C46445',
    headerBg: '#1C1917',
    swatch: '#CC5A36',
    accentSwatch: '#D97757',
    badgeClass: 'bg-orange-100 text-orange-900 dark:bg-orange-950/70 dark:text-orange-300 border-orange-200 dark:border-orange-800'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Sage',
    tagline: 'Hijau Hutan & Zamrud Segar',
    primary: '#047857',
    primaryHover: '#065F46',
    accent: '#10B981',
    accentHover: '#059669',
    headerBg: '#06281E',
    swatch: '#047857',
    accentSwatch: '#10B981',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  violet: {
    id: 'violet',
    name: 'Royal Violet',
    tagline: 'Ungu Amethyst & Iris Elegan',
    primary: '#6D28D9',
    primaryHover: '#5B21B6',
    accent: '#8B5CF6',
    accentHover: '#7C3AED',
    headerBg: '#1A0E2E',
    swatch: '#6D28D9',
    accentSwatch: '#8B5CF6',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800'
  },
  amber: {
    id: 'amber',
    name: 'Amber Sunset',
    tagline: 'Emas Hangat & Senja Tropis',
    primary: '#D97706',
    primaryHover: '#B45309',
    accent: '#F59E0B',
    accentHover: '#D97706',
    headerBg: '#2A1806',
    swatch: '#D97706',
    accentSwatch: '#F59E0B',
    badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  slate: {
    id: 'slate',
    name: 'Slate Minimal',
    tagline: 'Monokrom Graphite Modern',
    primary: '#334155',
    primaryHover: '#1E293B',
    accent: '#64748B',
    accentHover: '#475569',
    headerBg: '#0F172A',
    swatch: '#334155',
    accentSwatch: '#64748B',
    badgeClass: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
  }
};

const STORAGE_KEYS = {
  THEME_MODE: 'maganghub_theme_mode',
  COLOR_PRESET: 'maganghub_color_preset'
};

export class ThemeService {
  static getThemeMode(): ThemeMode {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      // Check system preference
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      console.error('Error reading theme mode', e);
    }
    return 'light';
  }

  static setThemeMode(mode: ThemeMode): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
      this.applyTheme(mode, this.getColorPreset());
    } catch (e) {
      console.error('Error saving theme mode', e);
    }
  }

  static toggleThemeMode(): ThemeMode {
    const current = this.getThemeMode();
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    this.setThemeMode(next);
    return next;
  }

  static getColorPreset(): ColorPresetId {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COLOR_PRESET) as ColorPresetId;
      if (saved && COLOR_PRESETS[saved]) {
        return saved;
      }
    } catch (e) {
      console.error('Error reading color preset', e);
    }
    return 'kemnaker';
  }

  static setColorPreset(preset: ColorPresetId): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COLOR_PRESET, preset);
      this.applyTheme(this.getThemeMode(), preset);
    } catch (e) {
      console.error('Error saving color preset', e);
    }
  }

  static applyTheme(mode = this.getThemeMode(), preset = this.getColorPreset()): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // 1. Toggle dark class
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 2. Set data-theme attribute
    root.setAttribute('data-theme', preset);

    // 3. Set dynamic CSS variables for theme
    const themeConfig = COLOR_PRESETS[preset] || COLOR_PRESETS.kemnaker;
    root.style.setProperty('--theme-primary', themeConfig.primary);
    root.style.setProperty('--theme-primary-hover', themeConfig.primaryHover);
    root.style.setProperty('--theme-accent', themeConfig.accent);
    root.style.setProperty('--theme-accent-hover', themeConfig.accentHover);
    root.style.setProperty('--theme-header-bg', themeConfig.headerBg);
  }
}
