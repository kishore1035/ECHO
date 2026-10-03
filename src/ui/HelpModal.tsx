// ============================================================
// HELP MODAL — In-Game & Title Screen Codex Interface
// Accessible from Title Screen (pre-game) and Pause Menu (in-game).
// Navigable via Mouse + Keyboard (Arrow Keys, Enter, Escape).
// ============================================================

import { useEffect, useState, useRef } from 'react';
import { HELP_SECTIONS, type HelpSection, getDynamicControlsList } from './helpContent';
import { playMenuHover, playMenuSelect, playMenuBack } from '../core/soundFX';

interface HelpModalProps {
  onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
  const [selectedSectionIdx, setSelectedSectionIdx] = useState(0);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const activeSection: HelpSection = HELP_SECTIONS[selectedSectionIdx] || HELP_SECTIONS[0];

  // Reset content scroll whenever section changes
  useEffect(() => {
    if (contentAreaRef.current) {
      contentAreaRef.current.scrollTop = 0;
    }
  }, [selectedSectionIdx]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedSectionIdx((idx) => {
          const next = (idx - 1 + HELP_SECTIONS.length) % HELP_SECTIONS.length;
          playMenuHover();
          return next;
        });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedSectionIdx((idx) => {
          const next = (idx + 1) % HELP_SECTIONS.length;
          playMenuHover();
          return next;
        });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playMenuSelect();
      } else if (e.key === 'Escape') {
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
        background: 'rgba(2, 5, 12, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        color: 'var(--text-hi)',
        fontFamily: 'var(--font-body)',
        animation: 'vw-fadein 0.22s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 920,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(6, 12, 22, 0.94)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 1px rgba(232, 200, 74, 0.3)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: '22px 28px 18px',
            borderBottom: '1px solid rgba(232, 200, 74, 0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(16, 26, 44, 0.5) 0%, rgba(6, 12, 22, 0.2) 100%)',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 9.5,
                letterSpacing: '0.42em',
                color: 'var(--gold-dim)',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              SIMULATION GUIDE & CODEX
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '0.22em',
                color: 'var(--text-hi)',
              }}
            >
              HOW TO PLAY ECHO
            </div>
          </div>

          <button
            onClick={() => {
              playMenuBack();
              onClose();
            }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(232, 200, 74, 0.22)',
              color: 'var(--text-mid)',
              fontFamily: 'var(--font-ui)',
              fontSize: 10.5,
              letterSpacing: '0.2em',
              padding: '6px 14px',
              cursor: 'pointer',
              borderRadius: 2,
              textTransform: 'uppercase',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold)';
              e.currentTarget.style.color = 'var(--gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(232, 200, 74, 0.22)';
              e.currentTarget.style.color = 'var(--text-mid)';
            }}
          >
            RETURN [ESC]
          </button>
        </div>

        {/* ── Main Body (Two Columns: Sections List + Content Area) ── */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            minHeight: 440,
            maxHeight: 520,
            overflow: 'hidden',
          }}
        >
          {/* Left Column: Sections Navigation */}
          <div
            style={{
              width: 250,
              flexShrink: 0,
              borderRight: '1px solid rgba(232, 200, 74, 0.12)',
              background: 'rgba(4, 8, 16, 0.65)',
              display: 'flex',
              flexDirection: 'column',
              padding: '14px 0',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: 8.5,
                fontFamily: 'var(--font-ui)',
                letterSpacing: '0.3em',
                color: '#5a6478',
                padding: '4px 22px 10px',
                textTransform: 'uppercase',
              }}
            >
              SECTIONS
            </div>
            {HELP_SECTIONS.map((section, idx) => {
              const isSelected = idx === selectedSectionIdx;
              return (
                <div
                  key={section.id}
                  onClick={() => {
                    setSelectedSectionIdx(idx);
                    playMenuSelect();
                  }}
                  onMouseEnter={() => {
                    if (!isSelected) {
                      playMenuHover();
                    }
                  }}
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 11,
                    letterSpacing: isSelected ? '0.2em' : '0.14em',
                    textTransform: 'uppercase',
                    padding: '10px 20px 10px 24px',
                    cursor: 'pointer',
                    position: 'relative',
                    color: isSelected ? 'var(--gold)' : '#748096',
                    background: isSelected ? 'rgba(232, 200, 74, 0.06)' : 'transparent',
                    transition: 'all 0.16s ease',
                  }}
                >
                  {/* Left Active Indicator Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: isSelected ? 3 : 0,
                      background: 'var(--gold)',
                      transition: 'width 0.16s ease',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isSelected && (
                      <span style={{ fontSize: 6.5, color: 'var(--gold)' }}>◆</span>
                    )}
                    <span>{section.title}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Section Content */}
          <div
            ref={contentAreaRef}
            style={{
              flex: 1,
              padding: '28px 34px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* Section Header */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 10,
                  letterSpacing: '0.35em',
                  color: 'var(--gold-dim)',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                {activeSection.subtitle}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  color: 'var(--text-hi)',
                }}
              >
                {activeSection.title}
              </div>
              <div
                style={{
                  width: 90,
                  height: 1,
                  background: 'linear-gradient(90deg, var(--gold), transparent)',
                  marginTop: 10,
                }}
              />
            </div>

            {/* Paragraphs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeSection.content.map((p, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.7,
                    color: '#c8d0de',
                    margin: 0,
                  }}
                >
                  {p}
                </p>
              ))}
            </div>

            {/* Bullet Points (if available) */}
            {activeSection.bulletPoints && (
              <div
                style={{
                  background: 'rgba(8, 14, 26, 0.65)',
                  border: '1px solid rgba(232, 200, 74, 0.12)',
                  borderRadius: 2,
                  padding: '14px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {activeSection.bulletPoints.map((bp, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 12,
                      fontSize: 13,
                      color: '#e2e8f0',
                    }}
                  >
                    <span style={{ color: 'var(--gold)', fontSize: 10 }}>—</span>
                    <span>{bp}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Voice Command Categories (if available) */}
            {activeSection.commandCategories && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activeSection.commandCategories.map((cat, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(8, 14, 26, 0.75)',
                      border: '1px solid rgba(232, 200, 74, 0.14)',
                      borderRadius: 3,
                      padding: '14px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: 11,
                          letterSpacing: '0.2em',
                          color: 'var(--gold)',
                          fontWeight: 600,
                        }}
                      >
                        {cat.category}
                      </div>
                      <div style={{ fontSize: 11, color: '#748096', fontStyle: 'italic' }}>
                        {cat.description}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 8,
                        marginTop: 4,
                      }}
                    >
                      {cat.examples.map((ex, ei) => (
                        <div
                          key={ei}
                          style={{
                            background: 'rgba(4, 8, 16, 0.8)',
                            border: '1px solid rgba(56, 189, 248, 0.18)',
                            padding: '7px 12px',
                            borderRadius: 2,
                            fontFamily: '"SFMono-Regular", Consolas, monospace',
                            fontSize: 12,
                            color: '#7dd3fc',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {ex}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Controls Table (if available) */}
            {Boolean(activeSection.controls) && (
              <div
                style={{
                  background: 'rgba(8, 14, 26, 0.75)',
                  border: '1px solid rgba(232, 200, 74, 0.14)',
                  borderRadius: 3,
                  padding: '10px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {(activeSection.id === 'movement'
                  ? getDynamicControlsList()
                  : activeSection.controls!
                ).map((ctrl, i, arr) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 4px',
                      borderBottom:
                        i < arr.length - 1
                          ? '1px solid rgba(255, 255, 255, 0.05)'
                          : 'none',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(232, 200, 74, 0.08)',
                        border: '1px solid rgba(232, 200, 74, 0.28)',
                        color: 'var(--gold)',
                        fontFamily: 'var(--font-ui)',
                        fontSize: 10.5,
                        letterSpacing: '0.14em',
                        padding: '4px 10px',
                        borderRadius: 2,
                        minWidth: 120,
                        textAlign: 'center',
                      }}
                    >
                      {ctrl.input}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        marginLeft: 20,
                        fontSize: 12.5,
                        color: '#c2cad8',
                      }}
                    >
                      {ctrl.action}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Callout Box (e.g. for IMPORTANT section) */}
            {activeSection.callout && (
              <div
                style={{
                  background: 'rgba(30, 22, 10, 0.55)',
                  border: '1px solid rgba(232, 200, 74, 0.4)',
                  borderRadius: 3,
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 11,
                    letterSpacing: '0.24em',
                    color: 'var(--gold)',
                    fontWeight: 700,
                  }}
                >
                  {activeSection.callout.headline}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: '#f0ece0',
                  }}
                >
                  {activeSection.callout.text}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div
          style={{
            padding: '12px 28px',
            borderTop: '1px solid rgba(232, 200, 74, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(4, 8, 16, 0.75)',
            fontSize: 9.5,
            fontFamily: 'var(--font-ui)',
            letterSpacing: '0.18em',
            color: '#606b80',
          }}
        >
          <div>↑↓ SELECT SECTION · ENTER CONFIRM · ESC BACK</div>
          <div style={{ color: 'var(--gold-dim)' }}>EVERY WORD CHANGES THE WORLD</div>
        </div>
      </div>
    </div>
  );
}
