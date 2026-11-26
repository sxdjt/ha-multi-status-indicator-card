// Bugs found in the step 4 hunt (docs/card-review-plan.md section 7). Each test moves to
// the matching card/editor test file when its fix lands.
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeCard, makeEditor, makeHass, stateObj, items, fireValue, cleanup, window } from './helpers/env.mjs';

afterEach(cleanup);

const ITEM_ATTRS = ['class', 'data-entity', 'role', 'tabindex', 'aria-label', 'aria-pressed', 'aria-disabled', 'aria-keyshortcuts', 'title'];
const unexpectedAttrs = (el) => [...el.attributes].map((a) => a.name).filter((n) => !ITEM_ATTRS.includes(n));

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
