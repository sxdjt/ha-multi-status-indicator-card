# Tests

Run with `npm test`. It runs every `*.test.mjs` file here with Node's built-in test runner. Node 20.11 or newer is required. The card itself has no build step and no runtime dependencies; `package.json` exists only for this test suite.

## How it works

The tests load `multi-status-indicator-card.js`, the same file Home Assistant loads, into a [happy-dom](https://github.com/capricorn86/happy-dom) window (`devDependencies` only, never shipped). happy-dom provides a real DOM: shadow roots, `innerHTML`, `querySelector` and composed events, which the card and editor both rely on.

`helpers/env.mjs` sets up the window, loads the card, and builds fixtures:

- `makeHass(states)`, `stateObj(state, attributes)`: a `hass` stand-in whose `callService` records calls in `hass.calls`.
- `makeCard(config, hass)`: a card attached to the document; `card.events` records `hass-more-info` and `hass-notification`.
- `makeEditor(config, hass)`: an attached editor; `editor.changes` records every `config-changed` config, `lastConfig(editor)` returns the newest.
- `fireValue(el, value)`: fire the `value-changed` event an HA control would fire.

Home Assistant's own elements (`ha-selector`, `ha-switch`, `ha-button`, `ha-icon`, ...) are not defined, so they behave as plain elements: tests check the properties the card sets on them and fire their events by hand.

IMPORTANT: never pass a DOM node to `assert` (`assert.equal(el, null)`, `assert.equal(a, b)` on elements, `deepEqual` on nodes). When such an assertion fails, Node builds the error message by inspecting the node, which walks the whole happy-dom window and grows memory without bound (2026-11-25: over 70 GB). Assert on strings, numbers or booleans instead: `querySelectorAll(sel).length`, `textContent`, `getAttribute()`, or `assert.ok(a === b, 'message')`.

`npm test` runs under `tests/run-capped.sh`, which kills the run if it passes 1 GB of memory or 60 seconds (`MAX_RSS_MB`, `MAX_SECONDS` to override). Node's `--max-old-space-size` does not bound happy-dom and macOS ignores `ulimit -v`, so the cap is enforced from outside. Run single files the same way: `tests/run-capped.sh node --test tests/card.test.mjs`.

`CSS.supports` is replaced with a small deterministic color check, because happy-dom's accepts any value.

## Coverage

```bash
npm run coverage
```

The target is 100% function and branch coverage of `multi-status-indicator-card.js`.

## Known issues

Record a known bug as a test with the `todo` option, describing the intended behavior. It runs and reports as `todo` without failing the suite. When a fix lands, remove the `todo` option so the test guards against regressions.

There are no open `todo` tests.
