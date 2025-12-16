import { Scene } from './components/canvas/Scene';
import { ItemSelector } from './components/ui/ItemSelector';
import { Toolbar } from './components/ui/Toolbar';
import { AdminPortal } from './components/ui/AdminPortal';
import './App.css';

function App() {
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
