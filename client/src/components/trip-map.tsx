import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { Accept: "application/json" } }
  );
  const data = (await res.json()) as { lat: string; lon: string }[];
  if (!data?.[0]) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function MapCenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center.lat, center.lng, map]);
  return null;
}

interface TripMapProps {
  destination: string;
  items: { name: string; location?: string | null; dayNumber: number; time?: string }[];
}

export function TripMap({ destination, items }: TripMapProps) {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [pins, setPins] = useState<{ lat: number; lng: number; name: string; dayNumber: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await geocode(destination);
      if (!cancelled && c) setCenter(c);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [destination]);

  useEffect(() => {
    const withLocation = items.filter((i) => i.location?.trim());
    if (withLocation.length === 0) return;
    let cancelled = false;
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      const results: { lat: number; lng: number; name: string; dayNumber: number }[] = [];
      for (let i = 0; i < withLocation.length && !cancelled; i++) {
        const item = withLocation[i];
        const coords = await geocode(item.location!);
        if (coords) results.push({ ...coords, name: item.name, dayNumber: item.dayNumber });
        await delay(1100);
      }
      if (!cancelled) setPins(results);
    })();
    return () => { cancelled = true; };
  }, [items]);

  if (loading || !center) {
    return (
      <div className="rounded-xl border bg-muted/30 aspect-video max-h-[400px] flex items-center justify-center text-muted-foreground">
        {loading ? "Loading map…" : "Could not find location for this destination."}
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden aspect-video max-h-[400px] z-0">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={11}
        className="h-full w-full"
        scrollWheelZoom
      >
        <MapCenter center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[center.lat, center.lng]} icon={defaultIcon}>
          <Popup>{destination}</Popup>
        </Marker>
        {pins.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]} icon={defaultIcon}>
            <Popup>Day {p.dayNumber}: {p.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
