// ============================================================
// POST-PROCESSING FX — Polish Pass
//
// Pass 1: Bloom + Vignette (tuned)
// Pass 2: Depth of Field (dialogue close-ups + Echo Tree)
// Pass 3: Chromatic Aberration (Echo command spike, decays)
// Pass 4: HueSaturation (per-weather + time-of-day color grade)
// Pass 5: BrightnessContrast (storm darkening, dialogue punch)
// ============================================================

import { useEffect, useRef } from 'react';
import {
  EffectComposer,
  Bloom,
  Vignette,
  DepthOfField,
  ChromaticAberration,
  HueSaturation,
  BrightnessContrast,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useWorldStore } from '../core/WorldState';
import { useSettingsStore } from '../core/settingsStore';
import { useCampaignStore } from '../campaign/CampaignSystem';
import { useEchoTreeStore } from '../core/echoTreeState';

// ─── Chromatic Aberration Spike State ────────────────────────
// Shared mutable ref: spikes on Echo command, decays each frame.
// Call triggerChromaticAberrationSpike() from EchoVFX or App.tsx.
export const chromaState = { peak: 0, decayRate: 2.2 };
export function triggerChromaticAberrationSpike(intensity = 1.0) {
  chromaState.peak = Math.min(1.0, chromaState.peak + intensity);
}

// ─── Focal Distance Estimate ──────────────────────────────────
// Approximates camera→speaker distance for DoF focus plane.
function estimateFocalDistance(): number {
  const campaign = useCampaignStore.getState();
  const world = useWorldStore.getState();
  if (!campaign.activeDialogue) return 4.5;
  const line = campaign.activeDialogue.lines[campaign.dialogueLineIndex];
  if (!line) return 4.5;
  const speakerFirst = line.speaker.toLowerCase().split(' ')[0];
  const entity = Object.values(world.entities).find(
    (e) => e.name?.toLowerCase().includes(speakerFirst)
  );
  if (!entity) return 4.5;
  const p = world.player.position;
  const dist = Math.hypot(
    entity.position.x - p.x,
    entity.position.y - p.y,
    entity.position.z - p.z
  );
  return Math.max(1.5, Math.min(5.0, dist));
}

// ─── PostFX Component ─────────────────────────────────────────
export default function PostFX() {
  const effectsQuality = useSettingsStore((s) => s.effects);
  const weatherType = useWorldStore((s) => s.weather.type);
  // Coarse time period selector prevents 20-60 re-renders per second on time updates
  const timePeriod = useWorldStore((s) => {
    const h = s.time.hours;
    if (h < 5.5 || h > 20.0) return 'night';
    if (h < 8.0) return 'dawn';
    if (h > 17.5) return 'dusk';
    return 'day';
  });
  const voiceLastCommand = useWorldStore((s) => s.voice.lastCommand);
  const isDialogueActive = useCampaignStore((s) => Boolean(s.activeDialogue));
  const isEchoTreeActive = useEchoTreeStore((s) => s.isInteracting);

  const lastCommandRef = useRef('');

  // Trigger chromatic aberration spike on new voice command
  useEffect(() => {
    if (voiceLastCommand && voiceLastCommand !== lastCommandRef.current) {
      lastCommandRef.current = voiceLastCommand;
      chromaState.peak = Math.min(1.0, chromaState.peak + 0.9);
    }
  }, [voiceLastCommand]);

  if (effectsQuality === 'low') return null;

  const isHighEnd = effectsQuality === 'high';

  const isNight = timePeriod === 'night';
  const isDawn = timePeriod === 'dawn';
  const isDusk = timePeriod === 'dusk';
  const isStorm = weatherType === 'storm';
  const isRain = weatherType === 'rain';
  const isFog = weatherType === 'fog';

  // ── Bloom ──
  const bloomIntensity = isNight ? 0.20 : isStorm ? 0.12 : 0.06;
  const bloomThreshold = isNight ? 0.72 : 0.85;

  // ── Vignette ──
  const vignetteBase = isNight ? 0.50 : isStorm ? 0.46 : 0.32;
  const vignetteFinal = isDialogueActive ? Math.min(0.66, vignetteBase + 0.10) : vignetteBase;

  // ── Depth of Field (dialogue / Echo Tree — tuned for smooth performance) ──
  // Only activate in dialogue/Echo Tree if effects setting is high, with lightweight buffer
  const dofActive = isHighEnd && (isDialogueActive || isEchoTreeActive);
  const focalDist = isEchoTreeActive ? 0.028 : estimateFocalDistance() / 100;
  const bokehScale = isEchoTreeActive ? 8 : 6;

  // ── Chromatic Aberration ──
  const chromaPeak = chromaState.peak;
  const chromaOffset = new THREE.Vector2(
    chromaPeak * 0.0035,
    chromaPeak * 0.0020
  );

  // ── HueSaturation color grade ──
  let hue = 0;
  let saturation = 0;
  if (isStorm)       { saturation = -0.28; hue = 0.02; }
  else if (isRain)   { saturation = -0.12; }
  else if (isFog)    { saturation = -0.06; }
  else if (isNight)  { saturation = -0.08; hue = -0.03; }
  else if (isDawn)   { saturation =  0.06; hue =  0.015; }
  else if (isDusk)   { saturation =  0.04; hue =  0.020; }

  // ── BrightnessContrast ──
  let brightness = 0;
  let contrast = 0;
  if (isStorm)          { brightness = -0.08; contrast = 0.12; }
  else if (isRain)      { brightness = -0.04; contrast = 0.06; }
  else if (isNight)     { brightness = -0.05; contrast = 0.08; }
  else if (isDawn)      { brightness =  0.02; }
  if (isDialogueActive) { contrast   += 0.06; }

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={0.08}
        mipmapBlur={false}
        radius={0.3}
      />

      {isHighEnd && (
        <HueSaturation
          blendFunction={BlendFunction.NORMAL}
          hue={hue}
          saturation={saturation}
        />
      )}

      {isHighEnd && (
        <BrightnessContrast
          blendFunction={BlendFunction.NORMAL}
          brightness={brightness}
          contrast={contrast}
        />
      )}

      {dofActive && (
        <DepthOfField
          focusDistance={focalDist}
          focalLength={0.045}
          bokehScale={bokehScale}
          height={240}
        />
      )}

      {isHighEnd && chromaPeak > 0.04 && (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={chromaOffset}
          radialModulation={true}
          modulationOffset={0.15}
        />
      )}

      <Vignette
        offset={0.32}
        darkness={vignetteFinal}
        eskil={false}
      />
    </EffectComposer>
  );
}
