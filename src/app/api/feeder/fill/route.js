import { FEEDER_FILL_MAX_CM, getFillMetrics } from "@/lib/feeder_fill";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await fetch(`${process.env.PI_FEEDER_URL}/sensor/distance`, {
    cache: "no-store"
  });

  const data = await res.json();
  const payload = data?.result ?? data?.data ?? data ?? null;

  const configuredMaxDistance = Number(process.env.FEEDER_FILL_MAX_CM ?? FEEDER_FILL_MAX_CM);
  const maxDistanceCm = Number.isFinite(configuredMaxDistance) && configuredMaxDistance > 0
    ? configuredMaxDistance
    : FEEDER_FILL_MAX_CM;

  const metrics = getFillMetrics(payload, maxDistanceCm);

  return Response.json({
    ...data,
    result: {
      ...(payload && typeof payload === "object" ? payload : {}),
      distanceCm: metrics.distanceCm,
      percent: metrics.percent,
      maxDistanceCm,
      measuredAt: metrics.measuredAt,
    },
  });
}
