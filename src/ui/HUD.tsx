import { useWorldStore } from '../core/WorldState';
import { useEchoTreeStore } from '../core/echoTreeState';

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
  const targetNpc = useWorldStore((s) => {
    const p = s.player.position;
    let closestName = '';
    let closestDist = 7.0;
    for (const ent of Object.values(s.entities)) {
      if (ent.name.includes('Rowan') || ent.name.includes('Mira') || ent.name.includes('Aldric') || ent.name.includes('Vorn')) {
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

  const interactionPrompt = isNearEchoTree
    ? '[E] TOUCH THE ECHO TREE'
    : targetNpc
    ? `[E] TALK TO ${targetNpc}`
    : '';

  return (
    <div style={{ pointerEvents: 'none' }}>
      {/* ── Top-left: Time & Weather Only ──── */}
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
            background: 'rgba(4, 8, 18, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(232, 200, 74, 0.15)',
            borderRadius: 6,
            padding: '5px 12px',
            color: 'var(--gold)',
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
            background: 'rgba(4, 8, 18, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 6,
            padding: '5px 12px',
            color: 'var(--text-dim)',
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            letterSpacing: '0.06em',
          }}
        >
          {weatherLabels[weather] || weather}
        </div>
      </div>

      {/* ── Center: Interaction Prompt ── */}
      {interactionPrompt && (
        <div
          style={{
            position: 'fixed',
            bottom: '25%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(4, 8, 18, 0.9)',
            border: '1px solid var(--gold)',
            borderRadius: 6,
            padding: '8px 16px',
            color: 'var(--gold)',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.15em',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            animation: 'fade-in 0.2s ease',
          }}
        >
          {interactionPrompt}
        </div>
      )}
    </div>
  );
}
