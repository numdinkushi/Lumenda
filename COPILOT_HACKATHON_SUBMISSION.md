*This is a submission for the [GitHub Copilot CLI Challenge](https://dev.to/challenges/github-2026-01-21)*

## What I Built

**Lumenda** is a decentralized remittance platform built on Stacks (Bitcoin L2) that enables fast, low-cost international money transfers. This project represents my vision of making cross-border payments more accessible, transparent, and affordable by leveraging blockchain technology.

### Key Features

🚀 **Fast Transfers**: Near-instant settlement using Stacks blockchain with escrow-based security  
💰 **Low Fees**: 1-2% transaction fees compared to 5-10% in traditional remittance services  
🔒 **Secure**: All transactions are secured by Bitcoin's blockchain with smart contract escrow  
🌍 **Global Access**: Send money anywhere, anytime without intermediaries  
📊 **Transparent History**: Complete transaction history with real-time status tracking  
💳 **Wallet Integration**: Seamless integration with Leather and Hiro wallets  

### Technical Stack

- **Smart Contracts**: Clarity contracts on Stacks blockchain (escrow, remittance, fee management)
- **Frontend**: Next.js 16 with React 19, TypeScript, and Tailwind CSS
- **State Management**: Convex for real-time data synchronization
- **Blockchain Integration**: Stacks.js for wallet connections and contract interactions
- **Architecture**: Modular, SOLID principles with separation of concerns

### What Makes It Special

Lumenda solves real-world problems:
- **Escrow System**: Funds are held in escrow until the recipient confirms receipt, protecting both parties
- **Real-time Tracking**: Users can see transfer status, transaction history, and pending transfers
- **Optimized Performance**: Implemented parallel API calls and Convex-first architecture for fast loading
- **Production-Ready**: Full error handling, loading states, and user-friendly notifications

This project means a lot to me because it demonstrates how blockchain technology can create practical solutions for everyday financial challenges, making remittances more accessible to people worldwide.

## Demo

**Live Application**: [lumenda.vercel.app](https://lumenda.vercel.app)  
**GitHub Repository**: [github.com/numdinkushi/Lumenda](https://github.com/numdinkushi/Lumenda)

### Screenshots

#### Dashboard
The main dashboard shows wallet balance, recent transfers, and pending transfers that need attention. Users can quickly see their transaction history and take action on pending transfers.

#### Send Money
The send page allows users to initiate transfers with a clean, intuitive interface. It shows real-time fee calculations and provides clear instructions about the escrow process.

#### Transaction History
A comprehensive history page that loads transfers from both the blockchain and Convex database, showing complete transaction details, status, and links to the Stacks explorer.

#### Pending Transfers
Users receive notifications for pending transfers where they are the recipient, making it easy to complete incoming transfers.

### Key Workflows

1. **Initiate Transfer**: Connect wallet → Enter recipient address and amount → Review fees → Confirm transaction
2. **Complete Transfer**: Receive notification → Review transfer details → Complete via wallet → Funds released
3. **View History**: Access complete transaction history with filtering and search capabilities

## My Experience with GitHub Copilot CLI

Building Lumenda with AI-assisted development was transformative. Here's how it impacted my development experience:

### Rapid Prototyping & Architecture

GitHub Copilot CLI helped me quickly scaffold the entire project structure, from smart contract architecture to frontend components. When designing the escrow system, I could describe the requirements and get a solid foundation that I could then refine.

### Complex Problem Solving

One of the most challenging aspects was implementing the transfer lifecycle with proper state management. Copilot CLI helped me:
- Design the Convex database schema for tracking transactions and transfers
- Implement the dual-source data loading (blockchain + database) for optimal performance
- Handle edge cases like wallet timeouts, transaction failures, and network errors

### React Hooks & Best Practices

When I encountered React Hooks rule violations and infinite re-render issues, Copilot CLI provided solutions that followed React best practices:
- Restructuring effects to avoid synchronous setState calls
- Implementing proper dependency arrays
- Using refs and memoization to prevent unnecessary re-renders

### Deployment & Configuration

Configuring Vercel for a monorepo structure was tricky. Copilot CLI helped me:
- Create the correct `vercel.json` configuration
- Understand the relationship between root directory settings and build commands
- Debug deployment issues and optimize the build process

### Code Quality & Consistency

Throughout development, Copilot CLI ensured:
- Consistent TypeScript types across the codebase
- Proper error handling patterns
- Clean, maintainable code structure
- Following Next.js and React best practices

### Learning & Growth

Perhaps most importantly, working with Copilot CLI accelerated my learning:
- I learned new patterns and approaches I might not have considered
- It helped me understand complex concepts like Convex real-time synchronization
- I discovered better ways to structure React components and hooks

### Time Saved

What would have taken weeks of development was accomplished in days. The AI assistant handled:
- Boilerplate code generation
- Debugging complex issues
- Writing comprehensive error handling
- Optimizing performance bottlenecks

### The Human-AI Collaboration

The best part was the collaborative nature. Copilot CLI didn't replace my thinking—it amplified it. I could focus on:
- High-level architecture decisions
- User experience design
- Business logic and feature requirements
- Testing and refinement

While Copilot CLI handled:
- Implementation details
- Repetitive code patterns
- Configuration files
- Debugging assistance

This partnership allowed me to build a production-ready application that I'm proud to showcase.

---

**Built with ❤️ on Stacks (Bitcoin L2)**

*Lumenda - Making remittances accessible, one transaction at a time.*
