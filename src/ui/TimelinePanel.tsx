// ============================================================
// TIMELINE PANEL (M4) — The Echo Tree Chronal Gateway
//
// Exclusive timeline communion interface accessible ONLY while
// touching the ancient Echo Tree.
//
// Allows viewing active branches, inspecting chronal checkpoints,
// rewinding to past moments, and forking alternate realities.
// Designed with ECHO minimalist aesthetic:
// - No emojis
// - No dashboard cards
// - No excessive glow
// - No giant buttons
// ============================================================

import { useTimelineStore, TimelineSystem } from '../systems/TimelineSystem';
import { useEchoTreeStore } from '../core/echoTreeState';
import { useControlsStore } from '../core/controls/controlsStore';

function formatClock(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${period}`;
}

export default function TimelinePanel() {
  const isInteracting = useEchoTreeStore((s) => s.isInteracting);
  const closeInteraction = useEchoTreeStore((s) => s.closeInteraction);

  const branches = useTimelineStore((s) => s.branches);
  const checkpoints = useTimelineStore((s) => s.checkpoints);
  const activeBranchId = useTimelineStore((s) => s.activeBranchId);
  const activeCheckpointId = useTimelineStore((s) => s.activeCheckpointId);

  // If player is not communing with the Echo Tree, the timeline interface remains closed
  if (!isInteracting) return null;

  const activeBranch = branches[activeBranchId];
  const branchList = Object.values(branches);
  const checkpointList = (activeBranch?.checkpointIds || [])
    .map((id) => checkpoints[id])
    .filter(Boolean);

  const parentBranch = activeBranch?.parentBranchId ? branches[activeBranch.parentBranchId] : null;
  const forkCheckpoint = activeBranch?.forkCheckpointId ? checkpoints[activeBranch.forkCheckpointId] : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(7, 11, 18, 0.88)',
        backdropFilter: 'blur(16px)',
        fontFamily: '"Inter", sans-serif',
        color: '#E8E3D8',
        animation: 'fadeIn 0.25s ease forwards',
      }}
    >
      <div
        style={{
          width: '90%',
          maxWidth: 680,
          maxHeight: '85vh',
          background: '#0C1119',
          border: '1px solid #292923',
          borderRadius: 6,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Header: Ancient Chronal Gateway ── */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #292923',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.24em',
                fontWeight: 800,
                color: '#8F7836',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              CHRONAL ANCHOR • THE ECHO TREE
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: '#E8E3D8',
                letterSpacing: '0.04em',
              }}
            >
              Convergence of Fractured Realities
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#77756D',
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              Physical locus left by The Architect. Touch the roots to unbind current events or step across divergent timelines.
            </div>
          </div>

          <button
            onClick={closeInteraction}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid #292923',
              borderRadius: 3,
              color: '#E8E3D8',
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            STEP AWAY
          </button>
        </div>

        {/* ── Reality Branch Navigation ── */}
        <div
          style={{
            padding: '12px 24px',
            background: '#070B12',
            borderBottom: '1px solid #292923',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#77756D',
              textTransform: 'uppercase',
            }}
          >
            Active Realities ({branchList.length})
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {branchList.map((b) => {
              const isActive = b.id === activeBranchId;
              return (
                <button
                  key={b.id}
                  onClick={() => TimelineSystem.switchBranch(b.id)}
                  style={{
                    background: isActive ? 'rgba(181, 154, 74, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isActive ? '#B59A4A' : '#292923'}`,
                    borderRadius: 3,
                    padding: '6px 12px',
                    color: isActive ? '#E8E3D8' : '#77756D',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: b.color || '#B59A4A',
                    }}
                  />
                  <span>{b.name}</span>
                </button>
              );
            })}
          </div>

          {/* Divergence Origin Log */}
          {parentBranch && forkCheckpoint && (
            <div
              style={{
                fontSize: 11,
                color: '#8F7836',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                paddingTop: 2,
              }}
            >
              <span>↳</span>
              <span>
                Diverged from <strong>{parentBranch.name}</strong> at "
                {forkCheckpoint.name}"
              </span>
            </div>
          )}
        </div>

        {/* ── Action Buttons Bar ── */}
        <div
          style={{
            padding: '12px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            borderBottom: '1px solid #292923',
          }}
        >
          <button
            onClick={() => TimelineSystem.rewind('last')}
            style={{
              background: 'rgba(181, 154, 74, 0.08)',
              border: '1px solid #B59A4A',
              borderRadius: 3,
              padding: '8px 10px',
              color: '#B59A4A',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background 0.15s ease',
            }}
          >
            <span>[ REWIND STEP ]</span>
          </button>

          <button
            onClick={() => TimelineSystem.createExplicitBranch()}
            style={{
              background: 'rgba(143, 120, 54, 0.1)',
              border: '1px solid #8F7836',
              borderRadius: 3,
              padding: '8px 10px',
              color: '#8F7836',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background 0.15s ease',
            }}
          >
            <span>[ FORK REALITY ]</span>
          </button>

          <button
            onClick={() =>
              TimelineSystem.createCheckpoint({
                name: 'Communion Anchor',
                description: 'Reality state bound at the Echo Tree.',
                significance: 'manual',
              })
            }
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid #292923',
              borderRadius: 3,
              padding: '8px 10px',
              color: '#E8E3D8',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background 0.15s ease',
            }}
          >
            <span>[ ANCHOR MOMENT ]</span>
          </button>
        </div>

        {/* ── Checkpoints Lineage Stream ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#77756D',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Timeline Lineage ({checkpointList.length} Anchored Points)
          </div>

          {checkpointList.map((cp) => {
            const isCurrent = cp.id === activeCheckpointId;

            return (
              <div
                key={cp.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '10px 14px',
                  borderRadius: 4,
                  background: isCurrent ? 'rgba(181, 154, 74, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isCurrent ? '#B59A4A' : '#292923'}`,
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Node Symbol */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: 32,
                    paddingTop: 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: isCurrent ? '#B59A4A' : '#77756D',
                    }}
                  >
                    {isCurrent ? '●' : '○'}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: isCurrent ? '#B59A4A' : '#77756D',
                      marginTop: 3,
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatClock(cp.gameHour)}
                  </span>
                </div>

                {/* Node Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#E8E3D8',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {cp.name}
                    </span>
                    {isCurrent && (
                      <span
                        style={{
                          background: 'rgba(181, 154, 74, 0.18)',
                          color: '#B59A4A',
                          border: '1px solid #B59A4A',
                          fontSize: 9,
                          fontWeight: 800,
                          borderRadius: 3,
                          padding: '1px 6px',
                          letterSpacing: '0.06em',
                        }}
                      >
                        CURRENT
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: '#77756D',
                      marginTop: 3,
                      lineHeight: 1.4,
                    }}
                  >
                    {cp.description}
                  </div>

                  {!isCurrent && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={() => TimelineSystem.restoreCheckpoint(cp.id)}
                        style={{
                          background: 'rgba(181, 154, 74, 0.08)',
                          border: '1px solid #B59A4A',
                          borderRadius: 3,
                          padding: '4px 10px',
                          color: '#B59A4A',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          cursor: 'pointer',
                        }}
                      >
                        REWIND HERE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #292923',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#070B12',
          }}
        >
          <div style={{ fontSize: 10, color: '#77756D', letterSpacing: '0.06em' }}>
            PRESS {useControlsStore.getState().getBindingDisplay('timelineBack')} OR CLICK "STEP AWAY" TO EXIT COMMUNION
          </div>
          <button
            onClick={closeInteraction}
            style={{
              background: 'none',
              border: 'none',
              color: '#77756D',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            DISCONNECT
          </button>
        </div>
      </div>
    </div>
  );
}
