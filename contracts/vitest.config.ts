import { defineConfig } from "vitest/config";
import path from "node:path";

const sdkSetupPath = path.resolve(
  __dirname,
  "../node_modules/@stacks/clarinet-sdk/vitest-helpers/src/vitest.setup.ts"
);

export default defineConfig({
  test: {
    setupFiles: [path.join(__dirname, "vitest.bootstrap.ts"), sdkSetupPath],
    testTimeout: 30000,
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@stacks/transactions": path.resolve(
        __dirname,
        "../node_modules/@stacks/clarinet-sdk/node_modules/@stacks/transactions"
      ),
    },
  },
});
