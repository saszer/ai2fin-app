# 🎨 AI2 Theme System

A comprehensive, Dark Reader-inspired theme customization system for the AI2 platform.

## ✨ Features

### 🎯 Core Features
- **Multiple Theme Presets**: 10 built-in themes including Dark Reader, High Contrast, Sepia, and more
- **Real-time Preview**: See changes instantly as you adjust settings
- **Custom Color Picker**: Full color customization for all UI elements
- **Accessibility Features**: High contrast mode, reduced motion, enhanced focus indicators
- **Auto-switch**: Automatic theme switching based on time of day
- **Import/Export**: Share and backup your custom themes

### 🌙 Dark Reader Style Controls
- **Brightness**: 0-200% adjustment
- **Contrast**: 0-200% adjustment  
- **Sepia**: 0-100% warm tone filter
- **Saturation**: 0-200% color intensity
- **Global Filters**: Applied to entire application

### 🎨 Customization Options
- **Color Customization**: Primary, secondary, accent, background, surface, text colors
- **Typography**: Font family, size, line height
- **Custom CSS**: Advanced users can add custom CSS rules
- **Auto-switch Settings**: Configure light/dark mode timing

## 🚀 Quick Start

### Using the Theme Toggle
1. Click the theme icon in the top toolbar
2. Select from quick theme options:
   - Light Mode
   - Dark Mode  
   - Sepia
   - High Contrast
   - Blue Light Filter
   - Auto

### Advanced Customization
1. Go to **User Preferences** → **Themes** tab
2. Choose from 6 customization tabs:
   - **Presets**: Pre-built themes
   - **Basic**: Mode, brightness, contrast, sepia, saturation
   - **Colors**: Full color customization
   - **Typography**: Font settings
   - **Accessibility**: High contrast, reduced motion
   - **Advanced**: Custom CSS, auto-switch

## 🎨 Available Presets

### Built-in Themes
- **Default**: Standard application theme
- **Dark Reader**: Dark mode similar to Dark Reader extension
- **Professional**: Clean professional theme
- **Warm**: Warm and cozy theme
- **Cool**: Cool blue theme
- **Minimal**: Minimalist theme

### Accessibility Themes
- **High Contrast**: Maximum contrast for accessibility
- **Blue Light Filter**: Reduces blue light for evening use
- **Sepia**: Warm sepia tone for eye comfort

### Custom Theme
- **Custom**: Your personalized theme settings

## 🔧 Technical Implementation

### Architecture
```
ThemeContext (Provider)
├── ThemeSettings (Interface)
├── ThemePreset (Types)
├── applyThemeSettings (CSS Generator)
└── ThemeCustomization (UI Component)
```

### Key Components
- **ThemeContext**: Manages theme state and provides theme functions
- **ThemeCustomization**: Main UI for theme customization
- **ThemeToggle**: Quick theme switcher in toolbar
- **Theme Types**: TypeScript interfaces for type safety

### CSS Generation
The system generates CSS dynamically using the `applyThemeSettings` function:
- CSS custom properties for colors
- Global filters for brightness/contrast/sepia
- Accessibility overrides
- Custom CSS injection

### Storage
- Themes are saved to `localStorage` as `ai2-theme-settings`
- Automatic loading on application start
- Persistent across browser sessions

## 🎯 Usage Examples

### Quick Theme Switch
```typescript
import { useTheme } from '../contexts/ThemeContext';

const { applyPreset, updateTheme } = useTheme();

// Apply a preset
applyPreset('dark-reader');

// Update specific settings
updateTheme({ 
  brightness: 85, 
  contrast: 120, 
  mode: 'dark' 
});
```

### Custom Theme Creation
```typescript
const customTheme = {
  mode: 'dark',
  brightness: 90,
  contrast: 110,
  sepia: 10,
  saturation: 95,
  primaryColor: '#ff6b35',
  secondaryColor: '#f7931e',
  backgroundColor: '#1a1a1a',
  textColor: '#ffffff',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 16,
  lineHeight: 1.6,
  highContrast: false,
  reducedMotion: true,
  customCSS: `
    .custom-element {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  `
};
```

## 🔒 Accessibility Features

### High Contrast Mode
- Increases all borders and focus indicators
- Maximum contrast ratios
- Enhanced button and input styling

### Reduced Motion
- Disables animations for users with motion sensitivity
- Respects `prefers-reduced-motion` system preference
- Smooth transitions when enabled

### Focus Indicators
- Enhanced focus visibility
- Keyboard navigation support
- WCAG 2.1 AA compliance

## 🌐 Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Edge**: Full support
- **Mobile**: Responsive design

## 🔧 Development

### Adding New Presets
1. Add preset definition to `DEFAULT_THEME_PRESETS`
2. Include icon, name, description, and settings
3. Preset will automatically appear in the UI

### Custom CSS Integration
- Use CSS custom properties for dynamic theming
- Leverage the `applyThemeSettings` function
- Test with different theme combinations

### Performance Considerations
- CSS is generated once and cached
- Minimal re-renders with React optimization
- Efficient localStorage usage

## 📱 Mobile Support

The theme system is fully responsive and works on:
- Mobile browsers
- Tablet devices
- Touch interfaces
- Different screen sizes

## 🎨 Design Philosophy

Inspired by [Dark Reader](https://darkreader.org/), the theme system provides:
- **User Control**: Full customization without limitations
- **Accessibility First**: Built-in accessibility features
- **Performance**: Efficient implementation
- **Flexibility**: Support for custom themes and CSS
- **Ease of Use**: Simple interface for complex functionality

## 🔮 Future Enhancements

- **Theme Marketplace**: Share and download community themes
- **Advanced Filters**: More sophisticated color adjustments
- **Animation Controls**: Granular animation customization
- **System Integration**: Better OS theme detection
- **Theme Analytics**: Usage statistics and preferences

---

*Built with ❤️ for the AI2 platform* 