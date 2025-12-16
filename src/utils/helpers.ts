import type { Position } from '../types';

// Grid size for snapping
export const GRID_SIZE = 1;

// Snap position to grid
export const snapToGrid = (position: Position, gridSize: number = GRID_SIZE): Position => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: position.y, // Keep y (height) as is
    z: Math.round(position.z / gridSize) * gridSize,
  };
};

// Calculate distance between two positions
export const getDistance = (pos1: Position, pos2: Position): number => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Check if two items overlap (simple AABB collision)
export const checkOverlap = (
  pos1: Position,
  dim1: { width: number; depth: number },
  pos2: Position,
  dim2: { width: number; depth: number }
): boolean => {
  const halfWidth1 = dim1.width / 2;
  const halfDepth1 = dim1.depth / 2;
  const halfWidth2 = dim2.width / 2;
  const halfDepth2 = dim2.depth / 2;

  return (
    Math.abs(pos1.x - pos2.x) < halfWidth1 + halfWidth2 &&
    Math.abs(pos1.z - pos2.z) < halfDepth1 + halfDepth2
  );
};

// Generate unique ID
export const generateId = (): string => {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Format date for display
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Convert degrees to radians
export const degToRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Convert radians to degrees
export const radToDeg = (radians: number): number => {
  return radians * (180 / Math.PI);
};
