import { create } from 'zustand';
import type { AppState, PlacedItem, ItemType, ItemSize, LandLayout } from '../types';
import { generateTerrainHeightMap, smoothHeightMap } from '../utils/noise';

// Track terrain modifications for each water feature
interface TerrainModification {
  itemId: string;
  originalHeights: Map<string, number>; // key: "x,z", value: original height
  affectedCells: Array<{ x: number; z: number }>;
}

interface LandStore extends AppState {
  // Selection state
  selectedItemId: string | null;
  cameraAngle: 10 | 30 | 45;
  terrainHeightMap: number[][] | null;
  originalTerrainHeightMap: number[][] | null; // Store original before modifications
  terrainModifications: Map<string, TerrainModification>; // itemId -> modification
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
  modifyTerrainForWaterFeature: (item: PlacedItem) => void;
  restoreTerrainForWaterFeature: (itemId: string) => void;

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
  originalTerrainHeightMap: null,
  terrainModifications: new Map(),
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
      terrainHeightMap: smoothed,
      originalTerrainHeightMap: smoothed.map(row => [...row]) // Deep copy
    });
  },

  modifyTerrainForWaterFeature: (item) => {
    const state = get();
    if (!state.terrainHeightMap) return;

    const heightMap = state.terrainHeightMap.map(row => [...row]);
    const resolution = heightMap.length;
    const worldSize = 100; // Map size
    const cellSize = worldSize / resolution;

    // Convert world position to grid coordinates
    const centerGridX = Math.floor((item.position.x + worldSize / 2) / cellSize);
    const centerGridZ = Math.floor((item.position.z + worldSize / 2) / cellSize);

    const modification: TerrainModification = {
      itemId: item.id,
      originalHeights: new Map(),
      affectedCells: [],
    };

    // Determine modification type based on item
    const isPond = item.type.includes('pond');
    const isStream = item.type.includes('creek') || item.type.includes('stream');

    if (isPond) {
      // Create subtle pond depression with gentle retention hills
      const pondRadius = Math.ceil(7 / cellSize); // Pond radius
      const retentionRadius = Math.ceil(10 / cellSize); // Retention hill radius
      const blendRadius = Math.ceil(14 / cellSize); // Smooth blending radius

      for (let z = Math.max(0, centerGridZ - blendRadius); z < Math.min(resolution, centerGridZ + blendRadius); z++) {
        for (let x = Math.max(0, centerGridX - blendRadius); x < Math.min(resolution, centerGridX + blendRadius); x++) {
          const dx = x - centerGridX;
          const dz = z - centerGridZ;
          const distance = Math.sqrt(dx * dx + dz * dz);

          const key = `${x},${z}`;
          modification.originalHeights.set(key, heightMap[z][x]);
          modification.affectedCells.push({ x, z });

          if (distance < pondRadius) {
            // Inside pond - create gentle depression with smooth cosine falloff
            const depthFactor = Math.cos((distance / pondRadius) * Math.PI * 0.5);
            const depression = 0.6 * depthFactor; // 0.6 units deep at center
            heightMap[z][x] = Math.max(0, heightMap[z][x] - depression);
          } else if (distance < retentionRadius) {
            // Retention hill - very subtle with sine curve
            const hillPosition = (distance - pondRadius) / (retentionRadius - pondRadius);
            const hillHeight = 0.25 * Math.sin(hillPosition * Math.PI); // 0.25 units max
            heightMap[z][x] = heightMap[z][x] + hillHeight;
          } else if (distance < blendRadius) {
            // Smooth blending zone
            const blendPosition = (distance - retentionRadius) / (blendRadius - retentionRadius);
            const blendFactor = Math.cos(blendPosition * Math.PI * 0.5);
            const blendHeight = 0.1 * blendFactor;
            heightMap[z][x] = heightMap[z][x] + blendHeight;
          }
        }
      }
    } else if (isStream) {
      // Create stream channel - narrower and more subtle
      const channelHalfWidth = Math.ceil(1.5 / cellSize); // 1.5 units half-width
      const channelDepth = 0.4; // 0.4 unit deep
      const blendWidth = Math.ceil(3 / cellSize); // Blend zone

      for (let z = Math.max(0, centerGridZ - blendWidth); z < Math.min(resolution, centerGridZ + blendWidth); z++) {
        for (let x = Math.max(0, centerGridX - blendWidth); x < Math.min(resolution, centerGridX + blendWidth); x++) {
          const dz = Math.abs(z - centerGridZ);

          const key = `${x},${z}`;
          modification.originalHeights.set(key, heightMap[z][x]);
          modification.affectedCells.push({ x, z });

          if (dz < channelHalfWidth) {
            // Create smooth channel depression with cosine falloff
            const depthFactor = Math.cos((dz / channelHalfWidth) * Math.PI * 0.5);
            const depression = channelDepth * depthFactor;
            heightMap[z][x] = Math.max(0, heightMap[z][x] - depression);
          } else if (dz < blendWidth) {
            // Smooth blending
            const blendPosition = (dz - channelHalfWidth) / (blendWidth - channelHalfWidth);
            const blendFactor = Math.cos(blendPosition * Math.PI * 0.5);
            const blendDepth = channelDepth * 0.2 * blendFactor;
            heightMap[z][x] = Math.max(0, heightMap[z][x] - blendDepth);
          }
        }
      }
    }

    // Store modification and update heightmap
    const modifications = new Map(state.terrainModifications);
    modifications.set(item.id, modification);

    set({
      terrainHeightMap: heightMap,
      terrainModifications: modifications
    });
  },

  restoreTerrainForWaterFeature: (itemId) => {
    const state = get();
    if (!state.terrainHeightMap) return;

    const modification = state.terrainModifications.get(itemId);
    if (!modification) return;

    const heightMap = state.terrainHeightMap.map(row => [...row]);

    // Restore original heights
    modification.originalHeights.forEach((originalHeight, key) => {
      const [x, z] = key.split(',').map(Number);
      if (z < heightMap.length && x < heightMap[0].length) {
        heightMap[z][x] = originalHeight;
      }
    });

    // Remove modification tracking
    const modifications = new Map(state.terrainModifications);
    modifications.delete(itemId);

    set({
      terrainHeightMap: heightMap,
      terrainModifications: modifications
    });
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
