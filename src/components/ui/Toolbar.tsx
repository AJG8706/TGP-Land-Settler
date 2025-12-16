import { useState, useRef } from 'react';
import { useLandStore } from '../../store/useLandStore';
import './Toolbar.css';

export const Toolbar = () => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gridVisible = useLandStore((state) => state.gridVisible);
  const snapToGrid = useLandStore((state) => state.snapToGrid);
  const placedItems = useLandStore((state) => state.placedItems);
  const selectedItemId = useLandStore((state) => state.selectedItemId);
  const cameraAngle = useLandStore((state) => state.cameraAngle);

  const toggleGrid = useLandStore((state) => state.toggleGrid);
  const toggleSnapToGrid = useLandStore((state) => state.toggleSnapToGrid);
  const setCameraAngle = useLandStore((state) => state.setCameraAngle);
  const updatePlacedItem = useLandStore((state) => state.updatePlacedItem);
  const saveLayout = useLandStore((state) => state.saveLayout);
  const exportLayout = useLandStore((state) => state.exportLayout);
  const importLayout = useLandStore((state) => state.importLayout);
  const clearPlacedItems = useLandStore((state) => state.clearPlacedItems);

  const handleRotate = () => {
    if (!selectedItemId) return;
    const item = placedItems.find((i) => i.id === selectedItemId);
    if (!item) return;

    updatePlacedItem(selectedItemId, {
      rotation: {
        ...item.rotation,
        y: item.rotation.y + Math.PI / 2,
      },
    });
  };

  const handleSave = () => {
    if (layoutName.trim()) {
      saveLayout(layoutName);
      setShowSaveModal(false);
      setLayoutName('');
      alert('Layout saved successfully!');
    }
  };

  const handleExport = () => {
    const data = exportLayout();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `land-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        importLayout(content);
        alert('Layout imported successfully!');
      };
      reader.readAsText(file);
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all placed items? This cannot be undone.')) {
      clearPlacedItems();
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-section">
          <h3>Camera Angle</h3>
          <button
            className={`toolbar-btn ${cameraAngle === 10 ? 'active' : ''}`}
            onClick={() => setCameraAngle(10)}
            title="Low angle view (10°)"
          >
            📷 10°
          </button>
          <button
            className={`toolbar-btn ${cameraAngle === 30 ? 'active' : ''}`}
            onClick={() => setCameraAngle(30)}
            title="Medium angle view (30°)"
          >
            📷 30°
          </button>
          <button
            className={`toolbar-btn ${cameraAngle === 45 ? 'active' : ''}`}
            onClick={() => setCameraAngle(45)}
            title="High angle view (45°)"
          >
            📷 45°
          </button>
        </div>

        <div className="toolbar-section">
          <h3>View</h3>
          <button
            className={`toolbar-btn ${gridVisible ? 'active' : ''}`}
            onClick={toggleGrid}
            title="Toggle grid visibility"
          >
            📐 Grid: {gridVisible ? 'ON' : 'OFF'}
          </button>
          <button
            className={`toolbar-btn ${snapToGrid ? 'active' : ''}`}
            onClick={toggleSnapToGrid}
            title="Toggle snap to grid"
          >
            🧲 Snap: {snapToGrid ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="toolbar-section">
          <h3>Item Control</h3>
          <button
            className="toolbar-btn"
            onClick={handleRotate}
            disabled={!selectedItemId}
            title="Rotate selected item 90°"
          >
            🔄 Rotate
          </button>
        </div>

        <div className="toolbar-section">
          <h3>Layout</h3>
          <button
            className="toolbar-btn"
            onClick={() => setShowSaveModal(true)}
            disabled={placedItems.length === 0}
            title="Save current layout"
          >
            💾 Save
          </button>
          <button
            className="toolbar-btn"
            onClick={handleExport}
            disabled={placedItems.length === 0}
            title="Export layout to file"
          >
            📤 Export
          </button>
          <button
            className="toolbar-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Import layout from file"
          >
            📥 Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>

        <div className="toolbar-section">
          <h3>Actions</h3>
          <button
            className="toolbar-btn danger"
            onClick={handleClear}
            disabled={placedItems.length === 0}
            title="Clear all items"
          >
            🗑️ Clear All
          </button>
        </div>

        <div className="toolbar-section stats">
          <h3>Stats</h3>
          <div className="stat-item">
            Items Placed: <strong>{placedItems.length}</strong>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Save Layout</h2>
            <input
              type="text"
              placeholder="Enter layout name..."
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="modal-buttons">
              <button onClick={handleSave} disabled={!layoutName.trim()}>
                Save
              </button>
              <button onClick={() => setShowSaveModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
