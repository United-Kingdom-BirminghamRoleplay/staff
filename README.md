# UKBRUM Staff Portal

A professional staff management system for UKBRUM Emergency Response: Liberty County.

## ✨ Recent Improvements

### 🔍 Enhanced Roblox User Search
- **Separate JavaScript Module**: Moved to `js/roblox-search.js` for better organization
- **Multiple API Fallbacks**: Attempts different endpoints for better reliability
- **Input Validation**: Validates username format before searching
- **Improved UI**: Better loading states, error messages, and user feedback
- **Keyboard Shortcuts**: Press `Ctrl+K` to focus search input
- **Enhanced Results**: Shows avatar, display name, username, and multiple action buttons

### 🎨 Professional Design Overhaul
- **Modern Gradient Backgrounds**: Subtle gradients and backdrop blur effects
- **Enhanced Animations**: Smooth transitions, hover effects, and loading animations
- **Improved Typography**: Better font weights, spacing, and hierarchy
- **Professional Color Scheme**: CSS custom properties for consistent theming
- **Advanced Shadows**: Multi-layer shadows for depth and professionalism
- **Responsive Design**: Optimized for all screen sizes with improved mobile experience

### 🚀 Performance & UX Enhancements
- **Modular JavaScript**: Separated concerns with `main.js` and `roblox-search.js`
- **Intersection Observer**: Smooth fade-in animations for page elements
- **Toast Notifications**: User feedback for actions and copy operations
- **Code Copy Functionality**: Click any code element to copy to clipboard
- **Smooth Scrolling**: Enhanced navigation experience
- **Custom Scrollbar**: Styled scrollbar matching the theme

### 📱 Mobile Optimization
- **Responsive Navigation**: Collapsible menu for mobile devices
- **Touch-Friendly**: Larger touch targets and improved spacing
- **Optimized Layouts**: Stack layouts and adjusted sizing for mobile
- **Performance**: Reduced animations and optimized for mobile performance

## 🛠️ Technical Features

### File Structure
```
staff/
├── js/
│   ├── main.js           # Common functionality and utilities
│   └── roblox-search.js  # Roblox user search module
├── data/
│   ├── ranks.json        # Staff rank structure data
│   └── commands.json     # ERLC command reference
├── index.html            # Main dashboard
├── ranks.html            # Staff hierarchy
├── guidelines.html       # Punishment guidelines
├── logs.html             # Logging system
├── resources.html        # Staff resources
└── styles.css            # Enhanced styling
```

### Key Features
- **CORS-Resistant Search**: Multiple API endpoints for Roblox user lookup
- **Professional Animations**: CSS animations with proper easing curves
- **Accessibility**: Proper contrast ratios and keyboard navigation
- **Modern CSS**: CSS Grid, Flexbox, and custom properties
- **Progressive Enhancement**: Works without JavaScript, enhanced with it

## 🎯 Staff-Focused Design

### Visual Hierarchy
- **Clear Information Architecture**: Logical grouping and navigation
- **Professional Aesthetics**: Corporate-style design suitable for staff use
- **Consistent Branding**: UKBRUM colors and styling throughout
- **Functional Beauty**: Every design element serves a purpose

### User Experience
- **Intuitive Navigation**: Clear menu structure and active states
- **Quick Actions**: Easy access to common staff functions
- **Efficient Workflows**: Streamlined processes for staff tasks
- **Professional Feel**: Serious, trustworthy interface for staff operations

## 🔧 Browser Support
- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with modern CSS support

## 📝 Usage Notes
- The Roblox search may encounter CORS issues in some browsers
- For production use, consider implementing a server-side proxy for API calls
- All animations respect `prefers-reduced-motion` for accessibility
- The site works offline for cached resources

---

**Built for UKBRUM Emergency Response: Liberty County Staff Team**