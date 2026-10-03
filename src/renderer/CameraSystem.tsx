import { useRef, useEffect, useState, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../core/WorldState';
import { useCampaignStore } from '../campaign/CampaignSystem';
import { getTerrainHeight, getDistanceToRiver } from '../core/terrain';
import { resolveCollision } from '../core/collision';
import { navState } from '../core/navState';
import {
  getWaterState,
  getRiverCurrent,
  getTerrainSlope,
  stepDynamicProps,
  applyAttackToProps,
  WATER_SURFACE_Y,
} from '../core/physicsWorld';
import {
  playFootstep,
  playLanding,
  playWaterSplash,
  playSwimStroke,
  setUnderwaterAudio,
  updateWaterAmbience,
  stopWaterAmbience,
  playCombatHit,
  playDestructionSound,
  setTensionHeartbeat,
} from '../core/soundFX';
import type { WaterDepthState } from '../core/types';
import { liveEntityTransforms } from './EntityMesh';
import { useEchoTreeStore } from '../core/echoTreeState';
import { isActionHeld, matchesAction } from '../core/controls/InputManager';


// Reusable scratch vectors to avoid per-frame allocations & GC pauses
const _scratchForward = new THREE.Vector3();
const _scratchRight = new THREE.Vector3();
const _scratchUp = new THREE.Vector3(0, 1, 0);
const _scratchTargetCam = new THREE.Vector3();
const _scratchLookTarget = new THREE.Vector3();
const _scratchGroundPlane = new THREE.Plane();
const _scratchHitPoint = new THREE.Vector3();

function getEntityHeadHeight(entity: any): number {
  if (!entity) return 1.54;
  if (entity.isPlayer) return 1.56;
  const name = (entity.name || '').toLowerCase();
  if (name.includes('vorn')) return 1.68;
  if (name.includes('aldric')) return 1.64;
  if (name.includes('mira')) return 1.52;
  if (name.includes('rowan')) return 1.54;
  if (entity.type === 'dragon') return 2.8;
  if (entity.type === 'wolf' || entity.type === 'sheep') return 0.7;
  return 1.54;
}

export type CameraMode = 'orbit' | 'firstPerson';

export interface CameraCue {
  id: string;
  duration: number; // in seconds
  camPos: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
}

export const activeCameraCue: { current: (CameraCue & { startTime: number }) | null } = { current: null };

export function triggerCameraCue(cue: CameraCue) {
  activeCameraCue.current = {
    ...cue,
    startTime: performance.now(),
  };
}

interface CameraSystemProps {
  onModeChange?: (mode: CameraMode) => void;
  isCinematic?: boolean;
  isPaused?: boolean;
}

export default function CameraSystem({
  onModeChange,
  isCinematic = false,
  isPaused = false,
}: CameraSystemProps) {
  const [mode, setMode] = useState<CameraMode>('firstPerson');
  const modeRef = useRef<CameraMode>('firstPerson');
  const orbitRef = useRef<any>(null);
  const { camera, gl } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 1.5, 0));

  // Dialogue Camera State & Smooth Transition Blend
  const lastConversingNpcRef = useRef<any>(null);
  const wasDialogueActiveRef = useRef(false);
  const dialogueExitBlendRef = useRef(0);

  // Active pressed keys set — lowercase
  const activeKeys = useRef<Set<string>>(new Set());

  // ── Third-Person Avatar Movement & Physics State ─────────────
  const playerPhys = useRef({
    x: 0,
    y: 2.5,
    z: 8,
    vx: 0,
    vy: 0,
    vz: 0,
    isGrounded: true,
    wasGrounded: true,
    waterState: 'none' as WaterDepthState,
    lastWaterState: 'none' as WaterDepthState,
    lastWaterTransitionTime: 0,
    yaw: Math.PI, // Face North towards kingdoms and river by default
    pitch: 0.28,  // slight downward over-the-shoulder look
    rotY: Math.PI,
    footstepDist: 0,
    swimStrokeTimer: 0,
    isPointerLocked: false,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  const lastSyncedTransform = useRef({
    x: 0,
    y: 0,
    z: 0,
    rotY: 0,
    isGrounded: true,
    waterState: 'none' as WaterDepthState,
  });

  const timelineRestoreVersion = useWorldStore((s) => s.timelineRestoreVersion);
  const lastRestoreRef = useRef(0);

  // Sync initial position from store & cleanup sound loops on unmount
  useEffect(() => {
    const p = useWorldStore.getState().player.position;
    playerPhys.current.x = p.x;
    playerPhys.current.y = p.y;
    playerPhys.current.z = p.z;
    onModeChange?.('firstPerson');
    return () => {
      stopWaterAmbience();
    };
  }, [onModeChange]);

  // Sync physics on timeline rewind or branch restore
  useEffect(() => {
    if (timelineRestoreVersion > 0 && timelineRestoreVersion !== lastRestoreRef.current) {
      lastRestoreRef.current = timelineRestoreVersion;
      const p = useWorldStore.getState().player;
      playerPhys.current.x = p.position.x;
      playerPhys.current.y = p.position.y;
      playerPhys.current.z = p.position.z;
      playerPhys.current.yaw = p.rotationY;
      playerPhys.current.rotY = p.rotationY;
      playerPhys.current.vy = 0;
      playerPhys.current.isGrounded = p.isGrounded;
    }
  }, [timelineRestoreVersion]);

  // ── Switch to Third-Person Avatar View ───────────────────────
  const switchToAvatar = useCallback(() => {
    // Derive yaw from current orbit camera if available
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0.001) {
      forward.normalize();
      playerPhys.current.yaw = Math.atan2(forward.x, forward.z);
    }

    modeRef.current = 'firstPerson';
    setMode('firstPerson');
    onModeChange?.('firstPerson');

    try {
      gl.domElement.requestPointerLock?.();
    } catch (_) {}
  }, [camera, gl, onModeChange]);

  // ── Switch to God / Orbit View ──────────────────────────────
  const switchToOrbit = useCallback(() => {
    const phys = playerPhys.current;
    const targetPos = new THREE.Vector3(phys.x, phys.y + 0.5, phys.z);
    const camPos = new THREE.Vector3(phys.x, phys.y + 22, phys.z + 32);

    camera.position.copy(camPos);
    camera.lookAt(targetPos);

    if (orbitRef.current) {
      orbitRef.current.target.copy(targetPos);
    }

    modeRef.current = 'orbit';
    setMode('orbit');
    onModeChange?.('orbit');

    try {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } catch (_) {}

    activeKeys.current.clear();
    phys.isPointerLocked = false;
    phys.isDragging = false;
  }, [camera, onModeChange]);

  // ── Physical Combat & Action Attack ─────────────────────────
  const performAttack = useCallback(() => {
    const store = useWorldStore.getState();
    store.updatePlayer({ isAttacking: true });
    playCombatHit();

    setTimeout(() => {
      useWorldStore.getState().updatePlayer({ isAttacking: false });
    }, 240);

    const phys = playerPhys.current;
    const forwardX = Math.sin(phys.yaw);
    const forwardZ = Math.cos(phys.yaw);

    // 1. Attack Dynamic Physical Props (crates, barrels, rocks)
    if (store.dynamicProps) {
      const { updatedProps, hitCount } = applyAttackToProps(
        store.dynamicProps,
        { x: phys.x, y: phys.y, z: phys.z },
        forwardX,
        forwardZ,
        2.6
      );
      if (hitCount > 0) {
        store.setDynamicProps(updatedProps);
      }
    }

    // 2. Destructible Structure Interaction: Bridge at (-8, 5)
    if (!store.bridgeDestroyed) {
      const distToBridge = Math.hypot(phys.x - (-8), phys.z - 5);
      if (distToBridge < 4.8) {
        store.setBridgeDestroyed(true);
        playDestructionSound();
      }
    }

    // 3. Hit Detection & Knockback Feedback on Characters / Creatures
    const hitReach = 2.6;
    for (const [id, entity] of Object.entries(store.entities)) {
      if (entity.category === 'structure') continue;
      const dx = entity.position.x - phys.x;
      const dz = entity.position.z - phys.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < hitReach * hitReach) {
        const dot = dx * forwardX + dz * forwardZ;
        if (dot > 0.3) {
          // Directional knockback impulse
          const knockX = entity.position.x + forwardX * 2.2;
          const knockZ = entity.position.z + forwardZ * 2.2;
          const newHealth = Math.max(0, entity.health - 25);

          store.updateEntity(id, {
            position: {
              x: knockX,
              y: getTerrainHeight(knockX, knockZ) + 0.05,
              z: knockZ,
            },
            health: newHealth,
            isStaggered: true,
            isCollapsed: newHealth === 0,
            knockback: { vx: forwardX * 4.5, vz: forwardZ * 4.5, timer: 0.35 },
          });

          // Un-stagger after recoil animation
          setTimeout(() => {
            useWorldStore.getState().updateEntity(id, { isStaggered: false });
          }, 360);
          break;
        }
      }
    }
  }, []);

  // ── Global Keyboard Input ───────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      const isDialogueActive = Boolean(useCampaignStore.getState().activeDialogue);
      if (isDialogueActive || isCinematic || isPaused) {
        activeKeys.current.clear();
        return;
      }

      const k = e.key.toLowerCase();
      const code = e.code.toLowerCase();

      // Toggle God View vs Avatar View (Camera Toggle action)
      if (matchesAction('toggleCamera', e)) {
        e.preventDefault();
        if (modeRef.current === 'orbit') switchToAvatar();
        else switchToOrbit();
        return;
      }

      // Camera Reset action
      if (matchesAction('cameraReset', e)) {
        e.preventDefault();
        playerPhys.current.pitch = 0.28;
        playerPhys.current.yaw = playerPhys.current.rotY;
        return;
      }

      // Jump in Avatar View or Swim Up in Water (Jump action)
      if (matchesAction('jump', e) && modeRef.current === 'firstPerson') {
        const p = playerPhys.current;
        if (p.waterState === 'swimming' || p.waterState === 'underwater') {
          p.vy = 3.6; // Swim upward
        } else if (p.isGrounded) {
          p.vy = 8.5; // Jump arc
          p.isGrounded = false;
        }
      }

      // Dive / descend in Water (C key)
      if ((k === 'c' || code === 'keyc') && modeRef.current === 'firstPerson') {
        const p = playerPhys.current;
        if (p.waterState === 'swimming' || p.waterState === 'underwater') {
          p.vy = -3.2; // Dive down
        }
      }

      // Attack / Action with F
      if (k === 'f' || code === 'keyf') {
        performAttack();
      }

      activeKeys.current.add(k);
      activeKeys.current.add(code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const code = e.code.toLowerCase();
      activeKeys.current.delete(k);
      activeKeys.current.delete(code);
    };

    const onBlur = () => {
      activeKeys.current.clear();
      playerPhys.current.isDragging = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [switchToAvatar, switchToOrbit, performAttack]);

  // ── Mouse Look for Third-Person Avatar ───────────────────────
  useEffect(() => {
    const dom = gl.domElement;

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onMouseDown = (e: MouseEvent) => {
      const isDialogueActive = Boolean(useCampaignStore.getState().activeDialogue);
      if (isDialogueActive || isCinematic || isPaused) return;
      if (modeRef.current !== 'firstPerson') return;

      // Left click attacks if pointer is already locked
      if (e.button === 0 && playerPhys.current.isPointerLocked) {
        performAttack();
      }

      playerPhys.current.isDragging = true;
      playerPhys.current.lastMouseX = e.clientX;
      playerPhys.current.lastMouseY = e.clientY;

      if (!playerPhys.current.isPointerLocked && e.button === 0) {
        try {
          dom.requestPointerLock?.();
        } catch (_) {}
      }
    };

    const onMouseUp = () => {
      playerPhys.current.isDragging = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const isDialogueActive = Boolean(useCampaignStore.getState().activeDialogue);
      if (isDialogueActive || isCinematic || isPaused) return;
      if (modeRef.current !== 'firstPerson') return;

      let dx = 0;
      let dy = 0;

      if (playerPhys.current.isPointerLocked) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (playerPhys.current.isDragging) {
        dx = e.clientX - playerPhys.current.lastMouseX;
        dy = e.clientY - playerPhys.current.lastMouseY;
        playerPhys.current.lastMouseX = e.clientX;
        playerPhys.current.lastMouseY = e.clientY;
      }

      if (dx !== 0 || dy !== 0) {
        const sensitivity = 0.0032;
        // Moving mouse right (dx > 0) turns camera right (increases yaw)
        playerPhys.current.yaw += dx * sensitivity;
        // Moving mouse up (dy < 0) pitches camera up to look down
        playerPhys.current.pitch -= dy * sensitivity;

        // Clamp pitch so camera stays comfortably behind avatar
        playerPhys.current.pitch = THREE.MathUtils.clamp(
          playerPhys.current.pitch,
          -0.35, // looking up
          1.25   // looking down from above
        );
      }
    };

    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      dom.removeEventListener('contextmenu', onContextMenu);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [gl, performAttack]);

  // ── Pointer Lock State Tracking ─────────────────────────────
  useEffect(() => {
    const onLockChange = () => {
      playerPhys.current.isPointerLocked = document.pointerLockElement === gl.domElement;
    };
    document.addEventListener('pointerlockchange', onLockChange);
    return () => document.removeEventListener('pointerlockchange', onLockChange);
  }, [gl]);

  // ── Zoom-To-Cursor (God / Orbit View) ────────────────────────
  useEffect(() => {
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onWheel = (e: WheelEvent) => {
      if (modeRef.current !== 'orbit' || !orbitRef.current) return;

      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const currentTarget = orbitRef.current.target as THREE.Vector3;
      _scratchGroundPlane.setComponents(0, 1, 0, -currentTarget.y);
      const hit = raycaster.ray.intersectPlane(_scratchGroundPlane, _scratchHitPoint);

      if (hit) {
        const isZoomingIn = e.deltaY < 0;
        const factor = isZoomingIn ? 0.12 : -0.04;
        const shiftX = (_scratchHitPoint.x - currentTarget.x) * factor;
        const shiftZ = (_scratchHitPoint.z - currentTarget.z) * factor;

        currentTarget.x += shiftX;
        currentTarget.z += shiftZ;
        currentTarget.y = getTerrainHeight(currentTarget.x, currentTarget.z) + 0.5;

        camera.position.x += shiftX;
        camera.position.z += shiftZ;

        orbitRef.current.update();
      }
    };

    dom.addEventListener('wheel', onWheel, { passive: true });
    return () => dom.removeEventListener('wheel', onWheel);
  }, [gl, camera]);

  // ── Frame Tick: Movement Update for BOTH God & Avatar Modes ──
  useFrame((_, delta) => {
    if (isPaused) {
      return;
    }

    if (isCinematic) {
      // Slow, sweeping panoramic orbit around the center of the world
      const t = Date.now() * 0.00012;
      const radius = 46;
      camera.position.x = Math.sin(t) * radius;
      camera.position.z = Math.cos(t) * radius;
      camera.position.y = 24;
      camera.lookAt(0, 3.5, 0);
      return;
    }

    const dt = Math.min(delta, 0.1);
    const keys = activeKeys.current;

    const isDialogueActive = Boolean(useCampaignStore.getState().activeDialogue);
    if (isDialogueActive) {
      keys.clear();
      playerPhys.current.isDragging = false;
      if (typeof document !== 'undefined' && document.pointerLockElement) {
        try { document.exitPointerLock?.(); } catch (_) {}
      }
    }

    const isW = isActionHeld('moveForward') || keys.has('w') || keys.has('keyw') || keys.has('arrowup');
    const isS = isActionHeld('moveBackward') || keys.has('s') || keys.has('keys') || keys.has('arrowdown');
    const isA = isActionHeld('moveLeft') || keys.has('a') || keys.has('keya') || keys.has('arrowleft');
    const isD = isActionHeld('moveRight') || keys.has('d') || keys.has('keyd') || keys.has('arrowright');
    const isShift = keys.has('shift') || keys.has('shiftleft') || keys.has('shiftright');

    // ── Mode 1: GOD / ORBIT VIEW — WASD PANS THE WORLD ────────
    if (modeRef.current === 'orbit' && orbitRef.current) {
      if (!isDialogueActive && !isCinematic && (isW || isS || isA || isD)) {
        camera.getWorldDirection(_scratchForward);
        _scratchForward.y = 0;
        _scratchForward.normalize();

        // Screen-right is forward x up in Three.js right-handed system
        _scratchRight.crossVectors(_scratchForward, _scratchUp).normalize();

        const panSpeed = (isShift ? 35 : 18) * dt;

        let moveX = 0;
        let moveZ = 0;

        if (isW) {
          moveX += _scratchForward.x * panSpeed;
          moveZ += _scratchForward.z * panSpeed;
        }
        if (isS) {
          moveX -= _scratchForward.x * panSpeed;
          moveZ -= _scratchForward.z * panSpeed;
        }
        if (isA) {
          moveX -= _scratchRight.x * panSpeed;
          moveZ -= _scratchRight.z * panSpeed;
        }
        if (isD) {
          moveX += _scratchRight.x * panSpeed;
          moveZ += _scratchRight.z * panSpeed;
        }

        const target = orbitRef.current.target as THREE.Vector3;
        target.x = THREE.MathUtils.clamp(target.x + moveX, -98, 98);
        target.z = THREE.MathUtils.clamp(target.z + moveZ, -98, 98);
        target.y = getTerrainHeight(target.x, target.z) + 0.5;

        camera.position.x += moveX;
        camera.position.z += moveZ;

        orbitRef.current.update();

        // Ambient river flow distance update in orbit view
        const camDistToRiver = getDistanceToRiver(camera.position.x, camera.position.z);
        updateWaterAmbience(camDistToRiver, 'none', 0);
      }
      return;
    }

    // ── Mode 2: THIRD-PERSON PLAYABLE AVATAR ───────────────────
    if (modeRef.current === 'firstPerson') {
      const phys = playerPhys.current;

      // 1. Current water state at avatar position with hysteresis support
      const currentWaterState = getWaterState(phys.x, phys.y, phys.z, phys.waterState);
      const isWaterSurfaceOrUnder = currentWaterState === 'swimming' || currentWaterState === 'underwater';

      // Water entry / exit splashes with debouncing (no rapid frame-by-frame triggers)
      const now = performance.now();
      const enteredWater = phys.lastWaterState === 'none' && currentWaterState !== 'none';
      const exitedWater = phys.lastWaterState !== 'none' && currentWaterState === 'none';

      if (enteredWater && now - phys.lastWaterTransitionTime > 450) {
        phys.lastWaterTransitionTime = now;
        playWaterSplash(0.85, 'entry');
      } else if (exitedWater && now - phys.lastWaterTransitionTime > 450) {
        phys.lastWaterTransitionTime = now;
        playWaterSplash(0.60, 'exit');
      }
      phys.lastWaterState = currentWaterState;
      phys.waterState = currentWaterState;

      // Underwater audio muffled lowpass filter & sub-aquatic pressure drone
      setUnderwaterAudio(currentWaterState === 'underwater');

      // Continuous natural water ambience & swimming movement layer
      const distToRiver = getDistanceToRiver(phys.x, phys.z);
      const currentSwimSpeed = Math.hypot(phys.vx, phys.vz);
      updateWaterAmbience(distToRiver, currentWaterState, currentSwimSpeed);

      // Tension / Combat heartbeat audio
      const currentChaos = useWorldStore.getState().chaosScore;
      const isM3Active = useCampaignStore.getState().activeMissionId === 'm3_battle_for_the_mill';
      const isTensionActive = currentChaos > 35 || isM3Active;
      setTensionHeartbeat(isTensionActive, Math.min(125, 72 + Math.floor(currentChaos * 0.55)));

      let targetMoveX = 0;
      let targetMoveZ = 0;

      // Locomotion and turning are completely frozen during dialogue, cutscenes, or Echo Tree communion
      const isEchoTreeInteracting = useEchoTreeStore.getState().isInteracting;
      if (!isDialogueActive && !isCinematic && !isEchoTreeInteracting) {
        // Keyboard turning with Q/E
        const turnSpeed = 2.4 * dt;
        if (keys.has('q') || keys.has('keyq')) phys.yaw -= turnSpeed; // Q turns left
        if (keys.has('e') || keys.has('keye')) phys.yaw += turnSpeed; // E turns right

        // Camera horizontal forward & right vectors
        const fwdX = Math.sin(phys.yaw);
        const fwdZ = Math.cos(phys.yaw);
        const rgtX = -fwdZ;
        const rgtZ = fwdX;

        // Base speed modified by wading or swimming
        let moveSpeed = isShift ? 14.5 : 8.5;
        if (currentWaterState === 'shallow') moveSpeed *= 0.82; // wading drag
        else if (isWaterSurfaceOrUnder) moveSpeed *= 0.68; // swimming resistance

        if (isW) {
          targetMoveX += fwdX * moveSpeed;
          targetMoveZ += fwdZ * moveSpeed;
        }
        if (isS) {
          targetMoveX -= fwdX * moveSpeed;
          targetMoveZ -= fwdZ * moveSpeed;
        }
        if (isA) {
          targetMoveX -= rgtX * moveSpeed;
          targetMoveZ -= rgtZ * moveSpeed;
        }
        if (isD) {
          targetMoveX += rgtX * moveSpeed;
          targetMoveZ += rgtZ * moveSpeed;
        }

        // Vertical swimming via C or Space
        if (isWaterSurfaceOrUnder) {
          if (keys.has(' ') || keys.has('space')) {
            phys.vy = THREE.MathUtils.lerp(phys.vy, 3.4, 8 * dt);
          } else if (keys.has('c') || keys.has('keyc')) {
            phys.vy = THREE.MathUtils.lerp(phys.vy, -2.8, 8 * dt);
          }
        }

        // Smooth avatar heading with shortest angle wrapping (no 360 spin)
        if (targetMoveX !== 0 || targetMoveZ !== 0) {
          const targetHeading = Math.atan2(targetMoveX, targetMoveZ);
          let diff = (targetHeading - phys.rotY) % (Math.PI * 2);
          if (diff < -Math.PI) diff += Math.PI * 2;
          if (diff > Math.PI) diff -= Math.PI * 2;
          phys.rotY += diff * 0.25;
        }
      }

      // Acceleration / deceleration momentum
      const accelRate = isWaterSurfaceOrUnder ? 6 : 14;
      phys.vx = THREE.MathUtils.lerp(phys.vx, targetMoveX, accelRate * dt);
      phys.vz = THREE.MathUtils.lerp(phys.vz, targetMoveZ, accelRate * dt);

      // River Current Impulse
      if (currentWaterState !== 'none') {
        const current = getRiverCurrent(phys.x, phys.z);
        phys.vx += current.vx * 3.2 * dt;
        phys.vz += current.vz * 3.2 * dt;
      }

      // Slope sliding on steep hills (> 46 deg) when on land
      if (!isWaterSurfaceOrUnder && phys.isGrounded) {
        const slope = getTerrainSlope(phys.x, phys.z);
        if (slope.slopeAngleDeg > 46) {
          phys.vx += slope.slideX * 8.5 * dt;
          phys.vz += slope.slideZ * 8.5 * dt;
        }
      }

      // Candidate X and Z
      const moveX = phys.vx * dt;
      const moveZ = phys.vz * dt;
      const candX = phys.x + moveX;
      const candZ = phys.z + moveZ;

      // Small step & ledge climbing (up to 0.35m)
      const candGroundY = getTerrainHeight(candX, candZ);
      const stepDelta = candGroundY - phys.y;
      if (stepDelta > 0 && stepDelta <= 0.35 && phys.isGrounded) {
        phys.y += stepDelta * 0.5;
      }

      // Resolve obstacle collisions (walls, towers, rocks)
      const resolved = resolveCollision(candX, candZ, 0.45);
      phys.x = resolved.x;
      phys.z = resolved.z;

      // Vertical Gravity & Water Buoyancy
      const terrainGroundY = getTerrainHeight(phys.x, phys.z);
      phys.wasGrounded = phys.isGrounded;

      if (isWaterSurfaceOrUnder) {
        // Deep swimmable river
        phys.isGrounded = false;
        const surfaceLevel = WATER_SURFACE_Y - 0.25;

        // Upward buoyant force when below surface
        if (phys.y < surfaceLevel) {
          const depthBelow = surfaceLevel - phys.y;
          phys.vy += Math.min(6, depthBelow * 5.5) * dt;
        } else {
          // At surface level, gentle floating dampening
          phys.vy = THREE.MathUtils.lerp(phys.vy, 0, 8 * dt);
          if (phys.y > WATER_SURFACE_Y + 0.1) {
            phys.y = WATER_SURFACE_Y + 0.1;
          }
        }

        // Apply water vertical drag
        phys.vy *= 1 - 2.5 * dt;
        phys.y += phys.vy * dt;

        // Prevent swimming beneath riverbed terrain
        if (phys.y < terrainGroundY + 0.2) {
          phys.y = terrainGroundY + 0.2;
          phys.vy = Math.max(0, phys.vy);
        }

        // Periodic swim stroke sound synchronized with actual swimming movement
        const swimSpeed = Math.hypot(phys.vx, phys.vz);
        if (swimSpeed > 0.5) {
          phys.swimStrokeTimer += dt;
          if (phys.swimStrokeTimer > 0.75) {
            phys.swimStrokeTimer = 0;
            playSwimStroke();
          }
        } else {
          phys.swimStrokeTimer = 0;
        }
      } else {
        // On Land or Shallow Water
        if (!phys.isGrounded) {
          phys.vy -= 22 * dt; // Gravity acceleration
          phys.y += phys.vy * dt;

          if (phys.y <= terrainGroundY) {
            phys.y = terrainGroundY;

            // Landing sound: ONLY play landing impact on significant vertical velocity
            // (e.g. actual jumps or drops), never when walking across undulating riverbed slopes
            if (phys.vy < -3.5) {
              if (currentWaterState === 'shallow') {
                playWaterSplash(0.55, 'wading');
              } else {
                playLanding('grass');
              }
            }

            phys.vy = 0;
            phys.isGrounded = true;
          }
        } else {
          phys.y = terrainGroundY;
        }

        // Footstep audio pacing on ground / shallow water
        const walkSpeed = Math.hypot(phys.vx, phys.vz);
        if (phys.isGrounded && walkSpeed > 0.8) {
          phys.footstepDist += walkSpeed * dt;
          // In shallow water, strides are slightly longer and rhythmic (2.15m vs 1.9m)
          const strideDistance = currentWaterState === 'shallow' ? 2.15 : 1.9;
          if (phys.footstepDist > strideDistance) {
            phys.footstepDist = 0;
            if (currentWaterState === 'shallow') {
              playFootstep('water');
            } else {
              const isStone =
                (!useWorldStore.getState().bridgeDestroyed &&
                  Math.hypot(phys.x - (-8), phys.z - 5) < 5.5) ||
                Math.hypot(phys.x - (-4.5), phys.z - 9.5) < 7.0 ||
                Math.hypot(phys.x - 3, phys.z - 6) < 4.0 ||
                (phys.x > 8 && phys.z < -6 && phys.y > 6.0);
              playFootstep(isStone ? 'stone' : 'grass');
            }
          }
        }
      }

      // Step dynamic props simulation
      const currentProps = useWorldStore.getState().dynamicProps;
      if (currentProps) {
        const updatedProps = stepDynamicProps(
          currentProps,
          dt,
          { x: phys.x, y: phys.y, z: phys.z },
          0.55,
          { x: phys.vx, y: phys.vy, z: phys.vz }
        );
        useWorldStore.getState().setDynamicProps(updatedProps);
      }

      // Sync avatar transform to Zustand store only when significantly changed or stopped
      const last = lastSyncedTransform.current;
      const isStopped = Math.hypot(phys.vx, phys.vz) < 0.05;
      const posDistSq = (phys.x - last.x) ** 2 + (phys.y - last.y) ** 2 + (phys.z - last.z) ** 2;
      const changed =
        posDistSq > 0.0064 || // > 8cm displacement
        Math.abs(phys.rotY - last.rotY) > 0.08 ||
        (isStopped && posDistSq > 0.0001) ||
        phys.isGrounded !== last.isGrounded ||
        phys.waterState !== last.waterState;

      if (changed) {
        last.x = phys.x;
        last.y = phys.y;
        last.z = phys.z;
        last.rotY = phys.rotY;
        last.isGrounded = phys.isGrounded;
        last.waterState = phys.waterState;

        useWorldStore.getState().updatePlayer({
          position: { x: phys.x, y: phys.y, z: phys.z },
          rotationY: phys.rotY,
          velocity: { x: phys.vx, y: phys.vy, z: phys.vz },
          isGrounded: phys.isGrounded,
          waterState: phys.waterState,
        });
      }

      // ── Smooth Third-Person Camera Follow & Cinematic Dialogue Framing ──
      const activeDialogue = useCampaignStore.getState().activeDialogue;
      const dialogueIndex = useCampaignStore.getState().dialogueLineIndex;
      const currentLine = activeDialogue?.lines[dialogueIndex];

      const isEchoTreeActive = useEchoTreeStore.getState().isInteracting;

      if (isEchoTreeActive) {
        wasDialogueActiveRef.current = true;
        dialogueExitBlendRef.current = 1.0;

        // Smoothly orient player to face the ancient trunk
        const toTreeX = -13.0 - phys.x;
        const toTreeZ = -1.5 - phys.z;
        if (Math.hypot(toTreeX, toTreeZ) > 0.1) {
          const targetPlayerRotY = Math.atan2(toTreeX, toTreeZ);
          phys.rotY = THREE.MathUtils.lerp(phys.rotY, targetPlayerRotY, 0.12);
          phys.yaw = THREE.MathUtils.lerp(phys.yaw, targetPlayerRotY, 0.12);
        }

        // Frame camera in low-angle contemplative view looking up at Echo Tree and player
        const camX = phys.x + 3.2;
        const camY = phys.y + 1.8;
        const camZ = phys.z + 3.6;
        const lookX = -13.0 * 0.6 + phys.x * 0.4;
        const lookY = phys.y + 3.2;
        const lookZ = -1.5 * 0.6 + phys.z * 0.4;

        _scratchTargetCam.set(camX, camY, camZ);
        _scratchLookTarget.set(lookX, lookY, lookZ);

        camera.position.lerp(_scratchTargetCam, 0.065);
        currentLookAt.current.lerp(_scratchLookTarget, 0.08);
        camera.lookAt(currentLookAt.current);
      } else if (activeDialogue) {
        wasDialogueActiveRef.current = true;
        dialogueExitBlendRef.current = 1.0;

        const worldEntities = useWorldStore.getState().entities;
        const lineSpeaker = currentLine?.speaker || '';
        const lineSpeakerLower = lineSpeaker.toLowerCase();
        const isInnerMonologue =
          lineSpeakerLower.includes('voice within') ||
          lineSpeakerLower.includes('subconscious') ||
          lineSpeakerLower.includes('inner') ||
          lineSpeakerLower.includes('thought') ||
          lineSpeakerLower.includes('narrator');

        const isPlayerSpeaker =
          isInnerMonologue ||
          lineSpeakerLower.includes('player') ||
          lineSpeakerLower.includes('you') ||
          currentLine?.cameraFocusEntity === 'player';

        // 1. Identify Conversing NPC (only for genuine multi-character dialogue)
        let conversingNpc: any = null;
        if (!isInnerMonologue) {
          const focusEntityId = currentLine?.cameraFocusEntity || activeDialogue.cameraFocusEntity;
          if (focusEntityId && focusEntityId !== 'player' && worldEntities[focusEntityId]) {
            conversingNpc = worldEntities[focusEntityId];
          }

          // Match current line speaker if not player
          if (!conversingNpc && !isPlayerSpeaker) {
            conversingNpc = Object.values(worldEntities).find((e) =>
              e.name && (lineSpeakerLower.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(lineSpeakerLower))
            );
          }

          // Search any line in the dialogue sequence for a named NPC
          if (!conversingNpc) {
            for (const line of activeDialogue.lines) {
              const spLower = line.speaker.toLowerCase();
              if (
                !spLower.includes('player') &&
                !spLower.includes('you') &&
                !spLower.includes('voice within') &&
                !spLower.includes('subconscious')
              ) {
                const match = Object.values(worldEntities).find((e) =>
                  e.name && (spLower.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(spLower))
                );
                if (match) {
                  conversingNpc = match;
                  break;
                }
              }
            }
          }

          // Cached conversational partner fallback if still active in scene
          if (!conversingNpc && lastConversingNpcRef.current) {
            conversingNpc = worldEntities[lastConversingNpcRef.current.id] || null;
          }
        }

        if (conversingNpc) {
          const live = liveEntityTransforms[conversingNpc.id];
          if (live) {
            conversingNpc = {
              ...conversingNpc,
              position: { x: live.x, y: live.y, z: live.z },
              heading: live.heading,
            };
          }
          lastConversingNpcRef.current = conversingNpc;
        }

        // 2. Identify Speaker & Listener objects
        const playerObj = {
          position: { x: phys.x, y: phys.y, z: phys.z },
          name: 'Player',
          isPlayer: true,
          heading: phys.rotY,
        };

        let speaker = isPlayerSpeaker ? playerObj : (conversingNpc || playerObj);
        let listener = isPlayerSpeaker ? (conversingNpc || playerObj) : playerObj;

        // Listener reaction close-up shot
        const shotType = currentLine?.shotType || activeDialogue.defaultShotType || 'closeUp';
        if (shotType === 'listenerCloseUp') {
          const temp = speaker;
          speaker = listener;
          listener = temp;
        }

        // Smoothly orient player toward the NPC during multi-character dialogue
        if (conversingNpc && !isInnerMonologue) {
          const toNpcX = conversingNpc.position.x - phys.x;
          const toNpcZ = conversingNpc.position.z - phys.z;
          if (Math.hypot(toNpcX, toNpcZ) > 0.15) {
            const targetPlayerRotY = Math.atan2(toNpcX, toNpcZ);
            phys.rotY = THREE.MathUtils.lerp(phys.rotY, targetPlayerRotY, 0.15);
            phys.yaw = THREE.MathUtils.lerp(phys.yaw, targetPlayerRotY, 0.15);
          }
        }

        // 3. Compute Direct Face-To-Face Portrait Camera Coordinates
        const Sx = speaker.position.x;
        const Sy = speaker.position.y;
        const Sz = speaker.position.z;
        const sHeadH = getEntityHeadHeight(speaker);
        const sHeadY = Sy + sHeadH;

        const Lx = listener.position.x;
        const Lz = listener.position.z;

        // Direction the speaker is facing (toward listener or their current heading)
        const dx = Lx - Sx;
        const dz = Lz - Sz;
        const rawDist = Math.hypot(dx, dz);

        let faceForwardX = 0;
        let faceForwardZ = 0;

        if (rawDist >= 0.5 && conversingNpc && !isInnerMonologue) {
          faceForwardX = dx / rawDist;
          faceForwardZ = dz / rawDist;
        } else {
          const speakerHeading = speaker.isPlayer ? phys.rotY : (speaker.heading ?? phys.rotY);
          faceForwardX = Math.sin(speakerHeading);
          faceForwardZ = Math.cos(speakerHeading);
        }

        const facePerpX = -faceForwardZ;
        const facePerpZ = faceForwardX;

        // Position camera directly in front of the speaker's face at portrait distance
        const camDist = 1.75; // Intimate close-up framing face and upper torso
        const subtleAngle = speaker.isPlayer ? -0.12 : 0.12; // Slight 4° natural cinematic angle

        let targetCamX = Sx + faceForwardX * camDist + facePerpX * subtleAngle;
        let targetCamZ = Sz + faceForwardZ * camDist + facePerpZ * subtleAngle;
        let targetCamY = sHeadY - 0.02;

        // Avoid obstacle & structure clipping
        const resolvedCam = resolveCollision(targetCamX, targetCamZ, 0.6);
        targetCamX = resolvedCam.x;
        targetCamZ = resolvedCam.z;

        // Avoid terrain clipping
        const terrainH = getTerrainHeight(targetCamX, targetCamZ);
        if (targetCamY < terrainH + 0.55) {
          targetCamY = terrainH + 0.55;
        }

        // Aim camera directly at speaker's eyes and face
        const targetLookX = Sx;
        const targetLookZ = Sz;
        const targetLookY = sHeadY - 0.04;

        // Smooth cinematic interpolation
        _scratchTargetCam.set(targetCamX, targetCamY, targetCamZ);
        _scratchLookTarget.set(targetLookX, targetLookY, targetLookZ);

        camera.position.lerp(_scratchTargetCam, 0.082);
        currentLookAt.current.lerp(_scratchLookTarget, 0.095);
        camera.lookAt(currentLookAt.current);
      } else if (activeCameraCue.current) {
        const cue = activeCameraCue.current;
        const elapsed = (performance.now() - cue.startTime) / 1000;
        if (elapsed > cue.duration || activeKeys.current.size > 0 || playerPhys.current.isDragging) {
          activeCameraCue.current = null;
        } else {
          dialogueExitBlendRef.current = 1.0;
          _scratchTargetCam.set(cue.camPos.x, cue.camPos.y, cue.camPos.z);
          _scratchLookTarget.set(cue.lookAt.x, cue.lookAt.y, cue.lookAt.z);
          camera.position.lerp(_scratchTargetCam, 0.075);
          currentLookAt.current.lerp(_scratchLookTarget, 0.085);
          camera.lookAt(currentLookAt.current);
        }
      } else {
        // Normal chase follow
        const chaseDist = 5.2;
        const targetLookY = phys.y + 1.25;

        const camX = phys.x - Math.sin(phys.yaw) * Math.cos(phys.pitch) * chaseDist;
        const rawCamY = phys.y + 1.2 + Math.sin(phys.pitch) * chaseDist;
        const camZ = phys.z - Math.cos(phys.yaw) * Math.cos(phys.pitch) * chaseDist;

        // Prevent camera from clipping through terrain ground
        const camTerrainY = getTerrainHeight(camX, camZ) + 0.6;
        const camY = Math.max(rawCamY, camTerrainY);

        if (dialogueExitBlendRef.current > 0.01) {
          // Smooth glide back to chase camera upon dialogue exit
          dialogueExitBlendRef.current = THREE.MathUtils.lerp(dialogueExitBlendRef.current, 0, 0.07);
          _scratchTargetCam.set(camX, camY, camZ);
          _scratchLookTarget.set(phys.x, targetLookY, phys.z);

          camera.position.lerp(_scratchTargetCam, 0.085);
          currentLookAt.current.lerp(_scratchLookTarget, 0.095);
          camera.lookAt(currentLookAt.current);
        } else {
          // Standard direct chase camera
          dialogueExitBlendRef.current = 0;
          camera.position.set(camX, camY, camZ);
          currentLookAt.current.set(phys.x, targetLookY, phys.z);
          camera.lookAt(phys.x, targetLookY, phys.z);
        }
      }
    }

    // ── Update real-time navigation telemetry for HUD Compass ──
    camera.getWorldDirection(_scratchForward);
    navState.yaw = Math.atan2(_scratchForward.x, -_scratchForward.z);
    navState.playerX = playerPhys.current.x;
    navState.playerY = playerPhys.current.y;
    navState.playerZ = playerPhys.current.z;
    navState.cameraX = camera.position.x;
    navState.cameraY = camera.position.y;
    navState.cameraZ = camera.position.z;
  });

  return (
    <>
      {mode === 'orbit' && (
        <OrbitControls
          ref={orbitRef}
          makeDefault
          target={[0, 1.5, 0]}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={0.05}
          minDistance={3}
          maxDistance={150}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={1.0}
          panSpeed={1.4}
          zoomSpeed={1.0}
        />
      )}
    </>
  );
}
