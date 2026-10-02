// ============================================================
// DYNAMIC PHYSICAL PROPS — Interactive World Elements
// Stylized crates, barrels, boulders, and destructible debris
// that react to player collisions, footsteps, and combat hits.
// Rendered with discrete toon shading and splinter/break states.
// ============================================================

import { useMemo } from 'react';
import * as THREE from 'three';
import { useWorldStore } from '../core/WorldState';
import type { DynamicProp } from '../core/types';
import {
  getStylizedWoodTexture,
  getStylizedStoneTexture,
  getToonGradient3,
  getToonGradient4,
} from './StylizedMaterials';

// ─── Single Dynamic Crate ─────────────────────────────────────

function CrateMesh({ prop }: { prop: DynamicProp }) {
  const toonRamp = useMemo(() => getToonGradient3(), []);
  const woodTex = useMemo(() => getStylizedWoodTexture('#5a361c', '#331e0f'), []);

  if (prop.isBroken) {
    // Fractured / splintered wooden planks
    return (
      <group
        position={[prop.position.x, prop.position.y + 0.08, prop.position.z]}
        rotation={[0, prop.rotation.y, 0]}
      >
        {[-0.25, 0, 0.25].map((offX, i) => (
          <mesh
            key={i}
            position={[offX, 0.04, ((i % 2) - 0.5) * 0.2]}
            rotation={[0.1 * i, i * 0.7, 0.2 * (i - 1)]}
            castShadow
          >
            <boxGeometry args={[0.55, 0.08, 0.22]} />
            <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
          </mesh>
        ))}
      </group>
    );
  }

  const s = prop.radius * 2;
  return (
    <group
      position={[prop.position.x, prop.position.y + prop.radius, prop.position.z]}
      rotation={[prop.rotation.x, prop.rotation.y, prop.rotation.z]}
    >
      {/* Main Wood Box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[s, s, s]} />
        <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
      </mesh>
      {/* Iron / Dark Wood Reinforcement Bracing */}
      <mesh castShadow>
        <boxGeometry args={[s * 1.02, s * 0.16, s * 1.02]} />
        <meshToonMaterial color="#2d2218" gradientMap={toonRamp} />
      </mesh>
    </group>
  );
}

// ─── Single Dynamic Barrel ────────────────────────────────────

function BarrelMesh({ prop }: { prop: DynamicProp }) {
  const toonRamp = useMemo(() => getToonGradient3(), []);
  const woodTex = useMemo(() => getStylizedWoodTexture('#653e20', '#3b2210'), []);

  if (prop.isBroken) {
    return (
      <group position={[prop.position.x, prop.position.y + 0.06, prop.position.z]}>
        <mesh rotation={[0.4, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.26, 0.35, 6, 1, true, 0, Math.PI]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }

  const r = prop.radius;
  const h = prop.radius * 2.2;
  return (
    <group
      position={[prop.position.x, prop.position.y + h * 0.5, prop.position.z]}
      rotation={[prop.rotation.x, prop.rotation.y, prop.rotation.z]}
    >
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[r * 0.88, r * 0.95, h, 8]} />
        <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
      </mesh>
      {/* Iron barrel hoops */}
      {[-h * 0.3, h * 0.3].map((offY, i) => (
        <mesh key={i} position={[0, offY, 0]}>
          <cylinderGeometry args={[r * 0.92, r * 0.92, 0.06, 8]} />
          <meshToonMaterial color="#2b2622" gradientMap={toonRamp} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Single Dynamic Boulder / Rock ────────────────────────────

function BoulderMesh({ prop }: { prop: DynamicProp }) {
  const toonRamp = useMemo(() => getToonGradient4(), []);
  const stoneTex = useMemo(() => getStylizedStoneTexture('#585e68', '#383c42'), []);

  return (
    <group
      position={[prop.position.x, prop.position.y + prop.radius * 0.8, prop.position.z]}
      rotation={[prop.rotation.x, prop.rotation.y, prop.rotation.z]}
    >
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[prop.radius, 1]} />
        <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
      </mesh>
    </group>
  );
}

// ─── Single Fallen Debris Chunk ───────────────────────────────

function DebrisMesh({ prop }: { prop: DynamicProp }) {
  const toonRamp = useMemo(() => getToonGradient3(), []);
  const stoneTex = useMemo(() => getStylizedStoneTexture('#4e525a', '#32353a'), []);

  return (
    <group
      position={[prop.position.x, prop.position.y + 0.15, prop.position.z]}
      rotation={[prop.rotation.x, prop.rotation.y, prop.rotation.z]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[prop.radius * 1.8, 0.3, prop.radius * 1.2]} />
        <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
      </mesh>
    </group>
  );
}

// ─── Dynamic Props Container ──────────────────────────────────

export default function PhysicalProps() {
  const dynamicProps = useWorldStore((s) => s.dynamicProps);

  return (
    <group name="dynamic-physical-props">
      {Object.values(dynamicProps).map((prop) => {
        switch (prop.propType) {
          case 'crate':
            return <CrateMesh key={prop.id} prop={prop} />;
          case 'barrel':
            return <BarrelMesh key={prop.id} prop={prop} />;
          case 'rock':
            return <BoulderMesh key={prop.id} prop={prop} />;
          case 'rubble':
            return <DebrisMesh key={prop.id} prop={prop} />;
          default:
            return null;
        }
      })}
    </group>
  );
}
