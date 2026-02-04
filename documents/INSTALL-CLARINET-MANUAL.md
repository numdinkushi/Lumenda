# Manual Clarinet Installation Guide

## Quick Install (Recommended)

### Step 1: Download Clarinet

Visit: https://github.com/hirosystems/clarinet/releases/latest

Download the macOS version: `clarinet-v1.7.1-x86_64-apple-darwin.tar.gz`

Or use this command:
```bash
cd ~/Downloads
curl -L -O https://github.com/hirosystems/clarinet/releases/download/v1.7.1/clarinet-v1.7.1-x86_64-apple-darwin.tar.gz
```

### Step 2: Extract and Install

```bash
# Extract
tar -xzf clarinet-v1.7.1-x86_64-apple-darwin.tar.gz

# Move to local bin (no sudo needed)
mkdir -p ~/.local/bin
mv clarinet ~/.local/bin/
chmod +x ~/.local/bin/clarinet
```

### Step 3: Add to PATH

```bash
# Add to your shell profile
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc

# Reload shell
source ~/.zshrc
```

### Step 4: Verify

```bash
clarinet --version
```

You should see: `clarinet 1.7.1` or similar

## Alternative: Install via Cargo (if Rust is installed)

```bash
cargo install clarinet
```

## After Installation

Once Clarinet is installed, you can:

```bash
cd contracts
clarinet check
clarinet test
```

---

**Note**: If you encounter any issues, check the official docs:
https://docs.hiro.so/clarinet/how-to-guides/how-to-install-clarinet
