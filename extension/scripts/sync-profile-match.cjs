const fs = require("node:fs");
const path = require("node:path");

const source = path.join(__dirname, "..", "..", "shared", "profile-match.ts");
const target = path.join(__dirname, "..", "profile-match.ts");

let text = fs.readFileSync(source, "utf8");
text = text.replace(/^export type /gm, "type ");
text = text.replace(/^export const /gm, "const ");
text = text.replace(/^export function /gm, "function ");

fs.writeFileSync(target, `// Generated from shared/profile-match.ts — do not edit by hand.\n// Run: pnpm --dir extension build\n\n${text}`);
