'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { apiFetch } from '@/lib/fetch-json';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setPending(true);
    try {
      await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
      router.push(next.startsWith('/') ? next : '/dashboard');
      router.refresh();
    } catch (error) {
      setErr(error.message ?? 'Unable to sign in');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={submit}>
      {err ? (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{err}</div>
      ) : null}
      <div>
        <label className="text-sm font-semibold text-slate-700">Email</label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700">Password</label>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-70"
      >
        {pending ? 'Signing you in…' : 'Continue'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-50 px-6 py-20">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sign in so we can personalize your dashboards and timelines.
        </p>
        <Suspense fallback={<div className="py-16 text-center text-slate-500">Loading…</div>}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-slate-600">
          New here?{' '}
          <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
