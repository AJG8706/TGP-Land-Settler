import { useRef, useState } from 'react';
import { Mesh, Vector3, Raycaster } from 'three';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import type { PlacedItem } from '../../types';
import { useLandStore } from '../../store/useLandStore';
import { getItemDefinition } from '../../data/items';

interface DraggableItemProps {
  item: PlacedItem;
}

export const DraggableItem = ({ item }: DraggableItemProps) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const { scene } = useThree();
  const selectedItemId = useLandStore((state) => state.selectedItemId);
  const setSelectedItemId = useLandStore((state) => state.setSelectedItemId);
  const removePlacedItem = useLandStore((state) => state.removePlacedItem);
  const updatePlacedItem = useLandStore((state) => state.updatePlacedItem);

  const isSelected = selectedItemId === item.id;

  const definition = getItemDefinition(item.type);
  if (!definition) return null;

  const { width, height, depth } = definition.defaultDimensions;
  const color = item.color || definition.color;

  // Handle click to select
  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedItemId(isSelected ? null : item.id);
  };

  // Handle double-click to delete
  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    if (window.confirm(`Delete ${definition.name}?`)) {
      removePlacedItem(item.id);
      setSelectedItemId(null);
    }
  };

  // Handle transform changes - keep item on terrain
  const handleTransform = () => {
    if (!meshRef.current) return;

    // Get world position
    const worldPos = new Vector3();
    meshRef.current.getWorldPosition(worldPos);

    // Find terrain
    const terrain = scene.getObjectByName('terrain');
    if (!terrain) return;

    // Raycast down to find terrain height
    const raycaster = new Raycaster();
    raycaster.set(
      new Vector3(worldPos.x, 100, worldPos.z),
      new Vector3(0, -1, 0)
    );

    const intersects = raycaster.intersectObject(terrain, true);
    if (intersects.length > 0) {
      const terrainY = intersects[0].point.y;

      // Update item position to be on terrain
      updatePlacedItem(item.id, {
        position: {
          x: worldPos.x,
          y: terrainY,
          z: worldPos.z,
        },
        rotation: {
          x: meshRef.current.rotation.x,
          y: meshRef.current.rotation.y,
          z: meshRef.current.rotation.z,
        },
      });
    }
  };

  // Render different shapes based on item type
  const renderGeometry = () => {
    switch (item.type) {
      case 'tree':
        return (
          <group>
            <mesh position={[0, height / 4, 0]}>
              <cylinderGeometry args={[0.2, 0.4, height / 2]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[0, height * 0.65, 0]}>
              <coneGeometry args={[width / 2, height / 2, 8]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        );

      case 'fence':
        return (
          <mesh>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );

      case 'culvert':
        return (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[height / 2, height / 2, width, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );

      case 'driveway':
        return (
          <mesh>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );

      default:
        return (
          <>
            <mesh castShadow>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color={color} />
            </mesh>
            {item.type.includes('house') && (
              <mesh position={[0, height / 2 + 0.5, 0]} castShadow>
                <coneGeometry args={[width * 0.7, height * 0.4, 4]} />
                <meshStandardMaterial color="#8B0000" />
              </mesh>
            )}
          </>
        );
    }
  };

  return (
    <group>
      <group
        ref={meshRef}
        position={[item.position.x, item.position.y + height / 2, item.position.z]}
        rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {renderGeometry()}

        {/* Hover outline */}
        {hovered && !isSelected && (
          <mesh>
            <boxGeometry args={[width + 0.2, height + 0.2, depth + 0.2]} />
            <meshBasicMaterial
              color="#FFFFFF"
              opacity={0.3}
              transparent
              wireframe
            />
          </mesh>
        )}
      </group>

      {/* Transform controls when selected */}
      {isSelected && meshRef.current && (
        <TransformControls
          object={meshRef.current}
          mode="translate"
          onObjectChange={handleTransform}
          showX={true}
          showY={false}
          showZ={true}
        />
      )}
    </group>
  );
};
