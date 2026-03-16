export const dynamic = "force-dynamic";

export async function GET() {
  const res = await fetch(`${process.env.PI_FEEDER_URL}/status`, {
    cache: "no-store"
  });

  const data = await res.json();
  return Response.json(data);
}
