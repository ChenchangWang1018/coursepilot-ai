import Link from "next/link";

export default function UploadPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Upload page coming soon
        </h1>
        <p className="mt-4 text-slate-700">
          PDF upload will be added in a later MVP step.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white"
        >
          Back home
        </Link>
      </section>
    </main>
  );
}
