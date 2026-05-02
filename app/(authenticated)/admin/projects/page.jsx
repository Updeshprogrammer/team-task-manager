'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/fetch-json';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [chosen, setChosen] = useState({});

  useEffect(() => {
    Promise.all([apiFetch('/api/projects'), apiFetch('/api/users')])
      .then(([projRes, userRes]) => {
        setProjects(projRes.data.projects ?? []);
        setUsers(userRes.data.users ?? []);
      })
      .catch((e) => setErr(String(e.message || e)))
      .finally(() => setLoading(false));
  }, []);

  const selectableMembers = useMemo(
    () => users.filter((u) => u.role === 'member' && u.isActive),
    [users]
  );

  async function createProject(e) {
    e.preventDefault();
    setErr('');
    const memberIds = Object.entries(chosen)
      .filter(([, v]) => v)
      .map(([id]) => id);
    try {
      await apiFetch('/api/projects', {
        method: 'POST',
        body: { name, description, memberIds },
      });
      setName('');
      setDescription('');
      setChosen({});
      const projRes = await apiFetch('/api/projects');
      setProjects(projRes.data.projects ?? []);
    } catch (e) {
      setErr(e.message ?? 'Could not save project');
    }
  }

  if (loading) return <p className="text-slate-500">Loading projects…</p>;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        <p className="mt-1 text-slate-600">
          Organize teams—people here become assignable candidates for tasks tied to each
          project.
        </p>
      </div>

      {err && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Create a project</h2>
        <form onSubmit={createProject} className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Title
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase text-slate-500">Team roster</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {selectableMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={!!chosen[member.id]}
                    onChange={(e) =>
                      setChosen((prev) => ({
                        ...prev,
                        [member.id]: e.target.checked,
                      }))
                    }
                    className="mt-1"
                  />
                  <span>
                    <strong className="text-slate-900">{member.name}</strong>
                    <br />
                    <span className="text-slate-500">{member.email}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="lg:col-span-3 justify-self-start rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Save project
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-900 mb-4">Existing projects</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <h3 className="font-semibold text-lg text-slate-900">{p.name}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.description}</p>
              </div>
              <Link
                className="mt-4 inline-flex w-fit items-center text-sm font-medium text-indigo-600 hover:underline"
                href={`/admin/projects/${p.id}`}
              >
                Track tasks →
              </Link>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-slate-500">No projects yet—create one to get rolling.</p>
          )}
        </div>
      </section>
    </div>
  );
}
