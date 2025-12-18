import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useLandStore } from '../../store/useLandStore';

interface CameraSettings {
  // Pan settings
  edgePanThreshold: number;
  edgePanSpeed: number;
  keyboardPanSpeed: number;
  dragPanSensitivity: number;

  // Zoom settings
  zoomSpeed: number;
  minHeight: number;
  maxHeight: number;

  // Rotation settings
  rotationSpeed: number;
  keyRotationSpeed: number;

  // Boundaries
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;

  // Smoothing
  smoothSpeed: number;
}

const defaultSettings: CameraSettings = {
  edgePanThreshold: 20,
  edgePanSpeed: 20,
  keyboardPanSpeed: 30,
  dragPanSensitivity: 0.05,
  zoomSpeed: 2,
  minHeight: 10,
  maxHeight: 80,
  rotationSpeed: 2,
  keyRotationSpeed: 60,
  minX: -60,
  maxX: 60,
  minZ: -60,
  maxZ: 60,
  smoothSpeed: 8,
};

export const RTSCameraController = () => {
  const { camera, gl } = useThree();
  const isDraggingItem = useLandStore((state) => state.isDraggingItem);
  const isPlacementMode = useLandStore((state) => state.isPlacementMode);

  const settings = useRef(defaultSettings);

  // Camera state
  const targetPosition = useRef(new Vector3(0, 30, 0));
  const currentPosition = useRef(new Vector3(0, 30, 0));
  const targetRotation = useRef(0);
  const currentRotation = useRef(0);

  // Input state
  const mousePosition = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStartMouse = useRef({ x: 0, y: 0 });
  const dragStartCamera = useRef(new Vector3());
  const keysPressed = useRef<Set<string>>(new Set());

  // Update mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle middle-mouse drag panning
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Disable camera controls during placement or item dragging
      if (isPlacementMode || isDraggingItem) return;

      if (e.button === 1) { // Middle mouse button
        e.preventDefault();
        isDragging.current = true;
        dragStartMouse.current = { x: e.clientX, y: e.clientY };
        dragStartCamera.current.copy(targetPosition.current);
        gl.domElement.style.cursor = 'grabbing';
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        isDragging.current = false;
        gl.domElement.style.cursor = 'default';
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Prevent context menu on middle-click
      if (isDragging.current) {
        e.preventDefault();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isPlacementMode, isDraggingItem, gl]);

  // Handle scroll zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isPlacementMode || isDraggingItem) return;

      e.preventDefault();
      const delta = -e.deltaY * 0.01;
      const zoomAmount = delta * settings.current.zoomSpeed;

      const newY = targetPosition.current.y - zoomAmount;
      const clampedY = Math.max(
        settings.current.minHeight,
        Math.min(settings.current.maxHeight, newY)
      );

      targetPosition.current.y = clampedY;
    };

    const canvas = gl.domElement;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [isPlacementMode, isDraggingItem, gl]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main camera update loop
  useFrame((_, delta) => {
    if (isPlacementMode || isDraggingItem) return;

    const movement = new Vector3();

    // 1. Edge panning
    const { x: mouseX, y: mouseY } = mousePosition.current;
    const threshold = settings.current.edgePanThreshold;

    if (mouseX < threshold) {
      movement.x -= 1;
    } else if (mouseX > window.innerWidth - threshold) {
      movement.x += 1;
    }

    if (mouseY < threshold) {
      movement.z -= 1;
    } else if (mouseY > window.innerHeight - threshold) {
      movement.z += 1;
    }

    if (movement.length() > 0) {
      movement.normalize();
      movement.multiplyScalar(settings.current.edgePanSpeed * delta);

      // Apply rotation to movement
      const rotatedMovement = new Vector3(
        movement.x * Math.cos(currentRotation.current) - movement.z * Math.sin(currentRotation.current),
        0,
        movement.x * Math.sin(currentRotation.current) + movement.z * Math.cos(currentRotation.current)
      );

      targetPosition.current.add(rotatedMovement);
    }

    // 2. WASD/Arrow key panning
    const keyMovement = new Vector3();

    if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
      keyMovement.z -= 1;
    }
    if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
      keyMovement.z += 1;
    }
    if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
      keyMovement.x -= 1;
    }
    if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
      keyMovement.x += 1;
    }

    if (keyMovement.length() > 0) {
      keyMovement.normalize();

      // Check for sprint (Shift key)
      const sprintMultiplier = keysPressed.current.has('shift') ? 2.0 : 1.0;
      keyMovement.multiplyScalar(settings.current.keyboardPanSpeed * sprintMultiplier * delta);

      // Apply rotation to movement
      const rotatedKeyMovement = new Vector3(
        keyMovement.x * Math.cos(currentRotation.current) - keyMovement.z * Math.sin(currentRotation.current),
        0,
        keyMovement.x * Math.sin(currentRotation.current) + keyMovement.z * Math.cos(currentRotation.current)
      );

      targetPosition.current.add(rotatedKeyMovement);
    }

    // 3. Middle-mouse drag panning
    if (isDragging.current) {
      const { x: mouseX, y: mouseY } = mousePosition.current;
      const deltaX = (mouseX - dragStartMouse.current.x) * settings.current.dragPanSensitivity;
      const deltaY = (mouseY - dragStartMouse.current.y) * settings.current.dragPanSensitivity;

      // Apply rotation to drag movement
      const dragMovement = new Vector3(
        -deltaX * Math.cos(currentRotation.current) + deltaY * Math.sin(currentRotation.current),
        0,
        -deltaX * Math.sin(currentRotation.current) - deltaY * Math.cos(currentRotation.current)
      );

      targetPosition.current.copy(dragStartCamera.current).add(dragMovement);
    }

    // 4. Rotation with Q/E keys
    if (keysPressed.current.has('q')) {
      targetRotation.current -= settings.current.keyRotationSpeed * delta * (Math.PI / 180);
    }
    if (keysPressed.current.has('e')) {
      targetRotation.current += settings.current.keyRotationSpeed * delta * (Math.PI / 180);
    }

    // 5. Boundary enforcement
    targetPosition.current.x = Math.max(
      settings.current.minX,
      Math.min(settings.current.maxX, targetPosition.current.x)
    );
    targetPosition.current.z = Math.max(
      settings.current.minZ,
      Math.min(settings.current.maxZ, targetPosition.current.z)
    );

    // 6. Smooth interpolation
    currentPosition.current.lerp(targetPosition.current, settings.current.smoothSpeed * delta);
    currentRotation.current += (targetRotation.current - currentRotation.current) * settings.current.smoothSpeed * delta;

    // 7. Apply to camera
    const distance = 42; // Distance from look-at point
    const height = currentPosition.current.y;
    const angle = Math.PI / 6; // 30 degree angle looking down

    camera.position.set(
      currentPosition.current.x + distance * Math.sin(currentRotation.current) * Math.cos(angle),
      height,
      currentPosition.current.z + distance * Math.cos(currentRotation.current) * Math.cos(angle)
    );

    camera.lookAt(currentPosition.current);
  });

  return null;
};
