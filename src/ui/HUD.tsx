// ============================================================
// HUD — Heads-Up Display for ECHO
// Displays world time, weather, chronal strain gauge,
// contextual interaction prompts with animated brackets,
// and edge-vignette tension indicator.
// ============================================================

import { useWorldStore } from '../core/WorldState';
import { useEchoTreeStore } from '../core/echoTreeState';
import { useControlsStore } from '../core/controls/controlsStore';

function formatGameTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${period}`;
}

export default function HUD() {
  const isNearEchoTree = useEchoTreeStore((s) => s.isNear);
  const isInteractingTree = useEchoTreeStore((s) => s.isInteracting);

  const timeFormatted = useWorldStore((s) => formatGameTime(s.time.hours));
  const weather = useWorldStore((s) => s.weather.type);
  const chaosScore = useWorldStore((s) => s.chaosScore);

  const targetNpc = useWorldStore((s) => {
    const p = s.player.position;
    let closestName = '';
    let closestDist = 7.0;
    for (const ent of Object.values(s.entities)) {
      if (
        ent.name.includes('Rowan') ||
        ent.name.includes('Mira') ||
        ent.name.includes('Aldric') ||
        ent.name.includes('Vorn')
      ) {
        const dist = Math.hypot(p.x - ent.position.x, p.z - ent.position.z);
        if (dist <= closestDist) {
          closestDist = dist;
          closestName = ent.name.split(' ')[0].toUpperCase();
        }
      }
    }
    return closestName;
  });

  const weatherLabels: Record<string, string> = {
    clear: 'Clear',
    rain: 'Raining',
    fog: 'Foggy',
    storm: 'Storm',
  };

  // Reduce gameplay HUD during Echo Tree communion
  if (isInteractingTree) {
    return null;
  }

  const isNearBrokenBridge = useWorldStore((s) => {
    if (!s.bridgeDestroyed) return false;
    const p = s.player.position;
    return Math.hypot(p.x - (-8), p.z - 5) <= 6.5;
  });

  const interactKey = useControlsStore.getState().getBindingDisplay('interact');
  const actionTarget = isNearEchoTree
    ? 'TOUCH THE ECHO TREE'
    : isNearBrokenBridge
    ? 'REPAIR THE BRIDGE'
    : targetNpc
    ? `TALK TO ${targetNpc}`
    : '';

  // Tension level calculations
  const strainPercent = Math.min(100, Math.max(0, Math.round(chaosScore)));
  const showStrain = chaosScore > 10;
  const strainColor =
    strainPercent > 60 ? '#A84034' : strainPercent > 35 ? '#8F7836' : '#B59A4A';

  // Peripheral tension vignette intensity
  const vignetteAlpha =
    chaosScore > 15 ? Math.min(0.4, 0.05 + ((chaosScore - 15) / 85) * 0.35) : 0;
  const vignetteBlur = Math.min(130, 40 + chaosScore);

  return (
    <div style={{ pointerEvents: 'none' }}>
      <style>{`
        @keyframes bracket-pulse {
          0%, 100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.12);
          }
        }
        @keyframes strain-pulse {
          0%, 100% {
            opacity: 0.85;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes tension-breathe {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>

      {/* ── Tension / Chaos Peripheral Vignette ── */}
      {vignetteAlpha > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            pointerEvents: 'none',
            boxShadow: `inset 0 0 ${vignetteBlur}px rgba(120, 20, 20, ${vignetteAlpha})`,
            animation: chaosScore > 40 ? 'tension-breathe 2.8s ease-in-out infinite' : undefined,
            transition: 'box-shadow 0.6s ease-out',
          }}
        />
      )}

      {/* ── Top-left: Time, Weather & Chronal Strain ──── */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          display: 'flex',
          gap: 6,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#0C1119',
            backdropFilter: 'blur(10px)',
            border: '1px solid #292923',
            borderRadius: 3,
            padding: '5px 12px',
            color: '#B59A4A',
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}
        >
          {timeFormatted}
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#0C1119',
            backdropFilter: 'blur(10px)',
            border: '1px solid #292923',
            borderRadius: 3,
            padding: '5px 12px',
            color: '#77756D',
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            letterSpacing: '0.06em',
          }}
        >
          {weatherLabels[weather] || weather}
        </div>

        {/* Chronal Strain Badge when timeline instability rises */}
        {showStrain && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: '#0C1119',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${strainColor}55`,
              borderRadius: 3,
              padding: '5px 12px',
              color: strainColor,
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              animation: strainPercent > 50 ? 'strain-pulse 1.8s infinite ease-in-out' : undefined,
            }}
          >
            <span>STRAIN {strainPercent}%</span>
            <div
              style={{
                width: 24,
                height: 4,
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${strainPercent}%`,
                  height: '100%',
                  background: strainColor,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Center: Interaction Prompt with Animated Brackets ── */}
      {actionTarget && (
        <div
          style={{
            position: 'fixed',
            bottom: '24%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0C1119',
            backdropFilter: 'blur(14px)',
            border: '1px solid #292923',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.7)',
            borderRadius: 4,
            padding: '8px 16px',
            color: '#E8E3D8',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            animation: 'fade-in 0.2s ease',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              color: '#E8E3D8',
              background: 'rgba(181, 154, 74, 0.12)',
              padding: '2px 7px',
              borderRadius: 3,
              border: '1px solid #B59A4A',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                color: '#B59A4A',
                display: 'inline-block',
                animation: 'bracket-pulse 1.4s ease-in-out infinite',
              }}
            >
              [
            </span>
            {interactKey}
            <span
              style={{
                color: '#B59A4A',
                display: 'inline-block',
                animation: 'bracket-pulse 1.4s ease-in-out infinite',
              }}
            >
              ]
            </span>
          </span>
          <span>{actionTarget}</span>
        </div>
      )}
    </div>
  );
}
