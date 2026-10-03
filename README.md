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
   - [Stylized Cel-Shaded Visual Direction](#stylized-cel-shaded-visual-direction)
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

### Stylized Cel-Shaded Visual Direction
- **Toon Shading Pipeline**: Custom 3-step and 4-step toon color ramps (`getToonGradient3`, `getToonGradient4`) applied to custom meshes.
- **Procedural Textures**: Hand-drawn canvas textures for stone masonry, timber grain, heraldic tabards, and character attire.
- **Distinctive Character Silhouettes**: Expressive facial textures, animated limbs, speaking mouth/head gestures during dialogue, and unique weapons/torches.

### Cinematic Camera System
- **Face-Focused Dialogue Framing**: Automatic close-up framing with shot-reverse-shot staging and character emotion states.
- **Transient Camera Cues**: Cinematic establishing shots that auto-expire and cancel immediately when the player moves, ensuring uninterrupted player control.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Core** | React 19, TypeScript, Vite |
| **3D Rendering** | Three.js, `@react-three/fiber`, `@react-three/drei` |
| **State Management** | Zustand (Modular stores: `WorldState`, `CampaignSystem`, `TimelineSystem`, `EchoTreeState`) |
| **Speech & AI** | Web Speech Recognition API, Google Gemini Flash API (`generateContent` with structured JSON) |
| **Audio Synthesis** | Web Audio API (procedural footsteps, chimes, water splashes, thunder, ambient nature) |
| **Styling & UI** | Vanilla CSS, Glassmorphic overlays, Lucide React icons |
| **Testing** | Node.js, `tsx` TypeScript test runner |

---

## Voice Commands & Controls

### Keyboard & Mouse Controls

| Input | Action |
| :--- | :--- |
| **W, A, S, D** | Move Character (Cancels active camera cues) |
| **Shift** | Sprint |
| **Space** | Jump |
| **Mouse Drag** | Orbit Camera / Adjust View Angle |
| **C** | Toggle Camera Mode (Third-person Orbit $\leftrightarrow$ First-person) |
| **Spacebar / Click** | Advance Dialogue during conversations |

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
   Create a `.env` file in the project root to enable Gemini API command parsing (the game will fall back to local keyword parsing if omitted):
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

ECHO includes an automated simulation test suite that verifies all story branches, voice commands, and timeline state restorations:

```bash
npx tsx scripts/verify_m3_battle.ts
```

The test suite validates:
- [x] Voice command parsing for all 4 Echo paths.
- [x] Path 1: Chronal Shield formation on Rowan.
- [x] Path 2: Weather transition to rain and torch extinguishing.
- [x] Path 3: Bridge destruction, collision severing, and crossing cutoff.
- [x] Path 4: Soldier panic and retreat behavior.
- [x] Path 5: Rowan simulation fates (*saved*, *wounded*, *dead*) from real HP values.
- [x] Path 6: Timeline Rewind restoring pre-raid world state, entity health, and structures.

---

## License

Private repository. All rights reserved. Built with React Three Fiber.
