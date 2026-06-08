import Link from "next/link";
import { CalendarCheck, CheckCircle2, Clock, CreditCard, MapPin, MessageCircle, Star } from "lucide-react";

const bookings = [
  ["Today 10:00 AM", "Studio apartment cleaning", "Amina assigned", "In progress"],
  ["Fri 14 Jun", "Laundry pickup", "Awaiting pickup", "Scheduled"],
  ["Monthly", "Office cleaning", "Recurring plan", "Active"],
];

export default function CustomerDashboardPage() {
  return (
    <main className="min-h-screen text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="font-black text-[var(--brand-dark)]">
            Customer portal
          </Link>
          <Link className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-black text-[var(--ink)]" href="/book/service">
            New booking
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <h1 className="text-balance text-4xl font-black tracking-tight sm:text-5xl">Welcome back, Customer</h1>
            <p className="mt-3 max-w-2xl leading-8 text-[var(--muted)]">
              Track visits, balances, assigned workers, and service history from one place.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                [CalendarCheck, "3", "Active bookings"],
                [CreditCard, "Ksh 1,150", "Open balance"],
                [Star, "4.9", "Average rating"],
              ].map(([Icon, value, label]) => (
                <div key={label as string} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-tight)]">
                  <Icon className="h-6 w-6 text-[var(--brand-dark)]" />
                  <p className="mt-4 text-3xl font-black">{value as string}</p>
                  <p className="mt-1 text-sm font-bold text-[var(--muted)]">{label as string}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-white p-6 shadow-[var(--shadow-tight)]">
              <h2 className="text-2xl font-black">Your bookings</h2>
              <div className="mt-5 divide-y divide-[var(--line)]">
                {bookings.map(([time, service, assignment, status]) => (
                  <div key={service} className="grid gap-3 py-4 md:grid-cols-[145px_1fr_150px_120px] md:items-center">
                    <p className="font-black">{time}</p>
                    <p className="font-bold">{service}</p>
                    <p className="text-sm font-bold text-[var(--muted)]">{assignment}</p>
                    <p className="w-fit rounded-full bg-[var(--mint)] px-3 py-1 text-sm font-black text-[var(--brand-dark)]">{status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-tight)]">
              <h2 className="text-2xl font-black">Next visit</h2>
              <div className="mt-5 space-y-4">
                {[
                  [Clock, "Today, 10:00 AM"],
                  [MapPin, "Casuarina, Malindi"],
                  [CheckCircle2, "Amina assigned"],
                ].map(([Icon, label]) => (
                  <p key={label as string} className="flex items-center gap-3 font-bold text-[var(--muted)]">
                    <Icon className="h-5 w-5 text-[var(--brand-dark)]" />
                    {label as string}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--ink)] p-6 text-white">
              <MessageCircle className="h-7 w-7 text-[var(--brand)]" />
              <h2 className="mt-4 text-2xl font-black">Need a change?</h2>
              <p className="mt-2 leading-7 text-white/76">Reschedule, add rooms, or request another worker through WhatsApp.</p>
              <a className="mt-5 inline-flex rounded-full bg-white px-5 py-3 font-black text-[var(--ink)]" href="https://wa.me/254141580500">
                Message support
              </a>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
