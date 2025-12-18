import { useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Environment } from '@react-three/drei';
import { Terrain } from './Terrain';
import { DraggableItem } from './DraggableItem';
import { useLandStore } from '../../store/useLandStore';

// Easing function for smooth transitions
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Camera controller component with smooth transitions
const CameraController = () => {
  const { camera } = useThree();
  const cameraAngle = useLandStore((state) => state.cameraAngle);
  const setCameraAngle = useLandStore((state) => state.setCameraAngle);

  const [targetAngle, setTargetAngle] = useState<number>(cameraAngle);
  const [currentAngle, setCurrentAngle] = useState<number>(cameraAngle);
  const transitionRef = useRef({ startAngle: cameraAngle as number, progress: 1 });

  useEffect(() => {
    setTargetAngle(cameraAngle);
    transitionRef.current = {
      startAngle: currentAngle,
      progress: 0,
    };
  }, [cameraAngle]);

  useFrame((_, delta) => {
    if (transitionRef.current.progress < 1) {
      // Smooth transition
      transitionRef.current.progress += delta * 2; // 2 = speed
      if (transitionRef.current.progress > 1) transitionRef.current.progress = 1;

      const eased = easeInOutCubic(transitionRef.current.progress);
      const newAngle =
        transitionRef.current.startAngle +
        (targetAngle - transitionRef.current.startAngle) * eased;

      setCurrentAngle(newAngle);

      // Calculate camera position based on angle
      const distance = 60;
      const angleRad = (newAngle * Math.PI) / 180;

      const y = distance * Math.sin(angleRad);
      const horizontalDistance = distance * Math.cos(angleRad);

      camera.position.set(
        horizontalDistance * Math.cos(Math.PI / 4),
        y,
        horizontalDistance * Math.sin(Math.PI / 4)
      );
      camera.lookAt(0, 0, 0);
    }
  });

  // Handle mouse wheel for camera angle
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const delta = event.deltaY > 0 ? 1 : -1;
      const angles: (10 | 30 | 45)[] = [10, 30, 45];
      const currentIndex = angles.indexOf(cameraAngle as 10 | 30 | 45);

      let newIndex = currentIndex + delta;
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= angles.length) newIndex = angles.length - 1;

      if (newIndex !== currentIndex) {
        setCameraAngle(angles[newIndex]);
      }
    };

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [cameraAngle, setCameraAngle]);

  return null;
};

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
  const isDraggingItem = useLandStore((state) => state.isDraggingItem);

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

        {/* Camera controls - disabled during item dragging */}
        <OrbitControls
          enabled={!isDraggingItem}
          enablePan={true}
          enableZoom={false}
          enableRotate={true}
          minDistance={20}
          maxDistance={120}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
};
