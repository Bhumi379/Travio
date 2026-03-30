/**
 * Single-result geocode (Nominatim). Used for radius search + create-ride prefill.
 */
export async function geocodePlace(query) {
  const q = query?.trim();
  if (!q || q.length < 2) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}&countrycodes=in&limit=1&addressdetails=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    const p = data[0];
    return {
      displayName: p.display_name,
      name: p.name || String(p.display_name).split(",")[0]?.trim() || q,
      lat: Number(p.lat),
      lng: Number(p.lon),
    };
  } catch {
    return null;
  }
}
