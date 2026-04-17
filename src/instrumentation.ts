/**
 * Next.js instrumentation hook — runs once on server boot.
 *
 * The cron scheduler uses Node.js modules (crypto, fs, child_process)
 * which are not supported on the Edge Runtime. We gate the dynamic
 * import on `NEXT_RUNTIME === 'nodejs'` so Next.js skips the
 * instrumentation module entirely when bundling for the Edge runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initScheduler } = await import('@/lib/updater/update-scheduler');
    initScheduler();
  }
}
