import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment } from '@react-three/drei';
import { Terrain } from './Terrain';
import { PlaceableItem } from './PlaceableItem';
import { PlacementPreview } from './PlacementPreview';
import { useLandStore } from '../../store/useLandStore';

export const Scene = () => {
  const placedItems = useLandStore((state) => state.placedItems);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas
        shadows
        camera={{
          position: [30, 30, 30],
          fov: 50,
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Sky and environment */}
        <Sky
          distance={450000}
          sunPosition={[10, 20, 10]}
          inclination={0.6}
          azimuth={0.25}
        />
        <Environment preset="sunset" />

        {/* Terrain */}
        <Terrain />

        {/* Placed items */}
        {placedItems.map((item) => (
          <PlaceableItem key={item.id} item={item} />
        ))}

        {/* Placement preview */}
        <PlacementPreview />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
};
