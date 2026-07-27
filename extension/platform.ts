type JobPlatformId =
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

function detectJobPlatform(): JobPlatformId {
  if (typeof isGreenhouseApplicationPage === "function" && isGreenhouseApplicationPage()) {
    return "greenhouse";
  }

  if (typeof isWorkdayApplicationPage === "function" && isWorkdayApplicationPage()) {
    return "workday";
  }

  const host = window.location.hostname.toLowerCase();
  if (host.endsWith("lever.co") || host.includes(".lever.co")) return "lever";
  if (host.includes("icims.com")) return "icims";
  if (host.includes("taleo.net") || host.includes("taleo.com")) return "taleo";
  if (host.includes("wellfound.com") || host.includes("angel.co")) return "wellfound";
  if (host.includes("ashbyhq.com")) return "ashby";
  if (host.includes("smartrecruiters.com")) return "smartrecruiters";
  if (host.includes("jobvite.com")) return "jobvite";

  return "generic";
}

function getPlatformScanRoot(): ParentNode {
  if (detectJobPlatform() === "greenhouse" && typeof getGreenhouseApplyRoot === "function") {
    return getGreenhouseApplyRoot();
  }

  if (detectJobPlatform() === "workday" && typeof getWorkdayApplyRoot === "function") {
    return getWorkdayApplyRoot();
  }

  return document;
}

function getPlatformFormControls(): FormControl[] | null {
  if (detectJobPlatform() === "workday" && typeof getWorkdayFormControls === "function") {
    return getWorkdayFormControls();
  }

  return null;
}

function enhancePlatformLabel(field: FormControl): string {
  if (detectJobPlatform() === "greenhouse" && typeof guessGreenhouseLabel === "function") {
    return guessGreenhouseLabel(field);
  }

  if (detectJobPlatform() === "workday" && typeof guessWorkdayLabel === "function") {
    return guessWorkdayLabel(field);
  }

  return "";
}

function shouldIncludeControlForPlatform(field: FormControl): boolean {
  if (detectJobPlatform() === "greenhouse" && typeof isGreenhouseVisibleControl === "function") {
    return isGreenhouseVisibleControl(field);
  }

  if (detectJobPlatform() === "workday" && typeof isWorkdayVisibleControl === "function") {
    return isWorkdayVisibleControl(field);
  }

  return true;
}

function getPlatformStableFieldId(field: FormControl, index: number, labelGuess: string): string {
  if (detectJobPlatform() === "workday" && typeof getWorkdayStableFieldId === "function") {
    return getWorkdayStableFieldId(field, index, labelGuess);
  }

  return "";
}

function onPlatformScanStart(): void {
  if (detectJobPlatform() === "greenhouse" && typeof logGreenhouseScanHint === "function") {
    logGreenhouseScanHint();
  }

  if (detectJobPlatform() === "workday" && typeof logWorkdayScanHint === "function") {
    logWorkdayScanHint();
  }
}

window.jobberHopperPlatform = () =>
  typeof detectJobPlatform === "function" ? detectJobPlatform() : "generic";
