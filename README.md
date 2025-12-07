# TableTrace

[🇯🇵 日本語](./README.ja.md)

Real-time visualization of database changes across multiple tables.

<p align="center">
  <img src="public/TableTraceServiceImage.png" alt="TableTrace" width="600">
</p>

## Features

- **Real-time Table Watching** - Monitor INSERT, UPDATE, DELETE operations as they happen
- **Multi-table View** - Watch multiple tables simultaneously with color-coded changes
- **Event Timeline** - Chronological view of all database changes with correlation grouping
- **ERD Visualization** - Interactive Entity Relationship Diagram
  - Drag-and-drop table positioning
  - Foreign key relationship lines with cardinality notation
  - Schema filtering
  - Table detail panel on hover
- **Dry Run Mode** - Test SQL queries safely (changes are rolled back, database is not modified)
- **Change Highlighting**
  - Green: INSERT (new rows)
  - Yellow: UPDATE (modified rows)
  - Red: DELETE (removed rows)

## Supported Databases

- PostgreSQL (Local)
- Supabase (Local development via Docker)

## Quick Start (with Sample Database)

Try TableTrace with a pre-configured sample database:

```bash
# 1. Start sample PostgreSQL
docker compose -f demo/docker-compose.yml up -d

# 2. Run TableTrace
npm run tauri dev

# 3. Connect with these settings:
#    Host: localhost
#    Port: 5432
#    Database: tabletrace_sample
#    User: postgres
#    Password: postgres
```

Test database changes:

```bash
# INSERT
docker exec tabletrace-postgres psql -U postgres -d tabletrace_sample \
  -c "INSERT INTO users (name, email) VALUES ('Test User', 'test@example.com');"

# UPDATE
docker exec tabletrace-postgres psql -U postgres -d tabletrace_sample \
  -c "UPDATE products SET price = 39.99 WHERE id = 1;"

# DELETE
docker exec tabletrace-postgres psql -U postgres -d tabletrace_sample \
  -c "DELETE FROM users WHERE email = 'charlie@example.com';"
```

Stop the sample database:

```bash
docker compose -f demo/docker-compose.yml down -v
```

## Installation

### Prerequisites

- [Rust](https://rustup.rs/) (1.70+)
- [Node.js](https://nodejs.org/) (20.19+ or 22.12+)
- [Tauri CLI](https://tauri.app/start/prerequisites/)

### Development

```bash
# Clone the repository
git clone https://github.com/monorka/tabletrace-oss.git
cd tabletrace-oss

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

## Usage

1. Click "Connect" and enter your PostgreSQL connection details
2. Click on tables in the sidebar to start watching
3. Changes appear in real-time with color-coded highlights
4. Switch to ERD tab to visualize table relationships
5. Use Dry Run to test SQL queries without committing

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS |
| Backend | Rust, Tauri 2 |
| Database | PostgreSQL (tokio-postgres) |
| Visualization | React Flow, Dagre |

## License

[AGPL-3.0](LICENSE)

## Contributing

Pull requests welcome.

## Pro Version (Planned)

- Supabase Cloud connection with Logical Replication
- Real-time change propagation visualization
- Export (PNG/SVG/PDF)
- Multiple connections
