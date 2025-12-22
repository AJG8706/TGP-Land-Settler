import { useMemo } from 'react';
import * as THREE from 'three';
import { MaterialPresets } from '../../../utils/textureGenerator';

interface DetailedHouseProps {
  width: number;
  height: number;
  depth: number;
  color: string;
  isDragging: boolean;
  isOverlapping: boolean;
}

/**
 * Detailed house component with painterly homestead style
 * Features: wood siding, metal roof, porch, windows, chimney
 */
export const DetailedHouse = ({
  width,
  height,
  depth,
  color,
  isDragging,
  isOverlapping
}: DetailedHouseProps) => {
  const opacity = isDragging ? 0.7 : 1;
  const itemColor = isOverlapping ? '#FF0000' : color;

  // Generate textures
  const woodMaterial = useMemo(() => {
    const preset = MaterialPresets.woodenWall();
    return new THREE.MeshStandardMaterial({
      ...preset,
      color: new THREE.Color(itemColor),
      opacity,
      transparent: isDragging,
    });
  }, [itemColor, isDragging, opacity]);

  const roofMaterial = useMemo(() => {
    const preset = MaterialPresets.metalRoof();
    return new THREE.MeshStandardMaterial({
      ...preset,
      color: new THREE.Color(isOverlapping ? '#FF0000' : '#8B4513'),
      opacity,
      transparent: isDragging,
    });
  }, [isOverlapping, isDragging, opacity]);

  // Dimensions
  const wallHeight = height * 0.6;
  const roofHeight = height * 0.4;
  const porchHeight = wallHeight * 0.3;
  const porchDepth = depth * 0.3;

  return (
    <group>
      {/* Main structure - walls */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, wallHeight, depth]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, wallHeight / 2 + roofHeight / 2, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[width * 0.8, roofHeight, 4]} />
        <primitive object={roofMaterial} attach="material" />
      </mesh>

      {/* Chimney */}
      <mesh
        position={[width * 0.3, wallHeight / 2 + roofHeight * 0.3, 0]}
        castShadow
      >
        <boxGeometry args={[width * 0.1, roofHeight * 0.8, depth * 0.1]} />
        <meshStandardMaterial color="#6B4423" opacity={opacity} transparent={isDragging} />
      </mesh>

      {/* Porch */}
      <group position={[0, -wallHeight / 2 + porchHeight / 2, depth / 2 + porchDepth / 2]}>
        {/* Porch floor */}
        <mesh receiveShadow>
          <boxGeometry args={[width * 0.8, 0.1, porchDepth]} />
          <primitive object={woodMaterial} attach="material" />
        </mesh>

        {/* Porch posts */}
        {[-width * 0.35, width * 0.35].map((x, i) => (
          <mesh key={i} position={[x, porchHeight / 2, porchDepth * 0.3]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, porchHeight, 8]} />
            <meshStandardMaterial color="#8B7355" opacity={opacity} transparent={isDragging} />
          </mesh>
        ))}

        {/* Porch roof */}
        <mesh position={[0, porchHeight, 0]} castShadow>
          <boxGeometry args={[width * 0.8, 0.1, porchDepth * 1.2]} />
          <primitive object={roofMaterial} attach="material" />
        </mesh>
      </group>

      {/* Windows - front */}
      {[-width * 0.25, width * 0.25].map((x, i) => (
        <mesh
          key={`window-front-${i}`}
          position={[x, wallHeight * 0.2, depth / 2 + 0.01]}
        >
          <planeGeometry args={[width * 0.15, wallHeight * 0.2]} />
          <meshStandardMaterial
            color="#87CEEB"
            opacity={opacity * 0.6}
            transparent
            emissive="#87CEEB"
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      {/* Door */}
      <mesh position={[0, -wallHeight * 0.15, depth / 2 + 0.01]}>
        <planeGeometry args={[width * 0.2, wallHeight * 0.4]} />
        <meshStandardMaterial
          color="#5D4E37"
          opacity={opacity}
          transparent={isDragging}
        />
      </mesh>

      {/* Door knob */}
      <mesh position={[width * 0.08, -wallHeight * 0.15, depth / 2 + 0.02]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial
          color="#FFD700"
          metalness={0.8}
          roughness={0.2}
          opacity={opacity}
          transparent={isDragging}
        />
      </mesh>

      {/* Foundation */}
      <mesh position={[0, -wallHeight / 2 - 0.1, 0]} receiveShadow>
        <boxGeometry args={[width * 1.05, 0.2, depth * 1.05]} />
        <meshStandardMaterial
          color="#696969"
          roughness={0.9}
          opacity={opacity}
          transparent={isDragging}
        />
      </mesh>
    </group>
  );
};
