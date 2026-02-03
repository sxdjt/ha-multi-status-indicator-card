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

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sxdjt&repository=multi-status-indicator-card)
   

## Configuration

| Option              | Type    | Default   | Description                                    |
| ------------------- | ------- | --------- | ---------------------------------------------- |
| `title`             | string  | —         | Optional card title                            |
| `columns`           | number  | 3         | Number of columns in the grid layout           |
| `color_on`          | string  | `"green"` | Default color when entity is ON                |
| `color_off`         | string  | `"red"`   | Default color when entity is OFF               |
| `icon_size`         | string  | `"20px"`  | Size of the icons                              |
| `font_size`         | string  | `"11px"`  | Font size for item names                       |
| `show_last_changed` | boolean | `true`    | Show last-changed timestamp                    |
| `name_position`     | string  | `"below"` | Position of entity name: `"above"` or `"below"` |
| `items`             | array   | —         | List of entities to show (see below)           |

### Item Options

| Option              | Type    | Default                             | Description                                |
| ------------------- | ------- | ----------------------------------- | ------------------------------------------ |
| `entity`            | string  | —                                   | The entity to monitor (required)           |
| `name`              | string  | Friendly name or entity ID fallback | Label shown with the icon                  |
| `icon_on`           | string  | `'mdi:toggle-switch'`               | Icon when state is ON                      |
| `icon_off`          | string  | `'mdi:toggle-switch-off'`           | Icon when state is OFF                     |
| `color_on`          | string  | Inherits from global `color_on`     | Override ON color for this item            |
| `color_off`         | string  | Inherits from global `color_off`    | Override OFF color for this item           |
| `show_last_changed` | boolean | Inherits from global setting        | Override show_last_changed for this item   |

## Supported Entity Types

The card automatically handles toggling for these entity domains:

- `switch` - toggle
- `light` - toggle
- `input_boolean` - toggle
- `automation` - toggle
- `fan` - toggle
- `cover` - toggle (open/close)
- `lock` - lock/unlock
- `climate` - turn_on/turn_off
- `media_player` - turn_on/turn_off

For other entity types with on/off states, the card will attempt a generic turn_on/turn_off service call.


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
