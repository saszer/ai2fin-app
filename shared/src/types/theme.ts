// ==========================================
// THEME SYSTEM TYPES
// ==========================================

export interface ThemeSettings {
  // Core theme mode
  mode: 'light' | 'dark' | 'auto';
  
  // Dark Reader style controls
  brightness: number; // 0-100
  contrast: number; // 0-100
  sepia: number; // 0-100
  saturation: number; // 0-100
  
  // Color customization
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Background customization
  backgroundColor: string;
  surfaceColor: string;
  cardColor: string;
  
  // Text customization
  textColor: string;
  textSecondaryColor: string;
  
  // Advanced settings
  fontFamily: string;
  fontSize: number; // 12-24
  lineHeight: number; // 1.2-2.0
  
  // Accessibility
  highContrast: boolean;
  reducedMotion: boolean;
  focusVisible: boolean;
  
  // Custom CSS overrides
  customCSS: string;
  
  // Theme presets
  preset: ThemePreset;
  
  // Auto-switch settings
  autoSwitch: {
    enabled: boolean;
    lightStart: string; // "06:00"
    darkStart: string; // "18:00"
    timezone: string;
  };
}

export type ThemePreset = 
  | 'default'
  | 'dark-reader'
  | 'high-contrast'
  | 'sepia'
  | 'blue-light-filter'
  | 'custom'
  | 'professional'
  | 'warm'
  | 'cool'
  | 'minimal';

export interface ThemePresetDefinition {
  id: ThemePreset;
  name: string;
  description: string;
  icon: string;
  settings: Partial<ThemeSettings>;
  category: 'built-in' | 'accessibility' | 'custom';
}

export interface ThemeState {
  currentTheme: ThemeSettings;
  availablePresets: ThemePresetDefinition[];
  isAutoSwitchEnabled: boolean;
  lastApplied: Date;
  version: string;
}

// ==========================================
// THEME PRESETS
// ==========================================

export const DEFAULT_THEME_PRESETS: ThemePresetDefinition[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard application theme',
    icon: '🎨',
    category: 'built-in',
    settings: {
      mode: 'light',
      brightness: 100,
      contrast: 100,
      sepia: 0,
      saturation: 100,
      primaryColor: '#3b82f6',
      secondaryColor: '#0d9488',
      accentColor: '#f59e0b',
      backgroundColor: '#f8fafc',
      surfaceColor: '#ffffff',
      cardColor: '#ffffff',
      textColor: '#1e293b',
      textSecondaryColor: '#64748b',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      lineHeight: 1.5,
      highContrast: false,
      reducedMotion: false,
      focusVisible: true,
      customCSS: '',
    }
  },
  {
    id: 'dark-reader',
    name: 'Dark Reader',
    description: 'Dark mode similar to Dark Reader extension',
    icon: '🌙',
    category: 'built-in',
    settings: {
      mode: 'dark',
      brightness: 85,
      contrast: 120,
      sepia: 0,
      saturation: 85,
      primaryColor: '#60a5fa',
      secondaryColor: '#14b8a6',
      accentColor: '#fbbf24',
      backgroundColor: '#0f172a',
      surfaceColor: '#1e293b',
      cardColor: '#334155',
      textColor: '#f1f5f9',
      textSecondaryColor: '#cbd5e1',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      lineHeight: 1.5,
      highContrast: false,
      reducedMotion: false,
      focusVisible: true,
      customCSS: '',
    }
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'High contrast theme for accessibility',
    icon: '🔍',
    category: 'accessibility',
    settings: {
      mode: 'dark',
      brightness: 100,
      contrast: 200,
      sepia: 0,
      saturation: 100,
      primaryColor: '#ffffff',
      secondaryColor: '#ffff00',
      accentColor: '#00ff00',
      backgroundColor: '#000000',
      surfaceColor: '#000000',
      cardColor: '#000000',
      textColor: '#ffffff',
      textSecondaryColor: '#ffff00',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 16,
      lineHeight: 1.8,
      highContrast: true,
      reducedMotion: true,
      focusVisible: true,
      customCSS: `
        * {
          border: 2px solid #ffffff !important;
        }
        button, input, select, textarea {
          border: 3px solid #ffffff !important;
          background: #000000 !important;
          color: #ffffff !important;
        }
      `,
    }
  },
  {
    id: 'sepia',
    name: 'Sepia',
    description: 'Warm sepia tone for eye comfort',
    icon: '📜',
    category: 'built-in',
    settings: {
      mode: 'light',
      brightness: 100,
      contrast: 100,
      sepia: 30,
      saturation: 80,
      primaryColor: '#8b4513',
      secondaryColor: '#a0522d',
      accentColor: '#cd853f',
      backgroundColor: '#fdf6e3',
      surfaceColor: '#faf0e6',
      cardColor: '#f5f5dc',
      textColor: '#2f1b14',
      textSecondaryColor: '#5d4037',
      fontFamily: 'Georgia, serif',
      fontSize: 14,
      lineHeight: 1.6,
      highContrast: false,
      reducedMotion: false,
      focusVisible: true,
      customCSS: '',
    }
  },
  {
    id: 'blue-light-filter',
    name: 'Blue Light Filter',
    description: 'Reduces blue light for evening use',
    icon: '🕶️',
    category: 'accessibility',
    settings: {
      mode: 'light',
      brightness: 90,
      contrast: 100,
      sepia: 15,
      saturation: 85,
      primaryColor: '#ff6b35',
      secondaryColor: '#f7931e',
      accentColor: '#ffd23f',
      backgroundColor: '#fff8e1',
      surfaceColor: '#fffde7',
      cardColor: '#fffef7',
      textColor: '#3e2723',
      textSecondaryColor: '#5d4037',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      lineHeight: 1.5,
      highContrast: false,
      reducedMotion: false,
      focusVisible: true,
      customCSS: `
        * {
          filter: sepia(0.1) hue-rotate(5deg) !important;
        }
      `,
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean professional theme',
    icon: '💼',
    category: 'built-in',
    settings: {
      mode: 'light',
      brightness: 100,
      contrast: 100,
      sepia: 0,
      saturation: 100,
      primaryColor: '#1a1a1a',
      secondaryColor: '#252525',
      accentColor: '#3b82f6',
      backgroundColor: '#f8fafc',
      surfaceColor: '#ffffff',
      cardColor: '#ffffff',
      textColor: '#1a1a1a',
      textSecondaryColor: '#5a5a5a',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      lineHeight: 1.5,
      highContrast: false,
      reducedMotion: false,
      focusVisible: true,
      customCSS: '',
    }
  },
  {
    id: 'warm',
    name: 'Warm',
    description: 'Warm and cozy theme',
    icon: '🔥',
    category: 'built-in',
    settings: {
      mode: 'light',
      brightness: 100,
      contrast: 100,
      sepia: 10,
      saturation: 110,
      primaryColor: '#f59e0b',
      secondaryColor: '#dc2626',
      accentColor: '#fbbf24',
      backgroundColor: '#fefce8',
      surfaceColor: '#ffffff',
      cardColor: '#ffffff',
      textColor: '#451a03',
      textSecondaryColor: '#92400e',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      lineHeight: 1.5,
      highContrast: false,
      reducedMotion: false,
      focusVisible: true,
      customCSS: '',
    }
  },
  {
    id: 'cool',
    name: 'Cool',
    description: 'Cool blue theme',
    icon: '❄️',
    category: 'built-in',
    settings: {
      mode: 'light',
      brightness: 100,
      contrast: 100,
      sepia: 0,
      saturation: 90,
      primaryColor: '#0ea5e9',
      secondaryColor: '#06b6d4',
      accentColor: '#8b5cf6',
      backgroundColor: '#f0f9ff',
      surfaceColor: '#ffffff',
      cardColor: '#ffffff',
      textColor: '#0c4a6e',
      textSecondaryColor: '#0369a1',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      lineHeight: 1.5,
      highContrast: false,
      reducedMotion: false,
      focusVisible: true,
      customCSS: '',
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Minimalist theme',
    icon: '⚪',
    category: 'built-in',
    settings: {
      mode: 'light',
      brightness: 100,
      contrast: 100,
      sepia: 0,
      saturation: 0,
      primaryColor: '#000000',
      secondaryColor: '#666666',
      accentColor: '#999999',
      backgroundColor: '#ffffff',
      surfaceColor: '#ffffff',
      cardColor: '#ffffff',
      textColor: '#000000',
      textSecondaryColor: '#666666',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      lineHeight: 1.5,
      highContrast: false,
      reducedMotion: true,
      focusVisible: true,
      customCSS: `
        * {
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        .MuiPaper-root {
          border: 1px solid #e0e0e0 !important;
        }
      `,
    }
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Your custom theme settings',
    icon: '🎨',
    category: 'custom',
    settings: {
      mode: 'light',
      brightness: 100,
      contrast: 100,
      sepia: 0,
      saturation: 100,
      primaryColor: '#3b82f6',
      secondaryColor: '#0d9488',
      accentColor: '#f59e0b',
      backgroundColor: '#f8fafc',
      surfaceColor: '#ffffff',
      cardColor: '#ffffff',
      textColor: '#1e293b',
      textSecondaryColor: '#64748b',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      lineHeight: 1.5,
      highContrast: false,
      reducedMotion: false,
      focusVisible: true,
      customCSS: '',
    }
  }
];

// ==========================================
// THEME UTILITIES
// ==========================================

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'light',
  brightness: 100,
  contrast: 100,
  sepia: 0,
  saturation: 100,
  primaryColor: '#3b82f6',
  secondaryColor: '#0d9488',
  accentColor: '#f59e0b',
  backgroundColor: '#f8fafc',
  surfaceColor: '#ffffff',
  cardColor: '#ffffff',
  textColor: '#1e293b',
  textSecondaryColor: '#64748b',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 14,
  lineHeight: 1.5,
  highContrast: false,
  reducedMotion: false,
  focusVisible: true,
  customCSS: '',
  preset: 'default',
  autoSwitch: {
    enabled: false,
    lightStart: '06:00',
    darkStart: '18:00',
    timezone: 'local'
  }
};

export const getPresetById = (id: ThemePreset): ThemePresetDefinition | undefined => {
  return DEFAULT_THEME_PRESETS.find(preset => preset.id === id);
};

export const applyThemeSettings = (settings: ThemeSettings): string => {
  const {
    brightness,
    contrast,
    sepia,
    saturation,
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    surfaceColor,
    cardColor,
    textColor,
    textSecondaryColor,
    fontFamily,
    fontSize,
    lineHeight,
    highContrast,
    reducedMotion,
    customCSS
  } = settings;

  return `
    :root {
      /* Core colors */
      --primary-color: ${primaryColor};
      --secondary-color: ${secondaryColor};
      --accent-color: ${accentColor};
      --background-color: ${backgroundColor};
      --surface-color: ${surfaceColor};
      --card-color: ${cardColor};
      --text-color: ${textColor};
      --text-secondary-color: ${textSecondaryColor};
      
      /* Typography */
      --font-family: ${fontFamily};
      --font-size: ${fontSize}px;
      --line-height: ${lineHeight};
      
      /* Accessibility */
      --high-contrast: ${highContrast ? '1' : '0'};
      --reduced-motion: ${reducedMotion ? '1' : '0'};
    }
    
    /* Global filters */
    body {
      filter: brightness(${brightness}%) contrast(${contrast}%) sepia(${sepia}%) saturate(${saturation}%);
      font-family: var(--font-family);
      font-size: var(--font-size);
      line-height: var(--line-height);
    }
    
    /* High contrast mode */
    ${highContrast ? `
      * {
        border: 2px solid var(--text-color) !important;
      }
      button, input, select, textarea {
        border: 3px solid var(--text-color) !important;
        background: var(--background-color) !important;
        color: var(--text-color) !important;
      }
    ` : ''}
    
    /* Reduced motion */
    ${reducedMotion ? `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    ` : ''}
    
    /* Custom CSS */
    ${customCSS}
  `;
}; 