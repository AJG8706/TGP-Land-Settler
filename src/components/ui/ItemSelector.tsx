import { useState } from 'react';
import { useLandStore } from '../../store/useLandStore';
import { getItemsByCategory, getItemDefinition } from '../../data/items';
import { generateId } from '../../utils/helpers';
import type { ItemType, ItemSize } from '../../types';
import './ItemSelector.css';

export const ItemSelector = () => {
  const [activeCategory, setActiveCategory] = useState<string>('structures');
  const [selectedSize, setSelectedSize] = useState<ItemSize | null>(null);

  const selectedItemType = useLandStore((state) => state.selectedItemType);
  const setSelectedItemType = useLandStore((state) => state.setSelectedItemType);
  const setSelectedSizeStore = useLandStore((state) => state.setSelectedSize);
  const isPlacementMode = useLandStore((state) => state.isPlacementMode);

  const categories = ['structures', 'landscaping', 'infrastructure'];

  const addPlacedItem = useLandStore((state) => state.addPlacedItem);
  const setSelectedItemId = useLandStore((state) => state.setSelectedItemId);

  const handleItemSelect = (type: ItemType) => {
    const definition = getItemDefinition(type);
    if (!definition) return;

    // Create new item at center of map
    const newItem = {
      id: generateId(),
      type: type,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      size: selectedSize || undefined,
      color: definition.color,
    };

    addPlacedItem(newItem);
    setSelectedItemId(newItem.id);
    setSelectedItemType(null);
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
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Size selector for houses */}
      {activeCategory === 'structures' && (
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
        <h3>How to Use:</h3>
        <ul>
          <li>Click item to place at center</li>
          <li>Drag arrows to move</li>
          <li>Click item to select/deselect</li>
          <li>Double-click to delete</li>
          <li>Use camera angles in toolbar</li>
        </ul>
      </div>
    </div>
  );
};
