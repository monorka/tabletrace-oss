# Contributing to TableTrace

Thank you for your interest in contributing to TableTrace!

## Contributor License Agreement (CLA)

By submitting a pull request, you agree to our [Contributor License Agreement](https://gist.github.com/monorka-dev/98d2f22fea73c75ebf8cea1b7d205388).

This allows us to:
- Keep the open source version under AGPL-3.0
- Use contributions in commercial products

### How to Sign

When you open a PR, the CLA Assistant bot will comment with a link. Click the link and authorize with GitHub to sign. The check will pass automatically after signing.

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists
2. Create a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (OS, version, etc.)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch from `develop`
   ```bash
   git checkout develop
   git checkout -b feature/your-feature
   ```
3. Make your changes
4. Run tests and linting
   ```bash
   npm run lint
   npm run typecheck
   cd src-tauri && cargo clippy
   ```
5. Commit with a clear message
   ```bash
   git commit -m "feat: add new feature"
   ```
6. Push and create a PR to `develop`

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting (no code change)
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

### Code Style

- **TypeScript/React**: ESLint rules in `eslint.config.js`
- **Rust**: `cargo fmt` and `cargo clippy`

## Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Run with sample database
docker compose -f demo/docker-compose.yml up -d
```

## Questions?

Feel free to open an issue or discussion.

