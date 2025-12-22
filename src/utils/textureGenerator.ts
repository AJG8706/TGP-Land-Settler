import * as THREE from 'three';

/**
 * Procedural texture generator for painterly homestead style
 * Creates canvas-based textures that simulate hand-painted materials
 */

export class TextureGenerator {
  /**
   * Generate wood plank texture with visible grain and variation
   */
  static generateWoodTexture(
    width: number = 512,
    height: number = 512,
    baseColor: string = '#8B7355',
    grainColor: string = '#6B5345'
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    // Add wood grain
    const plankCount = 8;
    const plankHeight = height / plankCount;

    for (let i = 0; i < plankCount; i++) {
      const y = i * plankHeight;

      // Plank separation line
      ctx.strokeStyle = grainColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Wood grain lines
      for (let j = 0; j < 20; j++) {
        const grainY = y + Math.random() * plankHeight;
        const grainX = Math.random() * width;

        ctx.strokeStyle = grainColor;
        ctx.globalAlpha = Math.random() * 0.3 + 0.1;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(grainX - 20, grainY);
        ctx.quadraticCurveTo(
          grainX,
          grainY + (Math.random() - 0.5) * 5,
          grainX + 20,
          grainY
        );
        ctx.stroke();
      }
    }

    // Add subtle noise for texture
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
      ctx.fillRect(x, y, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Generate metal roof texture with corrugated pattern
   */
  static generateMetalRoofTexture(
    width: number = 512,
    height: number = 512,
    baseColor: string = '#8B8680',
    highlightColor: string = '#A8A49E'
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Base metallic color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    // Corrugation ridges
    const ridgeCount = 16;
    const ridgeWidth = width / ridgeCount;

    for (let i = 0; i < ridgeCount; i++) {
      const x = i * ridgeWidth;

      // Gradient for each ridge
      const gradient = ctx.createLinearGradient(x, 0, x + ridgeWidth, 0);
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(0.5, highlightColor);
      gradient.addColorStop(1, baseColor);

      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, ridgeWidth, height);
    }

    // Weathering and rust spots
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 10 + 5;

      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Generate foliage texture with organic variation
   */
  static generateFoliageTexture(
    width: number = 512,
    height: number = 512,
    baseColor: string = '#4A7C47',
    highlightColor: string = '#6B9F68'
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Base foliage color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    // Add organic clusters
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 20 + 10;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, highlightColor);
      gradient.addColorStop(1, baseColor);

      ctx.globalAlpha = Math.random() * 0.5 + 0.3;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add dark shadows for depth
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 15 + 5;

      ctx.fillStyle = '#2d4a2b';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Generate bark texture for tree trunks
   */
  static generateBarkTexture(
    width: number = 256,
    height: number = 512,
    baseColor: string = '#5D4E37',
    darkColor: string = '#3E2F21'
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Base bark color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    // Vertical bark lines
    for (let i = 0; i < 30; i++) {
      const x = (i / 30) * width;
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = Math.random() * 3 + 1;
      ctx.globalAlpha = Math.random() * 0.5 + 0.3;

      ctx.beginPath();
      ctx.moveTo(x, 0);

      let currentY = 0;
      while (currentY < height) {
        const nextY = currentY + Math.random() * 40 + 20;
        const nextX = x + (Math.random() - 0.5) * 10;
        ctx.lineTo(nextX, nextY);
        currentY = nextY;
      }

      ctx.stroke();
    }

    // Bark knots and texture
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radiusX = Math.random() * 8 + 4;
      const radiusY = Math.random() * 12 + 6;

      ctx.fillStyle = darkColor;
      ctx.beginPath();
      ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Generate water texture with ripples and transparency
   */
  static generateWaterTexture(
    width: number = 512,
    height: number = 512,
    baseColor: string = '#4A9FB8',
    deepColor: string = '#2E6B7F'
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Base water color gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(1, deepColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Ripple circles
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const maxRadius = Math.random() * 40 + 20;

      for (let r = 0; r < maxRadius; r += 5) {
        ctx.strokeStyle = '#fff';
        ctx.globalAlpha = (1 - r / maxRadius) * 0.3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Light reflections
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = Math.random() * 30 + 10;

      const reflectionGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      reflectionGradient.addColorStop(0, '#ffffff');
      reflectionGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = reflectionGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Generate normal map for added depth (simple version)
   */
  static generateNormalMap(
    width: number = 512,
    height: number = 512,
    strength: number = 0.5
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Default normal (pointing up)
    ctx.fillStyle = `rgb(128, 128, ${Math.floor(255 * strength)})`;
    ctx.fillRect(0, 0, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
}

/**
 * Material presets for different item types
 */
export const MaterialPresets = {
  woodenWall: () => ({
    map: TextureGenerator.generateWoodTexture(512, 512, '#C4A57B', '#8B7355'),
    normalMap: TextureGenerator.generateNormalMap(512, 512, 0.3),
    roughness: 0.8,
    metalness: 0.0,
  }),

  metalRoof: () => ({
    map: TextureGenerator.generateMetalRoofTexture(512, 512, '#8B8680', '#A8A49E'),
    normalMap: TextureGenerator.generateNormalMap(512, 512, 0.5),
    roughness: 0.4,
    metalness: 0.6,
  }),

  treeFoliage: () => ({
    map: TextureGenerator.generateFoliageTexture(512, 512, '#4A7C47', '#6B9F68'),
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: 0.95,
  }),

  treeBark: () => ({
    map: TextureGenerator.generateBarkTexture(256, 512, '#5D4E37', '#3E2F21'),
    normalMap: TextureGenerator.generateNormalMap(256, 512, 0.4),
    roughness: 0.95,
    metalness: 0.0,
  }),

  water: () => ({
    map: TextureGenerator.generateWaterTexture(512, 512, '#4A9FB8', '#2E6B7F'),
    transparent: true,
    opacity: 0.7,
    roughness: 0.1,
    metalness: 0.3,
  }),
};
