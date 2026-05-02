'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/fetch-json';
import { notifyProfileChanged } from '@/lib/profile-sync';

function avatarSrc(user) {
  if (!user?.avatarUrl) return null;
  const v =
    typeof user.updatedAt === 'string' || typeof user.updatedAt === 'number'
      ? new Date(user.updatedAt).getTime()
      : Date.now();
  return `${user.avatarUrl}?v=${v}`;
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((d) => {
        const u = d.data.user;
        setUser(u);
        setEmail(u.email ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setNotice('');
    setSaving(true);
    try {
      const res = await apiFetch('/api/profile', {
        method: 'PATCH',
        body: { email },
      });
      setUser(res.data.user);
      setEmail(res.data.user.email);
      setNotice('Profile saved.');
      notifyProfileChanged();
    } catch (err) {
      setNotice(err.message ?? 'Unable to save');
    } finally {
      setSaving(false);
    }
  }

  async function onPickPhoto(e) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    setNotice('');
    setPhotoBusy(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await apiFetch('/api/profile/avatar', { method: 'POST', body: fd });
      setUser(res.data.user);
      setNotice('Profile photo updated.');
      notifyProfileChanged();
    } catch (err) {
      setNotice(err.message ?? 'Unable to upload photo');
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    if (!window.confirm('Remove your profile photo?')) return;
    setNotice('');
    setPhotoBusy(true);
    try {
      const res = await apiFetch('/api/profile/avatar', { method: 'DELETE' });
      setUser(res.data.user);
      setNotice('Photo removed.');
      notifyProfileChanged();
    } catch (err) {
      setNotice(err.message ?? 'Unable to remove photo');
    } finally {
      setPhotoBusy(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading profile…</p>;

  const src = avatarSrc(user);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Your profile</h1>
        <p className="mt-1 text-slate-600">
          Update your photo, email address, and review how your teammates see your account.
        </p>
      </div>

      {notice ? (
        <div
          className={
            [
              'Profile saved.',
              'Profile photo updated.',
              'Photo removed.',
            ].includes(notice)
              ? 'rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
              : 'rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900'
          }
        >
          {notice}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Profile photo
        </h2>
        <div className="flex flex-wrap items-center gap-5">
          <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
            {src ? (
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-400">
                {(user?.name || '?').slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="inline-flex">
              <span className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 opacity-90">
                {photoBusy ? 'Working…' : 'Upload photo'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={photoBusy}
                onChange={onPickPhoto}
              />
            </label>
            <p className="text-xs text-slate-500">JPG, PNG, WebP, or GIF · up to 2 MB.</p>
            {user?.avatarUrl ? (
              <button
                type="button"
                disabled={photoBusy}
                onClick={removePhoto}
                className="text-left text-xs font-medium text-red-700 hover:text-red-800 disabled:opacity-50"
              >
                Remove photo
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Account details
        </h2>
        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <p className="mt-1 text-slate-900">{user?.name}</p>
          <p className="mt-2 text-xs text-slate-500">
            Name changes usually go through an admin for consistency on official records.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:border-indigo-500 focus:ring-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Role</label>
          <p className="mt-1 capitalize text-slate-900">{user?.role}</p>
          <label className="mt-4 block text-sm font-medium text-slate-700">Status</label>
          <p className="mt-1 text-slate-900">{user?.isActive ? 'Active' : 'Disabled'}</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Update email'}
        </button>
      </form>
    </div>
  );
}
