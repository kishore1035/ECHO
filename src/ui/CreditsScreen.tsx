// ============================================================
// CREDITS SCREEN — Atmospheric Game Credits
// Keyboard (Esc/Enter/Space) + Mouse
// ============================================================

import { useEffect } from 'react';
import { playMenuBack } from '../core/soundFX';

interface CreditsScreenProps {
  onClose: () => void;
}

export default function CreditsScreen({ onClose }: CreditsScreenProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playMenuBack();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'radial-gradient(circle at center, rgba(6, 14, 28, 0.94) 0%, rgba(2, 6, 14, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        color: '#f8fafc',
        fontFamily: '"Inter", sans-serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: 540,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 22,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title & Tagline */}
        <div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 900,
              letterSpacing: '0.25em',
              color: '#38bdf8',
              textShadow: '0 0 30px rgba(56, 189, 248, 0.5)',
              fontFamily: '"Outfit", "Inter", sans-serif',
            }}
          >
            ECHO
          </div>
          <div
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              letterSpacing: '0.08em',
              color: '#94a3b8',
              marginTop: 6,
            }}
          >
            "Every word changes the world."
          </div>
        </div>

        <div
          style={{
            width: 120,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)',
          }}
        />

        {/* Roles & Team */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, lineHeight: 1.6 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#64748b', textTransform: 'uppercase' }}>
              Concept & Direction
            </div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>
              Antigravity AI & Pair Programmer
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#64748b', textTransform: 'uppercase' }}>
              World Simulation & Procedural Terrain
            </div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>
              Three.js, React Three Fiber, Simplex Noise
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#64748b', textTransform: 'uppercase' }}>
              Voice Command Pipeline & Natural Language
            </div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>
              Gemini Generative Language Model & Web Speech API
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#64748b', textTransform: 'uppercase' }}>
              Chronal Timeline & Alternate Realities
            </div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>
              Deterministic State Snapshots & Web Audio Synthesis
            </div>
          </div>
        </div>

        <div
          style={{
            width: 120,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)',
          }}
        />

        <div style={{ fontSize: 11, color: '#64748b' }}>
          Thank you for exploring and speaking life into this world.
        </div>

        <button
          onClick={() => {
            playMenuBack();
            onClose();
          }}
          style={{
            marginTop: 10,
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
            borderRadius: 8,
            padding: '8px 24px',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
        >
          [RETURN TO TITLE]
        </button>
      </div>
    </div>
  );
}
