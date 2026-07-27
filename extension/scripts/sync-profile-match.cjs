const fs = require("node:fs");
const path = require("node:path");

const source = path.join(__dirname, "..", "..", "shared", "profile-match.ts");
const target = path.join(__dirname, "..", "profile-match.ts");

let text = fs.readFileSync(source, "utf8");
text = text.replace(/^export type /gm, "type ");
text = text.replace(/^export const /gm, "const ");
text = text.replace(/^export function /gm, "function ");

fs.writeFileSync(target, `// Generated from shared/profile-match.ts — do not edit by hand.\n// Run: pnpm --dir extension build\n\n${text}`);

const formMappingSource = path.join(__dirname, "..", "..", "shared", "form-mapping.ts");
const formMappingTarget = path.join(__dirname, "..", "form-mapping.ts");
let formMappingText = fs.readFileSync(formMappingSource, "utf8");
formMappingText = formMappingText.replace(/^import .+$/gm, "");
formMappingText = formMappingText.replace(/^export type /gm, "type ");
formMappingText = formMappingText.replace(/^export const /gm, "const ");
formMappingText = formMappingText.replace(/^export function /gm, "function ");

fs.writeFileSync(
  formMappingTarget,
  `// Generated from shared/form-mapping.ts — do not edit by hand.\n// Run: pnpm --dir extension build\n\n${formMappingText}`
);
