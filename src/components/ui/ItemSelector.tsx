import { useState } from 'react';
import { useLandStore } from '../../store/useLandStore';
import { ITEM_DEFINITIONS, getItemsByCategory } from '../../data/items';
import { ItemType, ItemSize } from '../../types';
import './ItemSelector.css';

export const ItemSelector = () => {
  const [activeCategory, setActiveCategory] = useState<string>('structures');
  const [selectedSize, setSelectedSize] = useState<ItemSize | null>(null);

  const selectedItemType = useLandStore((state) => state.selectedItemType);
  const setSelectedItemType = useLandStore((state) => state.setSelectedItemType);
  const setSelectedSizeStore = useLandStore((state) => state.setSelectedSize);
  const isPlacementMode = useLandStore((state) => state.isPlacementMode);

  const categories = ['structures', 'landscaping', 'infrastructure'];

  const handleItemSelect = (type: ItemType) => {
    setSelectedItemType(type);
    setSelectedSizeStore(selectedSize);
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
        <h3>Controls:</h3>
        <ul>
          <li>Click to select an item</li>
          <li>Move mouse to position</li>
          <li>Click to place</li>
          <li>Press R to rotate</li>
          <li>Double-click item to delete</li>
          <li>ESC to cancel</li>
        </ul>
      </div>
    </div>
  );
};
