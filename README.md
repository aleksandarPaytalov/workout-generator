# 💪 Workout Generator

Smart constraint-based workout generator with PWA support, offline functionality, and workout history tracking.

## ✨ Features

- **Smart Workout Generation** - Constraint-based algorithm ensures balanced, effective workouts
- **PWA Support** - Install on any device, works offline
- **Workout History** - Track last 5 workouts with ratings and notes
- **Dark Mode** - Eye-friendly theme switching
- **Export & Share** - Export to PDF/JSON, share workouts
- **Timer** - Built-in workout timer with audio cues
- **Fully Responsive** - Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Option 1: Install as PWA (Recommended)

**Android/Desktop:** Click "Install App" button or browser install prompt  
**iOS:** Safari → Share (□↑) → "Add to Home Screen"

### Option 2: Use in Browser

Just open `index.html` in any modern browser.

## 📱 Installation

**Android/Desktop (Chrome/Edge):**
1. Click "Install" button in header
2. Confirm installation
3. Launch from home screen/desktop

**iOS (Safari only):**
1. Tap Share (□↑) → "Add to Home Screen"
2. Tap "Add"

**Updates:** Automatic with notification. Click "Reload to Update" when prompted.

## 🎮 Usage

### Generate Workout

1. Select muscle groups (1-3 recommended)
2. Set exercise count (4-20)
3. Click "Generate Workout"
4. Workout auto-saves to history

### Workout History

- View last 5 workouts
- Rate workouts (1-5 stars)
- Add personal notes
- Search and filter
- Export to PDF/JSON
- Repeat previous workouts

### Timer

- Set prepare, work, rest times
- Configure cycles and sets
- Audio cues for transitions
- Choose from 10 sound options

## 🔌 Offline Mode

**Works Offline:**
- Generate workouts
- View history
- Export data
- Use timer
- All features

**Requires Internet:**
- Initial installation
- App updates

## 🛠️ Technical Details

### Stack

- Pure Vanilla JavaScript (no frameworks)
- CSS3 with modern features
- Service Worker for offline support
- localStorage for data persistence

### Performance

- 80ms page load time
- 3MB memory footprint
- 50MB cache (30-day auto-cleanup)
- Lighthouse PWA score: 90+

### Browser Support

- Chrome 60+ ✅
- Edge 79+ ✅
- Safari 12+ ✅ (limited PWA)
- Firefox 55+ ✅ (limited PWA)

## 🐛 Troubleshooting

**App won't install:**
- Use HTTPS or localhost
- Try Chrome/Edge for best support
- Check browser supports PWA

**Offline mode not working:**
- Visit app while online first
- Check service worker is registered (DevTools → Application)
- Clear cache and reload

**Service worker issues:**
- DevTools → Application → Service Workers → Unregister
- Hard refresh (Ctrl+Shift+R)
- Clear cache and reload

**For more help:** Check browser console for errors

## 🔧 Developer Guide

### Update Cache Version

When making changes, increment version in `service-worker.js`:

```javascript
const CACHE_VERSION = "v1.0.5"; // Increment this
```

### Add New Files

Add to `ASSETS_TO_CACHE` in `service-worker.js`:

```javascript
const ASSETS_TO_CACHE = [
  // ... existing files
  "/css/new-feature.css",
  "/js/modules/newModule.js",
];
```

### Deployment Checklist

- [ ] Increment `CACHE_VERSION`
- [ ] Update `ASSETS_TO_CACHE` if needed
- [ ] Test offline functionality
- [ ] Test on multiple browsers
- [ ] Run Lighthouse audit (90+ score)

## 📄 License

MIT License - Open source and free to use.

## 🆕 What's New

### v1.2.0 - PWA Features
- Installable on all devices
- Full offline functionality
- Service worker caching
- Auto-updates with notifications
- Offline indicator

### v1.1.0 - Workout History
- Track last 5 workouts
- Rating system
- Personal notes
- Search and filter
- Export to PDF/JSON

---

**Made with ❤️ for fitness enthusiasts**

