import { useState, useRef, useEffect } from 'react';
import { useLandStore } from '../../store/useLandStore';
import './AdminPortal.css';

interface LotPreset {
  id: string;
  name: string;
  terrain: {
    seed?: number;
    scale: number;
    octaves: number;
    persistence: number;
    lacunarity: number;
  };
  createdAt: Date;
}

export const AdminPortal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [presets, setPresets] = useState<LotPreset[]>([]);
  const [currentPreset, setCurrentPreset] = useState<LotPreset | null>(null);
  const [presetName, setPresetName] = useState('');
  const [showNewPresetForm, setShowNewPresetForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Terrain generation parameters
  const [terrainParams, setTerrainParams] = useState({
    scale: 10,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2,
    seed: Math.floor(Math.random() * 10000),
  });

  const generateTerrain = useLandStore((state) => state.generateTerrain);
  const exportLayout = useLandStore((state) => state.exportLayout);

  // Load saved presets from localStorage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('lotPresets');
    if (savedPresets) {
      try {
        const parsed = JSON.parse(savedPresets);
        setPresets(parsed);
      } catch (error) {
        console.error('Failed to load presets:', error);
      }
    }
  }, []);

  const handleGenerateTerrain = () => {
    generateTerrain(
      terrainParams.seed,
      terrainParams.scale,
      terrainParams.octaves,
      terrainParams.persistence,
      terrainParams.lacunarity
    );
  };

  const handleRandomSeed = () => {
    const newSeed = Math.floor(Math.random() * 10000);
    setTerrainParams({ ...terrainParams, seed: newSeed });
    generateTerrain(
      newSeed,
      terrainParams.scale,
      terrainParams.octaves,
      terrainParams.persistence,
      terrainParams.lacunarity
    );
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    const newPreset: LotPreset = {
      id: crypto.randomUUID(),
      name: presetName,
      terrain: terrainParams,
      createdAt: new Date(),
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);

    // Save to localStorage
    localStorage.setItem('lotPresets', JSON.stringify(updatedPresets));

    setPresetName('');
    setShowNewPresetForm(false);
    alert(`Preset "${newPreset.name}" saved successfully!`);
  };

  const handleLoadPreset = (preset: LotPreset) => {
    setTerrainParams({
      ...preset.terrain,
      seed: preset.terrain.seed ?? Math.floor(Math.random() * 10000),
    });
    generateTerrain(
      preset.terrain.seed,
      preset.terrain.scale,
      preset.terrain.octaves,
      preset.terrain.persistence,
      preset.terrain.lacunarity
    );
    setCurrentPreset(preset);
  };

  const handleDeletePreset = (id: string) => {
    if (window.confirm('Delete this preset?')) {
      const updatedPresets = presets.filter((p) => p.id !== id);
      setPresets(updatedPresets);
      localStorage.setItem('lotPresets', JSON.stringify(updatedPresets));

      if (currentPreset?.id === id) {
        setCurrentPreset(null);
      }
    }
  };

  const handleExportPreset = (preset: LotPreset) => {
    const data = JSON.stringify(preset, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lot-preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPreset = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const preset = JSON.parse(e.target?.result as string) as LotPreset;
          const updatedPresets = [...presets, { ...preset, id: crypto.randomUUID() }];
          setPresets(updatedPresets);
          localStorage.setItem('lotPresets', JSON.stringify(updatedPresets));
          alert('Preset imported successfully!');
        } catch (error) {
          alert('Failed to import preset. Invalid file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportFullLayout = () => {
    const data = exportLayout();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`admin-portal ${isOpen ? 'open' : ''}`}>
      <button
        className="admin-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Admin Portal"
      >
        {isOpen ? '✖' : '⚙️ Admin'}
      </button>

      {isOpen && (
        <div className="admin-content">
          <h2>Admin Portal</h2>

          {/* Terrain Controls */}
          <div className="admin-section">
            <h3>Terrain Generation</h3>

            <div className="param-control">
              <label>
                Seed:
                <input
                  type="number"
                  value={terrainParams.seed}
                  onChange={(e) =>
                    setTerrainParams({ ...terrainParams, seed: parseInt(e.target.value) || 0 })
                  }
                />
              </label>
              <button onClick={handleRandomSeed} className="btn-small">
                Random
              </button>
            </div>

            <div className="param-control">
              <label>
                Scale: {terrainParams.scale}
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={terrainParams.scale}
                  onChange={(e) =>
                    setTerrainParams({ ...terrainParams, scale: parseInt(e.target.value) })
                  }
                />
              </label>
            </div>

            <div className="param-control">
              <label>
                Octaves: {terrainParams.octaves}
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={terrainParams.octaves}
                  onChange={(e) =>
                    setTerrainParams({ ...terrainParams, octaves: parseInt(e.target.value) })
                  }
                />
              </label>
            </div>

            <div className="param-control">
              <label>
                Persistence: {terrainParams.persistence.toFixed(2)}
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={terrainParams.persistence}
                  onChange={(e) =>
                    setTerrainParams({ ...terrainParams, persistence: parseFloat(e.target.value) })
                  }
                />
              </label>
            </div>

            <div className="param-control">
              <label>
                Lacunarity: {terrainParams.lacunarity.toFixed(1)}
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.1"
                  value={terrainParams.lacunarity}
                  onChange={(e) =>
                    setTerrainParams({ ...terrainParams, lacunarity: parseFloat(e.target.value) })
                  }
                />
              </label>
            </div>

            <button onClick={handleGenerateTerrain} className="btn-primary">
              Regenerate Terrain
            </button>
          </div>

          {/* Lot Presets */}
          <div className="admin-section">
            <h3>Lot Presets</h3>

            <div className="preset-actions">
              <button
                onClick={() => setShowNewPresetForm(!showNewPresetForm)}
                className="btn-primary"
              >
                {showNewPresetForm ? 'Cancel' : '+ New Preset'}
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
                Import Preset
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportPreset}
              />
            </div>

            {showNewPresetForm && (
              <div className="new-preset-form">
                <input
                  type="text"
                  placeholder="Preset name..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
                <button onClick={handleSavePreset} className="btn-primary">
                  Save Current Settings
                </button>
              </div>
            )}

            <div className="preset-list">
              {presets.length === 0 ? (
                <p className="empty-state">No presets saved yet</p>
              ) : (
                presets.map((preset) => (
                  <div
                    key={preset.id}
                    className={`preset-item ${currentPreset?.id === preset.id ? 'active' : ''}`}
                  >
                    <div className="preset-info">
                      <strong>{preset.name}</strong>
                      <small>Seed: {preset.terrain.seed}</small>
                    </div>
                    <div className="preset-actions-inline">
                      <button
                        onClick={() => handleLoadPreset(preset)}
                        className="btn-small"
                        title="Load preset"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleExportPreset(preset)}
                        className="btn-small"
                        title="Export preset"
                      >
                        Export
                      </button>
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        className="btn-small btn-danger"
                        title="Delete preset"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Full Layout Management */}
          <div className="admin-section">
            <h3>Full Layout</h3>
            <div className="layout-actions">
              <button onClick={handleExportFullLayout} className="btn-secondary">
                Export Full Layout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
