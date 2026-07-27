"use strict";
async function sha256HexFromString(value) {
    const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}
async function computeFormHash(fields) {
    const canonical = canonicalFormFieldsForHash(fields);
    return sha256HexFromString(canonical);
}
async function fetchLlmFormMappings(settings, fields, platform) {
    const domain = window.location.hostname.toLowerCase();
    const formHash = await computeFormHash(fields);
    const url = `${settings.apiBaseUrl}/api/form-mapping?profileId=${encodeURIComponent(settings.profileId)}`;
    const headers = {
        "Content-Type": "application/json",
        ...(await getExtensionAuthHeaders())
    };
    const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
            domain,
            formHash,
            platform,
            fields
        })
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Form mapping API failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
    }
    const payload = await response.json();
    console.info(`${CONTENT_LOG_PREFIX} LLM form mapping ${payload.cached ? "cache hit" : "generated"} for ${domain}`);
    return payload.mappings ?? [];
}
function mergeRuleAndLlmMatches(profile, ruleMatches, llmMappings) {
    const llmById = new Map(llmMappings.map((mapping) => [mapping.fieldId, mapping]));
    return ruleMatches.map((match) => {
        const confidence = estimateConfidence(match);
        if (match.profileFieldPath && match.value && confidence >= LOW_CONFIDENCE_THRESHOLD) {
            return match;
        }
        const llm = llmById.get(match.fieldId);
        if (!llm?.profileFieldPath || !isProfileFieldPath(llm.profileFieldPath)) {
            return match;
        }
        const value = resolveAutofillValue(profile, llm.profileFieldPath, match.labelGuess, match.fieldId);
        if (!value) {
            return { ...match, profileFieldPath: llm.profileFieldPath, value: null };
        }
        return {
            ...match,
            profileFieldPath: llm.profileFieldPath,
            value
        };
    });
}
async function enrichMatchesWithLlmWhenNeeded(profile, scanned, ruleMatches, settings) {
    const needsLlm = ruleMatches.some((match) => {
        const confidence = estimateConfidence(match);
        return confidence < LOW_CONFIDENCE_THRESHOLD || !match.profileFieldPath || !match.value;
    });
    if (!needsLlm) {
        return ruleMatches;
    }
    try {
        const platform = typeof detectJobPlatform === "function" ? detectJobPlatform() : "generic";
        const llmMappings = await fetchLlmFormMappings(settings, scanned, platform);
        return mergeRuleAndLlmMatches(profile, ruleMatches, llmMappings);
    }
    catch (error) {
        console.warn(`${CONTENT_LOG_PREFIX} LLM form mapping skipped`, error);
        return ruleMatches;
    }
}
