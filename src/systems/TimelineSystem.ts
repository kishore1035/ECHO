// ============================================================
// TIMELINE SYSTEM (M4) — Checkpoints, Rewind & Alternate Realities
//
// Manages the tree of realities (branches and checkpoints).
// Ensures deterministic world state restoration without destroying
// previous timelines when choices diverge.
// ============================================================

import { create } from 'zustand';
import { useWorldStore } from '../core/WorldState';
import { NarrativeEngine } from './NarrativeEngine';
import type {
  TimelineCheckpoint,
  TimelineBranch,
  WorldSnapshot,
  CheckpointSignificance,
} from '../core/types';

// ─── Timeline Color Palette for Distinct Branches ───────────

const BRANCH_COLORS = [
  '#38bdf8', // Sky Blue (Prime)
  '#ec4899', // Pink / Magenta (Divergence A)
  '#f59e0b', // Amber / Gold (Divergence B)
  '#a855f7', // Purple / Void (Divergence C)
  '#10b981', // Emerald / Nature (Divergence D)
  '#ef4444', // Crimson / War (Divergence E)
];

function pickBranchColor(index: number): string {
  return BRANCH_COLORS[index % BRANCH_COLORS.length];
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Sound FX: Synthesized Web Audio Time Warp ───────────────

function playTimeWarpSound(isRewind: boolean): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Deep time-portal bass sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';

    const now = ctx.currentTime;
    if (isRewind) {
      // Reverse pitch sweep: drops then rises with resonant ringing
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.7);
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.7);
    } else {
      // Reality branch shift: bright shimmer chord
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.75);
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 0.75);
    }

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.85);

    setTimeout(() => ctx.close().catch(() => {}), 1000);
  } catch {
    // Non-critical audio
  }
}

let campaignSnapshotProvider: (() => any) | null = null;
let campaignRestoreHandler: ((snap: any) => void) | null = null;

export function registerCampaignTimelineHooks(
  getSnapshot: () => any,
  restoreSnapshot: (snap: any) => void
) {
  campaignSnapshotProvider = getSnapshot;
  campaignRestoreHandler = restoreSnapshot;
}

// ─── Helper: Deep Capture of World State ──────────────────────

export function captureSnapshot(): WorldSnapshot {
  const s = useWorldStore.getState();
  return {
    entities: JSON.parse(JSON.stringify(s.entities)),
    player: JSON.parse(JSON.stringify(s.player)),
    factions: JSON.parse(JSON.stringify(s.factions)),
    relations: JSON.parse(JSON.stringify(s.relations)),
    story: JSON.parse(JSON.stringify(s.story)),
    terrain: JSON.parse(JSON.stringify(s.terrain)),
    weather: JSON.parse(JSON.stringify(s.weather)),
    time: JSON.parse(JSON.stringify(s.time)),
    chaosScore: s.chaosScore,
    events: JSON.parse(JSON.stringify(s.events)),
    firedTriggers: NarrativeEngine.getFiredTriggers(),
    campaign: campaignSnapshotProvider ? campaignSnapshotProvider() : undefined,
    bridgeDestroyed: s.bridgeDestroyed,
    isCampfireBurning: s.isCampfireBurning,
    dynamicProps: JSON.parse(JSON.stringify(s.dynamicProps)),
  };
}

// ─── Timeline Zustand Store ───────────────────────────────────

interface TimelineStore {
  branches: Record<string, TimelineBranch>;
  checkpoints: Record<string, TimelineCheckpoint>;
  activeBranchId: string;
  activeCheckpointId: string;

  // Reality transition state
  isTransitioning: boolean;
  transitionText: string;
  transitionType: 'rewind' | 'branch_switch';

  // Actions
  createCheckpoint: (opts: {
    name: string;
    description: string;
    significance?: CheckpointSignificance;
    forceNewBranch?: boolean;
  }) => string;

  rewind: (target?: 'last' | 'initial' | string) => boolean;
  switchBranch: (branchIdOrName: string) => boolean;
  restoreCheckpoint: (checkpointId: string) => boolean;
  createExplicitBranch: (customName?: string) => string;
}

// ─── Initialize Root Branch & Inception Checkpoint ────────────

const ROOT_BRANCH_ID = 'branch_prime';
const INCEPTION_CP_ID = 'cp_inception';

function createInitialTimeline(): {
  branches: Record<string, TimelineBranch>;
  checkpoints: Record<string, TimelineCheckpoint>;
} {
  const snapshot = captureSnapshot();

  const inceptionCp: TimelineCheckpoint = {
    id: INCEPTION_CP_ID,
    branchId: ROOT_BRANCH_ID,
    name: 'Origin: Standoff of Two Thrones',
    description: 'The world stands poised at the brink of peace or war.',
    realTimestamp: Date.now(),
    gameHour: snapshot.time.hours,
    significance: 'initial',
    snapshot,
  };

  const primeBranch: TimelineBranch = {
    id: ROOT_BRANCH_ID,
    name: 'Prime Timeline (Alpha)',
    checkpointIds: [INCEPTION_CP_ID],
    createdAt: Date.now(),
    color: BRANCH_COLORS[0],
  };

  return {
    branches: { [ROOT_BRANCH_ID]: primeBranch },
    checkpoints: { [INCEPTION_CP_ID]: inceptionCp },
  };
}

const initialData = createInitialTimeline();

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  branches: initialData.branches,
  checkpoints: initialData.checkpoints,
  activeBranchId: ROOT_BRANCH_ID,
  activeCheckpointId: INCEPTION_CP_ID,

  isTransitioning: false,
  transitionText: '',
  transitionType: 'rewind',

  // ── 1. Create a Checkpoint (with Auto-Branching) ───────────
  createCheckpoint: ({ name, description, significance = 'command', forceNewBranch = false }) => {
    const { branches, checkpoints, activeBranchId, activeCheckpointId } = get();
    const currentBranch = branches[activeBranchId];
    if (!currentBranch) return '';

    const snapshot = captureSnapshot();
    const checkpointId = generateId('cp');

    // Check if player rewound to an earlier checkpoint in this branch
    // and is now creating a new event: BRANCH DIVERGENCE!
    const isAtBranchHead =
      currentBranch.checkpointIds.length > 0 &&
      currentBranch.checkpointIds[currentBranch.checkpointIds.length - 1] === activeCheckpointId;

    let targetBranchId = activeBranchId;
    let updatedBranches = { ...branches };

    if (!isAtBranchHead || forceNewBranch) {
      // Divergence detected! Fork into a new alternate reality
      const branchCount = Object.keys(branches).length;
      const branchGreekLetters = ['Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Theta', 'Omega'];
      const letter = branchGreekLetters[(branchCount - 1) % branchGreekLetters.length];
      const newBranchId = generateId('branch');

      const forkCp = checkpoints[activeCheckpointId];
      const forkedName = `Timeline ${letter}: Diverged from "${forkCp?.name ?? 'Previous'}"`;

      const newBranch: TimelineBranch = {
        id: newBranchId,
        name: forkedName,
        parentBranchId: activeBranchId,
        forkCheckpointId: activeCheckpointId,
        checkpointIds: [checkpointId],
        createdAt: Date.now(),
        color: pickBranchColor(branchCount),
      };

      updatedBranches[newBranchId] = newBranch;
      targetBranchId = newBranchId;

      useWorldStore.getState().addStoryLog(
        `Reality diverged. Alternate timeline established: ${forkedName}`
      );
      if (import.meta.env?.DEV) console.log(`[TimelineSystem] Auto-branched into ${forkedName} (${newBranchId})`);
    } else {
      // Continue along current branch
      updatedBranches[activeBranchId] = {
        ...currentBranch,
        checkpointIds: [...currentBranch.checkpointIds, checkpointId],
      };
    }

    const newCheckpoint: TimelineCheckpoint = {
      id: checkpointId,
      branchId: targetBranchId,
      name,
      description,
      realTimestamp: Date.now(),
      gameHour: snapshot.time.hours,
      significance,
      snapshot,
    };

    set({
      branches: updatedBranches,
      checkpoints: {
        ...checkpoints,
        [checkpointId]: newCheckpoint,
      },
      activeBranchId: targetBranchId,
      activeCheckpointId: checkpointId,
    });

    if (import.meta.env?.DEV) console.log(`[TimelineSystem] Checkpoint created: "${name}" (${checkpointId}) in ${targetBranchId}`);
    return checkpointId;
  },

  // ── 2. Restore Checkpoint with Simulation Sync & FX ─────────
  restoreCheckpoint: (checkpointId: string) => {
    const { checkpoints, branches, activeCheckpointId } = get();
    const cp = checkpoints[checkpointId];
    if (!cp) {
      console.warn(`[TimelineSystem] Checkpoint ${checkpointId} not found`);
      return false;
    }

    if (checkpointId === activeCheckpointId) {
      console.info(`[TimelineSystem] Already at checkpoint ${checkpointId}`);
    }

    const branch = branches[cp.branchId];
    const isRewind = cp.branchId === get().activeBranchId;
    const cpName = cp.name || 'Checkpoint';
    const branchName = branch?.name || 'Timeline';

    // Trigger visual and sound effect
    playTimeWarpSound(isRewind);

    set({
      isTransitioning: true,
      transitionText: isRewind
        ? `REWINDING REALITY TO: "${cpName.toUpperCase()}"`
        : `SHIFTING TO: "${branchName.toUpperCase()}"`,
      transitionType: isRewind ? 'rewind' : 'branch_switch',
    });

    // Restore simulation state
    useWorldStore.getState().restoreSnapshot(cp.snapshot);
    NarrativeEngine.setFiredTriggers(cp.snapshot.firedTriggers || []);
    if (cp.snapshot.campaign && campaignRestoreHandler) {
      campaignRestoreHandler(cp.snapshot.campaign);
    }

    useWorldStore.getState().addStoryLog(
      `⏳ Timeline restored to: "${cp.name}" [${branch?.name ?? 'Timeline'}]`
    );

    set({
      activeBranchId: cp.branchId,
      activeCheckpointId: cp.id,
    });

    // Fade out transition overlay
    setTimeout(() => {
      set({ isTransitioning: false });
    }, 700);

    return true;
  },

  // ── 3. Rewind to Target or Step Back ─────────────────────────
  rewind: (target?: 'last' | 'initial' | string) => {
    const { branches, checkpoints, activeBranchId, activeCheckpointId } = get();
    const currentBranch = branches[activeBranchId];
    if (!currentBranch) return false;

    // A. Rewind to Initial Origin
    if (target === 'initial' || target === 'origin' || target === 'beginning') {
      const firstId = currentBranch.checkpointIds[0] || INCEPTION_CP_ID;
      return get().restoreCheckpoint(firstId);
    }

    // B. Named or keyword target (e.g. "war", "peace", "dragon", "aldric")
    if (target && target !== 'last') {
      const q = target.toLowerCase();
      // Search checkpoints in current branch first, then across all branches
      const branchCps = currentBranch.checkpointIds
        .map((id) => checkpoints[id])
        .filter(Boolean);

      const match =
        branchCps.find((c) => (c.name?.toLowerCase() || '').includes(q) || (c.description?.toLowerCase() || '').includes(q)) ||
        Object.values(checkpoints).find((c) => (c.name?.toLowerCase() || '').includes(q) || (c.description?.toLowerCase() || '').includes(q));

      if (match) {
        return get().restoreCheckpoint(match.id);
      }
    }

    // C. Default: Rewind to the previous checkpoint (Step back)
    const idx = currentBranch.checkpointIds.indexOf(activeCheckpointId);
    if (idx > 0) {
      const prevId = currentBranch.checkpointIds[idx - 1];
      return get().restoreCheckpoint(prevId);
    }

    // If at the root of a diverged branch, jump back to fork checkpoint in parent
    if (currentBranch.forkCheckpointId && checkpoints[currentBranch.forkCheckpointId]) {
      return get().restoreCheckpoint(currentBranch.forkCheckpointId);
    }

    // Already at earliest checkpoint
    useWorldStore.getState().addStoryLog('⏳ Already at the earliest recorded point in this timeline.');
    return false;
  },

  // ── 4. Switch Between Alternate Realities ───────────────────
  switchBranch: (branchIdOrName: string) => {
    const { branches, checkpoints, activeBranchId } = get();
    const q = branchIdOrName.toLowerCase();

    // Find branch by ID or name
    const branch =
      branches[branchIdOrName] ||
      Object.values(branches).find((b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q));

    if (!branch) {
      console.warn(`[TimelineSystem] Branch "${branchIdOrName}" not found`);
      useWorldStore.getState().addStoryLog(`Timeline branch "${branchIdOrName}" could not be found.`);
      return false;
    }

    if (branch.id === activeBranchId) {
      console.info(`[TimelineSystem] Already in branch ${branch.name}`);
      return true;
    }

    // Restore the latest checkpoint of that branch
    const latestCpId = branch.checkpointIds[branch.checkpointIds.length - 1];
    if (latestCpId && checkpoints[latestCpId]) {
      return get().restoreCheckpoint(latestCpId);
    }

    return false;
  },

  // ── 5. Create Explicit Alternate Reality Branch ─────────────
  createExplicitBranch: (customName?: string) => {
    const { branches, checkpoints, activeBranchId, activeCheckpointId } = get();
    const currentCp = checkpoints[activeCheckpointId];
    const branchCount = Object.keys(branches).length;

    const branchGreekLetters = ['Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Theta', 'Omega'];
    const letter = branchGreekLetters[(branchCount - 1) % branchGreekLetters.length];
    const newBranchId = generateId('branch');

    const name = customName?.trim()
      ? customName
      : `Timeline ${letter}: Fork of "${currentCp?.name ?? 'Branch'}"`;

    const snapshot = captureSnapshot();
    const cpId = generateId('cp');

    const newCp: TimelineCheckpoint = {
      id: cpId,
      branchId: newBranchId,
      name: `Fork Origin: ${name}`,
      description: `New reality diverged at real time.`,
      realTimestamp: Date.now(),
      gameHour: snapshot.time.hours,
      significance: 'manual',
      snapshot,
    };

    const newBranch: TimelineBranch = {
      id: newBranchId,
      name,
      parentBranchId: activeBranchId,
      forkCheckpointId: activeCheckpointId,
      checkpointIds: [cpId],
      createdAt: Date.now(),
      color: pickBranchColor(branchCount),
    };

    set({
      branches: { ...branches, [newBranchId]: newBranch },
      checkpoints: { ...checkpoints, [cpId]: newCp },
      activeBranchId: newBranchId,
      activeCheckpointId: cpId,
    });

    useWorldStore.getState().addStoryLog(`New reality fork forged: "${name}".`);
    return newBranchId;
  },
}));

// ─── Exported Convenience API ─────────────────────────────────

export const TimelineSystem = {
  createCheckpoint: (opts: {
    name: string;
    description: string;
    significance?: CheckpointSignificance;
    forceNewBranch?: boolean;
  }) => useTimelineStore.getState().createCheckpoint(opts),

  rewind: (target?: 'last' | 'initial' | string) =>
    useTimelineStore.getState().rewind(target),

  switchBranch: (branchIdOrName: string) =>
    useTimelineStore.getState().switchBranch(branchIdOrName),

  restoreCheckpoint: (checkpointId: string) =>
    useTimelineStore.getState().restoreCheckpoint(checkpointId),

  createExplicitBranch: (customName?: string) =>
    useTimelineStore.getState().createExplicitBranch(customName),
};
