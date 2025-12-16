// Core type definitions for TGP Land Settler

export type ItemType =
  | 'rv'
  | 'mobile-home-single'
  | 'mobile-home-double'
  | 'house-small'
  | 'house-medium'
  | 'house-large'
  | 'tree'
  | 'fence'
  | 'culvert'
  | 'driveway';

export type ItemSize = 'small' | 'medium' | 'large';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface PlacedItem {
  id: string;
  type: ItemType;
  position: Position;
  rotation: Rotation;
  size?: ItemSize;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ItemDefinition {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  category: 'structures' | 'landscaping' | 'infrastructure';
  size?: ItemSize;
  defaultDimensions: {
    width: number;
    height: number;
    depth: number;
  };
  color: string;
  icon?: string;
  snapToGrid?: boolean;
  allowRotation?: boolean;
}

export interface TerrainConfig {
  width: number;
  depth: number;
  heightMap?: number[][];
  texture?: string;
}

export interface LandLayout {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  terrain: TerrainConfig;
  placedItems: PlacedItem[];
  propertyBoundary?: Position[];
}

export interface CameraState {
  position: Position;
  target: Position;
  zoom: number;
}

export interface AppState {
  selectedItemType: ItemType | null;
  selectedSize: ItemSize | null;
  placedItems: PlacedItem[];
  isPlacementMode: boolean;
  currentLayout: LandLayout | null;
  cameraState: CameraState;
  gridVisible: boolean;
  snapToGrid: boolean;
}
