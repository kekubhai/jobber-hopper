"use client";

import { useEffect, useState } from "react";
import {
  createEmptyAddressInfo,
  createEmptyCustomQaPair,
  createEmptyEducationEntry,
  createEmptyMasterProfile,
  createEmptyPersonalInfo,
  createEmptyWorkHistoryEntry,
  isMasterProfileReady,
  normalizeMasterProfile,
  PROFILE_STORAGE_KEY,
  type MasterProfile
} from "@jobber-hopper/shared";
import { isClerkClientConfigured } from "@/lib/clerk-env";
import { useProfileAuthHeaders } from "./use-profile-auth-headers";

const storageKey = PROFILE_STORAGE_KEY;
const defaultProfileId = "local-dev-user";

export function ProfileForm() {
  if (isClerkClientConfigured()) {
    return <ProfileFormWithClerk />;
  }

  return <ProfileFormContent authHeaders={{}} />;
}

function ProfileFormWithClerk() {
  const authHeaders = useProfileAuthHeaders();
  return <ProfileFormContent authHeaders={authHeaders} />;
}

function ProfileFormContent({ authHeaders }: { authHeaders: Record<string, string> }) {
  const [profile, setProfile] = useState<MasterProfile>(() => createEmptyMasterProfile());
  const [profileId, setProfileId] = useState(defaultProfileId);
  const [status, setStatus] = useState("Unsaved profile");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void loadProfile(defaultProfileId);
  }, [authHeaders.Authorization]);

  function updateProfile(nextProfile: MasterProfile) {
    setProfile(nextProfile);
    setStatus("Unsaved changes");
  }

  async function saveProfile() {
    setIsLoading(true);
    const profileToSave = normalizeMasterProfile(profile);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ profileId, profile: profileToSave })
      });

      if (!response.ok) {
        let detail = "Save request failed";
        try {
          const payload = await response.json() as { error?: string };
          if (payload.error) {
            detail = payload.error;
          }
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(detail);
      }

      const saved = await response.json() as {
        profile: MasterProfile;
        profileId: string;
      };

      const normalized = normalizeMasterProfile(saved.profile);
      setProfile(normalized);
      setProfileId(saved.profileId);
      window.localStorage.setItem(storageKey, JSON.stringify(normalized, null, 2));
      setStatus("Saved to Supabase. This is now the source of truth for autofill.");
    } catch (error) {
      window.localStorage.setItem(storageKey, JSON.stringify(profileToSave, null, 2));
      const message = error instanceof Error ? error.message : "Could not reach Supabase";
      setStatus(`${message} — saved local backup only.`);
    } finally {
      setIsLoading(false);
    }
  }

  function resetProfile() {
    const nextProfile = createEmptyMasterProfile();
    setProfile(nextProfile);
    window.localStorage.removeItem(storageKey);
    setStatus("Cleared local profile draft");
  }

  return (
    <div className="stack">
      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Profile identity</p>
            <h3>Profile key used by web and extension</h3>
          </div>
          <div className="button-row">
            <button
              className="button-secondary"
              type="button"
              onClick={() => void loadProfile(profileId)}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load profile"}
            </button>
          </div>
        </div>

        <div className="grid-2">
          <Field label="Profile ID">
            <input
              value={profileId}
              onChange={(event) => setProfileId(event.target.value)}
              placeholder="local-dev-user"
            />
          </Field>
          <div className="field">
            <label>Profile readiness</label>
            <input value={isMasterProfileReady(profile) ? "Ready for autofill" : "Not ready yet"} readOnly />
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Identity</p>
            <h3>Personal and contact details</h3>
          </div>
          <div className="button-row">
            <button className="button-secondary" type="button" onClick={() => updateProfile({
              ...profile,
              personal: createEmptyPersonalInfo(),
              address: createEmptyAddressInfo()
            })}>
              Clear personal data
            </button>
          </div>
        </div>

        <div className="grid-3">
          <Field label="First name">
            <input value={profile.personal.firstName} onChange={(event) => updateSection("personal", "firstName", event.target.value)} />
          </Field>
          <Field label="Last name">
            <input value={profile.personal.lastName} onChange={(event) => updateSection("personal", "lastName", event.target.value)} />
          </Field>
          <Field label="Preferred name">
            <input value={profile.personal.preferredName} onChange={(event) => updateSection("personal", "preferredName", event.target.value)} />
          </Field>
          <p className="help-copy" style={{ gridColumn: "1 / -1", margin: 0 }}>
            Legal name for forms is saved as <strong>First name</strong> + <strong>Last name</strong> in Supabase under{" "}
            <code>master_profiles.personal</code> (also stored as <code>fullName</code> / <code>name</code> on save).
          </p>
          <Field label="Email">
            <input type="email" value={profile.personal.email} onChange={(event) => updateSection("personal", "email", event.target.value)} />
          </Field>
          <Field label="Phone">
            <input value={profile.personal.phone} onChange={(event) => updateSection("personal", "phone", event.target.value)} />
          </Field>
          <Field label="Headline">
            <input value={profile.personal.headline} onChange={(event) => updateSection("personal", "headline", event.target.value)} />
          </Field>
          <Field label="LinkedIn URL">
            <input value={profile.personal.linkedinUrl} onChange={(event) => updateSection("personal", "linkedinUrl", event.target.value)} />
          </Field>
          <Field label="Portfolio URL">
            <input value={profile.personal.portfolioUrl} onChange={(event) => updateSection("personal", "portfolioUrl", event.target.value)} />
          </Field>
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label>Professional summary</label>
          <textarea value={profile.personal.summary} onChange={(event) => updateSection("personal", "summary", event.target.value)} />
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Address</p>
            <h3>Mailing and location fields</h3>
          </div>
          <p>Keep these current so applications and contact forms do not fall back to stale defaults.</p>
        </div>

        <div className="grid-2">
          <Field label="Street line 1">
            <input value={profile.address.line1} onChange={(event) => updateSection("address", "line1", event.target.value)} />
          </Field>
          <Field label="Street line 2">
            <input value={profile.address.line2} onChange={(event) => updateSection("address", "line2", event.target.value)} />
          </Field>
          <Field label="City">
            <input value={profile.address.city} onChange={(event) => updateSection("address", "city", event.target.value)} />
          </Field>
          <Field label="Region or state">
            <input value={profile.address.region} onChange={(event) => updateSection("address", "region", event.target.value)} />
          </Field>
          <Field label="Postal code">
            <input value={profile.address.postalCode} onChange={(event) => updateSection("address", "postalCode", event.target.value)} />
          </Field>
          <Field label="Country">
            <input value={profile.address.country} onChange={(event) => updateSection("address", "country", event.target.value)} />
          </Field>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Education</p>
            <h3>Academic history</h3>
          </div>
          <button className="button-secondary" type="button" onClick={() => updateProfile({
            ...profile,
            education: [...profile.education, createEmptyEducationEntry()]
          })}>
            Add education
          </button>
        </div>

        <div className="entry-list">
          {profile.education.length === 0 ? (
            <p className="help-copy">No education entries yet. Add your first school to begin the profile.</p>
          ) : null}
          {profile.education.map((entry, index) => (
            <article className="entry-card" key={`education-${index}`}>
              <header>
                <h3>Education #{index + 1}</h3>
                <button className="button-ghost" type="button" onClick={() => removeEntry("education", index)}>
                  Remove
                </button>
              </header>
              <div className="grid-2">
                <Field label="School">
                  <input value={entry.school} onChange={(event) => updateEducation(index, "school", event.target.value)} />
                </Field>
                <Field label="Degree">
                  <input value={entry.degree} onChange={(event) => updateEducation(index, "degree", event.target.value)} />
                </Field>
                <Field label="Field of study">
                  <input value={entry.fieldOfStudy} onChange={(event) => updateEducation(index, "fieldOfStudy", event.target.value)} />
                </Field>
                <Field label="Notes">
                  <input value={entry.notes} onChange={(event) => updateEducation(index, "notes", event.target.value)} />
                </Field>
              </div>
              <div className="grid-2" style={{ marginTop: 14 }}>
                <Field label="Start date">
                  <input type="date" value={entry.startDate} onChange={(event) => updateEducation(index, "startDate", event.target.value)} />
                </Field>
                <Field label="End date">
                  <input type="date" value={entry.endDate} onChange={(event) => updateEducation(index, "endDate", event.target.value)} />
                </Field>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Work history</p>
            <h3>Employment timeline</h3>
          </div>
          <button className="button-secondary" type="button" onClick={() => updateProfile({
            ...profile,
            workHistory: [...profile.workHistory, createEmptyWorkHistoryEntry()]
          })}>
            Add job
          </button>
        </div>

        <div className="entry-list">
          {profile.workHistory.length === 0 ? (
            <p className="help-copy">No work history entries yet. Add your current or most recent role first.</p>
          ) : null}
          {profile.workHistory.map((entry, index) => (
            <article className="entry-card" key={`work-${index}`}>
              <header>
                <h3>Role #{index + 1}</h3>
                <button className="button-ghost" type="button" onClick={() => removeEntry("workHistory", index)}>
                  Remove
                </button>
              </header>
              <div className="grid-3">
                <Field label="Company">
                  <input value={entry.company} onChange={(event) => updateWorkHistory(index, "company", event.target.value)} />
                </Field>
                <Field label="Title">
                  <input value={entry.title} onChange={(event) => updateWorkHistory(index, "title", event.target.value)} />
                </Field>
                <Field label="Location">
                  <input value={entry.location} onChange={(event) => updateWorkHistory(index, "location", event.target.value)} />
                </Field>
                <Field label="Start date">
                  <input type="date" value={entry.startDate} onChange={(event) => updateWorkHistory(index, "startDate", event.target.value)} />
                </Field>
                <Field label="End date">
                  <input type="date" value={entry.endDate} onChange={(event) => updateWorkHistory(index, "endDate", event.target.value)} />
                </Field>
                <Field label="Current role">
                  <select value={entry.current ? "yes" : "no"} onChange={(event) => updateWorkHistory(index, "current", event.target.value === "yes") as void}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </Field>
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <label>Highlights</label>
                <textarea value={entry.highlights} onChange={(event) => updateWorkHistory(index, "highlights", event.target.value)} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Custom Q&amp;A</p>
            <h3>Reusable application answers</h3>
          </div>
          <button className="button-secondary" type="button" onClick={() => updateProfile({
            ...profile,
            customQaPairs: [...profile.customQaPairs, createEmptyCustomQaPair()]
          })}>
            Add Q&amp;A pair
          </button>
        </div>

        <div className="entry-list">
          {profile.customQaPairs.length === 0 ? (
            <p className="help-copy">Store the answers that every application keeps asking for, like why you want the role or company.</p>
          ) : null}
          {profile.customQaPairs.map((entry, index) => (
            <article className="entry-card" key={`qa-${index}`}>
              <header>
                <h3>Question #{index + 1}</h3>
                <button className="button-ghost" type="button" onClick={() => removeEntry("customQaPairs", index)}>
                  Remove
                </button>
              </header>
              <div className="grid-2">
                <Field label="Question">
                  <input value={entry.question} onChange={(event) => updateQaPair(index, "question", event.target.value)} />
                </Field>
                <Field label="Answer">
                  <input value={entry.answer} onChange={(event) => updateQaPair(index, "answer", event.target.value)} />
                </Field>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Persistence</p>
            <h3>Save the current master profile</h3>
          </div>
          <div className="button-row">
            <button className="button" type="button" onClick={saveProfile}>
              Save profile
            </button>
            <button className="button-ghost" type="button" onClick={resetProfile}>
              Reset draft
            </button>
          </div>
        </div>

        <p className="status-line">{status}</p>
        <p className="help-copy">
          Until a profile exists in Supabase and is marked ready, nothing else should autofill from it. This keeps the master record explicit and user-owned.
        </p>
      </section>
    </div>
  );

  async function loadProfile(nextProfileId: string) {
    const normalizedProfileId = nextProfileId.trim().length > 0 ? nextProfileId.trim() : defaultProfileId;

    setIsLoading(true);

    try {
      const url = authHeaders.Authorization
        ? "/api/profile"
        : `/api/profile?profileId=${encodeURIComponent(normalizedProfileId)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error("Load request failed");
      }

      const data = await response.json() as {
        exists: boolean;
        profileId: string;
        profile: MasterProfile;
      };

      setProfile(normalizeMasterProfile(data.profile));
      setProfileId(data.profileId);
      if (data.exists) {
        setStatus("Loaded profile from Supabase");
      } else {
        setStatus("No profile in Supabase yet. Start filling fields and save.");
      }
      window.localStorage.setItem(storageKey, JSON.stringify(data.profile, null, 2));
      return;
    } catch {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as MasterProfile;
          setProfile(normalizeMasterProfile(parsed));
          setStatus("Loaded local backup profile (Supabase unavailable)");
          return;
        } catch {
          setStatus("Supabase unavailable and local profile invalid");
        }
      } else {
        setStatus("Supabase unavailable and no local backup profile");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function updateSection(section: "personal" | "address", key: string, value: string) {
    setProfile((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value
      }
    }));
    setStatus("Unsaved changes");
  }

  function updateEducation(index: number, key: keyof ReturnType<typeof createEmptyEducationEntry>, value: string) {
    setProfile((current) => ({
      ...current,
      education: current.education.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry)
    }));
    setStatus("Unsaved changes");
  }

  function updateWorkHistory(index: number, key: keyof ReturnType<typeof createEmptyWorkHistoryEntry>, value: string | boolean) {
    setProfile((current) => ({
      ...current,
      workHistory: current.workHistory.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry)
    }));
    setStatus("Unsaved changes");
  }

  function updateQaPair(index: number, key: keyof ReturnType<typeof createEmptyCustomQaPair>, value: string) {
    setProfile((current) => ({
      ...current,
      customQaPairs: current.customQaPairs.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry)
    }));
    setStatus("Unsaved changes");
  }

  function removeEntry(section: "education" | "workHistory" | "customQaPairs", index: number) {
    setProfile((current) => ({
      ...current,
      [section]: current[section].filter((_, entryIndex) => entryIndex !== index)
    }));
    setStatus("Unsaved changes");
  }
}

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}