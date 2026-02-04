# Lumenda Architecture

## System Overview

Lumenda is built as a modular, decentralized remittance platform on Stacks (Bitcoin L2). The architecture follows SOLID principles and is designed for scalability, security, and maintainability.

## High-Level Architecture

``` 
┌─────────────────────────────────────────────────────────┐
│                    User Interface                       │
│  (Web Frontend / Mobile App)                           │
└────────────────────┬──────────────────────────────────┘
                      │
                      │ Stacks.js / Wallet Connection
                      │
┌─────────────────────▼──────────────────────────────────┐
│              Stacks Blockchain (L2)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Remittance │  │    Escrow    │  │     Fees     │ │
│  │   Contract   │  │   Contract   │  │   Contract   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │    Limits    │  │ Verification │                   │
│  │   Contract   │  │   Contract   │                   │
│  └──────────────┘  └──────────────┘                   │
└─────────────────────┬──────────────────────────────────┘
                      │
                      │ Settles to Bitcoin
                      │
┌─────────────────────▼──────────────────────────────────┐
│              Bitcoin Blockchain (L1)                   │
│            (Final Settlement Layer)                     │
└────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Smart Contracts Layer

#### Core Contracts

**lumenda-remittance.clar**
- Primary contract for remittance operations
- Functions: `initiate-transfer`, `complete-transfer`, `cancel-transfer`
- Manages transfer lifecycle
- Interfaces with other contracts

**lumenda-escrow.clar**
- Escrow management
- Locks funds during transfer
- Releases funds on completion
- Handles refunds

**lumenda-fees.clar**
- Fee calculation logic
- Dynamic fee structures
- Fee distribution
- Fee refunds

**lumenda-limits.clar**
- Transaction limits per user
- Daily/weekly limits
- Maximum transfer amounts
- Rate limiting

**lumenda-verification.clar**
- KYC/AML status tracking
- Verification levels
- Access control based on verification
- Compliance features

### 2. Frontend Layer

**Components**
- Modular React components
- Reusable UI elements
- Wallet integration components

**Pages**
- Transfer page
- Dashboard
- Transaction history
- Settings

**Services**
- Stacks.js integration
- API calls (if needed)
- State management

**Hooks**
- Custom React hooks
- Wallet connection hooks
- Transaction hooks

### 3. Data Flow

```
User Action
    │
    ├─► Frontend (React)
    │       │
    │       ├─► Wallet Connection (Stacks.js)
    │       │
    │       └─► Contract Call
    │               │
    │               ▼
    └─► Smart Contract (Clarity)
            │
            ├─► Escrow Contract
            ├─► Fees Contract
            ├─► Limits Contract
            └─► Verification Contract
                    │
                    ▼
            Bitcoin Settlement
```

## Design Principles

### SOLID Principles

1. **Single Responsibility**: Each contract has one clear purpose
2. **Open/Closed**: Contracts extensible via traits, closed for modification
3. **Liskov Substitution**: Consistent interfaces across contracts
4. **Interface Segregation**: Small, focused interfaces
5. **Dependency Inversion**: Depend on abstractions (traits), not implementations

### Modularity

- Contracts are separated by concern
- Frontend components are modular and reusable
- Clear separation of concerns
- Easy to test and maintain

### Security

- Multi-layer security approach
- Access control at contract level
- Input validation
- Reentrancy protection
- Time locks for large transfers

## Technology Stack

### Smart Contracts
- **Language**: Clarity
- **Framework**: Clarinet
- **Testing**: Clarinet test framework

### Frontend
- **Framework**: Next.js / React
- **Language**: TypeScript
- **Libraries**: Stacks.js (@stacks/connect, @stacks/transactions)
- **State Management**: React Context / Zustand (TBD)

### Development Tools
- **Version Control**: Git
- **CI/CD**: GitHub Actions (planned)
- **Testing**: Jest, Clarinet tests

## Security Architecture

### Contract Security
- Access control mechanisms
- Input validation
- Reentrancy guards
- Overflow/underflow protection (Clarity built-in)
- Time locks for critical operations

### Frontend Security
- Wallet connection security
- Transaction signing verification
- Input sanitization
- Secure storage (if needed)

## Scalability Considerations

### Contract Scalability
- Gas optimization
- Efficient data structures
- Batch operations where possible

### Frontend Scalability
- Code splitting
- Lazy loading
- Efficient state management
- Caching strategies

## Future Enhancements

- Mobile app (React Native)
- API layer for additional services
- Oracle integration for exchange rates
- Multi-chain support
- Advanced analytics

## Deployment Strategy

### Contracts
- Deploy to Stacks testnet first
- Security audit before mainnet
- Gradual rollout
- Upgrade mechanisms (if needed)

### Frontend
- Deploy to Vercel/Netlify
- CDN for static assets
- Environment-based configuration

---

*This architecture document will be updated as the project evolves.*
