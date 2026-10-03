# ECHO: The Voice That Alters Reality

> *"How much of the world are you willing to destroy to create the world you want?"*

**ECHO** is a 3D stylized cel-shaded narrative action-adventure sandbox RPG where your spoken voice directly bends physical reality and timeline branches. 

Built in React, TypeScript, and Three.js (via React Three Fiber), the game merges real-time physics simulation, dynamic AI pathing, and timeline rewind mechanics with multimodal voice recognition powered by Google Gemini.

---

## Table of Contents
1. [Core Concept & Thematic Vision](#core-concept--thematic-vision)
2. [Campaign & Vertical Story Slice](#campaign--vertical-story-slice)
   - [Mission 1: The First Resonance](#mission-1-the-first-resonance)
   - [Mission 2: The Whispering Stones](#mission-2-the-whispering-stones)
   - [Mission 3: The Battle for the Mill](#mission-3-the-battle-for-the-mill)
   - [Mission 4: The Anchor of the Architect](#mission-4-the-anchor-of-the-architect)
3. [Key Systems & Architecture](#key-systems--architecture)
   - [Voice Engine & Multimodal Parsing](#voice-engine--multimodal-parsing)
   - [Real-Time Crisis & AI Simulation](#real-time-crisis--ai-simulation)
   - [Timeline Branching, Checkpointing & The Echo Tree](#timeline-branching-checkpointing--the-echo-tree)
   - [World Memory Ledger & Character Bonds](#world-memory-ledger--character-bonds)
   - [Procedural Audio & Water Acoustics](#procedural-audio--water-acoustics)
   - [Stylized Cel-Shaded Visual Direction](#stylized-cel-shaded-visual-direction)
   - [Cinematic Dark Fantasy UI Design](#cinematic-dark-fantasy-ui-design)
   - [Rebindable Controls System](#rebindable-controls-system)
   - [Cinematic Camera System](#cinematic-camera-system)
4. [Technology Stack](#technology-stack)
5. [Voice Commands & Controls](#voice-commands--controls)
6. [Getting Started & Local Development](#getting-started--local-development)
7. [Verification & Testing](#verification--testing)

---

## Core Concept & Thematic Vision

The player awakens in the Meadowlands with no memory, discovering an extraordinary ability known as **The Echo**: whatever they speak aloud manifests in the physical world. 

At first, this power feels like a miracle—storms can be summoned to nourish crops, enemies can be repelled, and fallen comrades can be protected. But through the campaign, the player discovers a harrowing truth: **rewriting reality does not erase what happened—it fractures the world into alternate branches.**

Every edit leaves a silent scar. While the inhabitants of the world forget erased timelines, **Mira the Seer** carries the agonizing memories of every timeline unmade. The ancient **Architect** was a Voice who came before, attempting to craft a world free of sorrow, only to crack the foundations of reality. The player must confront the weight of every command spoken.

---

## Campaign & Vertical Story Slice

The initial vertical slice focuses on 4 tightly interconnected narrative acts:

```
PROLOGUE — THE VOICE
[Mission 1: The First Resonance]
       │
       ▼
ACT I / ACT II — THE WOMAN WHO REMEMBERS
[Mission 2: The Whispering Stones]
       │
       ▼
ACT III — THE GATHERING STORM
[Mission 3: The Battle for the Mill]
       │
       ▼
ACT IV — THE PHYSICAL ANCHOR
[Mission 4: The Anchor of the Architect]
```

### Mission 1: The First Resonance
- **Setting**: The quiet riverbanks of the Meadowlands by Rowan's Old Mill.
- **Narrative Focus**: Introduces Rowan the Miller—a kind, hardworking villager who becomes the player's initial emotional anchor.
- **Gameplay**: Rowan guides the player in awakening the Echo. When the player speaks their first command (altering the weather or manifesting an entity), Rowan reacts with awe and directs the player toward Mira the Seer.

### Mission 2: The Whispering Stones
- **Setting**: The basalt monolith crossing at coordinates `(-4, 9)`.
- **Narrative Focus**: Mira does not treat the Echo with wonder; she shivers. She reveals that she remembers every tragedy that was "erased" by past voices.
- **Backstory Reveal**: The first layer of The Architect lore is unveiled. The player establishes a chronal anchor at the stones just as Shadowfang warhorns echo from the ridge.

### Mission 3: The Battle for the Mill
- **Setting**: The Old Mill (`5, 5`) and the River Crossing Bridge (`-8, 5`).
- **Narrative Focus**: The first major gameplay-driven story mission. Warlord Vorn’s Shadowfang Vanguard advances across the ridge to burn the mill.
- **Urgency & Simulation**:
  - The vanguard physically marches across the bridge carrying lit torches.
  - Villagers panic and flee toward eastern shelters.
  - Rowan is visibly vulnerable at the mill wheel.
  - Brief non-blocking camera cues frame the raid and danger moments without locking player controls.
- **Player Freedom & Primary Echo Solutions**:
  1. `"Protect Rowan"` / `"Shield Rowan"`: Manifests an iridescent Chronal Barrier that deflects raider blades with knockback.
  2. `"Call the rain"`: Weather changes to a downpour; vanguard torches are doused with smoke; raiders break rank and flee from the rising flood.
  3. `"Destroy the bridge"`: The stone bridge physically collapses into rubble and splintered timber, cutting off the crossing and stranding the raiders on the western bank.
  4. `"Make the soldiers retreat"`: The soldiers break ranks in terror, physically turning around and sprinting back over the ridge.
  5. *Direct Combat*: Normal player melee or spell combat against the vanguard.
- **Real Simulation Fates for Rowan**:
  Rowan's fate is never faked through dialogue; it derives directly from his simulation health:
  - **Saved** ($\ge 60$ HP): Rowan survives unscathed; bond deepens.
  - **Wounded** ($0 < \text{HP} < 60$): Rowan takes damage and bandages his wounds; acknowledges the struggle.
  - **Dead** ($\le 0$ HP): Rowan collapses on the mill step. The scene breathes with emotional weight and solemn reflection.
- **Dynamic Aftermath Dialogue**: Dialogues dynamically adapt to Rowan's fate, the resolution method used, character bonds, and rewind history.

### Mission 4: The Anchor of the Architect
- **Setting**: The ancient **Echo Tree** glade west of the woods (`-13, -1.5`).
- **Narrative Focus**: The Echo Tree is the sole physical nexus connecting fractured timelines. Here, the tragedy of the Architect is laid bare, and the player learns how timelines can be branched and rewound.

---

## Key Systems & Architecture

```
                  ┌────────────────────────────────────────┐
                  │          Microphone Input              │
                  └───────────────────┬────────────────────┘
                                      ▼
                  ┌────────────────────────────────────────┐
                  │    Voice Engine (Web Speech API)       │
                  └───────────────────┬────────────────────┘
                                      ▼
                  ┌────────────────────────────────────────┐
                  │  CommandParser (Gemini JSON + Fallback)│
                  └───────────────────┬────────────────────┘
                                      ▼
                  ┌────────────────────────────────────────┐
                  │           Command Dispatcher           │
                  └───┬───────────────┬────────────────┬───┘
                      │               │                │
                      ▼               ▼                ▼
             ┌────────────────┐┌──────────────┐┌───────────────┐
             │ World State    ││CampaignSystem││TimelineSystem │
             │ - Entities     ││- Missions    ││- Snapshots    │
             │ - Weather      ││- Objectives  ││- Branches     │
             │ - Physics      ││- Dialogues   ││- Rewind Engine│
             └────────────────┘└──────────────┘└───────────────┘
```

### Voice Engine & Multimodal Parsing
- **Zero-Latency Keyword Fallback**: Immediate local parsing for seamless offline gameplay.
- **Gemini Structured JSON Output**: For nuanced, natural language requests when online (`gemini-3.5-flash-lite`).
- **Minimalist HUD**: No giant intrusive overlays—the world itself communicates outcomes through audio chimes, particle ripples, and immediate environmental reactions.

### Real-Time Crisis & AI Simulation
- **Entity AI States**: `idle`, `wandering`, `advancing`, `alert`, `fleeing`, `cheering`.
- **Environment Awareness**: NPCs detect deep water, avoid fires, and respond to bridge collapse by halting or finding alternative shallow crossings.
- **Dynamic Damage & Knockback**: Real physics recoil, hit stagger, and health calculations for all entities.

### Timeline Branching, Checkpointing & The Echo Tree
- **Deep Immutable Snapshots**: `WorldSnapshot` captures all entity states, weather, time, chaos scores, and dynamic props.
- **The Echo Tree**: The exclusive, authoritative physical anchor in the world where timeline manipulation occurs.
- **Branch Management**: Players can fork realities, jump between branches, or rewind to critical narrative junctions.

### World Memory Ledger & Character Bonds
- **Persistent Memory Ledger**: Records player actions (e.g., `player_helped`, `structure_built`, `player_attacked`).
- **Dynamic Character Bonds**: Rowan, Mira, King Aldric, and Warlord Vorn track relationship values based on player choices and interventions.

### Procedural Audio & Water Acoustics
ECHO synthesizes 100% of its audio procedurally using the Web Audio API with zero external asset dependencies, zero network latency, and seamless acoustic continuity:
- **Continuous River Ambience**: Looping 6.0-second pink noise buffer processed through parallel dual-band filters:
  - *Deep flow path*: Lowpass filter at 420 Hz for rushing water body.
  - *Surface trickle path*: Bandpass filter at 920 Hz (Q=1.1) for water rippling over riverbed stones.
  - *Distance Attenuation*: Logarithmic falloff between 26m and the riverbank (0m), with high frequencies rolling off at distance.
- **Shoreline Hysteresis & Debouncing**:
  - Entry requires $\ge 0.08$m water depth; exit requires $< 0.03$m depth (6cm deadband preventing shoreline boundary oscillation).
  - 450ms transition debounce timer prevents repeated one-shot audio triggers.
- **Natural Wading Sloshes**: 3 randomized slosh variations combining a low-frequency liquid displacement body (440–520 Hz $\to$ 200 Hz) with soft bubble blips (320–390 Hz). Completely eliminates harsh resonant clicking.
- **Swimming Audio Layers**: Continuous gentle water churn when moving ($> 0.4$ speed), paired with synchronized breaststroke water pushes and subtle paddle swirls.
- **Submersion & Underwater Acoustics**:
  - Master lowpass filter steeply ramps down to 320 Hz to muffle distant world sounds.
  - 52 Hz sub-aquatic pressure drone hums while submerged.
  - Surfacing smoothly restores the 22 kHz frequency spectrum and plays a crisp air-breach emergence splash.
- **Landing Velocity Filtering**: Landing impacts are gated to vertical drops exceeding $-3.5$ m/s, preventing false splashes while walking down terrain gradients.

### Stylized Cel-Shaded Visual Direction
- **Toon Shading Pipeline**: Custom 3-step and 4-step toon color ramps (`getToonGradient3`, `getToonGradient4`) applied to custom meshes.
- **Procedural Textures**: Hand-drawn canvas textures for stone masonry, timber grain, heraldic tabards, and character attire.
- **Distinctive Character Silhouettes**: Expressive facial textures, animated limbs, speaking mouth/head gestures during dialogue, and unique weapons/torches.

### Cinematic Dark Fantasy UI Design
The game uses a unified, serious dark fantasy visual theme across all 18 UI surfaces:
- **Palette**: Warm ivory/parchment typography (`#E8E3D8`), muted antique gold highlights (`#B59A4A`, `#8F7836`), near-black charcoal panels (`#070B12`, `#0C1119`), and dark bronze/stone borders (`#292923`, `#3A3628`).
- **Cohesive Surfaces**: Applied consistently to the Title Screen, Dialogue Box, Memory Panel, Timeline Tree, Save/Load modal, Settings modal, Compass, and Action Bars.

### Rebindable Controls System
- **Centralized Input Manager**: Custom action-based key mapping engine (`InputManager.ts`) supporting primary and alternate keybindings.
- **Conflict Handling**: Detects and resolves key conflicts within the same context while allowing shared keys across isolated contexts (e.g., Gameplay vs. Dialogue).
- **Timeline Isolation**: Control configurations persist in `localStorage` and remain completely unaffected by timeline rewinds or branch restorations.

### Cinematic Camera System
- **Face-Focused Dialogue Framing**: Automatic close-up framing with shot-reverse-shot staging and character emotion states.
- **Transient Camera Cues**: Cinematic establishing shots that auto-expire and cancel immediately when the player moves, ensuring uninterrupted player control.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Core** | React 19, TypeScript, Vite |
| **3D Rendering** | Three.js, `@react-three/fiber`, `@react-three/drei` |
| **State Management** | Zustand (Modular stores: `WorldState`, `CampaignSystem`, `TimelineSystem`, `EchoTreeState`, `SettingsStore`) |
| **Speech & AI** | Web Speech Recognition API, Google Gemini Flash API (`generateContent` with structured JSON) |
| **Audio Synthesis** | Procedural Web Audio API (river ambience, wading sloshes, swimming strokes, underwater filtering, thunder, combat impacts) |
| **Styling & UI** | Vanilla CSS, Glassmorphic overlays, Cinematic Dark Fantasy Design System |
| **Testing & CI** | Node.js, `tsx` TypeScript test runner |

---

## Voice Commands & Controls

### Keyboard & Mouse Controls

| Input | Action |
| :--- | :--- |
| **W, A, S, D** | Move Character |
| **Q, E** | Turn Character (Left / Right) |
| **Shift** | Sprint |
| **Space** | Jump (or swim upward when in water) |
| **C** | Dive / Swim Downward (or toggle camera mode in orbit) |
| **E** | Interact with NPCs, Echo Tree, or inspect objects |
| **R** | Timeline Rewind (open chronal branch panel) |
| **Escape** | Pause / Settings / Close Modal |
| **Mouse Drag** | Rotate Camera / Adjust View Angle |
| **Enter / Click** | Advance Dialogue during conversations |

*(All gameplay and dialogue keys can be rebound in the in-game Settings modal)*

### Example Voice Commands

| Category | Example Voice Commands | Game Reaction |
| :--- | :--- | :--- |
| **Mission 3 Solutions** | *"Protect Rowan"* / *"Shield Rowan"* | Chronal barrier envelops Rowan; immune to physical attacks |
| | *"Call the rain"* / *"Bring the rain"* | Weather changes to storm; torches are extinguished; raiders flee |
| | *"Destroy the bridge"* / *"Collapse the bridge"* | River bridge shatters into rubble; cutting off the western crossing |
| | *"Make the soldiers retreat"* / *"Retreat"* | Raiders flee back over the ridge and despawn |
| **World & Weather** | *"Make it storm"*, *"Clear the skies"*, *"Set time to night"* | Procedural sky, lighting, and weather transitions |
| **Entity Spawning** | *"Spawn a deer"*, *"Summon a dragon"*, *"Build a watchtower"* | Spawns entities aligned to terrain height with full AI |
| **Faction Relations** | *"Declare war between Suncrest and Shadowfang"* | Changes kingdom relations to hostile; guards mobilize |
| **Timeline Commands** | *"Rewind time"*, *"Rewind to the war"*, *"Save checkpoint"* | Rewinds to past snapshots or creates a voice bookmark |

---

## Getting Started & Local Development

### Prerequisites
- Node.js (version 18 or higher recommended)
- npm or pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kishore1035/ECHO.git
   cd ECHO
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables** (Optional):
   Create a `.env` file in the project root to enable Gemini API command parsing (the game falls back to zero-latency keyword parsing if omitted):
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## Verification & Testing

ECHO includes automated test suites covering narrative progression, controls, water audio, and combat simulation:

```bash
# 1. Full Narrative Vertical Slice (M1 -> M2 -> M3 -> M4, branches & Echo Tree)
npx tsx scripts/verify_narrative_slice.ts

# 2. Controls & Key Rebinding System (Bindings, conflict resolution, timeline isolation)
npx tsx scripts/verify_controls_system.ts

# 3. Water Audio & Acoustic Physics (Proximity falloff, hysteresis, splash synthesis, velocity gates)
npx tsx scripts/verify_water_audio.ts

# 4. Mission 3 Battle Simulation (All 4 Echo solutions, raider pathing, Rowan fates)
npx tsx scripts/verify_m3_battle.ts
```

All test suites validate zero regression across storyline logic, audio synthesis, and world simulation.

---

## License

Private repository. All rights reserved. Built with React Three Fiber.
