import { useState } from 'react';
import { useLandStore } from '../../store/useLandStore';
import { getItemsByCategory, getItemDefinition, getAllCategories } from '../../data/items';
import { generateId } from '../../utils/helpers';
import { getHeightAtPosition } from '../../utils/noise';
import type { ItemType, ItemSize } from '../../types';
import './ItemSelector.css';

export const ItemSelector = () => {
  const [activeCategory, setActiveCategory] = useState<string>('housing');
  const [selectedSize, setSelectedSize] = useState<ItemSize | null>(null);

  const selectedItemType = useLandStore((state) => state.selectedItemType);
  const setSelectedItemType = useLandStore((state) => state.setSelectedItemType);
  const setSelectedSizeStore = useLandStore((state) => state.setSelectedSize);
  const isPlacementMode = useLandStore((state) => state.isPlacementMode);
  const terrainHeightMap = useLandStore((state) => state.terrainHeightMap);

  // Get all available categories from items
  const categories = getAllCategories();

  const addPlacedItem = useLandStore((state) => state.addPlacedItem);
  const setSelectedItemId = useLandStore((state) => state.setSelectedItemId);

  const handleItemSelect = (type: ItemType) => {
    const definition = getItemDefinition(type);
    if (!definition) return;

    // Check if this item should use placement mode (line drawing or tree groups)
    const isLineDrawable =
      definition.type === 'fence' ||
      definition.type === 'driveway' ||
      definition.type === 'road' ||
      definition.type === 'creek' ||
      definition.type.includes('stream');

    const isTreeGroup =
      definition.type === 'tree' ||
      definition.category === 'trees';

    // For line-drawable items and tree groups, enter placement mode
    if (isLineDrawable || isTreeGroup) {
      setSelectedItemType(type);
      return;
    }

    // For regular items, place immediately at center
    // Get terrain height at center of map
    let terrainHeight = 0;
    if (terrainHeightMap) {
      terrainHeight = getHeightAtPosition(
        terrainHeightMap,
        0, // x: center
        0, // z: center
        100, // terrainWidth
        100, // terrainDepth
        10   // maxHeight
      );
    }

    // Add small offset to prevent z-fighting with terrain
    const heightWithOffset = terrainHeight + 0.05;

    // Create new item at center of map with correct vertical position
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
  };

  const handleSizeSelect = (size: ItemSize) => {
    setSelectedSize(size);
    setSelectedSizeStore(size);
  };

  const items = getItemsByCategory(activeCategory);

  return (
    <div className="item-selector">
      <div className="selector-header">
        <h2>Items</h2>
        {isPlacementMode && (
          <button
            className="cancel-btn"
            onClick={() => setSelectedItemType(null)}
          >
            Cancel (ESC)
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="category-tabs">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      {/* Size selector for houses */}
      {activeCategory === 'housing' && (
        <div className="size-selector">
          <label>Size:</label>
          <div className="size-buttons">
            {(['small', 'medium', 'large'] as ItemSize[]).map((size) => (
              <button
                key={size}
                className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                onClick={() => handleSizeSelect(size)}
              >
                {size}
              </button>
            ))}
            <button
              className={`size-btn ${selectedSize === null ? 'active' : ''}`}
              onClick={() => {
                setSelectedSize(null);
                setSelectedSizeStore(null);
              }}
            >
              All
            </button>
          </div>
        </div>
      )}

      {/* Item list */}
      <div className="item-list">
        {items
          .filter((item) => !selectedSize || item.size === selectedSize || !item.size)
          .map((item) => (
            <button
              key={item.id}
              className={`item-card ${selectedItemType === item.type ? 'selected' : ''}`}
              onClick={() => handleItemSelect(item.type)}
            >
              <div
                className="item-preview"
                style={{ backgroundColor: item.color }}
              />
              <div className="item-info">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
            </button>
          ))}
      </div>

      {/* Instructions */}
      <div className="instructions">
        <h3>Placement:</h3>
        <ul>
          <li>Trees: Click to place group of 4-5</li>
          <li>Lines: Click & drag to draw path</li>
          <li>Others: Click to place at center</li>
          <li>Right-click & drag to rotate</li>
          <li>Double-click item to delete</li>
        </ul>
        <h3 style={{marginTop: '12px'}}>Camera:</h3>
        <ul>
          <li>Q/E: Rotate left/right</li>
          <li>R/F: Tilt up/down</li>
          <li>WASD or edges: Pan</li>
          <li>Middle-click drag: Pan</li>
          <li>Scroll: Zoom</li>
        </ul>
      </div>
    </div>
  );
};
