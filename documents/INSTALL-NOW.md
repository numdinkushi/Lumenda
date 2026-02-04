# Install Clarinet Now - Quick Guide

## Your System: macOS ARM64 (Apple Silicon)

## Method 1: Direct Download (Recommended)

1. **Open your browser** and go to:
   https://github.com/hirosystems/clarinet/releases/latest

2. **Download** the file:
   `clarinet-v1.7.1-aarch64-apple-darwin.tar.gz`
   (or the latest version for `aarch64-apple-darwin`)

3. **Open Terminal** and run:

```bash
# Navigate to Downloads
cd ~/Downloads

# Extract
tar -xzf clarinet-*.tar.gz

# Create bin directory
mkdir -p ~/.local/bin

# Move clarinet
mv clarinet ~/.local/bin/

# Make executable
chmod +x ~/.local/bin/clarinet

# Add to PATH (if not already done)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc

# Reload shell
source ~/.zshrc

# Verify
clarinet --version
```

## Method 2: Using Cargo (If Rust is installed)

```bash
cargo install clarinet
```

## Method 3: Using Homebrew (If available)

```bash
brew install clarinet
```

## After Installation

```bash
cd ~/Desktop/gb/contracts
clarinet check
clarinet test
```

---

**Note**: Automated installation is having network issues. Manual download from GitHub is the most reliable method.
