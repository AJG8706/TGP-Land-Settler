import { create } from 'zustand';
import type { AppState, PlacedItem, ItemType, ItemSize, LandLayout } from '../types';
import { generateTerrainHeightMap, smoothHeightMap, getHeightAtPosition } from '../utils/noise';
import { getItemDefinition } from '../data/items';

interface LandStore extends AppState {
  // Selection state
  selectedItemId: string | null;
  cameraAngle: 10 | 30 | 45;
  terrainHeightMap: number[][] | null;
  isDraggingItem: boolean;

  // Actions for item placement
  setSelectedItemType: (type: ItemType | null) => void;
  setSelectedSize: (size: ItemSize | null) => void;
  setSelectedItemId: (id: string | null) => void;
  setIsDraggingItem: (isDragging: boolean) => void;
  addPlacedItem: (item: PlacedItem) => void;
  removePlacedItem: (id: string) => void;
  updatePlacedItem: (id: string, updates: Partial<PlacedItem>) => void;
  clearPlacedItems: () => void;

  // Actions for placement mode
  setPlacementMode: (isActive: boolean) => void;

  // Actions for grid and snap
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;

  // Actions for camera
  setCameraAngle: (angle: 10 | 30 | 45) => void;

  // Actions for terrain
  setTerrainHeightMap: (heightMap: number[][]) => void;
  generateTerrain: (
    seed?: number,
    scale?: number,
    octaves?: number,
    persistence?: number,
    lacunarity?: number
  ) => void;
  adjustItemElevationToCorners: (itemId: string) => void;

  // Actions for layout management
  saveLayout: (name: string) => void;
  loadLayout: (layout: LandLayout) => void;
  exportLayout: () => string;
  importLayout: (data: string) => void;
}

export const useLandStore = create<LandStore>((set, get) => ({
  // Initial state
  selectedItemType: null,
  selectedSize: null,
  selectedItemId: null,
  placedItems: [],
  isPlacementMode: false,
  currentLayout: null,
  cameraState: {
    position: { x: 20, y: 20, z: 20 },
    target: { x: 0, y: 0, z: 0 },
    zoom: 1,
  },
  cameraAngle: 30,
  gridVisible: true,
  snapToGrid: true,
  terrainHeightMap: null,
  isDraggingItem: false,

  // Item selection actions
  setSelectedItemType: (type) => {
    set({ selectedItemType: type, isPlacementMode: type !== null });
  },

  setSelectedSize: (size) => {
    set({ selectedSize: size });
  },

  setSelectedItemId: (id) => {
    set({ selectedItemId: id });
  },

  setIsDraggingItem: (isDragging) => {
    set({ isDraggingItem: isDragging });
  },

  // Item placement actions
  addPlacedItem: (item) => {
    set((state) => ({
      placedItems: [...state.placedItems, item],
    }));
  },

  removePlacedItem: (id) => {
    set((state) => ({
      placedItems: state.placedItems.filter((item) => item.id !== id),
    }));
  },

  updatePlacedItem: (id, updates) => {
    set((state) => ({
      placedItems: state.placedItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  clearPlacedItems: () => {
    set({ placedItems: [] });
  },

  // Placement mode actions
  setPlacementMode: (isActive) => {
    set({ isPlacementMode: isActive });
  },

  // Grid actions
  toggleGrid: () => {
    set((state) => ({ gridVisible: !state.gridVisible }));
  },

  toggleSnapToGrid: () => {
    set((state) => ({ snapToGrid: !state.snapToGrid }));
  },

  // Camera actions
  setCameraAngle: (angle) => {
    set({ cameraAngle: angle });
  },

  // Terrain actions
  setTerrainHeightMap: (heightMap) => {
    set({ terrainHeightMap: heightMap });
  },

  generateTerrain: (seed, scale = 10, octaves = 4, persistence = 0.5, lacunarity = 2) => {
    // Generate natural terrain with Perlin noise
    const heightMap = generateTerrainHeightMap(
      50, // width resolution
      50, // height resolution
      scale,
      octaves,
      persistence,
      lacunarity,
      seed
    );

    // Smooth for natural flow
    const smoothed = smoothHeightMap(heightMap, 2);

    set({
      terrainHeightMap: smoothed
    });
  },

  adjustItemElevationToCorners: (itemId) => {
    const state = get();
    const item = state.placedItems.find(i => i.id === itemId);
    if (!item || !state.terrainHeightMap) return;

    // Get item definition to determine dimensions
    const definition = getItemDefinition(item.type);
    if (!definition) return;

    // Apply scale if provided
    const scale = item.scale || 1;
    const width = definition.defaultDimensions.width * scale;
    const depth = definition.defaultDimensions.depth * scale;

    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const rotation = item.rotation.y;

    // Calculate the 4 corners of the object in world space
    const corners = [
      { x: -halfWidth, z: -halfDepth }, // Front-left
      { x: halfWidth, z: -halfDepth },  // Front-right
      { x: -halfWidth, z: halfDepth },  // Back-left
      { x: halfWidth, z: halfDepth },   // Back-right
    ];

    // Rotate corners based on object rotation
    const rotatedCorners = corners.map(corner => {
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      return {
        x: item.position.x + (corner.x * cos - corner.z * sin),
        z: item.position.z + (corner.x * sin + corner.z * cos),
      };
    });

    // Get terrain height at each corner
    const cornerHeights = rotatedCorners.map(corner => {
      return getHeightAtPosition(
        state.terrainHeightMap!,
        corner.x,
        corner.z,
        100, // terrainWidth
        100, // terrainDepth
        10   // maxHeight
      );
    });

    // Calculate average height
    const avgHeight = cornerHeights.reduce((sum, h) => sum + h, 0) / cornerHeights.length;

    // Add offset to prevent z-fighting with terrain
    const isFlatItem = item.type.includes('road') ||
                       item.type.includes('driveway') ||
                       item.type.includes('pond');
    const heightWithOffset = avgHeight + (isFlatItem ? 1.0 : 0.05);

    // Update item position with adjusted elevation
    set((state) => ({
      placedItems: state.placedItems.map((i) =>
        i.id === itemId ? { ...i, position: { ...i.position, y: heightWithOffset } } : i
      ),
    }));
  },

  // Layout management
  saveLayout: (name) => {
    const state = get();
    const layout: LandLayout = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      terrain: {
        width: 100,
        depth: 100,
        heightMap: state.terrainHeightMap || undefined,
      },
      placedItems: state.placedItems,
    };

    set({ currentLayout: layout });

    // Save to localStorage
    const savedLayouts = JSON.parse(localStorage.getItem('landLayouts') || '[]');
    savedLayouts.push(layout);
    localStorage.setItem('landLayouts', JSON.stringify(savedLayouts));
  },

  loadLayout: (layout) => {
    set({
      currentLayout: layout,
      placedItems: layout.placedItems,
      terrainHeightMap: layout.terrain.heightMap || null,
    });
  },

  exportLayout: () => {
    const state = get();
    return JSON.stringify({
      version: '1.0',
      layout: state.currentLayout,
      placedItems: state.placedItems,
      terrain: {
        width: 100,
        depth: 100,
        heightMap: state.terrainHeightMap,
      },
    }, null, 2);
  },

  importLayout: (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.placedItems) {
        set({
          placedItems: parsed.placedItems,
          currentLayout: parsed.layout || null,
          terrainHeightMap: parsed.terrain?.heightMap || null,
        });
      }
    } catch (error) {
      console.error('Failed to import layout:', error);
    }
  },
}));
