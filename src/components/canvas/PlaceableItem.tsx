import { useRef, useState } from 'react';
import { Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { PlacedItem } from '../../types';
import { useLandStore } from '../../store/useLandStore';
import { getItemDefinition } from '../../data/items';

interface PlaceableItemProps {
  item: PlacedItem;
}

export const PlaceableItem = ({ item }: PlaceableItemProps) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);

  const removePlacedItem = useLandStore((state) => state.removePlacedItem);

  const definition = getItemDefinition(item.type);
  if (!definition) return null;

  const { width, height, depth } = definition.defaultDimensions;
  const color = item.color || definition.color;

  // Handle click to select/deselect
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelected(!selected);
  };

  // Handle double-click to delete
  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (window.confirm(`Delete ${definition.name}?`)) {
      removePlacedItem(item.id);
    }
  };

  // Render different shapes based on item type
  const renderGeometry = () => {
    switch (item.type) {
      case 'tree':
        // Simple cone for trees
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
        // Thin box for fence
        return (
          <mesh>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );

      case 'culvert':
        // Cylinder for culvert
        return (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[height / 2, height / 2, width, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );

      case 'driveway':
        // Flat box for driveway
        return (
          <mesh>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );

      default:
        // Default box for buildings (houses, RVs, mobile homes)
        return (
          <>
            <mesh castShadow>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color={color} />
            </mesh>
            {/* Add a roof for houses */}
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

      {/* Selection outline */}
      {(hovered || selected) && (
        <mesh>
          <boxGeometry args={[width + 0.2, height + 0.2, depth + 0.2]} />
          <meshBasicMaterial
            color={selected ? '#FFD700' : '#FFFFFF'}
            opacity={0.3}
            transparent
            wireframe
          />
        </mesh>
      )}
    </group>
  );
};
