import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeEditor, makeHass, stateObj, fireValue, lastConfig, cleanup, document } from './helpers/env.mjs';

afterEach(cleanup);

const byId = (editor, id) => editor.shadowRoot.getElementById(id);
const panels = (editor) => [...editor.shadowRoot.querySelectorAll('#entities-list ha-expansion-panel')];
const fields = (panel) => panel.querySelectorAll('ha-selector');  // entity, name, icon on, icon off, color on, color off, show last changed

describe('card-level fields', () => {
  test('fields start from the config', () => {
    const editor = makeEditor({ title: 'T', columns: 4, icon_size: '22px', font_size: '12px', color_on: '#0f0', color_off: '#f00', name_position: 'above', show_last_changed: false, items: [] });
    assert.deepEqual(
      ['title', 'columns', 'icon_size', 'font_size', 'color_on', 'color_off', 'name_position'].map((id) => byId(editor, id).value),
      ['T', 4, '22px', '12px', '#0f0', '#f00', 'above'],
    );
    assert.equal(byId(editor, 'show_last_changed').checked, false);
  });

  test('empty config: defaults shown, no items key needed', () => {
    const editor = makeEditor({});
    assert.equal(byId(editor, 'name_position').value, 'below');
    assert.equal(byId(editor, 'columns').value, '');
    assert.equal(byId(editor, 'show_last_changed').checked, true);
    byId(editor, 'add-entity').click();
    assert.deepEqual(lastConfig(editor).items, [{ entity: '' }]);
  });

  test('columns is stored as a number; clearing it unsets it', () => {
    const editor = makeEditor({ items: [] });
    fireValue(byId(editor, 'columns'), '4');
    assert.equal(lastConfig(editor).columns, 4);
    fireValue(byId(editor, 'columns'), '');
    assert.equal(lastConfig(editor).columns, undefined);
  });

  test('text fields set and clear their keys', () => {
    const editor = makeEditor({ items: [] });
    for (const id of ['icon_size', 'font_size', 'color_on', 'color_off']) {
      fireValue(byId(editor, id), 'red');
      assert.equal(lastConfig(editor)[id], 'red', id);
      fireValue(byId(editor, id), '');
      assert.equal(lastConfig(editor)[id], undefined, id);
    }
  });

  test('name position: below is the default and is not stored', () => {
    const editor = makeEditor({ items: [] });
    fireValue(byId(editor, 'name_position'), 'above');
    assert.equal(lastConfig(editor).name_position, 'above');
    fireValue(byId(editor, 'name_position'), 'below');
    assert.equal(lastConfig(editor).name_position, undefined);
  });

  test('show last changed switch', () => {
    const editor = makeEditor({ items: [] });
    const sw = byId(editor, 'show_last_changed');
    sw.checked = false;
    sw.dispatchEvent(new sw.ownerDocument.defaultView.Event('change'));
    assert.equal(lastConfig(editor).show_last_changed, false);
  });

  test('value-changed from card fields does not leak out of the editor', () => {
    const editor = makeEditor({ items: [] });
    let leaked = 0;
    document.body.addEventListener('value-changed', () => leaked++);
    for (const id of ['title', 'columns', 'icon_size', 'font_size', 'color_on', 'color_off', 'name_position']) fireValue(byId(editor, id), 'x');
    assert.equal(leaked, 0);
  });

  test('hass reaches every selector, including ones added later', () => {
    const editor = makeEditor({ items: [] });
    const hass = makeHass();
    editor.hass = hass;
    byId(editor, 'add-entity').click();
    for (const s of editor.shadowRoot.querySelectorAll('ha-selector')) assert.ok(s.hass === hass, s.label);
  });

  test('a valid initial color shows no error', () => {
    const editor = makeEditor({ color_on: 'red', items: [] });
    assert.equal(byId(editor, 'color_on').nextElementSibling.textContent, '');
  });
});

describe('entity panel fields', () => {
  test('fields start from the item', () => {
    const editor = makeEditor({ items: [{ entity: 'switch.a', name: 'A', icon_on: 'mdi:a', icon_off: 'mdi:b', color_on: '#111', color_off: '#222', show_last_changed: true }, { entity: 'switch.b', show_last_changed: false }, {}] });
    const [a, b, c] = panels(editor);
    assert.deepEqual([...fields(a)].map((f) => f.value), ['switch.a', 'A', 'mdi:a', 'mdi:b', '#111', '#222', 'show']);
    assert.equal(fields(b)[6].value, 'hide');
    assert.deepEqual([...fields(c)].map((f) => f.value), ['', '', '', '', '', '', 'default']);
    assert.equal(c.header, 'Entity 3');
  });

  test('header falls back to the friendly name', () => {
    const editor = makeEditor({ items: [{ entity: 'switch.a' }] }, makeHass({ 'switch.a': stateObj('on', { friendly_name: 'Pump' }) }));
    assert.equal(panels(editor)[0].header, 'Pump');
  });

  test('icon and color fields set and clear their keys', () => {
    const editor = makeEditor({ items: [{ entity: 'switch.a' }] });
    const f = fields(panels(editor)[0]);
    [['icon_on', 2, 'mdi:x'], ['icon_off', 3, 'mdi:y'], ['color_on', 4, '#111'], ['color_off', 5, '#222']].forEach(([k, i, v]) => {
      fireValue(f[i], v);
      assert.equal(lastConfig(editor).items[0][k], v, k);
      fireValue(f[i], '');
      assert.equal(k in lastConfig(editor).items[0], false, k);
    });
  });

  test('show last changed: show, hide, default', () => {
    const editor = makeEditor({ items: [{ entity: 'switch.a' }] });
    const sel = fields(panels(editor)[0])[6];
    fireValue(sel, 'show');
    assert.equal(lastConfig(editor).items[0].show_last_changed, true);
    fireValue(sel, 'hide');
    assert.equal(lastConfig(editor).items[0].show_last_changed, false);
    fireValue(sel, 'default');
    assert.equal('show_last_changed' in lastConfig(editor).items[0], false);
  });

  test('Remove drops the item and moves focus to Add Entity', () => {
    const editor = makeEditor({ items: [{ entity: 'switch.a' }, { entity: 'switch.b' }] });
    const remove = panels(editor)[0].querySelector('ha-button');
    assert.equal(remove.textContent, 'Remove entity 1');
    remove.click();
    assert.deepEqual(lastConfig(editor).items, [{ entity: 'switch.b' }]);
    assert.equal(panels(editor).length, 1);
    assert.equal(editor.shadowRoot.activeElement?.id, 'add-entity');
  });

  test('_renderEntities and _panelHeader are safe before the first render', () => {
    const editor = document.createElement('multi-status-indicator-card-editor');
    editor._renderEntities();
    editor._config = { items: [] };
    assert.equal(editor._panelHeader(4), 'Entity 5');
  });
});
