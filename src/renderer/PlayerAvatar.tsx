// ============================================================
// STYLIZED CEL-SHADED PLAYER AVATAR — Classic Cel-Animated Hero
// The Echo-Wielder: Heroic proportions, sculpted stylized face,
// multi-layer adventurer clothing, billowing cloak, glowing Echo amulet,
// detailed traveler boots, bracers, and stylized broadsword.
// Rendered with discrete toon shading ramps & subtle ink outlines.
// ============================================================

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../core/WorldState';
import {
  getToonGradient3,
  getStylizedFaceTexture,
  getStylizedMetalTexture,
  getInvertedHullOutlineMaterial,
} from './StylizedMaterials';

export default function PlayerAvatar() {
  const rootRef = useRef<THREE.Group>(null!);
  const hipsRef = useRef<THREE.Group>(null!);
  const spineRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const cloakRef = useRef<THREE.Group>(null!);
  const echoAmuletRef = useRef<THREE.MeshToonMaterial>(null!);

  const initialPlayer = useWorldStore.getState().player;
  const animPhase = useRef(0);
  const idlePhase = useRef(0);
  const attackTimer = useRef(0);
  const lastPos = useRef({ x: initialPlayer.position.x, z: initialPlayer.position.z });

  const toonRamp = useMemo(() => getToonGradient3(), []);
  const faceTexture = useMemo(() => getStylizedFaceTexture('#2a75d8', 'determined'), []);
  const bladeTexture = useMemo(() => getStylizedMetalTexture('#b8c4d2', '#ffffff'), []);
  const bronzeTexture = useMemo(() => getStylizedMetalTexture('#cfa84e', '#fff0aa'), []);
  const outlineMat = useMemo(() => getInvertedHullOutlineMaterial('#16101c'), []);

  const rippleRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (!rootRef.current) return;

    const player = useWorldStore.getState().player;
    const playerPos = player.position;
    const playerRot = player.rotationY;
    const isAttacking = player.isAttacking;
    const waterState = player.waterState || 'none';
    const isSwimming = waterState === 'swimming' || waterState === 'underwater';
    const isShallow = waterState === 'shallow';
    const inWater = isSwimming || isShallow;

    // Direct root sync
    rootRef.current.position.set(playerPos.x, playerPos.y, playerPos.z);
    rootRef.current.rotation.y = playerRot;

    // Detect movement
    const dx = playerPos.x - lastPos.current.x;
    const dz = playerPos.z - lastPos.current.z;
    const speed = Math.sqrt(dx * dx + dz * dz) / Math.max(0.001, delta);
    const isMoving = speed > 0.2;
    lastPos.current = { x: playerPos.x, z: playerPos.z };

    idlePhase.current += delta * 2.0;

    if (isMoving) {
      animPhase.current += delta * Math.min(14, speed * 2.4);
    } else {
      animPhase.current = THREE.MathUtils.lerp(animPhase.current, 0, 0.15);
    }

    const stride = Math.sin(animPhase.current);
    const bounce = Math.abs(Math.sin(animPhase.current)) * 0.08;

    // ── Water Surface Ripple Rings ──
    if (rippleRef.current) {
      rippleRef.current.visible = inWater;
      if (inWater) {
        rippleRef.current.position.y = -playerPos.y + 0.02;
        const rippleCycle = (state.clock.elapsedTime * (isMoving ? 2.2 : 1.1)) % 1;
        const s = 0.5 + rippleCycle * 1.8;
        rippleRef.current.scale.set(s, s, s);
      }
    }

    // ── Hips & Spine Dynamics ──
    if (hipsRef.current) {
      if (isSwimming) {
        hipsRef.current.position.y = 0.42 + Math.sin(idlePhase.current * 1.5) * 0.04;
        hipsRef.current.rotation.y = Math.sin(animPhase.current * 0.8) * 0.1;
      } else {
        hipsRef.current.position.y = isMoving ? 0.75 - bounce : 0.75 + Math.sin(idlePhase.current) * 0.015;
        hipsRef.current.rotation.y = isMoving ? -stride * 0.12 : 0;
      }
    }

    if (spineRef.current) {
      if (isSwimming) {
        // Horizontal swimming posture
        spineRef.current.rotation.x = THREE.MathUtils.lerp(spineRef.current.rotation.x, 1.22, 0.12);
      } else {
        spineRef.current.rotation.x = THREE.MathUtils.lerp(
          spineRef.current.rotation.x,
          isMoving ? 0.12 : Math.sin(idlePhase.current * 0.8) * 0.02,
          0.15
        );
      }
    }

    // ── Leg Locomotion & Flutter Kicks ──
    if (leftLegRef.current && rightLegRef.current) {
      if (isSwimming) {
        leftLegRef.current.rotation.x = Math.sin(animPhase.current * 1.8) * 0.45;
        rightLegRef.current.rotation.x = -Math.sin(animPhase.current * 1.8) * 0.45;
      } else {
        leftLegRef.current.rotation.x = stride * 0.65;
        rightLegRef.current.rotation.x = -stride * 0.65;
      }
    }

    // ── Cloak Billowing ──
    if (cloakRef.current) {
      const windSway = Math.sin(state.clock.elapsedTime * 4.0) * 0.08;
      const moveFlutter = isMoving ? 0.45 + Math.sin(animPhase.current * 2) * 0.15 : 0.08;
      cloakRef.current.rotation.x = isSwimming ? 1.1 + windSway : moveFlutter + windSway;
    }

    // ── Echo Amulet Pulse ──
    if (echoAmuletRef.current) {
      const pulse = 0.6 + Math.sin(state.clock.elapsedTime * 3.5) * 0.4;
      echoAmuletRef.current.emissiveIntensity = pulse;
    }

    // ── Arm Animation & Sword Attack ──
    if (isAttacking) {
      attackTimer.current = Math.min(1, attackTimer.current + delta * 9);
    } else {
      attackTimer.current = Math.max(0, attackTimer.current - delta * 6);
    }

    if (leftArmRef.current) {
      if (isSwimming) {
        leftArmRef.current.rotation.x = Math.cos(animPhase.current) * 0.6;
        leftArmRef.current.rotation.z = -0.4;
      } else {
        leftArmRef.current.rotation.x = -stride * 0.6;
        leftArmRef.current.rotation.z = -0.15 + (isMoving ? 0.1 : 0);
      }
    }

    if (rightArmRef.current) {
      if (attackTimer.current > 0) {
        // Dynamic slash arc
        const slash = Math.sin(attackTimer.current * Math.PI);
        rightArmRef.current.rotation.x = -0.6 - slash * 1.8;
        rightArmRef.current.rotation.y = -slash * 1.2;
        rightArmRef.current.rotation.z = 0.3 - slash * 0.6;
      } else if (isSwimming) {
        rightArmRef.current.rotation.x = Math.cos(animPhase.current) * 0.6;
        rightArmRef.current.rotation.y = 0;
        rightArmRef.current.rotation.z = 0.4;
      } else {
        rightArmRef.current.rotation.x = stride * 0.6;
        rightArmRef.current.rotation.y = 0;
        rightArmRef.current.rotation.z = 0.15;
      }
    }
  });

  return (
    <group ref={rootRef} name="playerAvatar" position={[initialPlayer.position.x, initialPlayer.position.y, initialPlayer.position.z]}>
      {/* Soft Ground Contact Shadow (hidden while submerged) */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Dynamic Water Surface Ripple Rings */}
      <group ref={rippleRef} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.6, 24]} />
          <meshBasicMaterial color="#b2f0ff" transparent opacity={0.65} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.9, 24]} />
          <meshBasicMaterial color="#7ad4fa" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* ── Humanoid Root / Hips ── */}
      <group ref={hipsRef} position={[0, 0.75, 0]}>
        {/* Belt & Waist */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.28, 0.16, 8]} />
          <meshToonMaterial color="#4a2e16" gradientMap={toonRamp} />
        </mesh>
        {/* Bronze Belt Buckle */}
        <mesh position={[0, 0, 0.24]} castShadow>
          <boxGeometry args={[0.12, 0.12, 0.04]} />
          <meshToonMaterial color="#cfa84e" map={bronzeTexture} gradientMap={toonRamp} />
        </mesh>
        {/* Adventurer Hip Pouch */}
        <mesh position={[0.24, -0.04, 0.08]} rotation={[0, 0.3, -0.1]} castShadow>
          <boxGeometry args={[0.12, 0.14, 0.1]} />
          <meshToonMaterial color="#3a2210" gradientMap={toonRamp} />
        </mesh>
        {/* Scabbard Sheath on Left Hip */}
        <mesh position={[-0.24, -0.15, 0]} rotation={[0.4, 0, -0.2]} castShadow>
          <boxGeometry args={[0.08, 0.65, 0.14]} />
          <meshToonMaterial color="#2d2218" gradientMap={toonRamp} />
        </mesh>

        {/* ── Upper Body (Spine, Torso, Neck, Head) ── */}
        <group ref={spineRef} position={[0, 0.08, 0]}>
          {/* Inner Azure Tunic */}
          <group position={[0, 0.25, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.25, 0.42, 8]} />
              <meshToonMaterial color="#24569e" gradientMap={toonRamp} />
            </mesh>
            {/* Subtle Cartoon Torso Silhouette Outline */}
            <mesh scale={[1.04, 1.03, 1.04]} material={outlineMat}>
              <cylinderGeometry args={[0.3, 0.25, 0.42, 8]} />
            </mesh>
          </group>

          {/* Leather Adventurer Vest / Jerkin */}
          <mesh position={[0, 0.26, 0.01]} castShadow>
            <cylinderGeometry args={[0.32, 0.27, 0.38, 8]} />
            <meshToonMaterial color="#5c381e" gradientMap={toonRamp} />
          </mesh>

          {/* Glowing Echo Amulet on Chest */}
          <group position={[0, 0.34, 0.28]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 0.03, 6]} />
              <meshToonMaterial color="#cfa84e" map={bronzeTexture} gradientMap={toonRamp} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <octahedronGeometry args={[0.045, 0]} />
              <meshToonMaterial
                ref={echoAmuletRef}
                color="#38f0d8"
                emissive="#20d8c0"
                emissiveIntensity={0.8}
                gradientMap={toonRamp}
              />
            </mesh>
          </group>

          {/* Shoulders / Pauldrons */}
          <mesh position={[-0.32, 0.42, 0]} rotation={[0, 0, 0.2]} castShadow>
            <sphereGeometry args={[0.12, 6, 5]} />
            <meshToonMaterial color="#3d2a1a" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0.32, 0.42, 0]} rotation={[0, 0, -0.2]} castShadow>
            <sphereGeometry args={[0.12, 6, 5]} />
            <meshToonMaterial color="#3d2a1a" gradientMap={toonRamp} />
          </mesh>

          {/* Flowing Traveler Cloak / Cape */}
          <group ref={cloakRef} position={[0, 0.44, -0.16]}>
            <group position={[0, -0.38, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.54, 0.78, 0.05]} />
                <meshToonMaterial color="#7a1f26" gradientMap={toonRamp} side={THREE.DoubleSide} />
              </mesh>
              {/* Cloak subtle outline */}
              <mesh scale={[1.04, 1.02, 1.3]} material={outlineMat}>
                <boxGeometry args={[0.54, 0.78, 0.05]} />
              </mesh>
            </group>
            {/* Lower flutter tip */}
            <mesh position={[0, -0.84, 0.02]} rotation={[0.15, 0, 0]} castShadow>
              <boxGeometry args={[0.5, 0.22, 0.04]} />
              <meshToonMaterial color="#6a1a20" gradientMap={toonRamp} side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* Neck */}
          <mesh position={[0, 0.48, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 0.12, 6]} />
            <meshToonMaterial color="#eac39d" gradientMap={toonRamp} />
          </mesh>

          {/* ── Head & Stylized Face ── */}
          <group ref={headRef} position={[0, 0.66, 0]}>
            {/* Sculpted Head Shape (faceted tapered chin) */}
            <mesh castShadow>
              <cylinderGeometry args={[0.22, 0.17, 0.32, 7]} />
              <meshToonMaterial color="#edd1b4" gradientMap={toonRamp} />
            </mesh>
            {/* Head Silhouette Outline */}
            <mesh scale={[1.05, 1.04, 1.05]} material={outlineMat}>
              <cylinderGeometry args={[0.22, 0.17, 0.32, 7]} />
            </mesh>

            {/* Stylized Face Decal Plane (Eyes, Eyebrows, Nose, Mouth) */}
            <mesh position={[0, 0.02, 0.19]} rotation={[0, 0, 0]}>
              <planeGeometry args={[0.3, 0.26]} />
              <meshBasicMaterial map={faceTexture} transparent depthWrite={false} />
            </mesh>

            {/* Ears */}
            <mesh position={[-0.2, 0.02, 0]} rotation={[0, -0.2, 0]}>
              <boxGeometry args={[0.05, 0.1, 0.07]} />
              <meshToonMaterial color="#e6c4a6" gradientMap={toonRamp} />
            </mesh>
            <mesh position={[0.2, 0.02, 0]} rotation={[0, 0.2, 0]}>
              <boxGeometry args={[0.05, 0.1, 0.07]} />
              <meshToonMaterial color="#e6c4a6" gradientMap={toonRamp} />
            </mesh>

            {/* Traveler Bandana / Headband */}
            <mesh position={[0, 0.12, 0.02]} castShadow>
              <cylinderGeometry args={[0.23, 0.23, 0.07, 8]} />
              <meshToonMaterial color="#f0ede6" gradientMap={toonRamp} />
            </mesh>

            {/* Stylized Adventurer Hair (Warm Auburn/Copper Tufts) */}
            {/* Top crown */}
            <mesh position={[0, 0.22, -0.02]} castShadow>
              <sphereGeometry args={[0.24, 7, 6]} />
              <meshToonMaterial color="#943622" gradientMap={toonRamp} />
            </mesh>
            {/* Swept bangs front */}
            <mesh position={[0.06, 0.18, 0.16]} rotation={[0.4, 0.2, -0.3]} castShadow>
              <coneGeometry args={[0.1, 0.22, 4]} />
              <meshToonMaterial color="#882e1c" gradientMap={toonRamp} />
            </mesh>
            <mesh position={[-0.08, 0.19, 0.15]} rotation={[0.35, -0.15, 0.2]} castShadow>
              <coneGeometry args={[0.09, 0.2, 4]} />
              <meshToonMaterial color="#943622" gradientMap={toonRamp} />
            </mesh>
            {/* Back hair strands */}
            <mesh position={[0, 0.05, -0.18]} rotation={[-0.25, 0, 0]} castShadow>
              <boxGeometry args={[0.34, 0.28, 0.14]} />
              <meshToonMaterial color="#7a2818" gradientMap={toonRamp} />
            </mesh>
          </group>

          {/* ── Left Arm (Shoulder, Bicep, Forearm, Hand) ── */}
          <group ref={leftArmRef} position={[-0.36, 0.38, 0]}>
            {/* Sleeve */}
            <mesh position={[0, -0.14, 0]} castShadow>
              <cylinderGeometry args={[0.11, 0.1, 0.26, 6]} />
              <meshToonMaterial color="#24569e" gradientMap={toonRamp} />
            </mesh>
            {/* Leather Forearm Bracer */}
            <mesh position={[0, -0.32, 0]} castShadow>
              <cylinderGeometry args={[0.095, 0.085, 0.22, 6]} />
              <meshToonMaterial color="#4a2e16" gradientMap={toonRamp} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.48, 0]} castShadow>
              <boxGeometry args={[0.11, 0.13, 0.08]} />
              <meshToonMaterial color="#edd1b4" gradientMap={toonRamp} />
            </mesh>
          </group>

          {/* ── Right Arm with Stylized Fantasy Broadsword ── */}
          <group ref={rightArmRef} position={[0.36, 0.38, 0]}>
            {/* Sleeve */}
            <mesh position={[0, -0.14, 0]} castShadow>
              <cylinderGeometry args={[0.11, 0.1, 0.26, 6]} />
              <meshToonMaterial color="#24569e" gradientMap={toonRamp} />
            </mesh>
            {/* Leather Forearm Bracer */}
            <mesh position={[0, -0.32, 0]} castShadow>
              <cylinderGeometry args={[0.095, 0.085, 0.22, 6]} />
              <meshToonMaterial color="#4a2e16" gradientMap={toonRamp} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.48, 0]} castShadow>
              <boxGeometry args={[0.11, 0.13, 0.08]} />
              <meshToonMaterial color="#edd1b4" gradientMap={toonRamp} />
            </mesh>

            {/* ── Stylized Steel Broadsword in Hand ── */}
            <group position={[0, -0.5, 0.1]} rotation={[Math.PI / 2.8, 0, 0]}>
              {/* Bronze Crossguard */}
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.38, 0.06, 0.08]} />
                <meshToonMaterial color="#cfa84e" map={bronzeTexture} gradientMap={toonRamp} />
              </mesh>
              {/* Leather Wrapped Hilt */}
              <mesh position={[0, -0.14, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.045, 0.24, 6]} />
                <meshToonMaterial color="#3a2214" gradientMap={toonRamp} />
              </mesh>
              {/* Bronze Pommel */}
              <mesh position={[0, -0.28, 0]} castShadow>
                <sphereGeometry args={[0.06, 6, 5]} />
                <meshToonMaterial color="#cfa84e" map={bronzeTexture} gradientMap={toonRamp} />
              </mesh>
              {/* Tapered Cel Blade with Inverted Outline */}
              <group position={[0, 0.46, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[0.1, 0.86, 0.03]} />
                  <meshToonMaterial color="#d2d8e0" map={bladeTexture} gradientMap={toonRamp} />
                </mesh>
                <mesh scale={[1.08, 1.02, 1.3]} material={outlineMat}>
                  <boxGeometry args={[0.1, 0.86, 0.03]} />
                </mesh>
              </group>
              {/* Blade Tip */}
              <mesh position={[0, 0.94, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
                <boxGeometry args={[0.07, 0.07, 0.03]} />
                <meshToonMaterial color="#d2d8e0" map={bladeTexture} gradientMap={toonRamp} />
              </mesh>
            </group>
          </group>
        </group>

        {/* ── Left Leg & Cuffed Boot ── */}
        <group ref={leftLegRef} position={[-0.14, -0.08, 0]}>
          {/* Trousers (Dark Azure / Slate) */}
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.1, 0.38, 6]} />
            <meshToonMaterial color="#1a355e" gradientMap={toonRamp} />
          </mesh>
          {/* Boot Shaft */}
          <mesh position={[0, -0.42, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.09, 0.28, 6]} />
            <meshToonMaterial color="#3d2616" gradientMap={toonRamp} />
          </mesh>
          {/* Boot Foot with Sole */}
          <mesh position={[0, -0.56, 0.08]} castShadow>
            <boxGeometry args={[0.14, 0.12, 0.24]} />
            <meshToonMaterial color="#321e10" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.61, 0.08]}>
            <boxGeometry args={[0.15, 0.04, 0.26]} />
            <meshToonMaterial color="#1d130a" gradientMap={toonRamp} />
          </mesh>
        </group>

        {/* ── Right Leg & Cuffed Boot ── */}
        <group ref={rightLegRef} position={[0.14, -0.08, 0]}>
          {/* Trousers */}
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.1, 0.38, 6]} />
            <meshToonMaterial color="#1a355e" gradientMap={toonRamp} />
          </mesh>
          {/* Boot Shaft */}
          <mesh position={[0, -0.42, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.09, 0.28, 6]} />
            <meshToonMaterial color="#3d2616" gradientMap={toonRamp} />
          </mesh>
          {/* Boot Foot with Sole */}
          <mesh position={[0, -0.56, 0.08]} castShadow>
            <boxGeometry args={[0.14, 0.12, 0.24]} />
            <meshToonMaterial color="#321e10" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.61, 0.08]}>
            <boxGeometry args={[0.15, 0.04, 0.26]} />
            <meshToonMaterial color="#1d130a" gradientMap={toonRamp} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
