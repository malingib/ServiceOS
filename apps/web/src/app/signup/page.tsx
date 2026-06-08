import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, Home, Phone, ShieldCheck, UserPlus } from "lucide-react";

const accountTypes = [
  {
    title: "Customer account",
    text: "Book cleaning, track visits, view balances, and keep service history.",
    icon: Home,
    action: "Continue as customer",
    href: "/book/service",
  },
  {
    title: "Worker application",
    text: "Apply as a cleaner, laundry assistant, nanny, caregiver, cook, or house help.",
    icon: BriefcaseBusiness,
    action: "Apply as worker",
    href: "/worker/jobs",
  },
  {
    title: "Agency admin",
    text: "Manage customers, staff verification, bookings, payouts, and quality follow-up.",
    icon: ShieldCheck,
    action: "Open admin",
    href: "/admin/dashboard",
  },
];

export default function SignupPage() {
  return (
    <main className="min-h-screen text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="font-black text-[var(--brand-dark)]">
            Join ServiceOS
          </Link>
          <a className="inline-flex items-center rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-black text-white" href="tel:0141580500">
            <Phone className="mr-2 h-4 w-4" />
            0141580500
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <UserPlus className="h-10 w-10 text-[var(--brand-dark)]" />
            <h1 className="mt-4 text-balance text-4xl font-black tracking-tight sm:text-5xl">Create the right account for the work you need</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Customers, workers, and agency staff enter the same operating system through different views.
            </p>
          </div>
          <form className="rounded-2xl bg-white p-6 shadow-[var(--shadow-tight)]">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-7 w-7 text-[var(--brand-dark)]" />
              <h2 className="text-2xl font-black">Quick intake</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input suppressHydrationWarning className="rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--brand-dark)]" placeholder="Full name" />
              <input suppressHydrationWarning className="rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--brand-dark)]" placeholder="Phone number" inputMode="tel" />
              <select suppressHydrationWarning className="rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--brand-dark)]">
                <option>Customer</option>
                <option>Cleaner</option>
                <option>House help</option>
                <option>Nanny / babysitter</option>
                <option>Caregiver</option>
                <option>Cook</option>
                <option>Admin staff</option>
              </select>
              <input suppressHydrationWarning className="rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--brand-dark)]" placeholder="Location" />
            </div>
            <button className="mt-5 rounded-full bg-[var(--brand)] px-6 py-4 font-black text-[var(--ink)]" type="button">
              Save intake
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {accountTypes.map(({ title, text, icon: Icon, action, href }) => (
            <Link key={title} href={href} className="rounded-2xl bg-white p-6 shadow-[var(--shadow-tight)]">
              <Icon className="h-8 w-8 text-[var(--brand-dark)]" />
              <h2 className="mt-5 text-2xl font-black">{title}</h2>
              <p className="mt-2 leading-7 text-[var(--muted)]">{text}</p>
              <span className="mt-6 inline-flex items-center font-black text-[var(--brand-dark)]">
                {action}
                <ArrowRight className="ml-2 h-5 w-5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
