# 🏡 TGP Land Settler

A highly functional, realistic land planning and customization application that allows prospects to design and visualize their dream property layout. Inspired by the builder mechanics of Fabledom, TGP Land Settler provides an intuitive 3D interface for planning land development.

## ✨ Features

### 🏗️ Structures
- **RVs**: Place recreational vehicles anywhere on your property
- **Mobile Homes**:
  - Single Wide: Standard manufactured homes
  - Double Wide: Larger manufactured homes
- **Fixed Houses**:
  - Small: Compact residential homes
  - Medium: Standard family homes
  - Large: Spacious estates

### 🌳 Landscaping
- **Trees**: Multiple tree types (Pine, Oak) for natural beautification
- Place trees freely to create your ideal landscape

### 🚧 Infrastructure
- **Driveways**: Design custom driveway layouts from property entrance
- **Fencing**: Linear fencing options (Wood, Chain Link) for property boundaries
- **Culverts**: Stream crossings and water management

### 🎮 Controls
- **Click to Select**: Choose items from the sidebar
- **Mouse Movement**: Position items in 3D space
- **Click to Place**: Confirm item placement
- **Press R**: Rotate items 90 degrees
- **Double-Click**: Remove placed items
- **ESC**: Cancel placement mode
- **3D Camera**:
  - Left-click + drag: Rotate view
  - Right-click + drag: Pan view
  - Scroll wheel: Zoom in/out

### 💾 Layout Management
- **Save Layouts**: Save your designs with custom names
- **Export**: Export layouts as JSON files
- **Import**: Load previously exported layouts
- **LocalStorage**: Automatic saving to browser storage

### ⚙️ View Options
- **Grid Toggle**: Show/hide placement grid
- **Snap to Grid**: Enable/disable grid snapping
- **Stats Display**: Track number of placed items

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AJG8706/TGP-Land-Settler.git
cd TGP-Land-Settler
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **3D Rendering**: Three.js with React Three Fiber
- **3D Utilities**: @react-three/drei
- **State Management**: Zustand
- **Build Tool**: Vite
- **Styling**: CSS3 with custom components

## 📁 Project Structure

```
TGP-Land-Settler/
├── src/
│   ├── components/
│   │   ├── canvas/          # 3D scene components
│   │   │   ├── Scene.tsx    # Main 3D canvas
│   │   │   ├── Terrain.tsx  # Ground and grid
│   │   │   ├── PlaceableItem.tsx
│   │   │   └── PlacementPreview.tsx
│   │   └── ui/              # UI components
│   │       ├── ItemSelector.tsx
│   │       ├── ItemSelector.css
│   │       ├── Toolbar.tsx
│   │       └── Toolbar.css
│   ├── data/
│   │   └── items.ts         # Item definitions
│   ├── store/
│   │   └── useLandStore.ts  # Zustand state management
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── utils/
│   │   └── helpers.ts       # Utility functions
│   ├── App.tsx              # Main app component
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── public/                  # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎯 Use Cases

### For Real Estate Prospects
- Visualize property layouts before purchase
- Plan home placement and orientation
- Design driveway access routes
- Plan landscaping and tree placement
- Experiment with different property configurations

### For Land Developers
- Present property potential to clients
- Create multiple layout options
- Export and share designs
- Demonstrate property flexibility

### For Property Planners
- Plan infrastructure placement
- Optimize land usage
- Consider terrain and natural features
- Plan utility access routes

## 🔧 Customization

### Adding New Item Types

Edit `src/data/items.ts` to add new placeable items:

```typescript
{
  id: 'custom-item',
  type: 'custom',
  name: 'Custom Item',
  description: 'Description here',
  category: 'structures',
  defaultDimensions: { width: 5, height: 3, depth: 5 },
  color: '#FF5733',
  snapToGrid: true,
  allowRotation: true,
}
```

### Modifying Terrain Size

Edit `src/components/canvas/Terrain.tsx`:

```typescript
const terrainSize = { width: 200, depth: 200 }; // Adjust size
```

### Customizing Colors

Edit the respective CSS files in `src/components/ui/` to match your brand colors.

## 📝 Development Roadmap

- [ ] Terrain elevation editing
- [ ] Multiple property boundaries
- [ ] Custom texture support
- [ ] 3D model imports
- [ ] Measurement tools
- [ ] Shadow simulation
- [ ] Weather/season visualization
- [ ] Multi-user collaboration
- [ ] AR/VR support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the building mechanics in [Fabledom](https://store.steampowered.com/app/1651560/Fabledom/)
- Built with [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- Powered by [Three.js](https://threejs.org/)

## 📧 Contact

For questions, suggestions, or support, please open an issue on GitHub.

---

**Made with ❤️ for TGP Land Development**
