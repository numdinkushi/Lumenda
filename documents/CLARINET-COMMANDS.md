# Clarinet Commands Reference

Based on [official Clarinet CLI documentation](https://docs.stacks.co/reference/clarinet/cli-reference)

## Essential Commands for Lumenda

### 1. Validate Contracts

```bash
clarinet check
```

Checks contract syntax and performs type checking. This is what you need to run first!

```bash
# Check all contracts
clarinet check

# Check specific contract
clarinet check contracts/core/remittance.clar
```

### 2. Run Tests

```bash
clarinet test
```

Runs all test files in the `tests/` directory.

### 3. Interactive Console (REPL)

```bash
clarinet console
```

Loads contracts in an interactive REPL for testing:

- `::help` - List all console commands
- `::mint_stx <principal> <amount>` - Mint STX for testing
- `::set_tx_sender <principal>` - Set transaction sender
- `::get_contracts` - List all contracts
- `::debug <expr>` - Debug an expression

### 4. Start Local Devnet

```bash
clarinet devnet start
```

Starts a local development network for testing contracts with a full blockchain environment.

### 5. Format Code

```bash
clarinet format
```

Formats Clarity code according to standard conventions:

```bash
# Check formatting
clarinet format --check

# Format all contracts
clarinet format --in-place

# Format specific file
clarinet format --file contracts/core/remittance.clar --in-place
```

### 6. Generate Deployment Plan

```bash
clarinet deployments generate --testnet
```

Generates a deployment plan for testnet/mainnet.

### 7. Apply Deployment

```bash
clarinet deployments apply --testnet
```

Deploys contracts to testnet/mainnet.

## Your Workflow

### Step 1: After Installing Clarinet

```bash
cd contracts
clarinet check
```

### Step 2: Run Tests

```bash
clarinet test
```

### Step 3: Format Code (Optional)

```bash
clarinet format --check
clarinet format --in-place
```

### Step 4: Test in Console (Optional)

```bash
clarinet console
```

Then in the console:
```
::mint_stx ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM 1000000000
::set_tx_sender ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
(contract-call? .remittance initiate-transfer ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG recipient u1000000)
```

### Step 5: Start Devnet (For Full Testing)

```bash
clarinet devnet start
```

This starts a local blockchain with:
- API endpoints
- Dashboard UI
- Faucet for test STX

## Common Options

Most commands support:

- `--manifest-path <path>` or `-m` - Specify path to Clarinet.toml
- `--deployment-plan-path <path>` or `-p` - Specify deployment plan

## Environment Variables

```bash
export CLARINET_MANIFEST_PATH=/path/to/project
```

## Next Steps

1. ✅ Install Clarinet (see INSTALL-CLARINET-MANUAL.md)
2. Run `clarinet check` to validate contracts
3. Run `clarinet test` to verify tests pass
4. Format code with `clarinet format --in-place`
5. Prepare for Month 1 PR submission

---

**Reference**: [Clarinet CLI Documentation](https://docs.stacks.co/reference/clarinet/cli-reference)
