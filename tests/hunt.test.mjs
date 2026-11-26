// Bugs found in the step 4 hunt (docs/card-review-plan.md section 7). Each test moves to
// the matching card/editor test file when its fix lands.
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeCard, makeEditor, makeHass, stateObj, items, fireValue, cleanup, window } from './helpers/env.mjs';

afterEach(cleanup);

const ITEM_ATTRS = ['class', 'data-entity', 'role', 'tabindex', 'aria-label', 'aria-pressed', 'aria-disabled', 'aria-keyshortcuts', 'title'];
const unexpectedAttrs = (el) => [...el.attributes].map((a) => a.name).filter((n) => !ITEM_ATTRS.includes(n));

describe('M6 (B10): editor follows setConfig after the first render', () => {
  test('a YAML edit shows in the visual editor', { todo: 'setConfig renders only once, fields stay stale' }, () => {
    const editor = makeEditor({ title: 'Old', items: [{ entity: 'switch.a' }] });
    editor.setConfig({ title: 'New', items: [{ entity: 'switch.a' }, { entity: 'switch.b' }] });
    assert.equal(editor.shadowRoot.getElementById('title').value, 'New');
    assert.equal(editor.shadowRoot.querySelectorAll('#entities-list ha-expansion-panel').length, 2);
  });

  test('the editor\'s own changes do not rebuild it (focus is kept)', () => {
    const editor = makeEditor({ items: [] });
    const field = editor.shadowRoot.getElementById('title');
    fireValue(field, 'Typing');
    editor.setConfig(editor.changes.at(-1));
    assert.ok(editor.shadowRoot.getElementById('title') === field, 'title field was rebuilt');
  });
});

describe('M7: holding Enter toggles once', () => {
  test('auto-repeated keydown is ignored', { todo: 'e.repeat is not checked' }, async () => {
    const hass = makeHass({ 'switch.a': 'off' });
    const card = makeCard({ items: [{ entity: 'switch.a' }] }, hass);
    const item = items(card)[0];
    item.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    item.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true }));
    await Promise.resolve();
    assert.equal(hass.calls.length, 1);
  });
});

describe('M8: editor panel header', () => {
  test('after changing the entity, clearing the name shows the new entity', { todo: 'name handler uses the entity captured at render' }, () => {
    const editor = makeEditor({ items: [{ entity: 'switch.old', name: 'Custom' }] });
    const panel = editor.shadowRoot.querySelector('#entities-list ha-expansion-panel');
    const [entityPicker, nameField] = panel.querySelectorAll('ha-selector');
    fireValue(entityPicker, 'switch.new');
    fireValue(nameField, '');
    assert.equal(panel.header, 'switch.new');
  });
});
