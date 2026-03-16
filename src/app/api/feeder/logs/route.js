export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    // Extract query parameter for number of lines
    const { searchParams } = new URL(req.url);
    const lines = searchParams.get("lines");
    
    // Build URL with optional query parameter
    const url = `${process.env.PI_FEEDER_URL}/logs${lines ? `?lines=${lines}` : ""}`;
    
    const res = await fetch(url, {
      cache: "no-store"
    });

    // Pi might return non-JSON if service is down. Handle both.
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || "Non-JSON response from Pi", logs: [], total: 0, returned: 0 };
    }

    return Response.json(data);
  } catch (err) {
    console.error("Feeder logs API error:", err);
    return Response.json({ 
      error: err.message || "Failed to fetch logs", 
      logs: [], 
      total: 0, 
      returned: 0 
    }, { status: 500 });
  }
}
