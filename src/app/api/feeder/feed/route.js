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

    const body = await req.json().catch(() => ({}));

    const upstream = await fetch(`${PI}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

    if (upstream.status === 409) {
      return Response.json(
        {
          ok: false,
          error:
            data?.message ||
            data?.error ||
            data?.reason ||
            "Feeder is busy or feeding already in progress",
          status: 409,
        },
        { status: 200 }
      );
    }

    return Response.json(data, { status: upstream.status });
  } catch (err) {
    return Response.json(
      { ok: false, error: `Website API crashed: ${String(err)}` },
      { status: 500 }
    );
  }
}
