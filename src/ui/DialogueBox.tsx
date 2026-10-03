// ============================================================
// DIALOGUE BOX — Cinematic Story Dialogue Presentation for ECHO
// Dark unobtrusive panel, warm ivory text, restrained antique gold accents,
// typewriter effect, and state-aware choice mechanics.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useCampaignStore, CampaignSystem } from '../campaign/CampaignSystem';
import type { DialogueChoice, DialogueLine } from '../campaign/types';
import { playMenuHover, playMenuSelect } from '../core/soundFX';
import { matchesAction } from '../core/controls/InputManager';

// Per-character typing speed per speaker (ms per character)
function getTypingSpeed(speaker: string): number {
  const s = speaker.toLowerCase();
  if (s.includes('mira') || s.includes('architect') || s.includes('ancient') || s.includes('root')) return 32;
  if (s.includes('vorn')) return 14;
  if (s.includes('rowan')) return 18;
  if (s.includes('aldric')) return 22;
  return 22; // default
}

export default function DialogueBox() {
  const activeDialogue = useCampaignStore((s) => s.activeDialogue);
  const dialogueLineIndex = useCampaignStore((s) => s.dialogueLineIndex);

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0);
  const [showSkipHint, setShowSkipHint] = useState(false);
  const [speakerKey, setSpeakerKey] = useState(0);
  const prevSpeakerRef = useRef('');

  const currentLine: DialogueLine | undefined = activeDialogue?.lines[dialogueLineIndex];
  const typingTimerRef = useRef<any>(null);
  const skipHintTimerRef = useRef<any>(null);

  // Typewriter effect with per-speaker speed and natural punctuation pauses
  useEffect(() => {
    if (!currentLine) {
      setDisplayedText('');
      setIsTyping(false);
      setShowSkipHint(false);
      return;
    }

    // Track speaker changes for transition animation
    if (currentLine.speaker !== prevSpeakerRef.current) {
      setSpeakerKey((k) => k + 1);
      prevSpeakerRef.current = currentLine.speaker;
    }

    const fullText = currentLine.text;
    const baseDelay = getTypingSpeed(currentLine.speaker);
    setDisplayedText('');
    setIsTyping(true);
    setShowSkipHint(false);
    setSelectedChoiceIndex(0);

    let charIdx = 0;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (skipHintTimerRef.current) clearTimeout(skipHintTimerRef.current);

    // Show skip hint after 1.5s of typing (not immediately)
    skipHintTimerRef.current = setTimeout(() => setShowSkipHint(true), 1500);

    const typeNextChar = () => {
      charIdx++;
      setDisplayedText(fullText.slice(0, charIdx));

      if (charIdx >= fullText.length) {
        setIsTyping(false);
        setShowSkipHint(false);
        return;
      }

      // Natural pause cadence based on punctuation and emotion
      let delay = baseDelay;
      const currentChar = fullText[charIdx - 1];
      const nextChar = fullText[charIdx];

      if (currentChar === '.' && nextChar === '.') {
        delay = 180; // Ellipsis pause
      } else if (currentChar === '.' || currentChar === '?' || currentChar === '!') {
        delay = 240; // Sentence pause
      } else if (currentChar === ',' || currentChar === ';' || currentChar === ':') {
        delay = 120; // Clause breath
      } else if (currentChar === '—') {
        delay = 200; // Em-dash pause
      }

      typingTimerRef.current = setTimeout(typeNextChar, delay);
    };

    const initialPause = currentLine.pauseDurationMs ?? 40;
    typingTimerRef.current = setTimeout(typeNextChar, initialPause);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (skipHintTimerRef.current) clearTimeout(skipHintTimerRef.current);
    };
  }, [currentLine, dialogueLineIndex]);

  const handleAdvance = () => {
    if (!currentLine) return;

    // If currently typing, skip directly to full line text
    if (isTyping) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (skipHintTimerRef.current) clearTimeout(skipHintTimerRef.current);
      setDisplayedText(currentLine.text);
      setIsTyping(false);
      setShowSkipHint(false);
      return;
    }

    // If choices are present, user must select a choice to advance
    if (currentLine.choices && currentLine.choices.length > 0) {
      handleSelectChoice(currentLine.choices[selectedChoiceIndex]);
      return;
    }

    // Normal advance to next story line
    CampaignSystem.advanceDialogue();
  };

  const handleSelectChoice = (choice: DialogueChoice) => {
    playMenuSelect();
    if (choice.onSelectFlag) {
      useCampaignStore.getState().setStoryFlag(choice.onSelectFlag, true);
    }
    if (choice.bondDelta) {
      useCampaignStore.getState().adjustBond(choice.bondDelta.character, choice.bondDelta.amount);
    }
    if (choice.bondDelta2) {
      useCampaignStore.getState().adjustBond(choice.bondDelta2.character, choice.bondDelta2.amount);
    }

    if (choice.followUpLines && choice.followUpLines.length > 0 && activeDialogue) {
      const updatedLines = [...activeDialogue.lines];
      updatedLines.splice(dialogueLineIndex + 1, 0, ...choice.followUpLines);
      useCampaignStore.setState({
        activeDialogue: { ...activeDialogue, lines: updatedLines },
      });
    }

    CampaignSystem.advanceDialogue();
  };

  // Keyboard navigation for dialogue & choices
  useEffect(() => {
    if (!activeDialogue) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const hasChoices = currentLine?.choices && currentLine.choices.length > 0;

      if (hasChoices && !isTyping) {
        const choiceCount = currentLine.choices!.length;
        if (matchesAction('dialoguePrevChoice', e)) {
          e.preventDefault();
          setSelectedChoiceIndex((i) => {
            const next = (i - 1 + choiceCount) % choiceCount;
            playMenuHover();
            return next;
          });
          return;
        } else if (matchesAction('dialogueNextChoice', e)) {
          e.preventDefault();
          setSelectedChoiceIndex((i) => {
            const next = (i + 1) % choiceCount;
            playMenuHover();
            return next;
          });
          return;
        } else if (matchesAction('dialogueConfirm', e)) {
          e.preventDefault();
          handleSelectChoice(currentLine.choices![selectedChoiceIndex]);
          return;
        } else if (e.key >= '1' && e.key <= String(choiceCount)) {
          e.preventDefault();
          const idx = parseInt(e.key, 10) - 1;
          handleSelectChoice(currentLine.choices![idx]);
          return;
        }
      }

      if (matchesAction('dialogueAdvance', e)) {
        e.preventDefault();
        handleAdvance();
      } else if (matchesAction('dialogueBack', e)) {
        e.preventDefault();
        if (!isTyping) {
          CampaignSystem.closeDialogue();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeDialogue, currentLine, isTyping, selectedChoiceIndex]);

  if (!activeDialogue || !currentLine) return null;

  const hasChoices = Boolean(currentLine.choices && currentLine.choices.length > 0 && !isTyping);

  return (
    <div
      onClick={handleAdvance}
      style={{
        position: 'fixed',
        bottom: 34,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9000,
        width: 'min(640px, calc(100vw - 44px))',
        background: '#0C1119',
        border: '1px solid #292923',
        borderRadius: 6,
        boxShadow: '0 16px 42px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(20px)',
        padding: '24px 28px 18px 28px',
        color: '#E8E3D8',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        cursor: 'pointer',
        userSelect: 'none',
        animation: 'dialogue-box-in 0.26s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <style>{`
        @keyframes dialogue-box-in {
          0%   { opacity: 0; transform: translate(-50%, 14px) scale(0.98); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @keyframes speaker-pill-in {
          0%   { opacity: 0; transform: translateX(-50%) translateY(4px) scale(0.94); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes textCursorBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes pulseChevron {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(2px); }
        }
        @keyframes skip-hint-fade-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* ── Speaker Name Header ── */}
      <div
        key={speakerKey}
        style={{
          position: 'absolute',
          top: -13,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#070B12',
          border: '1px solid #B59A4A',
          borderRadius: 3,
          padding: '3px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 2,
          animation: 'speaker-pill-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#B59A4A',
            lineHeight: 1.2,
          }}
        >
          {currentLine.speaker}
        </span>
        {currentLine.speakerRole && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#77756D',
            }}
          >
            • {currentLine.speakerRole}
          </span>
        )}
      </div>

      {/* ── Main Spoken Text with Typewriter Animation ── */}
      <div
        style={{
          minHeight: 46,
          fontSize: 15,
          lineHeight: 1.65,
          color: '#E8E3D8',
          fontWeight: 400,
          letterSpacing: '0.01em',
          paddingTop: 4,
        }}
      >
        <span>{displayedText}</span>
        {isTyping && (
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: 15,
              background: '#B59A4A',
              marginLeft: 4,
              verticalAlign: 'middle',
              animation: 'textCursorBlink 0.6s infinite',
            }}
          />
        )}
      </div>

      {/* ── Dialogue Choices if branching ── */}
      {hasChoices && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginTop: 4,
            paddingTop: 10,
            borderTop: '1px solid #292923',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {currentLine.choices!.map((choice, cIdx) => {
            const isSelected = selectedChoiceIndex === cIdx;
            return (
              <button
                key={choice.id}
                onMouseEnter={() => {
                  setSelectedChoiceIndex(cIdx);
                  playMenuHover();
                }}
                onClick={() => handleSelectChoice(choice)}
                style={{
                  background: isSelected ? 'rgba(181, 154, 74, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isSelected ? '#B59A4A' : '#292923'}`,
                  borderRadius: 3,
                  padding: '9px 14px',
                  color: isSelected ? '#E8E3D8' : '#77756D',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.12s ease',
                  transform: isSelected ? 'translateX(4px)' : 'none',
                }}
              >
                <span>
                  <strong style={{ color: '#B59A4A', marginRight: 8 }}>[{cIdx + 1}]</strong>
                  {choice.text}
                </span>
                {isSelected && <span style={{ color: '#B59A4A', fontSize: 11 }}>↵</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Bottom Advance Indicator ── */}
      {!hasChoices && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 2,
            borderTop: '1px solid #292923',
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#77756D',
          }}
        >
          <span style={{ opacity: 0.8 }}>
            {dialogueLineIndex + 1} / {activeDialogue.lines.length}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Skip hint appears only after 1.5s of typing */}
            {isTyping && showSkipHint && (
              <span style={{ animation: 'skip-hint-fade-in 0.4s ease both' }}>CLICK TO SKIP</span>
            )}
            {!isTyping && (
              <span>SPACE  continue</span>
            )}
            {!isTyping && (
              <span
                style={{
                  display: 'inline-block',
                  animation: 'pulseChevron 1.2s infinite ease-in-out',
                  color: '#B59A4A',
                  fontSize: 10,
                }}
              >
                ▼
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
