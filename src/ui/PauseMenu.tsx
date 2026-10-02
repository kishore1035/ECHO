// ============================================================
// PAUSE MENU — Minimalist In-Game Pause & Reality Controls
// RESUME • SAVE GAME • LOAD GAME • OPTIONS • RESTART CHECKPOINT • RETURN TO TITLE
// ============================================================

import { useEffect, useState } from 'react';
import SaveLoadModal from './SaveLoadModal';
import OptionsMenu from './OptionsMenu';
import HelpModal from './HelpModal';
import { TimelineSystem } from '../systems/TimelineSystem';
import { playMenuHover, playMenuSelect, playMenuBack } from '../core/soundFX';

interface PauseMenuProps {
  onResume: () => void;
  onReturnToTitle: () => void;
}

export default function PauseMenu({ onResume, onReturnToTitle }: PauseMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<'save' | 'load' | 'options' | 'help' | null>(null);

  const MENU_ITEMS = [
    { label: 'RESUME', action: () => onResume() },
    { label: 'SAVE GAME', action: () => setActiveModal('save') },
    { label: 'LOAD GAME', action: () => setActiveModal('load') },
    { label: 'OPTIONS', action: () => setActiveModal('options') },
    { label: 'HELP', action: () => setActiveModal('help') },
    {
      label: 'RESTART CHECKPOINT',
      action: () => {
        TimelineSystem.rewind('last');
        onResume();
      },
    },
    { label: 'RETURN TO TITLE', action: () => onReturnToTitle() },
  ];

  // Keyboard navigation
  useEffect(() => {
    if (activeModal !== null) return; // Delegate keyboard to sub-modals

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedIndex((i) => {
          const next = (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
          playMenuHover();
          return next;
        });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedIndex((i) => {
          const next = (i + 1) % MENU_ITEMS.length;
          playMenuHover();
          return next;
        });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playMenuSelect();
        MENU_ITEMS[selectedIndex].action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        playMenuBack();
        onResume();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIndex, activeModal]);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(2, 5, 12, 0.82)',
          backdropFilter: 'blur(18px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-body)',
          color: 'var(--text-hi)',
          animation: 'vw-fadein 0.22s ease',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, minWidth: 300 }}>
          {/* Pause Header */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, letterSpacing: '0.45em', color: 'var(--gold-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
              SIMULATION SUSPENDED
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 700, letterSpacing: '0.28em', color: 'var(--text-hi)', textShadow: '0 0 40px rgba(232,200,74,0.18)' }}>
              PAUSED
            </div>
            <div style={{ width: 160, height: 1, background: 'linear-gradient(90deg, transparent, var(--gold-dim), transparent)', margin: '12px auto 0' }} />
          </div>
          {/* Menu Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            {MENU_ITEMS.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div key={item.label} onMouseEnter={() => { setSelectedIndex(idx); playMenuHover(); }} onClick={() => { playMenuSelect(); item.action(); }}
                  style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, letterSpacing: isSelected ? '0.24em' : '0.18em', textTransform: 'uppercase' as const, padding: '10px 0 10px 26px', cursor: 'pointer', position: 'relative', color: isSelected ? 'var(--gold)' : '#6a7488', transition: 'color 0.18s, letter-spacing 0.22s' }}>
                  <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: isSelected ? 16 : 0, height: 1, background: 'var(--gold)', transition: 'width 0.18s ease' }} />
                  {isSelected && <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 7, color: 'var(--gold)' }}>◆</span>}
                  <span style={{ paddingLeft: isSelected ? 12 : 0, transition: 'padding 0.18s' }}>{item.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 9.5, color: '#2a3040', letterSpacing: '0.14em', fontFamily: 'var(--font-body)' }}>
            ↑↓ NAVIGATE · ENTER SELECT · ESC RESUME
          </div>
        </div>
      </div>


      {/* Sub-modals */}
      {activeModal === 'save' && (
        <SaveLoadModal mode="save" onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'load' && (
        <SaveLoadModal
          mode="load"
          onClose={() => setActiveModal(null)}
          onLoaded={() => {
            setActiveModal(null);
            onResume();
          }}
        />
      )}
      {activeModal === 'options' && (
        <OptionsMenu onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'help' && (
        <HelpModal onClose={() => setActiveModal(null)} />
      )}
    </>
  );
}
