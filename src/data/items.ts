import type { ItemDefinition } from '../types';

// Define all placeable items with their properties
export const ITEM_DEFINITIONS: ItemDefinition[] = [
  // Structures - RVs
  {
    id: 'rv-standard',
    type: 'rv',
    name: 'RV',
    description: 'Standard recreational vehicle',
    category: 'structures',
    defaultDimensions: { width: 2.5, height: 3, depth: 8 },
    color: '#FFFFFF',
    snapToGrid: true,
    allowRotation: true,
  },

  // Structures - Mobile Homes
  {
    id: 'mobile-home-single',
    type: 'mobile-home-single',
    name: 'Single Wide Mobile Home',
    description: 'Single wide manufactured home',
    category: 'structures',
    defaultDimensions: { width: 5, height: 3, depth: 20 },
    color: '#D4B896',
    snapToGrid: true,
    allowRotation: true,
  },
  {
    id: 'mobile-home-double',
    type: 'mobile-home-double',
    name: 'Double Wide Mobile Home',
    description: 'Double wide manufactured home',
    category: 'structures',
    defaultDimensions: { width: 8, height: 3, depth: 20 },
    color: '#C4A886',
    snapToGrid: true,
    allowRotation: true,
  },

  // Structures - Fixed Houses
  {
    id: 'house-small',
    type: 'house-small',
    name: 'Small House',
    description: 'Small fixed residential home',
    category: 'structures',
    size: 'small',
    defaultDimensions: { width: 8, height: 5, depth: 10 },
    color: '#8B4513',
    snapToGrid: true,
    allowRotation: true,
  },
  {
    id: 'house-medium',
    type: 'house-medium',
    name: 'Medium House',
    description: 'Medium fixed residential home',
    category: 'structures',
    size: 'medium',
    defaultDimensions: { width: 12, height: 6, depth: 15 },
    color: '#A0522D',
    snapToGrid: true,
    allowRotation: true,
  },
  {
    id: 'house-large',
    type: 'house-large',
    name: 'Large House',
    description: 'Large fixed residential home',
    category: 'structures',
    size: 'large',
    defaultDimensions: { width: 16, height: 8, depth: 20 },
    color: '#8B7355',
    snapToGrid: true,
    allowRotation: true,
  },

  // Landscaping - Trees
  {
    id: 'tree-pine',
    type: 'tree',
    name: 'Pine Tree',
    description: 'Evergreen pine tree',
    category: 'landscaping',
    defaultDimensions: { width: 2, height: 6, depth: 2 },
    color: '#228B22',
    snapToGrid: false,
    allowRotation: false,
  },
  {
    id: 'tree-oak',
    type: 'tree',
    name: 'Oak Tree',
    description: 'Deciduous oak tree',
    category: 'landscaping',
    defaultDimensions: { width: 3, height: 8, depth: 3 },
    color: '#2E8B57',
    snapToGrid: false,
    allowRotation: false,
  },

  // Infrastructure - Fencing
  {
    id: 'fence-wood',
    type: 'fence',
    name: 'Wood Fence',
    description: 'Wooden fence section (10ft)',
    category: 'infrastructure',
    defaultDimensions: { width: 3, height: 1.8, depth: 0.1 },
    color: '#8B6914',
    snapToGrid: true,
    allowRotation: true,
  },
  {
    id: 'fence-chain',
    type: 'fence',
    name: 'Chain Link Fence',
    description: 'Chain link fence section (10ft)',
    category: 'infrastructure',
    defaultDimensions: { width: 3, height: 1.8, depth: 0.1 },
    color: '#A9A9A9',
    snapToGrid: true,
    allowRotation: true,
  },

  // Infrastructure - Culvert
  {
    id: 'culvert-standard',
    type: 'culvert',
    name: 'Culvert',
    description: 'Stream culvert for water passage',
    category: 'infrastructure',
    defaultDimensions: { width: 2, height: 1, depth: 8 },
    color: '#696969',
    snapToGrid: true,
    allowRotation: true,
  },

  // Infrastructure - Driveway
  {
    id: 'driveway-straight',
    type: 'driveway',
    name: 'Driveway Section',
    description: 'Straight driveway section',
    category: 'infrastructure',
    defaultDimensions: { width: 3, height: 0.1, depth: 5 },
    color: '#505050',
    snapToGrid: true,
    allowRotation: true,
  },
];

// Helper function to get item definition by type
export const getItemDefinition = (type: string): ItemDefinition | undefined => {
  return ITEM_DEFINITIONS.find((item) => item.type === type);
};

// Get items by category
export const getItemsByCategory = (category: string): ItemDefinition[] => {
  return ITEM_DEFINITIONS.filter((item) => item.category === category);
};
