import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Atmosphere from './Atmosphere';
import Terrain from './Terrain';
import Trees from './Trees';
import EchoTree from './EchoTree';
import Environment from './Environment';
import PostFX from './PostFX';
import { EntityLayer } from './EntityMesh';
import PlayerAvatar from './PlayerAvatar';
import CameraSystem, { type CameraMode } from './CameraSystem';
import { useSettingsStore } from '../core/settingsStore';

interface SceneProps {
  onCameraMode?: (mode: CameraMode) => void;
  isCinematic?: boolean;
  isPaused?: boolean;
}

export default function Scene({ onCameraMode, isCinematic, isPaused }: SceneProps) {
  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality);
  const shadowQuality = useSettingsStore((s) => s.shadows);

  // Clamp DPR according to user quality settings — optimizes GPU fill rate on high-DPI/Retina screens
  const dpr: [number, number] | number = useMemo(() => {
    const maxDeviceDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    switch (graphicsQuality) {
      case 'low':
        return 1;
      case 'medium':
        return [1, Math.min(maxDeviceDpr, 1.0)];
      case 'high':
        return [1, Math.min(maxDeviceDpr, 1.15)];
      case 'ultra':
        return [1, Math.min(maxDeviceDpr, 1.35)];
      default:
        return [1, Math.min(maxDeviceDpr, 1.15)];
    }
  }, [graphicsQuality]);

  const shadowConfig = useMemo(() => {
    if (shadowQuality === 'off') return false;
    if (shadowQuality === 'low') return { type: THREE.BasicShadowMap };
    return { type: THREE.PCFShadowMap };
  }, [shadowQuality]);

  return (
    <Canvas
      frameloop={isPaused ? 'never' : 'always'}
      dpr={dpr}
      shadows={shadowConfig}
      camera={{ position: [0, 26, 42], fov: 52, near: 0.2, far: 600 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ background: '#0d1520' }}
    >
      <color attach="background" args={['#0d1520']} />
      <Suspense fallback={null}>
        <Atmosphere />
        <Terrain />
        <Trees />
        <EchoTree />
        <Environment />
        <EntityLayer />
        <PlayerAvatar />
        <CameraSystem
          onModeChange={onCameraMode}
          isCinematic={isCinematic}
          isPaused={isPaused}
        />
        {/* Post-processing passes — always last */}
        <PostFX />
      </Suspense>
    </Canvas>
  );
}
