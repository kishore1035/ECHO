// ============================================================
// COMMAND PARSER — Voice transcript → typed GameCommand
// Uses Gemini API (structured JSON output) with a keyword fallback
// so the game works even without an API key set.
// ============================================================

import type { GameCommand, EntityType, StructureType, Vec3, InteractEntityCommand } from '../core/types';
import { NAMED_LOCATIONS, getTerrainHeight } from '../core/terrain';

function getApiKey(): string | undefined {
  const envKey = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) : undefined;
  return envKey?.trim();
}

function getGeminiUrl(): string {
  const key = getApiKey();
  return key
    ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${key}`
    : '';
}

// ─── System prompt for Gemini ─────────────────────────────────

function buildSystemPrompt(): string {
  const locationList = Object.entries(NAMED_LOCATIONS)
    .filter(([k]) => !k.startsWith('the ') && k !== 'here' && k !== 'there')
    .map(([name, { x, z }]) => `  ${name}: x=${x}, z=${z}`)
    .join('\n');

  return `You are a game command parser for a fantasy 3D sandbox game.
Parse the player's voice command and return a single JSON object.

Supported characters & creatures:
- Characters: knight, king, villager, mage, guard, merchant
- Creatures: wolf, dragon, deer, sheep, fox

Supported structures:
- tower, house, windmill, castle, village

Named world locations (x, z coordinates):
${locationList}

Supported commands and JSON shapes:

1. Spawn character or creature:
{"command":"SPAWN_ENTITY","entityType":"deer","position":{"x":0,"y":0,"z":0},"name":"Fleetfoot"}

2. Build structure:
{"command":"BUILD_STRUCTURE","structureType":"tower","position":{"x":0,"y":0,"z":0},"name":"Watchtower"}

3. Change weather:
{"command":"WORLD_MODIFY","property":"weather","value":"rain"} (values: clear, rain, storm, fog)

4. Change time of day:
{"command":"WORLD_MODIFY","property":"time","value":"night"} (values: day, night, noon, sunrise, sunset, midnight)

5. Change relationship between kingdoms (peace or war):
{"command":"SET_FACTION_RELATION","factionA":"suncrest","factionB":"shadowfang","relation":"allied"}
or
{"command":"SET_FACTION_RELATION","factionA":"suncrest","factionB":"shadowfang","relation":"hostile"}

6. Despawn entity:
{"command":"DESPAWN_ENTITY","entityName":"Ignaroth","all":false}
or
{"command":"DESPAWN_ENTITY","all":true}

7. Interact with a named character (help or attack):
{"command":"INTERACT_ENTITY","action":"help","entityName":"Rowan"}
or
{"command":"INTERACT_ENTITY","action":"attack","entityName":"King Aldric"}

8. Rewind reality / time:
{"command":"REWIND"}
or with a target ("rewind to the war", "rewind to beginning", "go back to when village was standing"):
{"command":"REWIND","target":"war"}

9. Switch alternate reality / timeline branch:
{"command":"SWITCH_BRANCH","branchIdOrName":"Beta"}

10. Save checkpoint / bookmark reality:
{"command":"CREATE_CHECKPOINT","name":"Before the Siege"}

IMPORTANT:
- Position y should always be 0 — the game engine automatically sets terrain height.
- If player says "here" or no location, use center (x=0, z=0).
- Return ONLY valid JSON. No other text.`;
}

// ─── Gemini API call ──────────────────────────────────────────

async function callGemini(
  transcript: string,
  entityContext: string
): Promise<GameCommand | null> {
  const url = getGeminiUrl();
  if (!url) throw new Error('No Gemini URL configured');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: buildSystemPrompt() }] },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Current world entities:\n${entityContext || 'none'}\n\nPlayer says: "${transcript}"`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 250,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');

  const parsed = JSON.parse(text);
  return convertToCommand(parsed);
}

// ─── Convert raw JSON → typed GameCommand ─────────────────────

function resolvePosition(raw: { x?: number; y?: number; z?: number } | undefined): Vec3 {
  const x = raw?.x ?? 0;
  const z = raw?.z ?? 0;
  return { x, y: getTerrainHeight(x, z) + 0.05, z };
}

function convertToCommand(obj: Record<string, unknown>): GameCommand | null {
  if (obj.command === 'SPAWN_ENTITY') {
    return {
      type: 'SPAWN_ENTITY',
      entityType: (obj.entityType as EntityType) || 'generic',
      position: resolvePosition(obj.position as { x?: number; y?: number; z?: number }),
      name: (obj.name as string) || 'Unknown',
    };
  }

  if (obj.command === 'BUILD_STRUCTURE') {
    return {
      type: 'BUILD_STRUCTURE',
      structureType: (obj.structureType as StructureType) || 'house',
      position: resolvePosition(obj.position as { x?: number; y?: number; z?: number }),
      name: (obj.name as string) || 'Structure',
    };
  }

  if (obj.command === 'WORLD_MODIFY') {
    return {
      type: 'WORLD_MODIFY',
      property: (obj.property as 'weather' | 'time') || 'weather',
      value: String(obj.value || 'clear'),
    };
  }

  if (obj.command === 'SET_FACTION_RELATION') {
    return {
      type: 'SET_FACTION_RELATION',
      factionA: String(obj.factionA || 'suncrest').toLowerCase(),
      factionB: String(obj.factionB || 'shadowfang').toLowerCase(),
      relation: (obj.relation as any) === 'hostile' ? 'hostile' : 'allied',
    };
  }

  if (obj.command === 'DESPAWN_ENTITY') {
    return {
      type: 'DESPAWN_ENTITY',
      entityId: (obj.entityId as string) || undefined,
      entityName: (obj.entityName as string) || undefined,
      all: Boolean(obj.all),
    };
  }

  if (obj.command === 'INTERACT_ENTITY') {
    return {
      type: 'INTERACT_ENTITY',
      action: (obj.action as string) === 'attack' ? 'attack' : 'help',
      entityName: String(obj.entityName || ''),
    };
  }

  if (obj.command === 'REWIND') {
    return {
      type: 'REWIND',
      target: (obj.target as string) || 'last',
    };
  }

  if (obj.command === 'SWITCH_BRANCH') {
    return {
      type: 'SWITCH_BRANCH',
      branchIdOrName: String(obj.branchIdOrName || 'Prime'),
    };
  }

  if (obj.command === 'CREATE_CHECKPOINT') {
    return {
      type: 'CREATE_CHECKPOINT',
      name: (obj.name as string) || 'Voice Bookmark',
    };
  }

  return null;
}

// ─── Fallback keyword parser (zero API key needed) ────────────

const ENTITY_KEYWORDS: EntityType[] = [
  'dragon', 'king', 'knight', 'mage', 'guard', 'merchant', 'villager', 'wolf',
  'deer', 'sheep', 'fox',
];

const STRUCTURE_KEYWORDS: StructureType[] = [
  'tower', 'house', 'windmill', 'castle', 'village', 'bridge',
];

const FANTASY_NAMES: Record<string, string[]> = {
  king:     ['King Aldric', 'King Vorn', 'King Edren'],
  knight:   ['Sir Garett', 'Lady Mira', 'Sir Edwyn'],
  villager: ['Tomlin', 'Elara', 'Bren'],
  mage:     ['Mage Sylvara', 'The Sorcerer', 'Mage Kael'],
  guard:    ['Guard Osric', 'Warden Tess', 'Guard Bryn'],
  merchant: ['Merchant Tobias', 'Trader Fera'],
  wolf:     ['Grey Fang', 'Shadow', 'Ash'],
  dragon:   ['Ignaroth', 'Veyrax', 'Scaldris'],
  deer:     ['Fleetfoot', 'Swift', 'Amber'],
  sheep:    ['Cloudy', 'Woolly', 'Barnaby'],
  fox:      ['Russet', 'Sly', 'Ember'],
  generic:  ['Wanderer', 'Stranger'],
};

function pickName(type: string): string {
  const names = FANTASY_NAMES[type] || FANTASY_NAMES.generic;
  return names[Math.floor(Math.random() * names.length)];
}

function extractLocation(t: string): Vec3 {
  let pos: Vec3 = { x: 0, y: 0, z: 0 };
  for (const [locName, { x, z }] of Object.entries(NAMED_LOCATIONS)) {
    if (t.includes(locName)) {
      pos = { x, y: getTerrainHeight(x, z) + 0.05, z };
      break;
    }
  }
  if (pos.y === 0) {
    pos.y = getTerrainHeight(pos.x, pos.z) + 0.05;
  }
  return pos;
}

function fallbackParse(transcript: string): GameCommand | null {
  const t = transcript.toLowerCase();

  // ── M4 Timeline & Reality Commands ────────────────────────
  // 1. Create Checkpoint / Bookmark
  if (
    t.includes('save checkpoint') ||
    t.includes('create checkpoint') ||
    t.includes('make checkpoint') ||
    t.includes('bookmark') ||
    t.includes('save reality')
  ) {
    return { type: 'CREATE_CHECKPOINT', name: 'Voice Bookmark' };
  }

  // 2. Switch Branch / Alternate Reality
  if (
    t.includes('switch branch') ||
    t.includes('switch timeline') ||
    t.includes('alternate reality') ||
    t.includes('change timeline') ||
    t.includes('switch to timeline') ||
    t.includes('other timeline')
  ) {
    let branchName = 'Prime';
    if (t.includes('beta')) branchName = 'Beta';
    else if (t.includes('gamma')) branchName = 'Gamma';
    else if (t.includes('delta')) branchName = 'Delta';
    else if (t.includes('war')) branchName = 'War';
    else if (t.includes('accord') || t.includes('peace')) branchName = 'Accord';
    else if (t.includes('alpha') || t.includes('prime')) branchName = 'Prime';
    return { type: 'SWITCH_BRANCH', branchIdOrName: branchName };
  }

  // 3. Rewind Reality / Time
  if (
    t.includes('rewind') ||
    t.includes('go back') ||
    t.includes('turn back time') ||
    t.includes('time travel') ||
    t.includes('undo') ||
    t.includes('restore checkpoint')
  ) {
    let target = 'last';
    if (
      t.includes('beginning') ||
      t.includes('start') ||
      t.includes('origin') ||
      t.includes('initial') ||
      t.includes('inception')
    ) {
      target = 'initial';
    } else if (t.includes('war')) {
      target = 'war';
    } else if (t.includes('peace') || t.includes('accord')) {
      target = 'accord';
    } else if (t.includes('village') || t.includes('standing')) {
      target = 'village';
    } else if (t.includes('dragon') || t.includes('shadow') || t.includes('malice')) {
      target = 'dragon';
    } else if (t.includes('rowan')) {
      target = 'rowan';
    } else if (t.includes('aldric')) {
      target = 'aldric';
    } else if (t.includes('vorn')) {
      target = 'vorn';
    }
    return { type: 'REWIND', target };
  }

  // Kingdom Alliance / Peace commands
  if (
    t.includes('allies') ||
    t.includes('alliance') ||
    t.includes('peace') ||
    t.includes('truce') ||
    t.includes('accord') ||
    t.includes('friends') ||
    (t.includes('make') && t.includes('ally'))
  ) {
    return {
      type: 'SET_FACTION_RELATION',
      factionA: 'suncrest',
      factionB: 'shadowfang',
      relation: 'allied',
    };
  }

  // Kingdom War / Hostile commands
  if (
    t.includes('declare war') ||
    t.includes('start war') ||
    t.includes('wage war') ||
    t.includes('make war') ||
    (t.includes('war') && (t.includes('kingdom') || t.includes('two') || t.includes('between'))) ||
    (t.includes('enemies') && (t.includes('make') || t.includes('kingdom'))) ||
    t.includes('attack suncrest') ||
    t.includes('attack shadowfang')
  ) {
    return {
      type: 'SET_FACTION_RELATION',
      factionA: 'suncrest',
      factionB: 'shadowfang',
      relation: 'hostile',
    };
  }

  // Weather commands
  if (t.includes('rain') || t.includes('raining')) {
    return { type: 'WORLD_MODIFY', property: 'weather', value: 'rain' };
  }
  if (t.includes('storm') || t.includes('thunder') || t.includes('lightning')) {
    return { type: 'WORLD_MODIFY', property: 'weather', value: 'storm' };
  }
  if (t.includes('fog') || t.includes('foggy') || t.includes('mist')) {
    return { type: 'WORLD_MODIFY', property: 'weather', value: 'fog' };
  }
  if (t.includes('clear') || t.includes('sunny') || t.includes('sunshine')) {
    return { type: 'WORLD_MODIFY', property: 'weather', value: 'clear' };
  }

  // Time commands
  if (t.includes('night') || t.includes('midnight') || t.includes('darkness')) {
    return { type: 'WORLD_MODIFY', property: 'time', value: 'night' };
  }
  if (t.includes('day') || t.includes('noon') || t.includes('daylight') || t.includes('morning')) {
    return { type: 'WORLD_MODIFY', property: 'time', value: 'noon' };
  }
  if (t.includes('sunrise') || t.includes('dawn')) {
    return { type: 'WORLD_MODIFY', property: 'time', value: 'sunrise' };
  }
  if (t.includes('sunset') || t.includes('dusk') || t.includes('evening')) {
    return { type: 'WORLD_MODIFY', property: 'time', value: 'sunset' };
  }

  // Despawn all
  if (
    (t.includes('remove') || t.includes('despawn') || t.includes('delete') || t.includes('clear')) &&
    t.includes('all')
  ) {
    return { type: 'DESPAWN_ENTITY', all: true };
  }

  // Build structure commands
  if (t.includes('build') || t.includes('create') || t.includes('construct') || t.includes('place')) {
    for (const structType of STRUCTURE_KEYWORDS) {
      if (t.includes(structType)) {
        return {
          type: 'BUILD_STRUCTURE',
          structureType: structType,
          position: extractLocation(t),
          name: structType.charAt(0).toUpperCase() + structType.slice(1),
        };
      }
    }
    if (t.includes('cottage')) {
      return {
        type: 'BUILD_STRUCTURE',
        structureType: 'house',
        position: extractLocation(t),
        name: 'Cozy Cottage',
      };
    }
  }

  // Destroy Bridge / Structure command
  if (
    (t.includes('destroy') || t.includes('break') || t.includes('collapse') || t.includes('remove')) &&
    t.includes('bridge')
  ) {
    return { type: 'DESPAWN_ENTITY', entityName: 'bridge' };
  }

  // Make soldiers / raiders retreat or flee
  if (
    t.includes('retreat') ||
    t.includes('flee') ||
    t.includes('fall back') ||
    t.includes('withdraw') ||
    t.includes('run away')
  ) {
    let name = 'soldiers';
    if (t.includes('shadowfang')) name = 'shadowfang';
    else if (t.includes('raider')) name = 'raider';
    else if (t.includes('vorn')) name = 'vorn';
    return { type: 'INTERACT_ENTITY', action: 'retreat', entityName: name };
  }

  // M3: Help / Attack named entity (fallback)
  // Patterns: "help Rowan", "aid the king", "protect Aldric"
  //           "attack Vorn", "strike the guard", "hurt Korg"
  const HELP_VERBS = ['help', 'aid', 'heal', 'protect', 'save', 'assist'];
  const ATTACK_VERBS = ['attack', 'strike', 'hurt', 'hit', 'fight', 'wound'];
  const KNOWN_NAMES = [
    'rowan', 'elspeth', 'aldric', 'gareth', 'vanguard',
    'vorn', 'korg', 'legionnaire', 'miller', 'king', 'knight',
  ];

  for (const verb of HELP_VERBS) {
    if (t.includes(verb)) {
      for (const name of KNOWN_NAMES) {
        if (t.includes(name)) {
          return { type: 'INTERACT_ENTITY', action: 'help', entityName: name } as InteractEntityCommand;
        }
      }
    }
  }

  for (const verb of ATTACK_VERBS) {
    if (t.includes(verb)) {
      for (const name of KNOWN_NAMES) {
        if (t.includes(name)) {
          return { type: 'INTERACT_ENTITY', action: 'attack', entityName: name } as InteractEntityCommand;
        }
      }
    }
  }

  // Spawn entity
  for (const entityType of ENTITY_KEYWORDS) {
    if (t.includes(entityType)) {
      return {
        type: 'SPAWN_ENTITY',
        entityType,
        position: extractLocation(t),
        name: pickName(entityType),
      };
    }
  }

  return null;
}


// ─── Public API ───────────────────────────────────────────────

export async function parseVoiceCommand(
  transcript: string,
  entities: Record<string, { id: string; name: string; type: string }>
): Promise<GameCommand | null> {
  const entityContext = Object.values(entities)
    .map((e) => `id="${e.id}" name="${e.name}" type=${e.type}`)
    .join('\n');

  if (getApiKey()) {
    try {
      return await callGemini(transcript, entityContext);
    } catch (err) {
      console.warn('[CommandParser] Gemini failed, using fallback:', err);
    }
  } else {
    console.info('[CommandParser] Using keyword fallback');
  }

  return fallbackParse(transcript);
}
