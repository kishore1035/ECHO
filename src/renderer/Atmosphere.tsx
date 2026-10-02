import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../core/WorldState';
import { shouldWorldTimeProgress, calculateDeltaGameHours } from '../core/timeSystem';
import WeatherSystem from './Weather';

export default function Atmosphere() {
  const time = useWorldStore((s) => s.time);
  const advanceTime = useWorldStore((s) => s.advanceTime);
  const weatherType = useWorldStore((s) => s.weather.type);

  const sunLightRef = useRef<THREE.DirectionalLight>(null!);
  const moonLightRef = useRef<THREE.DirectionalLight>(null!);
  const ambientLightRef = useRef<THREE.AmbientLight>(null!);
  const skyFillRef = useRef<THREE.DirectionalLight>(null!);

  const accumDelta = useRef(0);

  // Authoritative World-Time Progression (target: 1 real minute = 1 in-game hour)
  // Automatically halts if any pause condition is met: dialogue, cinematic, pause menu, save/load, rewind transition
  useFrame((_, delta) => {
    if (!shouldWorldTimeProgress()) return;

    accumDelta.current += delta;
    if (accumDelta.current >= 0.05) {
      const deltaHours = calculateDeltaGameHours(accumDelta.current);
      advanceTime(deltaHours);
      accumDelta.current = 0;
    }
  });

  // Calculate sun & moon orbital positions based on time of day (0-24h)
  // 6:00 = Sunrise (+X), 12:00 = Noon (High +Y), 18:00 = Sunset (-X), 0:00 = Midnight (-Y)
  const angle = ((time.hours - 6) / 24) * Math.PI * 2;
  const sunX = Math.cos(angle) * 75;
  const sunY = Math.sin(angle) * 65;
  const sunZ = -Math.cos(angle * 0.5) * 45;

  const isDay = sunY > 0;
  const sunElevation = Math.max(0, sunY / 65);

  // Weather lighting modifiers
  let weatherLightScale = 1.0;
  let ambientCol = '#7090b0';

  if (weatherType === 'rain') {
    weatherLightScale = 0.45;
    ambientCol = '#506575';
  } else if (weatherType === 'storm') {
    weatherLightScale = 0.2;
    ambientCol = '#304050';
  } else if (weatherType === 'fog') {
    weatherLightScale = 0.7;
    ambientCol = '#8095a5';
  }

  // Sun color transitions: dawn/dusk rich warm amber -> noon warm sunlight
  const isDuskDawn = sunY < 22;
  const sunColor = isDuskDawn ? '#ff8c38' : '#fff4dc';
  const sunIntensity = isDay ? (sunElevation * 2.9 + 0.2) * weatherLightScale : 0;

  // Moon light when sun is down — silver-indigo night illumination
  const moonIntensity = !isDay ? Math.min(0.85, Math.abs(sunY / 65) * 0.8 + 0.2) * weatherLightScale : 0.05;

  return (
    <>
      {/* Dynamic Weather Particles & Fog */}
      <WeatherSystem />

      {/* Sky with dynamic sun position */}
      <Sky
        sunPosition={[sunX, Math.max(sunY, -8), sunZ]}
        turbidity={weatherType === 'clear' ? (isDay ? 2.8 : 7.0) : 10.0}
        rayleigh={weatherType === 'clear' ? (sunY < 18 ? 2.8 : 0.55) : 0.3}
        mieCoefficient={0.05}
        mieDirectionalG={0.82}
        distance={450}
      />

      {/* Primary Sun Light with High-Fidelity Soft Shadows */}
      <directionalLight
        ref={sunLightRef}
        position={[sunX, Math.max(sunY, 1), sunZ]}
        intensity={sunIntensity}
        color={sunColor}
        castShadow={isDay}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
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
        position={[-sunX, Math.max(-sunY, 20), -sunZ]}
        intensity={moonIntensity}
        color="#82a8e8"
        castShadow={!isDay && moonIntensity > 0.3}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />

      {/* Complementary Cool Sky Fill Light (Painterly Chiaroscuro Contrast) */}
      <directionalLight
        ref={skyFillRef}
        position={[-sunX * 0.6, 28, -sunZ * 0.6]}
        intensity={isDay ? 0.62 * weatherLightScale : 0.28}
        color={isDay ? '#4872a8' : '#2c3e64'}
      />

      {/* Subtle Rim Backlight (Accentuates Character & Foliage Silhouettes) */}
      <directionalLight
        position={[-sunX * 0.8, 18, -sunZ * 0.8]}
        intensity={isDay ? 0.48 * weatherLightScale : 0.32}
        color={isDay ? '#c4e6ff' : '#8ab8f8'}
      />

      {/* Ambient Fill Light — Preserves Shadow Readability Without Crushing to Black */}
      <ambientLight
        ref={ambientLightRef}
        intensity={isDay ? 0.52 * weatherLightScale : 0.46}
        color={isDay ? ambientCol : '#2a3d60'}
      />

      {/* ── Fairytale Local Warm Lights (Village, Bridge, Ruins, Castle) ── */}
      <pointLight position={[2.2, 2.4, 4.2]} color="#ffaa3b" intensity={isDay ? 0.8 : 1.6} distance={14} />
      <pointLight position={[-4.0, 2.6, 9.0]} color="#38f0d8" intensity={1.4} distance={13} />
      <pointLight position={[-8.0, 1.8, 5.0]} color="#ff9430" intensity={isDay ? 0.7 : 1.5} distance={13} />
      <pointLight position={[18.0, 15.5, -14.0]} color="#ffb840" intensity={isDay ? 1.2 : 2.5} distance={22} />

      {/* Atmospheric Clouds (tint darker during rain/storm) */}
      <Cloud
        position={[-30, 38, -40]}
        opacity={weatherType === 'storm' ? 0.75 : weatherType === 'rain' ? 0.6 : 0.35}
        speed={0.15}
        segments={12}
        color={weatherType === 'storm' ? '#2c3540' : weatherType === 'rain' ? '#556575' : '#ffffff'}
      />
      <Cloud
        position={[20, 42, -55]}
        opacity={weatherType === 'storm' ? 0.8 : weatherType === 'rain' ? 0.55 : 0.3}
        speed={0.1}
        segments={8}
        color={weatherType === 'storm' ? '#2c3540' : weatherType === 'rain' ? '#556575' : '#ffffff'}
      />
      <Cloud
        position={[45, 35, -20]}
        opacity={weatherType === 'storm' ? 0.75 : 0.32}
        speed={0.12}
        segments={10}
        color={weatherType === 'storm' ? '#2c3540' : '#ffffff'}
      />
    </>
  );
}
