import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const DEPLOYER = "STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ";
const WALLET_1 = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const WALLET_2 = "ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND";

describe("Remittance contract", () => {
  it("can initiate a transfer", () => {
    const sender = DEPLOYER;
    const recipient = WALLET_2;
    const amount = 1000000;
    const result = simnet.callPublicFn(
      "remittance",
      "initiate-transfer",
      [Cl.principal(recipient), Cl.uint(amount)],
      sender
    );
    expect(result.result).toBeOk(Cl.uint(1));
  });

  it("cannot initiate transfer with zero amount", () => {
    const sender = WALLET_1;
    const recipient = WALLET_2;
    const result = simnet.callPublicFn(
      "remittance",
      "initiate-transfer",
      [Cl.principal(recipient), Cl.uint(0)],
      sender
    );
    expect(result.result).toBeErr(Cl.uint(403));
  });

  it("cannot initiate transfer to self", () => {
    const sender = WALLET_1;
    const result = simnet.callPublicFn(
      "remittance",
      "initiate-transfer",
      [Cl.principal(sender), Cl.uint(1000000)],
      sender
    );
    expect(result.result).toBeErr(Cl.uint(106));
  });

  it("recipient can complete transfer", () => {
    const sender = DEPLOYER;
    const recipient = WALLET_2;
    const amount = 1000000;
    simnet.callPublicFn(
      "remittance",
      "initiate-transfer",
      [Cl.principal(recipient), Cl.uint(amount)],
      sender
    );
    const result = simnet.callPublicFn(
      "remittance",
      "complete-transfer",
      [Cl.uint(1)],
      recipient
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("sender can cancel pending transfer", () => {
    const sender = DEPLOYER;
    const recipient = WALLET_2;
    simnet.callPublicFn(
      "remittance",
      "initiate-transfer",
      [Cl.principal(recipient), Cl.uint(1000000)],
      sender
    );
    const result = simnet.callPublicFn(
      "remittance",
      "cancel-transfer",
      [Cl.uint(1)],
      sender
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("only recipient can complete transfer", () => {
    const sender = DEPLOYER;
    const recipient = WALLET_2;
    simnet.callPublicFn(
      "remittance",
      "initiate-transfer",
      [Cl.principal(recipient), Cl.uint(1000000)],
      sender
    );
    const result = simnet.callPublicFn(
      "remittance",
      "complete-transfer",
      [Cl.uint(1)],
      sender
    );
    expect(result.result).toBeErr(Cl.uint(300));
  });

  it("owner can pause and unpause contract", () => {
    const deployer = DEPLOYER;
    let result = simnet.callPublicFn("remittance", "pause-contract", [], deployer);
    expect(result.result).toBeOk(Cl.bool(true));
    result = simnet.callPublicFn("remittance", "unpause-contract", [], deployer);
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("owner can update fee rate", () => {
    const deployer = DEPLOYER;
    const result = simnet.callPublicFn(
      "remittance",
      "set-fee-rate",
      [Cl.uint(200)],
      deployer
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });
});
