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
        background: 'rgba(7, 11, 18, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        color: '#E8E3D8',
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
          background: '#0C1119',
          border: '1px solid #292923',
          borderRadius: 6,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: '22px 28px 18px',
            borderBottom: '1px solid #292923',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#0C1119',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 9.5,
                letterSpacing: '0.42em',
                color: '#8F7836',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              SIMULATION GUIDE & CODEX
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.22em',
                color: '#E8E3D8',
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
              border: '1px solid #292923',
              color: '#77756D',
              fontFamily: 'var(--font-ui)',
              fontSize: 10.5,
              letterSpacing: '0.2em',
              padding: '6px 14px',
              cursor: 'pointer',
              borderRadius: 3,
              textTransform: 'uppercase',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#B59A4A';
              e.currentTarget.style.color = '#B59A4A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#292923';
              e.currentTarget.style.color = '#77756D';
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
              borderRight: '1px solid #292923',
              background: '#070B12',
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
                color: '#54524B',
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
                    color: isSelected ? '#B59A4A' : '#77756D',
                    background: isSelected ? 'rgba(181, 154, 74, 0.08)' : 'transparent',
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
                      background: '#B59A4A',
                      transition: 'width 0.16s ease',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isSelected && (
                      <span style={{ fontSize: 6.5, color: '#B59A4A' }}>◆</span>
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
              background: '#0C1119',
            }}
          >
            {/* Section Header */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 10,
                  letterSpacing: '0.35em',
                  color: '#8F7836',
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
                  color: '#E8E3D8',
                }}
              >
                {activeSection.title}
              </div>
              <div
                style={{
                  width: 90,
                  height: 1,
                  background: 'linear-gradient(90deg, #B59A4A, transparent)',
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
                    color: '#E8E3D8',
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
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid #292923',
                  borderRadius: 3,
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
                      color: '#E8E3D8',
                    }}
                  >
                    <span style={{ color: '#B59A4A', fontSize: 10 }}>—</span>
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
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid #292923',
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
                          color: '#B59A4A',
                          fontWeight: 600,
                        }}
                      >
                        {cat.category}
                      </div>
                      <div style={{ fontSize: 11, color: '#77756D', fontStyle: 'italic' }}>
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
                            background: '#070B12',
                            border: '1px solid #292923',
                            padding: '7px 12px',
                            borderRadius: 3,
                            fontFamily: '"SFMono-Regular", Consolas, monospace',
                            fontSize: 12,
                            color: '#E8E3D8',
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
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid #292923',
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
                          ? '1px solid #292923'
                          : 'none',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(181, 154, 74, 0.08)',
                        border: '1px solid #B59A4A',
                        color: '#B59A4A',
                        fontFamily: 'var(--font-ui)',
                        fontSize: 10.5,
                        letterSpacing: '0.14em',
                        padding: '4px 10px',
                        borderRadius: 3,
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
                        color: '#E8E3D8',
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
                  background: 'rgba(181, 154, 74, 0.06)',
                  border: '1px solid #B59A4A',
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
                    color: '#B59A4A',
                    fontWeight: 700,
                  }}
                >
                  {activeSection.callout.headline}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: '#E8E3D8',
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
            borderTop: '1px solid #292923',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#070B12',
            fontSize: 9.5,
            fontFamily: 'var(--font-ui)',
            letterSpacing: '0.18em',
            color: '#77756D',
          }}
        >
          <div>↑↓ SELECT SECTION · ENTER CONFIRM · ESC BACK</div>
          <div style={{ color: '#8F7836' }}>EVERY WORD CHANGES THE WORLD</div>
        </div>
      </div>
    </div>
  );
}
