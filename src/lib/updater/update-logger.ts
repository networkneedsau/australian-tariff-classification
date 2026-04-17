/**
 * Simple logger for the updater subsystem.
 * Prefixes every message with [Updater:sourceId] and an ISO timestamp.
 */

function ts(): string {
  return new Date().toISOString();
}

export function logInfo(sourceId: string, message: string, ...args: unknown[]): void {
  console.log(`[${ts()}] [Updater:${sourceId}] INFO  ${message}`, ...args);
}

export function logWarn(sourceId: string, message: string, ...args: unknown[]): void {
  console.warn(`[${ts()}] [Updater:${sourceId}] WARN  ${message}`, ...args);
}

export function logError(sourceId: string, message: string, ...args: unknown[]): void {
  console.error(`[${ts()}] [Updater:${sourceId}] ERROR ${message}`, ...args);
}
