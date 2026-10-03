// ============================================================
// TOP NAVIGATOR / COMPASS — Action-Adventure Directional Ribbon
// Ribbon compass showing dynamic bearings, cardinal points,
// active quest objective, and contextual landmarks within range.
// High-performance canvas-based render loop decoupled from React state.
// ============================================================

import { useEffect, useRef } from 'react';
import { navState, calculateBearing, WORLD_LANDMARK_MARKERS, type CompassMarker } from '../core/navState';
import { useCampaignStore } from '../campaign/CampaignSystem';
import { useWorldStore } from '../core/WorldState';

interface CompassProps {
  isDialogueOpen?: boolean;
}

const CARDINALS: { deg: number; label: string; isMajor?: boolean; isNorth?: boolean }[] = [
  { deg: 0, label: 'N', isMajor: true, isNorth: true },
  { deg: 45, label: 'NE' },
  { deg: 90, label: 'E', isMajor: true },
  { deg: 135, label: 'SE' },
  { deg: 180, label: 'S', isMajor: true },
  { deg: 225, label: 'SW' },
  { deg: 270, label: 'W', isMajor: true },
  { deg: 315, label: 'NW' },
];

export default function Compass({ isDialogueOpen = false }: CompassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Set render dimensions handling high-DPI
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Current camera heading in degrees [0, 360)
      const headingDeg = ((navState.yaw * 180) / Math.PI + 360) % 360;
      const centerX = width / 2;
      const fovDeg = 110; // Total horizontal degrees visible across compass bar
      const halfFov = fovDeg / 2;
      const halfWidth = width / 2;

      // ── 1. Draw subtle horizontal base reference line ──
      const lineY = height - 12;
      ctx.strokeStyle = '#292923';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12, lineY);
      ctx.lineTo(width - 12, lineY);
      ctx.stroke();

      // ── 2. Draw 15-degree sub-ticks ──
      for (let deg = 0; deg < 360; deg += 15) {
        let diff = ((deg - headingDeg + 540) % 360) - 180;
        if (Math.abs(diff) <= halfFov) {
          const x = centerX + (diff / halfFov) * (halfWidth - 20);
          const edgeAlpha = Math.max(0, 1 - Math.pow(Math.abs(diff) / halfFov, 2.2));
          const isCardinal = deg % 45 === 0;

          if (!isCardinal) {
            ctx.strokeStyle = `rgba(119, 117, 109, ${0.35 * edgeAlpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, lineY - 4);
            ctx.lineTo(x, lineY);
            ctx.stroke();
          }
        }
      }

      // ── 3. Draw Cardinal & Ordinal Points ──
      for (const card of CARDINALS) {
        let diff = ((card.deg - headingDeg + 540) % 360) - 180;
        if (Math.abs(diff) <= halfFov) {
          const x = centerX + (diff / halfFov) * (halfWidth - 20);
          const edgeAlpha = Math.max(0, 1 - Math.pow(Math.abs(diff) / halfFov, 2.0));

          // Tick line
          ctx.strokeStyle = card.isNorth
            ? `rgba(181, 154, 74, ${0.95 * edgeAlpha})`
            : card.isMajor
            ? `rgba(232, 227, 216, ${0.7 * edgeAlpha})`
            : `rgba(119, 117, 109, ${0.5 * edgeAlpha})`;
          ctx.lineWidth = card.isNorth ? 2 : card.isMajor ? 1.5 : 1;
          ctx.beginPath();
          ctx.moveTo(x, lineY - (card.isNorth ? 8 : card.isMajor ? 6 : 4));
          ctx.lineTo(x, lineY);
          ctx.stroke();

          // Text label
          ctx.font = card.isNorth
            ? 'bold 11px "Inter", sans-serif'
            : card.isMajor
            ? '600 10px "Inter", sans-serif'
            : '500 9px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = card.isNorth
            ? `rgba(181, 154, 74, ${edgeAlpha})`
            : card.isMajor
            ? `rgba(232, 227, 216, ${0.9 * edgeAlpha})`
            : `rgba(119, 117, 109, ${0.75 * edgeAlpha})`;
          ctx.fillText(card.label, x, lineY - 10);
        }
      }

      // ── 4. Determine Contextual World Markers ──
      const pX = navState.playerX;
      const pZ = navState.playerZ;

      // Extract Active Quest Objective
      const campaign = useCampaignStore.getState();
      const activeMission = campaign.missions.find((m) => m.id === campaign.activeMissionId);
      const activeObj = activeMission?.objectives.find((o) => !o.completed);

      const markersToDraw: (CompassMarker & { dist: number; diff: number })[] = [];

      if (activeObj) {
        // Resolve target coords for current objective
        let objX = 0;
        let objZ = 6;
        let objName = activeObj.text.replace(/^Approach\s+/i, '').replace(/^Demonstrate\s+/i, '').slice(0, 14).toUpperCase();

        const worldEntities = useWorldStore.getState().entities;
        const rowan = Object.values(worldEntities).find((e) => e.name.includes('Rowan'));
        const mira = Object.values(worldEntities).find((e) => e.name.includes('Mira'));

        if (activeObj.id === 'obj_approach_rowan' || activeObj.id === 'obj_demonstrate_echo') {
          if (rowan) { objX = rowan.position.x; objZ = rowan.position.z; }
          objName = 'ROWAN';
        } else if (activeObj.id.includes('mira')) {
          if (mira) { objX = mira.position.x; objZ = mira.position.z; }
          objName = 'MIRA';
        } else if (activeObj.id.includes('stone') || activeObj.id.includes('ruin')) {
          objX = -4; objZ = 9;
          objName = 'WHISPERING STONES';
        } else if (activeObj.id.includes('castle') || activeObj.id.includes('aldric')) {
          objX = 18; objZ = -14;
          objName = 'CASTLE';
        }

        const bearing = calculateBearing(pX, pZ, objX, objZ);
        const diff = ((bearing - headingDeg + 540) % 360) - 180;
        const dist = Math.round(Math.hypot(pX - objX, pZ - objZ));

        markersToDraw.push({
          id: 'active_obj',
          label: objName,
          x: objX,
          z: objZ,
          isObjective: true,
          priority: 5,
          dist,
          diff,
        });
      }

      // Add nearby world landmarks within 90m
      for (const lm of WORLD_LANDMARK_MARKERS) {
        // Don't duplicate if already target of active objective
        if (markersToDraw.some((m) => m.label.includes(lm.label.slice(0, 4)))) continue;

        const dist = Math.round(Math.hypot(pX - lm.x, pZ - lm.z));
        if (dist <= 85) {
          const bearing = calculateBearing(pX, pZ, lm.x, lm.z);
          const diff = ((bearing - headingDeg + 540) % 360) - 180;
          const isBridge = lm.id === 'bridge';
          const bridgeDestroyed = useWorldStore.getState().bridgeDestroyed;
          markersToDraw.push({
            ...lm,
            label: isBridge && bridgeDestroyed ? 'BROKEN BRIDGE' : lm.label,
            dist,
            diff,
          });
        }
      }

      // ── 5. Render Markers along Compass Ribbon ──
      for (const m of markersToDraw) {
        if (Math.abs(m.diff) <= halfFov) {
          const x = centerX + (m.diff / halfFov) * (halfWidth - 20);
          const edgeAlpha = Math.max(0, 1 - Math.pow(Math.abs(m.diff) / halfFov, 2.0));

          if (m.isObjective) {
            // Emphasized Active Story Objective (Antique Gold Diamond & Distance)
            const isNear = m.dist <= 10;
            const markerY = 14;

            // Diamond marker ◆
            ctx.fillStyle = `rgba(181, 154, 74, ${edgeAlpha})`;
            ctx.beginPath();
            ctx.moveTo(x, markerY - 5);
            ctx.lineTo(x + 4, markerY);
            ctx.lineTo(x, markerY + 5);
            ctx.lineTo(x - 4, markerY);
            ctx.closePath();
            ctx.fill();

            // Label with distance
            ctx.font = 'bold 9px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = isNear ? `rgba(232, 227, 216, ${edgeAlpha})` : `rgba(181, 154, 74, ${0.9 * edgeAlpha})`;
            const labelText = isNear ? `${m.label} (${m.dist}m)` : `${m.label} ${m.dist}m`;
            ctx.fillText(labelText, x, markerY - 7);
          } else {
            // Subtle Landmark Marker (Muted Gray Diamond & Distance)
            const markerY = 16;
            ctx.fillStyle = `rgba(119, 117, 109, ${0.7 * edgeAlpha})`;
            ctx.beginPath();
            ctx.moveTo(x, markerY - 3.5);
            ctx.lineTo(x + 3, markerY);
            ctx.lineTo(x, markerY + 3.5);
            ctx.lineTo(x - 3, markerY);
            ctx.closePath();
            ctx.fill();

            // Short label
            ctx.font = '500 8px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = `rgba(119, 117, 109, ${0.75 * edgeAlpha})`;
            ctx.fillText(`${m.label} ${m.dist}m`, x, markerY - 5);
          }
        }
      }

      // ── 6. Fixed Center Heading Reticle / Notch ──
      ctx.fillStyle = '#B59A4A';
      ctx.beginPath();
      ctx.moveTo(centerX - 4, 3);
      ctx.lineTo(centerX + 4, 3);
      ctx.lineTo(centerX, 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 150,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: isDialogueOpen ? 0 : 1,
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <div
        style={{
          width: 480,
          maxWidth: 'calc(100vw - 32px)',
          height: 40,
          background: '#0C1119',
          backdropFilter: 'blur(12px)',
          border: '1px solid #292923',
          borderRadius: 4,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          position: 'relative',
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}
