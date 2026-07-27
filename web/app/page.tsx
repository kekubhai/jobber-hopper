import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { PrimaryButton } from "@/components/landing/primary-button";
import { StoreButton } from "@/components/landing/store-button";
import { SectionHeading } from "@/components/landing/section-heading";
import { FeatureCard } from "@/components/landing/feature-card";
import { AnalyticsChartMockup } from "@/components/landing/analytics-chart-mockup";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import {
  ApplyMockup,
  CategoryBubbles,
  NotificationMockup,
  ResumeImportMockup,
  TrackerMockup
} from "@/components/landing/feature-mockups";
import { PricingCard } from "@/components/landing/pricing-card";
import { FAQAccordion } from "@/components/landing/faq-accordion";
import { Testimonials } from "@/components/landing/testimonials";
import { Stats } from "@/components/landing/stats";
import { FadeUp } from "@/components/landing/fade-up";
import {
  ANALYTICS_MINI_FEATURES,
  CONTACT_EMAIL,
  FAQ_ITEMS,
  HERO_STICKERS,
  PRICING_PLANS,
  STEPS,
  TOP_FEATURES,
  WHY_BENEFITS,
  type Benefit
} from "@/lib/landing-data";

export const metadata: Metadata = {
  title: "Jobber Hopper — Get hired today",
  description:
    "One master profile autofills every job application. Greenhouse and Workday support, resume import, application tracking, and funnel analytics."
};

const AVATARS = [
  { initials: "AK", tone: "bg-[#f0453f]" },
  { initials: "SR", tone: "bg-[#f5820f]" },
  { initials: "DM", tone: "bg-[#0a1633]" },
  { initials: "LP", tone: "bg-[#0f9d58]" }
];

const ICON_TONES: Record<Benefit["tone"], string> = {
  blue: "bg-[#eaf1fe] text-[#1468F5]",
  coral: "bg-[#ffecec] text-[#f0453f]",
  orange: "bg-[#fff3e6] text-[#f5820f]"
};

function BenefitCard({ benefit }: { benefit: Benefit }) {
  const Icon = benefit.icon;
  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg shadow-[#0a1633]/10 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${ICON_TONES[benefit.tone]}`}>
        <Icon size={20} aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-extrabold text-[#0a1633]">{benefit.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-[#5b6478]">{benefit.description}</p>
    </div>
  );
}

const FEATURE_MOCKUPS = {
  apply: <ApplyMockup />,
  chart: <AnalyticsChartMockup />,
  resume: <ResumeImportMockup />,
  tracker: <TrackerMockup />
} as const;

export default function LandingPage() {
  return (
    <div id="top" className="landing-root">
      <Header />
      <main className="landing-main">
        {/* 2. Hero */}
        <section
          aria-labelledby="hero-heading"
          className="hero-blue relative overflow-hidden pb-16 pt-32 sm:pt-36"
        >
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <FadeUp>
              <h1 id="hero-heading" className="uppercase leading-[0.95] tracking-tight text-white">
                <span className="block text-[clamp(3rem,10vw,7.5rem)] font-extrabold">Get Hired</span>
                <span className="block text-[clamp(3rem,10vw,7.5rem)] font-extrabold md:pl-[28%]">Today</span>
              </h1>
            </FadeUp>

            <div className="mt-10 grid items-end gap-12 md:grid-cols-[1fr_auto_1fr]">
              {/* Left: supporting copy + trust */}
              <FadeUp delay={0.1} className="order-2 md:order-1">
                <p className="max-w-sm text-base leading-relaxed text-white/90">
                  One master profile autofills every job application — Greenhouse, Workday, and more — saving you hours of retyping.
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex -space-x-3" aria-hidden>
                    {AVATARS.map((avatar) => (
                      <span
                        key={avatar.initials}
                        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white ${avatar.tone}`}
                      >
                        {avatar.initials}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-white/85">
                    Trusted by job seekers
                    <span className="block font-extrabold text-white">applying on 10+ platforms</span>
                  </p>
                </div>
              </FadeUp>

              {/* Center: phone mockup with stickers */}
              <FadeUp delay={0.15} className="order-1 flex justify-center md:order-2">
                <div className="relative">
                  <PhoneMockup />
                  <span className="absolute -left-4 top-8 -rotate-6 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#f0453f] shadow-lg sm:-left-8">
                    {HERO_STICKERS[0]}
                  </span>
                  <span className="absolute -right-4 top-1/3 rotate-3 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#0a1633] shadow-lg sm:-right-14">
                    {HERO_STICKERS[1]}
                  </span>
                  <span className="absolute -left-4 bottom-16 rotate-[-3deg] rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#1468F5] shadow-lg sm:-left-16">
                    {HERO_STICKERS[2]}
                  </span>
                </div>
              </FadeUp>

              {/* Right: store buttons */}
              <FadeUp delay={0.2} className="order-3 flex flex-row flex-wrap justify-start gap-3 md:flex-col md:items-end">
                <StoreButton store="chrome" tone="dark" />
                <StoreButton store="web" tone="dark" />
              </FadeUp>
            </div>
          </div>
        </section>

        {/* 3. Social proof / statistics */}
        <section aria-labelledby="stats-heading" className="bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.3fr]">
            <FadeUp>
              <h2 id="stats-heading" className="text-3xl font-extrabold leading-tight tracking-tight text-[#0a1633] sm:text-4xl">
                Join thousands of job seekers
              </h2>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-[#5b6478]">
                Every day, people land interviews faster by autofilling applications in seconds instead of retyping the same answers.
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <Stats />
            </FadeUp>
          </div>
        </section>

        {/* 4. Job analytics feature */}
        <section aria-labelledby="analytics-heading" className="bg-white pb-20 sm:pb-24">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <FadeUp>
              <div className="grid-tex-lightblue relative overflow-hidden rounded-3xl bg-[#dcE9fd] p-8 sm:p-12">
                <span className="absolute -left-8 top-10 h-24 w-40 rounded-full bg-white/60 blur-xl" aria-hidden />
                <span className="absolute right-4 top-24 h-20 w-32 rounded-full bg-white/50 blur-xl" aria-hidden />
                <div className="relative mx-auto w-[260px] rounded-[2rem] border-8 border-[#0a1633] bg-[#f5f7fb] p-4 shadow-xl">
                  <p className="text-xs font-extrabold text-[#0a1633]">Your funnel analytics</p>
                  <AnalyticsChartMockup className="mt-3" title="Forms detected" metric="+18%" />
                  <div className="mt-3 rounded-2xl bg-[#1468F5] p-3 text-white">
                    <p className="text-[10px] font-semibold text-white/75">Autofill acceptance</p>
                    <p className="text-lg font-extrabold">92%</p>
                  </div>
                </div>
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <SectionHeading
                align="left"
                title="Stay ahead with real time data"
                description="Funnel analytics turn your search into a system: watch forms detected become fields matched, autofills accepted, and applications submitted — and make informed career decisions instead of guessing."
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {ANALYTICS_MINI_FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title}>
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                          feature.tone === "blue" ? "bg-[#eaf1fe] text-[#1468F5]" : "bg-[#ffecec] text-[#f0453f]"
                        }`}
                      >
                        <Icon size={22} aria-hidden />
                      </span>
                      <h3 className="mt-3 text-base font-extrabold text-[#0a1633]">{feature.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#5b6478]">{feature.description}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8">
                <PrimaryButton href="#features" variant="dark">
                  Explore more features
                  <ArrowRight size={16} aria-hidden />
                </PrimaryButton>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* 5. Top features */}
        <section id="features" aria-labelledby="features-heading" className="bg-white pb-20 sm:pb-24">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <FadeUp>
              <SectionHeading
                title="Top features of jobber hopper"
                description="The extension does the heavy lifting: instant autofill, resume import, automatic tracking, and analytics that show what is working."
              />
            </FadeUp>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TOP_FEATURES.map((feature, index) => (
                <FadeUp key={feature.title} delay={index * 0.06}>
                  <FeatureCard title={feature.title} description={feature.description} className="h-full">
                    {FEATURE_MOCKUPS[feature.mockup]}
                  </FeatureCard>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Steps */}
        <section id="steps" aria-labelledby="steps-heading" className="grid-tex-light bg-[#f7f9fd] py-20 sm:py-24">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <FadeUp>
              <SectionHeading eyebrow="Get started" title="Simple steps to get hired" />
            </FadeUp>
            <div className="mt-14 grid gap-10 sm:grid-cols-3">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <FadeUp key={step.title} delay={index * 0.08}>
                    <div className="text-center">
                      <span
                        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-white ${
                          step.tone === "blue" ? "bg-[#1468F5]" : "bg-[#f0453f]"
                        }`}
                      >
                        <Icon size={28} aria-hidden />
                      </span>
                      <h3 className="mt-5 text-lg font-extrabold text-[#0a1633]">{step.title}</h3>
                      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#5b6478]">{step.description}</p>
                    </div>
                  </FadeUp>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. Why Jobber Hopper */}
        <section aria-labelledby="why-heading" className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <FadeUp>
              <div className="grid-tex-blue rounded-[2.5rem] bg-[#1468F5] px-6 py-14 sm:px-12 sm:py-16">
                <h2
                  id="why-heading"
                  className="mx-auto max-w-2xl text-center text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl"
                >
                  Why Jobber Hopper? Your Smartest Career Move!
                </h2>
                <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
                  <div className="flex flex-col gap-6">
                    {WHY_BENEFITS.slice(0, 2).map((benefit) => (
                      <BenefitCard key={benefit.title} benefit={benefit} />
                    ))}
                  </div>
                  <div className="flex justify-center max-lg:order-first">
                    <PhoneMockup />
                  </div>
                  <div className="flex flex-col gap-6">
                    {WHY_BENEFITS.slice(2).map((benefit) => (
                      <BenefitCard key={benefit.title} benefit={benefit} />
                    ))}
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* 8A. Feature story: platform coverage */}
        <section id="platforms" aria-labelledby="platforms-heading" className="bg-white pb-20 sm:pb-24">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <FadeUp>
              <div className="grid-tex-light rounded-3xl border border-[#e6eaf2] bg-[#f7f9fd] p-8 sm:p-12">
                <CategoryBubbles />
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <SectionHeading
                align="left"
                title="One profile works across every platform"
                description="Greenhouse and Workday are fully supported — including Workday's multi-step wizards and dynamic fields — with Lever, iCIMS, Taleo, Wellfound, Ashby, SmartRecruiters, and Jobvite detection built in. Your profile follows you everywhere you apply."
              />
              <div className="mt-8">
                <PrimaryButton href="#features" variant="dark">
                  Explore more features
                  <ArrowRight size={16} aria-hidden />
                </PrimaryButton>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* 8B. Feature story: application tracking */}
        <section aria-labelledby="tracking-heading" className="bg-white pb-20 sm:pb-24">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <FadeUp className="max-lg:order-last">
              <SectionHeading
                align="left"
                title="Every application tracked automatically"
                description="The moment you autofill a form, Jobber Hopper logs the company, role, and date. Update statuses as you hear back and watch your whole pipeline in one dashboard — no spreadsheet required."
              />
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="grid-tex-light rounded-3xl border border-[#e6eaf2] bg-[#f7f9fd] p-8 sm:p-12">
                <NotificationMockup />
              </div>
            </FadeUp>
          </div>
        </section>

        {/* 9. Testimonials */}
        <section id="testimonials" aria-label="Testimonials" className="grid-tex-blue bg-[#1468F5] py-20 sm:py-24">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <FadeUp>
              <Testimonials />
            </FadeUp>
          </div>
        </section>

        {/* 10. Pricing */}
        <section id="pricing" aria-labelledby="pricing-heading" className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <FadeUp>
              <SectionHeading eyebrow="Pricing plans" title="Flexible pricing plans" />
            </FadeUp>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {PRICING_PLANS.map((plan, index) => (
                <FadeUp key={plan.name} delay={index * 0.08} className="h-full">
                  <PricingCard plan={plan} />
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* 11. FAQ */}
        <section id="faq" aria-labelledby="faq-heading" className="bg-white pb-20 sm:pb-24">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
            <FadeUp>
              <SectionHeading
                align="left"
                title="Questions and answers"
                description="Everything you need to know about autofill, platform coverage, and applying with Jobber Hopper."
              />
              <p className="mt-8 text-sm font-bold text-[#0a1633]">Got more questions?</p>
              <div className="mt-3">
                <PrimaryButton href={`mailto:${CONTACT_EMAIL}`} variant="dark">
                  Contact us
                </PrimaryButton>
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <FAQAccordion items={FAQ_ITEMS} />
            </FadeUp>
          </div>
        </section>

        {/* 12. Final download CTA */}
        <section aria-labelledby="cta-heading" className="bg-white pb-20 sm:pb-24">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <FadeUp>
              <div className="grid-tex-blue grid items-end gap-10 overflow-hidden rounded-[2.5rem] bg-[#1468F5] px-6 pt-14 sm:px-12 sm:pt-16 lg:grid-cols-[1.2fr_1fr]">
                <div className="pb-14 sm:pb-16">
                  <h2
                    id="cta-heading"
                    className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl"
                  >
                    Take the next step in your career!
                  </h2>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-white/85">
                    Build your profile once and let Jobber Hopper handle the rest — instant autofill on every job form and a tracker that keeps everything in view.
                  </p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {["Autofill any application in one tap", "Track every application automatically"].map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-sm font-semibold text-white">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#1468F5]">
                          <Check size={12} strokeWidth={3} aria-hidden />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <StoreButton store="chrome" tone="dark" />
                    <StoreButton store="web" tone="white" />
                  </div>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <PhoneMockup className="translate-y-10" />
                </div>
              </div>
            </FadeUp>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
