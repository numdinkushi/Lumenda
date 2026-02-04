# Installing Clarinet

## Option 1: Using Cargo (Recommended if Rust is installed)

```bash
cargo install clarinet
```

## Option 2: Using Homebrew (macOS)

```bash
brew tap hirosystems/stacks-blockchain
brew install clarinet
```

## Option 3: Manual Installation

1. Download the latest release for macOS:
   ```bash
   # Check latest version at: https://github.com/hirosystems/clarinet/releases
   # Download clarinet-v1.x.x-x86_64-apple-darwin.tar.gz
   ```

2. Extract and move to PATH:
   ```bash
   tar -xzf clarinet-*.tar.gz
   sudo mv clarinet /usr/local/bin/
   ```

## Option 4: Using the Installer Script (if it works)

```bash
curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-installer.sh | bash
```

**Note**: After installation, you may need to:
- Add to PATH: `export PATH="$HOME/.cargo/bin:$PATH"` (if using cargo)
- Restart terminal or run: `source ~/.zshrc`

## Verify Installation

```bash
clarinet --version
```

## If Installation Fails

Check the official documentation:
- https://docs.hiro.so/clarinet/how-to-guides/how-to-install-clarinet
