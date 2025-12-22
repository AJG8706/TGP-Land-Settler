import { useMemo } from 'react';
import * as THREE from 'three';
import { MaterialPresets } from '../../../utils/textureGenerator';
import type { PlacedItem } from '../../../types';
import { getHeightAtPosition } from '../../../utils/noise';

interface DetailedPondProps {
  item: PlacedItem;
  width: number;
  height: number;
  depth: number;
  isDragging: boolean;
  isOverlapping: boolean;
  terrainHeightMap: number[][] | null;
}

/**
 * Detailed pond component with painterly homestead style
 * Features: water texture, terrain-following surface, shore vegetation
 */
export const DetailedPond = ({
  item,
  width,
  height,
  depth,
  isDragging,
  isOverlapping,
  terrainHeightMap
}: DetailedPondProps) => {
  const opacity = isDragging ? 0.7 : 1;

  // Generate water material
  const waterMaterial = useMemo(() => {
    const preset = MaterialPresets.water();
    return new THREE.MeshStandardMaterial({
      ...preset,
      color: isOverlapping ? new THREE.Color('#FF0000') : new THREE.Color('#4A9FB8'),
      opacity: opacity * 0.7,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, [isOverlapping, isDragging, opacity]);

  // Create terrain-following pond geometry
  const pondGeometry = useMemo(() => {
    const radius = Math.max(width, depth) / 2;
    const segments = 32;
    const rings = 8;

    const geometry = new THREE.CircleGeometry(radius, segments, rings);
    const positions = geometry.attributes.position;

    // Adjust each vertex height based on terrain
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);

      const worldX = item.position.x + x;
      const worldZ = item.position.z + z;

      let terrainHeight = 0;
      if (terrainHeightMap) {
        terrainHeight = getHeightAtPosition(
          terrainHeightMap,
          worldX,
          worldZ,
          100,
          100,
          10
        );
      }

      const relativeHeight = terrainHeight - item.position.y + height / 2 + 0.05;
      positions.setZ(i, relativeHeight);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, [item, width, depth, height, terrainHeightMap]);

  const radius = Math.max(width, depth) / 2;

  return (
    <group>
      {/* Main water surface */}
      <mesh geometry={pondGeometry} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={waterMaterial} attach="material" />
      </mesh>

      {/* Shore rocks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const rockRadius = radius * (0.95 + Math.random() * 0.1);
        const x = Math.cos(angle) * rockRadius;
        const z = Math.sin(angle) * rockRadius;
        const rockSize = 0.3 + Math.random() * 0.3;

        return (
          <mesh
            key={`rock-${i}`}
            position={[x, height / 2, z]}
            rotation={[
              Math.random() * 0.5,
              Math.random() * Math.PI * 2,
              Math.random() * 0.5
            ]}
            castShadow
          >
            <dodecahedronGeometry args={[rockSize, 0]} />
            <meshStandardMaterial
              color="#696969"
              roughness={0.9}
              metalness={0.1}
              opacity={opacity}
              transparent={isDragging}
            />
          </mesh>
        );
      })}

      {/* Shore vegetation tufts */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + Math.PI / 16;
        const tuftRadius = radius * (1.0 + Math.random() * 0.15);
        const x = Math.cos(angle) * tuftRadius;
        const z = Math.sin(angle) * tuftRadius;
        const tuftHeight = 0.5 + Math.random() * 0.3;

        return (
          <mesh
            key={`vegetation-${i}`}
            position={[x, height / 2 + tuftHeight / 2, z]}
            castShadow
          >
            <coneGeometry args={[0.2, tuftHeight, 6]} />
            <meshStandardMaterial
              color="#5A7C3E"
              roughness={0.9}
              opacity={opacity}
              transparent={isDragging}
            />
          </mesh>
        );
      })}

      {/* Lily pads (optional detail) */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const padRadius = radius * (Math.random() * 0.6 + 0.2);
        const x = Math.cos(angle) * padRadius;
        const z = Math.sin(angle) * padRadius;

        return (
          <mesh
            key={`lilypad-${i}`}
            position={[x, height / 2 + 0.15, z]}
            rotation={[-Math.PI / 2, 0, Math.random() * Math.PI * 2]}
          >
            <circleGeometry args={[0.3, 8]} />
            <meshStandardMaterial
              color="#4A7C47"
              roughness={0.8}
              opacity={opacity}
              transparent={isDragging}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* Water ripples (transparent circles) */}
      {Array.from({ length: 3 }).map((_, i) => {
        const angle = (i / 3) * Math.PI * 2;
        const rippleRadius = radius * 0.4;
        const x = Math.cos(angle) * rippleRadius;
        const z = Math.sin(angle) * rippleRadius;
        const rippleSize = 0.5 + i * 0.3;

        return (
          <mesh
            key={`ripple-${i}`}
            position={[x, height / 2 + 0.2, z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[rippleSize, rippleSize + 0.1, 16]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={opacity * (0.3 - i * 0.08)}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
};
