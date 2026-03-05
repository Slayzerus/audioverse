// GoogleMapEmbed.tsx — Embeddable Google Map component for LocationExplorerPage
// Uses backend Google Maps API key via proxy endpoint
import React, { useEffect, useRef, useState } from "react";

/* ── Minimal type shims for the Google Maps JS API (loaded at runtime) ── */
interface GMap { setCenter(c: { lat: number; lng: number }): void; setZoom(z: number): void; fitBounds(b: unknown): void; }
interface GMarker { setMap(m: GMap | null): void; addListener(event: string, handler: () => void): void; }
type GDirectionsRenderer = { setMap(m: GMap | null): void; setDirections(result: unknown): void; };
type GMaps = {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap;
    Marker: new (opts: Record<string, unknown>) => GMarker;
    InfoWindow: new (opts: Record<string, unknown>) => { open(map: GMap, marker: GMarker): void };
    LatLngBounds: new () => { extend(pos: { lat: number; lng: number }): void };
    DirectionsService: new () => { route(req: Record<string, unknown>, cb: (result: unknown, status: string) => void): void };
    DirectionsRenderer: new (opts: Record<string, unknown>) => GDirectionsRenderer;
    TravelMode: Record<string, string>;
};
type GoogleGlobal = { maps: GMaps };

/** Runtime reference — populated after script load */
function getGoogle(): GoogleGlobal | undefined {
    return (window as unknown as { google?: GoogleGlobal }).google;
}

export interface MapMarker {
    lat: number;
    lng: number;
    label?: string;
    color?: string;
}

export interface MapRoute {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    travelMode?: string;
}

interface GoogleMapEmbedProps {
    /** Center latitude */
    lat?: number;
    /** Center longitude */
    lng?: number;
    /** Zoom level (1-20, default 13) */
    zoom?: number;
    /** Map height in px (default 400) */
    height?: number;
    /** Markers to display */
    markers?: MapMarker[];
    /** Route to display (origin → destination) */
    route?: MapRoute | null;
    /** When user clicks a marker */
    onMarkerClick?: (marker: MapMarker) => void;
    /** Style overrides */
    style?: React.CSSProperties;
}

/**
 * Interactive Google Map using the Embed API (iframe-based, no API key needed on frontend).
 * Falls back to a static map image if iframe fails.
 *
 * For full interactivity, we use the Google Maps JS API loaded dynamically.
 */
const GoogleMapEmbed: React.FC<GoogleMapEmbedProps> = ({
    lat = 52.2297,
    lng = 21.0122,
    zoom = 13,
    height = 400,
    markers = [],
    route,
    style,
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<GMap | null>(null);
    const markersRef = useRef<GMarker[]>([]);
    const directionsRendererRef = useRef<GDirectionsRenderer | null>(null);
    const [apiLoaded, setApiLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load Google Maps JS API
    useEffect(() => {
        const g = getGoogle();
        if (g?.maps) {
            setApiLoaded(true);
            return;
        }

        // Check if script is already loading
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            existingScript.addEventListener("load", () => setApiLoaded(true));
            return;
        }

        // Fetch API key from our backend
        const loadMap = async () => {
            try {
                const resp = await fetch("/api/events/locations/maps-config");
                if (!resp.ok) {
                    setError("maps-config-unavailable");
                    return;
                }
                const config = await resp.json();
                const apiKey = config.apiKey || config.key;
                if (!apiKey) {
                    setError("no-api-key");
                    return;
                }

                const script = document.createElement("script");
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,directions`;
                script.async = true;
                script.defer = true;
                script.onload = () => setApiLoaded(true);
                script.onerror = () => setError("script-load-failed");
                document.head.appendChild(script);
            } catch {
                setError("maps-config-fetch-failed");
            }
        };
        loadMap();
    }, []);

    // Initialize map
    useEffect(() => {
        if (!apiLoaded || !mapRef.current || mapInstanceRef.current) return;

        const g = getGoogle()!;
        mapInstanceRef.current = new g.maps.Map(mapRef.current, {
            center: { lat, lng },
            zoom,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            styles: [
                { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
                { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#17263c" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
            ],
        });
    }, [apiLoaded, lat, lng, zoom]);

    // Update center when lat/lng change
    useEffect(() => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng });
            mapInstanceRef.current.setZoom(zoom);
        }
    }, [lat, lng, zoom]);

    // Update markers
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        // Clear old markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        markers.forEach((m) => {
            const g = getGoogle()!;
            const gMarker = new g.maps.Marker({
                position: { lat: m.lat, lng: m.lng },
                map: mapInstanceRef.current!,
                title: m.label,
                label: m.label ? { text: m.label.slice(0, 1), color: "#fff" } : undefined,
            });

            if (m.label) {
                const info = new g.maps.InfoWindow({ content: `<div style="color:#333;font-weight:600">${m.label}</div>` });
                gMarker.addListener("click", () => info.open(mapInstanceRef.current!, gMarker));
            }

            markersRef.current.push(gMarker);
        });

        // Fit bounds if multiple markers
        if (markers.length > 1) {
            const g = getGoogle()!;
            const bounds = new g.maps.LatLngBounds();
            markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
            mapInstanceRef.current.fitBounds(bounds);
        }
    }, [markers, apiLoaded]);

    // Update directions
    useEffect(() => {
        if (!mapInstanceRef.current || !apiLoaded) return;

        // Clear old route
        if (directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null);
            directionsRendererRef.current = null;
        }

        if (!route) return;

        const g = getGoogle()!;
        const directionsService = new g.maps.DirectionsService();
        const renderer = new g.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: false,
            polylineOptions: { strokeColor: "#5865F2", strokeWeight: 5 },
        });
        directionsRendererRef.current = renderer;

        directionsService.route(
            {
                origin: { lat: route.originLat, lng: route.originLng },
                destination: { lat: route.destLat, lng: route.destLng },
                travelMode: route.travelMode?.toUpperCase() || "DRIVING",
            },
            (result: unknown, status: string) => {
                if (status === "OK" && result) {
                    renderer.setDirections(result);
                }
            }
        );
    }, [route, apiLoaded]);

    // Fallback: iframe embed if JS API unavailable
    if (error) {
        const q = markers.length > 0
            ? `${markers[0].lat},${markers[0].lng}`
            : `${lat},${lng}`;
        return (
            <div style={{ borderRadius: 8, overflow: "hidden", ...style }}>
                <iframe
                    title="Google Map"
                    width="100%"
                    height={height}
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/view?key=&center=${q}&zoom=${zoom}`}
                />
                <p style={{ fontSize: 11, color: "var(--text-secondary)", padding: 4, margin: 0 }}>
                    ⚠️ Google Maps JS API not available — showing basic embed.
                </p>
            </div>
        );
    }

    if (!apiLoaded) {
        return (
            <div style={{
                height, borderRadius: 8,
                background: "var(--bg-secondary, #1a1d23)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-secondary, #aaa)", fontSize: 14, ...style,
            }}>
                Loading map…
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            style={{ width: "100%", height, borderRadius: 8, ...style }}
        />
    );
};

export default GoogleMapEmbed;
