import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Sky, Environment } from '@react-three/drei';
import { Terrain } from './Terrain';
import { DraggableItem } from './DraggableItem';
import { PlacementPreview } from './PlacementPreview';
import { RTSCameraController } from './RTSCameraController';
import { useLandStore } from '../../store/useLandStore';

// Ground click handler
const GroundClickHandler = () => {
  const { scene, raycaster, camera, mouse } = useThree();
  const setSelectedItemId = useLandStore((state) => state.setSelectedItemId);
  const placedItems = useLandStore((state) => state.placedItems);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const canvas = event.target as HTMLCanvasElement;
      if (canvas.tagName !== 'CANVAS') return;

      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check if we clicked on any item
      const allIntersects = raycaster.intersectObjects(scene.children, true);
      const clickedItem = allIntersects.find((intersect) => {
        // Check if the intersected object or its parent is an item (not terrain)
        let obj = intersect.object;
        while (obj) {
          if (obj.name && obj.name !== 'terrain') return true;
          obj = obj.parent as any;
        }
        return false;
      });

      // Only deselect if we clicked terrain and not an item
      if (!clickedItem) {
        const terrain = scene.getObjectByName('terrain');
        if (terrain) {
          const terrainIntersects = raycaster.intersectObject(terrain, false);
          if (terrainIntersects.length > 0) {
            setSelectedItemId(null);
          }
        }
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [scene, raycaster, camera, mouse, setSelectedItemId, placedItems]);

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

        {/* Placement preview for new items */}
        <PlacementPreview />

        {/* RTS Camera Controller */}
        <RTSCameraController />

        {/* Ground click handler */}
        <GroundClickHandler />
      </Canvas>
    </div>
  );
};
