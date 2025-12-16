import { Grid } from '@react-three/drei';
import { useLandStore } from '../../store/useLandStore';

export const Terrain = () => {
  const gridVisible = useLandStore((state) => state.gridVisible);

  // Create terrain mesh
  const terrainSize = { width: 100, depth: 100 };

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[terrainSize.width, terrainSize.depth]} />
        <meshStandardMaterial color="#7CFC00" />
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
