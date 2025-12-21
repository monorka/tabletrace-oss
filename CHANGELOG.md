# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

### Changed

### Fixed

---

## [0.3.0] - 2025-12-16

### Refactored
- **Frontend Architecture**: Improved code organization and maintainability
  - Split `connectionStore.ts` into modular structure (connection/, watching/, events/, tables/)
  - Separated `lib/tauri.ts` into focused modules (types.ts, dto.ts, commands.ts, events.ts)
  - Moved pure functions to `logic/` directory for better testability
  - Reduced main store file from ~617 lines to ~100 lines (84% reduction)
- **Backend Architecture**: Introduced service layer and DTO pattern
  - Split `commands/mod.rs` into focused modules (connection.rs, schema.rs, watching.rs, supabase.rs)
  - Added `services/` layer for business logic separation
  - Added `shared/` directory for shared types and DTOs
  - Implemented DTO pattern for all Tauri command inputs/outputs
- **Code Organization**: Standardized directory structure and import paths
  - Organized directory structure with clear separation of concerns
  - Migrated to `@/` alias for cleaner import paths
  - Maintained backward compatibility through re-exports

### Technical Improvements
- Improved type safety with DTO pattern at Tauri boundary
- Enhanced testability through pure function extraction
- Better maintainability with reduced file sizes and clear responsibilities
- Clearer architecture flow: Component → Store → Commands → Services → DB

---

## [0.2.0] - 2025-12-18

### Changed
- Improved UI design and user experience across the application
- Enhanced visual consistency and modern design elements

---

## [0.1.0] - 2025-12-07

### Added
- Real-time table watching with polling-based change detection
- Multi-table view with color-coded changes (INSERT/UPDATE/DELETE)
- ERD visualization with foreign key relationships
- Dry Run mode for SQL preview without committing
- Event timeline with correlation grouping
- PostgreSQL and Supabase Local support
- Connection error detection with reconnect banner
- Demo database for testing (`demo/docker-compose.yml`)
- Auto-update checker (disabled in development mode)

### Technical
- Tauri 2 + React 19 + TypeScript
- Zustand for state management
- React Flow for ERD visualization

---

<!-- Links -->
[Unreleased]: https://github.com/monorka/tabletrace-oss/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/monorka/tabletrace-oss/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/monorka/tabletrace-oss/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/monorka/tabletrace-oss/releases/tag/v0.1.0


