"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { FORM_MAPPING_SYSTEM_PROMPT } = require("./form-mapping-prompt.cjs");
const { scrapeHtml } = require("./form-mapping-scraper.cjs");

/* ---------- arg parsing --------------------------------------------------- */

function parseArgs(argv) {
  const out = {
    url: null,
    profilePath: null,
    job: null,
    company: null,
    platform: null,
    htmlPath: null,
    out: null,
    mode: "direct", // "direct" | "api"
    llmUrl: null,
    apiBaseUrl: null,
    model: "gpt-4o-mini",
    apiKey: null,
    fieldsPath: null, // skip scraping; use this DetectedFormField[] instead
    pretty: true,
    dryRun: false,
    maxRetries: 1
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const v = argv[i + 1];
      i += 1;
      return v;
    };
    switch (arg) {
      case "--url": out.url = next(); break;
      case "--html": out.htmlPath = next(); break;
      case "--profile": out.profilePath = next(); break;
      case "--job": out.job = next(); break;
      case "--company": out.company = next(); break;
      case "--platform": out.platform = next(); break;
      case "--out": out.out = next(); break;
      case "--mode": out.mode = next(); break;
      case "--llm-url": out.llmUrl = next(); break;
      case "--api-base": out.apiBaseUrl = next(); break;
      case "--model": out.model = next(); break;
      case "--api-key": out.apiKey = next(); break;
      case "--fields": out.fieldsPath = next(); break;
      case "--max-retries": out.maxRetries = Number(next()); break;
      case "--no-pretty": out.pretty = false; break;
      case "--dry-run": out.dryRun = true; break;
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("--")) {
          console.error(`Unknown arg: ${arg}`);
          process.exit(2);
        }
    }
  }

  return out;
}

function printHelp() {
  process.stdout.write(`form-mapping-harness -- test the form-mapping LLM end-to-end

USAGE
  node scripts/form-mapping-harness.cjs --url <URL> --profile <profile.json> [opts]
  node scripts/form-mapping-harness.cjs --html <file.html> --profile <profile.json> [opts]
  node scripts/form-mapping-harness.cjs --fields <fields.json> --profile <profile.json> [opts]

OPTIONS
  --url <URL>            Fetch the URL and scrape form fields from the HTML.
  --html <file>          Read HTML from a local file instead of fetching.
  --fields <file>        Skip scraping -- use a pre-built DetectedFormField[].
  --profile <file>       Path to a MasterProfile JSON file (see sample-profile.json).
  --job <text>           Job description text (optional, helps the LLM).
  --company <name>       Company name (optional).
  --platform <id>        Platform hint: greenhouse | workday | lever | icims |
                         taleo | smartrecruiters | wellfound | ashby | jobvite | generic.
  --mode <mode>          "direct" (default) calls an OpenAI-compatible chat
                         completions endpoint; "api" POSTs to the production
                         /api/form-mapping endpoint that the extension uses.
  --llm-url <URL>        Direct-mode chat-completions URL (default: $OPENAI_BASE_URL/v1/chat/completions or https://api.openai.com/v1/chat/completions).
  --api-base <URL>       API-mode base URL (default: $JOBBER_HOPPER_API_BASE_URL or http://localhost:3000).
  --model <name>         Direct-mode model name (default: gpt-4o-mini).
  --api-key <key>        API key for direct mode. Falls back to $OPENAI_API_KEY.
  --out <file>           Write the mapping result to this path (default: stdout).
  --max-retries <n>      Retry N times on parse/validation failures (default: 1).
  --no-pretty            Print compact JSON.
  --dry-run              Print the prompt and skip the LLM call.

ENV
  OPENAI_API_KEY         Direct-mode API key.
  OPENAI_BASE_URL        Direct-mode base URL.
  JOBBER_HOPPER_API_BASE_URL   API-mode base URL.
`);
}

/* ---------- IO helpers ---------------------------------------------------- */

async function loadHtml(opts) {
  if (opts.htmlPath) {
    return fs.promises.readFile(opts.htmlPath, "utf8");
  }
  if (!opts.url) {
    throw new Error("Either --url or --html is required (or use --fields).");
  }
  const res = await fetch(opts.url, {
    headers: {
      "User-Agent": "jobber-hopper-harness/0.1 (+local-dev)",
      Accept: "text/html,application/xhtml+xml"
    },
    redirect: "follow"
  });
  if (!res.ok) {
    throw new Error(`Fetch ${opts.url} -> HTTP ${res.status}`);
  }
  return res.text();
}

async function loadProfile(path) {
  if (!path) {
    throw new Error("--profile is required (path to MasterProfile JSON).");
  }
  const text = await fs.promises.readFile(path, "utf8");
  return JSON.parse(text);
}

async function loadFields(opts) {
  if (opts.fieldsPath) {
    const text = await fs.promises.readFile(opts.fieldsPath, "utf8");
    return JSON.parse(text);
  }
  const html = await loadHtml(opts);
  return scrapeHtml(html);
}

/* ---------- prompt assembly ----------------------------------------------- */

function buildUserMessage({ fields, profile, job, company, platform }) {
  // The system prompt uses {FORM_FIELDS_JSON} / {USER_PROFILE_JSON} /
  // {JOB_DESCRIPTION} / {COMPANY_NAME} / {PLATFORM_NAME} placeholders that
  // we also substitute in the user message so downstream tooling that
  // re-templated the system prompt still has the same shape.
  return JSON.stringify({
    formFields: fields,
    userProfile: profile,
    jobDescription: job ?? null,
    company: company ?? null,
    platform: platform ?? null
  });
}

function buildSystemPrompt({ fields, profile, job, company, platform }) {
  return FORM_MAPPING_SYSTEM_PROMPT
    .replace("{FORM_FIELDS_JSON}", JSON.stringify(fields, null, 2))
    .replace("{USER_PROFILE_JSON}", JSON.stringify(profile, null, 2))
    .replace("{JOB_DESCRIPTION}", job ?? "(not provided)")
    .replace("{COMPANY_NAME}", company ?? "(not provided)")
    .replace("{PLATFORM_NAME}", platform ?? "generic");
}

/* ---------- LLM callers --------------------------------------------------- */

async function callDirectLlm(opts, { system, user }) {
  const url =
    opts.llmUrl ||
    (process.env.OPENAI_BASE_URL
      ? `${process.env.OPENAI_BASE_URL.replace(/\/$/, "")}/v1/chat/completions`
      : "https://api.openai.com/v1/chat/completions");
  const apiKey = opts.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Direct mode requires --api-key or $OPENAI_API_KEY.");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        // Wrap the user payload in { answer: ... } so json_object mode is happy.
        { role: "user", content: `Return JSON of shape { "mappings": [...] }.\n\n${user}` }
      ]
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM HTTP ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("LLM response missing choices[0].message.content");
  }
  return content;
}

async function callProductionApi(opts, { fields }) {
  const base = (
    opts.apiBaseUrl ||
    process.env.JOBBER_HOPPER_API_BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const profileId = opts.profileId || "local-dev-user";
  const url = `${base}/api/form-mapping?profileId=${encodeURIComponent(profileId)}`;
  const apiKey = opts.apiKey || process.env.JOBBER_HOPPER_API_KEY;
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const domain = opts.url ? new URL(opts.url).hostname.toLowerCase() : "local";
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      domain,
      formHash: "harness-" + Date.now(),
      platform: opts.platform ?? "generic",
      fields
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API HTTP ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = await res.json();
  return JSON.stringify({ mappings: data.mappings ?? [] });
}

/* ---------- response parsing / validation --------------------------------- */

function parseMappings(rawText) {
  // Tolerate fenced code blocks and stray prose.
  const trimmed = rawText.trim();
  const candidates = [trimmed];
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidates.push(fence[1].trim());
  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    candidates.push(trimmed.slice(arrayStart, arrayEnd + 1));
  }

  const errors = [];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate);
      const arr = extractMappingsArray(parsed);
      if (arr) return arr;
    } catch (err) {
      errors.push(err.message);
    }
  }
  throw new Error(
    `Could not parse LLM response as a mapping array. Attempts:\n  - ${errors.join("\n  - ")}\n\nRaw:\n${trimmed.slice(0, 800)}`
  );
}

function extractMappingsArray(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.mappings)) return parsed.mappings;
  if (parsed && Array.isArray(parsed.fields)) return parsed.fields;
  return null;
}

function validateMapping(m) {
  if (!m || typeof m !== "object") return "not an object";
  if (typeof m.fieldId !== "string" || m.fieldId.length === 0) return "missing fieldId";
  if (typeof m.action !== "string" || !["type", "select", "check", "upload", "click"].includes(m.action)) {
    return `invalid action: ${m.action}`;
  }
  if (m.value !== null && typeof m.value !== "string" && typeof m.value !== "boolean") {
    return `value must be string|boolean|null`;
  }
  if (typeof m.confidence !== "number" || m.confidence < 0 || m.confidence > 1) {
    return `confidence must be 0..1`;
  }
  return null;
}

function validateMappings(mappings) {
  const issues = [];
  mappings.forEach((m, i) => {
    const err = validateMapping(m);
    if (err) issues.push(`[${i}] ${m?.fieldId ?? "?"}: ${err}`);
  });
  return issues;
}

/* ---------- main ---------------------------------------------------------- */

async function main() {
  const opts = parseArgs(process.argv);

  const fields = await loadFields(opts);
  const profile = await loadProfile(opts.profilePath);
  const system = buildSystemPrompt({ fields, profile, job: opts.job, company: opts.company, platform: opts.platform });
  const user = buildUserMessage({ fields, profile, job: opts.job, company: opts.company, platform: opts.platform });

  if (opts.dryRun) {
    process.stdout.write(
      `--- SYSTEM PROMPT ---\n${system.slice(0, 4000)}${system.length > 4000 ? "\n...[truncated]..." : ""}\n\n--- USER MESSAGE ---\n${user}\n`
    );
    return;
  }

  console.error(`[harness] scraped ${fields.length} field(s); calling LLM (mode=${opts.mode})...`);

  let lastErr = null;
  for (let attempt = 0; attempt <= opts.maxRetries; attempt += 1) {
    try {
      const raw =
        opts.mode === "api"
          ? await callProductionApi(opts, { fields })
          : await callDirectLlm(opts, { system, user });

      const mappings = parseMappings(raw);
      const issues = validateMappings(mappings);
      const out = {
        generatedAt: new Date().toISOString(),
        url: opts.url ?? null,
        platform: opts.platform ?? null,
        scrapedFieldCount: fields.length,
        mappingCount: mappings.length,
        validationIssues: issues,
        mappings
      };

      const json = opts.pretty ? JSON.stringify(out, null, 2) : JSON.stringify(out);
      if (opts.out) {
        await fs.promises.mkdir(path.dirname(path.resolve(opts.out)), { recursive: true });
        await fs.promises.writeFile(opts.out, json, "utf8");
        console.error(`[harness] wrote ${opts.out} (${mappings.length} mapping(s), ${issues.length} validation issue(s))`);
      } else {
        process.stdout.write(`${json}\n`);
      }
      if (issues.length > 0) process.exitCode = 3;
      return;
    } catch (err) {
      lastErr = err;
      console.error(`[harness] attempt ${attempt + 1} failed: ${err.message}`);
    }
  }
  console.error(`[harness] giving up after ${opts.maxRetries + 1} attempt(s)`);
  throw lastErr;
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});
