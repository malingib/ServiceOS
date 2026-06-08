export default function PublicHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">ServiceOps</p>
      <h1 className="mt-3 text-4xl font-bold tracking-normal text-slate-950">
        Service agency operations, bookings, workers, and M-Pesa in one system.
      </h1>
      <p className="mt-4 max-w-2xl text-base text-slate-600">
        The MVP frontend now lives in a single Next.js App Router application with route groups for public,
        customer, worker, and admin workflows.
      </p>
    </main>
  );
}
