export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const PI = process.env.PI_FEEDER_URL; // example: http://192.168.1.160:8080
    if (!PI) {
      return Response.json(
        { ok: false, error: "PI_FEEDER_URL is not set on the website server" },
        { status: 500 }
      );
    }

    const upstream = await fetch(`${PI}/enable`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      cache: "no-store",
    });

    // Pi might return non-JSON on error. Handle both.
    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: upstream.ok, error: text || "Non-JSON response from Pi" };
    }

    return Response.json(data, { status: upstream.status });
  } catch (err) {
    return Response.json(
      { ok: false, error: `Website API crashed: ${String(err)}` },
      { status: 500 }
    );
  }
}
