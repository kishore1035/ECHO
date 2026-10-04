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
        background: 'rgba(6, 10, 16, 0.95)',
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
          background: '#0C1119',
          border: '1px solid #292923',
          borderRadius: 6,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          color: '#E8E3D8',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.1em', color: '#E8E3D8' }}>
              {titleText}
            </div>
            <div style={{ fontSize: 11, color: '#77756D', marginTop: 3 }}>
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
              color: '#77756D',
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
              background: 'rgba(78, 138, 94, 0.15)',
              border: '1px solid #4E8A5E',
              borderRadius: 3,
              padding: '6px 12px',
              fontSize: 11,
              color: '#E8E3D8',
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
                    ? 'rgba(181, 154, 74, 0.08)'
                    : slot
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'transparent',
                  border: `1px solid ${
                    isSelected
                      ? '#B59A4A'
                      : '#292923'
                  }`,
                  borderRadius: 4,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: isClickable ? 'pointer' : 'default',
                  opacity: mode === 'load' && !slot ? 0.45 : 1,
                  transition: 'all 0.16s ease',
                  boxShadow: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Slot Number Badge */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 3,
                      background: isSelected ? '#B59A4A' : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? '#070B12' : '#77756D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    0{slotId}
                  </div>

                  {/* Slot Details */}
                  {slot ? (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#E8E3D8' }}>
                        {slot.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: '#77756D',
                          marginTop: 3,
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ color: '#B59A4A' }}>{slot.summary.branchName}</span>
                        <span>•</span>
                        <span>{new Date(slot.savedAt).toLocaleDateString()} {new Date(slot.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{slot.summary.entityCount} entities</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#77756D' }}>
                        EMPTY CHRONAL SLOT
                      </div>
                      <div style={{ fontSize: 10, color: '#54524B', marginTop: 2 }}>
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
                        fontWeight: 700,
                        color: isSelected ? '#B59A4A' : '#77756D',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {slot ? 'OVERWRITE' : 'SAVE HERE'}
                    </span>
                  ) : slot ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: isSelected ? '#B59A4A' : '#77756D',
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
                        background: 'rgba(168, 64, 52, 0.12)',
                        border: '1px solid rgba(168, 64, 52, 0.3)',
                        color: '#E8E3D8',
                        borderRadius: 3,
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
            color: '#77756D',
            borderTop: '1px solid #292923',
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
