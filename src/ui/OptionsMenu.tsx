// ============================================================
// OPTIONS MENU — Full In-Game & Title Preferences
// Keyboard (Arrows/WASD/Esc) + Mouse Controls
// ============================================================

import { useEffect, useState } from 'react';
import ControlsSettings from './ControlsSettings';
import {
  useSettingsStore,
  type GraphicsQuality,
  type ShadowQuality,
  type EffectsQuality,
  type VoiceSensitivity,
  type UIScale,
} from '../core/settingsStore';
import { playMenuHover, playMenuSelect, playMenuBack } from '../core/soundFX';

interface OptionsMenuProps {
  onClose: () => void;
  initialTab?: 'preferences' | 'controls';
}

export default function OptionsMenu({ onClose, initialTab = 'preferences' }: OptionsMenuProps) {
  const settings = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'preferences' | 'controls'>(initialTab);
  const [selectedRow, setSelectedRow] = useState(0);

  const OPTIONS_ROWS = [
    'graphicsQuality',
    'shadows',
    'effects',
    'timeScale',
    'masterVolume',
    'musicVolume',
    'sfxVolume',
    'cameraSensitivity',
    'voiceSensitivity',
    'subtitles',
    'uiScale',
  ] as const;

  // Keyboard navigation
  useEffect(() => {
    if (activeTab === 'controls') return; // Handled by ControlsSettings

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedRow((i) => {
          const next = (i - 1 + OPTIONS_ROWS.length) % OPTIONS_ROWS.length;
          playMenuHover();
          return next;
        });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedRow((i) => {
          const next = (i + 1) % OPTIONS_ROWS.length;
          playMenuHover();
          return next;
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        adjustCurrentOption(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'Enter') {
        e.preventDefault();
        adjustCurrentOption(1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        playMenuBack();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedRow, settings, activeTab]);

  const adjustCurrentOption = (direction: -1 | 1) => {
    playMenuSelect();
    const row = OPTIONS_ROWS[selectedRow];

    switch (row) {
      case 'graphicsQuality': {
        const list: GraphicsQuality[] = ['low', 'medium', 'high', 'ultra'];
        const curr = list.indexOf(settings.graphicsQuality);
        const next = list[(curr + direction + list.length) % list.length];
        settings.updateSettings({ graphicsQuality: next });
        break;
      }
      case 'shadows': {
        const list: ShadowQuality[] = ['off', 'low', 'high'];
        const curr = list.indexOf(settings.shadows);
        const next = list[(curr + direction + list.length) % list.length];
        settings.updateSettings({ shadows: next });
        break;
      }
      case 'effects': {
        const list: EffectsQuality[] = ['low', 'high'];
        const curr = list.indexOf(settings.effects);
        const next = list[(curr + direction + list.length) % list.length];
        settings.updateSettings({ effects: next });
        break;
      }
      case 'timeScale': {
        const list: (0.5 | 1.0 | 2.0)[] = [0.5, 1.0, 2.0];
        const curr = list.indexOf(settings.timeScale ?? 1.0);
        const next = list[(curr + direction + list.length) % list.length];
        settings.updateSettings({ timeScale: next });
        break;
      }
      case 'masterVolume': {
        const next = Math.max(0, Math.min(100, settings.masterVolume + direction * 5));
        settings.updateSettings({ masterVolume: next });
        break;
      }
      case 'musicVolume': {
        const next = Math.max(0, Math.min(100, settings.musicVolume + direction * 5));
        settings.updateSettings({ musicVolume: next });
        break;
      }
      case 'sfxVolume': {
        const next = Math.max(0, Math.min(100, settings.sfxVolume + direction * 5));
        settings.updateSettings({ sfxVolume: next });
        break;
      }
      case 'cameraSensitivity': {
        const next = Math.max(0.5, Math.min(2.0, parseFloat((settings.cameraSensitivity + direction * 0.1).toFixed(1))));
        settings.updateSettings({ cameraSensitivity: next });
        break;
      }
      case 'voiceSensitivity': {
        const list: VoiceSensitivity[] = ['low', 'medium', 'high'];
        const curr = list.indexOf(settings.voiceSensitivity);
        const next = list[(curr + direction + list.length) % list.length];
        settings.updateSettings({ voiceSensitivity: next });
        break;
      }
      case 'subtitles': {
        settings.updateSettings({ subtitles: !settings.subtitles });
        break;
      }
      case 'uiScale': {
        const list: UIScale[] = ['small', 'normal', 'large'];
        const curr = list.indexOf(settings.uiScale);
        const next = list[(curr + direction + list.length) % list.length];
        settings.updateSettings({ uiScale: next });
        break;
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(6, 10, 16, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: '"Inter", sans-serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 580,
          maxHeight: '90vh',
          background: '#0C1119',
          border: '1px solid #292923',
          borderRadius: 6,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6)',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          color: '#E8E3D8',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.12em', color: '#E8E3D8' }}>
              SETTINGS & CONFIGURATION
            </div>
            <div style={{ fontSize: 11, color: '#77756D', marginTop: 2 }}>
              Fine-tune audiovisual rendering, audio mixes, and controls
            </div>
          </div>
          <button
            onClick={() => {
              playMenuBack();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#77756D',
              cursor: 'pointer',
              fontSize: 18,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Tab Switcher: PREFERENCES / CONTROLS ── */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            borderBottom: '1px solid #292923',
            paddingBottom: 10,
          }}
        >
          <button
            onClick={() => {
              playMenuHover();
              setActiveTab('preferences');
            }}
            style={{
              background: activeTab === 'preferences' ? 'rgba(181, 154, 74, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${activeTab === 'preferences' ? '#B59A4A' : '#292923'}`,
              borderRadius: 3,
              color: activeTab === 'preferences' ? '#B59A4A' : '#77756D',
              padding: '6px 16px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            PREFERENCES
          </button>
          <button
            onClick={() => {
              playMenuHover();
              setActiveTab('controls');
            }}
            style={{
              background: activeTab === 'controls' ? 'rgba(181, 154, 74, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${activeTab === 'controls' ? '#B59A4A' : '#292923'}`,
              borderRadius: 3,
              color: activeTab === 'controls' ? '#B59A4A' : '#77756D',
              padding: '6px 16px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            CONTROLS
          </button>
        </div>

        {/* ── Content View ── */}
        {activeTab === 'controls' ? (
          <div style={{ flex: 1, minHeight: 420, display: 'flex', flexDirection: 'column' }}>
            <ControlsSettings onBack={onClose} />
          </div>
        ) : (
          <>
            {/* Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Graphics Quality */}
              <OptionRow
                label="Graphics Quality"
                hint="Overall procedural LOD & render detail"
                value={settings.graphicsQuality.toUpperCase()}
                isSelected={selectedRow === 0}
                onSelect={() => setSelectedRow(0)}
                onLeft={() => adjustCurrentOption(-1)}
                onRight={() => adjustCurrentOption(1)}
              />

              {/* Shadows */}
              <OptionRow
                label="Shadows"
                hint="PCF soft shadow maps resolution"
                value={settings.shadows.toUpperCase()}
                isSelected={selectedRow === 1}
                onSelect={() => setSelectedRow(1)}
                onLeft={() => adjustCurrentOption(-1)}
                onRight={() => adjustCurrentOption(1)}
              />

              {/* Effects */}
              <OptionRow
                label="Effects"
                hint="Atmospheric dust, rain particles, and fog volumetric"
                value={settings.effects.toUpperCase()}
                isSelected={selectedRow === 2}
                onSelect={() => setSelectedRow(2)}
                onLeft={() => adjustCurrentOption(-1)}
                onRight={() => adjustCurrentOption(1)}
              />

              {/* Time Scale */}
              <OptionRow
                label="Time Scale"
                hint="1.0x = 1 real min / game hr (24 min day). Also 0.5x, 2.0x"
                value={`${settings.timeScale ?? 1.0}x`}
                isSelected={selectedRow === 3}
                onSelect={() => setSelectedRow(3)}
                onLeft={() => adjustCurrentOption(-1)}
                onRight={() => adjustCurrentOption(1)}
              />

              {/* Master Volume */}
              <SliderOptionRow
                label="Master Volume"
                value={settings.masterVolume}
                isSelected={selectedRow === 4}
                onSelect={() => setSelectedRow(4)}
                onChange={(val) => settings.updateSettings({ masterVolume: val })}
              />

              {/* Music Volume */}
              <SliderOptionRow
                label="Music Volume"
                value={settings.musicVolume}
                isSelected={selectedRow === 5}
                onSelect={() => setSelectedRow(5)}
                onChange={(val) => settings.updateSettings({ musicVolume: val })}
              />

              {/* SFX Volume */}
              <SliderOptionRow
                label="SFX Volume"
                value={settings.sfxVolume}
                isSelected={selectedRow === 6}
                onSelect={() => setSelectedRow(6)}
                onChange={(val) => settings.updateSettings({ sfxVolume: val })}
              />

              {/* Camera Sensitivity */}
              <OptionRow
                label="Camera Sensitivity"
                hint="Orbit and mouse look speed multiplier"
                value={`${settings.cameraSensitivity}x`}
                isSelected={selectedRow === 7}
                onSelect={() => setSelectedRow(7)}
                onLeft={() => adjustCurrentOption(-1)}
                onRight={() => adjustCurrentOption(1)}
              />

              {/* Voice Sensitivity */}
              <OptionRow
                label="Voice Sensitivity"
                hint="Speech recognition audio gating threshold"
                value={settings.voiceSensitivity.toUpperCase()}
                isSelected={selectedRow === 8}
                onSelect={() => setSelectedRow(8)}
                onLeft={() => adjustCurrentOption(-1)}
                onRight={() => adjustCurrentOption(1)}
              />

              {/* Subtitles */}
              <OptionRow
                label="Subtitles"
                hint="Display character dialogue barks on HUD"
                value={settings.subtitles ? 'ON' : 'OFF'}
                isSelected={selectedRow === 9}
                onSelect={() => setSelectedRow(9)}
                onLeft={() => adjustCurrentOption(-1)}
                onRight={() => adjustCurrentOption(1)}
              />

              {/* UI Scale */}
              <OptionRow
                label="UI Scale"
                hint="Size of HUD and dialog overlays"
                value={settings.uiScale.toUpperCase()}
                isSelected={selectedRow === 10}
                onSelect={() => setSelectedRow(10)}
                onLeft={() => adjustCurrentOption(-1)}
                onRight={() => adjustCurrentOption(1)}
              />
            </div>

            {/* Footer controls hint & Reset */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 10,
                color: '#77756D',
                borderTop: '1px solid #292923',
                paddingTop: 12,
              }}
            >
              <span>[↑/↓] Navigate • [←/→] Adjust • [ESC] Back</span>
              <button
                onClick={() => {
                  playMenuBack();
                  settings.resetSettings();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#77756D',
                  fontSize: 10,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Reset to Defaults
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: Option Row ───────────────────────────────────

function OptionRow({
  label,
  hint,
  value,
  isSelected,
  onSelect,
  onLeft,
  onRight,
}: {
  label: string;
  hint: string;
  value: string;
  isSelected: boolean;
  onSelect: () => void;
  onLeft: () => void;
  onRight: () => void;
}) {
  return (
    <div
      onMouseEnter={() => {
        onSelect();
        playMenuHover();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: 4,
        background: isSelected ? 'rgba(181, 154, 74, 0.08)' : 'transparent',
        border: `1px solid ${isSelected ? '#B59A4A' : '#292923'}`,
        transition: 'all 0.14s ease',
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#E8E3D8' }}>
          {label}
        </div>
        <div style={{ fontSize: 9, color: '#77756D', marginTop: 1 }}>{hint}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLeft();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid #292923',
            color: '#E8E3D8',
            borderRadius: 3,
            width: 20,
            height: 20,
            cursor: 'pointer',
            fontSize: 10,
          }}
        >
          ‹
        </button>

        <span
          style={{
            minWidth: 64,
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: isSelected ? '#B59A4A' : '#E8E3D8',
            letterSpacing: '0.05em',
          }}
        >
          {value}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRight();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid #292923',
            color: '#E8E3D8',
            borderRadius: 3,
            width: 20,
            height: 20,
            cursor: 'pointer',
            fontSize: 10,
          }}
        >
          ›
        </button>
      </div>
    </div>
  );
}

function SliderOptionRow({
  label,
  value,
  isSelected,
  onSelect,
  onChange,
}: {
  label: string;
  value: number;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (val: number) => void;
}) {
  return (
    <div
      onMouseEnter={() => {
        onSelect();
        playMenuHover();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: 4,
        background: isSelected ? 'rgba(181, 154, 74, 0.08)' : 'transparent',
        border: `1px solid ${isSelected ? '#B59A4A' : '#292923'}`,
        transition: 'all 0.14s ease',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: '#E8E3D8' }}>
        {label}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          style={{
            width: 120,
            accentColor: '#B59A4A',
            cursor: 'pointer',
          }}
        />
        <span
          style={{
            minWidth: 32,
            textAlign: 'right',
            fontSize: 11,
            fontWeight: 700,
            color: isSelected ? '#B59A4A' : '#E8E3D8',
          }}
        >
          {value}%
        </span>
      </div>
    </div>
  );
}
