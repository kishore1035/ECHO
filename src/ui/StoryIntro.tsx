// ============================================================
// STORY INTRO — Cinematic Opening Sequence for New Game
// Minimalist, atmospheric text reveal before entering the world
// ============================================================

import { useEffect, useState } from 'react';
import { playMenuSelect, playMenuBack } from '../core/soundFX';

interface StoryIntroProps {
  onComplete: () => void;
}

const INTRO_LINES = [
  'In the beginning, the realm stood silent, trapped in an uneasy truce.',
  'King Aldric assembled the Suncrest Paladins atop the Eastern Ridge.',
  'Across the river, Warlord Vorn carved the iron camp of the Shadowfang Legion.',
  'Then... an unseen presence descended over the valley.',
  'The Voice.',
  'Every word spoken here bends the sky, commands the factions, and rewires reality itself.',
  'The crowns await your decree.',
];

export default function StoryIntro({ onComplete }: StoryIntroProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  const advanceLine = () => {
    if (currentLineIndex < INTRO_LINES.length - 1) {
      playMenuSelect();
      setCurrentLineIndex((i) => i + 1);
      setFadeKey((k) => k + 1);
    } else {
      playMenuSelect();
      onComplete();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        advanceLine();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        playMenuBack();
        onComplete(); // Skip
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentLineIndex]);

  // Auto-advance timer (5.5 seconds per line if user doesn't press anything)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentLineIndex < INTRO_LINES.length - 1) {
        setCurrentLineIndex((i) => i + 1);
        setFadeKey((k) => k + 1);
      } else {
        onComplete();
      }
    }, 5500);

    return () => clearTimeout(timer);
  }, [currentLineIndex]);

  const currentLine = INTRO_LINES[currentLineIndex];
  const isFinalLine = currentLineIndex === INTRO_LINES.length - 1;

  return (
    <div
      onClick={advanceLine}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: '#070B12',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        color: '#E8E3D8',
        fontFamily: 'var(--font-body)',
        cursor: 'pointer',
      }}
    >
      <style>{`
        @keyframes introTextFade {
          0% { opacity: 0; transform: translateY(12px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Progress dots */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          display: 'flex',
          gap: 8,
        }}
      >
        {INTRO_LINES.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentLineIndex ? 22 : 5,
              height: 3,
              borderRadius: 2,
              background: i === currentLineIndex ? '#B59A4A' : '#292923',
              transition: 'all 0.35s ease',
            }}
          />
        ))}
      </div>

      {/* Center Cinematic Text */}
      <div
        key={fadeKey}
        style={{
          maxWidth: 680,
          textAlign: 'center',
          animation: 'introTextFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <p
          style={{
            fontSize: currentLine === 'The Voice.' ? 46 : 21,
            fontWeight: currentLine === 'The Voice.' ? 700 : 400,
            fontFamily: currentLine === 'The Voice.' ? 'var(--font-display)' : 'var(--font-body)',
            lineHeight: 1.65,
            color: currentLine === 'The Voice.' ? '#B59A4A' : '#E8E3D8',
            letterSpacing: currentLine === 'The Voice.' ? '0.35em' : '0.03em',
            textShadow: currentLine === 'The Voice.' ? '0 0 50px rgba(181, 154, 74, 0.45)' : 'none',
          }}
        >
          {currentLine}
        </p>
      </div>

      {/* Bottom prompt */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 11,
          color: '#77756D',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ color: '#E8E3D8' }}>
          {isFinalLine ? '[PRESS ENTER TO AWAKEN]' : '[PRESS ENTER OR CLICK TO CONTINUE]'}
        </span>
        <span>•</span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            playMenuBack();
            onComplete();
          }}
          style={{ cursor: 'pointer', color: '#77756D' }}
        >
          [ESC] SKIP INTRO
        </span>
      </div>
    </div>
  );
}
