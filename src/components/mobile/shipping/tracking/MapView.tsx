/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";

interface MapViewProps {
  latitude: number;
  longitude: number;
  routePath?: [number, number][];
}

export default function MapView({ latitude, longitude, routePath }: MapViewProps) {
  return (
    <MapContainer
      // center={[latitude, longitude]}
      // zoom={13}
      // scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        // attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} />
      {routePath && routePath.length > 0 && (
        <Polyline 
        positions={routePath} 
        // color="blue" 
        />
      )}
    </MapContainer>
  );
}
