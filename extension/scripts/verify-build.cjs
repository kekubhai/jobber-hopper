const { accessSync } = require("node:fs");

const required = [
  "background.js",
  "content.js",
  "extension-settings.js",
  "form-mapping.js",
  "form-mapping-client.js",
  "field-detection.js",
  "field-fill.js",
  "platform-greenhouse.js",
  "platform.js",
  "profile-match.js",
  "popup.js"
];

for (const file of required) {
  accessSync(file);
}

console.log("Extension build OK:");
for (const file of required) {
  console.log(`  - ${file}`);
}
