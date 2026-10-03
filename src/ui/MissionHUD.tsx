// ============================================================
// MISSION HUD — Dynamic Mission Tracker & Cinematic Banner
// Displays current mission objectives, flashes on completion,
// and presents a cinematic reveal banner when a new chapter begins.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useCampaignStore } from '../campaign/CampaignSystem';
import type { Mission } from '../campaign/types';

function getActLabel(act: string): string {
  switch (act) {
    case 'prologue':
      return 'PROLOGUE';
    case 'act1':
      return 'ACT I';
    case 'act2':
      return 'ACT II';
    case 'act3':
      return 'ACT III';
    case 'act4':
      return 'ACT IV';
    default:
      return 'CHAPTER';
  }
}

export default function MissionHUD() {
  const activeMissionId = useCampaignStore((s) => s.activeMissionId);
  const missions = useCampaignStore((s) => s.missions);

  const activeMission = missions.find((m) => m.id === activeMissionId);

  // ── Mission Banner Reveal on Mission Start / Switch ──
  const prevMissionIdRef = useRef<string | null>(null);
  const [bannerMission, setBannerMission] = useState<Mission | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const bannerTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!activeMission) return;
    if (activeMission.id !== prevMissionIdRef.current) {
      prevMissionIdRef.current = activeMission.id;
      setBannerMission(activeMission);
      setBannerVisible(true);

      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => {
        setBannerVisible(false);
      }, 4200);
    }
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [activeMission]);

  // ── Objective Completion Flash ──
  const completedIdsRef = useRef<Set<string>>(new Set());
  const [flashObjId, setFlashObjId] = useState<string | null>(null);
  const flashTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!activeMission) return;
    const currentCompleted = new Set(
      activeMission.objectives.filter((o) => o.completed).map((o) => o.id)
    );

    // Find any objective that wasn't previously recorded as completed
    for (const id of currentCompleted) {
      if (!completedIdsRef.current.has(id)) {
        setFlashObjId(id);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setFlashObjId(null), 2400);
        break;
      }
    }
    completedIdsRef.current = currentCompleted;

    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [activeMission?.objectives]);

  if (!activeMission) return null;

  const currentObj =
    activeMission.objectives.find((o) => !o.completed) ||
    activeMission.objectives[activeMission.objectives.length - 1];
  const completedCount = activeMission.objectives.filter((o) => o.completed).length;
  const totalCount = activeMission.objectives.length;

  return (
    <>
      <style>{`
        @keyframes mission-banner-in {
          0% {
            opacity: 0;
            transform: translate(-50%, -18px) scale(0.96);
          }
          14% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
          82% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -10px) scale(0.98);
          }
        }
        @keyframes obj-flash-glow {
          0% {
            background: rgba(181, 154, 74, 0.18);
          }
          100% {
            background: transparent;
          }
        }
        @keyframes subtle-gold-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* ── Cinematic Mission Activation Banner ── */}
      {bannerVisible && bannerMission && (
        <div
          style={{
            position: 'fixed',
            top: '16%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 120,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '16px 36px',
            background: '#0C1119',
            borderTop: '1px solid #B59A4A',
            borderBottom: '1px solid #292923',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
            borderRadius: 4,
            maxWidth: 580,
            animation: 'mission-banner-in 4.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#B59A4A',
              marginBottom: 4,
            }}
          >
            {getActLabel(bannerMission.act)}  —  NEW MISSION
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display, serif)',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#E8E3D8',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {bannerMission.title}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              lineHeight: 1.5,
              color: '#77756D',
              maxWidth: 480,
            }}
          >
            {bannerMission.briefing}
          </div>
        </div>
      )}

      {/* ── Top-Left Corner Objective Tracker ── */}
      <div
        style={{
          position: 'fixed',
          top: 56,
          left: 20,
          zIndex: 90,
          width: 300,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: '#0C1119',
            backdropFilter: 'blur(12px)',
            border: '1px solid #292923',
            borderLeft: '3px solid #B59A4A',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            borderRadius: 4,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            color: '#E8E3D8',
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
                color: '#B59A4A',
              }}
            >
              {activeMission.title}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#77756D',
                letterSpacing: '0.06em',
                fontFamily: 'var(--font-ui)',
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
                color: currentObj.completed ? '#77756D' : '#E8E3D8',
                fontWeight: currentObj.completed ? 400 : 500,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 7,
                borderRadius: 3,
                padding: '2px 4px',
                animation:
                  flashObjId === currentObj.id
                    ? 'obj-flash-glow 2.4s ease-out forwards'
                    : undefined,
              }}
            >
              <span
                style={{
                  color: currentObj.completed ? '#4E8A5E' : '#B59A4A',
                  fontSize: 10,
                  marginTop: 2,
                  animation: !currentObj.completed ? 'subtle-gold-pulse 2s infinite ease-in-out' : undefined,
                }}
              >
                {currentObj.completed ? '✓' : '◆'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>{currentObj.text}</span>
                {currentObj.echoHint && !currentObj.completed && (
                  <span
                    style={{
                      fontSize: 10,
                      color: '#B59A4A',
                      letterSpacing: '0.03em',
                    }}
                  >
                    ECHO HINT: {currentObj.echoHint}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
