import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Card, Editor, makeCard, makeHass, stateObj, items, cleanup, document, window } from './helpers/env.mjs';

afterEach(cleanup);

const entry = () => window.customCards.find((c) => c.type === 'multi-status-indicator-card');

describe('card picker', () => {
  test('getEntitySuggestion suggests indicator domains only', () => {
    const hass = makeHass({ 'switch.a': 'on', 'sensor.t': '20' });
    assert.deepEqual(entry().getEntitySuggestion(hass, 'switch.a'), {
      config: { type: 'custom:multi-status-indicator-card', items: [{ entity: 'switch.a' }] },
    });
    assert.equal(entry().getEntitySuggestion(hass, 'sensor.t'), null);
    assert.equal(entry().getEntitySuggestion(hass, 'switch.missing'), null);
  });

  test('getStubConfig picks up to 3 status entities from hass', () => {
    const hass = makeHass({ 'sensor.t': '1', 'switch.a': 'on', 'light.b': 'on', 'binary_sensor.c': 'off', 'input_boolean.d': 'on' });
    assert.deepEqual(Card.getStubConfig(hass), { columns: 3, items: [{ entity: 'switch.a' }, { entity: 'light.b' }, { entity: 'binary_sensor.c' }] });
  });

  test('getStubConfig without hass returns a placeholder item', () => {
    assert.deepEqual(Card.getStubConfig(), { columns: 3, items: [{ entity: 'switch.example', name: 'Example' }] });
  });

  test('getConfigElement returns the editor', () => {
    assert.ok(Card.getConfigElement() instanceof Editor);
  });
});

describe('lifecycle', () => {
  test('setConfig on a connected card re-renders', () => {
    const card = makeCard({ items: [{ entity: 'switch.a' }] }, makeHass({ 'switch.a': 'on', 'switch.b': 'on' }));
    card.setConfig({ items: [{ entity: 'switch.a' }, { entity: 'switch.b' }] });
    assert.equal(items(card).length, 2);
  });

  test('setConfig on a connected card without hass renders nothing yet', () => {
    const card = document.createElement('multi-status-indicator-card');
    document.body.appendChild(card);
    card.setConfig({ items: [{ entity: 'switch.a' }] });
    assert.equal(items(card).length, 0);
  });

  test('hass before config, or before connecting, does not render', () => {
    const card = document.createElement('multi-status-indicator-card');
    card.hass = makeHass({ 'switch.a': 'on' });
    card.setConfig({ items: [{ entity: 'switch.a' }] });
    card.hass = makeHass({ 'switch.a': 'off' });
    assert.equal(card.querySelectorAll('ha-card').length, 0);
    document.body.appendChild(card);
    assert.equal(items(card).length, 1);
  });

  test('reconnecting re-renders without adding a second ha-card', () => {
    const card = makeCard({ items: [{ entity: 'switch.a' }] }, makeHass({ 'switch.a': 'on' }));
    card.remove();
    document.body.appendChild(card);
    assert.equal(card.querySelectorAll('ha-card').length, 1);
    assert.equal(items(card).length, 1);
  });

  test('re-renders only when a configured entity changes', () => {
    const hass = makeHass({ 'switch.a': 'on', 'switch.other': 'on' });
    const card = makeCard({ items: [{ entity: 'switch.a' }, null] }, hass);
    const before = items(card)[0];
    card.hass = { ...hass, states: { ...hass.states, 'switch.other': stateObj('off') } };
    assert.ok(items(card)[0] === before, 'unrelated change re-rendered');
    card.hass = { ...hass, states: { ...hass.states, 'switch.a': stateObj('off') } };
    assert.ok(items(card)[0] !== before, 'watched change did not re-render');
  });

  test('a config without items shows the empty message, also on later renders', () => {
    const hass = makeHass({ 'switch.a': 'on' });
    const card = makeCard({}, hass);
    card.setConfig({});
    assert.match(card.textContent, /Add entities to display/);
    card.hass = { ...hass, states: {} };
    assert.equal(card.querySelectorAll('.msic-container').length, 1);
  });

  test('_render is a no-op before the card is set up', () => {
    const card = document.createElement('multi-status-indicator-card');
    card._render();
    card._config = { items: [] };
    card._render();
    card._hass = makeHass();
    card._render();
    assert.equal(card.childElementCount, 0);
  });

  test('getGridOptions and getCardSize before setConfig', () => {
    const card = document.createElement('multi-status-indicator-card');
    assert.deepEqual(card.getGridOptions(), { rows: 'auto', columns: 6, min_columns: 3 });
    assert.equal(card.getCardSize(), 1);
  });
});

describe('item rendering options', () => {
  test('per-item show_last_changed overrides the card setting both ways', () => {
    const card = makeCard(
      { show_last_changed: false, items: [{ entity: 'switch.a', show_last_changed: true }, { entity: 'switch.b' }] },
      makeHass({ 'switch.a': 'on', 'switch.b': 'on' }),
    );
    const [shown, hidden] = items(card);
    assert.equal(shown.querySelectorAll('ha-relative-time').length, 1);
    assert.equal(hidden.querySelectorAll('ha-relative-time').length, 0);
    assert.equal(hidden.querySelector('.msic-time').getAttribute('style'), 'visibility:hidden');
  });

  test('relative-time elements get hass and the last_changed timestamp', () => {
    const hass = makeHass({ 'switch.a': 'on' });
    const card = makeCard({ items: [{ entity: 'switch.a' }] }, hass);
    const rt = card.querySelector('ha-relative-time');
    assert.ok(rt.hass === hass, 'hass not set');
    assert.equal(rt.datetime, hass.states['switch.a'].last_changed);
  });

  test('a state without last_changed renders an empty timestamp', () => {
    const card = makeCard({ items: [{ entity: 'switch.a' }] }, makeHass({ 'switch.a': { state: 'on', attributes: {} } }));
    assert.equal(card.querySelector('ha-relative-time').dataset.datetime, '');
  });

  test('name_position above puts the name first; custom icons, colors and title apply', () => {
    const card = makeCard(
      { title: 'Home', name_position: 'above', color_on: '#0f0', items: [
        { entity: 'switch.a', icon_on: 'mdi:power', color_on: '#123456' },
        { entity: 'switch.b', icon_off: 'mdi:power-off', color_off: '#654321' },
        { entity: 'switch.c' },
      ] },
      makeHass({ 'switch.a': 'on', 'switch.b': 'off', 'switch.c': 'on' }),
    );
    assert.equal(card.querySelector('.msic-title').textContent, 'Home');
    const [a, b, c] = items(card);
    assert.equal(a.firstElementChild.className, 'msic-name');
    assert.equal(a.querySelector('ha-icon').getAttribute('icon'), 'mdi:power');
    assert.match(a.querySelector('ha-icon').getAttribute('style'), /color:#123456/);
    assert.equal(b.querySelector('ha-icon').getAttribute('icon'), 'mdi:power-off');
    assert.match(b.querySelector('ha-icon').getAttribute('style'), /color:#654321/);
    assert.match(c.querySelector('ha-icon').getAttribute('style'), /color:#0f0/);
  });

  test('ON rules per domain', () => {
    const cases = {
      'cover.open': ['open', {}, true],
      'cover.part': ['closed', { current_position: 40 }, true],
      'cover.shut': ['closed', {}, false],
      'climate.heat': ['heat', {}, true],
      'climate.off': ['off', {}, false],
      'lock.u': ['unlocked', {}, true],
      'lock.l': ['locked', {}, false],
      'person.home': ['home', {}, true],
      'device_tracker.away': ['not_home', {}, false],
      'media_player.on': ['on', {}, true],
      'binary_sensor.on': ['on', {}, true],
      'light.off': ['off', {}, false],
    };
    const states = Object.fromEntries(Object.entries(cases).map(([id, [s, a]]) => [id, stateObj(s, a)]));
    const card = makeCard({ items: Object.keys(cases).map((entity) => ({ entity })) }, makeHass(states));
    const onIcon = (el) => el.querySelector('ha-icon').getAttribute('icon') === 'mdi:toggle-switch';
    const got = Object.fromEntries(items(card).map((el) => [el.dataset.entity, onIcon(el)]));
    assert.deepEqual(got, Object.fromEntries(Object.entries(cases).map(([id, [, , on]]) => [id, on])));
  });
});
