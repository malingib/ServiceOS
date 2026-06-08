import Link from "next/link";
import { AlertTriangle, CalendarCheck, CheckCircle2, ClipboardList, CreditCard, Phone, Users, Wallet } from "lucide-react";

const queue = [
  ["New booking", "Two-bedroom cleaning", "Casuarina", "Assign cleaner", "High"],
  ["Placement", "Live-out house help", "Town centre", "Shortlist candidates", "Today"],
  ["Payment", "Ksh 650 M-Pesa receipt", "Watamu road", "Reconcile booking", "Open"],
  ["Quality", "Customer rating follow-up", "Marine Park", "Call customer", "Normal"],
];

const workers = [
  ["Amina", "Cleaning", "On job", "4.9", "Casuarina"],
  ["Faith", "Laundry", "Available", "4.8", "Office"],
  ["Neema", "House help", "Shortlisted", "4.7", "Town centre"],
  ["Grace", "Caregiver", "Available", "4.9", "Malindi"],
];

const stats = [
  { label: "Bookings this week", value: "18", icon: CalendarCheck },
  { label: "Verified workers", value: "12", icon: Users },
  { label: "Pending payouts", value: "Ksh 2,650", icon: Wallet },
  { label: "Needs attention", value: "2", icon: AlertTriangle },
];

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="font-black text-[var(--brand-dark)]">
            Agency control room
          </Link>
          <div className="flex flex-wrap gap-2 text-sm font-bold">
            <Link className="rounded-full bg-[var(--brand)] px-4 py-2 text-[var(--ink)]" href="/book/service">
              Create booking
            </Link>
            <Link className="rounded-full border border-[var(--ink)] px-4 py-2 text-[var(--ink)]" href="/worker/jobs">
              Worker view
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <h1 className="text-balance text-4xl font-black tracking-tight sm:text-5xl">Today&apos;s work, money, and staff state</h1>
            <p className="mt-3 max-w-2xl leading-8 text-[var(--muted)]">
              Bookings, placement requests, M-Pesa reconciliation, and worker assignment stay visible in one operating
              queue.
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--ink)] p-5 text-white">
            <p className="text-sm font-bold text-[var(--aqua)]">Today revenue</p>
            <p className="mt-1 text-4xl font-black">Ksh 8,450</p>
            <p className="mt-2 text-sm text-white/72">One receipt still needs reconciliation.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-tight)]">
              <Icon className="h-6 w-6 text-[var(--brand-dark)]" />
              <p className="mt-4 text-3xl font-black">{value}</p>
              <p className="mt-1 text-sm font-bold text-[var(--muted)]">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-tight)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Operations queue</h2>
                <p className="mt-1 text-sm font-bold text-[var(--muted)]">Sorted by action needed today.</p>
              </div>
              <ClipboardList className="h-6 w-6 text-[var(--brand-dark)]" />
            </div>
            <div className="mt-5 divide-y divide-[var(--line)]">
              {queue.map(([type, item, area, action, priority]) => (
                <div key={item} className="grid gap-3 py-4 md:grid-cols-[120px_1fr_130px_150px_86px] md:items-center">
                  <p className="font-black text-[var(--brand-dark)]">{type}</p>
                  <p className="font-bold">{item}</p>
                  <p className="text-sm font-bold text-[var(--muted)]">{area}</p>
                  <p className="text-sm text-[var(--muted)]">{action}</p>
                  <p className="w-fit rounded-full bg-[var(--mint)] px-3 py-1 text-sm font-black text-[var(--brand-dark)]">{priority}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl bg-[var(--ink)] p-6 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Staff board</h2>
                <p className="mt-1 text-sm text-white/70">Availability, role, and last known area.</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-[var(--brand)]" />
            </div>
            <div className="mt-5 space-y-3">
              {workers.map(([name, role, status, rating, area]) => (
                <div key={name} className="rounded-xl bg-white/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black">{name}</p>
                      <p className="text-sm text-white/70">{role} · {area}</p>
                    </div>
                    <p className="rounded-full bg-[var(--brand)] px-3 py-1 text-sm font-black text-[var(--ink)]">{status}</p>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-sm font-bold text-white/78">
                    <CreditCard className="h-4 w-4 text-[var(--aqua)]" />
                    Rating {rating}
                  </p>
                </div>
              ))}
            </div>
            <a className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 font-black text-[var(--ink)]" href="tel:0141580500">
              <Phone className="mr-2 h-4 w-4" />
              Call office line
            </a>
          </aside>
        </div>
      </section>
    </main>
  );
}
