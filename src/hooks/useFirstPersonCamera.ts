/**
 * First-Person Camera Controller for Cesium
 * 
 * Provides WASD movement and mouse-look controls for street-level navigation.
 */

import { useEffect, useRef, useCallback } from "react";
import {
  Viewer as CesiumViewer,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from "cesium";

export interface FirstPersonSettings {
  walkSpeed: "slow" | "medium" | "fast";
  eyeHeightMeters: number;
  mouseSensitivity: number;
}

const SPEED_VALUES = {
  slow: 2,      // 2 m/s (~4.5 mph walking)
  medium: 5,    // 5 m/s (~11 mph jogging)
  fast: 10,     // 10 m/s (~22 mph running)
};

export function useFirstPersonCamera(
  viewer: CesiumViewer | null,
  enabled: boolean,
  settings: FirstPersonSettings
) {
  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null);

  const speedMetersPerSecond = SPEED_VALUES[settings.walkSpeed];

  // Move forward in camera direction (projected onto ground plane)
  const moveForward = useCallback((distance: number) => {
    if (!viewer) return;
    
    const camera = viewer.camera;
    const direction = Cartesian3.clone(camera.direction);
    
    // Project direction onto ground plane (remove vertical component)
    const position = camera.positionCartographic;
    const surfaceNormal = viewer.scene.globe.ellipsoid.geodeticSurfaceNormalCartographic(position);
    const up = Cartesian3.fromElements(surfaceNormal.x, surfaceNormal.y, surfaceNormal.z);
    
    // Remove the up component from direction
    const dot = Cartesian3.dot(direction, up);
    const upScaled = Cartesian3.multiplyByScalar(up, dot, new Cartesian3());
    const groundDirection = Cartesian3.subtract(direction, upScaled, new Cartesian3());
    Cartesian3.normalize(groundDirection, groundDirection);
    
    // Move
    const offset = Cartesian3.multiplyByScalar(groundDirection, distance, new Cartesian3());
    const newPosition = Cartesian3.add(camera.position, offset, new Cartesian3());
    
    camera.setView({
      destination: newPosition,
      orientation: {
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll,
      },
    });
  }, [viewer]);

  // Move right (strafe)
  const moveRight = useCallback((distance: number) => {
    if (!viewer) return;
    
    const camera = viewer.camera;
    const right = Cartesian3.clone(camera.right);
    
    const offset = Cartesian3.multiplyByScalar(right, distance, new Cartesian3());
    const newPosition = Cartesian3.add(camera.position, offset, new Cartesian3());
    
    camera.setView({
      destination: newPosition,
      orientation: {
        heading: camera.heading,
        pitch: camera.pitch,
        roll: camera.roll,
      },
    });
  }, [viewer]);

  // Clamp camera height to eye level above terrain
  const clampToEyeLevel = useCallback(() => {
    if (!viewer) return;
    
    const camera = viewer.camera;
    const cartographic = camera.positionCartographic;
    
    // Get terrain height at current position (simplified - use 0 for flat terrain)
    const terrainHeight = 0;
    const targetHeight = terrainHeight + settings.eyeHeightMeters;
    
    if (Math.abs(cartographic.height - targetHeight) > 0.5) {
      const newPosition = Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        targetHeight
      );
      
      camera.setView({
        destination: newPosition,
        orientation: {
          heading: camera.heading,
          pitch: camera.pitch,
          roll: camera.roll,
        },
      });
    }
  }, [viewer, settings.eyeHeightMeters]);

  // Rotate camera (look around)
  const rotateCamera = useCallback((deltaYaw: number, deltaPitch: number) => {
    if (!viewer) return;
    
    const camera = viewer.camera;
    
    // Apply yaw (horizontal rotation)
    camera.rotateRight(deltaYaw);
    
    // Apply pitch (vertical rotation) with limits
    const currentPitch = CesiumMath.toDegrees(camera.pitch);
    const newPitch = currentPitch + CesiumMath.toDegrees(deltaPitch);
    
    // Limit pitch to prevent flipping
    if (newPitch > -85 && newPitch < 85) {
      camera.rotateUp(deltaPitch);
    }
  }, [viewer]);

  // Main animation loop
  useEffect(() => {
    if (!viewer || !enabled) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = timestamp;

      const distance = speedMetersPerSecond * deltaTime;

      // Handle movement based on keys pressed
      if (keysPressed.current.has("w") || keysPressed.current.has("arrowup")) {
        moveForward(distance);
      }
      if (keysPressed.current.has("s") || keysPressed.current.has("arrowdown")) {
        moveForward(-distance);
      }
      if (keysPressed.current.has("a") || keysPressed.current.has("arrowleft")) {
        moveRight(-distance);
      }
      if (keysPressed.current.has("d") || keysPressed.current.has("arrowright")) {
        moveRight(distance);
      }

      // Clamp to eye level
      clampToEyeLevel();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [viewer, enabled, speedMetersPerSecond, moveForward, moveRight, clampToEyeLevel]);

  // Keyboard event handlers
  useEffect(() => {
    if (!enabled) {
      keysPressed.current.clear();
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      keysPressed.current.clear();
    };
  }, [enabled]);

  // Mouse look handler
  useEffect(() => {
    if (!viewer || !enabled) {
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      return;
    }

    // Disable default camera controls
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableRotate = false;
    controller.enableTranslate = false;
    controller.enableZoom = false;
    controller.enableTilt = false;
    controller.enableLook = false;

    const handler = new ScreenSpaceEventHandler(viewer.canvas);
    handlerRef.current = handler;

    // Track mouse movement for look
    let lastX = 0;
    let lastY = 0;

    handler.setInputAction((movement: ScreenSpaceEventHandler.PositionedEvent) => {
      isDraggingRef.current = true;
      lastX = movement.position.x;
      lastY = movement.position.y;
    }, ScreenSpaceEventType.RIGHT_DOWN);

    handler.setInputAction(() => {
      isDraggingRef.current = false;
    }, ScreenSpaceEventType.RIGHT_UP);

    handler.setInputAction((movement: ScreenSpaceEventHandler.MotionEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = movement.endPosition.x - lastX;
      const deltaY = movement.endPosition.y - lastY;
      lastX = movement.endPosition.x;
      lastY = movement.endPosition.y;

      const yaw = -deltaX * settings.mouseSensitivity * 0.002;
      const pitch = -deltaY * settings.mouseSensitivity * 0.002;

      rotateCamera(yaw, pitch);
    }, ScreenSpaceEventType.MOUSE_MOVE);

    return () => {
      // Re-enable default controls when exiting
      controller.enableRotate = true;
      controller.enableTranslate = true;
      controller.enableZoom = true;
      controller.enableTilt = true;
      controller.enableLook = true;

      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
    };
  }, [viewer, enabled, settings.mouseSensitivity, rotateCamera]);

  return {
    moveForward,
    moveRight,
    rotateCamera,
  };
}
