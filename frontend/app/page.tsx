import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-3xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-teal-700">
          Study smarter
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">
          CoursePilot AI
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-700">
          Turn course PDFs into summaries, quizzes, and personalized study plans.
        </p>
        <div className="mt-10">
          <Link
            href="/upload"
            className="inline-flex items-center rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
          >
            Go to upload
          </Link>
        </div>
      </section>
    </main>
  );
}
