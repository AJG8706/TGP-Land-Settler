// Simple Perlin noise implementation for terrain generation
// Based on Ken Perlin's improved noise algorithm

class PerlinNoise {
  private permutation: number[];
  private p: number[];

  constructor(seed?: number) {
    // Initialize permutation array
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }

    // Shuffle with seed
    if (seed !== undefined) {
      this.shuffle(this.permutation, seed);
    } else {
      this.shuffle(this.permutation);
    }

    // Duplicate for overflow
    this.p = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.p[i] = this.permutation[i % 256];
    }
  }

  private shuffle(array: number[], seed?: number): void {
    let currentIndex = array.length;
    let temporaryValue: number;
    let randomIndex: number;

    const random = seed !== undefined ? this.seededRandom(seed) : Math.random;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const a = this.p[X] + Y;
    const aa = this.p[a];
    const ab = this.p[a + 1];
    const b = this.p[X + 1] + Y;
    const ba = this.p[b];
    const bb = this.p[b + 1];

    return this.lerp(
      v,
      this.lerp(u, this.grad(this.p[aa], x, y), this.grad(this.p[ba], x - 1, y)),
      this.lerp(u, this.grad(this.p[ab], x, y - 1), this.grad(this.p[bb], x - 1, y - 1))
    );
  }
}

// Generate terrain heightmap
export const generateTerrainHeightMap = (
  width: number,
  height: number,
  scale: number = 0.1,
  octaves: number = 4,
  persistence: number = 0.5,
  lacunarity: number = 2,
  seed?: number
): number[][] => {
  const perlin = new PerlinNoise(seed);
  const heightMap: number[][] = [];

  for (let y = 0; y < height; y++) {
    heightMap[y] = [];
    for (let x = 0; x < width; x++) {
      let amplitude = 1;
      let frequency = 1;
      let noiseValue = 0;
      let maxValue = 0;

      // Multiple octaves for natural-looking terrain
      for (let i = 0; i < octaves; i++) {
        const sampleX = (x / width) * scale * frequency;
        const sampleY = (y / height) * scale * frequency;

        const perlinValue = perlin.noise(sampleX, sampleY);
        noiseValue += perlinValue * amplitude;
        maxValue += amplitude;

        amplitude *= persistence;
        frequency *= lacunarity;
      }

      // Normalize to 0-1 range
      heightMap[y][x] = (noiseValue / maxValue + 1) / 2;
    }
  }

  return heightMap;
};

// Smooth terrain heightmap
export const smoothHeightMap = (heightMap: number[][], iterations: number = 1): number[][] => {
  const height = heightMap.length;
  const width = heightMap[0].length;
  let result = heightMap.map((row) => [...row]);

  for (let iter = 0; iter < iterations; iter++) {
    const temp: number[][] = [];

    for (let y = 0; y < height; y++) {
      temp[y] = [];
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;

        // Average with neighbors
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;

            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              sum += result[ny][nx];
              count++;
            }
          }
        }

        temp[y][x] = sum / count;
      }
    }

    result = temp;
  }

  return result;
};

// Get height at specific world coordinates
export const getHeightAtPosition = (
  heightMap: number[][],
  x: number,
  z: number,
  terrainWidth: number,
  terrainDepth: number,
  maxHeight: number = 10
): number => {
  if (!heightMap || heightMap.length === 0) return 0;

  const height = heightMap.length;
  const width = heightMap[0].length;

  // Convert world coordinates to heightmap coordinates
  const mapX = ((x + terrainWidth / 2) / terrainWidth) * width;
  const mapZ = ((z + terrainDepth / 2) / terrainDepth) * height;

  // Clamp to bounds
  const gridX = Math.max(0, Math.min(width - 2, Math.floor(mapX)));
  const gridZ = Math.max(0, Math.min(height - 2, Math.floor(mapZ)));

  // Bilinear interpolation for smooth height
  const fractX = mapX - gridX;
  const fractZ = mapZ - gridZ;

  const h00 = heightMap[gridZ][gridX];
  const h10 = heightMap[gridZ][gridX + 1];
  const h01 = heightMap[gridZ + 1][gridX];
  const h11 = heightMap[gridZ + 1][gridX + 1];

  const h0 = h00 * (1 - fractX) + h10 * fractX;
  const h1 = h01 * (1 - fractX) + h11 * fractX;
  const finalHeight = h0 * (1 - fractZ) + h1 * fractZ;

  return finalHeight * maxHeight;
};
