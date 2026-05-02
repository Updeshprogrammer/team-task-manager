'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/fetch-json';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setPending(true);
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setErr(error.message ?? 'Could not finish registration');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-50 px-6 py-20">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-slate-900">Join the squad</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Self-service signup spins up collaborator accounts—the leadership team assigns you to
          projects once you are onboarded.
        </p>
        <form className="mt-8 grid gap-4" onSubmit={submit}>
          {err ? (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-800">{err}</div>
          ) : null}
          <div>
            <label className="text-sm font-semibold text-slate-700">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Company email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              minLength={8}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-2 text-[11px] text-slate-500">
              Stretch your secret to at least eight characters for strength.
            </p>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
          >
            {pending ? 'Setting things up…' : 'Activate account'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-600">
          Already humming along?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
