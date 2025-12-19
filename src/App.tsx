import { useEffect } from 'react';
import { Scene } from './components/canvas/Scene';
import { ItemSelector } from './components/ui/ItemSelector';
import { Toolbar } from './components/ui/Toolbar';
import { AdminPortal } from './components/ui/AdminPortal';
import './App.css';

function App() {
  // Disable browser context menu globally to allow right-click rotation
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>🏡 TGP Land Settler</h1>
        <p>Design and customize your dream property</p>
      </header>

      {/* 3D Scene */}
      <Scene />

      {/* UI Overlays */}
      <ItemSelector />
      <Toolbar />
      <AdminPortal />
    </div>
  );
}

export default App;
