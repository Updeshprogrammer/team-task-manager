import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-slate-50 to-white px-6 py-28 text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-indigo-500">Team Ops</p>
      <h1 className="mt-6 text-4xl font-semibold text-slate-900 sm:text-5xl">
        Move projects forward with disciplined task leadership
      </h1>
      <p className="mt-4 max-w-2xl text-base text-slate-600 leading-relaxed">
        Pair Next.js-powered workflows with MongoDB-backed teams: administrators scaffold
        projects, designate ownership, disable risky accounts—while collaborators update field
        status and drop grounded remarks tied to immutable audit trails.
      </p>

      <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-2">
        <Link
          href="/login"
          className="rounded-xl border border-slate-900 bg-slate-900 px-8 py-3 font-semibold text-white shadow hover:bg-black"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-xl border border-slate-300 bg-white px-8 py-3 font-semibold text-slate-900 shadow hover:border-slate-400"
        >
          Register as collaborator
        </Link>
      </div>

      <div className="mt-24 grid gap-10 text-left md:grid-cols-3 max-w-5xl mx-auto border-t border-slate-100 pt-12">
        {[
          {
            heading: 'Role-aware controls',
            copy:
              'Layered JWT sessions plus guarded REST handlers keep admins in command—members inherit only scoped operations.',
          },
          {
            heading: 'Project truth',
            copy:
              'Projects carry explicit memberships so assignment pickers mirror who is accountable on the ground.',
          },
          {
            heading: 'Operational clarity',
            copy:
              'Dashboards tally overdue timelines; remarks thread context without losing authoritative status checkpoints.',
          },
        ].map((item) => (
          <article key={item.heading}>
            <h2 className="text-lg font-semibold text-slate-900">{item.heading}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
          </article>
        ))}
      </div>

      
    </div>
  );
}
