import { useMemo } from 'react';
import * as THREE from 'three';
import { MaterialPresets } from '../../../utils/textureGenerator';

interface DetailedTreeProps {
  width: number;
  height: number;
  scale: number;
  color: string;
  isDragging: boolean;
  isOverlapping: boolean;
}

/**
 * Detailed tree component with painterly homestead style
 * Features: textured bark, layered foliage, organic shape
 */
export const DetailedTree = ({
  width,
  height,
  scale: _scale, // Scale is already applied to width/height before this component
  color,
  isDragging,
  isOverlapping
}: DetailedTreeProps) => {
  const opacity = isDragging ? 0.7 : 1;
  const itemColor = isOverlapping ? '#FF0000' : color;

  // Generate textures
  const barkMaterial = useMemo(() => {
    const preset = MaterialPresets.treeBark();
    return new THREE.MeshStandardMaterial({
      ...preset,
      opacity,
      transparent: isDragging,
    });
  }, [isDragging, opacity]);

  const foliageMaterial = useMemo(() => {
    const preset = MaterialPresets.treeFoliage();
    return new THREE.MeshStandardMaterial({
      ...preset,
      color: new THREE.Color(itemColor),
      opacity: opacity * 0.95,
      transparent: true,
    });
  }, [itemColor, isDragging, opacity]);

  // Dimensions
  const trunkHeight = height * 0.4;
  const trunkRadius = width * 0.08;
  const canopyRadius = width / 2;
  const canopyHeight = height * 0.6;

  return (
    <group>
      {/* Tree trunk */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[trunkRadius * 0.8, trunkRadius, trunkHeight, 8]} />
        <primitive object={barkMaterial} attach="material" />
      </mesh>

      {/* Main canopy - bottom layer (darker) */}
      <mesh
        position={[0, trunkHeight + canopyHeight * 0.2, 0]}
        castShadow
      >
        <sphereGeometry args={[canopyRadius, 8, 6]} />
        <meshStandardMaterial
          color={new THREE.Color(itemColor).multiplyScalar(0.7)}
          opacity={opacity * 0.9}
          transparent
          roughness={0.9}
        />
      </mesh>

      {/* Middle canopy layer */}
      <mesh
        position={[0, trunkHeight + canopyHeight * 0.4, 0]}
        castShadow
      >
        <sphereGeometry args={[canopyRadius * 0.9, 8, 6]} />
        <primitive object={foliageMaterial} attach="material" />
      </mesh>

      {/* Top canopy layer (highlights) */}
      <mesh
        position={[0, trunkHeight + canopyHeight * 0.55, 0]}
        castShadow
      >
        <sphereGeometry args={[canopyRadius * 0.7, 8, 6]} />
        <meshStandardMaterial
          color={new THREE.Color(itemColor).multiplyScalar(1.2)}
          opacity={opacity * 0.85}
          transparent
          roughness={0.8}
        />
      </mesh>

      {/* Organic foliage clusters */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const radius = canopyRadius * 0.6;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const clusterSize = canopyRadius * (0.3 + Math.random() * 0.2);

        return (
          <mesh
            key={i}
            position={[x, trunkHeight + canopyHeight * 0.4, z]}
            castShadow
          >
            <sphereGeometry args={[clusterSize, 6, 5]} />
            <meshStandardMaterial
              color={new THREE.Color(itemColor).multiplyScalar(0.85 + Math.random() * 0.3)}
              opacity={opacity * 0.8}
              transparent
              roughness={0.9}
            />
          </mesh>
        );
      })}

      {/* Branches */}
      {Array.from({ length: 3 }).map((_, i) => {
        const angle = ((i / 3) * Math.PI * 2) + Math.PI / 6;
        const branchLength = canopyRadius * 0.8;
        const branchHeight = trunkHeight + canopyHeight * 0.2;

        return (
          <mesh
            key={`branch-${i}`}
            position={[
              Math.cos(angle) * branchLength * 0.3,
              branchHeight,
              Math.sin(angle) * branchLength * 0.3
            ]}
            rotation={[0, angle, Math.PI / 4]}
            castShadow
          >
            <cylinderGeometry args={[trunkRadius * 0.3, trunkRadius * 0.5, branchLength, 6]} />
            <primitive object={barkMaterial} attach="material" />
          </mesh>
        );
      })}
    </group>
  );
};
