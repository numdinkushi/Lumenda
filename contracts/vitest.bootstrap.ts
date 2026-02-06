import { initSimnet } from "@stacks/clarinet-sdk";

async function bootstrap() {
  const manifestPath = "./Clarinet.toml";
  (global as any).options = {
    clarinet: {
      manifestPath,
      initBeforeEach: true,
      coverage: false,
      costs: false,
      coverageFilename: "lcov.info",
      costsFilename: "costs-reports.json",
      includeBootContracts: false,
      bootContractsPath: "",
    },
  };
  (global as any).simnet = await initSimnet(manifestPath);
}

await bootstrap();
