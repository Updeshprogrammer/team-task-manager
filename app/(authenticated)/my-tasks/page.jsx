'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/fetch-json';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  async function reload() {
    const res = await apiFetch('/api/tasks');
    setTasks(res.data.tasks ?? []);
  }

  useEffect(() => {
    reload()
      .catch((e) => setMessage(String(e.message || e)))
      .finally(() => setLoading(false));
  }, []);

  async function updateTask(id, body) {
    setUpdatingId(id);
    setMessage('');
    try {
      await apiFetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        body,
      });
      await reload();
    } catch (e) {
      setMessage(String(e.message || e));
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <p className="text-slate-500">Loading tasks…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My tasks</h1>
        <p className="mt-1 text-slate-600">
          Update statuses and leave remarks for stakeholders.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Task</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Project</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Due</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((t) => (
              <TaskRow key={t.id} t={t} disabled={updatingId === t.id} onSubmit={updateTask} />
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  Nothing assigned yet. Your administrator adds people to projects and creates
                  tasks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaskRow({ t, disabled, onSubmit }) {
  const [status, setStatus] = useState(t.status);
  const [remark, setRemark] = useState('');

  async function submit(e) {
    e.preventDefault();
    await onSubmit(t.id, { status });
  }

  async function addRemark(e) {
    e.preventDefault();
    if (!remark.trim()) return;
    await onSubmit(t.id, { remark: remark.trim() });
    setRemark('');
  }

  return (
    <tr className="align-top hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{t.title}</div>
        {!!t.description && (
          <p className="mt-1 max-w-xs text-xs text-slate-500">{t.description}</p>
        )}
      </td>
      <td className="px-4 py-3 text-slate-600">{t.projectName ?? '—'}</td>
      <td className="px-4 py-3 text-slate-600">
        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-3">
        <form onSubmit={submit} className="flex gap-2">
          <select
            value={status}
            disabled={disabled}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
          >
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <button
            type="submit"
            disabled={disabled}
            className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Save
          </button>
        </form>
      </td>
      <td className="px-4 py-3">
        {(t.remarks?.length ?? 0) > 0 && (
          <ul className="mb-2 max-h-28 space-y-1 overflow-auto text-xs text-slate-600">
            {t.remarks.map((r) => (
              <li key={r.id}>
                <span className="text-slate-400">
                  {new Date(r.createdAt).toLocaleString()} ·{' '}
                </span>
                {r.text}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addRemark} className="flex flex-col gap-1">
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={2}
            placeholder="Add a remark"
            className="w-full resize-y rounded border border-slate-300 px-2 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={disabled}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Add remark
          </button>
        </form>
      </td>
    </tr>
  );
}
