// ============================================================
// SAVE / LOAD MODAL — 3-Slot Game Persistence Interface
// Full keyboard navigation (Arrows, Enter, Escape) + Mouse
// ============================================================

import { useEffect, useState } from 'react';
import { getAllSaveSlots, saveToSlot, loadFromSlot, deleteSaveSlot, type SaveSlotData } from '../core/saveSystem';
import { playMenuHover, playMenuSelect, playMenuBack } from '../core/soundFX';
import { setSaveLoadActive } from '../core/timeSystem';

interface SaveLoadModalProps {
  mode: 'save' | 'load';
  onClose: () => void;
  onLoaded?: () => void;
}

export default function SaveLoadModal({ mode, onClose, onLoaded }: SaveLoadModalProps) {
  const [slots, setSlots] = useState<(SaveSlotData | null)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const refreshSlots = () => {
    setSlots(getAllSaveSlots());
  };

  useEffect(() => {
    refreshSlots();
    setSaveLoadActive(true);
    return () => {
      setSaveLoadActive(false);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedIndex((i) => {
          const next = (i - 1 + 3) % 3;
          playMenuHover();
          return next;
        });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedIndex((i) => {
          const next = (i + 1) % 3;
          playMenuHover();
          return next;
        });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAction(selectedIndex);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        playMenuBack();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIndex, slots, mode]);

  const handleAction = (slotIdx: number) => {
    const slotId = (slotIdx + 1) as 1 | 2 | 3;
    const slot = slots[slotIdx];

    if (mode === 'save') {
      playMenuSelect();
      const success = saveToSlot(slotId);
      if (success) {
        refreshSlots();
        setFeedbackMsg(`Saved to Slot ${slotId}`);
        setTimeout(() => setFeedbackMsg(''), 2000);
      }
    } else {
      // Load mode
      if (!slot) return; // Cannot load empty slot
      playMenuSelect();
      const success = loadFromSlot(slotId);
      if (success) {
        onLoaded?.();
        onClose();
      }
    }
  };

  const handleDelete = (e: React.MouseEvent, slotId: 1 | 2 | 3) => {
    e.stopPropagation();
    playMenuBack();
    deleteSaveSlot(slotId);
    refreshSlots();
  };

  const titleText = mode === 'save' ? 'SAVE CHRONAL STATE' : 'RESTORE CHRONAL STATE';
  const subtitleText = mode === 'save' ? 'Select a timeline slot to record your reality' : 'Select a saved timeline to inhabit';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(2, 6, 14, 0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: '"Inter", sans-serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 580,
          background: 'rgba(8, 14, 28, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.1)',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          color: '#f8fafc',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.1em', color: '#38bdf8' }}>
              {titleText}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
              {subtitleText}
            </div>
          </div>
          <button
            onClick={() => {
              playMenuBack();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: 18,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Feedback message */}
        {feedbackMsg && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.18)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 11,
              color: '#34d399',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            ✓ {feedbackMsg}
          </div>
        )}

        {/* 3 Save Slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map((idx) => {
            const slotId = (idx + 1) as 1 | 2 | 3;
            const slot = slots[idx];
            const isSelected = selectedIndex === idx;
            const canLoad = mode === 'load' && slot !== null;
            const isClickable = mode === 'save' || canLoad;

            return (
              <div
                key={slotId}
                onMouseEnter={() => {
                  setSelectedIndex(idx);
                  playMenuHover();
                }}
                onClick={() => isClickable && handleAction(idx)}
                style={{
                  background: isSelected
                    ? 'rgba(56, 189, 248, 0.14)'
                    : slot
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(255, 255, 255, 0.015)',
                  border: `1px solid ${
                    isSelected
                      ? '#38bdf8'
                      : slot
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(255, 255, 255, 0.05)'
                  }`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: isClickable ? 'pointer' : 'default',
                  opacity: mode === 'load' && !slot ? 0.45 : 1,
                  transition: 'all 0.16s ease',
                  boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.2)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Slot Number Badge */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)',
                      color: isSelected ? '#040d1a' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 900,
                    }}
                  >
                    0{slotId}
                  </div>

                  {/* Slot Details */}
                  {slot ? (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>
                        {slot.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: '#94a3b8',
                          marginTop: 3,
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ color: '#38bdf8' }}>{slot.summary.branchName}</span>
                        <span>•</span>
                        <span>{new Date(slot.savedAt).toLocaleDateString()} {new Date(slot.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{slot.summary.entityCount} entities</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
                        EMPTY CHRONAL SLOT
                      </div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                        {mode === 'save' ? 'Click to record current reality' : 'No saved reality found'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Action Tag / Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {mode === 'save' ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: isSelected ? '#38bdf8' : '#64748b',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {slot ? 'OVERWRITE' : 'SAVE HERE'}
                    </span>
                  ) : slot ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: isSelected ? '#38bdf8' : '#64748b',
                        letterSpacing: '0.05em',
                      }}
                    >
                      RESTORE
                    </span>
                  ) : null}

                  {slot && (
                    <button
                      onClick={(e) => handleDelete(e, slotId)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 10,
                        cursor: 'pointer',
                      }}
                      title="Clear this save slot"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer controls hint */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 10,
            color: '#64748b',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: 10,
          }}
        >
          <span>[↑/↓] Navigate • [ENTER] Select • [ESC] Back</span>
          <span>ECHO Real-time Simulation Engine</span>
        </div>
      </div>
    </div>
  );
}
