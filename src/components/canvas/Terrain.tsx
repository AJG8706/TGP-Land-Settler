import { useMemo, useRef, useEffect } from 'react';
import { Grid } from '@react-three/drei';
import { useLandStore } from '../../store/useLandStore';
import * as THREE from 'three';

export const Terrain = () => {
  const gridVisible = useLandStore((state) => state.gridVisible);
  const meshRef = useRef<THREE.Mesh>(null);
  const terrainHeightMap = useLandStore((state) => state.terrainHeightMap);
  const generateTerrain = useLandStore((state) => state.generateTerrain);

  // Generate terrain on mount if not exists
  useEffect(() => {
    if (!terrainHeightMap) {
      generateTerrain();
    }
  }, []);

  // Create terrain mesh
  const terrainSize = { width: 100, depth: 100 };
  const maxHeight = 10; // Maximum elevation in units

  // Create procedural grass-like texture
  const grassTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Base grass color
      ctx.fillStyle = '#4a7c3f';
      ctx.fillRect(0, 0, 512, 512);

      // Add variation with multiple shades of green
      const grassColors = ['#5a8c4f', '#3a6c2f', '#6a9c5f', '#4a7c3f', '#3d6d32'];

      // Create random grass patches
      for (let i = 0; i < 3000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 8 + 2;
        const color = grassColors[Math.floor(Math.random() * grassColors.length)];

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add some darker spots for depth
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 3 + 1;

        ctx.fillStyle = '#2a4c1f';
        ctx.globalAlpha = 0.2 + Math.random() * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add tiny bright spots for highlights
      for (let i = 0; i < 500; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 2 + 0.5;

        ctx.fillStyle = '#7aac6f';
        ctx.globalAlpha = 0.4 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    return texture;
  }, []);

  // Apply heightmap to terrain geometry
  useEffect(() => {
    if (meshRef.current && terrainHeightMap) {
      const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
      const positions = geometry.attributes.position;

      const heightMapHeight = terrainHeightMap.length;
      const heightMapWidth = terrainHeightMap[0]?.length || 0;

      if (heightMapWidth === 0) return;

      // Update vertex positions based on heightmap
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getY(i); // Y in plane geometry is Z in world

        // Convert world coordinates to heightmap coordinates
        const mapX = ((x + terrainSize.width / 2) / terrainSize.width) * heightMapWidth;
        const mapZ = ((z + terrainSize.depth / 2) / terrainSize.depth) * heightMapHeight;

        const gridX = Math.max(0, Math.min(heightMapWidth - 1, Math.floor(mapX)));
        const gridZ = Math.max(0, Math.min(heightMapHeight - 1, Math.floor(mapZ)));

        const height = terrainHeightMap[gridZ][gridX] * maxHeight;
        positions.setZ(i, height);
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  }, [terrainHeightMap]);

  return (
    <group>
      {/* Ground plane with grass texture and elevation */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        name="terrain"
      >
        <planeGeometry args={[terrainSize.width, terrainSize.depth, 50, 50]} />
        <meshStandardMaterial
          map={grassTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Brown earth block underneath the terrain */}
      <mesh position={[0, -10, 0]} receiveShadow castShadow>
        <boxGeometry args={[terrainSize.width, 20, terrainSize.depth]} />
        <meshStandardMaterial
          color="#5C4033"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Grid helper */}
      {gridVisible && (
        <Grid
          args={[terrainSize.width, terrainSize.depth]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6B8E23"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#556B2F"
          fadeDistance={100}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={false}
        />
      )}

      {/* Property boundary (example - can be customized) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[45, 50, 64]} />
        <meshBasicMaterial color="#FFD700" opacity={0.3} transparent />
      </mesh>
    </group>
  );
};
