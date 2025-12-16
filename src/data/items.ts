import type { ItemDefinition } from '../types';

// Define all placeable items with their properties
export const ITEM_DEFINITIONS: ItemDefinition[] = [
  // Structures - RVs (8ft x 30ft = ~3.8 x 14.4 units)
  {
    id: 'rv-standard',
    type: 'rv',
    name: 'RV',
    description: 'Standard recreational vehicle (8ft x 30ft)',
    category: 'structures',
    defaultDimensions: { width: 3.8, height: 4, depth: 14.4 },
    color: '#FFFFFF',
    snapToGrid: true,
    allowRotation: true,
  },

  // Structures - Mobile Homes
  {
    id: 'mobile-home-single',
    type: 'mobile-home-single',
    name: 'Single Wide Mobile Home',
    description: 'Single wide manufactured home (14ft x 70ft)',
    category: 'structures',
    defaultDimensions: { width: 6.7, height: 4, depth: 33.5 },
    color: '#D4B896',
    snapToGrid: true,
    allowRotation: true,
  },
  {
    id: 'mobile-home-double',
    type: 'mobile-home-double',
    name: 'Double Wide Mobile Home',
    description: 'Double wide manufactured home (26ft x 70ft)',
    category: 'structures',
    defaultDimensions: { width: 12.4, height: 4, depth: 33.5 },
    color: '#C4A886',
    snapToGrid: true,
    allowRotation: true,
  },

  // Structures - Fixed Houses
  {
    id: 'house-small',
    type: 'house-small',
    name: 'Small House',
    description: 'Small fixed residential home (25ft x 30ft)',
    category: 'structures',
    size: 'small',
    defaultDimensions: { width: 12, height: 6, depth: 14.4 },
    color: '#8B4513',
    snapToGrid: true,
    allowRotation: true,
  },
  {
    id: 'house-medium',
    type: 'house-medium',
    name: 'Medium House',
    description: 'Medium fixed residential home (35ft x 40ft)',
    category: 'structures',
    size: 'medium',
    defaultDimensions: { width: 16.7, height: 7, depth: 19.1 },
    color: '#A0522D',
    snapToGrid: true,
    allowRotation: true,
  },
  {
    id: 'house-large',
    type: 'house-large',
    name: 'Large House',
    description: 'Large fixed residential home (50ft x 60ft)',
    category: 'structures',
    size: 'large',
    defaultDimensions: { width: 23.9, height: 9, depth: 28.7 },
    color: '#8B7355',
    snapToGrid: true,
    allowRotation: true,
  },

  // Landscaping - Trees
  {
    id: 'tree-pine',
    type: 'tree',
    name: 'Pine Tree',
    description: 'Evergreen pine tree (10ft canopy, 30ft tall)',
    category: 'landscaping',
    defaultDimensions: { width: 4.8, height: 14.4, depth: 4.8 },
    color: '#228B22',
    snapToGrid: false,
    allowRotation: false,
  },
  {
    id: 'tree-oak',
    type: 'tree',
    name: 'Oak Tree',
    description: 'Deciduous oak tree (15ft canopy, 40ft tall)',
    category: 'landscaping',
    defaultDimensions: { width: 7.2, height: 19.1, depth: 7.2 },
    color: '#2E8B57',
    snapToGrid: false,
    allowRotation: false,
  },

  // Infrastructure - Fencing (6ft tall, 10ft sections)
  {
    id: 'fence-wood',
    type: 'fence',
    name: 'Wood Fence',
    description: 'Wooden fence section (10ft long, 6ft tall)',
    category: 'infrastructure',
    defaultDimensions: { width: 4.8, height: 2.9, depth: 0.2 },
    color: '#8B6914',
    snapToGrid: true,
    allowRotation: true,
  },
  {
    id: 'fence-chain',
    type: 'fence',
    name: 'Chain Link Fence',
    description: 'Chain link fence section (10ft long, 6ft tall)',
    category: 'infrastructure',
    defaultDimensions: { width: 4.8, height: 2.9, depth: 0.2 },
    color: '#A9A9A9',
    snapToGrid: true,
    allowRotation: true,
  },

  // Infrastructure - Culvert (4ft diameter, 20ft long)
  {
    id: 'culvert-standard',
    type: 'culvert',
    name: 'Culvert',
    description: 'Stream culvert for water passage (4ft dia x 20ft)',
    category: 'infrastructure',
    defaultDimensions: { width: 9.6, height: 1.9, depth: 1.9 },
    color: '#696969',
    snapToGrid: true,
    allowRotation: true,
  },

  // Infrastructure - Driveway (12ft wide, 20ft section)
  {
    id: 'driveway-straight',
    type: 'driveway',
    name: 'Driveway Section',
    description: 'Straight driveway section (12ft x 20ft)',
    category: 'infrastructure',
    defaultDimensions: { width: 5.7, height: 0.2, depth: 9.6 },
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
