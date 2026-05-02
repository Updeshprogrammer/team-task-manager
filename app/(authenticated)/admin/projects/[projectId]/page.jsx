'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/fetch-json';

export default function AdminProjectTasksPage() {
  const params = useParams();
  const projectId = params?.projectId;
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  async function reload() {
    const [projRes, taskRes] = await Promise.all([
      apiFetch(`/api/projects/${projectId}`),
      apiFetch(`/api/tasks?projectId=${projectId}`),
    ]);
    setProject(projRes.data.project);
    setTasks(taskRes.data.tasks ?? []);
  }

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    reload()
      .catch((e) => {
        setErr(String(e.message || e));
        setProject(null);
        setTasks([]);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const assignCandidates = useMemo(() => {
    if (!project) return [];
    const byId = new Map();

    function addPerson(person) {
      if (!person || typeof person !== "object") return;
      const id =
        typeof person.id === "string"
          ? person.id
          : typeof person._id !== "undefined"
            ? String(person._id)
            : null;
      if (!id) return;
      if (person.isActive === false) return;
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          name: person.name ?? "Member",
          email: person.email ?? "",
        });
      }
    }

    addPerson(project.owner);
    (project.members || []).forEach(addPerson);

    return [...byId.values()];
  }, [project]);

  async function createTask(e) {
    e.preventDefault();
    setErr('');
    try {
      const body = {
        title,
        description,
        projectId,
        assigneeId,
      };
      if (dueDate.trim()) {
        const d = new Date(`${dueDate}T12:00:00`);
        if (!Number.isNaN(d.getTime())) {
          body.dueDate = d.toISOString();
        }
      }

      await apiFetch('/api/tasks', { method: 'POST', body });
      setTitle('');
      setDescription('');
      setAssigneeId('');
      setDueDate('');
      await reload();
    } catch (e) {
      setErr(e.message ?? 'Cannot create task');
    }
  }

  async function removeTask(taskId) {
    if (!window.confirm('Remove this task?')) return;
    setErr('');
    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      setErr(e.message ?? 'Unable to delete task');
    }
  }

  if (loading) {
    return <p className="text-slate-500">Fetching project specifics…</p>;
  }

  if (!project) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">
        Unable to load this project. Confirm the URL or revisit the workspace list.
        {err ? <p className="mt-2 text-sm">{err}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/projects" className="text-xs font-semibold text-indigo-600">
          ← Back to portfolio
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{project.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{project.description}</p>
      </div>

      {err && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Compose a task</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={createTask}>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase text-slate-500">
              Subject
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase text-slate-500">
              Details
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">
              Assign teammate
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Pick a confirmed member…</option>
              {assignCandidates.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} ({person.email || person.id.slice(0, 6)})
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              The roster merges the project sponsor with every collaborator on record.
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">
              Due goal
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="md:col-span-2 w-fit rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Assign workload
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-900 mb-4">Outstanding work</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Task</th>
                <th className="px-4 py-3 font-semibold text-slate-700 hidden lg:table-cell">
                  Assignee
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700">Due</th>
                <th className="px-4 py-3 font-semibold text-slate-700 hidden sm:table-cell">
                  Phase
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{task.title}</div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-600">
                    {task.assignee?.name ?? task.assigneeId}
                  </td>
                  <td className="px-4 py-3">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600 hidden sm:table-cell">
                    {task.status.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => removeTask(task.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Tasks you stand up show up instantly for collaborators.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
