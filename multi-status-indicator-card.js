window.customCards = window.customCards || [];
window.customCards.push({
  type: 'multi-status-indicator-card',
  name: 'Multi Status Indicator Card',
  description: 'A grid display for multiple entity status indicators with toggle support'
});

console.info(
  `%c MULTI-STATUS-INDICATOR-CARD %c v2.3.1 `,
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
      colorOnField.label = 'Color (On)';
      colorOnField.value = item.color_on || '';
      colorOnField.addEventListener('value-changed', (e) => {
        e.stopPropagation();
        this._updateEntity(index, 'color_on', e.detail.value);
      });
      colorOnDiv.appendChild(colorOnField);
      colorRow.appendChild(colorOnDiv);

      const colorOffDiv = document.createElement('div');
      colorOffDiv.className = 'field';
      const colorOffField = document.createElement('ha-selector');
      colorOffField.hass = this._hass;
      colorOffField.selector = { text: {} };
      colorOffField.label = 'Color (Off)';
      colorOffField.value = item.color_off || '';
      colorOffField.addEventListener('value-changed', (e) => {
        e.stopPropagation();
        this._updateEntity(index, 'color_off', e.detail.value);
      });
      colorOffDiv.appendChild(colorOffField);
      colorRow.appendChild(colorOffDiv);

      content.appendChild(colorRow);

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = 'Remove';
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
        .toggle-row { display: flex; justify-content: space-between; align-items: center; height: 56px; }
        .add-btn {
          width: 100%; padding: 12px; margin-top: 8px;
          background: var(--primary-color); color: var(--text-primary-color, #fff);
          border: none; border-radius: 4px; cursor: pointer; font-size: 14px;
        }
        .remove-btn {
          width: 100%; padding: 8px; margin-top: 8px;
          background: var(--error-color, #db4437); color: #fff;
          border: none; border-radius: 4px; cursor: pointer;
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
            <div class="toggle-row">
              <span>Show Last Changed</span>
              <ha-switch id="show_last_changed"></ha-switch>
            </div>
          </div>
        </ha-expansion-panel>
        <ha-expansion-panel outlined expanded header="Entities">
          <div class="panel-content">
            <div id="entities-list"></div>
            <button class="add-btn" id="add-entity">Add Entity</button>
          </div>
        </ha-expansion-panel>
      </div>
    `;

    // Card settings - initialize ha-selector elements (properties set here after innerHTML)
    const title = this.shadowRoot.getElementById('title');
    title.hass = this._hass;
    title.selector = { text: {} };
    title.label = 'Title';
    title.value = this._config.title || '';
    title.addEventListener('value-changed', (e) => { e.stopPropagation(); this._config.title = e.detail.value || undefined; this._fire(); });

    const columns = this.shadowRoot.getElementById('columns');
    columns.hass = this._hass;
    columns.selector = { number: { mode: 'box', step: 1, min: 1, max: 20 } };
    columns.label = 'Columns';
    columns.value = this._config.columns ?? '';
    columns.addEventListener('value-changed', (e) => { e.stopPropagation(); this._config.columns = e.detail.value ? Number(e.detail.value) : undefined; this._fire(); });

    const iconSize = this.shadowRoot.getElementById('icon_size');
    iconSize.hass = this._hass;
    iconSize.selector = { text: {} };
    iconSize.label = 'Icon Size';
    iconSize.value = this._config.icon_size || '';
    iconSize.addEventListener('value-changed', (e) => { e.stopPropagation(); this._config.icon_size = e.detail.value || undefined; this._fire(); });

    const fontSize = this.shadowRoot.getElementById('font_size');
    fontSize.hass = this._hass;
    fontSize.selector = { text: {} };
    fontSize.label = 'Font Size';
    fontSize.value = this._config.font_size || '';
    fontSize.addEventListener('value-changed', (e) => { e.stopPropagation(); this._config.font_size = e.detail.value || undefined; this._fire(); });

    const colorOn = this.shadowRoot.getElementById('color_on');
    colorOn.hass = this._hass;
    colorOn.selector = { text: {} };
    colorOn.label = 'Color (On)';
    colorOn.value = this._config.color_on || '';
    colorOn.addEventListener('value-changed', (e) => { e.stopPropagation(); this._config.color_on = e.detail.value || undefined; this._fire(); });

    const colorOff = this.shadowRoot.getElementById('color_off');
    colorOff.hass = this._hass;
    colorOff.selector = { text: {} };
    colorOff.label = 'Color (Off)';
    colorOff.value = this._config.color_off || '';
    colorOff.addEventListener('value-changed', (e) => { e.stopPropagation(); this._config.color_off = e.detail.value || undefined; this._fire(); });

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
    this._styleElement = null;
    this._eventListenerAttached = false;
    this._pressTimer = null;
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
      this._root = document.createElement('ha-card');
      this.appendChild(this._root);
      this._createStyles();
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

  _createStyles() {
    if (this._styleElement) return;

    this._styleElement = document.createElement('style');
    this._styleElement.textContent = `
      :host {
        display: block;
      }
      .card-container {
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .card-title {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 4px 0;
      }
      .status-grid {
        display: grid;
        gap: 4px;
      }
      .status-item {
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
      .status-item:hover {
        background-color: var(--ha-card-background, var(--card-background-color, rgba(128, 128, 128, 0.1)));
      }
      .status-item:active {
        transform: scale(0.95);
      }
      .status-item:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      .status-item.unavailable {
        opacity: 0.5;
        cursor: default;
      }
      .status-item.unavailable:hover {
        background-color: transparent;
      }
      .status-item.unavailable:active {
        transform: none;
      }
      .item-name {
        text-align: center;
      }
      .item-time {
        font-size: 10px;
        color: var(--secondary-text-color);
      }
    `;
    this._root.appendChild(this._styleElement);
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
        this._container.className = 'card-container';
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
      this._container.className = 'card-container';
      this._root.appendChild(this._container);
    }

    const html = `
      ${title ? `<div class="card-title">${this._escapeHtml(title)}</div>` : ''}
      <div class="status-grid" style="grid-template-columns: repeat(${columns}, 1fr); font-size: ${font_size};">
        ${validItems.map(item => this._renderItem(item, hass, {
          icon_size, font_size, show_last_changed, color_on, color_off, name_position
        })).join('')}
      </div>
    `;

    this._container.innerHTML = html;
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

    const nameHtml = `<div class="item-name">${this._escapeHtml(name)}</div>`;
    const iconHtml = `<ha-icon icon="${icon}" style="color:${color};width:${options.icon_size};height:${options.icon_size};margin-bottom:2px"></ha-icon>`;

    // Always render time container for consistent alignment, but make invisible when not shown
    const lastChangedHtml = `<div class="item-time" style="visibility:${showLastChanged ? 'visible' : 'hidden'}">${showLastChanged ? this._formatTime(stateObj.last_changed, hass) : '&nbsp;'}</div>`;

    const content = options.name_position === 'above'
      ? `${nameHtml}${iconHtml}${lastChangedHtml}`
      : `${iconHtml}${nameHtml}${lastChangedHtml}`;

    return `
      <div class="status-item"
           data-entity="${item.entity}"
           role="button"
           tabindex="0"
           aria-label="${this._escapeHtml(name)}, ${state}, tap to toggle"
           aria-pressed="${isOn}"
           title="Tap to toggle • Long press for details">
        ${content}
      </div>
    `;
  }

  _renderUnavailableItem(item, name, options) {
    return `
      <div class="status-item unavailable"
           role="status"
           aria-label="${this._escapeHtml(name)} is unavailable"
           title="${this._escapeHtml(name)} is unavailable">
        <ha-icon icon="mdi:alert-circle-outline"
                 style="color:var(--disabled-text-color);width:${options.icon_size};height:${options.icon_size};margin-bottom:2px"></ha-icon>
        <div class="item-name">${this._escapeHtml(name)}</div>
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
      const item = e.target.closest('.status-item');
      if (!item || !item.dataset.entity || item.classList.contains('unavailable')) return;
      this._handleItemClick(item.dataset.entity);
    });

    // Keyboard navigation support
    this._container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const item = e.target.closest('.status-item');
        if (item && item.dataset.entity && !item.classList.contains('unavailable')) {
          e.preventDefault();
          this._handleItemClick(item.dataset.entity);
        }
      }
    });

    // Long-press for more-info dialog
    this._container.addEventListener('pointerdown', (e) => {
      const item = e.target.closest('.status-item');
      if (!item || !item.dataset.entity) return;

      this._pressTimer = setTimeout(() => {
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

  _formatTime(timestamp, hass) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(hass.locale?.language || 'en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getCardSize() {
    return Math.ceil((this._config?.items?.length || 0) / (this._config?.columns || 3));
  }

  // Sections view (grid layout) sizing - 12-column grid system
  getGridOptions() {
    return {
      rows: 2,
      columns: 6,
      min_rows: 1,
      min_columns: 3,
    };
  }

  static getConfigElement() {
    return document.createElement('multi-status-indicator-card-editor');
  }

  static getStubConfig() {
    return {
      columns: 3,
      items: [
        { entity: 'switch.example', name: 'Example' }
      ]
    };
  }
}

customElements.define('multi-status-indicator-card', MultiStatusIndicatorCard);
