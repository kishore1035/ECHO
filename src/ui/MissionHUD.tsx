// ============================================================
// MISSION HUD — Compact Corner Objective Tracker for ECHO
// Minimalist corner tracker displaying current mission & active objective.
// ============================================================

import { useCampaignStore } from '../campaign/CampaignSystem';

export default function MissionHUD() {
  const activeMissionId = useCampaignStore((s) => s.activeMissionId);
  const missions = useCampaignStore((s) => s.missions);

  const activeMission = missions.find((m) => m.id === activeMissionId);
  if (!activeMission) return null;

  const currentObj = activeMission.objectives.find((o) => !o.completed) || activeMission.objectives[activeMission.objectives.length - 1];
  const completedCount = activeMission.objectives.filter((o) => o.completed).length;
  const totalCount = activeMission.objectives.length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 56,
        left: 20,
        zIndex: 90,
        width: 280,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(4, 8, 18, 0.82)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          color: 'var(--text-hi)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {/* Mission Title & Progress */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
            }}
          >
            {activeMission.title}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#94a3b8',
              letterSpacing: '0.06em',
            }}
          >
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Current Active Objective */}
        {currentObj && (
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.45,
              color: currentObj.completed ? '#94a3b8' : '#f1f5f9',
              fontWeight: currentObj.completed ? 400 : 500,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
            }}
          >
            <span style={{ color: currentObj.completed ? '#4ade80' : 'var(--gold)', fontSize: 10, marginTop: 2 }}>
              {currentObj.completed ? '✓' : '◆'}
            </span>
            <span>{currentObj.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
