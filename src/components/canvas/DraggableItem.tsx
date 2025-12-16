import { useRef, useState, useEffect } from 'react';
import { Mesh, Vector3, Raycaster, Vector2 } from 'three';
import { useThree } from '@react-three/fiber';
import type { PlacedItem } from '../../types';
import { useLandStore } from '../../store/useLandStore';
import { getItemDefinition } from '../../data/items';
import { getHeightAtPosition } from '../../utils/noise';

interface DraggableItemProps {
  item: PlacedItem;
}

export const DraggableItem = ({ item }: DraggableItemProps) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<Vector2>(new Vector2());

  const { scene, camera, gl } = useThree();
  const selectedItemId = useLandStore((state) => state.selectedItemId);
  const setSelectedItemId = useLandStore((state) => state.setSelectedItemId);
  const removePlacedItem = useLandStore((state) => state.removePlacedItem);
  const updatePlacedItem = useLandStore((state) => state.updatePlacedItem);
  const placedItems = useLandStore((state) => state.placedItems);
  const terrainHeightMap = useLandStore((state) => state.terrainHeightMap);

  const isSelected = selectedItemId === item.id;

  const definition = getItemDefinition(item.type);
  if (!definition) return null;

  const { width, height, depth } = definition.defaultDimensions;
  const color = item.color || definition.color;

  // Check for overlaps with other items
  const checkOverlap = (position: Vector3): boolean => {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    return placedItems.some((otherItem) => {
      if (otherItem.id === item.id) return false;

      const otherDef = getItemDefinition(otherItem.type);
      if (!otherDef) return false;

      const otherHalfWidth = otherDef.defaultDimensions.width / 2;
      const otherHalfDepth = otherDef.defaultDimensions.depth / 2;

      const dx = Math.abs(position.x - otherItem.position.x);
      const dz = Math.abs(position.z - otherItem.position.z);

      return dx < (halfWidth + otherHalfWidth) && dz < (halfDepth + otherHalfDepth);
    });
  };

  const [isOverlapping, setIsOverlapping] = useState(false);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new Raycaster();
      raycaster.setFromCamera(new Vector2(x, y), camera);

      const terrain = scene.getObjectByName('terrain');
      if (!terrain) return;

      const intersects = raycaster.intersectObject(terrain, true);
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

        const newPos = new Vector3(point.x, terrainHeight, point.z);

        // Check for overlap
        const overlapping = checkOverlap(newPos);
        setIsOverlapping(overlapping);

        // Only update if not overlapping
        if (!overlapping) {
          updatePlacedItem(item.id, {
            position: {
              x: newPos.x,
              y: terrainHeight,
              z: newPos.z,
            },
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsOverlapping(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, item.id, updatePlacedItem, camera, scene, gl, placedItems, terrainHeightMap]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setSelectedItemId(item.id);
    setIsDragging(true);

    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    dragStartPos.current.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
  };

  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    if (window.confirm(`Delete ${definition.name}?`)) {
      removePlacedItem(item.id);
      setSelectedItemId(null);
    }
  };

  // Render different shapes based on item type
  const renderGeometry = () => {
    const itemColor = isOverlapping ? '#FF0000' : color;
    const opacity = isDragging ? 0.7 : 1;

    switch (item.type) {
      case 'tree':
        return (
          <group>
            <mesh position={[0, height / 4, 0]}>
              <cylinderGeometry args={[0.2, 0.4, height / 2]} />
              <meshStandardMaterial color="#8B4513" opacity={opacity} transparent={isDragging} />
            </mesh>
            <mesh position={[0, height * 0.65, 0]}>
              <coneGeometry args={[width / 2, height / 2, 8]} />
              <meshStandardMaterial color={itemColor} opacity={opacity} transparent={isDragging} />
            </mesh>
          </group>
        );

      case 'fence':
        return (
          <mesh>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={itemColor} opacity={opacity} transparent={isDragging} />
          </mesh>
        );

      case 'culvert':
        return (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[height / 2, height / 2, width, 16]} />
            <meshStandardMaterial color={itemColor} opacity={opacity} transparent={isDragging} />
          </mesh>
        );

      case 'driveway':
        return (
          <mesh>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={itemColor} opacity={opacity} transparent={isDragging} />
          </mesh>
        );

      default:
        return (
          <>
            <mesh castShadow>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color={itemColor} opacity={opacity} transparent={isDragging} />
            </mesh>
            {item.type.includes('house') && (
              <mesh position={[0, height / 2 + 0.5, 0]} castShadow>
                <coneGeometry args={[width * 0.7, height * 0.4, 4]} />
                <meshStandardMaterial color={isOverlapping ? '#FF0000' : '#8B0000'} opacity={opacity} transparent={isDragging} />
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
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {renderGeometry()}

      {/* Selection/hover outline */}
      {(hovered || isSelected) && !isDragging && (
        <mesh>
          <boxGeometry args={[width + 0.2, height + 0.2, depth + 0.2]} />
          <meshBasicMaterial
            color={isSelected ? '#FFD700' : '#FFFFFF'}
            opacity={0.3}
            transparent
            wireframe
          />
        </mesh>
      )}
    </group>
  );
};
