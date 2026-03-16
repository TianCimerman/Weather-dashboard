export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const PI = process.env.PI_FEEDER_URL;
    if (!PI) {
      return Response.json(
        { ok: false, error: "PI_FEEDER_URL is not set" },
        { status: 500 }
      );
    }

    const r = await fetch(`${PI}/schedules`, { cache: "no-store" });
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: r.ok, error: text || "Non-JSON response from Pi" };
    }

    // Return schedules array directly
    if (data.schedules && Array.isArray(data.schedules)) {
      return Response.json(data.schedules);
    }
    return Response.json(data, { status: r.status });
  } catch (err) {
    return Response.json(
      { ok: false, error: `API crashed: ${String(err)}` },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const PI = process.env.PI_FEEDER_URL;
    if (!PI) {
      return Response.json(
        { ok: false, error: "PI_FEEDER_URL is not set" },
        { status: 500 }
      );
    }

    const body = await req.json();

    // Route to Pi's /schedules/add endpoint
    const r = await fetch(`${PI}/schedules/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: r.ok, error: text || "Non-JSON response from Pi" };
    }

    return Response.json(data, { status: r.status });
  } catch (err) {
    return Response.json(
      { ok: false, error: `API crashed: ${String(err)}` },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const PI = process.env.PI_FEEDER_URL;
    if (!PI) {
      return Response.json(
        { ok: false, error: "PI_FEEDER_URL is not set" },
        { status: 500 }
      );
    }

    const body = await req.json();

    // Flatten the body structure for Pi's /schedules/update endpoint
    // Frontend sends: { id: "...", updates: { time, duration, enabled } }
    // Pi expects: { id: "...", time, duration, enabled }
    const updateBody = {
      id: body.id,
      ...body.updates
    };

    const r = await fetch(`${PI}/schedules/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateBody),
      cache: "no-store",
    });

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: r.ok, error: text || "Non-JSON response from Pi" };
    }

    return Response.json(data, { status: r.status });
  } catch (err) {
    return Response.json(
      { ok: false, error: `API crashed: ${String(err)}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const PI = process.env.PI_FEEDER_URL;
    if (!PI) {
      return Response.json(
        { ok: false, error: "PI_FEEDER_URL is not set" },
        { status: 500 }
      );
    }

    const body = await req.json();

    // Route to Pi's /schedules/delete endpoint
    const r = await fetch(`${PI}/schedules/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: body.id }),
      cache: "no-store",
    });

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: r.ok, error: text || "Non-JSON response from Pi" };
    }

    return Response.json(data, { status: r.status });
  } catch (err) {
    return Response.json(
      { ok: false, error: `API crashed: ${String(err)}` },
      { status: 500 }
    );
  }
}
