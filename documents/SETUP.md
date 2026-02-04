# Quick Setup Instructions

## Prerequisites Installation

### 1. Install Clarinet
```bash
curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-installer.sh | bash
```

### 2. Install Node.js
Download from [nodejs.org](https://nodejs.org/) (v18+)

### 3. Verify Installation
```bash
clarinet --version
node --version
npm --version
```

## Project Setup

### Contracts
```bash
cd contracts
clarinet install  # When dependencies are added
clarinet check
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Next Steps

See [docs/setup-guide.md](docs/setup-guide.md) for detailed setup instructions.
