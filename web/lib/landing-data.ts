import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  ClipboardList,
  FileUp,
  LineChart,
  MousePointerClick,
  Radar,
  ShieldCheck,
  Star,
  Target,
  WandSparkles
} from "lucide-react";

export const BRAND_NAME = "Jobber Hopper";
export const BRAND_WORDMARK = "jobber hopper";
export const CONTACT_EMAIL = "hello@jobberhopper.app";

export type NavLink = {
  label: string;
  href: string;
  hasChevron?: boolean;
};

export const NAV_LINKS: NavLink[] = [
  { label: "All pages", href: "#top", hasChevron: true },
  { label: "Pricing", href: "#pricing" },
  { label: "Features", href: "#features" }
];

/** Rows shown inside the extension-popup mockup in the hero. */
export type PopupFieldRow = {
  label: string;
  value: string;
  safe: boolean;
};

export const POPUP_FIELD_ROWS: PopupFieldRow[] = [
  { label: "Full name", value: "Jordan Alvarez", safe: true },
  { label: "Email", value: "jordan.alvarez@gmail.com", safe: true },
  { label: "Most recent role", value: "Product Designer · Lumina Labs", safe: true },
  { label: "Work authorization", value: "Authorized · No sponsorship", safe: true },
  { label: "Cover letter", value: "Fill manually", safe: false }
];

export type MockJob = {
  role: string;
  company: string;
  salary: string;
  tags: string[];
  tone: "blue" | "coral" | "orange" | "navy";
};

export const HERO_JOBS: MockJob[] = [
  {
    role: "UX Researcher",
    company: "Lumina Labs",
    salary: "$92k–$110k",
    tags: ["Greenhouse", "Remote"],
    tone: "coral"
  },
  {
    role: "Web Engineer",
    company: "Northbeam",
    salary: "$120k–$145k",
    tags: ["Workday", "Hybrid"],
    tone: "blue"
  }
];

export type Stat = {
  value: number;
  suffix: string;
  label: string;
};

export const STATS: Stat[] = [
  { value: 10, suffix: "+", label: "Job platforms supported" },
  { value: 24, suffix: "+", label: "Fields autofilled per application" },
  { value: 30, suffix: "s", label: "Average time to apply" }
];

export type MiniFeature = {
  icon: LucideIcon;
  tone: "blue" | "coral";
  title: string;
  description: string;
};

export const ANALYTICS_MINI_FEATURES: MiniFeature[] = [
  {
    icon: LineChart,
    tone: "blue",
    title: "Funnel analytics",
    description:
      "Forms detected, fields matched, autofills accepted, applications submitted — your whole search measured end to end."
  },
  {
    icon: Star,
    tone: "coral",
    title: "Platform insights",
    description:
      "See which job boards you actually apply on — Greenhouse, Workday, and beyond — so you focus where it counts."
  }
];

export type TopFeature = {
  title: string;
  description: string;
  mockup: "apply" | "chart" | "resume" | "tracker";
};

export const TOP_FEATURES: TopFeature[] = [
  {
    title: "One-tap autofill",
    description:
      "Your master profile fills Greenhouse, Workday, and other job forms in one tap — and nothing is ever submitted without your review.",
    mockup: "apply"
  },
  {
    title: "Funnel analytics",
    description:
      "A live dashboard of forms detected, fields matched, and applications submitted keeps your search measurable.",
    mockup: "chart"
  },
  {
    title: "Resume import",
    description:
      "Upload your resume once and your work history, education, and contact details build the profile for you.",
    mockup: "resume"
  },
  {
    title: "Application tracker",
    description:
      "Every application is logged automatically — company, role, date, and status — so nothing slips through.",
    mockup: "tracker"
  }
];

export type Step = {
  icon: LucideIcon;
  tone: "blue" | "coral";
  title: string;
  description: string;
};

export const STEPS: Step[] = [
  {
    icon: Radar,
    tone: "blue",
    title: "Build your profile once",
    description:
      "Sign in with Google, import your resume, and your master profile — work history, education, Q&A — is ready."
  },
  {
    icon: Target,
    tone: "coral",
    title: "Open any job posting",
    description:
      "The extension detects the application form and maps every field to your profile with confidence scoring."
  },
  {
    icon: Briefcase,
    tone: "blue",
    title: "Autofill, review, submit",
    description:
      "Fill the safe fields in one tap, review anything flagged for manual entry, and submit on your terms."
  }
];

export type Benefit = {
  icon: LucideIcon;
  tone: "blue" | "coral" | "orange";
  title: string;
  description: string;
};

export const WHY_BENEFITS: Benefit[] = [
  {
    icon: WandSparkles,
    tone: "blue",
    title: "AI Field Mapping",
    description:
      "Rule-based matching first, LLM mapping when needed — every form field linked to the right profile value."
  },
  {
    icon: ShieldCheck,
    tone: "coral",
    title: "Review-First Safety",
    description:
      "Low-confidence fields are clearly flagged “fill manually” — no wrong answers ever land in your application."
  },
  {
    icon: MousePointerClick,
    tone: "orange",
    title: "One-Tap Easy Apply",
    description:
      "Multi-step wizards on Workday and Greenhouse collapse into a single review-and-fill."
  },
  {
    icon: BarChart3,
    tone: "blue",
    title: "Career Insights",
    description:
      "Funnel analytics show exactly where your applications win or stall, platform by platform."
  }
];

export type CategoryBubble = {
  label: string;
  tone: "blue" | "coral" | "orange" | "navy" | "gray";
};

/** Platforms the extension detects — the real coverage story. */
export const CATEGORY_BUBBLES: CategoryBubble[] = [
  { label: "Greenhouse", tone: "blue" },
  { label: "Workday", tone: "navy" },
  { label: "Lever", tone: "coral" },
  { label: "iCIMS", tone: "gray" },
  { label: "Taleo", tone: "orange" },
  { label: "Wellfound", tone: "gray" },
  { label: "Ashby", tone: "blue" },
  { label: "SmartRecruiters", tone: "coral" },
  { label: "Jobvite", tone: "gray" }
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
  tone: "blue" | "coral" | "orange";
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I applied to 40 roles in the time it used to take me to do five. The Workday autofill alone saved my sanity — and I landed a senior design role in three weeks.",
    name: "James Thompson",
    role: "Senior Product Designer",
    initials: "JT",
    tone: "blue"
  },
  {
    quote:
      "The funnel analytics changed how I searched. I could see which platforms actually responded, so I stopped wasting evenings on dead-end boards.",
    name: "Michael Bennett",
    role: "Data Analyst",
    initials: "MB",
    tone: "coral"
  },
  {
    quote:
      "Resume import filled my whole profile in seconds, and every Greenhouse application since has been one review and one tap. It genuinely feels unfair.",
    name: "Top Clofen",
    role: "Frontend Engineer",
    initials: "TC",
    tone: "orange"
  }
];

export type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  emphasized?: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Basic plan",
    price: "Free",
    period: "forever",
    description: "Everything you need to start applying smarter.",
    features: [
      "Unlimited one-tap autofills",
      "Master profile & resume import",
      "Application tracker"
    ],
    cta: "Start for free"
  },
  {
    name: "Elite plan",
    price: "$29.99",
    period: "/month",
    description: "For serious searches that need every advantage.",
    features: [
      "AI field mapping on every platform",
      "Full funnel & platform analytics",
      "Priority support & early features"
    ],
    cta: "Go Elite",
    emphasized: true
  },
  {
    name: "Pro plan",
    price: "$9.99",
    period: "/month",
    description: "Level up coverage for active job seekers.",
    features: [
      "All supported ATS platforms",
      "Confidence scoring & safe-fill review",
      "Application status timeline"
    ],
    cta: "Choose Pro"
  }
];

export type FAQItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How does Jobber Hopper fill my applications?",
    answer:
      "Your master profile — work history, education, contact details, and custom Q&A — lives in one place. When you open a job form, the extension detects every field, maps it with rule-based matching first and AI mapping when needed, then fills only the fields it is confident about. Anything uncertain is flagged for manual entry."
  },
  {
    question: "Is Jobber Hopper free to use?",
    answer:
      "Yes. The Basic plan is free forever and includes unlimited one-tap autofills, resume import, and the application tracker. Pro and Elite add broader platform coverage and full analytics when you want them."
  },
  {
    question: "Which job platforms are supported?",
    answer:
      "Greenhouse and Workday are fully supported today — including Workday's multi-step wizards and dynamic fields — with Lever, iCIMS, Taleo, Wellfound, Ashby, SmartRecruiters, and Jobvite detection built in. Coverage is prioritized by where users actually apply."
  },
  {
    question: "Will it ever submit an application without me?",
    answer:
      "Never. Jobber Hopper is review-first: it fills the form and stops. You check every value, complete any flagged fields, and press submit yourself. Applications are then logged to your tracker automatically."
  }
];

export type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Quick links",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Testimonials", href: "#testimonials" },
      { label: "Dashboard", href: "/dashboard" }
    ]
  },
  {
    title: "Platforms",
    links: [
      { label: "Greenhouse", href: "#platforms" },
      { label: "Workday", href: "#platforms" },
      { label: "Lever", href: "#platforms" },
      { label: "All platforms", href: "#platforms" }
    ]
  },
  {
    title: "Support & resources",
    links: [
      { label: "Help center", href: "#faq" },
      { label: "Getting started", href: "#steps" },
      { label: "Link the extension", href: "/dashboard#account" },
      { label: "Privacy policy", href: "#faq" }
    ]
  },
  {
    title: "Contact us",
    links: [
      { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
      { label: "Partnerships", href: `mailto:${CONTACT_EMAIL}` },
      { label: "Press kit", href: "#top" },
      { label: "Careers", href: "#top" }
    ]
  }
];

export const HERO_STICKERS = ["New!", "Smart Field Mapping", "Works on Workday"];
