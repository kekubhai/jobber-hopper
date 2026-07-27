/** Job application hosts we specialize in (Phase 5 — one platform at a time). */
export type JobPlatformId =
  | "generic"
  | "greenhouse"
  | "workday"
  | "lever"
  | "icims"
  | "taleo"
  | "wellfound"
  | "ashby"
  | "smartrecruiters"
  | "jobvite";

export const JOB_PLATFORM_LABELS: Record<JobPlatformId, string> = {
  generic: "Generic form",
  greenhouse: "Greenhouse",
  workday: "Workday",
  lever: "Lever",
  icims: "iCIMS",
  taleo: "Taleo",
  wellfound: "Wellfound",
  ashby: "Ashby",
  smartrecruiters: "SmartRecruiters",
  jobvite: "Jobvite"
};
