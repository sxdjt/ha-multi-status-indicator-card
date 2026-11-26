// Test environment for multi-status-indicator-card.js.
//
// The tests load the card file itself (the exact file Home Assistant loads) into a
// happy-dom window. happy-dom is a dev-only dependency: it gives the card a real DOM
// (shadow roots, innerHTML, querySelector, composed events) without a browser.
//
// Home Assistant's own elements (ha-card, ha-selector, ha-switch, ha-button, ha-icon,
// ha-relative-time, ha-expansion-panel) are not defined here. They behave as plain
// unknown elements, which is enough: the card only sets properties on them and listens
// for the events they would fire. Tests fire those events by hand.
//
// Timers are left as Node's own, so node:test `mock.timers` can drive the long-press.

import { createRequire } from 'node:module';
import { Window } from 'happy-dom';

// The card is loaded with require(), not by happy-dom, so happy-dom never needs to run
// scripts or fetch anything. Disabling both keeps injected markup in the escaping tests
// (`onerror=`, `<img src=x>`) inert and stops pending fetches from holding the process open.
export const window = new Window({
  url: 'http://localhost:8123/',
  settings: {
    disableJavaScriptEvaluation: true,
    disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true,
    disableIframePageLoading: true,
    handleDisabledFileLoadingAsSuccess: true,
  },
});

// The globals the card touches, taken from the happy-dom window
for (const key of ['document', 'HTMLElement', 'customElements', 'CustomEvent', 'Event', 'CSS', 'KeyboardEvent', 'MouseEvent', 'PointerEvent']) {
  globalThis[key] = window[key];
}
globalThis.window = window;

// happy-dom's CSS.supports returns true for any value, so the editor's invalid-color
// error could never show. Stand-in for the one query the card makes, ('color', value):
// hex, rgb()/hsl(), var(), and a few named colors. window.CSS returns a new object on
// each access, so the patch goes on the global object the card reads.
const NAMED_COLORS = new Set(['red', 'green', 'blue', 'black', 'white', 'orange', 'transparent', 'currentcolor']);
globalThis.CSS.supports = (property, value) => {
  if (property !== 'color') throw new Error(`CSS.supports stand-in only handles 'color', got '${property}'`);
  const v = String(value).trim().toLowerCase();
  return /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(v)
    || /^(rgb|rgba|hsl|hsla|var)\(.+\)$/.test(v)
    || NAMED_COLORS.has(v);
};

const require = createRequire(import.meta.url);
require('../../multi-status-indicator-card.js');

export const document = window.document;
export const Card = window.customElements.get('multi-status-indicator-card');
export const Editor = window.customElements.get('multi-status-indicator-card-editor');

// --- fixtures ---

export const NOW = '2026-01-15T12:00:00.000Z';

export function stateObj(state, attributes = {}, extra = {}) {
  return { state, attributes, last_changed: NOW, last_updated: NOW, ...extra };
}

// states: { 'switch.a': stateObj('on') } or { 'switch.a': 'on' }
export function makeHass(states = {}) {
  const normalized = {};
  for (const [id, s] of Object.entries(states)) {
    normalized[id] = typeof s === 'string' ? stateObj(s) : s;
  }
  const calls = [];
  return {
    states: normalized,
    calls,
    callService: async (domain, service, data) => { calls.push({ domain, service, data }); },
  };
}

// A card attached to the document, with config and hass applied
export function makeCard(config, hass = makeHass()) {
  const card = document.createElement('multi-status-indicator-card');
  const events = [];
  for (const type of ['hass-more-info', 'hass-notification']) {
    card.addEventListener(type, (e) => events.push({ type, detail: e.detail }));
  }
  card.events = events;
  card.setConfig(config);
  document.body.appendChild(card);
  card.hass = hass;
  return card;
}

export function makeEditor(config = {}, hass = makeHass()) {
  const editor = document.createElement('multi-status-indicator-card-editor');
  const changes = [];
  editor.addEventListener('config-changed', (e) => changes.push(structuredClone(e.detail.config)));
  editor.changes = changes;
  editor.hass = hass;
  editor.setConfig(config);
  document.body.appendChild(editor);
  return editor;
}

// The most recent config the editor fired
export const lastConfig = (editor) => editor.changes.at(-1);

// Fire the event an HA control would fire
export function fireValue(el, value) {
  el.dispatchEvent(new window.CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true }));
}

export function items(card) {
  return [...card.querySelectorAll('.msic-item')];
}

export function cleanup() {
  document.body.innerHTML = '';
}
