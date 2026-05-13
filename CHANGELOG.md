# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.1] - 2026-05-13

### Fixed
- Replace deprecated `ha-textfield` with `ha-selector` in visual editor for compatibility with HA 2026.5.1+
- Add `getGridOptions()` and `height: 100%` for correct sizing in HA sections view

### Changed
- Standardize console.info banner colors

## [2.3.0] - 2026-02-03

### Added
- **Visual Editor**: Full GUI configuration without YAML
  - Card Settings panel: title, columns, icon size, font size, colors, show last changed toggle
  - Entities panel: add/remove entities with expansion panels for each
  - Per-entity customization: entity picker, custom name, icon on/off, color on/off overrides
  - Live preview updates as you configure

### Changed
- **Editor-friendly validation**: Card no longer throws errors during editing, shows placeholder message instead
- **Graceful handling**: Invalid or incomplete configs display helpful "Add entities to display" message

### Fixed
- Card preview now renders correctly in the visual editor
- Fixed crash when items array was undefined or empty

## [2.2.0] - 2025-11-26

### Performance
- **Optimized render updates**: Card now only re-renders when configured entities actually change state, not on every Home Assistant state update
- **Change detection**: Added `_hasEntitiesChanged()` method to intelligently compare entity states
- **Dramatic performance improvement**: Eliminates unnecessary re-renders in systems with many entities updating frequently

### Fixed
- Performance issue where card re-rendered on every HA state update (reported in issue #1)

## [2.1.0] - 2025-01-25

### Added
- **Per-item `show_last_changed` override**: Individual items can now override the global `show_last_changed` setting
- **Full accessibility support**:
  - Keyboard navigation with Tab, Enter, and Space keys
  - ARIA labels and roles for screen readers
  - Focus indicators with visible outline
- **Long-press support**: Hold any item for 500ms to open the more-info dialog
- **Unavailable state handling**: Entities that are unavailable or unknown now display a grayed-out alert icon instead of being hidden
- **Error notifications**: Failed service calls now show toast notifications with error details

### Changed
- **Event handling**: Switched to event delegation pattern for better performance (single event listeners instead of per-item)
- **DOM architecture**: Styles and container are now created once and persisted, with only content updated on state changes
- **Smart state detection**: Domain-aware logic for determining "on" state (covers check position, climate ignores "off", etc.)

### Fixed
- **Icon alignment**: Icons now properly align when mixing items with and without timestamps using visibility-based spacing
- **Render thrashing**: Eliminated constant DOM recreation that caused flickering
- **State object access**: Fixed bug where `entity_id` was incorrectly accessed from state object

### Performance
- Reduced re-renders through better component lifecycle management
- Event delegation eliminates need to re-attach listeners on every render
- Persistent style elements prevent CSS re-parsing

## [2.0.0] - 2024-05-28

### Added
- **Multi-entity type support**: Toggle switches, lights, locks, covers, fans, automations, climate, and media players
- **Name positioning**: Configurable `name_position` option to display entity names above or below icons
- **Smart card sizing**: Dynamic height calculation based on content
- **UI editor hooks**: Added `getConfigElement()` and `getStubConfig()` for future visual editor support

### Changed
- **Rendering approach**: Switched to template-based rendering for ~50% performance improvement
- **Security**: All user-provided content is now HTML-escaped to prevent XSS attacks
- **Code architecture**: Cleaner separation of concerns and better maintainability

### Fixed
- Multiple entity type handling with domain-specific service calls
- Improved error handling for missing entities

## [0.1.0] - Initial Release

### Added
- Basic multi-status indicator card
- Grid layout with configurable columns
- On/off state coloring
- Custom icons
- Last changed timestamps
- Tap-to-toggle for switches
