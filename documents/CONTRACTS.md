# Lumenda Smart Contracts Documentation

## Overview

The Lumenda remittance platform consists of modular Clarity smart contracts following SOLID principles and industry best practices.

## Contract Architecture

### Core Contracts

#### 1. `errors.clar` - Centralized Error Definitions
- **Purpose**: Single source of truth for error codes
- **Principle**: DRY (Don't Repeat Yourself)
- **Location**: `contracts/core/errors.clar`

#### 2. `escrow.clar` - Escrow Management
- **Purpose**: Handle fund locking, release, and refunds
- **Single Responsibility**: Escrow operations only
- **Key Functions**:
  - `lock-funds` - Lock funds in escrow
  - `release-funds` - Release funds to recipient
  - `refund-funds` - Refund funds to sender
- **Location**: `contracts/core/escrow.clar`

#### 3. `remittance.clar` - Main Remittance Contract
- **Purpose**: Manage transfer lifecycle
- **Single Responsibility**: Transfer management
- **Key Functions**:
  - `initiate-transfer` - Start a new transfer
  - `complete-transfer` - Complete a transfer
  - `cancel-transfer` - Cancel a pending transfer
- **Administrative Functions**:
  - `pause-contract` - Emergency pause
  - `unpause-contract` - Resume operations
  - `set-fee-rate` - Update fee rate
- **Location**: `contracts/core/remittance.clar`

## Design Principles

### SOLID Principles Applied

1. **Single Responsibility Principle (SRP)**
   - Each contract has one clear purpose
   - `escrow.clar` handles only escrow operations
   - `remittance.clar` handles only transfer management
   - `errors.clar` handles only error definitions

2. **Open/Closed Principle (OCP)**
   - Contracts are extensible via traits (future enhancement)
   - Core functionality closed for modification
   - New features can be added via new contracts

3. **Liskov Substitution Principle (LSP)**
   - Consistent interfaces across contracts
   - Interchangeable implementations possible

4. **Interface Segregation Principle (ISP)**
   - Small, focused function interfaces
   - Clients depend only on what they need

5. **Dependency Inversion Principle (DIP)**
   - Contracts depend on abstractions (via contract calls)
   - Not on concrete implementations

## Security Features

1. **Access Control**
   - Owner-only administrative functions
   - Sender/recipient verification for transfers

2. **Input Validation**
   - Amount validation (non-zero, positive)
   - Address validation
   - Status validation

3. **State Management**
   - Clear transfer status tracking
   - Escrow status tracking
   - Pause mechanism for emergencies

4. **Error Handling**
   - Comprehensive error codes
   - Clear error messages
   - Proper error propagation

## Contract Flow

### Transfer Initiation
1. User calls `initiate-transfer` with recipient and amount
2. Contract calculates fee
3. STX transferred to contract (amount + fee)
4. Funds locked in escrow
5. Transfer record created with PENDING status

### Transfer Completion
1. Recipient calls `complete-transfer` with transfer ID
2. Contract validates transfer status
3. Funds released from escrow to recipient
4. Transfer status updated to COMPLETED

### Transfer Cancellation
1. Sender calls `cancel-transfer` with transfer ID
2. Contract validates transfer status
3. Funds refunded from escrow to sender
4. Fee refunded to sender
5. Transfer status updated to CANCELLED

## Testing

Comprehensive test suite covering:
- Happy path scenarios
- Error cases
- Edge cases
- Security scenarios
- Access control
- State transitions

See `contracts/tests/` for test files.

## Deployment

### Prerequisites
- Clarinet installed
- Stacks testnet/mainnet access
- Sufficient STX for deployment

### Deployment Steps
1. Deploy `escrow.clar` first
2. Deploy `remittance.clar` (references escrow)
3. Initialize contracts
4. Set initial fee rate
5. Test on testnet before mainnet

## Code for STX Compliance

✅ **New Clarity Contract** - Core remittance and escrow contracts
✅ **Meaningful Functionality** - Complete transfer system
✅ **Test Suite** - Comprehensive tests
✅ **Valid Clarity Code** - Passes `clarinet check`
✅ **Documentation** - Complete documentation

## Next Steps (Month 2)

- Add transaction limits contract
- Add fee calculation contract
- Enhance security features
- Add multi-currency support
- Optimize gas usage

---

**Status**: ✅ Month 1 Complete - Core contracts implemented and tested
