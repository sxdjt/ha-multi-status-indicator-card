# Multi Status Indicator Card

![GitHub Release](https://img.shields.io/github/v/release/sxdjt/ha-multi-status-indicator-card?style=for-the-badge)
[![AI Assisted](https://img.shields.io/badge/AI-Claude%20Code-AAAAAA.svg?style=for-the-badge)](https://claude.ai/code)
![GitHub License](https://img.shields.io/github/license/sxdjt/ha-multi-status-indicator-card?style=for-the-badge)

A compact, configurable [Home Assistant](https://www.home-assistant.io/) custom card that displays multiple entity states as labeled icons in a flexible grid layout. Supports tap-to-toggle, state-based coloring, last-changed timestamps, and multiple entity types.

Yes, this is similar to the default HA [Glance card](https://www.home-assistant.io/dashboards/glance/), but I wanted something more compact.

<img width="512" alt="Screenshot 2025-05-28 at 21 42 25" src="https://github.com/user-attachments/assets/bc2fc940-5a3e-447e-8830-225fa1f77708" />

---

## Features

- Compact layout optimized for dashboards
- Configurable number of columns
- Tap-to-toggle support for multiple entity types (switches, lights, locks, covers, fans, automations, and more)
- Custom icons for on/off states
- State-based color indicators
- Global and per-item customization
- Long-press support for more-info dialog
- Works great for sprinklers, lights, zones, locks, and more

---

## Installation

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sxdjt&repository=ha-multi-status-indicator-card)
   

## Configuration

| Option              | Type    | Default   | Description                                     |
| ------------------- | ------- | --------- | ----------------------------------------------- |
| `color_off`         | string  | `"red"`   | Default color when entity is OFF                |
| `color_on`          | string  | `"green"` | Default color when entity is ON                 |
| `columns`           | number  | 3         | Number of columns in the grid layout            |
| `font_size`         | string  | `"11px"`  | Font size for item names                        |
| `icon_size`         | string  | `"20px"`  | Size of the icons                               |
| `items`             | array   | -         | List of entities to show (see below)            |
| `name_position`     | string  | `"below"` | Position of entity name: `"above"` or `"below"` |
| `show_last_changed` | boolean | `true`    | Show last-changed timestamp                     |
| `title`             | string  | -         | Optional card title                             |

Every option, card-level and per-item, can also be set in the visual editor.

### Item Options

| Option              | Type    | Default                             | Description                              |
| ------------------- | ------- | ----------------------------------- | ---------------------------------------- |
| `color_off`         | string  | Inherits from global `color_off`    | Override OFF color for this item         |
| `color_on`          | string  | Inherits from global `color_on`     | Override ON color for this item          |
| `entity`            | string  | -                                   | The entity to monitor (required)         |
| `icon_off`          | string  | `'mdi:toggle-switch-off'`           | Icon when state is OFF                   |
| `icon_on`           | string  | `'mdi:toggle-switch'`               | Icon when state is ON                    |
| `name`              | string  | Friendly name or entity ID fallback | Label shown with the icon                |
| `show_last_changed` | boolean | Inherits from global setting        | Override show_last_changed for this item |

Items without an `entity` are skipped.

## Supported Entity Types

Tapping an item calls a service based on the entity's domain:

- `switch` - toggle
- `light` - toggle
- `input_boolean` - toggle
- `automation` - toggle
- `fan` - toggle
- `cover` - toggle (open/close)
- `lock` - lock/unlock
- `climate` - turn_on/turn_off
- `media_player` - turn_off when shown ON (`playing`, `on`), otherwise turn_on

For any other domain whose state is exactly `on` or `off` (for example `group`, `siren`, `humidifier`), the card calls `homeassistant.turn_on` or `homeassistant.turn_off`.

Tapping does nothing for read-only domains (`binary_sensor`, `sensor`, `person`, `device_tracker`, `sun`, `weather`, `zone`, `event`) and for any other entity whose state is not `on`/`off`. Those items still show their state and open more-info on long-press, and screen readers do not announce them as toggles.

### When an item counts as ON

ON uses `icon_on` and `color_on`; everything else uses the OFF icon and color.

| Domain                     | ON when                                          |
| -------------------------- | ------------------------------------------------ |
| `cover`                    | state is `open`, or `current_position` is above 0 |
| `climate`                  | state is anything except `off`                   |
| `lock`                     | state is `unlocked`                              |
| `media_player`             | state is `playing` or `on`                       |
| `person`, `device_tracker` | state is `home`                                  |
| all others                 | state is `on`                                    |

An entity that is missing, `unavailable` or `unknown` shows a muted alert icon and an "Unavailable" label instead of its colors. It cannot be toggled, but long-press still opens its more-info dialog.

## Interaction

| Action                                | Result                 |
| ------------------------------------- | ---------------------- |
| Tap, click, Enter or Space            | Toggle the entity      |
| Long-press (0.5 s) or Shift+Enter     | Open more-info dialog  |

## Example Usage

```yaml
type: custom:multi-status-indicator-card
title: Sprinkler Zones
columns: 6
color_on: "#11FF11"
color_off: "#FF1111"
icon_size: "22px"
font_size: "12px"
show_last_changed: true
name_position: below
items:
  - entity: switch.zone_1
    name: 1
  - entity: switch.zone_2
    name: 2
  - entity: switch.zone_3
    name: 3
  - entity: switch.zone_4
    name: 4
  - entity: switch.zone_5
    name: 5
  - entity: switch.zone_6
    name: 6
```

### Multi-Entity Type Example

```yaml
type: custom:multi-status-indicator-card
title: Home Status
columns: 4
name_position: above
items:
  - entity: light.living_room
    name: Living Room
    icon_on: mdi:lightbulb-on
    icon_off: mdi:lightbulb-off
  - entity: lock.front_door
    name: Front Door
    icon_on: mdi:lock-open
    icon_off: mdi:lock
  - entity: cover.garage_door
    name: Garage
    icon_on: mdi:garage-open
    icon_off: mdi:garage
  - entity: fan.bedroom
    name: Bedroom Fan
    icon_on: mdi:fan
    icon_off: mdi:fan-off
```

### Per-Item Override Example

```yaml
type: custom:multi-status-indicator-card
title: Mixed Display
columns: 3
show_last_changed: true
items:
  - entity: switch.zone_1
    name: Zone 1
    # Uses global show_last_changed: true
  - entity: switch.zone_2
    name: Zone 2
    show_last_changed: false
    # Hides timestamp for this item only
  - entity: switch.zone_3
    name: Zone 3
    color_on: "#FFC107"
    color_off: "#607D8B"
    # Custom colors for this item
```
