// @deno-types="https://deno.land/x/clarinet@v1.7.1/index.ts"
// @ts-ignore - Deno HTTP imports (works with clarinet test)
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.7.1/index.ts';
// @deno-types="https://deno.land/std@0.224.0/testing/asserts.ts"
// @ts-ignore - Deno HTTP imports (works with clarinet test)
import { assertEquals } from 'https://deno.land/std@0.224.0/testing/asserts.ts';

Clarinet.test({
    name: "Can lock funds in escrow",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const amount = 1000000;
        const transferId = 1;

        const block = chain.mineBlock([
            Tx.contractCall('escrow', 'lock-funds', [
                types.uint(transferId),
                types.principal(sender.address),
                types.principal(recipient.address),
                types.uint(amount)
            ], sender.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);
    }
});

Clarinet.test({
    name: "Cannot lock zero amount",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const transferId = 1;

        const block = chain.mineBlock([
            Tx.contractCall('escrow', 'lock-funds', [
                types.uint(transferId),
                types.principal(sender.address),
                types.principal(recipient.address),
                types.uint(0)
            ], sender.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectUint(403); // ERR-AMOUNT-ZERO
    }
});

Clarinet.test({
    name: "Can release funds from escrow",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const amount = 1000000;
        const transferId = 1;

        // Lock funds
        chain.mineBlock([
            Tx.contractCall('escrow', 'lock-funds', [
                types.uint(transferId),
                types.principal(sender.address),
                types.principal(recipient.address),
                types.uint(amount)
            ], sender.address)
        ]);

        // Release funds
        const block = chain.mineBlock([
            Tx.contractCall('escrow', 'release-funds', [
                types.uint(transferId)
            ], sender.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);
    }
});

Clarinet.test({
    name: "Can refund funds from escrow",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const amount = 1000000;
        const transferId = 1;

        // Lock funds
        chain.mineBlock([
            Tx.contractCall('escrow', 'lock-funds', [
                types.uint(transferId),
                types.principal(sender.address),
                types.principal(recipient.address),
                types.uint(amount)
            ], sender.address)
        ]);

        // Refund funds
        const block = chain.mineBlock([
            Tx.contractCall('escrow', 'refund-funds', [
                types.uint(transferId)
            ], sender.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);
    }
});

Clarinet.test({
    name: "Cannot release already released funds",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const amount = 1000000;
        const transferId = 1;

        // Lock and release funds
        chain.mineBlock([
            Tx.contractCall('escrow', 'lock-funds', [
                types.uint(transferId),
                types.principal(sender.address),
                types.principal(recipient.address),
                types.uint(amount)
            ], sender.address)
        ]);

        chain.mineBlock([
            Tx.contractCall('escrow', 'release-funds', [
                types.uint(transferId)
            ], sender.address)
        ]);

        // Try to release again (should fail)
        const block = chain.mineBlock([
            Tx.contractCall('escrow', 'release-funds', [
                types.uint(transferId)
            ], sender.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectUint(202); // ERR-ESCROW-NOT-LOCKED
    }
});

Clarinet.test({
    name: "Can get escrow information",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const amount = 1000000;
        const transferId = 1;

        // Lock funds
        chain.mineBlock([
            Tx.contractCall('escrow', 'lock-funds', [
                types.uint(transferId),
                types.principal(sender.address),
                types.principal(recipient.address),
                types.uint(amount)
            ], sender.address)
        ]);

        // Get escrow info
        const result = chain.callReadOnlyFn('escrow', 'get-escrow-info', [
            types.uint(transferId)
        ], sender.address);

        result.result.expectSome();
    }
});

Clarinet.test({
    name: "Can check escrow balance",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const amount = 1000000;
        const transferId = 1;

        // Lock funds
        chain.mineBlock([
            Tx.contractCall('escrow', 'lock-funds', [
                types.uint(transferId),
                types.principal(sender.address),
                types.principal(recipient.address),
                types.uint(amount)
            ], sender.address)
        ]);

        // Check balance
        const result = chain.callReadOnlyFn('escrow', 'get-escrow-balance', [
            types.principal(sender.address)
        ], sender.address);

        result.result.expectUint(amount);
    }
});
