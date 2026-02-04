// @deno-types="https://deno.land/x/clarinet@v1.7.1/index.ts"
// @ts-ignore - Deno HTTP imports (works with clarinet test)
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.7.1/index.ts';
// @deno-types="https://deno.land/std@0.224.0/testing/asserts.ts"
// @ts-ignore - Deno HTTP imports (works with clarinet test)
import { assertEquals, assert } from 'https://deno.land/std@0.224.0/testing/asserts.ts';

Clarinet.test({
    name: "Can initiate a transfer",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const amount = 1000000; // 1 STX in micro-STX
        const block = chain.mineBlock([
            Tx.contractCall('remittance', 'initiate-transfer', [
                types.principal(recipient.address),
                types.uint(amount)
            ], sender.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectUint(1);
    }
});

Clarinet.test({
    name: "Cannot initiate transfer with zero amount",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const block = chain.mineBlock([
            Tx.contractCall('remittance', 'initiate-transfer', [
                types.principal(recipient.address),
                types.uint(0)
            ], sender.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectUint(403); // ERR-AMOUNT-ZERO
    }
});

Clarinet.test({
    name: "Cannot initiate transfer to self",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const block = chain.mineBlock([
            Tx.contractCall('remittance', 'initiate-transfer', [
                types.principal(sender.address),
                types.uint(1000000)
            ], sender.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectUint(106); // ERR-TRANSFER-SENDER-RECIPIENT-SAME
    }
});

Clarinet.test({
    name: "Recipient can complete transfer",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const amount = 1000000;

        // Initiate transfer
        chain.mineBlock([
            Tx.contractCall('remittance', 'initiate-transfer', [
                types.principal(recipient.address),
                types.uint(amount)
            ], sender.address)
        ]);

        // Complete transfer
        const block = chain.mineBlock([
            Tx.contractCall('remittance', 'complete-transfer', [
                types.uint(1)
            ], recipient.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);
    }
});

Clarinet.test({
    name: "Sender can cancel pending transfer",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const amount = 1000000;

        // Initiate transfer
        chain.mineBlock([
            Tx.contractCall('remittance', 'initiate-transfer', [
                types.principal(recipient.address),
                types.uint(amount)
            ], sender.address)
        ]);

        // Cancel transfer
        const block = chain.mineBlock([
            Tx.contractCall('remittance', 'cancel-transfer', [
                types.uint(1)
            ], sender.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);
    }
});

Clarinet.test({
    name: "Cannot complete already completed transfer",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const amount = 1000000;

        // Initiate and complete transfer
        chain.mineBlock([
            Tx.contractCall('remittance', 'initiate-transfer', [
                types.principal(recipient.address),
                types.uint(amount)
            ], sender.address)
        ]);

        chain.mineBlock([
            Tx.contractCall('remittance', 'complete-transfer', [
                types.uint(1)
            ], recipient.address)
        ]);

        // Try to complete again
        const block = chain.mineBlock([
            Tx.contractCall('remittance', 'complete-transfer', [
                types.uint(1)
            ], recipient.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectUint(103); // ERR-TRANSFER-INVALID-STATUS
    }
});

Clarinet.test({
    name: "Only recipient can complete transfer",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;
        const amount = 1000000;

        // Initiate transfer
        chain.mineBlock([
            Tx.contractCall('remittance', 'initiate-transfer', [
                types.principal(recipient.address),
                types.uint(amount)
            ], sender.address)
        ]);

        // Try to complete as sender (should fail)
        const block = chain.mineBlock([
            Tx.contractCall('remittance', 'complete-transfer', [
                types.uint(1)
            ], sender.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectUint(300); // ERR-UNAUTHORIZED
    }
});

Clarinet.test({
    name: "Owner can pause and unpause contract",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const owner = accounts.get('deployer')!;

        // Pause contract
        let block = chain.mineBlock([
            Tx.contractCall('remittance', 'pause-contract', [], owner.address)
        ]);
        block.receipts[0].result.expectOk().expectBool(true);

        // Unpause contract
        block = chain.mineBlock([
            Tx.contractCall('remittance', 'unpause-contract', [], owner.address)
        ]);
        block.receipts[0].result.expectOk().expectBool(true);
    }
});

Clarinet.test({
    name: "Cannot initiate transfer when contract is paused",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const owner = accounts.get('deployer')!;
        const sender = accounts.get('wallet_1')!;
        const recipient = accounts.get('wallet_2')!;

        // Pause contract
        chain.mineBlock([
            Tx.contractCall('remittance', 'pause-contract', [], owner.address)
        ]);

        // Try to initiate transfer (should fail)
        const block = chain.mineBlock([
            Tx.contractCall('remittance', 'initiate-transfer', [
                types.principal(recipient.address),
                types.uint(1000000)
            ], sender.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectUint(303); // ERR-CONTRACT-PAUSED
    }
});

Clarinet.test({
    name: "Owner can update fee rate",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const owner = accounts.get('deployer')!;
        const newRate = 200; // 2%

        const block = chain.mineBlock([
            Tx.contractCall('remittance', 'set-fee-rate', [
                types.uint(newRate)
            ], owner.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);
    }
});
