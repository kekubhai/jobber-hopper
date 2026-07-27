type JobPlatformId = "generic" | "greenhouse";

function detectJobPlatform(): JobPlatformId {
  if (typeof isGreenhouseApplicationPage === "function" && isGreenhouseApplicationPage()) {
    return "greenhouse";
  }

  return "generic";
}

function getPlatformScanRoot(): ParentNode {
  if (detectJobPlatform() === "greenhouse" && typeof getGreenhouseApplyRoot === "function") {
    return getGreenhouseApplyRoot();
  }

  return document;
}

function enhancePlatformLabel(field: FormControl): string {
  if (detectJobPlatform() === "greenhouse" && typeof guessGreenhouseLabel === "function") {
    return guessGreenhouseLabel(field);
  }

  return "";
}

function shouldIncludeControlForPlatform(field: FormControl): boolean {
  if (detectJobPlatform() === "greenhouse" && typeof isGreenhouseVisibleControl === "function") {
    return isGreenhouseVisibleControl(field);
  }

  return true;
}

function onPlatformScanStart(): void {
  if (detectJobPlatform() === "greenhouse" && typeof logGreenhouseScanHint === "function") {
    logGreenhouseScanHint();
  }
}

window.jobberHopperPlatform = () =>
  typeof detectJobPlatform === "function" ? detectJobPlatform() : "generic";
