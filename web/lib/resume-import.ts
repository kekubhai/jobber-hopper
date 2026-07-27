import mammoth from "mammoth";
// Import the parser directly. `pdf-parse`'s package entry runs a bundled
// debug fixture under Turbopack, which causes a server-side ENOENT/500.
import pdf from "pdf-parse/lib/pdf-parse.js";
import {
  createEmptyMasterProfile,
  createEmptyEducationEntry,
  createEmptyWorkHistoryEntry,
  type MasterProfile
} from "@jobber-hopper/shared";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_RESUME_TEXT_CHARS = 80_000;

export type ResumeImportResult = {
  profile: MasterProfile;
  sourceTextLength: number;
};

export async function extractResumeText(file: File): Promise<string> {
  if (file.size === 0) {
    throw new Error("The resume file is empty.");
  }

  if (file.size > MAX_RESUME_BYTES) {
    throw new Error("Resume must be 5 MB or smaller.");
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".txt") || file.type.startsWith("text/")) {
    return buffer.toString("utf8").trim();
  }

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const result = await pdf(buffer);
    return result.text.trim();
  }

  if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error("Supported resume formats are PDF, DOCX, and TXT.");
}

export async function extractProfileFromResumeText(text: string): Promise<ResumeImportResult> {
  const sourceText = text.replace(/\u0000/g, "").trim().slice(0, MAX_RESUME_TEXT_CHARS);
  if (sourceText.length < 30) {
    throw new Error("We could not extract enough text from this resume. Try a text-based PDF, DOCX, or TXT file.");
  }

  const normalized = parseResumeText(sourceText);

  return {
    profile: normalized,
    sourceTextLength: sourceText.length
  };
}

function parseResumeText(text: string): MasterProfile {
  const profile = createEmptyMasterProfile();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const email = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] ?? "";
  const linkedIn = text.match(/https?:\/\/(?:[\w-]+\.)?linkedin\.com\/[^\s|,;]+/i)?.[0] ?? "";
  const urls = text.match(/https?:\/\/[^\s|,;]+/gi) ?? [];
  const portfolio = urls.find((url) => !/linkedin\.com/i.test(url)) ?? "";
  const phone = text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{3,4}/)?.[0] ?? "";

  profile.personal.email = email;
  profile.personal.phone = phone;
  profile.personal.linkedinUrl = linkedIn;
  profile.personal.portfolioUrl = portfolio;

  const nameLine = lines.find((line) => isLikelyName(line));
  if (nameLine) {
    const [firstName = "", ...lastName] = nameLine.replace(/[^A-Za-zÀ-ÿ' -]/g, "").split(/\s+/);
    profile.personal.firstName = firstName;
    profile.personal.lastName = lastName.join(" ");
  }

  const headlineIndex = nameLine ? lines.indexOf(nameLine) + 1 : -1;
  if (headlineIndex >= 0) {
    const candidate = lines[headlineIndex] ?? "";
    if (candidate.length > 2 && candidate.length < 120 && !containsContactDetail(candidate)) {
      profile.personal.headline = candidate;
    }
  }

  const workSection = getResumeSection(lines, ["experience", "employment", "work history", "professional experience"]);
  const educationSection = getResumeSection(lines, ["education", "academic background", "qualifications"]);
  profile.workHistory = parseWorkHistory(workSection);
  profile.education = parseEducation(educationSection);

  return profile;
}

function isLikelyName(line: string): boolean {
  if (line.length < 3 || line.length > 80 || containsContactDetail(line)) {
    return false;
  }

  if (/^(resume|curriculum vitae|cv|experience|education|skills|summary|profile)$/i.test(line)) {
    return false;
  }

  const words = line.split(/\s+/);
  return words.length >= 2 && words.length <= 4 && words.every((word) => /^[A-Za-zÀ-ÿ'.-]+$/.test(word));
}

function containsContactDetail(value: string): boolean {
  return /@|https?:\/\/|\+?\d[\d\s().-]{6,}/i.test(value);
}

function getResumeSection(lines: string[], headings: string[]): string[] {
  const headingIndex = lines.findIndex((line) => {
    const normalized = line.toLowerCase().replace(/[:|]/g, "").trim();
    return headings.includes(normalized);
  });

  if (headingIndex < 0) {
    return [];
  }

  const result: string[] = [];
  for (const line of lines.slice(headingIndex + 1)) {
    if (
      /^(experience|employment|work history|professional experience|education|academic background|qualifications|skills|certifications|projects|languages|references)$/i.test(
        line.replace(/[:|]/g, "").trim()
      )
    ) {
      break;
    }
    result.push(line);
  }

  return result;
}

function parseWorkHistory(lines: string[]): MasterProfile["workHistory"] {
  const chunks = splitSectionIntoEntries(lines);
  return chunks
    .map((chunk) => {
      const entry = createEmptyWorkHistoryEntry();
      const dateLineIndex = chunk.findIndex((line) => hasDateRange(line));
      const dateLine = dateLineIndex >= 0 ? chunk[dateLineIndex] : "";
      const detailLines = chunk.filter((_line, index) => index !== dateLineIndex);

      entry.title = detailLines[0] ?? "";
      entry.company = detailLines[1] ?? "";
      entry.highlights = detailLines.slice(2).join("\n").slice(0, 3000);

      const dates = parseDateRange(dateLine);
      entry.startDate = dates.startDate;
      entry.endDate = dates.endDate;
      entry.current = dates.current;

      return entry;
    })
    .filter((entry) => entry.title || entry.company);
}

function parseEducation(lines: string[]): MasterProfile["education"] {
  const chunks = splitSectionIntoEntries(lines);
  return chunks
    .map((chunk) => {
      const entry = createEmptyEducationEntry();
      const dateLineIndex = chunk.findIndex((line) => hasDateRange(line));
      const dateLine = dateLineIndex >= 0 ? chunk[dateLineIndex] : "";
      const detailLines = chunk.filter((_line, index) => index !== dateLineIndex);

      entry.school = detailLines[0] ?? "";
      entry.degree = detailLines.find((line) => /\b(bachelor|master|doctor|ph\.?d|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|mba|diploma)\b/i.test(line)) ?? "";
      entry.fieldOfStudy = detailLines.find((line) => /\b(in|of)\b/i.test(line) && line !== entry.degree) ?? "";
      entry.notes = detailLines.filter((line) => line !== entry.school && line !== entry.degree && line !== entry.fieldOfStudy).join("\n");

      const dates = parseDateRange(dateLine);
      entry.startDate = dates.startDate;
      entry.endDate = dates.endDate;
      return entry;
    })
    .filter((entry) => entry.school || entry.degree);
}

function splitSectionIntoEntries(lines: string[]): string[][] {
  const entries: string[][] = [];
  let current: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[•▪◦\-]\s*/, "").trim();
    if (!line) {
      continue;
    }

    if (hasDateRange(line) && current.some((entry) => hasDateRange(entry))) {
      entries.push(current);
      current = [line];
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    entries.push(current);
  }

  return entries;
}

function hasDateRange(value: string): boolean {
  return /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|\d{1,2}[/-])[\s./-]*\d{2,4}\s*(?:-|–|—|to)\s*(?:present|current|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|\d{1,2}[/-])[\s./-]*\d{2,4})\b/i.test(value) ||
    /\b(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:present|current|(?:19|20)\d{2})\b/i.test(value);
}

function parseDateRange(value: string): { startDate: string; endDate: string; current: boolean } {
  const parts = value.split(/\s*(?:-|–|—|\bto\b)\s*/i);
  if (parts.length < 2) {
    return { startDate: "", endDate: "", current: false };
  }

  const endPart = parts[parts.length - 1].trim();
  const current = /^(present|current)$/i.test(endPart);
  return {
    startDate: normalizeResumeDate(parts[0]),
    endDate: current ? "" : normalizeResumeDate(endPart),
    current
  };
}

function normalizeResumeDate(value: string): string {
  const year = value.match(/\b(19|20)\d{2}\b/)?.[0];
  if (!year) {
    return "";
  }

  const monthMatch = value.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i)?.[0];
  if (!monthMatch) {
    return `${year}-01-01`;
  }

  const month = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec"
  ].indexOf(monthMatch.slice(0, 3).toLowerCase()) + 1;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}
