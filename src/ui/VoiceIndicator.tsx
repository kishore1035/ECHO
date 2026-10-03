import { useWorldStore } from '../core/WorldState';
import { useEchoTreeStore } from '../core/echoTreeState';
import { useCampaignStore } from '../campaign/CampaignSystem';
import { useControlsStore } from '../core/controls/controlsStore';
import type { VoiceStatus } from '../core/types';

// ─── Status config ────────────────────────────────────────────

const STATUS_CONFIG: Record<
  VoiceStatus,
  { label: string; color: string; glow: string; pulse: boolean; spin: boolean }
> = {
  idle:       { label: '',                       color: '#77756D', glow: 'transparent',     pulse: false, spin: false },
  listening:  { label: 'LISTENING...',           color: '#A84034', glow: 'rgba(168, 64, 52, 0.2)', pulse: true,  spin: false },
  processing: { label: 'PROCESSING...',          color: '#B59A4A', glow: 'rgba(181, 154, 74, 0.2)', pulse: false, spin: true  },
  success:    { label: 'COMMAND EXECUTED',       color: '#4E8A5E', glow: 'rgba(78, 138, 94, 0.2)', pulse: false, spin: false },
  error:      { label: 'NOT UNDERSTOOD',         color: '#A84034', glow: 'rgba(168, 64, 52, 0.2)', pulse: false, spin: false },
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

  const isNearTree = useEchoTreeStore((s) => s.isNear);
  const activeMissionId = useCampaignStore((s) => s.activeMissionId);

  const targetNpc = useWorldStore((s) => {
    const p = s.player.position;
    for (const ent of Object.values(s.entities)) {
      if (ent.name.includes('Rowan') || ent.name.includes('Mira')) {
        const dist = Math.hypot(p.x - ent.position.x, p.z - ent.position.z);
        if (dist <= 7.0) return true;
      }
    }
    return false;
  });

  const voiceKey = useControlsStore((s) => s.getBindingDisplay('voicePushToTalk')) || 'SPACE';

  // Contextual command guidance for idle state
  let idleLabel = `HOLD [${voiceKey}] TO COMMAND`;
  if (isNearTree) {
    idleLabel = `HOLD [${voiceKey}] • "COMMUNE" • "RESTORE" • "REWIND"`;
  } else if (activeMissionId === 'm3_battle_for_the_mill') {
    idleLabel = `HOLD [${voiceKey}] • "FREEZE" • "DEFEND" • "REWIND"`;
  } else if (targetNpc) {
    idleLabel = `HOLD [${voiceKey}] • "TALK" • "WARM" • "GUIDE"`;
  }

  const cfg = STATUS_CONFIG[status];
  const labelText = status === 'idle' ? idleLabel : cfg.label;

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
            background: '#0C1119',
            backdropFilter: 'blur(12px)',
            border: '1px solid #292923',
            borderRadius: 4,
            padding: '7px 18px',
            color: '#E8E3D8',
            fontFamily: '"Inter", sans-serif',
            fontSize: 13,
            fontStyle: status === 'listening' ? 'italic' : 'normal',
            maxWidth: 420,
            textAlign: 'center',
            lineHeight: 1.5,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
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
          background: '#0C1119',
          backdropFilter: 'blur(16px)',
          border: '1px solid #292923',
          borderRadius: 20,
          padding: '7px 20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
          animation: cfg.pulse ? 'vw-pulse 1.1s ease-in-out infinite' : 'none',
          transition: 'border-color 0.3s',
        }}
      >
        {/* Icon or spinner */}
        {cfg.spin ? (
          <Spinner color={cfg.color} />
        ) : (
          <MicIcon color={status === 'idle' ? '#B59A4A' : cfg.color} />
        )}

        {/* Status label */}
        <span
          style={{
            color: status === 'idle' ? '#77756D' : cfg.color,
            fontFamily: 'var(--font-ui, "Inter", sans-serif)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            transition: 'color 0.3s',
          }}
        >
          {labelText}
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
