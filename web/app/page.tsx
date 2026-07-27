import { ProfileForm } from "./profile-form";
import { AuthPanel } from "./auth-panel";

export default function Home() {
  return (
    <main>
      <div className="page-shell">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Phase 0 and Phase 1 setup</p>
            <h1>One profile powers every application.</h1>
            <p>
              Jobber Hopper now has a shared schema for browser actions and a master profile editor.
              Fill this profile once, store it as the source of truth, then let the extension consume it for autofill later.
            </p>
            <div className="chip-row" aria-label="Capabilities">
              <span className="chip">Shared schema package</span>
              <span className="chip">Next.js profile form</span>
              <span className="chip">Extension-ready types</span>
              <span className="chip">Supabase-ready workspace</span>
            </div>
          </div>

          <aside className="hero-card">
            <div className="hero-note">
              <div>
                <strong>What is already wired</strong>
                <p>The web app now edits the profile object directly instead of a placeholder landing page.</p>
              </div>
              <div>
                <strong>What the extension sees</strong>
                <p>The browser agent still uses the same action contract, now sourced from the shared package.</p>
              </div>
              <div>
                <strong>What comes next</strong>
                <p>Swap the local profile store for Supabase once the database and auth flow are ready.</p>
              </div>
            </div>
          </aside>
        </section>

        <div className="workspace-grid">
          <AuthPanel />
          <section className="section-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Master profile</p>
                <h2>Profile source of truth</h2>
              </div>
              <p>
                Personal info, address, education, work history, and custom Q&A live in one object so autofill can stay deterministic.
              </p>
            </div>
            <ProfileForm />
          </section>
        </div>
      </div>
    </main>
  );
}
