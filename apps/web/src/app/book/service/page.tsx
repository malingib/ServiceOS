"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, ChevronRight, Clock, Home, MapPin, Phone, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";

const services = [
  { name: "Single room cleaning", price: 300, duration: "1-2 hrs", type: "Cleaning", note: "Best for rooms and small bedsitters." },
  { name: "Studio apartment cleaning", price: 500, duration: "2 hrs", type: "Cleaning", note: "Full reset for compact homes." },
  { name: "One-bedroom cleaning", price: 650, duration: "2-3 hrs", type: "Cleaning", note: "Kitchen, bathroom, living area, bedroom." },
  { name: "Two-bedroom cleaning", price: 800, duration: "3-4 hrs", type: "Cleaning", note: "More rooms, more surface time." },
  { name: "Deep cleaning inspection", price: 0, duration: "Inspection", type: "Cleaning", note: "Admin confirms price after inspection." },
  { name: "Laundry pickup", price: 100, duration: "per kg", type: "Laundry", note: "Pickup, wash, dry, fold, return." },
  { name: "Airbnb turnover", price: 0, duration: "same day", type: "Rental", note: "Guest-ready reset with timing notes." },
  { name: "House-help placement", price: 2000, duration: "one-time fee", type: "Placement", note: "Shortlist and screening workflow." },
];

const frequencies = ["One-time", "Weekly", "Monthly", "Placement request"];

export default function BookServicePage() {
  const [selected, setSelected] = useState(services[1]);
  const [frequency, setFrequency] = useState(frequencies[0]);

  const totalLabel = useMemo(() => {
    if (selected.price === 0) return "Quote required";
    return `Ksh ${selected.price.toLocaleString()}`;
  }, [selected]);

  return (
    <main className="min-h-screen text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="font-black text-[var(--brand-dark)]">
            ServiceOS booking
          </Link>
          <div className="flex flex-wrap gap-2 text-sm font-bold">
            <Link className="rounded-full px-4 py-2 text-[var(--muted)] hover:bg-[var(--mint)] hover:text-[var(--ink)]" href="/customer/dashboard">
              Customer portal
            </Link>
            <a className="inline-flex items-center rounded-full bg-[var(--ink)] px-4 py-2 text-white" href="tel:0141580500">
              <Phone className="mr-2 h-4 w-4" />
              Call office
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_390px] lg:px-10">
        <div>
          <div className="rounded-2xl bg-[var(--ink)] p-6 text-white">
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[var(--aqua)]">
              <span>Choose service</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Add details</span>
              <ChevronRight className="h-4 w-4" />
              <span>Office confirms</span>
            </div>
            <h1 className="mt-4 max-w-3xl text-balance text-4xl font-black tracking-tight sm:text-5xl">Book work the office can assign today</h1>
            <p className="mt-4 max-w-2xl leading-8 text-white/78">
              Select the service, share contact and location details, then submit through WhatsApp. Quote work stays in
              the queue until the team confirms the final amount.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {services.map((service) => {
              const active = selected.name === service.name;
              return (
                <button
                  key={service.name}
                  className={`rounded-2xl p-5 text-left ${
                    active ? "bg-[var(--brand)] text-[var(--ink)]" : "bg-white shadow-[var(--shadow-tight)] hover:bg-[var(--mint)]"
                  }`}
                  onClick={() => setSelected(service)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black">{service.name}</p>
                      <p className={`mt-1 text-sm font-bold ${active ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>{service.type}</p>
                    </div>
                    {active ? <CheckCircle2 className="h-6 w-6" /> : null}
                  </div>
                  <p className={`mt-4 min-h-12 text-sm leading-6 ${active ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>{service.note}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-[var(--brand-dark)]">
                      {service.price ? `Ksh ${service.price.toLocaleString()}` : "Quote"}
                    </span>
                    <span className="text-sm font-bold">{service.duration}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <form className="mt-6 rounded-2xl bg-white p-6 shadow-[var(--shadow-tight)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">Service details</h2>
                <p className="mt-1 text-sm font-bold text-[var(--muted)]">These fields become the admin assignment note.</p>
              </div>
              <span className="rounded-full bg-[var(--mint)] px-4 py-2 text-sm font-black text-[var(--brand-dark)]">Draft booking</span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black">Your name</span>
                <input suppressHydrationWarning className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--brand-dark)]" />
              </label>
              <label className="block">
                <span className="text-sm font-black">Phone number</span>
                <input suppressHydrationWarning className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--brand-dark)]" inputMode="tel" />
              </label>
              <label className="block">
                <span className="text-sm font-black">Preferred date</span>
                <input suppressHydrationWarning className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--brand-dark)]" type="date" />
              </label>
              <label className="block">
                <span className="text-sm font-black">Frequency</span>
                <select
                  suppressHydrationWarning
                  className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--brand-dark)]"
                  value={frequency}
                  onChange={(event) => setFrequency(event.target.value)}
                >
                  {frequencies.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-black">Location and notes</span>
                <textarea
                  suppressHydrationWarning
                  className="mt-2 min-h-32 w-full rounded-xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--brand-dark)]"
                  placeholder="Estate, house number, number of rooms, access notes, preferred time"
                />
              </label>
            </div>
          </form>
        </div>

        <aside className="h-fit rounded-2xl bg-white p-6 shadow-[var(--shadow-tight)] lg:sticky lg:top-6">
          <p className="text-sm font-black text-[var(--brand-dark)]">Booking summary</p>
          <h2 className="mt-3 text-balance text-3xl font-black">{selected.name}</h2>
          <div className="mt-5 space-y-4">
            {[
              [Sparkles, selected.type],
              [CalendarDays, frequency],
              [Clock, selected.duration],
              [MapPin, "Malindi service area"],
              [ShieldCheck, "Verified staff assignment"],
            ].map(([Icon, label]) => (
              <div key={label as string} className="flex items-center gap-3 text-sm font-bold text-[var(--muted)]">
                <Icon className="h-5 w-5 text-[var(--brand-dark)]" />
                <span>{label as string}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-[var(--mint)] p-5">
            <p className="text-sm font-black text-[var(--brand-dark)]">Estimated amount</p>
            <p className="mt-1 text-4xl font-black">{totalLabel}</p>
          </div>
          <a
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-5 py-4 font-black text-[var(--ink)]"
            href={`https://wa.me/254141580500?text=${encodeURIComponent(`Hello, I want to book ${selected.name}.`)}`}
          >
            Submit on WhatsApp
          </a>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-[var(--bg)] p-3 font-bold">
              <Home className="mb-2 h-5 w-5 text-[var(--brand-dark)]" />
              Customer record
            </div>
            <div className="rounded-xl bg-[var(--bg)] p-3 font-bold">
              <Users className="mb-2 h-5 w-5 text-[var(--brand-dark)]" />
              Admin assignment
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
