# Lumenda Setup Guide

This guide will help you set up the development environment for Lumenda.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm** or **yarn**: Package manager
- **Git**: Version control
- **Clarinet**: Stacks smart contract development tool

## Step 1: Install Node.js

Download and install Node.js from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version
npm --version
```

## Step 2: Install Clarinet

### macOS/Linux
```bash
curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-installer.sh | bash
```

### Windows
Download the installer from [Clarinet releases](https://github.com/hirosystems/clarinet/releases)

Verify installation:
```bash
clarinet --version
```

## Step 3: Clone Repository

```bash
git clone https://github.com/your-username/lumenda-platform.git
cd lumenda-platform
```

## Step 4: Set Up Smart Contracts

```bash
cd contracts

# Initialize Clarinet (if not already done)
clarinet new . --name lumenda-contracts

# Install dependencies (if any)
clarinet install

# Verify setup
clarinet check
```

## Step 5: Set Up Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your configuration
```

## Step 6: Configure Environment

Create `.env.local` in `frontend/`:

```env
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ADDRESS=ST...
```

## Step 7: Start Development

### Start Local Stacks Node (for contract development)
```bash
cd contracts
clarinet integrate
```

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Step 8: Run Tests

### Contract Tests
```bash
cd contracts
clarinet test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Troubleshooting

### Clarinet Not Found
- Ensure Clarinet is in your PATH
- Restart terminal after installation
- Check installation: `which clarinet`

### Node Modules Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### Contract Check Fails
- Ensure all contracts are in correct directories
- Check Clarinet.toml configuration
- Verify Clarity syntax

## Next Steps

1. Read [Architecture Documentation](architecture.md)
2. Review [Security Guidelines](security.md)
3. Check [Project Plan](../documents/lumenda-project-plan.md)
4. Start with Month 1: Core Contract Development

## Development Workflow

1. **Make Changes**: Edit code in appropriate directory
2. **Test Locally**: Run tests before committing
3. **Check Contracts**: `clarinet check` for contracts
4. **Lint Frontend**: `npm run lint` for frontend
5. **Commit**: Follow [Contributing Guidelines](../CONTRIBUTING.md)

## Resources

- [Stacks Documentation](https://docs.stacks.co/)
- [Clarinet Documentation](https://docs.hiro.so/clarinet/)
- [Stacks.js Documentation](https://stacks.js.org/)

---

Happy coding! 🚀
