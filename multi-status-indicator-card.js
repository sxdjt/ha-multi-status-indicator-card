window.customCards = window.customCards || [];
window.customCards.push({
  type: 'multi-status-indicator-card',
  name: 'Multi Status Indicator Card',
  description: 'A grid display for multiple entity status indicators with toggle support',
  preview: true,

  // Suggest this card for entities that naturally display as on/off status indicators.
  // The card also supports cover, lock, climate, and media_player, but those domains
  // are less typical as grid-style status indicators and are not suggested here.
  getEntitySuggestion: (hass, entityId) => {
    const entityState = hass.states[entityId];
    if (!entityState) return null;

    const domain = entityId.split('.')[0];
    const indicatorDomains = ['binary_sensor', 'switch', 'light', 'input_boolean', 'automation'];

    if (!indicatorDomains.includes(domain)) return null;

    return { config: { type: 'custom:multi-status-indicator-card', items: [{ entity: entityId }] } };
  }
});

console.info(
  `%c MULTI-STATUS-INDICATOR-CARD %c 2026.11.12 `,
  'color: black; background: #F2720C; font-weight: 600;',
  'color: black; background: #00a5c9; font-weight: 600;'
);

// Visual Editor for Multi-Status Indicator Card
class MultiStatusIndicatorCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._rendered = false;
  }

  setConfig(config) {
    this._config = { ...config };
    if (!this._config.items) this._config.items = [];
    // Only render once to preserve focus
    if (!this._rendered) {
      this.render();
      this._rendered = true;
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.shadowRoot?.querySelectorAll('ha-selector').forEach(s => s.hass = hass);
  }

  _fire() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      bubbles: true, composed: true,
      detail: { config: this._config }
    }));
  }

  _addEntity() {
    this._config.items = [...this._config.items, { entity: '' }];
    this._fire();
    this._renderEntities();
  }

  _removeEntity(index) {
    this._config.items = this._config.items.filter((_, i) => i !== index);
    this._fire();
    this._renderEntities();
    // The rebuild destroyed the focused Remove button; move focus somewhere stable
    this.shadowRoot?.getElementById('add-entity')?.focus();
  }

  // Color text field validation: an error message below the field for invalid colors.
  // The live region exists from the start so screen readers announce the error when it
  // appears, and it is rebuilt only when validity flips, not on every keystroke.
  _addColorValidation(selector, label) {
    const error = document.createElement('div');
    error.className = 'error-text';
    error.setAttribute('aria-live', 'polite');
    selector.insertAdjacentElement('afterend', error);

    let shown = false;
    const update = (v) => {
      const invalid = Boolean(v) && !CSS.supports('color', v);
      if (invalid === shown) return;
      shown = invalid;
      error.replaceChildren();
      if (!invalid) return;
      const icon = document.createElement('ha-icon');
      icon.icon = 'mdi:alert-circle';
      icon.setAttribute('aria-hidden', 'true');
      const prefix = document.createElement('strong');
      prefix.textContent = 'Error: ';
      const message = document.createElement('span');
      message.append(prefix, `${label} is not a valid color. Use a hex code (#FF0000), a color name (red), or var(--token).`);
      error.append(icon, message);
    };
    update(selector.value);
    selector.addEventListener('value-changed', (e) => update(e.detail.value));
  }

  _updateEntity(index, field, value) {
    const items = [...this._config.items];
    items[index] = { ...items[index], [field]: value || undefined };
    // Clean up undefined values
    Object.keys(items[index]).forEach(k => {
      if (items[index][k] === undefined) delete items[index][k];
    });
    this._config.items = items;
    this._fire();
  }

  _renderEntities() {
    const list = this.shadowRoot?.getElementById('entities-list');
    if (!list) return;
    list.innerHTML = '';
    this._config.items.forEach((item, index) => {
      const panel = document.createElement('ha-expansion-panel');
      panel.outlined = true;
      panel.header = item.name || this._hass?.states[item.entity]?.attributes?.friendly_name || item.entity || `Entity ${index + 1}`;

      const content = document.createElement('div');
      content.className = 'panel-content';

      // Entity picker
      const entityDiv = document.createElement('div');
      entityDiv.className = 'field';
      const entityPicker = document.createElement('ha-selector');
      entityPicker.hass = this._hass;
      entityPicker.selector = { entity: {} };
      // Each item needs an entity; every other field is optional
      entityPicker.required = true;
      entityPicker.value = item.entity || '';
      entityPicker.label = 'Entity';
      entityPicker.addEventListener('value-changed', (e) => {
        this._updateEntity(index, 'entity', e.detail.value);
        panel.header = this._hass?.states[e.detail.value]?.attributes?.friendly_name || e.detail.value || `Entity ${index + 1}`;
      });
      entityDiv.appendChild(entityPicker);
      content.appendChild(entityDiv);

      // Name override
      const nameDiv = document.createElement('div');
      nameDiv.className = 'field';
      const nameField = document.createElement('ha-selector');
      nameField.hass = this._hass;
      nameField.selector = { text: {} };
      nameField.required = false;
      nameField.label = 'Custom Name';
      nameField.value = item.name || '';
      nameField.addEventListener('value-changed', (e) => {
        e.stopPropagation();
        this._updateEntity(index, 'name', e.detail.value);
        panel.header = e.detail.value || this._hass?.states[item.entity]?.attributes?.friendly_name || item.entity || `Entity ${index + 1}`;
      });
      nameDiv.appendChild(nameField);
      content.appendChild(nameDiv);

      // Icon pickers row
      const iconRow = document.createElement('div');
      iconRow.className = 'row';

      const iconOnDiv = document.createElement('div');
      iconOnDiv.className = 'field';
      const iconOnPicker = document.createElement('ha-selector');
      iconOnPicker.hass = this._hass;
      iconOnPicker.selector = { icon: {} };
      iconOnPicker.required = false;
      iconOnPicker.value = item.icon_on || '';
      iconOnPicker.label = 'Icon (On)';
      iconOnPicker.addEventListener('value-changed', (e) => {
        this._updateEntity(index, 'icon_on', e.detail.value);
      });
      iconOnDiv.appendChild(iconOnPicker);
      iconRow.appendChild(iconOnDiv);

      const iconOffDiv = document.createElement('div');
      iconOffDiv.className = 'field';
      const iconOffPicker = document.createElement('ha-selector');
      iconOffPicker.hass = this._hass;
      iconOffPicker.selector = { icon: {} };
      iconOffPicker.required = false;
      iconOffPicker.value = item.icon_off || '';
      iconOffPicker.label = 'Icon (Off)';
      iconOffPicker.addEventListener('value-changed', (e) => {
        this._updateEntity(index, 'icon_off', e.detail.value);
      });
      iconOffDiv.appendChild(iconOffPicker);
      iconRow.appendChild(iconOffDiv);

      content.appendChild(iconRow);

      // Color overrides row
      const colorRow = document.createElement('div');
      colorRow.className = 'row';

      const colorOnDiv = document.createElement('div');
      colorOnDiv.className = 'field';
      const colorOnField = document.createElement('ha-selector');
      colorOnField.hass = this._hass;
      colorOnField.selector = { text: {} };
      colorOnField.required = false;
      colorOnField.label = 'Color (On)';
      colorOnField.helper = 'Overrides the card color for this entity';
      colorOnField.value = item.color_on || '';
      colorOnField.addEventListener('value-changed', (e) => {
        e.stopPropagation();
        this._updateEntity(index, 'color_on', e.detail.value);
      });
      colorOnDiv.appendChild(colorOnField);
      this._addColorValidation(colorOnField, 'Color (On)');
      colorRow.appendChild(colorOnDiv);

      const colorOffDiv = document.createElement('div');
      colorOffDiv.className = 'field';
      const colorOffField = document.createElement('ha-selector');
      colorOffField.hass = this._hass;
      colorOffField.selector = { text: {} };
      colorOffField.required = false;
      colorOffField.label = 'Color (Off)';
      colorOffField.helper = 'Overrides the card color for this entity';
      colorOffField.value = item.color_off || '';
      colorOffField.addEventListener('value-changed', (e) => {
        e.stopPropagation();
        this._updateEntity(index, 'color_off', e.detail.value);
      });
      colorOffDiv.appendChild(colorOffField);
      this._addColorValidation(colorOffField, 'Color (Off)');
      colorRow.appendChild(colorOffDiv);

      content.appendChild(colorRow);

      // Per-item "show last changed" override. Tri-state: "default" inherits the card-level
      // setting, while "show"/"hide" force it on/off for this item only.
      const showChangedDiv = document.createElement('div');
      showChangedDiv.className = 'field';
      const showChangedField = document.createElement('ha-selector');
      showChangedField.hass = this._hass;
      showChangedField.required = false;
      showChangedField.selector = { select: { mode: 'dropdown', options: [
        { value: 'default', label: 'Default (use card setting)' },
        { value: 'show', label: 'Show' },
        { value: 'hide', label: 'Hide' }
      ] } };
      showChangedField.label = 'Show Last Changed';
      showChangedField.value = item.show_last_changed === undefined
        ? 'default'
        : (item.show_last_changed ? 'show' : 'hide');
      showChangedField.addEventListener('value-changed', (e) => {
        e.stopPropagation();
        const selection = e.detail.value;
        const overrideValue = selection === 'show' ? true : selection === 'hide' ? false : undefined;
        const items = [...this._config.items];
        items[index] = { ...items[index], show_last_changed: overrideValue };
        // "default" removes the override entirely so the item inherits the card setting
        if (overrideValue === undefined) delete items[index].show_last_changed;
        this._config.items = items;
        this._fire();
      });
      showChangedDiv.appendChild(showChangedField);
      content.appendChild(showChangedDiv);

      // Remove button
      // Visible text stays "Remove"; the hidden suffix gives each button a distinct name
      const removeBtn = document.createElement('ha-button');
      removeBtn.setAttribute('appearance', 'plain');
      removeBtn.setAttribute('variant', 'danger');
      const removeContext = document.createElement('span');
      removeContext.className = 'visually-hidden';
      removeContext.textContent = ` entity ${index + 1}`;
      removeBtn.append('Remove', removeContext);
      removeBtn.addEventListener('click', () => this._removeEntity(index));
      content.appendChild(removeBtn);

      panel.appendChild(content);
      list.appendChild(panel);
    });
    // Update hass on new selectors
    this.shadowRoot?.querySelectorAll('ha-selector').forEach(s => s.hass = this._hass);
  }

  render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .field { margin-bottom: 16px; }
        .field ha-selector { display: block; width: 100%; }
        ha-expansion-panel { display: block; margin-bottom: 8px; }
        .panel-content { padding: 16px; }
        .row { display: flex; gap: 16px; }
        .row > * { flex: 1; }
        .toggle-row { display: flex; justify-content: space-between; align-items: center; min-height: 56px; }
        ha-button { margin-top: 8px; }
        /* Text stays primary color for 4.5:1; red only on non-text parts, which need 3:1 */
        .error-text {
          display: flex; align-items: flex-start; gap: 6px;
          font-size: 12px; color: var(--primary-text-color);
          margin-top: 6px; padding: 4px 8px;
          border-left: 3px solid var(--error-color, #db4437);
        }
        .error-text:empty { display: none; }
        .error-text ha-icon { flex: 0 0 auto; color: var(--error-color, #db4437); --mdc-icon-size: 16px; }
        .visually-hidden {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
        }
      </style>
      <div>
        <ha-expansion-panel outlined expanded header="Card Settings">
          <div class="panel-content">
            <div class="field"><ha-selector id="title"></ha-selector></div>
            <div class="field"><ha-selector id="columns"></ha-selector></div>
            <div class="row">
              <div class="field"><ha-selector id="icon_size"></ha-selector></div>
              <div class="field"><ha-selector id="font_size"></ha-selector></div>
            </div>
            <div class="row">
              <div class="field"><ha-selector id="color_on"></ha-selector></div>
              <div class="field"><ha-selector id="color_off"></ha-selector></div>
            </div>
            <div class="field"><ha-selector id="name_position"></ha-selector></div>
            <div class="toggle-row">
              <span>Show Last Changed</span>
              <!-- Current HA (Web Awesome) names the switch's inner input only from slotted
                   text; the host aria-label covers older MWC-based releases -->
              <ha-switch id="show_last_changed" aria-label="Show Last Changed"><span class="visually-hidden">Show Last Changed</span></ha-switch>
            </div>
          </div>
        </ha-expansion-panel>
        <ha-expansion-panel outlined expanded header="Entities">
          <div class="panel-content">
            <div id="entities-list"></div>
            <ha-button id="add-entity">Add Entity</ha-button>
          </div>
        </ha-expansion-panel>
      </div>
    `;

    // Card settings - initialize ha-selector elements (properties set here after innerHTML)
    const title = this.shadowRoot.getElementById('title');
    title.hass = this._hass;
    title.selector = { text: {} };
    title.required = false;
    title.label = 'Title';
    title.value = this._config.title || '';
    title.addEventListener('value-changed', (e) => { e.stopPropagation(); this._config.title = e.detail.value || undefined; this._fire(); });

    const columns = this.shadowRoot.getElementById('columns');
    columns.hass = this._hass;
    columns.selector = { number: { mode: 'box', step: 1, min: 1, max: 20 } };
    columns.required = false;
    columns.label = 'Columns';
    columns.value = this._config.columns ?? '';
    columns.addEventListener('value-changed', (e) => { e.stopPropagation(); this._config.columns = e.detail.value ? Number(e.detail.value) : undefined; this._fire(); });

    const iconSize = this.shadowRoot.getElementById('icon_size');
    iconSize.hass = this._hass;
    iconSize.selector = { text: {} };
    iconSize.required = false;
    iconSize.label = 'Icon Size';
    iconSize.helper = 'CSS size, e.g. 20px (default) or 1.5em';
    iconSize.value = this._config.icon_size || '';
    iconSize.addEventListener('value-changed', (e) => { e.stopPropagation(); this._config.icon_size = e.detail.value || undefined; this._fire(); });

    const fontSize = this.shadowRoot.getElementById('font_size');
    fontSize.hass = this._hass;
    fontSize.selector = { text: {} };
    fontSize.required = false;
    fontSize.label = 'Font Size';
    fontSize.helper = 'CSS size, e.g. 11px (default)';
    fontSize.value = this._config.font_size || '';
    fontSize.addEventListener('value-changed', (e) => { e.stopPropagation(); this._config.font_size = e.detail.value || undefined; this._fire(); });

    const colorOn = this.shadowRoot.getElementById('color_on');
    colorOn.hass = this._hass;
    colorOn.selector = { text: {} };
    colorOn.required = false;
    colorOn.label = 'Color (On)';
    colorOn.helper = 'Hex (#4CAF50), color name or var(--token). Default: green';
    colorOn.value = this._config.color_on || '';
    colorOn.addEventListener('value-changed', (e) => { e.stopPropagation(); this._config.color_on = e.detail.value || undefined; this._fire(); });
    this._addColorValidation(colorOn, 'Color (On)');

    const colorOff = this.shadowRoot.getElementById('color_off');
    colorOff.hass = this._hass;
    colorOff.selector = { text: {} };
    colorOff.required = false;
    colorOff.label = 'Color (Off)';
    colorOff.helper = 'Hex (#F44336), color name or var(--token). Default: red';
    colorOff.value = this._config.color_off || '';
    colorOff.addEventListener('value-changed', (e) => { e.stopPropagation(); this._config.color_off = e.detail.value || undefined; this._fire(); });
    this._addColorValidation(colorOff, 'Color (Off)');

    const namePosition = this.shadowRoot.getElementById('name_position');
    namePosition.hass = this._hass;
    namePosition.required = false;
    namePosition.selector = { select: { mode: 'dropdown', options: [
      { value: 'below', label: 'Below icon' },
      { value: 'above', label: 'Above icon' }
    ] } };
    namePosition.label = 'Name Position';
    namePosition.value = this._config.name_position || 'below';
    namePosition.addEventListener('value-changed', (e) => { e.stopPropagation(); this._config.name_position = e.detail.value === 'below' ? undefined : e.detail.value; this._fire(); });

    const showLastChanged = this.shadowRoot.getElementById('show_last_changed');
    showLastChanged.checked = this._config.show_last_changed !== false;
    showLastChanged.addEventListener('change', (e) => { this._config.show_last_changed = e.target.checked; this._fire(); });

    this.shadowRoot.getElementById('add-entity').addEventListener('click', () => this._addEntity());

    this._renderEntities();
  }
}

customElements.define('multi-status-indicator-card-editor', MultiStatusIndicatorCardEditor);

class MultiStatusIndicatorCard extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
    this._root = null;
    this._container = null;
    this._eventListenerAttached = false;
    this._pressTimer = null;
    // Set true when a long-press fires so the trailing click does not also toggle the entity
    this._longPressFired = false;
  }

  setConfig(config) {
    // Store config - validation happens at render time to allow editor to work
    this._config = config;
    if (this._root) {
      this._render();
    }
  }

  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;

    if (!this._config || !this.isConnected) {
      return;
    }

    // Only render if this is the first hass set or if configured entities changed
    if (!oldHass || this._hasEntitiesChanged(oldHass, hass)) {
      this._render();
    }
  }

  _hasEntitiesChanged(oldHass, newHass) {
    const items = this._config?.items || [];
    const entityIds = items.map(item => item?.entity).filter(Boolean);

    return entityIds.some(entityId => {
      return oldHass.states[entityId] !== newHass.states[entityId];
    });
  }

  connectedCallback() {
    if (!this._root) {
      this.appendChild(this._createStyles());
      this._root = document.createElement('ha-card');
      this.appendChild(this._root);
      // Fill the full grid cell height in sections view
      this.style.display = 'block';
      this.style.height = '100%';
      this._root.style.height = '100%';
    }
    // Render if we have config and hass
    if (this._config && this._hass) {
      this._render();
    }
  }

  // The card renders into light DOM, but HA places every card inside a shadow root, which a
  // stylesheet in document.head cannot reach (the grid, focus and muted-text rules never
  // applied). A <style> inside the card element applies to whichever root holds the card
  // and moves with it. Class names stay prefixed (`msic-`) to avoid collisions in that root.
  _createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .msic-container {
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .msic-title {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 4px 0;
      }
      .msic-grid {
        display: grid;
        gap: 4px;
      }
      .msic-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border-radius: 6px;
        cursor: pointer;
        transition: transform 0.1s ease-in-out, background-color 0.1s ease-in-out;
        background-color: transparent;
      }
      .msic-item:hover {
        background-color: var(--ha-card-background, var(--card-background-color, rgba(128, 128, 128, 0.1)));
      }
      .msic-item:active {
        transform: scale(0.95);
      }
      .msic-item:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      /* No opacity here: 0.5 dropped the name to 3.4:1. The muted look comes from
         --secondary-text-color (4.5:1+ in both themes) and the "Unavailable" label */
      .msic-item.msic-unavailable {
        cursor: default;
        color: var(--secondary-text-color);
      }
      .msic-item.msic-unavailable:hover {
        background-color: transparent;
      }
      .msic-item.msic-unavailable:active {
        transform: none;
      }
      .msic-name {
        text-align: center;
      }
      .msic-time {
        font-size: 10px;
        color: var(--secondary-text-color);
      }
    `;
    return style;
  }

  _render() {
    const { _config: config, _hass: hass } = this;
    if (!config || !hass || !this._root) return;

    // Validate items - show message if invalid
    const items = config.items || [];
    const validItems = items.filter(item => item && item.entity);

    if (validItems.length === 0) {
      if (!this._container) {
        this._container = document.createElement('div');
        this._container.className = 'msic-container';
        this._root.appendChild(this._container);
      }
      this._container.innerHTML = '<div style="padding:16px;color:var(--secondary-text-color);">Add entities to display</div>';
      return;
    }

    const {
      icon_size = '20px',
      font_size = '11px',
      show_last_changed = true,
      columns = 3,
      color_on = 'green',
      color_off = 'red',
      title,
      name_position = 'below'
    } = config;

    this._root.style.cssText = 'padding:4px;margin:0;box-shadow:none;background:none';

    if (!this._container) {
      this._container = document.createElement('div');
      this._container.className = 'msic-container';
      this._root.appendChild(this._container);
    }

    // innerHTML replaces every item, so focus would drop to the page each time a watched
    // entity changes (including right after a keyboard toggle). Restore it afterwards.
    const active = this.getRootNode().activeElement;
    const focusedEntity = active && this._container.contains(active)
      ? active.closest('.msic-item')?.dataset.entity
      : null;

    const html = `
      ${title ? `<div class="msic-title">${this._escapeHtml(title)}</div>` : ''}
      <div class="msic-grid" style="grid-template-columns: repeat(${columns}, 1fr); font-size: ${font_size};">
        ${validItems.map(item => this._renderItem(item, hass, {
          icon_size, font_size, show_last_changed, color_on, color_off, name_position
        })).join('')}
      </div>
    `;

    this._container.innerHTML = html;

    if (focusedEntity) {
      this._container.querySelector(`.msic-item[data-entity="${CSS.escape(focusedEntity)}"]`)?.focus();
    }

    // Hydrate the HA-native relative-time elements. They self-update and localize, but
    // `hass` and `datetime` must be set as properties (they cannot be passed via innerHTML).
    this._container.querySelectorAll('ha-relative-time').forEach((element) => {
      element.hass = hass;
      element.datetime = element.dataset.datetime;
    });

    this._attachEventListeners();
  }

  _renderItem(item, hass, options) {
    const stateObj = hass.states[item.entity];
    const name = item.name || stateObj?.attributes?.friendly_name || item.entity;

    // Handle missing or unavailable entities
    if (!stateObj || ['unavailable', 'unknown'].includes(stateObj.state)) {
      return this._renderUnavailableItem(item, name, options);
    }

    const state = stateObj.state;
    const isOn = this._isOn(item.entity, stateObj);
    const color = isOn
      ? (item.color_on || options.color_on)
      : (item.color_off || options.color_off);
    const icon = isOn
      ? (item.icon_on || 'mdi:toggle-switch')
      : (item.icon_off || 'mdi:toggle-switch-off');

    // Check for item-level show_last_changed override, fall back to global
    const showLastChanged = item.show_last_changed !== undefined
      ? item.show_last_changed
      : options.show_last_changed;

    const nameHtml = `<div class="msic-name">${this._escapeHtml(name)}</div>`;
    const iconHtml = `<ha-icon icon="${icon}" style="color:${color};width:${options.icon_size};height:${options.icon_size};margin-bottom:2px"></ha-icon>`;

    // Use HA's native relative-time element (self-updating, localized) when shown. Always
    // reserve the row (hidden spacer when off) so items stay vertically aligned in the grid.
    const lastChangedHtml = showLastChanged
      ? `<ha-relative-time class="msic-time" data-datetime="${stateObj.last_changed}"></ha-relative-time>`
      : `<div class="msic-time" style="visibility:hidden">&nbsp;</div>`;

    const content = options.name_position === 'above'
      ? `${nameHtml}${iconHtml}${lastChangedHtml}`
      : `${iconHtml}${nameHtml}${lastChangedHtml}`;

    return `
      <div class="msic-item"
           data-entity="${item.entity}"
           role="button"
           tabindex="0"
           aria-label="${this._escapeHtml(name)}, ${state}, tap to toggle"
           aria-pressed="${isOn}"
           aria-keyshortcuts="Shift+Enter"
           title="Tap to toggle • Long press or Shift+Enter for details">
        ${content}
      </div>
    `;
  }

  _renderUnavailableItem(item, name, options) {
    // `data-entity` is included so a long-press can still open the more-info dialog (useful
    // for diagnosing the unavailable entity). The `msic-unavailable` class keeps click/toggle
    // disabled via the click handler's guard.
    return `
      <div class="msic-item msic-unavailable"
           data-entity="${item.entity}"
           role="button"
           tabindex="0"
           aria-disabled="true"
           aria-label="${this._escapeHtml(name)} is unavailable"
           aria-keyshortcuts="Shift+Enter"
           title="${this._escapeHtml(name)} is unavailable • Long press or Shift+Enter for details">
        <ha-icon icon="mdi:alert-circle-outline"
                 style="color:var(--secondary-text-color);width:${options.icon_size};height:${options.icon_size};margin-bottom:2px"></ha-icon>
        <div class="msic-name">${this._escapeHtml(name)}</div>
        <div class="msic-time">Unavailable</div>
      </div>
    `;
  }

  _isOn(entityId, stateObj) {
    const { state, attributes } = stateObj;
    const domain = entityId.split('.')[0];

    // Domain-specific logic for determining "on" state
    switch (domain) {
      case 'cover':
        return state === 'open' || (attributes.current_position || 0) > 0;
      case 'climate':
        return state !== 'off';
      case 'lock':
        return state === 'unlocked';
      case 'person':
      case 'device_tracker':
        return state === 'home';
      case 'media_player':
        return ['playing', 'on'].includes(state);
      case 'binary_sensor':
        return state === 'on';
      default:
        return state === 'on';
    }
  }

  _attachEventListeners() {
    if (this._eventListenerAttached || !this._container) return;

    // Event delegation for better performance
    this._container.addEventListener('click', (e) => {
      // A long-press already handled this interaction (opened more-info); swallow the
      // trailing click so the entity is not also toggled.
      if (this._longPressFired) {
        this._longPressFired = false;
        return;
      }
      const item = e.target.closest('.msic-item');
      if (!item || !item.dataset.entity || item.classList.contains('msic-unavailable')) return;
      this._handleItemClick(item.dataset.entity);
    });

    // Keyboard support: Enter or Space toggles; Shift+Enter opens more-info, the keyboard
    // equivalent of long-press (also for unavailable items, to help diagnose them)
    this._container.addEventListener('keydown', (e) => {
      const item = e.target.closest('.msic-item');
      if (!item || !item.dataset.entity) return;
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        this._showMoreInfo(item.dataset.entity);
      } else if ((e.key === 'Enter' || e.key === ' ') && !item.classList.contains('msic-unavailable')) {
        e.preventDefault();
        this._handleItemClick(item.dataset.entity);
      }
    });

    // Long-press for more-info dialog
    this._container.addEventListener('pointerdown', (e) => {
      const item = e.target.closest('.msic-item');
      if (!item || !item.dataset.entity) return;

      // Reset per interaction so a stale flag from a previous press cannot suppress a click
      this._longPressFired = false;
      this._pressTimer = setTimeout(() => {
        this._longPressFired = true;
        this._showMoreInfo(item.dataset.entity);
        this._pressTimer = null;
      }, 500);
    });

    this._container.addEventListener('pointerup', () => {
      if (this._pressTimer) {
        clearTimeout(this._pressTimer);
        this._pressTimer = null;
      }
    });

    this._container.addEventListener('pointercancel', () => {
      if (this._pressTimer) {
        clearTimeout(this._pressTimer);
        this._pressTimer = null;
      }
    });

    this._eventListenerAttached = true;
  }

  async _handleItemClick(entity) {
    try {
      const domain = entity.split('.')[0];
      const stateObj = this._hass.states[entity];
      if (!stateObj) return;

      const service = this._getService(domain, stateObj.state);

      if (service) {
        await this._hass.callService(domain, service, { entity_id: entity });
      }
    } catch (err) {
      this._showError(`Failed to toggle ${entity}: ${err.message}`);
    }
  }

  _getService(domain, state) {
    // Handle different entity domains
    const domainServices = {
      switch: 'toggle',
      light: 'toggle',
      input_boolean: 'toggle',
      automation: 'toggle',
      fan: 'toggle',
      cover: 'toggle',
      lock: (state) => state === 'locked' ? 'unlock' : 'lock',
      climate: (state) => state === 'off' ? 'turn_on' : 'turn_off',
      media_player: (state) => state === 'off' ? 'turn_on' : 'turn_off'
    };

    let service = domainServices[domain];
    if (typeof service === 'function') {
      service = service(state);
    }

    if (service) {
      return service;
    }

    // Fallback: try generic toggle or turn_on/turn_off
    const hasToggle = ['on', 'off'].includes(state);
    if (hasToggle) {
      return state === 'off' ? 'turn_on' : 'turn_off';
    }

    return null;
  }

  _showMoreInfo(entityId) {
    const event = new Event('hass-more-info', {
      bubbles: true,
      composed: true
    });
    event.detail = { entityId };
    this.dispatchEvent(event);
  }

  _showError(message) {
    const event = new Event('hass-notification', {
      bubbles: true,
      composed: true
    });
    event.detail = { message };
    this.dispatchEvent(event);
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getCardSize() {
    return Math.ceil((this._config?.items?.length || 0) / (this._config?.columns || 3));
  }

  // Sections view (grid layout) sizing. Derive the row count from the actual content so
  // longer entity lists are not clipped: roughly one grid row per row of indicators, plus
  // one for the title when present.
  getGridOptions() {
    const validItemCount = (this._config?.items || []).filter(item => item && item.entity).length;
    const columns = this._config?.columns || 3;
    const indicatorRows = Math.max(1, Math.ceil(validItemCount / columns));
    const titleRows = this._config?.title ? 1 : 0;

    return {
      rows: indicatorRows + titleRows,
      columns: 6,
      min_rows: 1,
      min_columns: 3,
    };
  }

  static getConfigElement() {
    return document.createElement('multi-status-indicator-card-editor');
  }

  static getStubConfig(hass) {
    const statusDomains = ['switch', 'binary_sensor', 'light', 'input_boolean'];
    const items = hass
      ? Object.keys(hass.states)
          .filter((id) => statusDomains.includes(id.split('.')[0]))
          .slice(0, 3)
          .map((id) => ({ entity: id }))
      : [{ entity: 'switch.example', name: 'Example' }];

    return { columns: 3, items };
  }
}

customElements.define('multi-status-indicator-card', MultiStatusIndicatorCard);
