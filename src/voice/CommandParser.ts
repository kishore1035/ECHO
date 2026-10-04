// ============================================================
// COMMAND PARSER — Voice transcript → typed GameCommand
// Uses Gemini API (structured JSON output) with a keyword fallback
// so the game works instantly and reliably with or without API key.
// ============================================================

import type { GameCommand, EntityType, StructureType, Vec3, InteractEntityCommand } from '../core/types';
import { NAMED_LOCATIONS, getTerrainHeight } from '../core/terrain';
import { useWorldStore } from '../core/WorldState';

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

1. Player actions:
{"command":"JUMP"}
{"command":"ATTACK"}
{"command":"TALK","entityName":"Rowan"}

2. Spawn character or creature:
{"command":"SPAWN_ENTITY","entityType":"deer","position":{"x":0,"y":0,"z":0},"name":"Fleetfoot"}

3. Build structure:
{"command":"BUILD_STRUCTURE","structureType":"tower","position":{"x":0,"y":0,"z":0},"name":"Watchtower"}

4. Change weather:
{"command":"WORLD_MODIFY","property":"weather","value":"rain"} (values: clear, rain, storm, fog)

5. Change time of day:
{"command":"WORLD_MODIFY","property":"time","value":"night"} (values: day, night, noon, sunrise, sunset, midnight)

6. Change relationship between kingdoms (peace or war):
{"command":"SET_FACTION_RELATION","factionA":"suncrest","factionB":"shadowfang","relation":"allied"}

7. Despawn entity:
{"command":"DESPAWN_ENTITY","entityName":"Ignaroth","all":false}

8. Interact with a named character (help, attack, shield, warm, guide, freeze, retreat):
{"command":"INTERACT_ENTITY","action":"help","entityName":"Rowan"}
{"command":"INTERACT_ENTITY","action":"shield","entityName":"Rowan"}
{"command":"INTERACT_ENTITY","action":"warm","entityName":"Rowan"}
{"command":"INTERACT_ENTITY","action":"repair","entityName":"bridge"}
{"command":"INTERACT_ENTITY","action":"retreat","entityName":"soldiers"}

9. Rewind reality / time:
{"command":"REWIND"}

10. Switch alternate reality / timeline branch:
{"command":"SWITCH_BRANCH","branchIdOrName":"Beta"}

11. Save checkpoint / bookmark reality:
{"command":"CREATE_CHECKPOINT","name":"Before the Siege"}

IMPORTANT:
- Return ONLY valid JSON. No conversational text.`;
}

// ─── Gemini API call ──────────────────────────────────────────

async function callGemini(
  transcript: string,
  entityContext: string
): Promise<GameCommand | null> {
  const url = getGeminiUrl();
  if (!url) return null;

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
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    return convertToCommand(parsed);
  } catch (e) {
    console.warn('[CommandParser] Could not parse Gemini JSON:', e);
    return null;
  }
}

// ─── Convert raw JSON → typed GameCommand ─────────────────────

function resolvePosition(raw: any): Vec3 {
  const store = useWorldStore.getState();
  const player = store.player;
  const pPos = player?.position || { x: 0, y: 0, z: 0 };
  const pRot = player?.rotationY || 0;

  // If raw is empty, "here", non-object, or 0,0 without explicit position:
  // Spawn 4.5m in front of player in direction they are facing!
  const isDefaultOrZero =
    !raw ||
    raw === 'here' ||
    typeof raw !== 'object' ||
    ((raw.x === 0 || raw.x === undefined) && (raw.z === 0 || raw.z === undefined));

  if (isDefaultOrZero) {
    const fwdX = Math.sin(pRot);
    const fwdZ = Math.cos(pRot);
    const spawnX = pPos.x + fwdX * 4.5;
    const spawnZ = pPos.z + fwdZ * 4.5;
    return {
      x: spawnX,
      y: getTerrainHeight(spawnX, spawnZ) + 0.05,
      z: spawnZ,
    };
  }

  const x = Number(raw.x ?? 0);
  const z = Number(raw.z ?? 0);
  return { x, y: getTerrainHeight(x, z) + 0.05, z };
}

function convertToCommand(obj: Record<string, any>): GameCommand | null {
  if (!obj || typeof obj !== 'object') return null;

  const rawCmd = String(obj.command || '').toUpperCase();
  const params = (obj.parameters && typeof obj.parameters === 'object' ? obj.parameters : {}) as Record<string, any>;

  // 1. Direct Player Action: JUMP
  if (rawCmd === 'JUMP' || params.action === 'jump' || obj.action === 'jump') {
    return { type: 'JUMP' };
  }

  // 2. Direct Player Action: ATTACK
  if (rawCmd === 'ATTACK') {
    return { type: 'ATTACK' };
  }

  // 3. Direct Player Action: TALK
  if (
    rawCmd === 'TALK' ||
    params.action === 'talk' ||
    obj.action === 'talk' ||
    obj.action === 'speak' ||
    obj.action === 'commune'
  ) {
    const entityName = String(
      obj.entityName || obj.target || params.target || params.entity || params.entityName || ''
    ).trim();
    return { type: 'TALK', entityName: entityName || undefined };
  }

  // 4. SPAWN_ENTITY
  if (rawCmd === 'SPAWN_ENTITY' || rawCmd === 'SPAWN') {
    const rawType = String(
      obj.entityType ||
      obj.entity ||
      params.entity ||
      params.entityType ||
      params.type ||
      'wolf'
    ).toLowerCase();

    let entityType: EntityType = 'wolf';
    for (const kw of ENTITY_KEYWORDS) {
      if (rawType.includes(kw)) {
        entityType = kw;
        break;
      }
    }
    for (const st of STRUCTURE_KEYWORDS) {
      if (rawType.includes(st)) {
        entityType = st;
        break;
      }
    }

    const pos = resolvePosition(obj.position || params.position);
    const name = String(obj.name || params.name || pickName(entityType));
    return {
      type: 'SPAWN_ENTITY',
      entityType,
      position: pos,
      name,
    };
  }

  // 5. BUILD_STRUCTURE
  if (rawCmd === 'BUILD_STRUCTURE' || rawCmd === 'BUILD') {
    const rawType = String(
      obj.structureType ||
      obj.structure ||
      params.structure ||
      params.structureType ||
      params.type ||
      'house'
    ).toLowerCase();

    let structureType: StructureType = 'house';
    for (const st of STRUCTURE_KEYWORDS) {
      if (rawType.includes(st)) {
        structureType = st;
        break;
      }
    }

    const pos = resolvePosition(obj.position || params.position);
    const name = String(
      obj.name || params.name || (structureType.charAt(0).toUpperCase() + structureType.slice(1))
    );
    return {
      type: 'BUILD_STRUCTURE',
      structureType,
      position: pos,
      name,
    };
  }

  // 6. WORLD_MODIFY
  if (rawCmd === 'WORLD_MODIFY' || rawCmd === 'WEATHER' || rawCmd === 'TIME') {
    const prop = String(obj.property || params.property || '').toLowerCase();
    const val = String(
      obj.value || params.value || params.type || obj.weather || obj.time || ''
    ).toLowerCase();

    const isWeather =
      prop === 'weather' ||
      params.action === 'weather' ||
      val.includes('rain') ||
      val.includes('storm') ||
      val.includes('fog') ||
      val.includes('clear') ||
      val.includes('sun');

    if (isWeather) {
      let weatherVal = 'clear';
      if (val.includes('rain')) weatherVal = 'rain';
      else if (val.includes('storm')) weatherVal = 'storm';
      else if (val.includes('fog')) weatherVal = 'fog';
      return { type: 'WORLD_MODIFY', property: 'weather', value: weatherVal };
    }

    let timeVal = 'noon';
    if (val.includes('night') || val.includes('midnight') || val.includes('dark')) timeVal = 'night';
    else if (val.includes('sunset') || val.includes('dusk')) timeVal = 'sunset';
    else if (val.includes('sunrise') || val.includes('dawn') || val.includes('morning')) timeVal = 'sunrise';
    return { type: 'WORLD_MODIFY', property: 'time', value: timeVal };
  }

  // 7. SET_FACTION_RELATION
  if (rawCmd === 'SET_FACTION_RELATION') {
    return {
      type: 'SET_FACTION_RELATION',
      factionA: String(obj.factionA || params.factionA || 'suncrest').toLowerCase(),
      factionB: String(obj.factionB || params.factionB || 'shadowfang').toLowerCase(),
      relation: String(obj.relation || params.relation) === 'hostile' ? 'hostile' : 'allied',
    };
  }

  // 8. DESPAWN_ENTITY
  if (rawCmd === 'DESPAWN_ENTITY') {
    return {
      type: 'DESPAWN_ENTITY',
      entityId: (obj.entityId as string) || (params.entityId as string) || undefined,
      entityName:
        (obj.entityName as string) || (params.entityName as string) || (obj.target as string) || undefined,
      all: Boolean(obj.all || params.all),
    };
  }

  // 9. INTERACT_ENTITY
  if (rawCmd === 'INTERACT_ENTITY') {
    const rawAction = String(obj.action || params.action || '').toLowerCase();
    const entityName = String(
      obj.entityName || obj.target || obj.entity || params.target || params.entity || params.entityName || ''
    ).trim();

    if (rawAction === 'attack' && !entityName) {
      return { type: 'ATTACK' };
    }
    if (rawAction === 'talk' || rawAction === 'speak' || rawAction === 'commune') {
      return { type: 'TALK', entityName: entityName || undefined };
    }

    const action =
      rawAction === 'attack' ? 'attack' :
      rawAction === 'shield' || rawAction === 'defend' || rawAction === 'protect' ? 'shield' :
      rawAction === 'retreat' || rawAction === 'flee' ? 'retreat' :
      rawAction === 'warm' || rawAction === 'heal' ? 'warm' :
      rawAction === 'guide' ? 'guide' :
      rawAction === 'freeze' || rawAction === 'halt' ? 'freeze' : 'help';

    return {
      type: 'INTERACT_ENTITY',
      action,
      entityName: entityName || 'Rowan',
    };
  }

  // 10. REWIND
  if (rawCmd === 'REWIND') {
    return {
      type: 'REWIND',
      target: String(obj.target || params.target || 'last'),
    };
  }

  // 11. SWITCH_BRANCH
  if (rawCmd === 'SWITCH_BRANCH') {
    return {
      type: 'SWITCH_BRANCH',
      branchIdOrName: String(obj.branchIdOrName || params.branchIdOrName || 'Prime'),
    };
  }

  // 12. CREATE_CHECKPOINT
  if (rawCmd === 'CREATE_CHECKPOINT') {
    return {
      type: 'CREATE_CHECKPOINT',
      name: String(obj.name || params.name || 'Voice Bookmark'),
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
  for (const [locName, { x, z }] of Object.entries(NAMED_LOCATIONS)) {
    if (t.includes(locName)) {
      return { x, y: getTerrainHeight(x, z) + 0.05, z };
    }
  }

  // Default: 4.5m directly in front of avatar
  const store = useWorldStore.getState();
  const player = store.player;
  const pPos = player?.position || { x: 0, y: 0, z: 0 };
  const pRot = player?.rotationY || 0;
  const fwdX = Math.sin(pRot);
  const fwdZ = Math.cos(pRot);
  const spawnX = pPos.x + fwdX * 4.5;
  const spawnZ = pPos.z + fwdZ * 4.5;
  return {
    x: spawnX,
    y: getTerrainHeight(spawnX, spawnZ) + 0.05,
    z: spawnZ,
  };
}

function fallbackParse(transcript: string): GameCommand | null {
  const t = transcript.toLowerCase().trim();

  // ── 1. Player Action Commands ─────────────────────────────
  if (t === 'jump' || t.includes('jump') || t.includes('leap') || t.includes('hop')) {
    return { type: 'JUMP' };
  }

  // Direct strike / attack action
  if (
    t === 'attack' ||
    t === 'strike' ||
    t === 'swing' ||
    t === 'slash' ||
    t === 'fight' ||
    t.includes('swing sword') ||
    t.includes('use sword')
  ) {
    return { type: 'ATTACK' };
  }

  // Direct talk / dialogue / interact
  if (
    t.startsWith('talk') ||
    t.startsWith('speak') ||
    t.startsWith('chat') ||
    t.includes('commune') ||
    t === 'interact' ||
    t.includes('talk to') ||
    t.includes('speak to')
  ) {
    let name: string | undefined = undefined;
    if (t.includes('rowan')) name = 'rowan';
    else if (t.includes('mira')) name = 'mira';
    else if (t.includes('aldric')) name = 'aldric';
    else if (t.includes('vorn')) name = 'vorn';
    else if (t.includes('tree') || t.includes('anchor')) name = 'tree';
    return { type: 'TALK', entityName: name };
  }

  // ── 2. M4 Timeline & Reality Commands ─────────────────────
  if (
    t.includes('save checkpoint') ||
    t.includes('create checkpoint') ||
    t.includes('make checkpoint') ||
    t.includes('bookmark') ||
    t.includes('save reality')
  ) {
    return { type: 'CREATE_CHECKPOINT', name: 'Voice Bookmark' };
  }

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

  if (
    t.includes('rewind') ||
    t.includes('go back') ||
    t.includes('turn back time') ||
    t.includes('time travel') ||
    t.includes('undo') ||
    t.includes('restore')
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

  // ── 3. Faction Commands ───────────────────────────────────
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

  // ── 4. Weather & Time Commands ────────────────────────────
  if (t.includes('rain') || t.includes('raining')) {
    return { type: 'WORLD_MODIFY', property: 'weather', value: 'rain' };
  }
  if (t.includes('storm') || t.includes('thunder') || t.includes('lightning')) {
    return { type: 'WORLD_MODIFY', property: 'weather', value: 'storm' };
  }
  if (t.includes('fog') || t.includes('foggy') || t.includes('mist')) {
    return { type: 'WORLD_MODIFY', property: 'weather', value: 'fog' };
  }
  if (t.includes('clear') || t.includes('sunny') || t.includes('sunshine') || t.includes('clear skies')) {
    return { type: 'WORLD_MODIFY', property: 'weather', value: 'clear' };
  }

  if (t.includes('night') || t.includes('midnight') || t.includes('darkness')) {
    return { type: 'WORLD_MODIFY', property: 'time', value: 'night' };
  }
  if (t.includes('day') || t.includes('noon') || t.includes('daylight') || t.includes('midday')) {
    return { type: 'WORLD_MODIFY', property: 'time', value: 'noon' };
  }
  if (t.includes('sunrise') || t.includes('dawn') || t.includes('morning')) {
    return { type: 'WORLD_MODIFY', property: 'time', value: 'sunrise' };
  }
  if (t.includes('sunset') || t.includes('dusk') || t.includes('evening')) {
    return { type: 'WORLD_MODIFY', property: 'time', value: 'sunset' };
  }

  // ── 5. Contextual Entity Interactions ─────────────────────
  // Shield / Protect / Defend
  if (
    t.includes('shield') ||
    t.includes('barrier') ||
    t.includes('defend') ||
    t.includes('protect') ||
    t.includes('guard rowan')
  ) {
    return { type: 'INTERACT_ENTITY', action: 'shield', entityName: 'rowan' };
  }

  // Warm / Heal / Aid
  if (
    t.includes('warm') ||
    t.includes('heal') ||
    t.includes('soothe') ||
    t.includes('aid rowan') ||
    t.includes('help rowan') ||
    t === 'aid' ||
    t === 'help' ||
    t === 'warm'
  ) {
    return { type: 'INTERACT_ENTITY', action: 'warm', entityName: 'rowan' };
  }

  // Guide
  if (t.includes('guide') || t.includes('lead') || t === 'guide') {
    return { type: 'INTERACT_ENTITY', action: 'guide', entityName: 'rowan' };
  }

  // Freeze / Halt
  if (t.includes('freeze') || t.includes('halt') || t.includes('stop soldiers') || t === 'freeze') {
    return { type: 'INTERACT_ENTITY', action: 'freeze', entityName: 'soldiers' };
  }

  // Retreat / Flee
  if (
    t.includes('retreat') ||
    t.includes('flee') ||
    t.includes('fall back') ||
    t.includes('withdraw') ||
    t.includes('run away')
  ) {
    return { type: 'INTERACT_ENTITY', action: 'retreat', entityName: 'soldiers' };
  }

  // Fix / Repair / Rebuild Bridge
  if (
    (t.includes('fix') ||
      t.includes('repair') ||
      t.includes('rebuild') ||
      t.includes('mend') ||
      t.includes('restore') ||
      t.includes('broken') ||
      (t.includes('build') && t.includes('bridge'))) &&
    (t.includes('bridge') || t.includes('crossing') || t.includes('span'))
  ) {
    return {
      type: 'BUILD_STRUCTURE',
      structureType: 'bridge',
      position: { x: -8, y: 0.45, z: 5 },
      name: 'The River Bridge',
    };
  }

  if (t.includes('bridge is broken') || t.includes('broken bridge')) {
    return {
      type: 'BUILD_STRUCTURE',
      structureType: 'bridge',
      position: { x: -8, y: 0.45, z: 5 },
      name: 'The River Bridge',
    };
  }

  // Destroy Bridge
  if (
    (t.includes('destroy') || t.includes('break') || t.includes('collapse') || t.includes('remove')) &&
    t.includes('bridge')
  ) {
    return { type: 'DESPAWN_ENTITY', entityName: 'bridge' };
  }

  // Despawn all
  if (
    (t.includes('remove') || t.includes('despawn') || t.includes('delete') || t.includes('clear')) &&
    t.includes('all')
  ) {
    return { type: 'DESPAWN_ENTITY', all: true };
  }

  // General Help / Attack named entity
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

  // ── 6. Build Structure Commands ───────────────────────────
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

  // ── 7. Spawn Entity Commands ──────────────────────────────
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

  // Fallback structure keywords without "build" verb (e.g. "a tower here")
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

  return null;
}

// ─── Public API ───────────────────────────────────────────────

export async function parseVoiceCommand(
  transcript: string,
  entities: Record<string, { id: string; name: string; type: string }> = {}
): Promise<GameCommand | null> {
  const t = transcript.trim().toLowerCase();

  // Instant fast-path for direct single-word or short action verbs (0ms delay!)
  if (t === 'jump' || t === 'leap' || t === 'hop') {
    return { type: 'JUMP' };
  }
  if (t === 'attack' || t === 'strike' || t === 'swing' || t === 'slash' || t === 'fight') {
    return { type: 'ATTACK' };
  }
  if (t === 'talk' || t === 'speak' || t === 'interact' || t === 'commune') {
    return { type: 'TALK' };
  }
  if (t === 'rain' || t === 'make it rain') {
    return { type: 'WORLD_MODIFY', property: 'weather', value: 'rain' };
  }
  if (t === 'clear' || t === 'clear skies' || t === 'sunny') {
    return { type: 'WORLD_MODIFY', property: 'weather', value: 'clear' };
  }
  if (t === 'night' || t === 'midnight') {
    return { type: 'WORLD_MODIFY', property: 'time', value: 'night' };
  }
  if (t === 'day' || t === 'noon' || t === 'morning') {
    return { type: 'WORLD_MODIFY', property: 'time', value: 'noon' };
  }

  const entityContext = Object.values(entities || {})
    .map((e) => `id="${e.id}" name="${e.name}" type=${e.type}`)
    .join('\n');

  if (getApiKey()) {
    try {
      const geminiCmd = await callGemini(transcript, entityContext);
      if (geminiCmd) return geminiCmd;
    } catch (err) {
      console.warn('[CommandParser] Gemini failed, falling back to local parser:', err);
    }
  }

  // Robust local keyword fallback
  return fallbackParse(transcript);
}
