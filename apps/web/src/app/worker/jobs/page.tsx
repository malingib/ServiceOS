import Link from "next/link";
import { Banknote, CheckCircle2, Clock, MapPin, Navigation, Phone, TimerReset } from "lucide-react";

const jobs = [
  { time: "10:00 AM", title: "Studio apartment cleaning", area: "Casuarina", status: "In progress", pay: "Ksh 300", note: "Customer requested bathroom focus." },
  { time: "1:30 PM", title: "Airbnb turnover", area: "Marine Park", status: "Next", pay: "Ksh 700", note: "Guest check-in expected at 4:00 PM." },
  { time: "4:00 PM", title: "Laundry delivery", area: "Town centre", status: "Scheduled", pay: "Ksh 250", note: "Collect balance before handover." },
];

export default function WorkerJobsPage() {
  return (
    <main className="min-h-screen text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="font-black text-[var(--brand-dark)]">
            Worker jobs
          </Link>
          <a className="inline-flex items-center rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-black text-white" href="tel:0141580500">
            <Phone className="mr-2 h-4 w-4" />
            Call office
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <h1 className="text-balance text-4xl font-black tracking-tight sm:text-5xl">Today&apos;s route and earnings</h1>
            <p className="mt-3 max-w-2xl leading-8 text-[var(--muted)]">
              Check the next job, location notes, pay, and status before calling the office.
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--brand)] p-5 text-[var(--ink)]">
            <p className="text-sm font-black">Today&apos;s earnings</p>
            <p className="mt-1 text-4xl font-black">Ksh 1,250</p>
            <p className="mt-2 text-sm font-bold">Three assigned jobs, one already started.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            [CheckCircle2, "1/3", "Jobs started"],
            [Banknote, "Ksh 1,250", "Total pay"],
            [TimerReset, "24 min", "Travel to next job"],
          ].map(([Icon, value, label]) => (
            <div key={label as string} className="rounded-2xl bg-white p-5 shadow-[var(--shadow-tight)]">
              <Icon className="h-6 w-6 text-[var(--brand-dark)]" />
              <p className="mt-4 text-3xl font-black">{value as string}</p>
              <p className="mt-1 text-sm font-bold text-[var(--muted)]">{label as string}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {jobs.map((job) => (
            <article key={job.title} className="rounded-2xl bg-white p-6 shadow-[var(--shadow-tight)]">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--mint)] px-3 py-1 text-sm font-black text-[var(--brand-dark)]">{job.status}</span>
                    <span className="text-sm font-bold text-[var(--muted)]">{job.pay}</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-black">{job.title}</h2>
                  <p className="mt-2 leading-7 text-[var(--muted)]">{job.note}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-[var(--muted)]">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[var(--brand-dark)]" />
                      {job.time}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[var(--brand-dark)]" />
                      {job.area}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button className="rounded-full bg-[var(--brand)] px-5 py-3 font-black text-[var(--ink)]" type="button">
                    Update status
                  </button>
                  <button className="rounded-full border border-[var(--ink)] px-5 py-3 font-black text-[var(--ink)]" type="button">
                    <Navigation className="mr-2 inline h-4 w-4" />
                    Open directions
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
