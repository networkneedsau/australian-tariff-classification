export async function register() {
  if (typeof window === 'undefined') {
    const { initScheduler } = await import('@/lib/updater/update-scheduler');
    initScheduler();
  }
}
