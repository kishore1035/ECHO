// ============================================================
// ECHO VFX — Stylized Cel-Animated Reality Effects & Rewinds
// Distinctive visual language for the Echo:
// - Small commands: subtle ripple / distortion rings
// - Major reality commands: multi-tiered temporal shockwaves,
//   expanding runic glyphs, brief lighting shifts, chromatic separation,
//   and stylized particles.
// - Timeline Rewind: inward collapsing particles, reverse chrono-rings,
//   brief color flash, and procedural temporal sound.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../core/WorldState';
import { getChronalRuneTexture } from './StylizedMaterials';
import { chromaState } from './PostFX';
import { playEchoShockwave, playTemporalSound } from '../core/soundFX';

export default function EchoVFX() {
  const voiceStatus = useWorldStore((s) => s.voice.status);
  const lastCommand = useWorldStore((s) => s.voice.lastTranscript || s.voice.lastCommand || '');
  const timelineVersion = useWorldStore((s) => s.timelineRestoreVersion);

  const [activeEchoWave, setActiveEchoWave] = useState<{
    x: number;
    y: number;
    z: number;
    startTime: number;
    isMajor: boolean;
  } | null>(null);

  const [activeRewind, setActiveRewind] = useState<{
    x: number;
    y: number;
    z: number;
    startTime: number;
  } | null>(null);

  const waveRingRef = useRef<THREE.Mesh>(null!);
  const waveRingRef2 = useRef<THREE.Mesh>(null!);
  const waveRingRef3 = useRef<THREE.Mesh>(null!);
  const waveLightRef = useRef<THREE.PointLight>(null!);
  const particlesRef = useRef<THREE.Points>(null!);

  const rewindParticlesRef = useRef<THREE.Points>(null!);
  const rewindRingRef = useRef<THREE.Mesh>(null!);
  const rewindLightRef = useRef<THREE.PointLight>(null!);

  const runeTexture = useMemo(() => getChronalRuneTexture(), []);

  // Trigger Echo resonance wave on voice command processing or success
  useEffect(() => {
    if (voiceStatus === 'processing' || voiceStatus === 'success') {
      const p = useWorldStore.getState().player.position;
      const cmd = lastCommand.toLowerCase();
      const isMajor =
        cmd.includes('time') ||
        cmd.includes('weather') ||
        cmd.includes('storm') ||
        cmd.includes('rain') ||
        cmd.includes('sun') ||
        cmd.includes('spawn') ||
        cmd.includes('teleport') ||
        cmd.includes('peace') ||
        cmd.includes('war') ||
        cmd.includes('reset') ||
        cmd.includes('night') ||
        cmd.includes('noon');

      setActiveEchoWave({
        x: p.x,
        y: p.y + 0.1,
        z: p.z,
        startTime: performance.now(),
        isMajor,
      });
      playEchoShockwave(isMajor ? 1.0 : 0.45);
    }
  }, [voiceStatus, lastCommand]);

  // Trigger Temporal Rewind shockwave on timeline restore
  useEffect(() => {
    if (timelineVersion > 0) {
      const p = useWorldStore.getState().player.position;
      setActiveRewind({
        x: p.x,
        y: p.y,
        z: p.z,
        startTime: performance.now(),
      });
      playTemporalSound();
    }
  }, [timelineVersion]);

  // Particle positions for rising chronal glyphs
  const particleCount = 50;
  const particleData = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * 2.8;
      pos[i * 3]     = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.random() * 1.5;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    return pos;
  }, []);

  // Rewind spiral particle data (particles that collapse inward)
  const rewindCount = 80;
  const rewindInitialPositions = useMemo(() => {
    const pos = new Float32Array(rewindCount * 3);
    for (let i = 0; i < rewindCount; i++) {
      const angle = (i / rewindCount) * Math.PI * 4;
      const r = 2.0 + (i / rewindCount) * 8.0;
      pos[i * 3]     = Math.cos(angle) * r;
      pos[i * 3 + 1] = (i / rewindCount) * 3.5;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    const now = performance.now();

    // ── Chromatic Aberration Decay ──
    if (chromaState.peak > 0) {
      chromaState.peak = Math.max(0, chromaState.peak - chromaState.decayRate * delta);
    }

    // ── Echo Resonance Wave Animation ──
    if (activeEchoWave) {
      const elapsed = (now - activeEchoWave.startTime) / 1000;
      const duration = activeEchoWave.isMajor ? 1.8 : 1.1;

      if (elapsed > duration) {
        setActiveEchoWave(null);
      } else {
        const progress = elapsed / duration;
        const maxScale = activeEchoWave.isMajor ? 16.0 : 7.0;
        const scale = 0.5 + progress * maxScale;
        const opacity = Math.sin((1 - progress) * Math.PI * 0.5);

        // Ring 1 (Primary Cyan Runic Wave)
        if (waveRingRef.current) {
          waveRingRef.current.scale.set(scale, scale, 1);
          (waveRingRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.85;
        }

        // Ring 2 (Chromatic offset / secondary energy ring)
        if (waveRingRef2.current) {
          const scale2 = Math.max(0.1, scale * 0.78);
          waveRingRef2.current.scale.set(scale2, scale2, 1);
          (waveRingRef2.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.6;
        }

        // Ring 3 (Outer subtle amber separation fringe for major commands)
        if (waveRingRef3.current) {
          const scale3 = Math.max(0.1, scale * 1.08);
          waveRingRef3.current.scale.set(scale3, scale3, 1);
          (waveRingRef3.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.45;
        }

        // Brief environmental light shift
        if (waveLightRef.current) {
          waveLightRef.current.intensity = (1 - progress) * (activeEchoWave.isMajor ? 3.0 : 1.2);
        }

        // Rising cel-animated particles
        if (particlesRef.current) {
          const arr = particlesRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < particleCount; i++) {
            arr[i * 3 + 1] += 0.04;
          }
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
          (particlesRef.current.material as THREE.PointsMaterial).opacity = opacity * 0.9;
        }
      }
    }

    // ── Timeline Rewind Shockwave Animation (Pulling world backward) ──
    if (activeRewind) {
      const elapsed = (now - activeRewind.startTime) / 1000;
      const duration = 1.6;

      if (elapsed > duration) {
        setActiveRewind(null);
      } else {
        const progress = elapsed / duration;
        const inv = 1.0 - progress;

        // Inward collapsing particles
        if (rewindParticlesRef.current) {
          rewindParticlesRef.current.rotation.y -= 0.12; // Reverse spin
          const scale = inv * 2.8 + 0.2;
          rewindParticlesRef.current.scale.set(scale, scale, scale);
          (rewindParticlesRef.current.material as THREE.PointsMaterial).opacity =
            Math.sin(progress * Math.PI) * 0.9;
        }

        // Contracting reverse chrono-ring
        if (rewindRingRef.current) {
          const rScale = inv * 12.0 + 0.3;
          rewindRingRef.current.scale.set(rScale, rScale, 1);
          (rewindRingRef.current.material as THREE.MeshBasicMaterial).opacity =
            Math.sin(progress * Math.PI) * 0.75;
        }

        // Flash of warm temporal gold light
        if (rewindLightRef.current) {
          rewindLightRef.current.intensity = Math.sin(progress * Math.PI) * 2.8;
        }
      }
    }
  });

  return (
    <group>
      {/* ── Active Echo Resonance Rings at Player Location ── */}
      {activeEchoWave && (
        <group position={[activeEchoWave.x, activeEchoWave.y, activeEchoWave.z]}>
          {/* Primary Cyan Shockwave Ring */}
          <mesh ref={waveRingRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1.08, 32]} />
            <meshBasicMaterial
              color="#38f0d8"
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Secondary Concentric Ring with Chronal Runes */}
          <mesh ref={waveRingRef2} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.5, 2.5]} />
            <meshBasicMaterial
              map={runeTexture}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Chromatic Color Separation Ring for Major Commands */}
          {activeEchoWave.isMajor && (
            <mesh ref={waveRingRef3} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.95, 1.02, 32]} />
              <meshBasicMaterial
                color="#f8c840"
                transparent
                opacity={0.5}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          )}

          {/* Environmental Echo Pulse Light */}
          <pointLight
            ref={waveLightRef}
            position={[0, 1.2, 0]}
            color={activeEchoWave.isMajor ? '#38f0d8' : '#60e0d0'}
            intensity={2.0}
            distance={18}
          />

          {/* Rising Chronal Light Particles */}
          <points ref={particlesRef}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[particleData, 3]} />
            </bufferGeometry>
            <pointsMaterial
              color="#54ffeb"
              size={0.16}
              transparent
              opacity={0.8}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>
        </group>
      )}

      {/* ── Timeline Rewind Chrono-Distortion ── */}
      {activeRewind && (
        <group position={[activeRewind.x, activeRewind.y + 0.2, activeRewind.z]}>
          {/* Contracting Reverse Chrono-Ring */}
          <mesh ref={rewindRingRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1.15, 32]} />
            <meshBasicMaterial
              color="#ffe040"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Collapsing Reverse Particles */}
          <points ref={rewindParticlesRef} position={[0, 0.8, 0]}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[rewindInitialPositions, 3]} />
            </bufferGeometry>
            <pointsMaterial
              color="#ffd850"
              size={0.22}
              transparent
              opacity={0.85}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>

          {/* Golden Rewind Core Flash Light */}
          <pointLight ref={rewindLightRef} position={[0, 0.6, 0]} color="#ffe040" intensity={2.8} distance={20} />
        </group>
      )}
    </group>
  );
}
