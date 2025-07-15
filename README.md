# Workout Generator

A simple, constraint-based workout generator built with vanilla JavaScript. Generate custom workouts with intelligent muscle group sequencing to ensure optimal training flow.

## 🎯 Features

- **Smart Constraint System**: No two consecutive exercises target the same muscle group
- **Customizable Workouts**: Choose exercise count (5-20) and target muscle groups
- **Exercise Replacement**: Swap exercises while maintaining constraints
- **Drag & Drop Reordering**: Rearrange exercises with automatic constraint validation
- **PDF Export**: Generate printable workout sheets
- **Mobile Responsive**: Touch-friendly interface for all devices
- **Zero Dependencies**: Pure vanilla JavaScript implementation

## 🚀 Quick Start

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Select your desired muscle groups and exercise count
4. Click "Generate Workout" to create your custom routine

No build process or installation required!

## 📁 Project Structure

```
workout-generator/
├── index.html              # Main application entry point
├── css/
│   ├── main.css           # Core styles and layout
│   ├── components.css     # Component-specific styling
│   └── mobile.css         # Mobile responsiveness
├── js/
│   ├── app.js            # Application initialization
│   └── modules/
│       ├── exerciseDatabase.js    # Exercise data and retrieval
│       ├── exerciseGenerator.js   # Workout generation logic
│       ├── validators.js          # Constraint validation
│       ├── uiController.js        # DOM manipulation and events
│       ├── dragDrop.js           # Drag and drop functionality
│       └── pdfExport.js          # PDF generation
├── assets/               # Static assets (images, icons)
└── README.md            # This file
```

## 🏗️ Architecture

### Core Modules

**exerciseDatabase.js**
- Contains comprehensive exercise library organized by muscle groups
- Provides functions to retrieve exercises by muscle group or get all exercises
- Supports 6 main muscle groups: Chest, Back, Legs, Shoulders, Arms, Core

**exerciseGenerator.js**
- Implements workout generation algorithms
- Handles exercise replacement logic
- Ensures constraint compliance during generation

**validators.js**
- Enforces the core constraint: no consecutive exercises for same muscle group
- Validates entire workouts and individual exercise additions
- Provides filtering for valid exercise options

**uiController.js**
- Manages all DOM interactions and event handling
- Controls application state (loading, error, empty states)
- Renders workout lists and handles form submissions

**dragDrop.js**
- Implements drag and drop reordering functionality
- Maintains constraint validation during reordering
- Provides touch device fallbacks

**pdfExport.js**
- Generates printable PDF workout sheets
- Formats exercises with proper spacing and organization

## 🎮 Usage

### Basic Workout Generation

1. **Select Muscle Groups**: Check the boxes for muscle groups you want to target
2. **Set Exercise Count**: Use the slider to choose 5-20 exercises
3. **Generate**: Click "Generate Workout" to create your routine

### Exercise Replacement

1. Switch to "Replace Mode" using the radio buttons
2. Use the dropdown menus next to each exercise to select replacements
3. Only valid replacements (maintaining constraints) will be available

### Reordering Exercises

1. **Desktop**: Drag and drop exercises to reorder
2. **Mobile**: Use the reorder buttons that appear in touch mode
3. Invalid reorderings that break constraints will be prevented

### PDF Export

1. Generate or customize your workout
2. Click the "Export PDF" button
3. Save or print the formatted workout sheet

## ⚙️ Core Constraint System

The application enforces one fundamental rule:

> **No two consecutive exercises can target the same muscle group**

This constraint is maintained across all operations:
- ✅ Workout generation
- ✅ Exercise replacement
- ✅ Drag and drop reordering
- ✅ Manual exercise additions

### Example Valid Sequence:
```
1. Push-ups (Chest)
2. Pull-ups (Back)
3. Squats (Legs)
4. Overhead Press (Shoulders)
5. Bicep Curls (Arms)
```

### Example Invalid Sequence:
```
1. Push-ups (Chest)
2. Bench Press (Chest) ❌ - Same muscle group consecutive
```

## 🛠️ Development

### Implementation Principles

- **Keep It Simple (KIS)**: Vanilla JavaScript only, no external dependencies
- **Modular Design**: Each module has a single responsibility
- **Progressive Enhancement**: Core functionality works without advanced features
- **Mobile First**: Responsive design prioritizes mobile experience

### Testing Strategy

1. **Unit Testing**: Test each module independently
2. **Integration Testing**: Verify module interactions
3. **Constraint Testing**: Validate constraint enforcement in all scenarios
4. **Cross-Browser Testing**: Ensure compatibility across major browsers
5. **Device Testing**: Test on various screen sizes and input methods

### Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 📱 Mobile Features

- **Touch-Optimized**: 44px minimum touch targets
- **Responsive Layout**: Adapts to screen sizes from 320px to desktop
- **Touch Gestures**: Swipe and tap interactions for exercise management
- **Offline Capable**: Works without internet connection

## 🔧 Customization

### Adding New Exercises

Edit `js/modules/exerciseDatabase.js`:

```javascript
const exercises = {
  chest: [
    { name: "Your New Exercise", description: "Exercise description" },
    // ... existing exercises
  ]
};
```

### Modifying Constraints

Edit `js/modules/validators.js` to implement custom validation rules:

```javascript
function canAddExercise(currentWorkout, newExercise) {
  // Implement your custom constraint logic
}
```

### Styling Customization

Modify CSS custom properties in `css/main.css`:

```css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
  /* ... other variables */
}
```

## 🐛 Troubleshooting

### Common Issues

**Workout won't generate**
- Ensure at least one muscle group is selected
- Check that exercise count is within valid range (5-20)

**Drag and drop not working**
- Verify you're using a supported browser
- On mobile, use the reorder buttons instead

**PDF export fails**
- Check browser's popup blocker settings
- Ensure JavaScript is enabled

### Debug Mode

Open browser developer tools and check the console for detailed error messages. All modules include comprehensive error handling and logging.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the KIS principles
4. Test thoroughly across browsers and devices
5. Submit a pull request

## 📞 Support

For issues, questions, or feature requests, please open an issue on the project repository.

---

**Built with ❤️ using vanilla JavaScript**
