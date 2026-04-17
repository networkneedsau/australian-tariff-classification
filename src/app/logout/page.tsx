'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function doLogout() {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        /* ignore — clear cookie anyway */
      }
      if (!cancelled) {
        router.replace('/login');
      }
    }

    doLogout();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] to-[#1e3a8a]">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-200 text-sm">Signing out...</p>
      </div>
    </div>
  );
}
