import { create } from 'zustand';
import type { AppState, PlacedItem, ItemType, ItemSize, LandLayout } from '../types';

interface LandStore extends AppState {
  // Actions for item placement
  setSelectedItemType: (type: ItemType | null) => void;
  setSelectedSize: (size: ItemSize | null) => void;
  addPlacedItem: (item: PlacedItem) => void;
  removePlacedItem: (id: string) => void;
  updatePlacedItem: (id: string, updates: Partial<PlacedItem>) => void;
  clearPlacedItems: () => void;

  // Actions for placement mode
  setPlacementMode: (isActive: boolean) => void;

  // Actions for grid and snap
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;

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
  placedItems: [],
  isPlacementMode: false,
  currentLayout: null,
  cameraState: {
    position: { x: 20, y: 20, z: 20 },
    target: { x: 0, y: 0, z: 0 },
    zoom: 1,
  },
  gridVisible: true,
  snapToGrid: true,

  // Item selection actions
  setSelectedItemType: (type) => {
    set({ selectedItemType: type, isPlacementMode: type !== null });
  },

  setSelectedSize: (size) => {
    set({ selectedSize: size });
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
    });
  },

  exportLayout: () => {
    const state = get();
    return JSON.stringify({
      version: '1.0',
      layout: state.currentLayout,
      placedItems: state.placedItems,
    }, null, 2);
  },

  importLayout: (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.placedItems) {
        set({
          placedItems: parsed.placedItems,
          currentLayout: parsed.layout || null,
        });
      }
    } catch (error) {
      console.error('Failed to import layout:', error);
    }
  },
}));
