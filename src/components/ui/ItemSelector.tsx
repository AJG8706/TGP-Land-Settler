import { useState } from 'react';
import { useLandStore } from '../../store/useLandStore';
import { getItemsByCategory, getItemDefinition, getAllCategories } from '../../data/items';
import { generateId } from '../../utils/helpers';
import { getHeightAtPosition } from '../../utils/noise';
import type { ItemType, ItemSize } from '../../types';
import './ItemSelector.css';

// Category icon mapper
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'housing': '🏠',
    'infrastructure': '🛣️',
    'utilities': '⚡',
    'water-features': '💧',
    'storage': '📦',
    'outdoor-structures': '🏗️',
    'gardening': '🌱',
    'trees': '🌲',
    'livestock': '🐄',
    'workshops': '🔨',
    'equipment': '🚜',
    'food-processing': '🥫',
    'amenities': '🎯',
  };
  return icons[category] || '📍';
};

// Item icon mapper based on type
const getItemIcon = (type: string): string => {
  // Housing
  if (type.includes('rv')) return '🚐';
  if (type.includes('mobile-home') || type.includes('tiny-home')) return '🏠';
  if (type.includes('house')) return '🏡';
  if (type.includes('cabin')) return '🏘️';
  if (type.includes('farmhouse')) return '🏚️';
  if (type.includes('tent')) return '⛺';
  if (type.includes('shelter')) return '🛖';

  // Infrastructure
  if (type.includes('road')) return '🛣️';
  if (type.includes('driveway')) return '🚗';
  if (type.includes('fence')) return '🚧';
  if (type.includes('gate')) return '🚪';
  if (type.includes('culvert')) return '🌉';

  // Utilities
  if (type.includes('well')) return '🚰';
  if (type.includes('water-tank')) return '🗄️';
  if (type.includes('septic')) return '🚽';
  if (type.includes('solar')) return '☀️';
  if (type.includes('wind')) return '💨';
  if (type.includes('generator')) return '⚙️';
  if (type.includes('propane')) return '🔥';
  if (type.includes('battery')) return '🔋';

  // Water features
  if (type.includes('pond')) return '💧';
  if (type.includes('creek') || type.includes('stream')) return '🌊';
  if (type.includes('rainwater')) return '🌧️';

  // Trees & Plants
  if (type.includes('tree')) return '🌳';
  if (type.includes('windbreak')) return '🌲';
  if (type.includes('hedgerow')) return '🌿';
  if (type.includes('bamboo')) return '🎍';

  // Gardening
  if (type.includes('garden')) return '🌱';
  if (type.includes('greenhouse')) return '🏡';
  if (type.includes('compost')) return '♻️';
  if (type.includes('berry')) return '🍓';
  if (type.includes('orchard')) return '🍎';
  if (type.includes('crop')) return '🌾';

  // Livestock
  if (type.includes('chicken')) return '🐔';
  if (type.includes('duck')) return '🦆';
  if (type.includes('turkey')) return '🦃';
  if (type.includes('rabbit')) return '🐰';
  if (type.includes('goat')) return '🐐';
  if (type.includes('sheep')) return '🐑';
  if (type.includes('cow')) return '🐄';
  if (type.includes('pig')) return '🐷';
  if (type.includes('horse')) return '🐴';
  if (type.includes('bee')) return '🐝';
  if (type.includes('fish')) return '🐟';

  // Workshops & Buildings
  if (type.includes('barn')) return '🏚️';
  if (type.includes('shed')) return '🏗️';
  if (type.includes('forge')) return '⚒️';
  if (type.includes('sawmill')) return '🪚';
  if (type.includes('smokehouse')) return '🥓';

  // Equipment
  if (type.includes('tractor')) return '🚜';
  if (type.includes('trailer')) return '🚛';
  if (type.includes('firewood')) return '🪵';
  if (type.includes('hay')) return '🌾';

  // Amenities
  if (type.includes('fire')) return '🔥';
  if (type.includes('picnic')) return '🧺';
  if (type.includes('mailbox')) return '📬';

  return '📦';
};

export const ItemSelector = () => {
  const [activeCategory, setActiveCategory] = useState<string>('housing');
  const [selectedSize, setSelectedSize] = useState<ItemSize | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedItemType = useLandStore((state) => state.selectedItemType);
  const setSelectedItemType = useLandStore((state) => state.setSelectedItemType);
  const setSelectedSizeStore = useLandStore((state) => state.setSelectedSize);
  const isPlacementMode = useLandStore((state) => state.isPlacementMode);
  const terrainHeightMap = useLandStore((state) => state.terrainHeightMap);

  const categories = getAllCategories();
  const addPlacedItem = useLandStore((state) => state.addPlacedItem);
  const setSelectedItemId = useLandStore((state) => state.setSelectedItemId);
  const adjustItemElevationToCorners = useLandStore((state) => state.adjustItemElevationToCorners);

  const handleItemSelect = (type: ItemType) => {
    const definition = getItemDefinition(type);
    if (!definition) return;

    const isLineDrawable =
      definition.type === 'fence' ||
      definition.type === 'driveway' ||
      definition.type === 'road' ||
      definition.type === 'creek' ||
      definition.type.includes('stream');

    const isTreeGroup =
      definition.type === 'tree' ||
      definition.category === 'trees';

    if (isLineDrawable || isTreeGroup) {
      setSelectedItemType(type);
      return;
    }

    let terrainHeight = 0;
    if (terrainHeightMap) {
      terrainHeight = getHeightAtPosition(
        terrainHeightMap,
        0,
        0,
        100,
        100,
        10
      );
    }

    const isFlatItem = type.includes('road') ||
                       type.includes('driveway') ||
                       type.includes('pond');
    const heightWithOffset = terrainHeight + (isFlatItem ? 1.0 : 0.05);

    const newItem = {
      id: generateId(),
      type: type,
      position: { x: 0, y: heightWithOffset, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      size: selectedSize || undefined,
      color: definition.color,
    };

    addPlacedItem(newItem);
    setSelectedItemId(newItem.id);

    // Adjust elevation to match corner heights
    adjustItemElevationToCorners(newItem.id);
  };

  const handleSizeSelect = (size: ItemSize) => {
    setSelectedSize(size);
    setSelectedSizeStore(size);
  };

  const items = getItemsByCategory(activeCategory);

  // Filter items by search term
  const filteredItems = items.filter((item) => {
    const matchesSize = !selectedSize || item.size === selectedSize || !item.size;
    const matchesSearch = !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSize && matchesSearch;
  });

  return (
    <div className="item-selector">
      <div className="selector-header">
        <h2>🏗️ Build Menu</h2>
        {isPlacementMode && (
          <button
            className="cancel-btn"
            onClick={() => setSelectedItemType(null)}
          >
            ✕ Cancel
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Category grid */}
      <div className="category-grid">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-card ${activeCategory === category ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(category);
              setSearchTerm('');
            }}
          >
            <div className="category-icon">{getCategoryIcon(category)}</div>
            <div className="category-name">
              {category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')}
            </div>
          </button>
        ))}
      </div>

      {/* Size selector for housing */}
      {activeCategory === 'housing' && (
        <div className="size-selector">
          <div className="size-buttons">
            {(['small', 'medium', 'large'] as ItemSize[]).map((size) => (
              <button
                key={size}
                className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                onClick={() => handleSizeSelect(size)}
              >
                {size === 'small' && '🏠'}
                {size === 'medium' && '🏡'}
                {size === 'large' && '🏰'}
                <span>{size}</span>
              </button>
            ))}
            <button
              className={`size-btn ${selectedSize === null ? 'active' : ''}`}
              onClick={() => {
                setSelectedSize(null);
                setSelectedSizeStore(null);
              }}
            >
              <span>All</span>
            </button>
          </div>
        </div>
      )}

      {/* Item grid */}
      <div className="item-grid">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            className={`item-tile ${selectedItemType === item.type ? 'selected' : ''}`}
            onClick={() => handleItemSelect(item.type)}
            title={item.description}
          >
            <div className="item-icon-wrapper">
              <div className="item-icon">{getItemIcon(item.type)}</div>
              <div
                className="item-color-indicator"
                style={{ backgroundColor: item.color }}
              />
            </div>
            <div className="item-name">{item.name}</div>
          </button>
        ))}
      </div>

      {/* Instructions */}
      <div className="instructions">
        <div className="instruction-section">
          <strong>🎮 Controls</strong>
          <div className="instruction-grid">
            <span>🖱️ Left-click</span><span>Place/Select</span>
            <span>🖱️ Right-click</span><span>Rotate</span>
            <span>⌨️ WASD</span><span>Pan camera</span>
            <span>🖱️ Scroll</span><span>Zoom</span>
            <span>⌨️ Q/E</span><span>Rotate view</span>
            <span>⌨️ R/F</span><span>Tilt camera</span>
          </div>
        </div>
      </div>
    </div>
  );
};
