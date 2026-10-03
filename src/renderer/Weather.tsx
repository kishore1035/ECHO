import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../core/WorldState';
import { playThunder, updateWindAmbience, stopWindAmbience } from '../core/soundFX';
import { shouldWorldTimeProgress } from '../core/timeSystem';

// ─── Rain Falling Drops ───────────────────────────────────────

const RAIN_COUNT = 1400;

function RainMesh({ windSpeed = 4 }: { windSpeed?: number }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(RAIN_COUNT * 3);
    const vel = new Float32Array(RAIN_COUNT);
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 85;
      pos[i * 3 + 1] = Math.random() * 32 + 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 85;
      vel[i] = 28 + Math.random() * 12; // fall speed
    }
    return [pos, vel];
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < RAIN_COUNT; i++) {
      arr[i * 3 + 1] -= velocities[i] * delta;
      arr[i * 3] -= windSpeed * delta;

      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = 30 + Math.random() * 8;
        arr[i * 3] = (Math.random() - 0.5) * 85;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 85;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#a0c8f0"
        size={0.16}
        transparent
        opacity={0.65}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Ground Rain Splashes ─────────────────────────────────────

const SPLASH_COUNT = 120;

function RainSplashes() {
  const pointsRef = useRef<THREE.Points>(null!);
  const [positions, lifetimes] = useMemo(() => {
    const pos = new Float32Array(SPLASH_COUNT * 3);
    const life = new Float32Array(SPLASH_COUNT);
    for (let i = 0; i < SPLASH_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = 0.05;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
      life[i] = Math.random();
    }
    return [pos, life];
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < SPLASH_COUNT; i++) {
      lifetimes[i] += delta * 2.5;
      if (lifetimes[i] > 1.0) {
        lifetimes[i] = 0;
        arr[i * 3] = (Math.random() - 0.5) * 50;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 50;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#d0e4f8"
        size={0.24}
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Underwater Rising Bubbles ────────────────────────────────

const BUBBLE_COUNT = 45;

function UnderwaterBubbles() {
  const pointsRef = useRef<THREE.Points>(null!);
  const { camera } = useThree();

  const [positions] = useMemo(() => {
    const pos = new Float32Array(BUBBLE_COUNT * 3);
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = -Math.random() * 2.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return [pos];
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    const cx = camera.position.x;
    const cz = camera.position.z;

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      arr[i * 3 + 1] += delta * (0.8 + (i % 5) * 0.2); // rise towards surface
      // Reset bubble when near surface
      if (arr[i * 3 + 1] > -0.05) {
        arr[i * 3] = cx + (Math.random() - 0.5) * 7;
        arr[i * 3 + 1] = -2.8 - Math.random() * 0.8;
        arr[i * 3 + 2] = cz + (Math.random() - 0.5) * 7;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#70e0ff"
        size={0.16}
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Weather Fog, Sky Atmosphere & Underwater Fog ──────────────

export default function WeatherSystem() {
  const weatherType = useWorldStore((s) => s.weather.type);
  const hours = useWorldStore((s) => s.time.hours);
  const playerWaterState = useWorldStore((s) => s.player.waterState);
  const { camera } = useThree();
  const fogRef = useRef<THREE.Fog>(null!);

  // Storm lightning state
  const lightningTimer = useRef(8.0);
  const lightningFlash = useRef(0);

  const isNight = hours < 5.5 || hours > 19.5;
  const isTwilight = (hours >= 5.5 && hours <= 7.0) || (hours >= 17.5 && hours <= 19.5);

  const _scratchFogColor = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    return () => {
      stopWindAmbience();
    };
  }, []);

  useFrame((_, delta) => {
    if (!fogRef.current) return;

    // Check if camera or player is underwater
    const isUnderwater = playerWaterState === 'underwater' || camera.position.y < -0.15;

    // Procedural wind audio: calm breeze to ferocious howling storm
    if (isUnderwater) {
      updateWindAmbience(0, false);
    } else {
      const windIntensity =
        weatherType === 'storm' ? 1.0 : weatherType === 'rain' ? 0.6 : weatherType === 'fog' ? 0.2 : 0.25;
      updateWindAmbience(windIntensity, weatherType === 'storm');
    }

    let targetNear = 65;
    let targetFar = 220;
    let fogColor = '#b8cedd';

    if (isUnderwater) {
      // Deep marine abyss atmosphere
      targetNear = 1.0;
      targetFar = 16.0;
      fogColor = '#0b2b3e';
    } else {
      if (isNight) {
        fogColor = '#151e2e';
        targetNear = 55;
        targetFar = 190;
      } else if (isTwilight) {
        fogColor = '#d8946e';
        targetNear = 50;
        targetFar = 190;
      }

      if (weatherType === 'fog') {
        targetNear = 14;
        targetFar = isNight ? 70 : 95;
        fogColor = isNight ? '#162234' : '#a8b9c8';
      } else if (weatherType === 'rain') {
        targetNear = 32;
        targetFar = isNight ? 85 : 140;
        fogColor = isNight ? '#131b28' : '#6f8496';
      } else if (weatherType === 'storm') {
        targetNear = 22;
        targetFar = isNight ? 75 : 120;
        fogColor = isNight ? '#101724' : '#455562';

        // Storm Lightning (respects authoritative world time pause)
        if (shouldWorldTimeProgress()) {
          lightningTimer.current -= delta;
          if (lightningTimer.current <= 0) {
            lightningTimer.current = 10 + Math.random() * 8;
            lightningFlash.current = 1.0;
            setTimeout(() => {
              playThunder();
            }, 320);
          }
        }

        if (lightningFlash.current > 0) {
          lightningFlash.current = Math.max(0, lightningFlash.current - delta * 4.5);
          fogColor = '#d8ecff';
          targetNear = 8;
          targetFar = 180;
        }
      }
    }

    _scratchFogColor.set(fogColor);
    fogRef.current.color.lerp(_scratchFogColor, isUnderwater ? 0.12 : 0.05);
    fogRef.current.near = THREE.MathUtils.lerp(fogRef.current.near, targetNear, isUnderwater ? 0.12 : 0.05);
    fogRef.current.far = THREE.MathUtils.lerp(fogRef.current.far, targetFar, isUnderwater ? 0.12 : 0.05);
  });

  const showRain = weatherType === 'rain' || weatherType === 'storm';
  const isUnderwater = playerWaterState === 'underwater' || camera.position.y < -0.15;

  return (
    <>
      <fog ref={fogRef} attach="fog" args={['#b8cedd', 65, 220]} />
      {showRain && <RainMesh windSpeed={weatherType === 'storm' ? 12 : 4} />}
      {showRain && <RainSplashes />}
      {isUnderwater && <UnderwaterBubbles />}
    </>
  );
}
