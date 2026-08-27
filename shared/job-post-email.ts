export type JobPostEmailDraft = {
  subject: string;
  body: string;
  wordCount: number;
  toEmail: string | null;
  hiringManagerName: string | null;
};

export function emptyJobPostEmailDraft(): JobPostEmailDraft {
  return {
    subject: "",
    body: "",
    wordCount: 0,
    toEmail: null,
    hiringManagerName: null
  };
}

export function countEmailWords(body: string): number {
  const trimmed = body.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).filter(Boolean).length;
}
