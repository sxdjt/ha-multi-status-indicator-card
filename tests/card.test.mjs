import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Card, makeCard, makeHass, stateObj, items, cleanup, window } from './helpers/env.mjs';

afterEach(cleanup);

const ITEM_ATTRS = ['class', 'data-entity', 'role', 'tabindex', 'aria-label', 'aria-pressed', 'aria-disabled', 'aria-keyshortcuts', 'title'];
const unexpectedAttrs = (el) => [...el.attributes].map((a) => a.name).filter((n) => !ITEM_ATTRS.includes(n));

describe('registration', () => {
  test('defines the card and editor and adds a card picker entry', () => {
    assert.ok(Card);
    const entry = window.customCards.find((c) => c.type === 'multi-status-indicator-card');
    assert.equal(entry.preview, true);
  });
});

describe('rendering', () => {
  test('applies documented defaults: 3 columns, green/red, 20px icons, 11px names, name below', () => {
    const card = makeCard(
      { items: [{ entity: 'switch.a' }, { entity: 'switch.b' }] },
      makeHass({ 'switch.a': 'on', 'switch.b': 'off' }),
    );
    const grid = card.querySelector('.msic-grid');
    assert.match(grid.getAttribute('style'), /repeat\(3, 1fr\)/);
    assert.match(grid.getAttribute('style'), /font-size: 11px/);
    const [on, off] = items(card).map((i) => i.querySelector('ha-icon'));
    assert.equal(on.getAttribute('icon'), 'mdi:toggle-switch');
    assert.match(on.getAttribute('style'), /color:green;width:20px/);
    assert.equal(off.getAttribute('icon'), 'mdi:toggle-switch-off');
    assert.match(off.getAttribute('style'), /color:red/);
    assert.equal(items(card)[0].firstElementChild.tagName, 'HA-ICON');
  });

  test('shows "Add entities to display" when no item has an entity', () => {
    const card = makeCard({ items: [{ name: 'x' }] });
    assert.match(card.textContent, /Add entities to display/);
  });

  test('missing, unavailable and unknown entities render as unavailable', () => {
    const card = makeCard(
      { items: [{ entity: 'switch.gone' }, { entity: 'switch.u' }, { entity: 'switch.k' }] },
      makeHass({ 'switch.u': 'unavailable', 'switch.k': 'unknown' }),
    );
    for (const item of items(card)) {
      assert.ok(item.classList.contains('msic-unavailable'));
      assert.equal(item.querySelector('.msic-time').textContent, 'Unavailable');
    }
  });

  test('escapes names', () => {
    const card = makeCard({ items: [{ entity: 'switch.a', name: '<b>x</b>' }] }, makeHass({ 'switch.a': 'on' }));
    assert.equal(card.querySelectorAll('b').length, 0, 'name markup was rendered as HTML');
    assert.equal(card.querySelector('.msic-name').textContent, '<b>x</b>');
  });

  // M2 (B4): a numeric 0 name is a valid label
  test('a YAML `name: 0` is shown as "0"', { todo: 'name uses ||, so 0 falls back to the friendly name' }, () => {
    const card = makeCard({ items: [{ entity: 'switch.a', name: 0 }] }, makeHass({ 'switch.a': stateObj('on', { friendly_name: 'Zone' }) }));
    assert.equal(card.querySelector('.msic-name').textContent, '0');
  });
});

describe('interaction', () => {
  test('click on a switch calls switch.toggle', async () => {
    const hass = makeHass({ 'switch.a': 'on' });
    const card = makeCard({ items: [{ entity: 'switch.a' }] }, hass);
    items(card)[0].click();
    await Promise.resolve();
    assert.deepEqual(hass.calls, [{ domain: 'switch', service: 'toggle', data: { entity_id: 'switch.a' } }]);
  });

  // M1 (B8): binary_sensor has no turn_on/turn_off service
  test('tapping a binary_sensor calls no service', async () => {
    const hass = makeHass({ 'binary_sensor.door': 'on' });
    const card = makeCard({ items: [{ entity: 'binary_sensor.door' }] }, hass);
    items(card)[0].click();
    await Promise.resolve();
    assert.deepEqual(hass.calls, []);
  });

  // M1 (B8): read-only items must not announce an action that does nothing
  test('read-only items do not say "tap to toggle"', () => {
    const card = makeCard(
      { items: [{ entity: 'binary_sensor.door' }, { entity: 'person.sam' }] },
      makeHass({ 'binary_sensor.door': 'on', 'person.sam': 'home' }),
    );
    for (const item of items(card)) {
      assert.doesNotMatch(item.getAttribute('aria-label'), /toggle/i);
      assert.doesNotMatch(item.getAttribute('title'), /toggle/i);
    }
  });
});

describe('sizing', () => {
  // M3: getCardSize should agree with getGridOptions
  test('getCardSize ignores items without an entity and counts the title', { todo: 'counts every item, ignores the title' }, () => {
    const card = makeCard({ title: 'T', columns: 3, items: [{ entity: 'switch.a' }, { name: 'blank' }, {}, {}] });
    assert.equal(card.getCardSize(), 2);
  });

  test('getGridOptions counts rows of valid items plus the title', () => {
    const card = makeCard({ title: 'T', columns: 2, items: [{ entity: 'a.a' }, { entity: 'a.b' }, { entity: 'a.c' }, {}] });
    assert.deepEqual(card.getGridOptions(), { rows: 3, columns: 6, min_rows: 1, min_columns: 3 });
  });
});

describe('escaping', () => {
  test('an entity state cannot add attributes', () => {
    const card = makeCard({ items: [{ entity: 'sensor.s' }] }, makeHass({ 'sensor.s': 'x" onfocus="alert(1)' }));
    assert.deepEqual(unexpectedAttrs(items(card)[0]), []);
  });

  test('a friendly name cannot add attributes', () => {
    const card = makeCard(
      { items: [{ entity: 'switch.a' }, { entity: 'switch.gone', name: 'g" onfocus="alert(1)' }] },
      makeHass({ 'switch.a': stateObj('on', { friendly_name: 'n" onfocus="alert(1)' }) }),
    );
    for (const item of items(card)) assert.deepEqual(unexpectedAttrs(item), []);
  });

  test('config strings cannot add attributes or elements', () => {
    const inj = '"><img src=x onerror=alert(1)>';
    const card = makeCard(
      { columns: `3${inj}`, font_size: inj, icon_size: inj, color_on: inj, items: [{ entity: `switch.a${inj}` }, { entity: 'switch.b', icon_on: inj }] },
      makeHass({ [`switch.a${inj}`]: 'on', 'switch.b': 'on' }),
    );
    assert.equal(card.querySelectorAll('img').length, 0, 'injected <img> was rendered');
  });

  test('an escaped entity id still restores keyboard focus after a re-render', () => {
    const id = 'switch.a"b';
    const hass = makeHass({ [id]: 'on' });
    const card = makeCard({ items: [{ entity: id }] }, hass);
    items(card)[0].focus();
    card.hass = makeHass({ [id]: 'off' });
    assert.equal(card.ownerDocument.activeElement.dataset.entity, id);
  });
});

describe('fallback service', () => {
  test('a group that is on is turned off with homeassistant.turn_off', async () => {
    const hass = makeHass({ 'group.lights': 'on' });
    const card = makeCard({ items: [{ entity: 'group.lights' }] }, hass);
    items(card)[0].click();
    await Promise.resolve();
    assert.deepEqual(hass.calls[0], { domain: 'homeassistant', service: 'turn_off', data: { entity_id: 'group.lights' } });
  });

  test('a switch-like entity outside the domain table that is off is turned on', async () => {
    const hass = makeHass({ 'siren.alarm': 'off' });
    const card = makeCard({ items: [{ entity: 'siren.alarm' }] }, hass);
    items(card)[0].click();
    await Promise.resolve();
    assert.deepEqual(hass.calls[0], { domain: 'homeassistant', service: 'turn_on', data: { entity_id: 'siren.alarm' } });
  });

  test('an entity whose state is not on/off calls nothing', async () => {
    const hass = makeHass({ 'vacuum.robbie': 'docked' });
    const card = makeCard({ items: [{ entity: 'vacuum.robbie' }] }, hass);
    items(card)[0].click();
    await Promise.resolve();
    assert.deepEqual(hass.calls, []);
    assert.doesNotMatch(items(card)[0].getAttribute('aria-label'), /toggle/);
  });

  test('a toggleable item keeps aria-pressed; a read-only one has none', () => {
    const card = makeCard(
      { items: [{ entity: 'switch.a' }, { entity: 'binary_sensor.b' }] },
      makeHass({ 'switch.a': 'on', 'binary_sensor.b': 'on' }),
    );
    const [toggle, readOnly] = items(card);
    assert.equal(toggle.getAttribute('aria-pressed'), 'true');
    assert.equal(readOnly.hasAttribute('aria-pressed'), false);
  });
});
