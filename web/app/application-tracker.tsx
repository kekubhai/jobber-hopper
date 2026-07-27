"use client";

import { useEffect, useState } from "react";
import { isClerkClientConfigured } from "@/lib/clerk-env";
import { useProfileAuthHeaders } from "./use-profile-auth-headers";

const STATUSES = ["draft", "applied", "interview", "offer", "rejected", "withdrawn"] as const;
type ApplicationStatus = typeof STATUSES[number];

type Application = {
  id: string;
  job_url: string;
  domain: string;
  platform: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  last_filled_at: string;
};

export function ApplicationTracker() {
  if (isClerkClientConfigured()) {
    return <ApplicationTrackerWithClerk />;
  }

  return <ApplicationTrackerContent authHeaders={{}} />;
}

function ApplicationTrackerWithClerk() {
  const authHeaders = useProfileAuthHeaders();
  return <ApplicationTrackerContent authHeaders={authHeaders} />;
}

function ApplicationTrackerContent({ authHeaders }: { authHeaders: Record<string, string> }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [status, setStatus] = useState("Loading applications...");
  const [isLoading, setIsLoading] = useState(true);

  async function loadApplications() {
    setIsLoading(true);
    try {
      const url = authHeaders.Authorization ? "/api/applications" : "/api/applications?profileId=local-dev-user";
      const response = await fetch(url, { headers: authHeaders });
      if (!response.ok) {
        throw new Error("Could not load applications");
      }
      const payload = await response.json() as { applications?: Application[] };
      const entries = payload.applications ?? [];
      setApplications(entries);
      setStatus(entries.length === 0 ? "No tracked applications yet." : `${entries.length} tracked application${entries.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load applications");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, [authHeaders.Authorization]);

  async function updateStatus(id: string, nextStatus: ApplicationStatus) {
    const previous = applications;
    setApplications((current) =>
      current.map((application) =>
        application.id === id ? { ...application, status: nextStatus } : application
      )
    );

    try {
      const response = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ id, status: nextStatus })
      });
      if (!response.ok) {
        throw new Error("Could not update application status");
      }
    } catch (error) {
      setApplications(previous);
      setStatus(error instanceof Error ? error.message : "Could not update application status");
    }
  }

  return (
    <section className="section-card application-tracker" id="applications">
      <div className="section-header">
        <div>
          <p className="eyebrow">Application tracker</p>
          <h2>Keep up with every application</h2>
        </div>
        <div className="button-row">
          <button className="button-secondary" type="button" disabled={isLoading} onClick={() => void loadApplications()}>
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>
      <p className="help-copy">
        An entry appears after you approve a fill on a recognized job application page. Update its status here; filling never submits an application.
      </p>
      <p className="status-line">{status}</p>
      {applications.length > 0 ? (
        <div className="application-list">
          {applications.map((application) => (
            <article className="application-card" key={application.id}>
              <div>
                <h3>{application.role || "Untitled role"}</h3>
                <p>{application.company || application.domain} · {application.platform}</p>
                <a href={application.job_url} target="_blank" rel="noreferrer">Open posting</a>
              </div>
              <label>
                Status
                <select
                  value={application.status}
                  onChange={(event) => void updateStatus(application.id, event.target.value as ApplicationStatus)}
                >
                  {STATUSES.map((statusValue) => (
                    <option key={statusValue} value={statusValue}>
                      {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
