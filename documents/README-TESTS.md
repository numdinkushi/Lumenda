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

Tests are run via Clarinet, which uses Deno under the hood:

```bash
cd contracts
clarinet test
```

**Note**: The IDE errors are cosmetic - tests will run correctly with `clarinet test` because Clarinet uses Deno, which natively supports HTTP imports.

## If Errors Persist

1. Install Deno extension in VS Code
2. Reload VS Code window
3. Or ignore IDE errors - they don't affect test execution
