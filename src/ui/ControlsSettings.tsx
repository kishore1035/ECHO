// ============================================================
// CONTROLS SETTINGS — Game-Style Key Binding Configuration
// Categorized action list with interactive listening state,
// conflict confirmation modal, and reset to defaults.
// Designed with ECHO minimalist aesthetic (no emojis, no neon, no clutter).
// ============================================================

import { useState, useEffect, useRef } from 'react';
import type { ActionCategory, ActionId, ConflictCheckResult } from '../core/controls/types';
import {
  ACTION_DEFINITIONS,
  ACTION_CATEGORIES,
} from '../core/controls/actionDefinitions';
import {
  useControlsStore,
  formatKeyCodeDisplay,
} from '../core/controls/controlsStore';
import { InputManager } from '../core/controls/InputManager';
import { playMenuHover, playMenuSelect, playMenuBack } from '../core/soundFX';

interface ControlsSettingsProps {
  onBack?: () => void;
}

export default function ControlsSettings({ onBack }: ControlsSettingsProps) {
  const bindings = useControlsStore((s) => s.bindings);
  const rebindAction = useControlsStore((s) => s.rebindAction);
  const checkConflict = useControlsStore((s) => s.checkConflict);
  const resetToDefaults = useControlsStore((s) => s.resetToDefaults);

  const [activeCategory, setActiveCategory] = useState<ActionCategory>('MOVEMENT');
  const [listeningActionId, setListeningActionId] = useState<ActionId | null>(null);
  const [conflictData, setConflictData] = useState<{
    targetActionId: ActionId;
    newCode: string;
    conflict: ConflictCheckResult;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Group actions by category
  const filteredActions = ACTION_DEFINITIONS.filter(
    (def) => def.category === activeCategory
  );

  // Key capture listener when in rebind mode
  useEffect(() => {
    if (!listeningActionId) return;

    InputManager.setListeningForRebind(true);

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Escape while listening cancels rebind
      if (e.code === 'Escape') {
        playMenuBack();
        setListeningActionId(null);
        InputManager.setListeningForRebind(false);
        return;
      }

      const newCode = e.code;
      const targetAction = listeningActionId;

      // Check conflict
      const conflict = checkConflict(targetAction, newCode);
      if (conflict.hasConflict) {
        setConflictData({
          targetActionId: targetAction,
          newCode,
          conflict,
        });
        setListeningActionId(null);
        InputManager.setListeningForRebind(false);
        return;
      }

      // Apply rebind immediately
      playMenuSelect();
      rebindAction(targetAction, newCode, false);
      setListeningActionId(null);
      InputManager.setListeningForRebind(false);
    };

    const onMouseDown = (e: MouseEvent) => {
      // Allow Mouse Left/Right/Middle to be bound
      if (e.button === 0 || e.button === 1 || e.button === 2) {
        e.preventDefault();
        e.stopPropagation();

        const newCode = `Mouse${e.button}`;
        const targetAction = listeningActionId;

        const conflict = checkConflict(targetAction, newCode);
        if (conflict.hasConflict) {
          setConflictData({
            targetActionId: targetAction,
            newCode,
            conflict,
          });
          setListeningActionId(null);
          InputManager.setListeningForRebind(false);
          return;
        }

        playMenuSelect();
        rebindAction(targetAction, newCode, false);
        setListeningActionId(null);
        InputManager.setListeningForRebind(false);
      }
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    window.addEventListener('mousedown', onMouseDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      window.removeEventListener('mousedown', onMouseDown, { capture: true });
      InputManager.setListeningForRebind(false);
    };
  }, [listeningActionId, checkConflict, rebindAction]);

  const handleStartListening = (actionId: ActionId) => {
    playMenuHover();
    setConflictData(null);
    setListeningActionId(actionId);
  };

  const handleConfirmReplace = () => {
    if (!conflictData) return;
    playMenuSelect();
    rebindAction(conflictData.targetActionId, conflictData.newCode, true);
    setConflictData(null);
  };

  const handleCancelConflict = () => {
    playMenuBack();
    setConflictData(null);
  };

  const handleResetDefaults = () => {
    playMenuSelect();
    resetToDefaults();
    setListeningActionId(null);
    setConflictData(null);
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        color: '#E8E3D8',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      {/* ── Category Sub-Nav ── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '4px 0 16px',
          borderBottom: '1px solid #292923',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        {ACTION_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                playMenuHover();
                setActiveCategory(cat);
                setListeningActionId(null);
                setConflictData(null);
              }}
              style={{
                background: isActive ? 'rgba(181, 154, 74, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isActive ? '#B59A4A' : '#292923'}`,
                borderRadius: 3,
                color: isActive ? '#B59A4A' : '#77756D',
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Key Bindings List ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {filteredActions.map((def) => {
          const binding = bindings[def.id] || { primary: def.defaultPrimary };
          const isListening = listeningActionId === def.id;

          const primaryDisplay = formatKeyCodeDisplay(binding.primary);
          const altDisplay = binding.alt ? formatKeyCodeDisplay(binding.alt) : null;

          return (
            <div
              key={def.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: isListening
                  ? 'rgba(181, 154, 74, 0.08)'
                  : 'transparent',
                border: `1px solid ${
                  isListening
                    ? '#B59A4A'
                    : '#292923'
                }`,
                borderRadius: 4,
                transition: 'all 0.15s ease',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#E8E3D8',
                    letterSpacing: '0.02em',
                  }}
                >
                  {def.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: '#77756D',
                    letterSpacing: '0.04em',
                    marginTop: 2,
                    textTransform: 'uppercase',
                  }}
                >
                  Context: {def.context}
                </div>
              </div>

              {/* Binding Button */}
              <button
                onClick={() => handleStartListening(def.id)}
                style={{
                  minWidth: 120,
                  padding: '6px 14px',
                  background: isListening
                    ? 'rgba(181, 154, 74, 0.18)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    isListening
                      ? '#B59A4A'
                      : '#292923'
                  }`,
                  borderRadius: 3,
                  color: isListening ? '#B59A4A' : '#E8E3D8',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {isListening ? (
                  <span style={{ color: '#B59A4A' }}>
                    PRESS A KEY...
                  </span>
                ) : (
                  <span>
                    {primaryDisplay}
                    {altDisplay && (
                      <span style={{ color: '#77756D', marginLeft: 6, fontWeight: 400 }}>
                        / {altDisplay}
                      </span>
                    )}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Conflict Confirmation Modal ── */}
      {conflictData && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(7, 11, 18, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 24,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#0C1119',
              border: '1px solid #292923',
              borderRadius: 6,
              padding: 20,
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                color: '#A84034',
                fontWeight: 800,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              BINDING CONFLICT
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#E8E3D8',
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              <span style={{ fontFamily: 'monospace', color: '#B59A4A', fontWeight: 700 }}>
                {formatKeyCodeDisplay(conflictData.newCode)}
              </span>{' '}
              is already assigned to{' '}
              <span style={{ color: '#E8E3D8', fontWeight: 600 }}>
                "{conflictData.conflict.conflictActionName}"
              </span>
              .
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={handleCancelConflict}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid #292923',
                  borderRadius: 3,
                  color: '#77756D',
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReplace}
                style={{
                  background: 'rgba(168, 64, 52, 0.15)',
                  border: '1px solid #A84034',
                  borderRadius: 3,
                  color: '#E8E3D8',
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer / Actions ── */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid #292923',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={handleResetDefaults}
          style={{
            background: 'none',
            border: 'none',
            color: '#77756D',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            padding: '4px 8px',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#E8E3D8')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#77756D')}
        >
          RESET TO DEFAULTS
        </button>

        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid #292923',
              borderRadius: 3,
              color: '#E8E3D8',
              padding: '6px 16px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: 'pointer',
            }}
          >
            BACK
          </button>
        )}
      </div>
    </div>
  );
}
