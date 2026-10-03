import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../core/WorldState';
import { useSettingsStore } from '../core/settingsStore';
import { shouldWorldTimeProgress, calculateDeltaGameHours } from '../core/timeSystem';
import { getToonGradient3 } from './StylizedMaterials';
import WeatherSystem from './Weather';

// ─── Stylized Low-Poly Cel-Shaded Clouds ──────────────────────
// Zero alpha-blending overdraw: uses opaque low-poly toon meshes
// drifting across the sky at solid 60 FPS.
function StylizedClouds({ weatherType }: { weatherType: string }) {
  const groupRef = useRef<THREE.Group>(null!);
  const toonRamp = useMemo(() => getToonGradient3(), []);

  const cloudColor =
    weatherType === 'storm' ? '#2e3846' :
    weatherType === 'rain' ? '#5a6b7d' :
    '#edf3fa';

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const speed = weatherType === 'storm' ? 3.5 : 1.2;
    groupRef.current.children.forEach((cloud, i) => {
      cloud.position.x += delta * speed * (0.8 + (i % 3) * 0.4);
      if (cloud.position.x > 130) {
        cloud.position.x = -130;
      }
    });
  });

  const cloudClusters = useMemo(() => [
    { x: -35, y: 42, z: -40, s: 2.2 },
    { x: 15, y: 46, z: -60, s: 2.8 },
    { x: 55, y: 39, z: -25, s: 2.4 },
    { x: -75, y: 44, z: 20, s: 2.0 },
    { x: 30, y: 48, z: 45, s: 2.5 },
  ], []);

  return (
    <group ref={groupRef}>
      {cloudClusters.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {/* Main central puff */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[2.8, 7, 5]} />
            <meshToonMaterial color={cloudColor} gradientMap={toonRamp} />
          </mesh>
          {/* Flanking left puff */}
          <mesh position={[-2.2, -0.4, 0.4]}>
            <sphereGeometry args={[2.1, 6, 4]} />
            <meshToonMaterial color={cloudColor} gradientMap={toonRamp} />
          </mesh>
          {/* Flanking right puff */}
          <mesh position={[2.4, -0.3, -0.2]}>
            <sphereGeometry args={[2.2, 6, 4]} />
            <meshToonMaterial color={cloudColor} gradientMap={toonRamp} />
          </mesh>
          {/* Top highlight puff */}
          <mesh position={[0.6, 1.2, -0.3]}>
            <sphereGeometry args={[1.7, 6, 4]} />
            <meshToonMaterial color={cloudColor} gradientMap={toonRamp} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Atmosphere() {
  const weatherType = useWorldStore((s) => s.weather.type);
  const shadowQuality = useSettingsStore((s) => s.shadows);
  const shadowMapSize = shadowQuality === 'high' ? 2048 : 1024;

  const sunLightRef = useRef<THREE.DirectionalLight>(null!);
  const moonLightRef = useRef<THREE.DirectionalLight>(null!);
  const ambientLightRef = useRef<THREE.AmbientLight>(null!);
  const skyFillRef = useRef<THREE.DirectionalLight>(null!);

  const accumDelta = useRef(0);
  const currentHoursRef = useRef(useWorldStore.getState().time.hours);

  // Authoritative World-Time Progression:
  // Throttles Zustand store dispatch to once per second (1.0s) to eliminate
  // thousands of React re-renders, while interpolating celestial angles at 60fps.
  useFrame((_, delta) => {
    if (shouldWorldTimeProgress()) {
      accumDelta.current += delta;
      if (accumDelta.current >= 1.0) {
        const deltaHours = calculateDeltaGameHours(accumDelta.current);
        useWorldStore.getState().advanceTime(deltaHours);
        accumDelta.current = 0;
      }
    }

    // Keep smooth fractional hour for 60fps celestial lighting
    currentHoursRef.current =
      useWorldStore.getState().time.hours + calculateDeltaGameHours(accumDelta.current);
    const hours = currentHoursRef.current;

    // Calculate sun & moon orbital positions based on time of day (0-24h)
    // 6:00 = Sunrise (+X), 12:00 = Noon (High +Y), 18:00 = Sunset (-X), 0:00 = Midnight (-Y)
    const angle = ((hours - 6) / 24) * Math.PI * 2;
    const sunX = Math.cos(angle) * 75;
    const sunY = Math.sin(angle) * 65;
    const sunZ = -Math.cos(angle * 0.5) * 45;

    const isDay = sunY > 0;
    const sunElevation = Math.max(0, sunY / 65);

    // Weather lighting modifiers
    let weatherLightScale = 1.0;
    let ambientHex = '#7090b0';

    if (weatherType === 'rain') {
      weatherLightScale = 0.45;
      ambientHex = '#506575';
    } else if (weatherType === 'storm') {
      weatherLightScale = 0.2;
      ambientHex = '#304050';
    } else if (weatherType === 'fog') {
      weatherLightScale = 0.7;
      ambientHex = '#8095a5';
    }

    const isDuskDawn = sunY < 22;
    const sunHex = isDuskDawn ? '#ff8c38' : '#fff4dc';
    const sunIntensity = isDay ? (sunElevation * 2.8 + 0.2) * weatherLightScale : 0;
    const moonIntensity = !isDay
      ? Math.min(0.85, Math.abs(sunY / 65) * 0.8 + 0.2) * weatherLightScale
      : 0.05;

    // Update lights smoothly without triggering any React reconciliation
    if (sunLightRef.current) {
      sunLightRef.current.position.set(sunX, Math.max(sunY, 1), sunZ);
      sunLightRef.current.color.set(sunHex);
      sunLightRef.current.intensity = sunIntensity;
    }

    if (moonLightRef.current) {
      moonLightRef.current.position.set(-sunX, Math.max(-sunY, 20), -sunZ);
      moonLightRef.current.intensity = moonIntensity;
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.color.set(isDay ? ambientHex : '#2a3d60');
      ambientLightRef.current.intensity = isDay ? 0.52 * weatherLightScale : 0.46;
    }

    if (skyFillRef.current) {
      skyFillRef.current.position.set(-sunX * 0.6, 28, -sunZ * 0.6);
      skyFillRef.current.intensity = isDay ? 0.60 * weatherLightScale : 0.26;
    }
  });

  const initialHours = currentHoursRef.current;
  const initialAngle = ((initialHours - 6) / 24) * Math.PI * 2;
  const initialSunX = Math.cos(initialAngle) * 75;
  const initialSunY = Math.sin(initialAngle) * 65;
  const initialSunZ = -Math.cos(initialAngle * 0.5) * 45;
  const isDayInitial = initialSunY > 0;

  return (
    <>
      {/* Dynamic Weather Particles & Fog */}
      <WeatherSystem />

      {/* Sky with dynamic sun position */}
      <Sky
        sunPosition={[initialSunX, Math.max(initialSunY, -8), initialSunZ]}
        turbidity={weatherType === 'clear' ? (isDayInitial ? 2.8 : 7.0) : 10.0}
        rayleigh={weatherType === 'clear' ? (initialSunY < 18 ? 2.8 : 0.55) : 0.3}
        mieCoefficient={0.05}
        mieDirectionalG={0.82}
        distance={450}
      />

      {/* Primary Sun Light with High-Fidelity Soft Shadows */}
      <directionalLight
        ref={sunLightRef}
        position={[initialSunX, Math.max(initialSunY, 1), initialSunZ]}
        intensity={isDayInitial ? 2.0 : 0}
        color="#fff4dc"
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={1}
        shadow-camera-far={240}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />

      {/* Moon Light (night illumination from opposite direction) */}
      <directionalLight
        ref={moonLightRef}
        position={[-initialSunX, Math.max(-initialSunY, 20), -initialSunZ]}
        intensity={!isDayInitial ? 0.6 : 0.05}
        color="#82a8e8"
        castShadow={!isDayInitial}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-bias={-0.0004}
      />

      {/* Complementary Cool Sky Fill Light */}
      <directionalLight
        ref={skyFillRef}
        position={[-initialSunX * 0.6, 28, -initialSunZ * 0.6]}
        intensity={0.55}
        color="#4872a8"
      />

      {/* Ambient Fill Light */}
      <ambientLight
        ref={ambientLightRef}
        intensity={0.5}
        color="#7090b0"
      />

      {/* Stylized Cel-Shaded Low-Poly Clouds (drifts smoothly without overdraw) */}
      <StylizedClouds weatherType={weatherType} />
    </>
  );
}
