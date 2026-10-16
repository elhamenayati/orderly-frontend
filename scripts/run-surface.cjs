/**
 * Run Next.js for marketing (3000) or customer (4000) with a separate distDir.
 *
 * Usage: node scripts/run-surface.cjs <marketing|customer> <dev|start|build>
 */
const { spawn } = require("child_process");
const path = require("path");

const surface = process.argv[2];
const command = process.argv[3] || "dev";

if (surface !== "marketing" && surface !== "customer") {
  console.error("Usage: node scripts/run-surface.cjs <marketing|customer> [dev|start|build]");
  process.exit(1);
}

const isCustomer = surface === "customer";
const port = isCustomer ? "4000" : "3000";
const distDir = isCustomer ? ".next-customer" : ".next";

const env = {
  ...process.env,
  APP_SURFACE: surface,
  NEXT_DIST_DIR: distDir,
  PORT: port,
};

const nextBin = path.join(
  __dirname,
  "..",
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

const args =
  command === "build"
    ? ["build"]
    : command === "start"
      ? ["start", "-p", port]
      : ["dev", "-p", port];

const child = spawn(process.execPath, [nextBin, ...args], {
  env,
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});

child.on("exit", (code) => process.exit(code ?? 0));
