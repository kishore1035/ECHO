// ============================================================
// POST-PROCESSING FX — M5 Polish Layer
// Bloom → Vignette
// ToneMapping is handled by Canvas gl.toneMapping (ACESFilmic)
// so we keep this pipeline focused on Bloom + Vignette only.
// ============================================================

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useWorldStore } from '../core/WorldState';
import { useSettingsStore } from '../core/settingsStore';

export default function PostFX() {
  const effectsQuality = useSettingsStore((s) => s.effects);
  const weatherType = useWorldStore((s) => s.weather.type);
  const isNight = useWorldStore((s) => s.time.hours < 5.5 || s.time.hours > 20);

  if (effectsQuality === 'low') {
    return null;
  }

  const isStorm = weatherType === 'storm';

  // Restrained bloom with zero multisampling penalty
  const bloomIntensity = isNight ? 0.20 : isStorm ? 0.15 : 0.08;
  const bloomLuminanceThreshold = isNight ? 0.72 : 0.82;

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomLuminanceThreshold}
        luminanceSmoothing={0.06}
        mipmapBlur
        radius={0.4}
      />
      <Vignette
        offset={0.32}
        darkness={isNight ? 0.52 : 0.36}
        eskil={false}
      />
    </EffectComposer>
  );
}
