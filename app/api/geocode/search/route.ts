import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "in");

  const res = await fetch(url, {
    headers: { "User-Agent": "PrimeBrokers/1.0 (broker-exchange-app)" },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Search failed" }, { status: 502 });
  }

  const data = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  return NextResponse.json({
    results: data.map((item) => ({
      label: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    })),
  });
}
