# Workout Generator

A constraint-based workout generator built with vanilla JavaScript that creates balanced exercise routines with intelligent muscle group sequencing. No frameworks, no dependencies, no backend required.

## 🎯 Features

- **Smart Constraint System**: Prevents consecutive exercises from targeting the same muscle group
- **Customizable Workouts**: Generate 4-20 exercises from selected muscle groups
- **Dual Operation Modes**: 
  - **Regenerate Mode**: Create entirely new workouts
  - **Replace Mode**: Swap individual exercises while maintaining constraints
- **Drag & Drop Reordering**: Rearrange exercises with automatic constraint validation
- **Touch-Optimized**: Mobile-friendly interface with 44px minimum touch targets
- **PDF Export**: Generate printable workout sheets with fallback to text format
- **Comprehensive Testing**: Built-in test framework with 100+ unit tests
- **Zero Dependencies**: Pure vanilla JavaScript implementation

## 🚀 Quick Start

1. **Clone or download** this repository
2. **Open `index.html`** in any modern web browser
3. **Select muscle groups** and exercise count
4. **Click "Generate Workout"** to create your routine
5. **Optional**: Run tests by opening `test-runner.html`

**That's it!** No installation, build process, or server required.

## 📁 Project Structure

```
workout-generator/
├── index.html                    # Main application
├── test-runner.html              # Test suite runner
├── README.md                     # This file
├── css/
│   ├── main.css                 # Core styles, layout, and design tokens
│   ├── components.css           # UI components and workout display
│   └── mobile.css               # Mobile responsiveness (currently empty)
├── js/
│   ├── app.js                   # Application initialization and dependency management
│   └── modules/
│       ├── exerciseDatabase.js  # Exercise data (20+ exercises per muscle group)
│       ├── validators.js        # Constraint validation logic
│       ├── exerciseGenerator.js # Workout generation algorithms
│       ├── uiController.js      # DOM manipulation and event handling
│       ├── dragDrop.js          # Drag and drop functionality
│       └── pdfExport.js         # PDF generation and export
└── tests/
    ├── testFramework.js         # Custom testing framework
    ├── testRunner.js            # Test execution and UI
    ├── exerciseDatabase.test.js # Database module tests
    ├── validators.test.js       # Constraint validation tests
    ├── exerciseGenerator.test.js# Generation algorithm tests
    ├── pdfExport.test.js        # Export functionality tests
    └── dragDrop.test.js         # Drag and drop tests
```

## 🏗️ Architecture

### Core Constraint
> **No two consecutive exercises can target the same muscle group**

This fundamental rule is enforced across all operations:
- ✅ Workout generation
- ✅ Exercise replacement  
- ✅ Drag and drop reordering
- ✅ Manual exercise swapping

### Module Design

**exerciseDatabase.js** - Data Layer
- 130+ exercises across 6 muscle groups (chest, back, legs, shoulders, arms, core)
- 20+ exercises per muscle group for variety
- Exercise retrieval and validation functions
- Immutable data with defensive copying

**validators.js** - Business Logic
- Constraint validation algorithms
- Workout analysis and statistics
- Exercise filtering for valid options
- Error handling and edge case management

**exerciseGenerator.js** - Generation Engine
- Constraint-aware workout generation
- Fisher-Yates shuffle algorithm
- Exercise replacement logic
- Input validation and error handling

**uiController.js** - Presentation Layer
- DOM manipulation and event handling
- UI state management (loading, error, populated states)
- Form data collection and validation
- Responsive rendering for different screen sizes

**dragDrop.js** - Interaction Layer
- Native HTML5 drag and drop implementation
- Touch device support with reorder buttons
- Real-time constraint validation during reordering
- Visual feedback for valid/invalid moves

**pdfExport.js** - Export Functionality
- Direct PDF generation using minimal PDF specification
- Text export fallback for compatibility
- Workout formatting and layout
- Download handling without external libraries

## 🎮 Usage Guide

### Basic Workout Generation

1. **Select Muscle Groups**: Check boxes for muscle groups you want to target
2. **Set Exercise Count**: Use slider to choose 4-20 exercises  
3. **Generate**: Click "Generate Workout" to create your routine

### Exercise Replacement (Replace Mode)

1. Switch to "Replace Mode" using the radio buttons
2. Use dropdown menus next to each exercise to select replacements
3. Only valid replacements (same muscle group, no constraint violations) are shown
4. Changes update immediately

### Reordering Exercises

- **Desktop**: Drag and drop exercises to reorder
- **Mobile**: Use up/down arrows that appear next to each exercise
- Invalid reorderings that break constraints are prevented automatically

### PDF Export

1. Generate or customize your workout
2. Click "Export PDF" button  
3. PDF downloads automatically (falls back to text if PDF fails)

## ⚙️ Technical Implementation

### Constraint Validation Algorithm

```javascript
// Core constraint check - simplified version
function canAddExercise(currentWorkout, newExercise) {
    if (currentWorkout.length === 0) return true;
    
    const lastExercise = currentWorkout[currentWorkout.length - 1];
    return lastExercise.muscleGroup !== newExercise.muscleGroup;
}
```

### Workout Generation Strategy

1. **Group Available Exercises**: Organize by muscle group
2. **Constraint-Aware Selection**: Choose exercises that don't violate rules
3. **Randomization**: Use Fisher-Yates shuffle for variety
4. **Validation**: Verify final workout meets all constraints
5. **Fallback Handling**: Retry with different parameters if generation fails

### Touch and Mobile Optimization

- **44px minimum touch targets** for all interactive elements
- **Responsive grid layouts** that adapt to screen size
- **Touch-specific reorder controls** when drag-and-drop isn't available
- **Mobile-first CSS** with progressive enhancement

## 🧪 Testing Framework

The application includes a comprehensive custom testing framework:

- **100+ Unit Tests** covering all modules and edge cases
- **Constraint Validation Tests** ensuring rules are never violated
- **Error Handling Tests** for robustness and reliability
- **Performance Tests** for large workouts and rapid operations
- **Mock Utilities** for testing UI components without DOM dependencies

### Running Tests

1. Open `test-runner.html` in your browser
2. Click "Run All Tests" to execute the full suite
3. View detailed results with pass/fail status and error details
4. Use "Stop on first failure" for debugging specific issues

### Test Coverage

- **Exercise Database**: Data integrity, retrieval, validation
- **Validators**: Constraint logic, edge cases, performance
- **Exercise Generator**: Generation algorithms, randomization, error handling  
- **PDF Export**: Content generation, format validation, fallback behavior
- **Drag Drop**: Reordering logic, constraint enforcement, touch compatibility

## 🛠️ Development Principles

### Keep It Simple (KIS)
- **Vanilla JavaScript only** - no external dependencies
- **Clear, readable code** over clever solutions  
- **Single responsibility** for each module
- **Progressive enhancement** - core functionality works without advanced features

### Code Quality Standards
- **Defensive copying** to prevent data mutation
- **Comprehensive error handling** with meaningful messages
- **Input validation** at module boundaries
- **Memory efficiency** with proper cleanup and references

### Browser Compatibility
- ✅ **Chrome 60+**
- ✅ **Firefox 55+** 
- ✅ **Safari 12+**
- ✅ **Edge 79+**

## 🎨 Customization

### Adding New Exercises

Edit `js/modules/exerciseDatabase.js`:

```javascript
const EXERCISE_DATABASE = {
    chest: [
        { id: 'chest_023', name: 'Your New Exercise' },
        // ... existing exercises
    ]
};
```

### Modifying Constraints

Edit `js/modules/validators.js` to implement custom validation rules:

```javascript
function canAddExercise(currentWorkout, newExercise) {
    // Implement your custom constraint logic here
    return isValidByYourRules(currentWorkout, newExercise);
}
```

### Styling Changes

Modify CSS custom properties in `css/main.css`:

```css
:root {
    --color-primary: #your-color;
    --color-secondary: #your-color;
    /* ... other design tokens */
}
```

## 🐛 Troubleshooting

### Common Issues

**Workout won't generate**
- Ensure at least one muscle group is selected
- Check exercise count is between 4-20
- Single muscle group + multiple exercises violates constraints

**Drag and drop not working**  
- Verify browser supports HTML5 drag and drop
- On mobile, use the arrow buttons instead
- Check console for JavaScript errors

**PDF export fails**
- Ensure popup blockers are disabled
- Check JavaScript is enabled
- Falls back to text export automatically

**Tests failing**
- Allow time for module initialization (modules load asynchronously)
- Check browser console for dependency loading errors
- Ensure all JavaScript files are present and accessible

### Debug Mode

Open browser developer tools and check:
- Console for initialization logs and errors
- Network tab to verify all files load correctly
- Elements tab to inspect DOM structure and event listeners

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Follow** the KIS principles and existing code style
4. **Add tests** for new functionality
5. **Test thoroughly** across browsers and devices
6. **Submit** a pull request

### Development Guidelines

- Maintain zero external dependencies
- Follow BEM CSS methodology  
- Write self-documenting code with clear variable names
- Add comprehensive error handling
- Include unit tests for new features
- Ensure mobile compatibility

## 📞 Support

For issues, questions, or feature requests:
- Check the troubleshooting section above
- Review existing test cases for usage examples
- Open an issue on the project repository
- Test your changes across multiple browsers before reporting bugs

---

**Built with ❤️ using vanilla JavaScript** - No frameworks, no bloat, just clean code that works.
