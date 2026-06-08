import { ArrowRight, CheckCircle, Calendar, CreditCard, Users, MapPin, Shield, BarChart3, Smartphone } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "AI-powered booking and dispatch. Auto-assign workers based on location, skills, and availability.",
  },
  {
    icon: CreditCard,
    title: "M-Pesa Payments",
    description: "Seamless STK Push, B2C payouts, and auto-reconciliation. No manual accounting needed.",
  },
  {
    icon: Users,
    title: "Worker Management",
    description: "Onboard, verify KYC, track performance, and manage payouts — all in one place.",
  },
  {
    icon: MapPin,
    title: "Real-time Tracking",
    description: "Live worker GPS tracking, ETA updates, and geofenced job verification.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "RBAC, audit logs, tenant isolation, and end-to-end encryption out of the box.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Real-time dashboards, revenue reports, worker utilization, and cohort analysis.",
  },
];

const steps = [
  { number: "01", title: "Sign Up", description: "Create your business account. Takes 2 minutes." },
  { number: "02", title: "Add Services", description: "Set up your service catalog, pricing, and availability." },
  { number: "03", title: "Onboard Workers", description: "Invite workers, verify KYC, and set schedules." },
  { number: "04", title: "Go Live", description: "Start accepting bookings and managing operations." },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    features: ["Up to 50 bookings/mo", "3 workers", "Basic analytics", "Email support"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Growth",
    price: "KES 5,000",
    period: "/month",
    features: ["Up to 500 bookings/mo", "20 workers", "Advanced analytics", "M-Pesa integration", "Priority support"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: ["Unlimited bookings", "Unlimited workers", "Custom integrations", "Dedicated account manager", "SLA guarantee"],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-surface-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-500" />
            <span className="text-xl font-bold text-surface-900">ServiceOS</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-surface-600 hover:text-surface-900">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-surface-600 hover:text-surface-900">How It Works</a>
            <a href="#pricing" className="text-sm font-medium text-surface-600 hover:text-surface-900">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm font-medium text-surface-600 hover:text-surface-900">Sign In</a>
            <a
              href="/demo"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-surface-50" />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 text-center lg:pt-32">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-surface-200 bg-white px-4 py-1.5 text-sm text-surface-600 mb-8">
            <Smartphone className="h-4 w-4 text-brand-500" />
            <span>Now available on iOS & Android</span>
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl">
            Operations Platform for{" "}
            <span className="text-brand-500">Service Businesses</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-surface-500">
            Manage bookings, payments, workers, and customers from one dashboard.
            Built for cleaning companies, caregiving agencies, and field service businesses in Africa.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <a
              href="/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/demo"
              className="inline-flex items-center gap-2 rounded-xl border border-surface-300 bg-white px-6 py-3 text-sm font-semibold text-surface-700 hover:bg-surface-50 transition-colors"
            >
              Watch Demo
            </a>
          </div>
          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-surface-400">
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> No credit card</span>
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> 14-day free trial</span>
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-surface-100 bg-surface-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">Features</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-surface-900 sm:text-4xl">
              Everything you need to run your service business
            </h2>
            <p className="mt-4 text-surface-500">
              From booking to payment, we handle the complexity so you can focus on delivering great service.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="group rounded-xl border border-surface-200 bg-white p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 inline-flex rounded-lg bg-brand-50 p-3">
                  <feat.icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900">{feat.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-500">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">How It Works</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-surface-900 sm:text-4xl">
              Get started in minutes
            </h2>
            <p className="mt-4 text-surface-500">
              Simple setup process. No technical skills required.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-surface-900">{step.title}</h3>
                <p className="mt-2 text-sm text-surface-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-surface-100 bg-surface-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">Pricing</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-surface-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-surface-500">
              Start free, upgrade as you grow. No hidden fees.
            </p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border bg-white p-8 ${
                  plan.popular ? "border-brand-500 shadow-lg ring-1 ring-brand-500" : "border-surface-200"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-surface-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-surface-900">{plan.price}</span>
                  {plan.period && <span className="text-sm text-surface-400">{plan.period}</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-surface-600">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/signup"
                  className={`mt-8 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-colors ${
                    plan.popular
                      ? "bg-brand-500 text-white hover:bg-brand-600"
                      : "border border-surface-300 text-surface-700 hover:bg-surface-50"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="rounded-2xl bg-surface-900 p-12 sm:p-16">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Ready to transform your service business?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-surface-400">
              Join hundreds of service businesses in Africa using ServiceOS to streamline operations and grow revenue.
            </p>
            <a
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Start Your Free Trial <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-100 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-brand-500" />
              <span className="text-sm font-bold text-surface-900">ServiceOS</span>
            </div>
            <div className="flex gap-6 text-sm text-surface-400">
              <a href="#" className="hover:text-surface-600">Privacy</a>
              <a href="#" className="hover:text-surface-600">Terms</a>
              <a href="#" className="hover:text-surface-600">Contact</a>
            </div>
            <p className="text-sm text-surface-400">
              &copy; {new Date().getFullYear()} ServiceOS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
