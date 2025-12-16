import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Environment } from '@react-three/drei';
import { Terrain } from './Terrain';
import { DraggableItem } from './DraggableItem';
import { useLandStore } from '../../store/useLandStore';

// Camera controller component
const CameraController = () => {
  const { camera } = useThree();
  const cameraAngle = useLandStore((state) => state.cameraAngle);

  useEffect(() => {
    // Calculate camera position based on angle
    const distance = 60;
    const angleRad = (cameraAngle * Math.PI) / 180;

    const y = distance * Math.sin(angleRad);
    const horizontalDistance = distance * Math.cos(angleRad);

    camera.position.set(
      horizontalDistance * Math.cos(Math.PI / 4),
      y,
      horizontalDistance * Math.sin(Math.PI / 4)
    );
    camera.lookAt(0, 0, 0);
  }, [cameraAngle, camera]);

  return null;
};

// Ground click handler
const GroundClickHandler = () => {
  const { scene, raycaster, camera, mouse } = useThree();
  const setSelectedItemId = useLandStore((state) => state.setSelectedItemId);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const canvas = event.target as HTMLCanvasElement;
      if (canvas.tagName !== 'CANVAS') return;

      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const terrain = scene.getObjectByName('terrain');
      if (!terrain) return;

      const intersects = raycaster.intersectObject(terrain, false);
      if (intersects.length > 0) {
        // Clicked on terrain, deselect
        setSelectedItemId(null);
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [scene, raycaster, camera, mouse, setSelectedItemId]);

  return null;
};

export const Scene = () => {
  const placedItems = useLandStore((state) => state.placedItems);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas
        shadows
        camera={{
          position: [42, 30, 42],
          fov: 50,
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
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
          <DraggableItem key={item.id} item={item} />
        ))}

        {/* Camera controller */}
        <CameraController />

        {/* Ground click handler */}
        <GroundClickHandler />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={20}
          maxDistance={120}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
};
