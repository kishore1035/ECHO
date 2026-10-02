import { useWorldStore } from '../core/WorldState';
import type { WorldModifyCommand, WeatherType } from '../core/types';
import { TimelineSystem } from './TimelineSystem';

export function handleWorldModify(cmd: WorldModifyCommand): void {
  const store = useWorldStore.getState();

  if (cmd.property === 'weather') {
    const val = cmd.value.toLowerCase();
    let type: WeatherType = 'clear';

    if (val.includes('rain')) type = 'rain';
    else if (val.includes('storm') || val.includes('thunder')) type = 'storm';
    else if (val.includes('fog') || val.includes('mist')) type = 'fog';
    else if (val.includes('clear') || val.includes('sun')) type = 'clear';

    store.setWeather({ type, intensity: 1 });
    console.log('[WorldModifySystem] Weather set to', type);
  } else if (cmd.property === 'time') {
    const val = cmd.value.toLowerCase();
    let targetHour = 12;

    if (val.includes('night') || val.includes('midnight') || val.includes('dark')) {
      targetHour = 0;
    } else if (val.includes('dawn') || val.includes('sunrise') || val.includes('morning')) {
      targetHour = 6.5;
    } else if (val.includes('noon') || val.includes('day') || val.includes('midday')) {
      targetHour = 12;
    } else if (val.includes('dusk') || val.includes('sunset') || val.includes('evening')) {
      targetHour = 18.5;
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) targetHour = num % 24;
    }

    store.setTime({ hours: targetHour });
    console.log('[WorldModifySystem] Time set to hour', targetHour);
  }

  // M4: Record environment checkpoint
  TimelineSystem.createCheckpoint({
    name: cmd.property === 'weather' ? `Weather: ${cmd.value.toUpperCase()}` : `Time: ${cmd.value.toUpperCase()}`,
    description: `Player shifted ${cmd.property} to "${cmd.value}".`,
    significance: 'command',
  });
}
