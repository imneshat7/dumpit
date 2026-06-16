import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Report } from "../types";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet's Icon.Default has a built-in _getIconUrl that overrides mergeOptions
// unless removed first — this is the actual cause of the 404s, not a missing import
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

interface Props {
    reports: Report[];
}

export default function MapView({ reports }: Props) {
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);

    useEffect(() => {
        const map = L.map("map").setView([25.2, 85.2], 12);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        const markerGroup = L.layerGroup().addTo(map);

        mapRef.current = map;
        markersRef.current = markerGroup;

        return () => {
            map.remove();
            mapRef.current = null;
            markersRef.current = null;
        };
    }, []);

    useEffect(() => {
        const markerGroup = markersRef.current;
        if (!markerGroup) return;

        markerGroup.clearLayers();

        reports.forEach((report) => {
            L.marker([report.lat, report.lng]).addTo(markerGroup).bindPopup(`
                <b>${report.description}</b><br/>
                Status: ${report.status}
            `);
        });
    }, [reports]);

    return <div id="map" className="w-full h-64 rounded shadow" />;
}