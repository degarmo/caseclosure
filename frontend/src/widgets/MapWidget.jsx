import React, { useState, useCallback } from "react";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// -- Set your Mapbox access token here:
const MAPBOX_TOKEN = "YOUR_MAPBOX_PUBLIC_TOKEN_HERE"; // Replace!

export default function MapWidget({
  lat = 37.0902,
  lng = -95.7129,
  zoom = 4,
  onLocationChange
}) {
  const [marker, setMarker] = useState({ lat, lng });

  const handleClick = useCallback((event) => {
    const { lngLat } = event;
    setMarker({ lat: lngLat.lat, lng: lngLat.lng });
    if (onLocationChange) onLocationChange({ lat: lngLat.lat, lng: lngLat.lng });
  }, [onLocationChange]);

  return (
    <div className="rounded-xl border bg-white shadow p-2 w-full" style={{ minHeight: 320 }}>
      <div className="mb-2 font-bold text-gray-700">Incident Map (Mapbox)</div>
      <Map
        initialViewState={{
          longitude: marker.lng,
          latitude: marker.lat,
          zoom,
        }}
        style={{ width: "100%", height: 250, borderRadius: 12, overflow: "hidden" }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={handleClick}
      >
        <Marker longitude={marker.lng} latitude={marker.lat} color="#2266ff" />
      </Map>
      <div className="mt-2 text-xs text-gray-500">
        Click on the map to set the incident location.<br />
        <b>Selected:</b> {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
      </div>
    </div>
  );
}
