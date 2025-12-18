# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

### Changed

### Fixed

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
[Unreleased]: https://github.com/monorka/tabletrace-oss/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/monorka/tabletrace-oss/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/monorka/tabletrace-oss/releases/tag/v0.1.0


