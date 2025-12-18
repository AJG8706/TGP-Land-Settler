import { useRef, useState, useEffect } from 'react';
import { Mesh, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useLandStore } from '../../store/useLandStore';
import { getItemDefinition } from '../../data/items';
import { snapToGrid, generateId } from '../../utils/helpers';
import { getHeightAtPosition } from '../../utils/noise';
import type { PlacedItem } from '../../types';

export const PlacementPreview = () => {
  const meshRef = useRef<Mesh>(null);
  const [position, setPosition] = useState<Vector3>(new Vector3(0, 0, 0));
  const [isValid, setIsValid] = useState(true);
  const [rotation, setRotation] = useState(0);

  const { camera, raycaster } = useThree();
  const selectedItemType = useLandStore((state) => state.selectedItemType);
  const selectedSize = useLandStore((state) => state.selectedSize);
  const isPlacementMode = useLandStore((state) => state.isPlacementMode);
  const snapEnabled = useLandStore((state) => state.snapToGrid);
  const addPlacedItem = useLandStore((state) => state.addPlacedItem);
  const setPlacementMode = useLandStore((state) => state.setPlacementMode);
  const terrainHeightMap = useLandStore((state) => state.terrainHeightMap);

  const definition = selectedItemType ? getItemDefinition(selectedItemType) : null;

  // Handle mouse movement to update preview position
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isPlacementMode || !definition) return;

      // Calculate mouse position in normalized device coordinates
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update raycaster
      raycaster.setFromCamera(new Vector2(x, y), camera);

      // Check intersection with ground plane
      const intersects = raycaster.intersectObjects(
        Array.from(document.querySelectorAll('mesh')).map((el: any) => el)
      );

      if (intersects.length > 0) {
        const point = intersects[0].point;

        // Get terrain height at this position
        let terrainHeight = 0;
        if (terrainHeightMap) {
          terrainHeight = getHeightAtPosition(
            terrainHeightMap,
            point.x,
            point.z,
            100, // terrainWidth
            100, // terrainDepth
            10   // maxHeight
          );
        }

        const newPos = snapEnabled
          ? snapToGrid({ x: point.x, y: terrainHeight, z: point.z })
          : { x: point.x, y: terrainHeight, z: point.z };

        setPosition(new Vector3(newPos.x, newPos.y, newPos.z));
        setIsValid(true);
      }
    };

    const handleClick = () => {
      if (!isPlacementMode || !definition || !isValid) return;

      // Create new placed item
      const newItem: PlacedItem = {
        id: generateId(),
        type: selectedItemType!,
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: 0, y: rotation, z: 0 },
        size: selectedSize || undefined,
        color: definition.color,
      };

      addPlacedItem(newItem);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isPlacementMode) return;

      switch (event.key) {
        case 'r':
        case 'R':
          // Rotate 90 degrees
          setRotation((prev) => prev + Math.PI / 2);
          break;
        case 'Escape':
          // Cancel placement
          setPlacementMode(false);
          break;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isPlacementMode,
    definition,
    isValid,
    position,
    rotation,
    snapEnabled,
    selectedItemType,
    selectedSize,
    camera,
    raycaster,
    addPlacedItem,
    setPlacementMode,
    terrainHeightMap,
  ]);

  if (!isPlacementMode || !definition) return null;

  const { width, height, depth } = definition.defaultDimensions;

  return (
    <group
      ref={meshRef}
      position={[position.x, height / 2, position.z]}
      rotation={[0, rotation, 0]}
    >
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={isValid ? definition.color : '#FF0000'}
          opacity={0.5}
          transparent
        />
      </mesh>

      {/* Outline */}
      <mesh>
        <boxGeometry args={[width + 0.1, height + 0.1, depth + 0.1]} />
        <meshBasicMaterial color="#FFFFFF" wireframe />
      </mesh>
    </group>
  );
};
