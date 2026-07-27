/** Job application hosts we specialize in (Phase 5 — one platform at a time). */
export type JobPlatformId = "generic" | "greenhouse" | "workday" | "lever";

export const JOB_PLATFORM_LABELS: Record<JobPlatformId, string> = {
  generic: "Generic form",
  greenhouse: "Greenhouse",
  workday: "Workday",
  lever: "Lever"
};
