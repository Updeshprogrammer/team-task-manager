'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/fetch-json';

function avatarCacheUrl(u) {
  if (!u?.avatarUrl) return null;
  const v =
    typeof u.updatedAt === 'string' || typeof u.updatedAt === 'number'
      ? new Date(u.updatedAt).getTime()
      : '';
  return v ? `${u.avatarUrl}?v=${v}` : u.avatarUrl;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [meId, setMeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function reload() {
    const [meRes, listRes] = await Promise.all([
      apiFetch('/api/auth/me'),
      apiFetch('/api/users'),
    ]);
    setMeId(meRes.data.user.id);
    setUsers(listRes.data.users ?? []);
  }

  useEffect(() => {
    reload().catch((e) => setErr(String(e.message || e))).finally(() => setLoading(false));
  }, []);

  async function toggleActive(u, next) {
    setErr('');
    try {
      await apiFetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        body: { isActive: next },
      });
      await reload();
    } catch (e) {
      setErr(e.message ?? 'Update failed');
    }
  }

  async function removeUser(u) {
    if (
      !window.confirm(
        `Delete ${u.name} (${u.email})? Tasks will be reassigned to project owners.`
      )
    ) {
      return;
    }
    setErr('');
    try {
      await apiFetch(`/api/users/${u.id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      setErr(e.message ?? 'Delete failed');
    }
  }

  const sorted = useMemo(
    () => [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [users]
  );

  if (loading) return <p className="text-slate-500">Loading users…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-slate-600">
          Review profiles, disable access, or remove accounts securely.
        </p>
      </div>

      {err && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700 w-16">Photo</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Member</th>
              <th className="px-4 py-3 font-semibold text-slate-700 hidden sm:table-cell">
                Role
              </th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-700 hidden md:table-cell">
                Joined
              </th>
              <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((u) => {
              const isSelf = meId === u.id;
              const thumb = avatarCacheUrl(u);
              return (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (u.name || '?').slice(0, 1).toUpperCase()
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600 hidden sm:table-cell">
                    {u.role}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.isActive ? 'rounded-full bg-emerald-50 px-2 py-1 text-emerald-800' :
                        'rounded-full bg-slate-100 px-2 py-1 text-slate-600'
                      }
                    >
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {!isSelf && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(u, !u.isActive)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeUser(u)}
                          className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    {isSelf && (
                      <span className="text-xs text-slate-400">
                        Manage other accounts from here; your login stays untouched.
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
