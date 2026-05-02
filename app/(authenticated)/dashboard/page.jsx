'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/fetch-json';

const STATUS_LABEL = {
  todo: 'To do',
  in_progress: 'In progress',
  review: 'Review',
  done: 'Done',
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/auth/me'),
      apiFetch('/api/tasks'),
      apiFetch('/api/projects').catch(() => ({ data: { projects: [] } })),
    ])
      .then(([meRes, tasksRes, projRes]) => {
        setUser(meRes.data.user);
        setTasks(tasksRes.data.tasks ?? []);
        setProjects(projRes.data.projects ?? []);
      })
      .catch((e) => setErr(String(e.message || e)))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const overdue = tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate).getTime() < now &&
        t.status !== 'done'
    );
    const byStatus = tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    return { overdueCount: overdue.length, byStatus, total: tasks.length };
  }, [tasks]);

  if (loading) {
    return <p className="text-slate-500">Loading your workspace…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Signed in as <span className="font-medium">{user?.name}</span> (
          {user?.role === 'admin' ? 'Administrator' : 'Team member'})
        </p>
        {user?.role === 'admin' && (
          <p className="mt-2 text-sm text-slate-500">
            <Link className="text-indigo-600 hover:underline" href="/admin/projects">
              Manage projects
            </Link>{' '}
            ·{' '}
            <Link className="text-indigo-600 hover:underline" href="/admin/users">
              Manage users
            </Link>
          </p>
        )}
      </div>

      {err && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Tasks in view</div>
          <div className="mt-1 text-3xl font-semibold text-slate-900">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="text-sm text-amber-800">Overdue</div>
          <div className="mt-1 text-3xl font-semibold text-amber-900">
            {stats.overdueCount}
          </div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
          <div className="text-sm text-indigo-800">Projects you can access</div>
          <div className="mt-1 text-3xl font-semibold text-indigo-950">
            {projects.length}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-900 mb-4">Recent tasks</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Title</th>
                <th className="px-4 py-3 font-semibold text-slate-700 hidden sm:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700 hidden md:table-cell">
                  Due
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700 hidden lg:table-cell">
                  Project
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.slice(0, 8).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No tasks yet. Administrators can assign work from project pages once a
                    team is lined up on a project.
                  </td>
                </tr>
              ) : (
                tasks.slice(0, 8).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{t.title}</td>
                    <td className="px-4 py-3 capitalize text-slate-600 hidden sm:table-cell">
                      {STATUS_LABEL[t.status] ?? t.status}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                      {t.projectName ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/my-tasks" className="text-indigo-600 hover:underline">
            View all assigned tasks →
          </Link>
        </p>
      </section>
    </div>
  );
}
