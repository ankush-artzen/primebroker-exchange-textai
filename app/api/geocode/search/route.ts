import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const kind = request.nextUrl.searchParams.get("kind");
  const near = request.nextUrl.searchParams.get("near")?.trim();
  const query = near && kind !== "city" ? `${q}, ${near}` : q;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "in");
  if (kind === "city") url.searchParams.set("featuretype", "city");

  const res = await fetch(url, {
    headers: { "User-Agent": "PrimeBrokers/1.0 (broker-exchange-app)" },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Search failed" }, { status: 502 });
  }

  const data = (await res.json()) as NominatimPlace[];

  return NextResponse.json({
    results: data.map((item) => {
      const address = item.address;
      const city = cityOf(address, item.name);
      const locality = localityOf(address);
      return {
        label: item.display_name,
        name: item.name || city || item.display_name.split(",")[0] || "",
        city,
        locality,
        subLocality: subLocalityOf(address),
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      };
    }),
  });
}

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  quarter?: string;
};

type NominatimPlace = {
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
};

function cityOf(address?: NominatimAddress, name?: string) {
  return (
    address?.city ||
    address?.town ||
    address?.village ||
    address?.municipality ||
    name ||
    ""
  );
}

function localityOf(address?: NominatimAddress) {
  return (
    address?.suburb ||
    address?.neighbourhood ||
    address?.city_district ||
    address?.quarter ||
    ""
  );
}

function subLocalityOf(address?: NominatimAddress) {
  if (address?.suburb && address.neighbourhood && address.suburb !== address.neighbourhood) {
    return address.neighbourhood;
  }
  return "";
}
