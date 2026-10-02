// ============================================================
// TITLE SCREEN — ECHO M5 Polish — Game-Grade Presentation Shell
// ECHO: "Every word changes the world."
// Classic atmospheric game title over live 3D world
// Keyboard nav: Arrow/W/S = move, Enter = select, Esc = back
// ============================================================

import { useEffect, useState, useRef } from 'react';
import SaveLoadModal from './SaveLoadModal';
import OptionsMenu from './OptionsMenu';
import CreditsScreen from './CreditsScreen';
import HelpModal from './HelpModal';
import { hasAnySave, getMostRecentSave, loadFromSlot } from '../core/saveSystem';
import {
  playMenuHover,
  playMenuSelect,
  playMenuBack,
  startTitleAmbience,
  stopTitleAmbience,
} from '../core/soundFX';

interface TitleScreenProps {
  onNewGame: () => void;
  onContinue: () => void;
}

export default function TitleScreen({ onNewGame, onContinue }: TitleScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<'load' | 'save' | 'options' | 'credits' | 'help' | null>(null);
  const [quitMessage, setQuitMessage] = useState(false);
  const [mounted, setMounted] = useState(false);
  const canContinue = hasAnySave();
  const quitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Entrance animation trigger + ambience
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    startTitleAmbience();
    return () => {
      clearTimeout(t);
      stopTitleAmbience();
    };
  }, []);

  useEffect(() => () => {
    if (quitTimer.current) clearTimeout(quitTimer.current);
  }, []);

  const MENU_ITEMS = [
    {
      id: 'new_game',
      label: 'NEW GAME',
      action: () => { stopTitleAmbience(); onNewGame(); },
      enabled: true,
      hint: 'Embark on a new spoken timeline',
    },
    {
      id: 'continue',
      label: 'CONTINUE',
      action: () => {
        const recent = getMostRecentSave();
        if (recent) { loadFromSlot(recent.slotId); stopTitleAmbience(); onContinue(); }
      },
      enabled: canContinue,
      hint: canContinue ? 'Resume your most recent reality' : 'No save data found',
    },
    {
      id: 'load_game',
      label: 'LOAD GAME',
      action: () => setActiveModal('load'),
      enabled: true,
      hint: 'Choose from 3 recorded timeline slots',
    },
    {
      id: 'options',
      label: 'OPTIONS',
      action: () => setActiveModal('options'),
      enabled: true,
      hint: 'Graphics, audio, and controls',
    },
    {
      id: 'help',
      label: 'HELP',
      action: () => setActiveModal('help'),
      enabled: true,
      hint: 'Codex, voice commands, and game mechanics',
    },
    {
      id: 'credits',
      label: 'CREDITS',
      action: () => setActiveModal('credits'),
      enabled: true,
      hint: 'The minds behind ECHO',
    },
    {
      id: 'quit',
      label: 'QUIT',
      action: () => {
        setQuitMessage(true);
        quitTimer.current = setTimeout(() => setQuitMessage(false), 3500);
      },
      enabled: true,
      hint: 'Close simulation and return to silence',
    },
  ];

  // Keyboard navigation
  useEffect(() => {
    if (activeModal !== null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedIndex((i) => {
          let next = (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
          if (!MENU_ITEMS[next].enabled) next = (next - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
          playMenuHover();
          return next;
        });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedIndex((i) => {
          let next = (i + 1) % MENU_ITEMS.length;
          if (!MENU_ITEMS[next].enabled) next = (next + 1) % MENU_ITEMS.length;
          playMenuHover();
          return next;
        });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const item = MENU_ITEMS[selectedIndex];
        if (item?.enabled) { playMenuSelect(); item.action(); }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        playMenuBack();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIndex, activeModal, canContinue]);

  const activeItem = MENU_ITEMS[selectedIndex];

  return (
    <>
      {/* ── Full-screen overlay with gradient from left ── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        pointerEvents: activeModal !== null ? 'none' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 76px',
        background: [
          'linear-gradient(90deg, rgba(2, 5, 12, 0.97) 0%, rgba(2, 5, 12, 0.82) 36%, rgba(2, 5, 12, 0.3) 62%, transparent 100%)',
          'linear-gradient(180deg, rgba(2, 5, 12, 0.35) 0%, transparent 35%, transparent 65%, rgba(2, 5, 12, 0.55) 100%)',
        ].join(', '),
        overflow: 'hidden',
      }}>

        {/* ── Decorative horizontal rule top ── */}
        <div style={{
          position: 'absolute',
          top: 52,
          left: 76,
          right: 76,
          height: '1px',
          background: 'linear-gradient(90deg, rgba(232,200,74,0.55) 0%, rgba(232,200,74,0.08) 60%, transparent 100%)',
        }} />

        {/* ── ECHO Title Block ── */}
        <div style={{ maxWidth: 520, opacity: mounted ? 1 : 0, transition: 'none' }}>

          {/* Subtitle / Series tag */}
          <div style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            letterSpacing: '0.42em',
            color: 'var(--gold-dim)',
            marginBottom: 16,
            animation: mounted ? 'vw-fadein 0.7s 0.1s ease both' : 'none',
            textTransform: 'uppercase',
          }}>
            A SPOKEN WORLD
          </div>

          {/* Main Title — ECHO */}
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 86,
            fontWeight: 700,
            lineHeight: 0.9,
            color: '#f5f0e8',
            letterSpacing: '0.35em',
            textShadow: [
              '0 0 60px rgba(232, 200, 74, 0.28)',
              '0 0 120px rgba(232, 200, 74, 0.12)',
              '0 4px 32px rgba(0,0,0,0.8)',
            ].join(', '),
            animation: mounted ? 'echo-title-in 1.2s 0.2s ease both' : 'none',
          }}>
            ECHO
          </div>

          {/* Gold divider under title */}
          <div style={{
            width: 220,
            height: 1,
            background: 'linear-gradient(90deg, var(--gold) 0%, rgba(232,200,74,0.12) 100%)',
            marginTop: 18,
            marginBottom: 16,
            animation: mounted ? 'vw-fadein 0.6s 0.9s ease both' : 'none',
            opacity: 0,
          }} />

          {/* Tagline */}
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '0.11em',
            color: 'rgba(220, 210, 190, 0.72)',
            animation: mounted ? 'echo-tagline-in 0.8s 1.1s ease both' : 'none',
            opacity: 0,
          }}>
            "Every word changes the world."
          </div>
        </div>

        {/* ── Navigation Menu ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          width: 320,
        }}>
          {MENU_ITEMS.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            const isDisabled = !item.enabled;
            return (
              <div
                key={item.id}
                onMouseEnter={() => {
                  if (!isDisabled) { setSelectedIndex(idx); playMenuHover(); }
                }}
                onClick={() => {
                  if (!isDisabled) { playMenuSelect(); item.action(); }
                }}
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 12.5,
                  letterSpacing: isSelected ? '0.24em' : '0.18em',
                  textTransform: 'uppercase' as const,
                  padding: '10px 0 10px 28px',
                  cursor: isDisabled ? 'default' : 'pointer',
                  position: 'relative',
                  color: isDisabled ? '#404858' : isSelected ? 'var(--gold)' : '#8a94a8',
                  transition: 'color 0.2s, letter-spacing 0.25s',
                  animation: mounted ? `echo-menu-in 0.5s ${0.9 + idx * 0.06}s ease both` : 'none',
                  opacity: 0,
                }}
              >
                {/* Left indicator bar */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: isSelected ? 18 : 0,
                  height: 1,
                  background: 'var(--gold)',
                  transition: 'width 0.2s ease',
                  boxShadow: isSelected ? '0 0 8px var(--gold-glow)' : 'none',
                }} />

                {/* Diamond bullet for selection */}
                {isSelected && (
                  <span style={{
                    position: 'absolute',
                    left: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 9,
                    color: 'var(--gold)',
                    opacity: 0.9,
                  }}>◆</span>
                )}

                <span style={{ paddingLeft: isSelected ? 14 : 0, transition: 'padding 0.2s' }}>
                  {item.label}
                </span>
              </div>
            );
          })}

          {/* Hint text */}
          <div style={{
            marginTop: 16,
            paddingLeft: 28,
            fontSize: 10.5,
            fontFamily: 'var(--font-body)',
            color: '#4a5568',
            fontStyle: 'italic',
            letterSpacing: '0.06em',
            minHeight: 16,
            animation: mounted ? 'vw-fadein 0.4s ease' : 'none',
          }}>
            {activeItem?.hint || ''}
          </div>
        </div>

        {/* ── Bottom Footer ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          animation: mounted ? 'vw-fadein 0.6s 1.4s ease both' : 'none',
          opacity: 0,
        }}>
          {/* Control hints */}
          <div style={{
            display: 'flex',
            gap: 20,
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            color: '#2e3848',
            letterSpacing: '0.1em',
          }}>
            {[['↑↓', 'NAVIGATE'], ['ENTER', 'SELECT'], ['ESC', 'BACK']].map(([key, label]) => (
              <span key={label}>
                <span style={{ color: '#485060', marginRight: 5 }}>{key}</span>
                {label}
              </span>
            ))}
          </div>

          {/* Version stamp */}
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 9.5,
            color: '#252f3f',
            letterSpacing: '0.12em',
          }}>
            ECHO v1.0 · M0–M5 · TIMELINE ENGINE
          </div>
        </div>

        {/* ── Decorative horizontal rule bottom ── */}
        <div style={{
          position: 'absolute',
          bottom: 52,
          left: 76,
          right: 76,
          height: '1px',
          background: 'linear-gradient(90deg, rgba(232,200,74,0.3) 0%, rgba(232,200,74,0.04) 50%, transparent 100%)',
        }} />

        {/* ── Quit Toast ── */}
        {quitMessage && (
          <div style={{
            position: 'fixed',
            bottom: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(6, 12, 22, 0.97)',
            border: '1px solid rgba(232, 200, 74, 0.4)',
            borderRadius: 6,
            padding: '12px 28px',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            letterSpacing: '0.12em',
            color: 'var(--gold-dim)',
            boxShadow: '0 0 40px rgba(232, 200, 74, 0.15)',
            animation: 'vw-fadein 0.3s ease',
          }}>
            Thank you for playing ECHO — close this browser tab to exit.
          </div>
        )}
      </div>

      {/* ── Sub-modals ── */}
      {activeModal === 'load' && (
        <SaveLoadModal
          mode="load"
          onClose={() => setActiveModal(null)}
          onLoaded={() => {
            setActiveModal(null);
            stopTitleAmbience();
            onContinue();
          }}
        />
      )}
      {activeModal === 'save' && (
        <SaveLoadModal mode="save" onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'options' && (
        <OptionsMenu onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'credits' && (
        <CreditsScreen onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'help' && (
        <HelpModal onClose={() => setActiveModal(null)} />
      )}
    </>
  );
}
