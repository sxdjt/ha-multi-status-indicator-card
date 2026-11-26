import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { makeCard, makeHass, items, cleanup, window } from './helpers/env.mjs';

afterEach(() => { mock.timers.reset(); cleanup(); });

const key = (el, k, opts = {}) => {
  const e = new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts });
  el.dispatchEvent(e);
  return e;
};
const pointer = (el, type) => el.dispatchEvent(new window.PointerEvent(type, { bubbles: true }));
const settle = () => new Promise((r) => setImmediate(r));

describe('services', () => {
  test('lock and climate pick the service from the state', async () => {
    const hass = makeHass({ 'lock.l': 'locked', 'lock.u': 'unlocked', 'climate.off': 'off', 'climate.heat': 'heat' });
    const card = makeCard({ items: ['lock.l', 'lock.u', 'climate.off', 'climate.heat'].map((entity) => ({ entity })) }, hass);
    items(card).forEach((el) => el.click());
    await settle();
    assert.deepEqual(hass.calls.map((c) => `${c.domain}.${c.service}`), ['lock.unlock', 'lock.lock', 'climate.turn_on', 'climate.turn_off']);
  });

  test('a failed call shows a notification', async () => {
    const hass = makeHass({ 'switch.a': 'on' });
    hass.callService = async () => { throw new Error('boom'); };
    const card = makeCard({ items: [{ entity: 'switch.a' }] }, hass);
    items(card)[0].click();
    await settle();
    assert.deepEqual(card.events, [{ type: 'hass-notification', detail: { message: 'Failed to toggle switch.a: boom' } }]);
  });

  test('an entity removed since the last render is not called', async () => {
    const hass = makeHass({ 'switch.a': 'on' });
    const card = makeCard({ items: [{ entity: 'switch.a' }] }, hass);
    delete hass.states['switch.a'];
    items(card)[0].click();
    await settle();
    assert.deepEqual(hass.calls, []);
  });
});

describe('click', () => {
  test('clicks outside an item, or on an unavailable item, do nothing', async () => {
    const hass = makeHass({ 'switch.u': 'unavailable' });
    const card = makeCard({ title: 'T', items: [{ entity: 'switch.u' }] }, hass);
    card.querySelector('.msic-title').click();
    items(card)[0].click();
    await settle();
    assert.deepEqual(hass.calls, []);
  });
});

describe('keyboard', () => {
  test('Enter and Space toggle; Shift+Enter opens more-info; other keys do nothing', async () => {
    const hass = makeHass({ 'switch.a': 'on' });
    const card = makeCard({ items: [{ entity: 'switch.a' }] }, hass);
    const el = items(card)[0];
    assert.equal(key(el, 'Enter').defaultPrevented, true);
    assert.equal(key(el, ' ').defaultPrevented, true);
    assert.equal(key(el, 'a').defaultPrevented, false);
    key(el, 'Enter', { shiftKey: true });
    await settle();
    assert.equal(hass.calls.length, 2);
    assert.deepEqual(card.events, [{ type: 'hass-more-info', detail: { entityId: 'switch.a' } }]);
  });

  test('a held key that is not Enter or Space is not prevented', () => {
    const card = makeCard({ items: [{ entity: 'switch.a' }] }, makeHass({ 'switch.a': 'on' }));
    assert.equal(key(items(card)[0], 'Tab', { repeat: true }).defaultPrevented, false);
    assert.equal(key(items(card)[0], ' ', { repeat: true }).defaultPrevented, true);
  });

  test('unavailable items do not toggle but Shift+Enter opens more-info', async () => {
    const hass = makeHass({ 'switch.u': 'unavailable' });
    const card = makeCard({ items: [{ entity: 'switch.u' }] }, hass);
    key(items(card)[0], 'Enter');
    key(items(card)[0], 'Enter', { shiftKey: true });
    await settle();
    assert.deepEqual(hass.calls, []);
    assert.equal(card.events[0].type, 'hass-more-info');
  });

  test('keys outside an item are ignored', () => {
    const card = makeCard({ title: 'T', items: [{ entity: 'switch.a' }] }, makeHass({ 'switch.a': 'on' }));
    assert.equal(key(card.querySelector('.msic-title'), 'Enter').defaultPrevented, false);
  });
});

describe('long-press', () => {
  test('holding 500 ms opens more-info and the trailing click does not toggle', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    const hass = makeHass({ 'switch.a': 'on' });
    const card = makeCard({ items: [{ entity: 'switch.a' }] }, hass);
    const el = items(card)[0];
    pointer(el, 'pointerdown');
    mock.timers.tick(500);
    pointer(el, 'pointerup');
    el.click();
    await settle();
    assert.deepEqual(card.events, [{ type: 'hass-more-info', detail: { entityId: 'switch.a' } }]);
    assert.deepEqual(hass.calls, []);
    el.click();
    await settle();
    assert.equal(hass.calls.length, 1);
  });

  test('releasing or cancelling before 500 ms is a normal tap', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    const hass = makeHass({ 'switch.a': 'on' });
    const card = makeCard({ items: [{ entity: 'switch.a' }] }, hass);
    const el = items(card)[0];
    for (const end of ['pointerup', 'pointercancel']) {
      pointer(el, 'pointerdown');
      mock.timers.tick(300);
      pointer(el, end);
      pointer(el, end);
      mock.timers.tick(500);
    }
    assert.deepEqual(card.events, []);
    el.click();
    await settle();
    assert.equal(hass.calls.length, 1);
  });

  test('pointerdown outside an item starts no timer', () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    const card = makeCard({ title: 'T', items: [{ entity: 'switch.a' }] }, makeHass({ 'switch.a': 'on' }));
    pointer(card.querySelector('.msic-title'), 'pointerdown');
    mock.timers.tick(1000);
    assert.deepEqual(card.events, []);
  });
});
