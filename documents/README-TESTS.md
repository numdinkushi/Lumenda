# Test Setup Instructions

## IDE Configuration

The test files use Deno-style HTTP imports. To fix IDE errors:

### VS Code
1. Install the **Deno extension**: `denoland.vscode-deno`
2. Open VS Code settings
3. Enable Deno for the contracts directory

The `.vscode/settings.json` file has been created to enable Deno support.

### Alternative: Use Import Maps
The `deno.json` file includes import maps that help resolve modules.

## Running Tests

Many newer Clarinet versions no longer include the `clarinet test` subcommand. Use one of these:

### Option 1: Deno (recommended for this repo)

If you have [Deno](https://deno.land/) installed:

```bash
cd contracts
npm test
```

or directly:

```bash
cd contracts
deno test --allow-read --allow-net tests/
```

### Option 2: Clarinet with built-in test (older Clarinet)

If your Clarinet still has `clarinet test`:

```bash
cd contracts
clarinet test
```

**Note**: The IDE errors are cosmetic - tests run correctly with Deno because the test files use Deno-style HTTP imports.

## If Errors Persist

1. Install Deno extension in VS Code
2. Reload VS Code window
3. Or ignore IDE errors - they don't affect test execution
