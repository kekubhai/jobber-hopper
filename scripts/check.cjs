const { spawnSync } = require("node:child_process");
const { accessSync } = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function run(label, command, args, cwd = root) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false
  });
  if (result.error) {
    console.error(`\nCheck failed: ${label}`, result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\nCheck failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

const tscJs = path.join(root, "web", "node_modules", "typescript", "bin", "tsc");
accessSync(tscJs);

run("web typecheck", process.execPath, [tscJs, "--noEmit", "-p", path.join(root, "web", "tsconfig.json")]);
run(
  "extension verify-build",
  process.execPath,
  [path.join(root, "extension", "scripts", "verify-build.cjs")],
  path.join(root, "extension")
);
run(
  "extension profile-match tests",
  process.execPath,
  [path.join(root, "extension", "scripts", "test-profile-match.cjs")],
  path.join(root, "extension")
);

console.log("\nAll checks passed.");
