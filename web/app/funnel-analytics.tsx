"use client";

import { useEffect, useState } from "react";
import { isClerkClientConfigured } from "@/lib/clerk-env";
import { useProfileAuthHeaders } from "./use-profile-auth-headers";

type Analytics = {
  funnel: {
    formsDetected: number;
    reviewedForms: number;
    fieldsDetected: number;
    fieldsMatched: number;
    fieldMatchRate: number;
    autofillAccepted: number;
    autofillAcceptanceRate: number;
    submitted: number;
  };
  platformUsage: Array<{ name: string; formsDetected: number }>;
  domainUsage: Array<{ name: string; formsDetected: number }>;
};

export function FunnelAnalytics() {
  if (isClerkClientConfigured()) return <FunnelAnalyticsWithClerk />;
  return <FunnelAnalyticsContent authHeaders={{}} />;
}

function FunnelAnalyticsWithClerk() {
  const authHeaders = useProfileAuthHeaders();
  return <FunnelAnalyticsContent authHeaders={authHeaders} />;
}

function FunnelAnalyticsContent({ authHeaders }: { authHeaders: Record<string, string> }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [status, setStatus] = useState("Loading funnel data...");

  async function loadAnalytics() {
    try {
      const url = authHeaders.Authorization ? "/api/analytics" : "/api/analytics?profileId=local-dev-user";
      const response = await fetch(url, { headers: authHeaders });
      if (!response.ok) throw new Error("Could not load funnel data");
      const payload = await response.json() as Analytics;
      setAnalytics(payload);
      setStatus(payload.funnel.formsDetected === 0 ? "No tracked job forms yet." : "Based on tracked job application pages.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load funnel data");
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, [authHeaders.Authorization]);

  const funnel = analytics?.funnel;
  return (
    <section className="section-card funnel-analytics" id="analytics">
      <div className="section-header">
        <div>
          <p className="eyebrow">Product analytics</p>
          <h2>Where autofill succeeds</h2>
        </div>
        <button className="button-secondary" type="button" onClick={() => void loadAnalytics()}>
          Refresh
        </button>
      </div>
      <p className="help-copy">
        Counts only: no profile values or full DOM are logged. Use observed platforms and domains to decide the next ATS adapter.
      </p>
      <p className="status-line">{status}</p>
      {funnel ? (
        <>
          <div className="funnel-metrics">
            <Metric label="Forms detected" value={funnel.formsDetected} />
            <Metric label="Field match rate" value={percent(funnel.fieldMatchRate)} />
            <Metric label="Autofill accepted" value={percent(funnel.autofillAcceptanceRate)} />
            <Metric label="Native submits seen" value={funnel.submitted} />
          </div>
          <div className="analytics-breakdown">
            <UsageList title="Platforms to prioritize" values={analytics?.platformUsage ?? []} />
            <UsageList title="Top application domains" values={analytics?.domainUsage ?? []} />
          </div>
        </>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
}

function UsageList({ title, values }: { title: string; values: Array<{ name: string; formsDetected: number }> }) {
  return (
    <div>
      <h3>{title}</h3>
      {values.length === 0 ? (
        <p className="help-copy">No data yet.</p>
      ) : (
        <ol className="usage-list">
          {values.map((value) => <li key={value.name}><span>{value.name}</span><strong>{value.formsDetected}</strong></li>)}
        </ol>
      )}
    </div>
  );
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
