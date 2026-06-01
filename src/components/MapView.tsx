import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Report } from "../types";

interface Props {
    reports: Report[];
}

export default function MapView({ reports }: Props) {
    useEffect(() => {
        const map = L.map("map").setView([25.2, 85.2], 12);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        reports.forEach((report) => {
            L.marker([report.lat, report.lng]).addTo(map).bindPopup(`
 <b>${report.description}</b><br/>
          Status: ${report.status}
        `);
        });

        return () => {
            map.remove();
        };
    }, [reports]);

    return <div id="map" className="w-full h-64 rounded shadow" />;
}
