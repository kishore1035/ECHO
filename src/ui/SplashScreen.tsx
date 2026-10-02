// ============================================================
// SPLASH SCREEN — Game Studio & Title Intro Sequence
// "Alt F4" Studio Intro → ECHO Logo Reveal → Title Screen
//
// Sequence:
// 1. BLACK SCREEN (0.0s - 0.4s)
// 2. Subtle cursor appears (0.4s - 0.7s)
// 3. Progressive typing: "ALT" -> "ALT F4" with mechanical audio (0.7s - 1.8s)
// 4. Subtle micro visual distortion & audio blip (1.8s - 2.0s)
// 5. "presents" appears understated (2.0s - 2.7s)
// 6. Complete fade to black & brief silence (2.7s - 3.4s)
// 7. Low resonant Echo sound + ECHO logo reveal (3.4s - 5.4s)
// 8. Seamless fade-through into live ECHO Title Screen (5.4s - 6.2s)
// ============================================================

import { useEffect, useState, useRef } from 'react';
import {
  playKeystroke,
  playGlitchDistortion,
  playEchoChime,
} from '../core/soundFX';

interface SplashScreenProps {
  onComplete: () => void;
}

type SplashStage =
  | 'black_initial'     // 0.0s - 0.4s
  | 'cursor_only'       // 0.4s - 0.7s
  | 'typing'            // 0.7s - 1.8s
  | 'distortion'        // 1.8s - 2.0s
  | 'presents'          // 2.0s - 2.7s
  | 'black_pause'       // 2.7s - 3.4s
  | 'echo_reveal'       // 3.4s - 5.4s
  | 'fading_out';       // 5.4s - 6.2s

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [stage, setStage] = useState<SplashStage>('black_initial');
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const [showPresents, setShowPresents] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [echoOpacity, setEchoOpacity] = useState(0);

  const completedRef = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    timeoutsRef.current.forEach(clearTimeout);
    onComplete();
  };

  useEffect(() => {
    const addTimeout = (fn: () => void, delayMs: number) => {
      const id = setTimeout(fn, delayMs);
      timeoutsRef.current.push(id);
      return id;
    };

    // 0.4s: Cursor appears
    addTimeout(() => {
      setStage('cursor_only');
      setShowCursor(true);
    }, 400);

    // Progressive typing of "ALT F4" with keystroke audio
    // Characters: 'A' (700ms), 'L' (850ms), 'T' (980ms), ' ' (1180ms), 'F' (1340ms), '4' (1500ms)
    const typingSchedule: { text: string; delay: number; pitch: number }[] = [
      { text: 'A', delay: 720, pitch: 0 },
      { text: 'AL', delay: 880, pitch: 1 },
      { text: 'ALT', delay: 1040, pitch: 0 },
      { text: 'ALT ', delay: 1220, pitch: -1 },
      { text: 'ALT F', delay: 1390, pitch: 1 },
      { text: 'ALT F4', delay: 1560, pitch: 2 },
    ];

    typingSchedule.forEach(({ text, delay, pitch }) => {
      addTimeout(() => {
        setStage('typing');
        setTypedText(text);
        playKeystroke(pitch);
      }, delay);
    });

    // 1.82s: Very subtle technical distortion / glitch
    addTimeout(() => {
      setStage('distortion');
      setIsGlitching(true);
      playGlitchDistortion();
    }, 1820);

    // 1.95s: Glitch settles cleanly
    addTimeout(() => {
      setIsGlitching(false);
    }, 1960);

    // 2.08s: "presents" appears understated beneath "ALT F4"
    addTimeout(() => {
      setStage('presents');
      setShowPresents(true);
    }, 2080);

    // 2.75s: Fade Alt F4 section out to pure black
    addTimeout(() => {
      setStage('black_pause');
      setShowCursor(false);
    }, 2750);

    // 3.45s: Low resonant Echo sound begins & ECHO logo reveals
    addTimeout(() => {
      setStage('echo_reveal');
      playEchoChime();
      setEchoOpacity(1);
    }, 3450);

    // 5.40s: Soft fade out transition
    addTimeout(() => {
      setStage('fading_out');
      setEchoOpacity(0);
    }, 5400);

    // 6.20s: Complete sequence -> transition into live Title Screen
    addTimeout(() => {
      finish();
    }, 6200);

    // Allow user to skip by pressing any key or clicking
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault();
        finish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isAltF4Visible =
    stage === 'cursor_only' ||
    stage === 'typing' ||
    stage === 'distortion' ||
    stage === 'presents';

  return (
    <div
      onClick={finish}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#000000',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes altCursorBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        @keyframes altGlitchFlicker {
          0% {
            transform: translate(0, 0);
            text-shadow: none;
            opacity: 1;
          }
          20% {
            transform: translate(-1px, 0.5px);
            text-shadow: 1px 0 rgba(148, 163, 184, 0.4), -1px 0 rgba(226, 232, 240, 0.3);
            opacity: 0.94;
          }
          40% {
            transform: translate(1px, -0.5px);
            text-shadow: -1px 0 rgba(148, 163, 184, 0.4);
            opacity: 1;
          }
          60% {
            transform: translate(0, 0);
            text-shadow: none;
            opacity: 0.96;
          }
          80% {
            transform: translate(-0.5px, 0);
            text-shadow: 0.5px 0 rgba(203, 213, 225, 0.3);
            opacity: 1;
          }
          100% {
            transform: translate(0, 0);
            text-shadow: none;
            opacity: 1;
          }
        }

        @keyframes echoSubtleBloom {
          0% {
            letter-spacing: 0.55em;
            transform: scale(0.97);
          }
          100% {
            letter-spacing: 0.72em;
            transform: scale(1.0);
          }
        }
      `}</style>

      {/* ─── SECTION 1: "ALT F4 presents" Studio Intro ─── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isAltF4Visible ? 1 : 0,
          transition: 'opacity 0.45s ease',
          pointerEvents: 'none',
        }}
      >
        {/* Main studio wordmark */}
        <div
          style={{
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
            fontSize: 'clamp(28px, 4.5vw, 44px)',
            fontWeight: 700,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#f8fafc',
            display: 'inline-flex',
            alignItems: 'center',
            position: 'relative',
            animation: isGlitching
              ? 'altGlitchFlicker 0.14s steps(2) infinite'
              : 'none',
          }}
        >
          <span>{typedText}</span>
          {showCursor && (
            <span
              style={{
                display: 'inline-block',
                width: '0.55em',
                height: '2px',
                background: '#94a3b8',
                marginLeft: '6px',
                verticalAlign: 'middle',
                animation: 'altCursorBlink 0.75s infinite',
              }}
            />
          )}
        </div>

        {/* Understated "presents" */}
        <div
          style={{
            marginTop: 18,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
            fontSize: 'clamp(11px, 1.4vw, 13px)',
            fontWeight: 400,
            letterSpacing: '0.42em',
            color: '#64748b',
            textTransform: 'lowercase',
            opacity: showPresents && isAltF4Visible ? 1 : 0,
            transform: showPresents ? 'translateY(0)' : 'translateY(4px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          presents
        </div>
      </div>

      {/* ─── SECTION 2: ECHO Title & Tagline Reveal ─── */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: echoOpacity,
          transition: 'opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none',
        }}
      >
        {/* Decorative thin accent line */}
        <div
          style={{
            width: 48,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)',
            marginBottom: 24,
            opacity: 0.6,
          }}
        />

        {/* ECHO Logo */}
        <h1
          style={{
            margin: 0,
            padding: 0,
            fontFamily:
              '"Cinzel", "Times New Roman", "Outfit", -apple-system, sans-serif',
            fontSize: 'clamp(42px, 7vw, 76px)',
            fontWeight: 600,
            letterSpacing: '0.65em',
            textIndent: '0.65em', // optical centering for wide tracking
            color: '#ffffff',
            textShadow:
              '0 0 45px rgba(255, 255, 255, 0.22), 0 0 90px rgba(232, 200, 74, 0.12)',
            animation:
              stage === 'echo_reveal'
                ? 'echoSubtleBloom 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                : 'none',
          }}
        >
          E C H O
        </h1>

        {/* Tagline */}
        <div
          style={{
            marginTop: 20,
            fontFamily:
              'ui-monospace, "SF Mono", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(9.5px, 1.2vw, 11.5px)',
            fontWeight: 500,
            letterSpacing: '0.45em',
            textIndent: '0.45em',
            color: '#94a3b8',
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          EVERY WORD CHANGES THE WORLD
        </div>

        {/* Bottom subtle rule */}
        <div
          style={{
            width: 48,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)',
            marginTop: 24,
            opacity: 0.6,
          }}
        />
      </div>

      {/* Subtle skip prompt in bottom right corner */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          right: 28,
          fontSize: 9.5,
          letterSpacing: '0.22em',
          color: 'rgba(148, 163, 184, 0.35)',
          fontFamily: 'ui-monospace, monospace',
          textTransform: 'uppercase',
        }}
      >
        [SPACE / ESC TO SKIP]
      </div>
    </div>
  );
}
