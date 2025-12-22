import { useRef, useState, useEffect } from 'react';
import { Mesh, Vector3, Raycaster, Vector2 } from 'three';
import { useThree } from '@react-three/fiber';
import type { PlacedItem } from '../../types';
import { useLandStore } from '../../store/useLandStore';
import { getItemDefinition } from '../../data/items';
import { getHeightAtPosition } from '../../utils/noise';
import { DetailedHouse } from './items/DetailedHouse';
import { DetailedTree } from './items/DetailedTree';
import { DetailedPond } from './items/DetailedPond';

interface DraggableItemProps {
  item: PlacedItem;
}

export const DraggableItem = ({ item }: DraggableItemProps) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStartX, setRotationStartX] = useState(0);
  const [rotationStart, setRotationStart] = useState(0);
  const dragStartPos = useRef<Vector2>(new Vector2());

  const { scene, camera, gl } = useThree();
  const selectedItemId = useLandStore((state) => state.selectedItemId);
  const setSelectedItemId = useLandStore((state) => state.setSelectedItemId);
  const removePlacedItem = useLandStore((state) => state.removePlacedItem);
  const updatePlacedItem = useLandStore((state) => state.updatePlacedItem);
  const placedItems = useLandStore((state) => state.placedItems);
  const terrainHeightMap = useLandStore((state) => state.terrainHeightMap);
  const setIsDraggingItem = useLandStore((state) => state.setIsDraggingItem);
  const modifyTerrainForWaterFeature = useLandStore((state) => state.modifyTerrainForWaterFeature);
  const restoreTerrainForWaterFeature = useLandStore((state) => state.restoreTerrainForWaterFeature);
  const adjustItemElevationToCorners = useLandStore((state) => state.adjustItemElevationToCorners);

  const isSelected = selectedItemId === item.id;

  const definition = getItemDefinition(item.type);
  if (!definition) return null;

  // Apply scale if provided (for tree variations, etc.)
  const scale = item.scale || 1;
  const { width: baseWidth, height: baseHeight, depth: baseDepth } = definition.defaultDimensions;
  const width = baseWidth * scale;
  const height = baseHeight * scale;
  const depth = baseDepth * scale;
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
    if (!isDragging && !isRotating) return;

    const handleMouseMove = (event: MouseEvent) => {
      // Handle rotation
      if (isRotating) {
        const deltaX = event.clientX - rotationStartX;
        const newRotation = rotationStart + (deltaX * 0.01); // Adjust sensitivity
        updatePlacedItem(item.id, {
          rotation: {
            x: item.rotation.x,
            y: newRotation,
            z: item.rotation.z,
          },
        });
        return;
      }

      // Handle dragging
      if (!isDragging) return;

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

        // Add offset to prevent z-fighting with terrain
        // Use larger offset for flat items like roads and ponds
        const isFlatItem = item.type.includes('road') ||
                           item.type.includes('driveway') ||
                           item.type.includes('pond');
        const heightWithOffset = terrainHeight + (isFlatItem ? 1.0 : 0.05);

        const newPos = new Vector3(point.x, heightWithOffset, point.z);

        // Check for overlap
        const overlapping = checkOverlap(newPos);
        setIsOverlapping(overlapping);

        // Only update if not overlapping
        if (!overlapping) {
          updatePlacedItem(item.id, {
            position: {
              x: newPos.x,
              y: heightWithOffset,
              z: newPos.z,
            },
          });
        }
      }
    };

    const handleMouseUp = () => {
      // Stop rotation
      if (isRotating) {
        setIsRotating(false);
        return;
      }

      // If this was a water feature that was moved, update terrain
      if (isDragging) {
        const isWaterFeature = item.type.includes('pond') ||
                               item.type.includes('creek') ||
                               item.type.includes('stream');
        if (isWaterFeature) {
          // Restore terrain at old position
          restoreTerrainForWaterFeature(item.id);
          // Modify terrain at new position
          modifyTerrainForWaterFeature(item);
        }

        // Adjust elevation based on corner heights
        adjustItemElevationToCorners(item.id);
      }

      setIsDragging(false);
      setIsOverlapping(false);
      setIsDraggingItem(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isRotating, rotationStartX, rotationStart, item, updatePlacedItem, camera, scene, gl, placedItems, terrainHeightMap, modifyTerrainForWaterFeature, restoreTerrainForWaterFeature]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setSelectedItemId(item.id);

    // Right-click for rotation
    if (e.button === 2) {
      e.preventDefault();
      setIsRotating(true);
      setRotationStartX(e.clientX);
      setRotationStart(item.rotation.y);
      return;
    }

    // Left-click for dragging
    if (e.button === 0) {
      setIsDragging(true);
      setIsDraggingItem(true);

      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      dragStartPos.current.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
    }
  };

  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    if (window.confirm(`Delete ${definition.name}?`)) {
      // Restore terrain if this is a water feature
      const isWaterFeature = item.type.includes('pond') ||
                             item.type.includes('creek') ||
                             item.type.includes('stream');
      if (isWaterFeature) {
        restoreTerrainForWaterFeature(item.id);
      }

      removePlacedItem(item.id);
      setSelectedItemId(null);
    }
  };

  // Render different shapes based on item type
  const renderGeometry = () => {
    const itemColor = isOverlapping ? '#FF0000' : color;
    const opacity = isDragging ? 0.7 : 1;

    // Check if it's a pond type - use detailed pond component
    if (item.type.includes('pond')) {
      return (
        <DetailedPond
          item={item}
          width={width}
          height={height}
          depth={depth}
          isDragging={isDragging}
          isOverlapping={isOverlapping}
          terrainHeightMap={terrainHeightMap}
        />
      );
    }

    // Check if it's a tree - use detailed tree component
    if (item.type === 'tree' || item.type.includes('tree')) {
      return (
        <DetailedTree
          width={width}
          height={height}
          scale={scale}
          color={itemColor}
          isDragging={isDragging}
          isOverlapping={isOverlapping}
        />
      );
    }

    // Check if it's a house - use detailed house component
    if (item.type.includes('house') || item.type.includes('home') || item.type.includes('rv')) {
      return (
        <DetailedHouse
          width={width}
          height={height}
          depth={depth}
          color={itemColor}
          isDragging={isDragging}
          isOverlapping={isOverlapping}
        />
      );
    }

    switch (item.type) {
      case 'fence':
        // For fences, swap width and depth so the fence panel extends along its length
        return (
          <mesh>
            <boxGeometry args={[depth, height, width]} />
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
          <mesh castShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={itemColor} opacity={opacity} transparent={isDragging} />
          </mesh>
        );
    }
  };

  return (
    <group
      ref={meshRef}
      position={[
        item.position.x,
        // Trees are built from ground up (y=0), other items are centered at origin
        item.type === 'tree' || item.type.includes('tree') ? item.position.y : item.position.y + height / 2,
        item.position.z
      ]}
      rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onContextMenu={(e) => e.nativeEvent.preventDefault()}
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
