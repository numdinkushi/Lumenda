import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const DEPLOYER = "STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ";
const WALLET_1 = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const WALLET_2 = "ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND";

describe("Escrow contract", () => {
  it("can lock funds in escrow", () => {
    const sender = DEPLOYER;
    const recipient = WALLET_2;
    const amount = 1000000;
    const transferId = 1;
    const result = simnet.callPublicFn(
      "escrow",
      "lock-funds",
      [
        Cl.uint(transferId),
        Cl.principal(sender),
        Cl.principal(recipient),
        Cl.uint(amount),
      ],
      sender
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("cannot lock zero amount", () => {
    const sender = WALLET_1;
    const recipient = WALLET_2;
    const result = simnet.callPublicFn(
      "escrow",
      "lock-funds",
      [Cl.uint(1), Cl.principal(sender), Cl.principal(recipient), Cl.uint(0)],
      sender
    );
    expect(result.result).toBeErr(Cl.uint(403));
  });

  it("can release funds from escrow", () => {
    const sender = DEPLOYER;
    const recipient = WALLET_2;
    const amount = 1000000;
    const transferId = 1;
    simnet.callPublicFn(
      "escrow",
      "lock-funds",
      [
        Cl.uint(transferId),
        Cl.principal(sender),
        Cl.principal(recipient),
        Cl.uint(amount),
      ],
      sender
    );
    const result = simnet.callPublicFn(
      "escrow",
      "release-funds",
      [Cl.uint(transferId)],
      sender
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("can refund funds from escrow", () => {
    const sender = DEPLOYER;
    const recipient = WALLET_2;
    const amount = 1000000;
    const transferId = 1;
    simnet.callPublicFn(
      "escrow",
      "lock-funds",
      [
        Cl.uint(transferId),
        Cl.principal(sender),
        Cl.principal(recipient),
        Cl.uint(amount),
      ],
      sender
    );
    const result = simnet.callPublicFn(
      "escrow",
      "refund-funds",
      [Cl.uint(transferId)],
      sender
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("cannot release already released funds", () => {
    const sender = DEPLOYER;
    const recipient = WALLET_2;
    const amount = 1000000;
    const transferId = 1;
    simnet.callPublicFn(
      "escrow",
      "lock-funds",
      [
        Cl.uint(transferId),
        Cl.principal(sender),
        Cl.principal(recipient),
        Cl.uint(amount),
      ],
      sender
    );
    simnet.callPublicFn("escrow", "release-funds", [Cl.uint(transferId)], sender);
    const result = simnet.callPublicFn(
      "escrow",
      "release-funds",
      [Cl.uint(transferId)],
      sender
    );
    expect(result.result).toBeErr(Cl.uint(202));
  });

  it("can get escrow information", () => {
    const sender = DEPLOYER;
    const recipient = WALLET_2;
    const amount = 1000000;
    const transferId = 1;
    simnet.callPublicFn(
      "escrow",
      "lock-funds",
      [
        Cl.uint(transferId),
        Cl.principal(sender),
        Cl.principal(recipient),
        Cl.uint(amount),
      ],
      sender
    );
    const result = simnet.callReadOnlyFn(
      "escrow",
      "get-escrow-info",
      [Cl.uint(transferId)],
      sender
    );
    expect(result.result).toBeSome(expect.anything());
  });

  it("can check escrow balance", () => {
    const sender = DEPLOYER;
    const recipient = WALLET_2;
    const amount = 1000000;
    const transferId = 1;
    simnet.callPublicFn(
      "escrow",
      "lock-funds",
      [
        Cl.uint(transferId),
        Cl.principal(sender),
        Cl.principal(recipient),
        Cl.uint(amount),
      ],
      sender
    );
    const result = simnet.callReadOnlyFn(
      "escrow",
      "get-escrow-balance",
      [Cl.principal(sender)],
      sender
    );
    expect(result.result).toBeUint(amount);
  });
});
