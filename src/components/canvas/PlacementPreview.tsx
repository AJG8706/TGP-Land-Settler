import { useRef, useState, useEffect } from 'react';
import { Mesh, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useLandStore } from '../../store/useLandStore';
import { getItemDefinition } from '../../data/items';
import { snapToGrid, generateId } from '../../utils/helpers';
import { getHeightAtPosition } from '../../utils/noise';
import type { PlacedItem } from '../../types';

interface LineSegment {
  position: Vector3;
  rotation: number;
}

export const PlacementPreview = () => {
  const meshRef = useRef<Mesh>(null);
  const [position, setPosition] = useState<Vector3>(new Vector3(0, 0, 0));
  const [isValid, setIsValid] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStartX, setRotationStartX] = useState(0);
  const [rotationStart, setRotationStart] = useState(0);

  // Line drawing state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Vector3 | null>(null);
  const [lineSegments, setLineSegments] = useState<LineSegment[]>([]);

  // Tree group state
  const [treeGroupPreview, setTreeGroupPreview] = useState<Array<{ position: Vector3; heightVariation: number }>>([]);

  const { camera, raycaster, scene } = useThree();
  const selectedItemType = useLandStore((state) => state.selectedItemType);
  const selectedSize = useLandStore((state) => state.selectedSize);
  const isPlacementMode = useLandStore((state) => state.isPlacementMode);
  const snapEnabled = useLandStore((state) => state.snapToGrid);
  const addPlacedItem = useLandStore((state) => state.addPlacedItem);
  const setPlacementMode = useLandStore((state) => state.setPlacementMode);
  const terrainHeightMap = useLandStore((state) => state.terrainHeightMap);

  const definition = selectedItemType ? getItemDefinition(selectedItemType) : null;

  // Check if current item supports line drawing
  const isLineDrawableItem = definition && (
    definition.type === 'fence' ||
    definition.type === 'driveway' ||
    definition.type === 'road' ||
    definition.type === 'creek' ||
    definition.type.includes('stream')
  );

  // Check if current item is a tree/bush that should be placed in groups
  const isTreeGroupItem = definition && (
    definition.type === 'tree' ||
    definition.category === 'trees'
  );

  // Get terrain height at position
  const getTerrainHeight = (x: number, z: number): number => {
    if (!terrainHeightMap) return 0;
    return getHeightAtPosition(
      terrainHeightMap,
      x,
      z,
      100, // terrainWidth
      100, // terrainDepth
      10   // maxHeight
    );
  };

  // Get world position from mouse event
  const getWorldPosition = (event: MouseEvent): Vector3 | null => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(new Vector2(x, y), camera);

    const terrain = scene.getObjectByName('terrain');
    if (!terrain) return null;

    const intersects = raycaster.intersectObject(terrain, true);
    if (intersects.length === 0) return null;

    const point = intersects[0].point;
    const terrainHeight = getTerrainHeight(point.x, point.z);

    // Add offset to prevent z-fighting with terrain
    // Use larger offset for flat items like roads and ponds
    const isFlatItem = selectedItemType?.includes('road') ||
                       selectedItemType?.includes('driveway') ||
                       selectedItemType?.includes('pond');
    const heightWithOffset = terrainHeight + (isFlatItem ? 1.0 : 0.05);

    const worldPos = snapEnabled
      ? snapToGrid({ x: point.x, y: heightWithOffset, z: point.z })
      : { x: point.x, y: heightWithOffset, z: point.z };

    return new Vector3(worldPos.x, worldPos.y, worldPos.z);
  };

  // Calculate line segments between two points
  const calculateLineSegments = (start: Vector3, end: Vector3): LineSegment[] => {
    if (!definition) return [];

    const { width, depth } = definition.defaultDimensions;

    // For fences, use width (the long dimension) instead of depth (thickness)
    // For roads/driveways, use depth (the length along the path)
    const isFence = definition.type === 'fence';
    const segmentLength = isFence ? width : depth;

    // Calculate direction and distance
    const direction = new Vector3().subVectors(end, start);
    const distance = direction.length();

    if (distance < segmentLength * 0.5) return [];

    direction.normalize();

    // Calculate rotation angle based on direction
    const angle = Math.atan2(direction.x, direction.z);

    // Calculate number of segments - use floor to prevent overlapping
    const numSegments = Math.max(1, Math.floor(distance / segmentLength));

    // Check if this is a flat item needing higher offset
    const isFlatItem = definition.type.includes('road') ||
                       definition.type.includes('driveway') ||
                       definition.type.includes('pond');
    const heightOffset = isFlatItem ? 1.0 : 0.05;

    // Generate segment positions - space them at exact segmentLength intervals
    // Sample terrain at multiple points for smoother transitions
    const segments: LineSegment[] = [];
    for (let i = 0; i < numSegments; i++) {
      const startDist = i * segmentLength;
      const centerDist = startDist + segmentLength / 2;
      const endDist = startDist + segmentLength;

      // Sample terrain at start, center, and end of segment
      const startX = start.x + direction.x * startDist;
      const startZ = start.z + direction.z * startDist;
      const centerX = start.x + direction.x * centerDist;
      const centerZ = start.z + direction.z * centerDist;
      const endX = start.x + direction.x * endDist;
      const endZ = start.z + direction.z * endDist;

      const startHeight = getTerrainHeight(startX, startZ);
      const centerHeight = getTerrainHeight(centerX, centerZ);
      const endHeight = getTerrainHeight(endX, endZ);

      // Use average height for smoother transitions
      const avgHeight = (startHeight + centerHeight + endHeight) / 3;

      const segmentPos = new Vector3(
        centerX,
        avgHeight + heightOffset,
        centerZ
      );

      segments.push({
        position: segmentPos,
        rotation: angle,
      });
    }

    return segments;
  };

  // Generate tree group positions with variations
  const generateTreeGroup = (centerPos: Vector3): Array<{ position: Vector3; heightVariation: number }> => {
    if (!definition) return [];

    // Random number of trees in group (3-7)
    const treeCount = Math.floor(Math.random() * 5) + 3;

    const trees: Array<{ position: Vector3; heightVariation: number }> = [];

    for (let i = 0; i < treeCount; i++) {
      // Generate random offset from center (0-5 units radius)
      const angle = (Math.random() * Math.PI * 2);
      const radius = Math.random() * 5 + 1; // 1-6 units from center

      const offsetX = Math.cos(angle) * radius;
      const offsetZ = Math.sin(angle) * radius;

      const treeX = centerPos.x + offsetX;
      const treeZ = centerPos.z + offsetZ;
      const treeY = getTerrainHeight(treeX, treeZ) + 0.05; // Slightly above terrain

      // Height variation: 80% to 120% of original height
      const heightVariation = 0.8 + Math.random() * 0.4;

      trees.push({
        position: new Vector3(treeX, treeY, treeZ),
        heightVariation,
      });
    }

    return trees;
  };

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isPlacementMode || !definition) return;

      // Handle rotation
      if (isRotating) {
        const deltaX = event.clientX - rotationStartX;
        const newRotation = rotationStart + (deltaX * 0.01); // Adjust sensitivity
        setRotation(newRotation);
        return;
      }

      const worldPos = getWorldPosition(event);
      if (!worldPos) return;

      setPosition(worldPos);
      setIsValid(true);

      // Update line segments if dragging
      if (isDragging && dragStartPos && isLineDrawableItem) {
        const segments = calculateLineSegments(dragStartPos, worldPos);
        setLineSegments(segments);
      }

      // Generate tree group preview when hovering
      if (isTreeGroupItem) {
        const treeGroup = generateTreeGroup(worldPos);
        setTreeGroupPreview(treeGroup);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPlacementMode, definition, isDragging, dragStartPos, camera, raycaster, scene, terrainHeightMap, snapEnabled, isLineDrawableItem, isTreeGroupItem, isRotating, rotationStartX, rotationStart]);

  // Handle mouse down
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!isPlacementMode || !definition) return;

      const canvas = document.querySelector('canvas');
      if (!canvas || event.target !== canvas) return;

      // Right-click for rotation
      if (event.button === 2) {
        event.preventDefault();
        setIsRotating(true);
        setRotationStartX(event.clientX);
        setRotationStart(rotation);
        return;
      }

      // Left-click for placement/line drawing
      if (event.button !== 0) return;

      const worldPos = getWorldPosition(event);
      if (!worldPos) return;

      if (isLineDrawableItem) {
        // Start line drawing
        setIsDragging(true);
        setDragStartPos(worldPos);
        setLineSegments([]);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [isPlacementMode, definition, camera, raycaster, scene, terrainHeightMap, snapEnabled, isLineDrawableItem, rotation]);

  // Handle mouse up
  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      if (!isPlacementMode || !definition) return;

      // Stop rotation on right-click release
      if (event.button === 2) {
        setIsRotating(false);
        return;
      }

      if (isDragging && dragStartPos && isLineDrawableItem) {
        // Place all line segments
        if (lineSegments.length > 0) {
          lineSegments.forEach((segment) => {
            const newItem: PlacedItem = {
              id: generateId(),
              type: selectedItemType!,
              position: { x: segment.position.x, y: segment.position.y, z: segment.position.z },
              rotation: { x: 0, y: segment.rotation, z: 0 },
              size: selectedSize || undefined,
              color: definition.color,
            };
            addPlacedItem(newItem);
          });
        }

        // Reset dragging state
        setIsDragging(false);
        setDragStartPos(null);
        setLineSegments([]);
      } else if (isTreeGroupItem) {
        // Place tree group with variations
        if (treeGroupPreview.length > 0) {
          treeGroupPreview.forEach((tree) => {
            const newItem: PlacedItem = {
              id: generateId(),
              type: selectedItemType!,
              position: { x: tree.position.x, y: tree.position.y, z: tree.position.z },
              rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 }, // Random rotation for each tree
              size: selectedSize || undefined,
              color: definition.color,
              scale: tree.heightVariation, // Apply height variation as scale
            };
            addPlacedItem(newItem);
          });
        }
        // Generate new preview for next placement
        const treeGroup = generateTreeGroup(position);
        setTreeGroupPreview(treeGroup);
      } else if (!isLineDrawableItem) {
        // Single click placement for regular items
        const newItem: PlacedItem = {
          id: generateId(),
          type: selectedItemType!,
          position: { x: position.x, y: position.y, z: position.z },
          rotation: { x: 0, y: rotation, z: 0 },
          size: selectedSize || undefined,
          color: definition.color,
        };
        addPlacedItem(newItem);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [
    isPlacementMode,
    definition,
    isDragging,
    dragStartPos,
    lineSegments,
    position,
    rotation,
    selectedItemType,
    selectedSize,
    addPlacedItem,
    isLineDrawableItem,
    isTreeGroupItem,
    treeGroupPreview,
  ]);

  // Prevent context menu on right-click
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      if (!isPlacementMode) return;
      const canvas = document.querySelector('canvas');
      if (canvas && event.target === canvas) {
        event.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, [isPlacementMode]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isPlacementMode) return;

      switch (event.key) {
        case 'Escape':
          // Cancel placement
          setPlacementMode(false);
          setIsDragging(false);
          setDragStartPos(null);
          setLineSegments([]);
          setIsRotating(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlacementMode, setPlacementMode]);

  if (!isPlacementMode || !definition) return null;

  const { width, height, depth } = definition.defaultDimensions;

  // Render line segments preview
  if (isLineDrawableItem && isDragging && lineSegments.length > 0) {
    // For fences, swap width and depth so the fence panel extends along the line
    const isFence = definition.type === 'fence';
    const renderWidth = isFence ? depth : width;
    const renderDepth = isFence ? width : depth;

    return (
      <>
        {lineSegments.map((segment, index) => (
          <group
            key={index}
            position={[segment.position.x, segment.position.y + height / 2, segment.position.z]}
            rotation={[0, segment.rotation, 0]}
          >
            <mesh>
              <boxGeometry args={[renderWidth, height, renderDepth]} />
              <meshStandardMaterial
                color={definition.color}
                opacity={0.6}
                transparent
              />
            </mesh>
            <mesh>
              <boxGeometry args={[renderWidth + 0.1, height + 0.1, renderDepth + 0.1]} />
              <meshBasicMaterial color="#FFFFFF" wireframe />
            </mesh>
          </group>
        ))}
        {/* Show start point */}
        {dragStartPos && (
          <mesh position={[dragStartPos.x, dragStartPos.y + 0.5, dragStartPos.z]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color="#00FF00" />
          </mesh>
        )}
      </>
    );
  }

  // Render tree group preview
  if (isTreeGroupItem && treeGroupPreview.length > 0) {
    return (
      <>
        {treeGroupPreview.map((tree, index) => {
          const scaledHeight = height * tree.heightVariation;
          const scaledWidth = width * tree.heightVariation;

          return (
            <group
              key={index}
              position={[tree.position.x, tree.position.y, tree.position.z]}
              rotation={[0, Math.random() * Math.PI * 2, 0]}
            >
              {/* Tree trunk */}
              <mesh position={[0, scaledHeight / 4, 0]}>
                <cylinderGeometry args={[0.2 * tree.heightVariation, 0.4 * tree.heightVariation, scaledHeight / 2]} />
                <meshStandardMaterial color="#8B4513" opacity={0.5} transparent />
              </mesh>
              {/* Tree foliage */}
              <mesh position={[0, scaledHeight * 0.65, 0]}>
                <coneGeometry args={[scaledWidth / 2, scaledHeight / 2, 8]} />
                <meshStandardMaterial
                  color={definition.color}
                  opacity={0.5}
                  transparent
                />
              </mesh>
            </group>
          );
        })}
        {/* Show center point */}
        <mesh position={[position.x, position.y + 0.5, position.z]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#4CAF50" />
        </mesh>
      </>
    );
  }

  // Render single item preview
  const isPond = selectedItemType?.includes('pond');
  const isTree = selectedItemType === 'tree' || selectedItemType?.includes('tree');

  return (
    <group
      ref={meshRef}
      position={[
        position.x,
        // Trees are built from ground up, other items are centered
        isTree ? position.y : position.y + height / 2,
        position.z
      ]}
      rotation={[0, rotation, 0]}
    >
      {isPond ? (
        <>
          <mesh>
            <cylinderGeometry args={[Math.max(width, depth) / 2, Math.max(width, depth) / 2, height, 32]} />
            <meshStandardMaterial
              color={isValid ? definition.color : '#FF0000'}
              opacity={0.5}
              transparent
            />
          </mesh>
          {/* Outline */}
          <mesh>
            <cylinderGeometry args={[Math.max(width, depth) / 2 + 0.1, Math.max(width, depth) / 2 + 0.1, height + 0.1, 32]} />
            <meshBasicMaterial color="#FFFFFF" wireframe />
          </mesh>
        </>
      ) : (
        <>
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
        </>
      )}
    </group>
  );
};
