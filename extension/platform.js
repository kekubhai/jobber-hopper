"use strict";
function detectJobPlatform() {
    if (typeof isGreenhouseApplicationPage === "function" && isGreenhouseApplicationPage()) {
        return "greenhouse";
    }
    return "generic";
}
function getPlatformScanRoot() {
    if (detectJobPlatform() === "greenhouse" && typeof getGreenhouseApplyRoot === "function") {
        return getGreenhouseApplyRoot();
    }
    return document;
}
function enhancePlatformLabel(field) {
    if (detectJobPlatform() === "greenhouse" && typeof guessGreenhouseLabel === "function") {
        return guessGreenhouseLabel(field);
    }
    return "";
}
function shouldIncludeControlForPlatform(field) {
    if (detectJobPlatform() === "greenhouse" && typeof isGreenhouseVisibleControl === "function") {
        return isGreenhouseVisibleControl(field);
    }
    return true;
}
function onPlatformScanStart() {
    if (detectJobPlatform() === "greenhouse" && typeof logGreenhouseScanHint === "function") {
        logGreenhouseScanHint();
    }
}
window.jobberHopperPlatform = () => typeof detectJobPlatform === "function" ? detectJobPlatform() : "generic";
