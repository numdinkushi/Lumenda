# Lumenda - Decentralized Remittance Platform

> Fast, low-cost international money transfers secured by Bitcoin

## Overview

Lumenda is a decentralized remittance platform built on Stacks (Bitcoin L2) that enables fast, low-cost international money transfers. By leveraging Bitcoin's security and Stacks' programmability, Lumenda provides a transparent, secure, and affordable alternative to traditional remittance services.

## Features

- 🚀 **Fast Transfers**: Near-instant settlement using Stacks blockchain
- 💰 **Low Fees**: 1-2% transaction fees (vs 5-10% traditional)
- 🔒 **Secure**: Transactions secured by Bitcoin's blockchain
- 🌍 **Global**: Send money anywhere, anytime
- 💳 **Multi-Currency**: Support for STX, sBTC, and stablecoins
- ✅ **Compliant**: Built-in KYC/AML features

## Project Structure

```
lumenda-platform/
├── contracts/          # Clarity smart contracts
│   ├── core/          # Core remittance contracts
│   ├── fees/          # Fee calculation contracts
│   ├── limits/        # Transaction limits
│   ├── verification/  # KYC/verification contracts
│   └── tests/         # Contract tests
├── frontend/          # React/Next.js frontend
├── api/               # Backend API (if needed)
├── mobile/            # Mobile app (React Native)
└── docs/              # Documentation

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Clarinet (for contract development)
- Stacks wallet (Hiro Wallet or Xverse)

### Installation

```bash
# Install Clarinet
curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-installer.sh | bash

# Install frontend dependencies
cd frontend
npm install

# Install contract dependencies
cd ../contracts
clarinet install
```

### Development

```bash
# Start local Stacks node
clarinet integrate

# Run contract tests
clarinet test

# Start frontend dev server
cd frontend
npm run dev
```

## Deployment

Contracts are deployment-ready. Use testnet for public testing; mainnet only after security review. **No hardcoded credentials:** deployer address comes from `.env`.

- **Docs:** [documents/DEPLOYMENT-STATUS.md](documents/DEPLOYMENT-STATUS.md) — checklist, devnet/testnet/mainnet steps
- **Env:** Copy `env.example` to `.env` and set `DEPLOYER_ADDRESS` (your STX address). Never commit `.env`.
- **Scripts:** From repo root:
  - `./scripts/generate-testnet-plan.sh` — build testnet plan from template + `.env`; then `cd contracts && clarinet deployments apply --testnet`
  - `./scripts/prepare-deploy-mainnet.sh` — verify + generate mainnet plan (apply only after audit)

## Architecture

Lumenda follows a modular, SOLID architecture:

- **Smart Contracts**: Clarity contracts for core remittance logic
- **Frontend**: React/Next.js with Stacks.js integration
- **Security**: Multi-layer security with escrow, limits, and verification

See [docs/architecture.md](docs/architecture.md) for detailed architecture.

## Code for STX

This project participates in the Code for STX program. Each month, we submit meaningful PRs that add new features, enhance security, or improve functionality.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

This project is open source. See [LICENSE](LICENSE) for details.

## Security

Security is paramount. See [docs/security.md](docs/security.md) for security considerations and best practices.

## Documentation

- [Project Plan](documents/lumenda-project-plan.md)
- [Architecture](docs/architecture.md)
- [Security](docs/security.md)

## Status

🚧 **In Development** - Phase 0: Foundation & Setup

## Contact

For questions or support, please open an issue or contact the team.

---

Built with ❤️ on Stacks (Bitcoin L2)
