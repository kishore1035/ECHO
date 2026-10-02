// ============================================================
// ECHO — MAIN APPLICATION CONTAINER
// Handles game presentation states: Title Screen, Story Intro,
// Active Gameplay, and Pause Menu.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import Scene from './renderer/Scene';
import HUD from './ui/HUD';
import MissionHUD from './ui/MissionHUD';
import DialogueBox from './ui/DialogueBox';
import Compass from './ui/Compass';
import VoiceIndicator from './ui/VoiceIndicator';
import RealityTransition from './ui/RealityTransition';
import TitleScreen from './ui/TitleScreen';
import StoryIntro from './ui/StoryIntro';
import PauseMenu from './ui/PauseMenu';
import SplashScreen from './ui/SplashScreen';
import { VoicePipeline } from './voice/VoicePipeline';
import { TimelineSystem } from './systems/TimelineSystem';
import { useWorldStore } from './core/WorldState';
import { CampaignSystem, useCampaignStore } from './campaign/CampaignSystem';
import { buildRowanAndMiraDialogue } from './campaign/dialogues';
import TimelinePanel from './ui/TimelinePanel';
import { useEchoTreeStore } from './core/echoTreeState';
import './index.css';

import { isSaveLoadActive } from './core/timeSystem';
import { useTimelineStore } from './systems/TimelineSystem';

export type GameState = 'splash' | 'title' | 'intro' | 'playing' | 'paused';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('splash');
  const isHoldingRef = useRef(false);

  const isDialogueOpen = useCampaignStore((s) => Boolean(s.activeDialogue));
  const isTimelineTransitioning = useTimelineStore((s) => s.isTransitioning);
  const isEchoTreeInteracting = useEchoTreeStore((s) => s.isInteracting);

  // Authoritative WorldTime auto-pause synchronization
  // Automatically pauses while:
  // - dialogue is active
  // - a cinematic/story sequence is active (title screen, story intro)
  // - the pause menu is open
  // - save/load is occurring
  // - a timeline rewind/branch transition is occurring
  // - communing with the Echo Tree
  // Resumes clock when normal gameplay resumes.
  useEffect(() => {
    const isPaused =
      gameState !== 'playing' ||
      isDialogueOpen ||
      isTimelineTransitioning ||
      isEchoTreeInteracting ||
      isSaveLoadActive();
    useWorldStore.getState().setTime({ isPaused });
  }, [gameState, isDialogueOpen, isTimelineTransitioning, isEchoTreeInteracting]);

  // Periodic campaign evaluation against real simulation state
  useEffect(() => {
    if (gameState !== 'playing' || isDialogueOpen) return;
    const timer = setInterval(() => {
      CampaignSystem.evaluate();
    }, 350);
    return () => clearInterval(timer);
  }, [gameState, isDialogueOpen]);

  // Global keybindings
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      const isDialogueOpen = Boolean(useCampaignStore.getState().activeDialogue);

      // Escape: Close Echo Tree communion if active
      if (e.code === 'Escape' && useEchoTreeStore.getState().isInteracting) {
        e.preventDefault();
        useEchoTreeStore.getState().closeInteraction();
        return;
      }

      // Escape during gameplay pauses the game
      if (e.code === 'Escape' && gameState === 'playing' && !isDialogueOpen) {
        e.preventDefault();
        setGameState('paused');
        useWorldStore.getState().setTime({ isPaused: true });
        return;
      }

      // Spacebar Push-to-Talk (only active during gameplay when dialogue is NOT active)
      if (e.code === 'Space' && gameState === 'playing' && !isDialogueOpen) {
        e.preventDefault();
        if (!isHoldingRef.current) {
          isHoldingRef.current = true;
          VoicePipeline.startListening();
        }
      }

      // 'E' Key: Interact with Echo Tree OR talk with nearby characters
      if (
        (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') &&
        gameState === 'playing' &&
        !isDialogueOpen
      ) {
        // If near Echo Tree, commune with the physical anchor
        if (useEchoTreeStore.getState().isNear) {
          useEchoTreeStore.getState().toggleInteraction();
          return;
        }

        // If currently communing with Echo Tree, close it on E
        if (useEchoTreeStore.getState().isInteracting) {
          useEchoTreeStore.getState().closeInteraction();
          return;
        }

        const world = useWorldStore.getState();
        const pPos = world.player.position;
        const rowan = Object.values(world.entities).find((ent) => ent.name.includes('Rowan'));
        const mira = Object.values(world.entities).find((ent) => ent.name.includes('Mira'));

        const distRowan = rowan
          ? Math.hypot(pPos.x - rowan.position.x, pPos.z - rowan.position.z)
          : 999;
        const distMira = mira
          ? Math.hypot(pPos.x - mira.position.x, pPos.z - mira.position.z)
          : 999;

        if (distRowan <= 7.0 || distMira <= 7.0) {
          CampaignSystem.triggerDialogue(buildRowanAndMiraDialogue());
        }
      }

      // R Key Rewind: ONLY permitted while communing with the Echo Tree
      if (
        e.code === 'KeyR' &&
        gameState === 'playing' &&
        !isDialogueOpen &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        useEchoTreeStore.getState().isInteracting
      ) {
        TimelineSystem.rewind('last');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const isDialogueOpen = Boolean(useCampaignStore.getState().activeDialogue);
      if (e.code === 'Space' && gameState === 'playing' && !isDialogueOpen) {
        e.preventDefault();
        if (isHoldingRef.current) {
          isHoldingRef.current = false;
          VoicePipeline.stopAndProcess();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gameState]);

  const handleResumeGame = () => {
    setGameState('playing');
    useWorldStore.getState().setTime({ isPaused: false });
  };

  const handleReturnToTitle = () => {
    setGameState('title');
    useWorldStore.getState().setTime({ isPaused: true });
  };

  return (
    <div className="game-root">
      {/* Live 3D Scene running in background */}
      <Scene
        isCinematic={gameState === 'splash' || gameState === 'title' || gameState === 'intro'}
        isPaused={gameState === 'paused' || gameState === 'splash'}
      />

      {/* ── Alt F4 Studio Intro & ECHO Logo Reveal Splash Sequence ── */}
      {gameState === 'splash' && (
        <SplashScreen onComplete={() => setGameState('title')} />
      )}

      {/* ── Title Screen ── */}
      {gameState === 'title' && (
        <TitleScreen
          onNewGame={() => setGameState('intro')}
          onContinue={() => setGameState('playing')}
        />
      )}

      {/* ── Cinematic Opening Story Intro ── */}
      {gameState === 'intro' && (
        <StoryIntro onComplete={() => setGameState('playing')} />
      )}

      {/* ── Active Gameplay Shell ── */}
      {gameState === 'playing' && (
        <>
          {!isDialogueOpen && !isEchoTreeInteracting && (
            <>
              <Compass isDialogueOpen={isDialogueOpen} />
              <HUD />
              <MissionHUD />
              <VoiceIndicator />
            </>
          )}

          {/* ── Echo Tree Timeline Communion Interface ── */}
          {isEchoTreeInteracting && <TimelinePanel />}

          <DialogueBox />
        </>
      )}

      {/* ── Pause Menu ── */}
      {gameState === 'paused' && (
        <PauseMenu
          onResume={handleResumeGame}
          onReturnToTitle={handleReturnToTitle}
        />
      )}

      {/* ── Reality Transition FX (always mounts for timeline shifts) ── */}
      <RealityTransition />
    </div>
  );
}
