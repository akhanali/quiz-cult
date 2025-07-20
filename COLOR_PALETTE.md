# Quiz Dojo Color Palette

## Overview
This document provides a comprehensive reference for all colors used in the Quiz Dojo application. The color scheme follows a warm, inviting design with teal accents and brown text hierarchy.

## Primary Brand Colors (Custom Hex Values)

### Core Brand Colors
| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Primary Teal** | `#10A3A2` | `rgb(16, 163, 162)` | Main brand color, primary buttons, links, icons |
| **Dark Teal** | `#05717B` | `rgb(5, 113, 123)` | Hover states for primary teal elements |
| **Primary Brown** | `#4E342E` | `rgb(78, 52, 46)` | Main text color, headings, important elements |
| **Secondary Brown** | `#6D4C41` | `rgb(109, 76, 65)` | Secondary text, placeholders, subtle elements |
| **Dark Brown** | `#8D6E63` | `rgb(141, 110, 99)` | Document mode accent, focus states |

### Background Colors
| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Main Background** | `#FDF0DC` | `rgb(253, 240, 220)` | Primary page background |
| **Card Background** | `#F7E2C0` | `rgb(247, 226, 192)` | Card and section backgrounds |
| **Pure White** | `#FFFFFF` | `rgb(255, 255, 255)` | Card backgrounds, text on dark |

### Accent Colors
| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Orange Accent** | `#F4B46D` | `rgb(244, 180, 109)` | Accent color, highlights, warnings |
| **Gold Highlight** | `#F6D35B` | `rgb(246, 211, 91)` | Success states, winners, celebrations |

## Tailwind CSS Colors Used

### Gray Scale
| Tailwind Class | Hex Code | Usage |
|----------------|----------|-------|
| `gray-50` | `#F9FAFB` | Subtle backgrounds, hover states |
| `gray-100` | `#F3F4F6` | Light backgrounds, borders |
| `gray-200` | `#E5E7EB` | Borders, dividers |
| `gray-300` | `#D1D5DB` | Borders, disabled states |
| `gray-400` | `#9CA3AF` | Secondary borders |
| `gray-500` | `#6B7280` | Secondary text, icons |
| `gray-600` | `#4B5563` | Secondary text, labels |
| `gray-800` | `#1F2937` | Primary text on light backgrounds |

### Blue Scale
| Tailwind Class | Hex Code | Usage |
|----------------|----------|-------|
| `blue-50` | `#EFF6FF` | Info backgrounds |
| `blue-100` | `#DBEAFE` | Info states, notifications |
| `blue-200` | `#BFDBFE` | Info borders |
| `blue-300` | `#93C5FD` | Info elements |
| `blue-500` | `#3B82F6` | Current player indicators |
| `blue-600` | `#2563EB` | Blue hover states |
| `blue-700` | `#1D4ED8` | Blue text on light backgrounds |
| `blue-800` | `#1E40AF` | Blue headings |

### Red Scale
| Tailwind Class | Hex Code | Usage |
|----------------|----------|-------|
| `red-100` | `#FEE2E2` | Error backgrounds |
| `red-200` | `#FECACA` | Error borders |
| `red-300` | `#FCA5A5` | Error elements |
| `red-500` | `#EF4444` | Error states, wrong answers |
| `red-600` | `#DC2626` | Error text |
| `red-700` | `#B91C1C` | Error hover states |

### Green Scale
| Tailwind Class | Hex Code | Usage |
|----------------|----------|-------|
| `green-50` | `#F0FDF4` | Success backgrounds |
| `green-100` | `#DCFCE7` | Success states |
| `green-600` | `#16A34A` | Success text |

### Yellow Scale
| Tailwind Class | Hex Code | Usage |
|----------------|----------|-------|
| `yellow-400` | `#FACC15` | Winner indicators, gold elements |
| `yellow-500` | `#EAB308` | Trophy icons, highlights |
| `yellow-600` | `#CA8A04` | Yellow text on light backgrounds |

### Orange Scale
| Tailwind Class | Hex Code | Usage |
|----------------|----------|-------|
| `orange-50` | `#FFF7ED` | Warning backgrounds |
| `orange-100` | `#FFEDD5` | Warning states |
| `orange-200` | `#FED7AA` | Warning borders |
| `orange-400` | `#FB923C` | Third place indicators |
| `orange-500` | `#F97316` | Orange accents |
| `orange-600` | `#EA580C` | Orange text |
| `orange-700` | `#C2410C` | Orange hover states |

### Teal Scale
| Tailwind Class | Hex Code | Usage |
|----------------|----------|-------|
| `teal-50` | `#F0FDFA` | Success backgrounds |
| `teal-100` | `#CCFBF1` | Success states |
| `teal-200` | `#99F6E4` | Success borders |
| `teal-300` | `#5EEAD4` | Success elements |
| `teal-500` | `#14B8A6` | Success indicators |
| `teal-600` | `#0D9488` | Success text |
| `teal-700` | `#0F766E` | Success hover states |

### Amber Scale
| Tailwind Class | Hex Code | Usage |
|----------------|----------|-------|
| `amber-50` | `#FFFBEB` | Warning backgrounds |
| `amber-100` | `#FEF3C7` | Warning states |
| `amber-200` | `#FDE68A` | Warning borders |
| `amber-500` | `#F59E0B` | Warning indicators |
| `amber-600` | `#D97706` | Warning text |
| `amber-700` | `#B45309` | Warning hover states |
| `amber-800` | `#92400E` | Warning headings |

## Theme Colors (Meta Tags & PWA)

### Browser Theme Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Theme Color** | `#10A3A2` | Browser theme color (meta tag) |
| **Background Color** | `#FDF0DC` | PWA background color (manifest) |

## Color Usage Patterns

### Text Hierarchy
1. **Primary Text**: `#4E342E` (Primary Brown) - Main headings, important text
2. **Secondary Text**: `#6D4C41` (Secondary Brown) - Body text, descriptions
3. **Muted Text**: `gray-600` - Placeholders, subtle information
4. **Inverted Text**: `white` - Text on dark backgrounds

### Background Hierarchy
1. **Page Background**: `#FDF0DC` (Main Background) - Primary page background
2. **Card Background**: `#F7E2C0` (Card Background) - Card and section backgrounds
3. **White Background**: `white` - Clean card backgrounds
4. **Subtle Backgrounds**: `gray-50`, `gray-100` - Hover states, subtle sections

### Interactive Elements
1. **Primary Buttons**: `#10A3A2` → `#05717B` (Primary Teal → Dark Teal)
2. **Secondary Buttons**: `#F7E2C0` → `#F4B46D` (Card Background → Orange Accent)
3. **Success States**: `teal-100` background, `teal-600` text
4. **Error States**: `red-100` background, `red-600` text
5. **Warning States**: `amber-100` background, `amber-600` text

### Status Colors
1. **Success**: Teal scale (`teal-100`, `teal-600`) - Correct answers, success messages
2. **Error**: Red scale (`red-100`, `red-600`) - Wrong answers, error messages
3. **Warning**: Amber scale (`amber-100`, `amber-600`) - Time warnings, alerts
4. **Info**: Blue scale (`blue-100`, `blue-600`) - Information messages

### Leaderboard Colors
1. **1st Place**: `yellow-400` to `yellow-500` gradient with `yellow-600` border
2. **2nd Place**: `gray-400` to `gray-500` gradient with `gray-600` border
3. **3rd Place**: `orange-400` to `orange-500` gradient with `orange-600` border
4. **Current Player**: `blue-500` with `blue-600` border
5. **Other Players**: `gray-300` with `gray-400` border

## Color Accessibility

### Contrast Ratios
- Primary Brown (`#4E342E`) on Cream (`#FDF0DC`): **Excellent contrast**
- Primary Teal (`#10A3A2`) on White: **Good contrast**
- Secondary Brown (`#6D4C41`) on Cream (`#FDF0DC`): **Good contrast**

### Color Blind Considerations
- Uses both color and shape/position for status indicators
- Text labels accompany color-coded elements
- Sufficient contrast ratios maintained

## Implementation Notes

### Tailwind Classes
- Custom colors are implemented using Tailwind's arbitrary value syntax: `bg-[#10A3A2]`
- Standard Tailwind colors use regular class names: `bg-blue-500`
- Opacity modifiers are used: `bg-[#4E342E]/20` for 20% opacity

### CSS Variables (Future Enhancement)
Consider implementing CSS custom properties for better maintainability:
```css
:root {
  --color-primary: #10A3A2;
  --color-primary-dark: #05717B;
  --color-text-primary: #4E342E;
  --color-text-secondary: #6D4C41;
  --color-background: #FDF0DC;
  --color-card: #F7E2C0;
  --color-accent: #F4B46D;
  --color-highlight: #F6D35B;
}
```

## File References

### Key Files Using Colors
- `frontend/src/pages/HomePage.tsx` - Main landing page colors
- `frontend/src/pages/CreateRoomPage.tsx` - Room creation interface
- `frontend/src/pages/JoinRoomPage.tsx` - Room joining interface
- `frontend/src/pages/LobbyPage.tsx` - Game lobby
- `frontend/src/pages/QuizPage.tsx` - Quiz interface with status colors
- `frontend/src/pages/ResultsPage.tsx` - Results with celebration colors
- `frontend/src/components/LeaderboardChart.tsx` - Leaderboard with position colors
- `frontend/src/components/LanguageSwitcher.tsx` - Language selector
- `frontend/src/components/FeedbackModal.tsx` - Feedback modal
- `frontend/index.html` - Theme color meta tag
- `frontend/public/site.webmanifest` - PWA theme colors

This color palette creates a cohesive, warm, and engaging user experience that aligns with the Quiz Dojo brand identity. 