import { NextResponse } from "next/server";

export async function GET() {
  // Directly check the global object
  const data = global.weatherStore?.cachedData;


  if (!data) {
    console.log("❌ API requested but global.weatherStore.cachedData is still null");
    return NextResponse.json({ error: "Server warming up..." }, { status: 503 });
  }


  return NextResponse.json(data);
}