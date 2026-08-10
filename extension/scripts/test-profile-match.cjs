"use strict";

/**
 * Regression tests for extension/profile-match.js
 *
 * Run: node scripts/test-profile-match.cjs
 *
 * The compiled profile-match.js is a top-level script (module: "None") that
 * uses globals, so we load it in a vm context and grab the function refs.
 */

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const COMPILED = path.join(__dirname, "..", "profile-match.js");
const code = fs.readFileSync(COMPILED, "utf8");

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: "profile-match.js" });

const { matchDetectedFields, resolveAutofillValue } = sandbox;

if (typeof matchDetectedFields !== "function" || typeof resolveAutofillValue !== "function") {
  console.error("FAIL: could not load functions from compiled profile-match.js");
  process.exit(1);
}

const PROFILE = {
  personal: {
    firstName: "Avery",
    lastName: "Okafor",
    preferredName: "Avery",
    email: "avery.okafor@example.com",
    phone: "+1 415 555 0142",
    linkedinUrl: "https://linkedin.com/in/avery",
    portfolioUrl: "https://avery.dev",
    headline: "Senior Frontend Engineer",
    summary: "Frontend engineer, 8 years React/TS."
  },
  address: {
    line1: "742 Evergreen",
    line2: "",
    city: "San Francisco",
    region: "CA",
    postalCode: "94110",
    country: "US"
  }
};

let passed = 0;
let failed = 0;
const failures = [];

function eq(label, actual, expected) {
  const ok = actual === expected;
  if (ok) {
    passed += 1;
    console.log(`  \u2713 ${label}`);
  } else {
    failed += 1;
    failures.push({ label, actual, expected });
    console.log(`  \u2717 ${label}\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`);
  }
}

function get(fields, fieldId) {
  const match = fields.find((f) => f.fieldId === fieldId);
  return match ? { value: match.value, path: match.profileFieldPath } : { value: null, path: null };
}

function runCase(name, fields, expectations) {
  console.log(`\n${name}`);
  const result = matchDetectedFields(PROFILE, fields);
  for (const [fieldId, expected] of Object.entries(expectations)) {
    const got = get(result, fieldId);
    eq(
      `${fieldId}.value`,
      got.value,
      expected.value
    );
    if (expected.path !== undefined) {
      eq(`${fieldId}.path`, got.path, expected.path);
    }
  }
}

// --- The user-reported bug: a single "Name" field gets nothing if the
// --- profile only stores firstName + lastName separately. ---------------------

runCase(
  "Only 'Name' field (single full-name input)",
  [{ fieldId: "name", labelGuess: "Name", type: "text" }],
  {
    name: { value: "Avery Okafor", path: "personal.firstName" }
  }
);

// --- Regression: a form with separate "First name" + "Name" -- the "Name"
// --- field must still get the synthesized full name. -------------------------

runCase(
  "Separate 'First name' + 'Name' (order: First then Name)",
  [
    { fieldId: "first_name", labelGuess: "First name", type: "text" },
    { fieldId: "name", labelGuess: "Name", type: "text" }
  ],
  {
    first_name: { value: "Avery", path: "personal.firstName" },
    name: { value: "Avery Okafor", path: "personal.firstName" }
  }
);

runCase(
  "Separate 'Name' + 'First name' (reversed order)",
  [
    { fieldId: "name", labelGuess: "Name", type: "text" },
    { fieldId: "first_name", labelGuess: "First name", type: "text" }
  ],
  {
    name: { value: "Avery Okafor", path: "personal.firstName" },
    first_name: { value: "Avery", path: "personal.firstName" }
  }
);

// --- All three: First / Last / Name all filled correctly. --------------------

runCase(
  "First / Last / Name all present (DOM order: First, Last, Name)",
  [
    { fieldId: "first_name", labelGuess: "First name", type: "text" },
    { fieldId: "last_name", labelGuess: "Last name", type: "text" },
    { fieldId: "name", labelGuess: "Name", type: "text" }
  ],
  {
    first_name: { value: "Avery", path: "personal.firstName" },
    last_name: { value: "Okafor", path: "personal.lastName" },
    name: { value: "Avery Okafor", path: "personal.firstName" }
  }
);

// --- Full name alias works the same way. All three resolve to the same
// --- synthesized "Avery Okafor" value, so the second and third dedupe. ------

runCase(
  "Full name / Your name / Applicant name resolve to the same value -- first wins, rest deduped",
  [
    { fieldId: "full_name", labelGuess: "Full name", type: "text" },
    { fieldId: "your_name", labelGuess: "Your name", type: "text" },
    { fieldId: "applicant_name", labelGuess: "Applicant name", type: "text" }
  ],
  {
    full_name: { value: "Avery Okafor", path: "personal.firstName" },
    your_name: { value: null, path: "personal.firstName" },
    applicant_name: { value: null, path: "personal.firstName" }
  }
);

// --- Two identical "Name" fields -- first fills, second deduped. ------------

runCase(
  "Two 'Name' fields (identical) -- second deduped",
  [
    { fieldId: "name1", labelGuess: "Name", type: "text" },
    { fieldId: "name2", labelGuess: "Name", type: "text" }
  ],
  {
    name1: { value: "Avery Okafor", path: "personal.firstName" },
    name2: { value: null, path: "personal.firstName" }
  }
);

// --- Existing rule still works for non-name fields. -------------------------

runCase(
  "Email + phone + address still work",
  [
    { fieldId: "email", labelGuess: "Email", type: "email" },
    { fieldId: "phone", labelGuess: "Phone", type: "tel" },
    { fieldId: "city", labelGuess: "City", type: "text" }
  ],
  {
    email: { value: "avery.okafor@example.com", path: "personal.email" },
    phone: { value: "+1 415 555 0142", path: "personal.phone" },
    city: { value: "San Francisco", path: "address.city" }
  }
);

// --- Summary: nothing changed, same rule. -----------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("\nFailures:");
  for (const f of failures) {
    console.error(`  - ${f.label}: expected ${JSON.stringify(f.expected)}, got ${JSON.stringify(f.actual)}`);
  }
  process.exit(1);
}
process.exit(0);
