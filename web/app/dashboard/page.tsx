import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProfileForm } from "../profile-form";
import { ApplicationTracker } from "../application-tracker";
import { FunnelAnalytics } from "../funnel-analytics";
import { DashboardHeader } from "@/components/landing/dashboard-header";
import { SectionHeading } from "@/components/landing/section-heading";
import { FeatureCard } from "@/components/landing/feature-card";
import { Stats } from "@/components/landing/stats";
import { DASHBOARD_STATS } from "@/lib/landing-data";

export const metadata: Metadata = {
  title: "Dashboard — Jobber Hopper",
  description: "Master profile, application tracker, and funnel analytics."
};

export default function DashboardPage() {
  return (
    <div id="top" className="landing-root">
      <DashboardHeader />
      <main className="landing-main">
        {/* Hero */}
        <section
          aria-labelledby="dashboard-heading"
          className="hero-blue relative overflow-hidden pb-16 pt-32 sm:pt-36"
        >
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <h1
              id="dashboard-heading"
              className="uppercase leading-[0.95] tracking-tight text-white"
            >
              <span className="block text-[clamp(2.5rem,8vw,6rem)] font-extrabold">Your</span>
              <span className="block text-[clamp(2.5rem,8vw,6rem)] font-extrabold md:pl-[28%]">Dashboard</span>
            </h1>

            <div className="mt-10 grid items-end gap-12 md:grid-cols-[1.3fr_1fr]">
              <div>
                <p className="max-w-md text-base leading-relaxed text-white/90">
                  Edit your master profile, track every application, and watch your funnel
                  analytics — all in one place. The Chrome extension reads this page
                  automatically once you sign in.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href="#profile"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#1468F5] transition-colors hover:bg-[#eaf1fe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Edit profile
                    <ArrowRight size={16} aria-hidden />
                  </a>
                  <a
                    href="#analytics"
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    See analytics
                  </a>
                </div>
              </div>
              <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-lg shadow-[#0a1633]/30 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">At a glance</p>
                <p className="mt-2 text-lg font-extrabold">Everything in one view</p>
                <p className="mt-2 text-sm leading-relaxed text-white/85">
                  Your master profile is the source of truth. Applications, analytics, and
                  the extension all read from it — change once, update everywhere.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section aria-label="Dashboard at a glance" className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <Stats items={DASHBOARD_STATS} />
          </div>
        </section>

        {/* Master profile section */}
        <section id="profile" aria-labelledby="profile-heading" className="bg-white pb-20 sm:pb-24">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <SectionHeading
              eyebrow="Step 1 — Master profile"
              title="One profile, every application"
              description="Personal info, address, education, work history, and custom Q&A live in one object so autofill can stay deterministic. Save once, the extension reads it."
            />
            <div className="mt-12">
              <ProfileForm />
            </div>
          </div>
        </section>

        {/* Application tracker */}
        <section id="applications" aria-labelledby="applications-heading" className="grid-tex-light bg-[#f7f9fd] py-20 sm:py-24">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <SectionHeading
              eyebrow="Step 2 — Track applications"
              title="Every application in one pipeline"
              description="An entry appears the moment you approve a fill on a recognized job application page. Update its status here; the extension never auto-submits."
            />
            <div className="mt-12">
              <ApplicationTracker />
            </div>
          </div>
        </section>

        {/* Funnel analytics */}
        <section id="analytics" aria-labelledby="analytics-heading" className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <SectionHeading
              eyebrow="Step 3 — Funnel analytics"
              title="Where autofill succeeds"
              description="Counts only — no profile values or full DOM are logged. Use the observed platforms and domains to decide the next ATS adapter."
            />
            <div className="mt-12">
              <FunnelAnalytics />
            </div>
          </div>
        </section>

        {/* Feature reminder row */}
        <section aria-label="What you get" className="grid-tex-blue bg-[#1468F5] py-20 sm:py-24">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <SectionHeading
              tone="white"
              eyebrow="Why this works"
              title="Built so you never retype the same answer twice"
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                title="Rule-based autofill"
                description="Pattern matching for first name, email, phone, address, LinkedIn, and more — no LLM required for the common case."
              />
              <FeatureCard
                title="One profile, every form"
                description="Greenhouse, Workday, Lever, iCIMS, and custom career sites all read from the same master record."
              />
              <FeatureCard
                title="You approve every fill"
                description="The extension highlights fields, you edit values, then click Fill. Nothing is auto-submitted."
              />
              <FeatureCard
                title="Track as you go"
                description="Applications and funnel metrics appear automatically so you can see what is working."
              />
            </div>
            <div className="mt-12 flex justify-center">
              <a
                href="#profile"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#1468F5] transition-colors hover:bg-[#eaf1fe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Sparkles size={16} aria-hidden />
                Start with your profile
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
