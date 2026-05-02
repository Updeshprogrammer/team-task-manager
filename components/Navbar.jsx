'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/fetch-json';
import { PROFILE_CHANGED_EVENT } from '@/lib/profile-sync';

/** Same path can be overwritten (e.g. always `.jpg`); bust CDN/browser and skip optimizer cache. */
function navbarAvatarSrc(user) {
  if (!user?.avatarUrl) return null;
  const v =
    user.updatedAt != null ? encodeURIComponent(String(user.updatedAt)) : '';
  return v ? `${user.avatarUrl}?v=${v}` : user.avatarUrl;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    function refreshUser() {
      apiFetch('/api/auth/me')
        .then((d) => {
          if (alive) setUser(d.data.user);
        })
        .catch(() => {
          if (alive) setUser(null);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }

    refreshUser();

    function onProfileChanged() {
      apiFetch('/api/auth/me')
        .then((d) => {
          if (alive) setUser(d.data.user);
        })
        .catch(() => {});
    }

    window.addEventListener(PROFILE_CHANGED_EVENT, onProfileChanged);
    return () => {
      alive = false;
      window.removeEventListener(PROFILE_CHANGED_EVENT, onProfileChanged);
    };
  }, []);

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST', body: {} });
    router.push('/login');
    router.refresh();
  }

  const link =
    'text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors';
  const active = (href) =>
    pathname === href || pathname.startsWith(href + '/')
      ? 'text-indigo-600'
      : '';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/dashboard" className="font-semibold text-slate-900">
          Team Task Manager
        </Link>
        <nav className="flex flex-wrap items-center gap-4">

          {!loading && user && (
            <>
              <Link className={`${link} ${active('/dashboard')}`} href="/dashboard">
                Dashboard
              </Link>
              <Link className={`${link} ${active('/my-tasks')}`} href="/my-tasks">
                My tasks
              </Link>
              <Link className={`${link} ${active('/profile')}`} href="/profile">
                Profile
              </Link>
              {user.role === 'admin' && (
                <>
                  <Link
                    className={`${link} ${active('/admin/users')}`}
                    href="/admin/users"
                  >
                    Users
                  </Link>
                  <Link
                    className={`${link} ${active('/admin/projects')}`}
                    href="/admin/projects"
                  >
                    Projects
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {loading ? (
            <span className="text-xs text-slate-400">…</span>
          ) : user ? (
            <>
              {user.avatarUrl ? (
                <Image
                  key={`${user.avatarUrl}:${user.updatedAt ?? ''}`}
                  src={navbarAvatarSrc(user)}
                  alt=""
                  width={32}
                  height={32}
                  sizes="32px"
                  unoptimized
                  className="hidden h-8 w-8 rounded-full border border-slate-200 object-cover sm:block"
                />
              ) : (
                <span className="hidden h-8 w-8 rounded-full border border-slate-200 bg-slate-100 text-center text-sm font-semibold leading-8 text-slate-500 sm:block">
                  {(user.name || '?').slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="hidden text-xs text-slate-500 sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
