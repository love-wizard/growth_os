type PerfFields = Record<string, string | number | boolean | null | undefined>;

export function nowMs() {
  return performance.now();
}

export function elapsedMs(startedAt: number) {
  return Math.round(performance.now() - startedAt);
}

export function logPerf(event: string, fields: PerfFields) {
  const details = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" ");

  console.info(`[perf] event=${event}${details ? ` ${details}` : ""}`);
}
