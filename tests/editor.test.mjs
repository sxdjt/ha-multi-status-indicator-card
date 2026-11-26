import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeEditor, fireValue, lastConfig, cleanup } from './helpers/env.mjs';

afterEach(cleanup);

const byId = (editor, id) => editor.shadowRoot.getElementById(id);

describe('card settings', () => {
  // Cleared fields are set to undefined (dropped when HA saves the config), like waterfall
  test('title change fires config-changed; clearing it unsets the key', () => {
    const editor = makeEditor({ items: [] });
    fireValue(byId(editor, 'title'), 'Zones');
    assert.equal(lastConfig(editor).title, 'Zones');
    fireValue(byId(editor, 'title'), '');
    assert.equal(lastConfig(editor).title, undefined);
  });

  test('invalid color shows an error; a valid one clears it', () => {
    const editor = makeEditor({ items: [] });
    const field = byId(editor, 'color_on');
    const error = field.nextElementSibling;
    fireValue(field, 'notacolor');
    assert.match(error.textContent, /Color \(On\) is not a valid color/);
    fireValue(field, '#11FF11');
    assert.equal(error.textContent, '');
  });

  test('Add Entity appends an empty item', () => {
    const editor = makeEditor({ items: [] });
    byId(editor, 'add-entity').click();
    assert.deepEqual(lastConfig(editor).items, [{ entity: '' }]);
    assert.equal(editor.shadowRoot.querySelectorAll('ha-expansion-panel').length, 3);
  });
});

describe('entity panels', () => {
  test('a numeric name 0 shows in the name field and the panel header', () => {
    const editor = makeEditor({ items: [{ entity: 'switch.a', name: 0 }] });
    const panel = editor.shadowRoot.querySelector('#entities-list ha-expansion-panel');
    assert.equal(panel.header, '0');
    assert.equal(panel.querySelectorAll('ha-selector')[1].value, '0');
  });
});

describe('setConfig after the first render', () => {
  test('a YAML edit shows in the visual editor', () => {
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

  test('an item edit handed back by HA does not rebuild the panels', () => {
    const editor = makeEditor({ items: [{ entity: 'switch.a' }] });
    const panel = editor.shadowRoot.querySelector('#entities-list ha-expansion-panel');
    fireValue(panel.querySelectorAll('ha-selector')[1], 'Zone');
    editor.setConfig(editor.changes.at(-1));
    assert.ok(editor.shadowRoot.querySelector('#entities-list ha-expansion-panel') === panel, 'panel was rebuilt');
  });
});
