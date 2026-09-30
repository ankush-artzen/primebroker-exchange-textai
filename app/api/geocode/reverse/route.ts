import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url, {
    headers: { "User-Agent": "PrimeBrokers/1.0 (broker-exchange-app)" },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Reverse geocode failed" }, { status: 502 });
  }

  const data = (await res.json()) as {
    display_name?: string;
    address?: {
      suburb?: string;
      neighbourhood?: string;
      city?: string;
      town?: string;
      village?: string;
      state?: string;
    };
  };

  const addr = data.address;
  const short = addr
    ? [addr.suburb ?? addr.neighbourhood, addr.city ?? addr.town ?? addr.village, addr.state]
        .filter(Boolean)
        .join(", ")
    : "";

  return NextResponse.json({
    label: short || data.display_name || "",
    full: data.display_name || "",
  });
}
