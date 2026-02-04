# Contributing to Lumenda

Thank you for your interest in contributing to Lumenda! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## Development Workflow

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/lumenda-platform.git
cd lumenda-platform
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Follow SOLID principles
- Write clean, modular code
- Add tests for new features
- Update documentation as needed

### 4. Test Your Changes

```bash
# Test contracts
cd lumenda-contracts
clarinet test

# Test frontend
cd ../lumenda-frontend
npm test
```

### 5. Commit Your Changes

```bash
git commit -m "feat: add new feature description"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Standards

### Clarity Contracts

- Use clear, descriptive function names
- Add comments for complex logic
- Follow Clarity best practices
- Ensure all contracts pass `clarinet check`
- Maintain 80%+ test coverage

### Frontend

- Use TypeScript
- Follow React best practices
- Use modular component structure
- Add PropTypes or TypeScript types
- Write unit tests

### Git Commits

- Write clear, descriptive commit messages
- Keep commits focused (one feature/fix per commit)
- Reference issues when applicable

## Testing Requirements

- All new features must include tests
- Contract tests must pass
- Frontend tests must pass
- No breaking changes without migration guide

## Documentation

- Update README if adding new features
- Document new functions/APIs
- Add examples for complex features
- Update architecture docs if structure changes

## Pull Request Process

1. Ensure all tests pass
2. Update documentation
3. Request review from maintainers
4. Address feedback
5. Wait for approval before merging

## Questions?

Open an issue or reach out to the maintainers.

Thank you for contributing to Lumenda! 🚀
