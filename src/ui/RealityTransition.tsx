// ============================================================
// REALITY TRANSITION (M4) — Time-Warp & Reality Shift FX
//
// Fullscreen dramatic distortion, subtle chromatic ripple, and
// chrono-vortex rift effect when rewinding or switching branches.
// ============================================================

import { useTimelineStore } from '../systems/TimelineSystem';

export default function RealityTransition() {
  const isTransitioning = useTimelineStore((s) => s.isTransitioning);
  const transitionText = useTimelineStore((s) => s.transitionText);
  const transitionType = useTimelineStore((s) => s.transitionType);

  if (!isTransitioning) return null;

  const isRewind = transitionType === 'rewind';
  const accentColor = isRewind ? '#B59A4A' : '#8F7836';
  const glowColor = 'rgba(181, 154, 74, 0.25)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        animation: 'realityWarpIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <style>{`
        @keyframes realityWarpIn {
          0% {
            opacity: 0;
            backdrop-filter: blur(0px) contrast(100%);
            transform: scale(1);
          }
          30% {
            opacity: 1;
            backdrop-filter: blur(14px) contrast(160%) brightness(1.2);
            transform: scale(1.02);
          }
          70% {
            opacity: 0.95;
            backdrop-filter: blur(10px) contrast(130%) brightness(1.1);
            transform: scale(1);
          }
          100% {
            opacity: 0;
            backdrop-filter: blur(0px) contrast(100%);
            transform: scale(0.99);
          }
        }

        @keyframes portalVortexSpin {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.7); opacity: 0; }
          40% { transform: translate(-50%, -50%) rotate(180deg) scale(1.25); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(1.6); opacity: 0; }
        }

        @keyframes scanlinePulse {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }

        @keyframes textGlitchFlash {
          0%, 100% { text-shadow: 0 0 20px ${accentColor}, 1px 1px 0 #8F7836; }
          50% { text-shadow: 0 0 30px rgba(232, 227, 216, 0.6), -1px 0 0 #B59A4A; }
        }
      `}</style>

      {/* Deep chronal void veil */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(12, 17, 25, 0.85) 0%, rgba(7, 11, 18, 0.96) 80%)',
        }}
      />

      {/* Rotating Time Vortex Ring */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 520,
          height: 520,
          borderRadius: '50%',
          border: `2px dashed ${accentColor}`,
          boxShadow: `0 0 40px ${glowColor}, inset 0 0 40px ${glowColor}`,
          animation: 'portalVortexSpin 0.75s ease-out forwards',
        }}
      />

      {/* Horizontal Reality Distortion Lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.4) 50%)',
          backgroundSize: '100% 4px',
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      />

      {/* Central Announcement Banner */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '24px 44px',
          background: '#0C1119',
          border: `1px solid ${accentColor}`,
          boxShadow: `0 0 45px ${glowColor}, inset 0 0 25px ${glowColor}`,
          borderRadius: 6,
          backdropFilter: 'blur(20px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 12,
            fontFamily: '"Inter", monospace',
            fontWeight: 800,
            letterSpacing: '0.25em',
            color: accentColor,
            textTransform: 'uppercase',
          }}
        >
          <span style={{ fontSize: 12, color: accentColor }}>{isRewind ? '◀' : '◆'}</span>
          <span>{isRewind ? 'TEMPORAL REVERSION IN PROGRESS' : 'CHRONAL REALITY DIVERGENCE'}</span>
        </div>

        <div
          style={{
            fontSize: 22,
            fontFamily: 'var(--font-display, serif)',
            fontWeight: 700,
            color: '#E8E3D8',
            letterSpacing: '0.08em',
            textAlign: 'center',
            maxWidth: 620,
            animation: 'textGlitchFlash 0.35s infinite',
          }}
        >
          {transitionText || (isRewind ? 'REWINDING TIMELINE' : 'SWITCHING REALITIES')}
        </div>

        <div
          style={{
            fontSize: 10,
            fontFamily: '"Inter", monospace',
            color: '#77756D',
            letterSpacing: '0.18em',
          }}
        >
          ECHO TREE ANCHOR • REALITY RESTORED
        </div>
      </div>
    </div>
  );
}
