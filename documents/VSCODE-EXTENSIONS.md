# Recommended VS Code Extensions for Lumenda

## Essential Extensions

### 1. **Clarity LSP** (Required)
- **Extension ID**: `hirosystems.clarity-lsp`
- **Purpose**: Official Clarity language support
- **Features**:
  - Syntax highlighting for `.clar` files
  - Code completion
  - Error detection
  - Inline diagnostics
  - Hover documentation

**Install**: Search "Clarity LSP" in VS Code Extensions

### 2. **Deno** (Required for Tests)
- **Extension ID**: `denoland.vscode-deno`
- **Purpose**: Deno support for TypeScript test files
- **Features**:
  - TypeScript support for Deno
  - HTTP import recognition
  - Test file support

**Install**: Search "Deno" in VS Code Extensions

## Recommended Extensions

### 3. **ESLint** (Optional but Recommended)
- **Extension ID**: `dbaeumer.vscode-eslint`
- **Purpose**: JavaScript/TypeScript linting
- **Useful for**: Frontend code quality

### 4. **Prettier** (Optional)
- **Extension ID**: `esbenp.prettier-vscode`
- **Purpose**: Code formatting
- **Useful for**: Consistent code style

### 5. **TypeScript and JavaScript Language Features** (Built-in)
- Usually comes with VS Code
- Provides TypeScript support

## Quick Install

### Method 1: Via VS Code UI
1. Open VS Code
2. Press `Cmd+Shift+X` (Mac) or `Ctrl+Shift+X` (Windows/Linux)
3. Search for each extension ID above
4. Click "Install"

### Method 2: Via Command Line
```bash
code --install-extension hirosystems.clarity-lsp
code --install-extension denoland.vscode-deno
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

### Method 3: Auto-install (Recommended)
VS Code will prompt you to install recommended extensions when you open the project, since we've added `.vscode/extensions.json`.

## Verification

After installing:
1. Open a `.clar` file
2. You should see syntax highlighting
3. Errors should be highlighted
4. Hover over functions for documentation

## Configuration

The `.vscode/settings.json` file is already configured with:
- Clarity LSP enabled
- Deno enabled for test files
- File associations for `.clar` files

---

**Note**: The Clarity LSP extension requires Clarinet to be installed and in your PATH.
