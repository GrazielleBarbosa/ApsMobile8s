import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapAirQuality,
  buildEnvironmentalAlerts,
} from '../services/environmentAlerts.js';

test('mapAirQuality retorna rótulo correto', () => {
  assert.equal(mapAirQuality(3).label, 'Moderada');
});

test('buildEnvironmentalAlerts detecta poluição elevada', () => {
  const alerts = buildEnvironmentalAlerts({
    current: { main: { humidity: 50, temp_max: 25, temp_min: 20 }, wind: { speed: 3 } },
    forecastList: [],
    airQuality: { index: 4, label: 'Ruim' },
  });
  assert.ok(alerts.some((a) => a.type === 'poluicao_ar'));
});

test('buildEnvironmentalAlerts detecta risco de alagamento', () => {
  const alerts = buildEnvironmentalAlerts({
    current: { main: { humidity: 80, temp_max: 22, temp_min: 20 }, wind: { speed: 2 } },
    forecastList: [{ weather: [{ main: 'Rain' }] }],
    airQuality: { index: 1, label: 'Boa' },
  });
  assert.ok(alerts.some((a) => a.type === 'alagamento'));
});
