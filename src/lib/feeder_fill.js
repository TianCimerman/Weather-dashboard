export const FEEDER_FILL_MAX_CM = 30;

export function normalizeDistanceCm(payload) {
  const rawDistance = payload?.distanceCm ?? payload?.distance;
  if (rawDistance == null) return null;

  const parsed = Number(rawDistance);
  return Number.isNaN(parsed) ? null : parsed;
}

export function calculateFillPercent(distanceCm, maxDistanceCm = FEEDER_FILL_MAX_CM) {
  if (distanceCm == null || maxDistanceCm <= 0) return null;
  const percent = (1 - distanceCm / maxDistanceCm) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function getFillMetrics(payload, maxDistanceCm = FEEDER_FILL_MAX_CM) {
  const distanceCm = normalizeDistanceCm(payload);
  const percent = calculateFillPercent(distanceCm, maxDistanceCm);

  return {
    distanceCm,
    percent,
    mode: payload?.mode ?? null,
    measuredAt: payload?.measuredAt ?? null,
  };
}
