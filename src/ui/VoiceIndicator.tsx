import { useWorldStore } from '../core/WorldState';
import type { VoiceStatus } from '../core/types';

// ─── Status config ────────────────────────────────────────────

const STATUS_CONFIG: Record<
  VoiceStatus,
  { label: string; color: string; glow: string; pulse: boolean; spin: boolean }
> = {
  idle:       { label: 'HOLD SPACE TO COMMAND', color: '#8090a8', glow: 'transparent',     pulse: false, spin: false },
  listening:  { label: 'LISTENING...',           color: '#ff4060', glow: '#ff406040',       pulse: true,  spin: false },
  processing: { label: 'PROCESSING...',          color: '#f0b820', glow: '#f0b82040',       pulse: false, spin: true  },
  success:    { label: 'COMMAND EXECUTED',       color: '#40c870', glow: '#40c87040',       pulse: false, spin: false },
  error:      { label: 'NOT UNDERSTOOD',         color: '#ff4040', glow: '#ff404040',       pulse: false, spin: false },
};

// ─── Mic icon (SVG) ───────────────────────────────────────────

function MicIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="2" width="6" height="11" rx="3" fill={color} />
      <path d="M5 10a7 7 0 0014 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="9"  y1="21" x2="15" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Spinner ──────────────────────────────────────────────────

function Spinner({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        border: `2px solid ${color}30`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'vw-spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}

// ─── Voice Indicator ──────────────────────────────────────────

export default function VoiceIndicator() {
  const status = useWorldStore((s) => s.voice.status);
  const transcript = useWorldStore((s) => s.voice.lastTranscript);
  const lastCommand = useWorldStore((s) => s.voice.lastCommand);
  const lastError = useWorldStore((s) => s.voice.lastError);

  const cfg = STATUS_CONFIG[status];

  const displayText =
    status === 'listening'  ? (transcript || '...') :
    status === 'processing' ? transcript :
    status === 'success'    ? lastCommand :
    status === 'error'      ? lastError :
    null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {/* Transcript bubble — only shown when there's something to say */}
      {displayText && (
        <div
          style={{
            background: 'rgba(6,12,24,0.78)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${cfg.color}50`,
            borderRadius: 10,
            padding: '7px 18px',
            color: '#e8ecf4',
            fontFamily: '"Inter", sans-serif',
            fontSize: 13,
            fontStyle: status === 'listening' ? 'italic' : 'normal',
            maxWidth: 420,
            textAlign: 'center',
            lineHeight: 1.5,
            boxShadow: `0 0 16px ${cfg.glow}`,
            animation: status === 'listening' ? 'vw-fadein 0.2s ease' : 'vw-fadein 0.3s ease',
          }}
        >
          {displayText}
        </div>
      )}

      {/* Status pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(6,12,24,0.82)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${cfg.color}40`,
          borderRadius: 999,
          padding: '9px 20px',
          boxShadow: `0 0 20px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
          animation: cfg.pulse ? 'vw-pulse 1.1s ease-in-out infinite' : 'none',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Icon or spinner */}
        {cfg.spin ? (
          <Spinner color={cfg.color} />
        ) : (
          <MicIcon color={cfg.color} />
        )}

        {/* Status label */}
        <span
          style={{
            color: cfg.color,
            fontFamily: '"Inter", sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            transition: 'color 0.3s',
          }}
        >
          {cfg.label}
        </span>

        {/* Live dot for listening */}
        {status === 'listening' && (
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: cfg.color,
              animation: 'vw-blink 0.9s ease-in-out infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}
