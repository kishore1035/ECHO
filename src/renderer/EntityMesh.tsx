// ============================================================
// STYLIZED CEL-SHADED ENTITY MESHES — Classic Cel-Animated Fantasy
// Dedicated character designs with expressive faces, stylized silhouettes,
// discrete 3-step toon shading, and subtle ink outlines for:
// - Rowan the Miller
// - Mira the Seer
// - King Aldric the Just
// - Warlord Vorn the Ironclast
// - Suncrest Knights & Guards
// - Shadowfang Berserkers & Raiders
// - Villagers
// - Creatures: Sheep, Deer, Wolf, Dragon
// ============================================================

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../core/WorldState';
import { useCampaignStore } from '../campaign/CampaignSystem';
import { shouldWorldTimeProgress } from '../core/timeSystem';
import { getTerrainHeight, isWater } from '../core/terrain';
import { getWaterDepth } from '../core/physicsWorld';
import type { Entity } from '../core/types';
import StructureMesh from './StructureMesh';
import {
  getStylizedFaceTexture,
  getToonGradient3,
  getInvertedHullOutlineMaterial,
  getStylizedMetalTexture,
} from './StylizedMaterials';

// Global live entity transforms for camera framing & dialogue tracking
export const liveEntityTransforms: Record<string, { x: number; y: number; z: number; heading: number }> = {};

// ─── Faction visual styling ───────────────────────────────────

interface FactionStyle {
  primary: string;
  accent: string;
  trousers: string;
  metal: string;
}

const FACTION_STYLES: Record<string, FactionStyle> = {
  suncrest: { primary: '#245bb8', accent: '#f0c030', trousers: '#1c2838', metal: '#d0d8e2' },
  shadowfang: { primary: '#9e1e1e', accent: '#303030', trousers: '#1a1a1a', metal: '#3a3e44' },
  neutral: { primary: '#44784e', accent: '#d4a860', trousers: '#3d3022', metal: '#8a7860' },
};

// ────────────────────────────────────────────────────────────
// 1. ROWAN THE MILLER (Kind, Honest Village Craftsman)
// ────────────────────────────────────────────────────────────

function RowanMesh({ aiRef }: { aiRef: React.MutableRefObject<any> }) {
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Group>(null!);

  const toonRamp = useMemo(() => getToonGradient3(), []);
  const faceTexture = useMemo(() => getStylizedFaceTexture('#4a8838', 'kind'), []);
  const outlineMat = useMemo(() => getInvertedHullOutlineMaterial('#16101c'), []);

  useFrame((state) => {
    const s = Math.sin(aiRef.current.walkPhase * 6.5) * 0.45;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -s * 0.6;
    if (rightArmRef.current) rightArmRef.current.rotation.x = s * 0.6;
    if (leftLegRef.current) leftLegRef.current.rotation.x = s * 0.65;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -s * 0.65;

    // Conversational speaking head gesture during dialogue
    const activeDiag = useCampaignStore.getState().activeDialogue;
    const currentLine = activeDiag?.lines[useCampaignStore.getState().dialogueLineIndex];
    const isSpeaking = currentLine?.speaker.toLowerCase().includes('rowan');
    if (isSpeaking && headRef.current) {
      const talkPulse = Math.sin(state.clock.elapsedTime * 9.0) * 0.035 + Math.sin(state.clock.elapsedTime * 3.5) * 0.025;
      headRef.current.rotation.x = talkPulse;
      headRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2.2) * 0.02;
    } else if (headRef.current) {
      headRef.current.rotation.x = 0;
      headRef.current.rotation.z = 0;
    }
  });

  return (
    <group position={[0, 0.72, 0]}>
      {/* ── Waist & Belt ── */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.28, 0.16, 8]} />
        <meshToonMaterial color="#3a2414" gradientMap={toonRamp} />
      </mesh>
      {/* Tool Pouch / Flour bag */}
      <mesh position={[0.24, -0.06, 0.08]} rotation={[0, 0.2, -0.1]} castShadow>
        <boxGeometry args={[0.14, 0.16, 0.12]} />
        <meshToonMaterial color="#eae2d4" gradientMap={toonRamp} />
      </mesh>

      {/* ── Torso: Rolled-sleeve Linen Shirt + Heavy Leather Apron ── */}
      <group position={[0, 0.08, 0]}>
        {/* Linen shirt with subtle outline */}
        <group position={[0, 0.25, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.31, 0.26, 0.42, 8]} />
            <meshToonMaterial color="#dcd3c4" gradientMap={toonRamp} />
          </mesh>
          <mesh scale={[1.04, 1.02, 1.04]} material={outlineMat}>
            <cylinderGeometry args={[0.31, 0.26, 0.42, 8]} />
          </mesh>
        </group>
        {/* Leather Miller Apron */}
        <mesh position={[0, 0.22, 0.03]} castShadow>
          <boxGeometry args={[0.36, 0.44, 0.28]} />
          <meshToonMaterial color="#5a381e" gradientMap={toonRamp} />
        </mesh>
        {/* Flour smudges on apron */}
        <mesh position={[0.06, 0.16, 0.18]}>
          <circleGeometry args={[0.08, 6]} />
          <meshBasicMaterial color="#f0ece4" transparent opacity={0.65} depthWrite={false} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 0.12, 6]} />
          <meshToonMaterial color="#eec6a2" gradientMap={toonRamp} />
        </mesh>

        {/* ── Head & Face ── */}
        <group ref={headRef} position={[0, 0.66, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.17, 0.32, 7]} />
            <meshToonMaterial color="#eed1b4" gradientMap={toonRamp} />
          </mesh>
          <mesh scale={[1.05, 1.04, 1.05]} material={outlineMat}>
            <cylinderGeometry args={[0.22, 0.17, 0.32, 7]} />
          </mesh>
          {/* Expressive Face */}
          <mesh position={[0, 0.02, 0.19]}>
            <planeGeometry args={[0.3, 0.26]} />
            <meshBasicMaterial map={faceTexture} transparent depthWrite={false} />
          </mesh>
          {/* Thick Ruffled Brown Hair */}
          <mesh position={[0, 0.22, -0.02]} castShadow>
            <sphereGeometry args={[0.25, 7, 6]} />
            <meshToonMaterial color="#50331e" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[-0.08, 0.18, 0.15]} rotation={[0.3, -0.2, 0.1]} castShadow>
            <coneGeometry args={[0.1, 0.18, 4]} />
            <meshToonMaterial color="#50331e" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0.08, 0.18, 0.15]} rotation={[0.3, 0.2, -0.1]} castShadow>
            <coneGeometry args={[0.1, 0.18, 4]} />
            <meshToonMaterial color="#50331e" gradientMap={toonRamp} />
          </mesh>
        </group>

        {/* ── Left Arm (Rolled sleeves, sturdy forearm) ── */}
        <group ref={leftArmRef} position={[-0.36, 0.38, 0]}>
          <mesh position={[0, -0.14, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.1, 0.24, 6]} />
            <meshToonMaterial color="#dcd3c4" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.32, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.08, 0.22, 6]} />
            <meshToonMaterial color="#eed1b4" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.47, 0]} castShadow>
            <boxGeometry args={[0.11, 0.12, 0.08]} />
            <meshToonMaterial color="#eed1b4" gradientMap={toonRamp} />
          </mesh>
        </group>

        {/* ── Right Arm ── */}
        <group ref={rightArmRef} position={[0.36, 0.38, 0]}>
          <mesh position={[0, -0.14, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.1, 0.24, 6]} />
            <meshToonMaterial color="#dcd3c4" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.32, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.08, 0.22, 6]} />
            <meshToonMaterial color="#eed1b4" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.47, 0]} castShadow>
            <boxGeometry args={[0.11, 0.12, 0.08]} />
            <meshToonMaterial color="#eed1b4" gradientMap={toonRamp} />
          </mesh>
        </group>
      </group>

      {/* ── Legs & Sturdy Work Boots ── */}
      <group ref={leftLegRef} position={[-0.14, -0.08, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.4, 6]} />
          <meshToonMaterial color="#3b3127" gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, -0.54, 0.06]} castShadow>
          <boxGeometry args={[0.13, 0.16, 0.24]} />
          <meshToonMaterial color="#2d1c10" gradientMap={toonRamp} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.14, -0.08, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.4, 6]} />
          <meshToonMaterial color="#3b3127" gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, -0.54, 0.06]} castShadow>
          <boxGeometry args={[0.13, 0.16, 0.24]} />
          <meshToonMaterial color="#2d1c10" gradientMap={toonRamp} />
        </mesh>
      </group>
    </group>
  );
}

// ────────────────────────────────────────────────────────────
// 2. MIRA THE SEER (Ethereal Mystic with Chronal Staff & Robes)
// ────────────────────────────────────────────────────────────

function MiraMesh({ aiRef }: { aiRef: React.MutableRefObject<any> }) {
  const staffCrystalRef = useRef<THREE.Mesh>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Group>(null!);

  const toonRamp = useMemo(() => getToonGradient3(), []);
  const faceTexture = useMemo(() => getStylizedFaceTexture('#38f0d8', 'wise'), []);
  const outlineMat = useMemo(() => getInvertedHullOutlineMaterial('#16101c'), []);

  useFrame((state) => {
    if (staffCrystalRef.current) {
      staffCrystalRef.current.rotation.y += 1.8 * 0.016;
      staffCrystalRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2.0) * 0.2;
    }

    const activeDiag = useCampaignStore.getState().activeDialogue;
    const currentLine = activeDiag?.lines[useCampaignStore.getState().dialogueLineIndex];
    const isMiraLine = Boolean(currentLine?.speaker.toLowerCase().includes('mira'));
    const isDialogueActive = Boolean(activeDiag);

    if (isDialogueActive && aiRef.current) {
      const player = useWorldStore.getState().player;
      const toPlayerX = player.position.x - aiRef.current.currentPos.x;
      const toPlayerZ = player.position.z - aiRef.current.currentPos.z;
      const distToPlayer = Math.hypot(toPlayerX, toPlayerZ);

      // 1. Direct, locked Eye Contact
      let relAngle = 0;
      if (distToPlayer > 0.1) {
        const worldAngleToPlayer = Math.atan2(toPlayerX, toPlayerZ);
        relAngle = THREE.MathUtils.euclideanModulo(worldAngleToPlayer - aiRef.current.heading + Math.PI, Math.PI * 2) - Math.PI;
        relAngle = THREE.MathUtils.clamp(relAngle, -0.65, 0.65);
      }

      // 2. Visible discomfort or wincing when discussing erased timelines / rewind / headache
      const isDiscomfort =
        currentLine?.emotion === 'discomfort' ||
        currentLine?.emotion === 'wincing' ||
        (isMiraLine &&
          Boolean(
            currentLine?.text &&
              (currentLine.text.toLowerCase().includes('temple') ||
                currentLine.text.toLowerCase().includes('rewound') ||
                currentLine.text.toLowerCase().includes('unmade') ||
                currentLine.text.toLowerCase().includes('erased') ||
                currentLine.text.toLowerCase().includes('copper') ||
                currentLine.text.toLowerCase().includes('fracture') ||
                currentLine.text.toLowerCase().includes('skull'))
          ));

      if (isDiscomfort) {
        // Discomfort posture: Left arm lifts up to clutch temple / cowl in physical pain
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -1.35, 0.1);
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.45, 0.1);
        }
        // Head tilts downward with slight shudder
        if (headRef.current) {
          const shudder = Math.sin(state.clock.elapsedTime * 14.0) * 0.015;
          headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.18 + shudder, 0.1);
          headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, relAngle * 0.4 + 0.08, 0.08);
          headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, -0.06, 0.1);
        }
        // Staff crystal flickers erratically with chronal interference
        if (staffCrystalRef.current && (staffCrystalRef.current.material as any)) {
          const flicker = 0.45 + Math.sin(state.clock.elapsedTime * 24.0) * 0.45;
          (staffCrystalRef.current.material as any).emissiveIntensity = flicker;
        }
      } else if (isMiraLine) {
        // Active speaking with subtle head movement & eye contact
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.15, 0.1);
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.05, 0.1);
        }
        if (headRef.current) {
          const subtleNod = Math.sin(state.clock.elapsedTime * 4.5) * 0.02 + Math.sin(state.clock.elapsedTime * 2.0) * 0.015;
          headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, subtleNod, 0.1);
          headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, relAngle + Math.sin(state.clock.elapsedTime * 1.5) * 0.015, 0.08);
          headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, 0.1);
        }
        if (staffCrystalRef.current && (staffCrystalRef.current.material as any)) {
          (staffCrystalRef.current.material as any).emissiveIntensity = 1.2 + Math.sin(state.clock.elapsedTime * 3.0) * 0.3;
        }
      } else {
        // Listening quietly with steady eye contact
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.1);
          leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0, 0.1);
        }
        if (headRef.current) {
          headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.02, 0.08);
          headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, relAngle, 0.08);
          headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, 0.08);
        }
        if (staffCrystalRef.current && (staffCrystalRef.current.material as any)) {
          (staffCrystalRef.current.material as any).emissiveIntensity = 1.0;
        }
      }

      // Restrained staff hand posture
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.4;
      }
    } else {
      // Normal locomotion
      const s = Math.sin(aiRef.current.walkPhase * 5.0) * 0.35;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -s * 0.4;
        leftArmRef.current.rotation.z = 0;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.4 + s * 0.3;
      }
      if (headRef.current) {
        headRef.current.rotation.x = 0;
        headRef.current.rotation.y = 0;
        headRef.current.rotation.z = 0;
      }
      if (staffCrystalRef.current && (staffCrystalRef.current.material as any)) {
        (staffCrystalRef.current.material as any).emissiveIntensity = 1.2;
      }
    }
  });

  return (
    <group position={[0, 0.72, 0]}>
      {/* ── Mystical Flowing Robes (Midnight Violet with Cyan Chronal Trim) ── */}
      <group position={[0, 0.08, 0]}>
        <group position={[0, 0.1, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.26, 0.42, 0.78, 8]} />
            <meshToonMaterial color="#2d1b4a" gradientMap={toonRamp} />
          </mesh>
          <mesh scale={[1.04, 1.02, 1.04]} material={outlineMat}>
            <cylinderGeometry args={[0.26, 0.42, 0.78, 8]} />
          </mesh>
        </group>
        {/* Robe Hemline Runic Trim */}
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.41, 0.43, 0.08, 8]} />
          <meshToonMaterial color="#38f0d8" emissive="#10b0a0" emissiveIntensity={0.6} gradientMap={toonRamp} />
        </mesh>
        {/* Silver Crescent Talisman */}
        <mesh position={[0, 0.35, 0.24]} rotation={[0, 0, 0.2]}>
          <torusGeometry args={[0.06, 0.02, 6, 12, Math.PI * 1.5]} />
          <meshToonMaterial color="#d0e8f0" gradientMap={toonRamp} />
        </mesh>

        {/* ── Head, Hooded Cowl & Glowing Seer Eyes ── */}
        <group ref={headRef} position={[0, 0.66, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.16, 0.3, 7]} />
            <meshToonMaterial color="#f0dcd0" gradientMap={toonRamp} />
          </mesh>
          <mesh scale={[1.05, 1.04, 1.05]} material={outlineMat}>
            <cylinderGeometry args={[0.2, 0.16, 0.3, 7]} />
          </mesh>
          {/* Luminous Seer Face */}
          <mesh position={[0, 0.02, 0.17]}>
            <planeGeometry args={[0.28, 0.24]} />
            <meshBasicMaterial map={faceTexture} transparent depthWrite={false} />
          </mesh>
          {/* Mystical Draped Hood / Cowl */}
          <mesh position={[0, 0.12, -0.04]} castShadow>
            <sphereGeometry args={[0.27, 8, 7]} />
            <meshToonMaterial color="#24153d" gradientMap={toonRamp} />
          </mesh>
          {/* Hood mantle sides */}
          <mesh position={[-0.22, -0.05, 0]} rotation={[0, 0, -0.2]} castShadow>
            <boxGeometry args={[0.1, 0.34, 0.22]} />
            <meshToonMaterial color="#24153d" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0.22, -0.05, 0]} rotation={[0, 0, 0.2]} castShadow>
            <boxGeometry args={[0.1, 0.34, 0.22]} />
            <meshToonMaterial color="#24153d" gradientMap={toonRamp} />
          </mesh>
        </group>

        {/* ── Left Arm with Draped Sleeves ── */}
        <group ref={leftArmRef} position={[-0.34, 0.35, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.16, 0.36, 6]} />
            <meshToonMaterial color="#2d1b4a" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.42, 0]} castShadow>
            <boxGeometry args={[0.09, 0.11, 0.07]} />
            <meshToonMaterial color="#f0dcd0" gradientMap={toonRamp} />
          </mesh>
        </group>

        {/* ── Right Arm Holding the Seer Staff ── */}
        <group ref={rightArmRef} position={[0.34, 0.35, 0]} rotation={[-0.4, 0, 0.15]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.16, 0.36, 6]} />
            <meshToonMaterial color="#2d1b4a" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.42, 0]} castShadow>
            <boxGeometry args={[0.09, 0.11, 0.07]} />
            <meshToonMaterial color="#f0dcd0" gradientMap={toonRamp} />
          </mesh>

          {/* ── The Chronal Seer Staff ── */}
          <group position={[0, -0.15, 0.15]} rotation={[0.4, 0, 0]}>
            {/* Staff Shaft */}
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.045, 1.8, 6]} />
              <meshToonMaterial color="#3b2716" gradientMap={toonRamp} />
            </mesh>
            {/* Staff Head Ring */}
            <mesh position={[0, 0.95, 0]} rotation={[0, 0, 0]} castShadow>
              <torusGeometry args={[0.16, 0.03, 6, 12]} />
              <meshToonMaterial color="#cfa84e" gradientMap={toonRamp} />
            </mesh>
            {/* Floating Chronal Crystal Prism */}
            <mesh ref={staffCrystalRef} position={[0, 0.95, 0]}>
              <octahedronGeometry args={[0.12, 0]} />
              <meshToonMaterial
                color="#38f0d8"
                emissive="#20d8c0"
                emissiveIntensity={1.2}
                gradientMap={toonRamp}
              />
            </mesh>
            <pointLight position={[0, 0.95, 0]} color="#38f0d8" intensity={0.9} distance={6} />
          </group>
        </group>
      </group>
    </group>
  );
}

// ────────────────────────────────────────────────────────────
// 3. KING ALDRIC (Suncrest Monarch with Crown, Plate & Cape)
// ────────────────────────────────────────────────────────────

function KingAldricMesh({ aiRef }: { aiRef: React.MutableRefObject<any> }) {
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);

  const toonRamp = useMemo(() => getToonGradient3(), []);
  const faceTexture = useMemo(() => getStylizedFaceTexture('#2862c8', 'wise'), []);
  const goldMetal = useMemo(() => getStylizedMetalTexture('#e0b830', '#fff2a8'), []);
  const outlineMat = useMemo(() => getInvertedHullOutlineMaterial('#16101c'), []);

  useFrame(() => {
    const s = Math.sin(aiRef.current.walkPhase * 5.5) * 0.4;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -s * 0.5;
    if (rightArmRef.current) rightArmRef.current.rotation.x = s * 0.5;
    if (leftLegRef.current) leftLegRef.current.rotation.x = s * 0.6;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -s * 0.6;
  });

  return (
    <group position={[0, 0.74, 0]}>
      {/* ── Royal Surcoat & Golden Armor ── */}
      <group position={[0, 0.08, 0]}>
        {/* Royal Blue Surcoat */}
        <group position={[0, 0.25, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.32, 0.28, 0.44, 8]} />
            <meshToonMaterial color="#1a4ca8" gradientMap={toonRamp} />
          </mesh>
          <mesh scale={[1.04, 1.02, 1.04]} material={outlineMat}>
            <cylinderGeometry args={[0.32, 0.28, 0.44, 8]} />
          </mesh>
        </group>
        {/* Golden Lion Heraldic Chest Emblem */}
        <mesh position={[0, 0.32, 0.22]}>
          <boxGeometry args={[0.2, 0.2, 0.03]} />
          <meshToonMaterial color="#f0c030" map={goldMetal} gradientMap={toonRamp} />
        </mesh>

        {/* Polished Gold Pauldrons */}
        <mesh position={[-0.34, 0.44, 0]} rotation={[0, 0, 0.2]} castShadow>
          <boxGeometry args={[0.2, 0.14, 0.28]} />
          <meshToonMaterial color="#e0b830" map={goldMetal} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.34, 0.44, 0]} rotation={[0, 0, -0.2]} castShadow>
          <boxGeometry args={[0.2, 0.14, 0.28]} />
          <meshToonMaterial color="#e0b830" map={goldMetal} gradientMap={toonRamp} />
        </mesh>

        {/* Royal Fur-trimmed Velvet Cape */}
        <group position={[0, 0.45, -0.16]}>
          <mesh position={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[0.58, 0.85, 0.05]} />
            <meshToonMaterial color="#881a24" gradientMap={toonRamp} />
          </mesh>
          <mesh scale={[1.04, 1.02, 1.2]} position={[0, -0.4, 0]} material={outlineMat}>
            <boxGeometry args={[0.58, 0.85, 0.05]} />
          </mesh>
          {/* Fur collar */}
          <mesh position={[0, 0.04, 0.04]} castShadow>
            <boxGeometry args={[0.62, 0.14, 0.1]} />
            <meshToonMaterial color="#edeae2" gradientMap={toonRamp} />
          </mesh>
        </group>

        {/* ── Head with Royal Golden Crown ── */}
        <group position={[0, 0.68, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.17, 0.32, 7]} />
            <meshToonMaterial color="#edd1b4" gradientMap={toonRamp} />
          </mesh>
          <mesh scale={[1.05, 1.04, 1.05]} material={outlineMat}>
            <cylinderGeometry args={[0.22, 0.17, 0.32, 7]} />
          </mesh>
          <mesh position={[0, 0.02, 0.19]}>
            <planeGeometry args={[0.3, 0.26]} />
            <meshBasicMaterial map={faceTexture} transparent depthWrite={false} />
          </mesh>
          {/* Distinguished Gray-streaked Hair & Beard */}
          <mesh position={[0, 0.22, -0.02]} castShadow>
            <sphereGeometry args={[0.25, 7, 6]} />
            <meshToonMaterial color="#8a8c90" gradientMap={toonRamp} />
          </mesh>
          {/* Royal Crown Circlet */}
          <group position={[0, 0.26, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.24, 0.22, 0.14, 8]} />
              <meshToonMaterial color="#ffd700" map={goldMetal} gradientMap={toonRamp} />
            </mesh>
            {/* Crown Spikes / Jewels */}
            {[0, 1.57, 3.14, 4.71].map((ang, i) => (
              <mesh key={i} position={[Math.cos(ang) * 0.22, 0.12, Math.sin(ang) * 0.22]}>
                <coneGeometry args={[0.04, 0.1, 4]} />
                <meshToonMaterial color="#e74c3c" gradientMap={toonRamp} />
              </mesh>
            ))}
          </group>
        </group>

        {/* ── Arms & Sword Pommel Resting Pose ── */}
        <group ref={leftArmRef} position={[-0.36, 0.38, 0]}>
          <mesh position={[0, -0.14, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.1, 0.26, 6]} />
            <meshToonMaterial color="#1a4ca8" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.32, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.09, 0.22, 6]} />
            <meshToonMaterial color="#e0b830" map={goldMetal} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.48, 0]} castShadow>
            <boxGeometry args={[0.11, 0.13, 0.08]} />
            <meshToonMaterial color="#edd1b4" gradientMap={toonRamp} />
          </mesh>
        </group>

        <group ref={rightArmRef} position={[0.36, 0.38, 0]}>
          <mesh position={[0, -0.14, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.1, 0.26, 6]} />
            <meshToonMaterial color="#1a4ca8" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.32, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.09, 0.22, 6]} />
            <meshToonMaterial color="#e0b830" map={goldMetal} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.48, 0]} castShadow>
            <boxGeometry args={[0.11, 0.13, 0.08]} />
            <meshToonMaterial color="#edd1b4" gradientMap={toonRamp} />
          </mesh>
        </group>
      </group>

      {/* ── Legs & Golden Greaves ── */}
      <group ref={leftLegRef} position={[-0.14, -0.08, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.4, 6]} />
          <meshToonMaterial color="#1c2838" gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, -0.54, 0.06]} castShadow>
          <boxGeometry args={[0.14, 0.16, 0.24]} />
          <meshToonMaterial color="#e0b830" map={goldMetal} gradientMap={toonRamp} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.14, -0.08, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.4, 6]} />
          <meshToonMaterial color="#1c2838" gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, -0.54, 0.06]} castShadow>
          <boxGeometry args={[0.14, 0.16, 0.24]} />
          <meshToonMaterial color="#e0b830" map={goldMetal} gradientMap={toonRamp} />
        </mesh>
      </group>
    </group>
  );
}

// ────────────────────────────────────────────────────────────
// 4. WARLORD VORN (Shadowfang Commander with Spiked Iron & Axe)
// ────────────────────────────────────────────────────────────

function WarlordVornMesh({ aiRef }: { aiRef: React.MutableRefObject<any> }) {
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);

  const toonRamp = useMemo(() => getToonGradient3(), []);
  const faceTexture = useMemo(() => getStylizedFaceTexture('#d84824', 'fierce'), []);
  const ironMetal = useMemo(() => getStylizedMetalTexture('#2d3036', '#687280'), []);
  const outlineMat = useMemo(() => getInvertedHullOutlineMaterial('#16101c'), []);

  useFrame(() => {
    const s = Math.sin(aiRef.current.walkPhase * 6.0) * 0.45;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -s * 0.6;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -0.5 + s * 0.6;
    if (leftLegRef.current) leftLegRef.current.rotation.x = s * 0.65;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -s * 0.65;
  });

  return (
    <group position={[0, 0.76, 0]}>
      {/* ── Broad Heavy Iron Plated Torso ── */}
      <group position={[0, 0.08, 0]}>
        <group position={[0, 0.25, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.66, 0.52, 0.4]} />
            <meshToonMaterial color="#22252a" map={ironMetal} gradientMap={toonRamp} />
          </mesh>
          <mesh scale={[1.04, 1.02, 1.06]} material={outlineMat}>
            <boxGeometry args={[0.66, 0.52, 0.4]} />
          </mesh>
        </group>
        {/* Crimson War Sash */}
        <mesh position={[0, 0.1, 0.02]} castShadow>
          <boxGeometry args={[0.68, 0.14, 0.42]} />
          <meshToonMaterial color="#941818" gradientMap={toonRamp} />
        </mesh>

        {/* Heavy Spiked Iron Pauldrons */}
        <group position={[-0.38, 0.46, 0]} rotation={[0, 0, 0.15]}>
          <mesh castShadow>
            <boxGeometry args={[0.24, 0.16, 0.34]} />
            <meshToonMaterial color="#2d3036" map={ironMetal} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[-0.08, 0.14, 0]} castShadow>
            <coneGeometry args={[0.06, 0.18, 5]} />
            <meshToonMaterial color="#1f2126" gradientMap={toonRamp} />
          </mesh>
        </group>

        <group position={[0.38, 0.46, 0]} rotation={[0, 0, -0.15]}>
          <mesh castShadow>
            <boxGeometry args={[0.24, 0.16, 0.34]} />
            <meshToonMaterial color="#2d3036" map={ironMetal} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0.08, 0.14, 0]} castShadow>
            <coneGeometry args={[0.06, 0.18, 5]} />
            <meshToonMaterial color="#1f2126" gradientMap={toonRamp} />
          </mesh>
        </group>

        {/* Dark Wolf Pelt War Mantle */}
        <mesh position={[0, 0.48, -0.18]} castShadow>
          <boxGeometry args={[0.64, 0.8, 0.08]} />
          <meshToonMaterial color="#4a1818" gradientMap={toonRamp} />
        </mesh>

        {/* ── Head with Horned Iron War Helmet ── */}
        <group position={[0, 0.7, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.18, 0.34, 7]} />
            <meshToonMaterial color="#eec6a2" gradientMap={toonRamp} />
          </mesh>
          <mesh scale={[1.05, 1.04, 1.05]} material={outlineMat}>
            <cylinderGeometry args={[0.22, 0.18, 0.34, 7]} />
          </mesh>
          <mesh position={[0, 0.02, 0.2]}>
            <planeGeometry args={[0.3, 0.26]} />
            <meshBasicMaterial map={faceTexture} transparent depthWrite={false} />
          </mesh>
          {/* Iron Nasal War Helm */}
          <group position={[0, 0.16, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.26, 7, 6]} />
              <meshToonMaterial color="#25282e" map={ironMetal} gradientMap={toonRamp} />
            </mesh>
            {/* Left Horn */}
            <mesh position={[-0.24, 0.12, 0]} rotation={[0, 0, 0.7]} castShadow>
              <coneGeometry args={[0.07, 0.32, 5]} />
              <meshToonMaterial color="#404044" gradientMap={toonRamp} />
            </mesh>
            {/* Right Horn */}
            <mesh position={[0.24, 0.12, 0]} rotation={[0, 0, -0.7]} castShadow>
              <coneGeometry args={[0.07, 0.32, 5]} />
              <meshToonMaterial color="#404044" gradientMap={toonRamp} />
            </mesh>
          </group>
        </group>

        {/* ── Right Arm with Heavy Dual-Headed Battle Axe ── */}
        <group ref={rightArmRef} position={[0.42, 0.38, 0]} rotation={[-0.5, 0, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.11, 0.32, 6]} />
            <meshToonMaterial color="#25282e" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.42, 0]} castShadow>
            <boxGeometry args={[0.12, 0.14, 0.1]} />
            <meshToonMaterial color="#eec6a2" gradientMap={toonRamp} />
          </mesh>

          {/* Heavy Dual-Headed Battle Axe */}
          <group position={[0, -0.4, 0.2]} rotation={[Math.PI / 3, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.045, 0.05, 1.4, 6]} />
              <meshToonMaterial color="#302418" gradientMap={toonRamp} />
            </mesh>
            {/* Left Axe Blade */}
            <mesh position={[-0.22, 0.52, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <coneGeometry args={[0.28, 0.38, 3]} />
              <meshToonMaterial color="#505660" map={ironMetal} gradientMap={toonRamp} />
            </mesh>
            {/* Right Axe Blade */}
            <mesh position={[0.22, 0.52, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
              <coneGeometry args={[0.28, 0.38, 3]} />
              <meshToonMaterial color="#505660" map={ironMetal} gradientMap={toonRamp} />
            </mesh>
          </group>
        </group>

        {/* ── Left Arm ── */}
        <group ref={leftArmRef} position={[-0.42, 0.38, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.11, 0.32, 6]} />
            <meshToonMaterial color="#25282e" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.42, 0]} castShadow>
            <boxGeometry args={[0.12, 0.14, 0.1]} />
            <meshToonMaterial color="#eec6a2" gradientMap={toonRamp} />
          </mesh>
        </group>
      </group>

      {/* ── Heavy Iron Legs ── */}
      <group ref={leftLegRef} position={[-0.16, -0.08, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.12, 0.42, 6]} />
          <meshToonMaterial color="#1a1c20" gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, -0.56, 0.08]} castShadow>
          <boxGeometry args={[0.16, 0.18, 0.28]} />
          <meshToonMaterial color="#2d3036" map={ironMetal} gradientMap={toonRamp} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.16, -0.08, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.12, 0.42, 6]} />
          <meshToonMaterial color="#1a1c20" gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, -0.56, 0.08]} castShadow>
          <boxGeometry args={[0.16, 0.18, 0.28]} />
          <meshToonMaterial color="#2d3036" map={ironMetal} gradientMap={toonRamp} />
        </mesh>
      </group>
    </group>
  );
}

// ────────────────────────────────────────────────────────────
// 5. SOLDIERS / GUARDS / KNIGHTS (Articulated Armor, Shields & Helmets)
// ────────────────────────────────────────────────────────────

function SoldierMesh({
  factionId,
  isKnight,
  aiRef,
}: {
  factionId: string | null;
  isKnight: boolean;
  aiRef: React.MutableRefObject<any>;
}) {
  const faction = FACTION_STYLES[factionId || 'neutral'] || FACTION_STYLES.neutral;
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);

  const toonRamp = useMemo(() => getToonGradient3(), []);
  const faceTexture = useMemo(() => getStylizedFaceTexture('#223344', 'determined'), []);
  const steelMetal = useMemo(() => getStylizedMetalTexture(faction.metal, '#ffffff'), [faction.metal]);
  const outlineMat = useMemo(() => getInvertedHullOutlineMaterial('#16101c'), []);

  useFrame(() => {
    const s = Math.sin(aiRef.current.walkPhase * 6.5) * 0.45;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -s * 0.5;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -0.4 + s * 0.5;
    if (leftLegRef.current) leftLegRef.current.rotation.x = s * 0.65;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -s * 0.65;
  });

  return (
    <group position={[0, 0.72, 0]}>
      {/* ── Torso Armor & Tabard ── */}
      <group position={[0, 0.08, 0]}>
        <group position={[0, 0.25, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.3, 0.25, 0.44, 7]} />
            <meshToonMaterial color={faction.metal} map={steelMetal} gradientMap={toonRamp} />
          </mesh>
          <mesh scale={[1.04, 1.02, 1.04]} material={outlineMat}>
            <cylinderGeometry args={[0.3, 0.25, 0.44, 7]} />
          </mesh>
        </group>
        {/* Heraldic Tabard */}
        <mesh position={[0, 0.2, 0.02]} castShadow>
          <boxGeometry args={[0.32, 0.42, 0.28]} />
          <meshToonMaterial color={faction.primary} gradientMap={toonRamp} />
        </mesh>

        {/* Steel Pauldrons */}
        <mesh position={[-0.32, 0.42, 0]} rotation={[0, 0, 0.15]} castShadow>
          <sphereGeometry args={[0.12, 6, 5]} />
          <meshToonMaterial color={faction.metal} map={steelMetal} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.32, 0.42, 0]} rotation={[0, 0, -0.15]} castShadow>
          <sphereGeometry args={[0.12, 6, 5]} />
          <meshToonMaterial color={faction.metal} map={steelMetal} gradientMap={toonRamp} />
        </mesh>

        {/* ── Barbute / Sallet Helmet ── */}
        <group position={[0, 0.66, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.17, 0.32, 7]} />
            <meshToonMaterial color="#eed1b4" gradientMap={toonRamp} />
          </mesh>
          <mesh scale={[1.05, 1.04, 1.05]} material={outlineMat}>
            <cylinderGeometry args={[0.22, 0.17, 0.32, 7]} />
          </mesh>
          <mesh position={[0, 0.02, 0.19]}>
            <planeGeometry args={[0.28, 0.24]} />
            <meshBasicMaterial map={faceTexture} transparent depthWrite={false} />
          </mesh>
          {/* Steel Helmet */}
          <group position={[0, 0.14, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.25, 8, 6]} />
              <meshToonMaterial color={faction.metal} map={steelMetal} gradientMap={toonRamp} />
            </mesh>
            {/* Knightly Plume */}
            {isKnight && (
              <mesh position={[0, 0.2, -0.06]} castShadow>
                <boxGeometry args={[0.06, 0.22, 0.24]} />
                <meshToonMaterial color={faction.primary} gradientMap={toonRamp} />
              </mesh>
            )}
          </group>
        </group>

        {/* ── Left Arm with Shield ── */}
        <group ref={leftArmRef} position={[-0.34, 0.36, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.09, 0.26, 6]} />
            <meshToonMaterial color={faction.metal} gradientMap={toonRamp} />
          </mesh>
          {/* Heater / Kite Shield */}
          <group position={[-0.14, -0.22, 0.1]} rotation={[0, 0.3, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.34, 0.55, 0.04]} />
              <meshToonMaterial color={faction.primary} gradientMap={toonRamp} />
            </mesh>
            <mesh position={[0, 0, 0.03]}>
              <boxGeometry args={[0.16, 0.28, 0.02]} />
              <meshToonMaterial color={faction.accent} gradientMap={toonRamp} />
            </mesh>
          </group>
        </group>

        {/* ── Right Arm with Steel Sword / Spear ── */}
        <group ref={rightArmRef} position={[0.34, 0.36, 0]} rotation={[-0.4, 0, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.09, 0.26, 6]} />
            <meshToonMaterial color={faction.metal} gradientMap={toonRamp} />
          </mesh>
          {/* Steel Sword */}
          <group position={[0, -0.4, 0.1]} rotation={[Math.PI / 3, 0, 0]}>
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.32, 0.05, 0.06]} />
              <meshToonMaterial color="#889098" gradientMap={toonRamp} />
            </mesh>
            <mesh position={[0, 0.36, 0]} castShadow>
              <boxGeometry args={[0.08, 0.72, 0.03]} />
              <meshToonMaterial color={faction.metal} map={steelMetal} gradientMap={toonRamp} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ── Armored Legs ── */}
      <group ref={leftLegRef} position={[-0.14, -0.08, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.4, 6]} />
          <meshToonMaterial color={faction.trousers} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, -0.54, 0.06]} castShadow>
          <boxGeometry args={[0.13, 0.16, 0.24]} />
          <meshToonMaterial color={faction.metal} map={steelMetal} gradientMap={toonRamp} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.14, -0.08, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.4, 6]} />
          <meshToonMaterial color={faction.trousers} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, -0.54, 0.06]} castShadow>
          <boxGeometry args={[0.13, 0.16, 0.24]} />
          <meshToonMaterial color={faction.metal} map={steelMetal} gradientMap={toonRamp} />
        </mesh>
      </group>
    </group>
  );
}

// ────────────────────────────────────────────────────────────
// 6. STYLIZED VILLAGER (Elspeth, etc.)
// ────────────────────────────────────────────────────────────

function VillagerMesh({ aiRef }: { aiRef: React.MutableRefObject<any> }) {
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);

  const toonRamp = useMemo(() => getToonGradient3(), []);
  const faceTexture = useMemo(() => getStylizedFaceTexture('#507840', 'kind'), []);
  const outlineMat = useMemo(() => getInvertedHullOutlineMaterial('#16101c'), []);

  useFrame(() => {
    const s = Math.sin(aiRef.current.walkPhase * 6.0) * 0.4;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -s * 0.5;
    if (rightArmRef.current) rightArmRef.current.rotation.x = s * 0.5;
    if (leftLegRef.current) leftLegRef.current.rotation.x = s * 0.6;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -s * 0.6;
  });

  return (
    <group position={[0, 0.72, 0]}>
      {/* Linen Tunic & Herbalist Vest */}
      <group position={[0, 0.08, 0]}>
        <group position={[0, 0.22, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.28, 0.36, 0.46, 8]} />
            <meshToonMaterial color="#486e4e" gradientMap={toonRamp} />
          </mesh>
          <mesh scale={[1.04, 1.02, 1.04]} material={outlineMat}>
            <cylinderGeometry args={[0.28, 0.36, 0.46, 8]} />
          </mesh>
        </group>
        <mesh position={[0, 0.24, 0.02]} castShadow>
          <boxGeometry args={[0.32, 0.36, 0.26]} />
          <meshToonMaterial color="#886038" gradientMap={toonRamp} />
        </mesh>

        {/* Head with Woven Straw/Herb Headwrap */}
        <group position={[0, 0.66, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.17, 0.32, 7]} />
            <meshToonMaterial color="#eed1b4" gradientMap={toonRamp} />
          </mesh>
          <mesh scale={[1.05, 1.04, 1.05]} material={outlineMat}>
            <cylinderGeometry args={[0.22, 0.17, 0.32, 7]} />
          </mesh>
          <mesh position={[0, 0.02, 0.19]}>
            <planeGeometry args={[0.28, 0.24]} />
            <meshBasicMaterial map={faceTexture} transparent depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.22, -0.02]} castShadow>
            <sphereGeometry args={[0.24, 7, 6]} />
            <meshToonMaterial color="#8a5a2e" gradientMap={toonRamp} />
          </mesh>
        </group>

        {/* Arms with Herbalist Herb Basket */}
        <group ref={leftArmRef} position={[-0.34, 0.34, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.09, 0.26, 6]} />
            <meshToonMaterial color="#486e4e" gradientMap={toonRamp} />
          </mesh>
          {/* Woven Basket */}
          <mesh position={[0, -0.38, 0.15]} castShadow>
            <cylinderGeometry args={[0.14, 0.11, 0.2, 7]} />
            <meshToonMaterial color="#7a5528" gradientMap={toonRamp} />
          </mesh>
        </group>

        <group ref={rightArmRef} position={[0.34, 0.34, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.09, 0.26, 6]} />
            <meshToonMaterial color="#486e4e" gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, -0.38, 0]} castShadow>
            <boxGeometry args={[0.1, 0.12, 0.08]} />
            <meshToonMaterial color="#eed1b4" gradientMap={toonRamp} />
          </mesh>
        </group>
      </group>

      {/* Legs */}
      <group ref={leftLegRef} position={[-0.14, -0.08, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.09, 0.4, 6]} />
          <meshToonMaterial color="#3d3024" gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, -0.52, 0.06]} castShadow>
          <boxGeometry args={[0.12, 0.14, 0.22]} />
          <meshToonMaterial color="#2d1c10" gradientMap={toonRamp} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.14, -0.08, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.09, 0.4, 6]} />
          <meshToonMaterial color="#3d3024" gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, -0.52, 0.06]} castShadow>
          <boxGeometry args={[0.12, 0.14, 0.22]} />
          <meshToonMaterial color="#2d1c10" gradientMap={toonRamp} />
        </mesh>
      </group>
    </group>
  );
}

// ────────────────────────────────────────────────────────────
// 7. CREATURES: SHEEP, DEER, WOLF, DRAGON
// ────────────────────────────────────────────────────────────

function SheepMesh({ aiRef }: { aiRef: React.MutableRefObject<any> }) {
  const legsRef = useRef<THREE.Group>(null!);
  const toonRamp = useMemo(() => getToonGradient3(), []);

  useFrame(() => {
    if (!legsRef.current) return;
    const legSwing = Math.sin(aiRef.current.walkPhase * 7.5) * 0.35;
    const children = legsRef.current.children;
    if (children.length >= 4) {
      children[0].rotation.x = legSwing;
      children[1].rotation.x = -legSwing;
      children[2].rotation.x = -legSwing;
      children[3].rotation.x = legSwing;
    }
  });

  return (
    <group position={[0, 0.45, 0]}>
      {/* Soft rounded wool body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.62, 8, 7]} />
        <meshToonMaterial color="#f2f0e8" gradientMap={toonRamp} />
      </mesh>
      {/* Dark expressive snout & head */}
      <group position={[0, 0.18, 0.58]}>
        <mesh rotation={[Math.PI / 3, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.14, 0.35, 7]} />
          <meshToonMaterial color="#2c2824" gradientMap={toonRamp} />
        </mesh>
        {/* Soft Ears */}
        <mesh position={[0.2, 0.12, -0.05]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.16, 0.06, 0.08]} />
          <meshToonMaterial color="#2c2824" gradientMap={toonRamp} />
        </mesh>
        <mesh position={[-0.2, 0.12, -0.05]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.16, 0.06, 0.08]} />
          <meshToonMaterial color="#2c2824" gradientMap={toonRamp} />
        </mesh>
      </group>
      {/* 4 Little Hooved Legs */}
      <group ref={legsRef}>
        {[
          [-0.26, -0.32, 0.28],
          [0.26, -0.32, 0.28],
          [-0.26, -0.32, -0.28],
          [0.26, -0.32, -0.28],
        ].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.07, 0.05, 0.38, 6]} />
              <meshToonMaterial color="#221e1a" gradientMap={toonRamp} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function DeerMesh({ aiRef }: { aiRef: React.MutableRefObject<any> }) {
  const legsRef = useRef<THREE.Group>(null!);
  const toonRamp = useMemo(() => getToonGradient3(), []);

  useFrame(() => {
    if (!legsRef.current) return;
    const legSwing = Math.sin(aiRef.current.walkPhase * 7) * 0.4;
    const children = legsRef.current.children;
    if (children.length >= 4) {
      children[0].rotation.x = legSwing;
      children[1].rotation.x = -legSwing;
      children[2].rotation.x = -legSwing;
      children[3].rotation.x = legSwing;
    }
  });

  return (
    <group position={[0, 0.72, 0]}>
      {/* Slender curved body */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.24, 0.95, 7]} />
        <meshToonMaterial color="#8a5328" gradientMap={toonRamp} />
      </mesh>
      {/* Graceful arched neck */}
      <mesh position={[0, 0.38, 0.44]} rotation={[0.45, 0, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 0.55, 6]} />
        <meshToonMaterial color="#8a5328" gradientMap={toonRamp} />
      </mesh>
      {/* Alert head */}
      <mesh position={[0, 0.66, 0.62]} rotation={[Math.PI / 4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.32, 6]} />
        <meshToonMaterial color="#78441c" gradientMap={toonRamp} />
      </mesh>
      {/* Branching Antlers */}
      <group position={[0, 0.88, 0.62]}>
        <mesh position={[0.16, 0.16, -0.05]} rotation={[0.2, 0, 0.35]} castShadow>
          <cylinderGeometry args={[0.025, 0.04, 0.38, 5]} />
          <meshToonMaterial color="#d4c8b0" gradientMap={toonRamp} />
        </mesh>
        <mesh position={[-0.16, 0.16, -0.05]} rotation={[0.2, 0, -0.35]} castShadow>
          <cylinderGeometry args={[0.025, 0.04, 0.38, 5]} />
          <meshToonMaterial color="#d4c8b0" gradientMap={toonRamp} />
        </mesh>
      </group>
      {/* Slender legs */}
      <group ref={legsRef}>
        {[
          [-0.2, -0.45, 0.38],
          [0.2, -0.45, 0.38],
          [-0.2, -0.45, -0.38],
          [0.2, -0.45, -0.38],
        ].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.045, 0.035, 0.65, 5]} />
              <meshToonMaterial color="#6a3a18" gradientMap={toonRamp} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function WolfMesh({ aiRef }: { aiRef: React.MutableRefObject<any> }) {
  const legsRef = useRef<THREE.Group>(null!);
  const toonRamp = useMemo(() => getToonGradient3(), []);

  useFrame(() => {
    if (!legsRef.current) return;
    const legSwing = Math.sin(aiRef.current.walkPhase * 8.5) * 0.45;
    const children = legsRef.current.children;
    if (children.length >= 4) {
      children[0].rotation.x = legSwing;
      children[1].rotation.x = -legSwing;
      children[2].rotation.x = -legSwing;
      children[3].rotation.x = legSwing;
    }
  });

  return (
    <group position={[0, 0.52, 0]}>
      {/* Muscular wolf torso */}
      <mesh castShadow>
        <boxGeometry args={[0.48, 0.42, 0.95]} />
        <meshToonMaterial color="#42454a" gradientMap={toonRamp} />
      </mesh>
      {/* Predatory head */}
      <group position={[0, 0.22, 0.55]}>
        <mesh rotation={[Math.PI / 2.8, 0, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.12, 0.42, 6]} />
          <meshToonMaterial color="#35383d" gradientMap={toonRamp} />
        </mesh>
        {/* Pointed ears */}
        <mesh position={[0.12, 0.2, -0.06]} rotation={[0.2, 0, 0.3]}>
          <coneGeometry args={[0.06, 0.16, 4]} />
          <meshToonMaterial color="#2d3034" gradientMap={toonRamp} />
        </mesh>
        <mesh position={[-0.12, 0.2, -0.06]} rotation={[0.2, 0, -0.3]}>
          <coneGeometry args={[0.06, 0.16, 4]} />
          <meshToonMaterial color="#2d3034" gradientMap={toonRamp} />
        </mesh>
        {/* Amber eyes */}
        <mesh position={[0.08, 0.08, 0.15]}>
          <sphereGeometry args={[0.025, 4, 4]} />
          <meshBasicMaterial color="#ffaa10" />
        </mesh>
        <mesh position={[-0.08, 0.08, 0.15]}>
          <sphereGeometry args={[0.025, 4, 4]} />
          <meshBasicMaterial color="#ffaa10" />
        </mesh>
      </group>
      {/* Bushy tail */}
      <mesh position={[0, 0.12, -0.56]} rotation={[-0.4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.11, 0.45, 5]} />
        <meshToonMaterial color="#35383d" gradientMap={toonRamp} />
      </mesh>
      {/* 4 Swift Legs */}
      <group ref={legsRef}>
        {[
          [-0.18, -0.32, 0.32],
          [0.18, -0.32, 0.32],
          [-0.18, -0.32, -0.32],
          [0.18, -0.32, -0.32],
        ].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.05, 0.04, 0.48, 5]} />
              <meshToonMaterial color="#2a2c30" gradientMap={toonRamp} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function DragonMesh() {
  const leftWingRef = useRef<THREE.Group>(null!);
  const rightWingRef = useRef<THREE.Group>(null!);
  const toonRamp = useMemo(() => getToonGradient3(), []);

  useFrame((state) => {
    const wingFlap = Math.sin(state.clock.elapsedTime * 4.5) * 0.45;
    if (leftWingRef.current) leftWingRef.current.rotation.z = wingFlap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -wingFlap;
  });

  return (
    <group position={[0, 2.8, 0]}>
      {/* Serpentine armored body */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.42, 2.2, 7]} />
        <meshToonMaterial color="#7a1818" gradientMap={toonRamp} />
      </mesh>
      {/* Dragon Head */}
      <group position={[0, 0.45, 1.25]} rotation={[-0.2, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.34, 0.85, 5]} />
          <meshToonMaterial color="#5a1212" gradientMap={toonRamp} />
        </mesh>
        {/* Glowing Eyes */}
        <mesh position={[0.18, 0.14, 0.1]}>
          <sphereGeometry args={[0.06, 5, 4]} />
          <meshBasicMaterial color="#ffc020" />
        </mesh>
        <mesh position={[-0.18, 0.14, 0.1]}>
          <sphereGeometry args={[0.06, 5, 4]} />
          <meshBasicMaterial color="#ffc020" />
        </mesh>
      </group>
      {/* Left Membrane Wing */}
      <group ref={leftWingRef} position={[0.45, 0.4, 0]}>
        <mesh position={[1.4, 0.1, 0]}>
          <boxGeometry args={[2.5, 0.05, 1.4]} />
          <meshToonMaterial color="#a02020" gradientMap={toonRamp} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Right Membrane Wing */}
      <group ref={rightWingRef} position={[-0.45, 0.4, 0]}>
        <mesh position={[-1.4, 0.1, 0]}>
          <boxGeometry args={[2.5, 0.05, 1.4]} />
          <meshToonMaterial color="#a02020" gradientMap={toonRamp} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// ────────────────────────────────────────────────────────────
// ENTITY MESH DISPATCHER (Resolves each entity to its distinct model)
// ────────────────────────────────────────────────────────────

export default function EntityMesh({ entity }: { entity: Entity }) {
  const meshRef = useRef<THREE.Group>(null!);

  const aiRef = useRef({
    currentPos: { ...entity.position },
    targetPos: { ...entity.position },
    idleTimer: Math.random() * 3,
    walkPhase: 0,
    heading: entity.rotationY,
  });

  const isStructure = entity.category === 'structure';
  const name = entity.name.toLowerCase();

  // Pick the distinct humanoid model based on identity
  const isRowan = name.includes('rowan');
  const isMira = name.includes('mira');
  const isAldric = name.includes('aldric');
  const isVorn = name.includes('vorn');
  const isKnight = entity.type === 'knight';
  const isGuard = entity.type === 'guard';
  const isVillager = entity.type === 'villager';

  useFrame((_, delta) => {
    if (!meshRef.current || isStructure) return;

    // ── Physical Combat Reaction: Defeat / Collapse ──
    if (entity.isCollapsed || entity.health <= 0) {
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, Math.PI / 2, 0.15);
      meshRef.current.position.y = getTerrainHeight(entity.position.x, entity.position.z) + 0.18;
      return;
    }

    // ── Authoritative Pause Check: Freeze NPC movements during dialogue, pause, etc. ──
    if (!shouldWorldTimeProgress()) return;

    // ── Physical Combat Reaction: Stagger / Hit Recoil ──
    if (entity.isStaggered) {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -0.4, 0.25);
      return;
    } else {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.15);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.15);
    }

    const ai = aiRef.current;
    ai.idleTimer -= delta;

    const store = useWorldStore.getState();
    const bridgeDestroyed = store.bridgeDestroyed;
    const isCampfireBurning = store.isCampfireBurning;
    const gameHours = store.time.hours;
    const isNight = gameHours < 5.5 || gameHours > 20.5;

    if (ai.idleTimer <= 0) {
      if (entity.aiState === 'wandering' || entity.aiState === 'advancing') {
        // NPC schedule: tighter resting radius at night, wider activity radius by day
        const radius = isNight && !isAldric && !isVorn ? 2.5 : 6;
        let candX = entity.position.x + (Math.random() - 0.5) * radius * 2;
        let candZ = entity.position.z + (Math.random() - 0.5) * radius * 2;

        // 1. NPC Water Awareness: If bridge is destroyed, avoid deep river water
        if (bridgeDestroyed && isWater(candX, candZ) && getWaterDepth(candX, candZ) > 0.8) {
          // Divert towards shallow ford crossing or stay near banks
          candX = -8;
          candZ = 17; // shallow river ford
        }

        // 2. NPC Fire Awareness: Avoid active burning campfire
        if (isCampfireBurning) {
          const distToFire = Math.hypot(candX - 14.0, candZ - 16.0);
          if (distToFire < 3.2) {
            candX += 3.5;
            candZ += 3.5;
          }
        }

        ai.targetPos = { x: candX, y: 0, z: candZ };
        // Night routines rest longer between movements
        ai.idleTimer = isNight ? 6 + Math.random() * 6 : 3 + Math.random() * 4;
      }
    }

    const dx = ai.targetPos.x - ai.currentPos.x;
    const dz = ai.targetPos.z - ai.currentPos.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.3) {
      const speed = entity.moveSpeed || 1.8;
      const step = Math.min(speed * delta, dist);
      const nextX = ai.currentPos.x + (dx / dist) * step;
      const nextZ = ai.currentPos.z + (dz / dist) * step;

      // NPCs halt before entering deep water if bridge is destroyed
      if (bridgeDestroyed && isWater(nextX, nextZ) && getWaterDepth(nextX, nextZ) > 1.0) {
        ai.idleTimer = 0; // Trigger repath
      } else {
        ai.currentPos.x = nextX;
        ai.currentPos.z = nextZ;
        ai.walkPhase += delta * 6;
        ai.heading = Math.atan2(dx, dz);
      }
    } else {
      ai.walkPhase = 0;
    }

    // ── Dialogue State: Conversing NPCs halt and face the player directly ──
    const activeDiag = useCampaignStore.getState().activeDialogue;
    if (activeDiag) {
      const diagLine = activeDiag.lines[useCampaignStore.getState().dialogueLineIndex];
      const isConversing =
        entity.id === activeDiag.cameraFocusEntity ||
        entity.id === diagLine?.cameraFocusEntity ||
        (entity.name && activeDiag.lines.some((l) => l.speaker.toLowerCase().includes(entity.name.toLowerCase())));

      if (isConversing) {
        ai.walkPhase = 0;
        ai.targetPos.x = ai.currentPos.x;
        ai.targetPos.z = ai.currentPos.z;
        ai.idleTimer = 999;
        const player = useWorldStore.getState().player;
        const toPlayerX = player.position.x - ai.currentPos.x;
        const toPlayerZ = player.position.z - ai.currentPos.z;
        if (Math.hypot(toPlayerX, toPlayerZ) > 0.15) {
          ai.heading = Math.atan2(toPlayerX, toPlayerZ);
        }
      }
    }

    ai.currentPos.y = getTerrainHeight(ai.currentPos.x, ai.currentPos.z);
    meshRef.current.position.set(ai.currentPos.x, ai.currentPos.y, ai.currentPos.z);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, ai.heading, 0.22);

    // Sync live position and orientation for cinematic camera framing
    liveEntityTransforms[entity.id] = {
      x: ai.currentPos.x,
      y: ai.currentPos.y,
      z: ai.currentPos.z,
      heading: meshRef.current.rotation.y,
    };
  });

  const structureY = useMemo(
    () => (entity.position.y !== 0 ? entity.position.y : getTerrainHeight(entity.position.x, entity.position.z)),
    [entity.position.x, entity.position.y, entity.position.z]
  );

  return (
    <group
      ref={meshRef}
      position={[entity.position.x, isStructure ? structureY : entity.position.y, entity.position.z]}
    >
      {/* Structures */}
      {isStructure && <StructureMesh entity={entity} />}

      {/* Unique Heroic Humanoid Models */}
      {!isStructure && isRowan && <RowanMesh aiRef={aiRef} />}
      {!isStructure && isMira && <MiraMesh aiRef={aiRef} />}
      {!isStructure && isAldric && <KingAldricMesh aiRef={aiRef} />}
      {!isStructure && isVorn && <WarlordVornMesh aiRef={aiRef} />}

      {/* Faction Knights, Guards, Villagers */}
      {!isStructure && !isRowan && !isMira && !isAldric && !isVorn && (isKnight || isGuard) && (
        <SoldierMesh factionId={entity.factionId} isKnight={isKnight} aiRef={aiRef} />
      )}
      {!isStructure && !isRowan && !isMira && !isAldric && !isVorn && isVillager && (
        <VillagerMesh aiRef={aiRef} />
      )}

      {/* Fallback Humanoid: for dynamically spawned mages, kings, travelers */}
      {!isStructure &&
        !isRowan &&
        !isMira &&
        !isAldric &&
        !isVorn &&
        !isKnight &&
        !isGuard &&
        !isVillager &&
        !['sheep', 'deer', 'wolf', 'dragon'].includes(entity.type) && (
          entity.factionId === 'shadowfang' || entity.factionId === 'suncrest' ? (
            <SoldierMesh factionId={entity.factionId} isKnight={false} aiRef={aiRef} />
          ) : entity.type === 'mage' ? (
            <MiraMesh aiRef={aiRef} />
          ) : (
            <VillagerMesh aiRef={aiRef} />
          )
        )}

      {/* Creatures */}
      {entity.type === 'sheep' && <SheepMesh aiRef={aiRef} />}
      {entity.type === 'deer' && <DeerMesh aiRef={aiRef} />}
      {entity.type === 'wolf' && <WolfMesh aiRef={aiRef} />}
      {entity.type === 'dragon' && <DragonMesh />}
    </group>
  );
}

const MemoizedEntityMesh = React.memo(EntityMesh);
export { MemoizedEntityMesh };

// ─── Entity Layer (Renders all living entities in Zustand) ───

export function EntityLayer() {
  const entities = useWorldStore((s) => s.entities);
  return (
    <group>
      {Object.values(entities).map((e) => (
        <MemoizedEntityMesh key={e.id} entity={e} />
      ))}
    </group>
  );
}
