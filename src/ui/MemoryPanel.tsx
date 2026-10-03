// ============================================================
// MEMORY PANEL (M3) — Shows player reputation + recent world events
// ============================================================

import { useMemo } from 'react';
import { useState } from 'react';
import { useWorldStore } from '../core/WorldState';
import { useShallow } from 'zustand/react/shallow';
import { getFactionTrust } from '../systems/MemorySystem';

const FACTION_CONFIG: Record<string, { name: string; abbr: string; color: string }> = {
  suncrest: { name: 'Suncrest', abbr: 'SC', color: '#B59A4A' },
  shadowfang: { name: 'Shadowfang', abbr: 'SF', color: '#A84034' },
  neutral: { name: 'Meadowlands', abbr: 'ML', color: '#8F7836' },
};

function TrustBar({ score }: { score: number }) {
  const clamped = Math.max(-100, Math.min(100, score));
  const isPositive = clamped >= 0;
  const width = Math.abs(clamped);

  const color = clamped > 40
    ? '#4E8A5E'     // friendly
    : clamped > 0
    ? '#B59A4A'     // cautiously warm
    : clamped > -40
    ? '#8F7836'     // wary
    : '#A84034';    // hostile

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
      {/* Negative side */}
      <div style={{ width: 50, display: 'flex', justifyContent: 'flex-end' }}>
        {!isPositive && (
          <div
            style={{
              width: `${width * 0.5}%`,
              height: 4,
              background: color,
              borderRadius: 2,
              transition: 'width 0.6s ease',
              minWidth: width > 0 ? 3 : 0,
            }}
          />
        )}
      </div>

      {/* Center mark */}
      <div style={{ width: 2, height: 10, background: '#292923', borderRadius: 1 }} />

      {/* Positive side */}
      <div style={{ width: 50 }}>
        {isPositive && (
          <div
            style={{
              width: `${width * 0.5}%`,
              height: 4,
              background: color,
              borderRadius: 2,
              transition: 'width 0.6s ease',
              minWidth: width > 0 ? 3 : 0,
            }}
          />
        )}
      </div>

      {/* Score label */}
      <span
        style={{
          color,
          fontFamily: '"Inter", sans-serif',
          fontSize: 10,
          fontWeight: 700,
          minWidth: 34,
          textAlign: 'right',
        }}
      >
        {clamped > 0 ? '+' : ''}{clamped.toFixed(0)}
      </span>
    </div>
  );
}

function TrustLabel({ score }: { score: number }) {
  if (score > 60) return <span style={{ color: '#4E8A5E', fontSize: 9 }}>REVERED</span>;
  if (score > 30) return <span style={{ color: '#B59A4A', fontSize: 9 }}>FRIENDLY</span>;
  if (score > 0) return <span style={{ color: '#8F7836', fontSize: 9 }}>NEUTRAL+</span>;
  if (score > -30) return <span style={{ color: '#8F7836', fontSize: 9 }}>WARY</span>;
  if (score > -60) return <span style={{ color: '#A84034', fontSize: 9 }}>HOSTILE</span>;
  return <span style={{ color: '#A84034', fontSize: 9 }}>ENEMY</span>;
}

export default function MemoryPanel() {
  const [isOpen, setIsOpen] = useState(false);

  // Stable selectors — useShallow prevents infinite loops from new array refs
  const events = useWorldStore(useShallow((s) => s.events));
  const eventCount = events.length;

  // Derived data via useMemo — only recomputes when events change
  const recentEvents = useMemo(
    () => events.filter((e) => e.significance >= 2).slice(-5).reverse(),
    [events]
  );

  const factionScores = useMemo(() => {
    const scores: Record<string, number> = {};
    for (const fid of Object.keys(FACTION_CONFIG)) {
      scores[fid] = getFactionTrust(fid);
    }
    return scores;
  }, [events]); // recompute when events change

  const hasMemories = eventCount > 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 6,
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#0C1119',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${isOpen ? '#B59A4A' : '#292923'}`,
          borderRadius: 4,
          padding: '6px 12px',
          color: isOpen ? '#B59A4A' : '#77756D',
          fontFamily: '"Inter", sans-serif',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          letterSpacing: '0.06em',
          transition: 'all 0.2s',
        }}
      >
        <span style={{
          width: 18,
          height: 18,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid #292923',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 8,
          fontWeight: 800,
          color: '#77756D',
          letterSpacing: '0.02em',
          flexShrink: 0,
        }}>MEM</span>
        <span>WORLD'S MEMORY</span>
        {hasMemories && (
          <span
            style={{
              background: 'rgba(181, 154, 74, 0.15)',
              border: '1px solid #B59A4A',
              borderRadius: 3,
              padding: '1px 5px',
              color: '#B59A4A',
              fontSize: 9,
            }}
          >
            {eventCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          style={{
            background: '#0C1119',
            backdropFilter: 'blur(18px)',
            border: '1px solid #292923',
            boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
            borderRadius: 6,
            padding: '14px 16px',
            width: 240,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Header */}
          <div
            style={{
              fontFamily: 'var(--font-display, serif)',
              fontSize: 11,
              fontWeight: 700,
              color: '#E8E3D8',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              borderBottom: '1px solid #292923',
              paddingBottom: 8,
            }}
          >
            The World Remembers
          </div>

          {/* Reputation section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                fontSize: 9,
                color: '#77756D',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: '"Inter", sans-serif',
                fontWeight: 700,
              }}
            >
              Your Reputation
            </div>

            {Object.entries(FACTION_CONFIG).map(([fid, cfg]) => {
              const score = factionScores[fid] ?? 0;
              return (
                <div key={fid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 20,
                    height: 20,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid #292923`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 7,
                    fontWeight: 800,
                    color: cfg.color,
                    letterSpacing: '0.02em',
                    flexShrink: 0,
                  }}>{cfg.abbr}</span>
                  <span
                    style={{
                      color: '#E8E3D8',
                      fontFamily: '"Inter", sans-serif',
                      fontSize: 10,
                      fontWeight: 600,
                      width: 70,
                      flexShrink: 0,
                    }}
                  >
                    {cfg.name}
                  </span>
                  <TrustBar score={score} />
                  <TrustLabel score={score} />
                </div>
              );
            })}
          </div>

          {/* Recent significant events */}
          {recentEvents.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                style={{
                  fontSize: 9,
                  color: '#77756D',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 700,
                  borderTop: '1px solid #292923',
                  paddingTop: 8,
                }}
              >
                Remembered Events
              </div>

              {recentEvents.map((ev) => {
                const sigColor =
                  ev.significance === 3 ? '#B59A4A'
                  : ev.significance === 2 ? '#8F7836'
                  : '#77756D';

                const sigTag =
                  ev.type === 'malice_summoned' ? 'MAL'
                  : ev.type === 'player_helped' ? 'AID'
                  : ev.type === 'player_attacked' ? 'ATK'
                  : ev.type === 'faction_shift' ? 'POL'
                  : ev.type === 'vip_witnessed' ? 'WIT'
                  : ev.type === 'structure_built' ? 'BLD'
                  : 'EVT';

                return (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex',
                      gap: 6,
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{
                      fontSize: 7,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      color: sigColor,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid #292923`,
                      borderRadius: 2,
                      padding: '1px 4px',
                      flexShrink: 0,
                      marginTop: 1,
                      fontFamily: '"Inter", sans-serif',
                    }}>{sigTag}</span>
                    <span
                      style={{
                        color: '#E8E3D8',
                        fontFamily: '"Inter", sans-serif',
                        fontSize: 10,
                        lineHeight: 1.35,
                        borderLeft: `2px solid ${sigColor}`,
                        paddingLeft: 5,
                      }}
                    >
                      {ev.description}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!hasMemories && (
            <div
              style={{
                color: '#77756D',
                fontFamily: '"Inter", sans-serif',
                fontSize: 10,
                fontStyle: 'italic',
                textAlign: 'center',
                paddingTop: 4,
              }}
            >
              The world has no memories yet.
              <br />
              Speak a command to begin.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
