# PathSafe - AI-Powered Safe Navigation Platform

A cutting-edge 3D interactive demo showcasing PathSafe's AI-powered safe navigation capabilities, built for hackathon presentations.

## Features

### 3D Visualization
- **Interactive 3D Globe** - Global view of safe routes and danger zones with real-time rotation
- **City Map View** - Street-level navigation with buildings, roads, and detailed hazard visualization
- **Smooth Transitions** - Seamless camera animations between globe and city views

### Safety Features
- **Animated Safe Routes** - Progressive drawing of optimal paths with glowing tube geometry
- **Danger Heatmaps** - Shader-based pulsing indicators showing threat severity levels
- **Incident Pins** - Clickable 3D markers with glass-morphism info cards
- **Live Risk Scoring** - Real-time safety metrics displayed in stats panel
- **Animated Vehicles** - Moving pedestrian and vehicle icons along routes

### Visual Effects
- **Day/Night Toggle** - Dynamic lighting and atmospheric changes
- **Volumetric Fog** - Depth-enhancing atmospheric effects
- **Bloom & Glow** - Post-processing for neon aesthetic
- **Particle Stars** - Background star field for immersion
- **Emissive Buildings** - Night-mode window lighting

### User Experience
- **Guided Demo Tour** - Welcome overlay with keyboard shortcuts
- **Interactive Controls** - Mouse drag to rotate, scroll to zoom
- **Keyboard Shortcuts**:
  - Press `1` for Globe View
  - Press `2` for City View
  - Press `3` for Auto Demo Mode
- **Performance Optimized** - Mobile detection with conditional feature disabling for smooth performance
- **WebGL Fallback** - Graceful degradation for unsupported browsers

### SDK Integration
- **Developer-Ready** - Example API code snippets
- **Real-time Updates** - Live danger zone notifications
- **Map SDK Compatible** - Works with Google Maps, Mapbox, etc.
- **Low Latency** - Sub-100ms response times

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **3D Engine**: Three.js r152
- **Styling**: Tailwind CSS 3.4
- **Shaders**: GLSL (custom vertex & fragment shaders)
- **Backend**: Node.js + Express (development server)

## Installation

```bash
# Install dependencies
npm install

# Build Tailwind CSS
npm run build:css

# Start development server
npm run dev
```

The server runs on port 5000. Visit http://localhost:5000

## Project Structure

```
pathsafe-3d-showcase/
├── public/
│   ├── index.html          # Main HTML structure
│   ├── styles.css          # Compiled Tailwind CSS
│   ├── script.js           # Three.js 3D application
│   ├── assets/             # Images and resources
│   └── shaders/            # GLSL shader files
│       ├── heatmap.vert    # Heatmap vertex shader
│       ├── heatmap.frag    # Heatmap fragment shader
│       ├── route.vert      # Route vertex shader
│       └── route.frag      # Route fragment shader
├── src/
│   └── input.css           # Tailwind source
├── server.js               # Node.js dev server
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind configuration
└── README.md               # This file
```

## Performance Optimizations

- **Mobile Detection** - Automatically disables shadows, reduces pixel ratio, and disables post-processing on mobile devices
- **Conditional Post-Processing** - Bloom effects disabled on mobile for better performance
- **Texture Optimization** - Minimal texture usage, procedural materials and geometry
- **Triangle Budget** - Optimized geometry keeps triangle count manageable for smooth 60fps
- **WebGL Fallback** - Graceful error handling for environments without WebGL support

## Browser Compatibility

- **Chrome** 90+ (Recommended)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

Requires WebGL 2.0 support and hardware acceleration enabled.

## Hackathon Demo Tips

1. **Start with Auto Demo** - Press `3` to run the automated tour
2. **Highlight Key Features**:
   - Toggle between globe and city views (`1` and `2`)
   - Show day/night mode transition
   - Click incident pins to display info cards
   - Demonstrate smooth camera controls
3. **Show SDK Integration** - Scroll to SDK section for code examples
4. **Emphasize Performance** - Mention sub-100ms latency and 95% risk reduction

## API Example

```javascript
// Initialize PathSafe SDK
const pathsafe = new PathSafe({
    apiKey: 'YOUR_API_KEY',
    mode: 'walking'
});

// Get safe route with real-time risk data
const route = await pathsafe.getRoute({
    origin: { lat: 40.7128, lng: -74.0060 },
    destination: { lat: 40.7580, lng: -73.9855 },
    preferences: { prioritize: 'safety' }
});

// Access risk analysis and waypoints
console.log(route.safetyScore); // 92/100
```

## Development

### Watch Mode (Tailwind)
```bash
npm run watch:css
```

### Production Build
```bash
npm run build:css
```

## License

MIT

## Credits

Built for hackathon demonstration of PathSafe's AI-powered safe navigation platform.

---

**PathSafe** - Navigate Safely with AI Intelligence
