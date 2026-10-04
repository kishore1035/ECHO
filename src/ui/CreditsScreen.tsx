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
        background: '#070B12',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        color: '#E8E3D8',
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
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: '0.28em',
              color: '#E8E3D8',
              textShadow: '0 0 40px rgba(181, 154, 74, 0.18)',
              fontFamily: 'var(--font-display, serif)',
            }}
          >
            ECHO
          </div>
          <div
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              letterSpacing: '0.08em',
              color: 'rgba(232, 227, 216, 0.72)',
              marginTop: 6,
            }}
          >
            "Every word changes the world."
          </div>
        </div>

        <div
          style={{
            width: 140,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #B59A4A, transparent)',
          }}
        />

        {/* Roles & Team */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, lineHeight: 1.6 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#77756D', textTransform: 'uppercase' }}>
              Concept & Direction
            </div>
            <div style={{ fontWeight: 600, color: '#E8E3D8', marginTop: 2 }}>
              Antigravity AI & Pair Programmer
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#77756D', textTransform: 'uppercase' }}>
              World Simulation & Procedural Terrain
            </div>
            <div style={{ fontWeight: 600, color: '#E8E3D8', marginTop: 2 }}>
              Three.js, React Three Fiber, Simplex Noise
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#77756D', textTransform: 'uppercase' }}>
              Voice Command Pipeline & Natural Language
            </div>
            <div style={{ fontWeight: 600, color: '#E8E3D8', marginTop: 2 }}>
              Gemini Generative Language Model & Web Speech API
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#77756D', textTransform: 'uppercase' }}>
              Chronal Timeline & Alternate Realities
            </div>
            <div style={{ fontWeight: 600, color: '#E8E3D8', marginTop: 2 }}>
              Deterministic State Snapshots & Web Audio Synthesis
            </div>
          </div>
        </div>

        <div
          style={{
            width: 140,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #B59A4A, transparent)',
          }}
        />

        <div style={{ fontSize: 11, color: '#77756D' }}>
          Thank you for exploring and speaking life into this world.
        </div>

        <button
          onClick={() => {
            playMenuBack();
            onClose();
          }}
          style={{
            marginTop: 10,
            background: 'rgba(181, 154, 74, 0.1)',
            border: '1px solid #B59A4A',
            color: '#B59A4A',
            borderRadius: 3,
            padding: '8px 24px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
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
