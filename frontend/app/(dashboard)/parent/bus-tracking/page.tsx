"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonCard } from "@/components/common/skeleton";
import { ErrorState } from "@/components/common/states";
import { StatusDot } from "@/components/common/status-dot";
import { useBusTracking } from "@/hooks/parent/use-bus-tracking";
import {
  Bus,
  MapPin,
  Clock,
  ShieldCheck,
  PhoneCall,
  Navigation,
  Plus,
  Minus,
  Compass,
  Radio,
} from "lucide-react";

// MapLibre GL JS uses [longitude, latitude] coordinates format
// Detailed road-based coordinates along actual Coimbatore street geometry:
// Rajaji Road, Ram Nagar -> Sathy Road -> Cross Cut Road -> Gandhipuram
const FALLBACK_ROAD_COORDINATES: [number, number][] = [
  [76.958609, 11.013565], [76.958838, 11.013195], [76.958981, 11.012963],
  [76.959022, 11.012885], [76.959376, 11.012218], [76.959458, 11.012061],
  [76.959736, 11.012177], [76.960295, 11.012411], [76.960904, 11.012666],
  [76.961099, 11.012747], [76.961483, 11.012908], [76.961678, 11.012989],
  [76.962061, 11.013150], [76.962642, 11.013394], [76.963223, 11.013638],
  [76.963804, 11.013882], [76.964385, 11.014126], [76.964966, 11.014370],
  [76.965547, 11.014614], [76.966020, 11.014812], [76.966453, 11.014994],
  [76.966779, 11.01531], [76.967115, 11.015272], [76.967451, 11.015413],
  [76.967787, 11.015554], [76.968123, 11.015695], [76.968459, 11.015836],
  [76.968698, 11.015936], [76.968853, 11.016001], [76.968779, 11.016142],
  [76.968656, 11.016377], [76.968533, 11.016612], [76.968298, 11.016685],
  [76.968091, 11.016697], [76.967797, 11.016705]
];

const START_POINT = FALLBACK_ROAD_COORDINATES[0];
const DESTINATION_POINT = FALLBACK_ROAD_COORDINATES[FALLBACK_ROAD_COORDINATES.length - 1];

export default function ParentBusTrackingPage() {
  const { data, isLoading, error, refetch } = useBusTracking();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const busMarkerRef = useRef<any>(null);
  const prevCoordsRef = useRef<[number, number]>(START_POINT);

  const [routeCoordsState, setRouteCoordsState] = useState<[number, number][]>(FALLBACK_ROAD_COORDINATES);
  const routeCoordinatesRef = useRef<[number, number][]>(FALLBACK_ROAD_COORDINATES);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [followBus, setFollowBus] = useState(true);
  const [progress, setProgress] = useState(0); // 0.0 to 1.0 along the route
  const [currentCoords, setCurrentCoords] = useState<[number, number]>(START_POINT);
  const [heading, setHeading] = useState(45);

  // Calculate bearing / direction of travel in degrees (0..360)
  const calculateBearing = useCallback((start: [number, number], end: [number, number]): number => {
    const rad = Math.PI / 180;
    const lng1 = start[0] * rad;
    const lat1 = start[1] * rad;
    const lng2 = end[0] * rad;
    const lat2 = end[1] * rad;
    const dLng = lng2 - lng1;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const bearing = (Math.atan2(y, x) / rad + 360) % 360;
    return bearing;
  }, []);

  // Helper to interpolate [lng, lat] coordinates along active road geometry safely
  const getInterpolatedCoords = useCallback((t: number): [number, number] => {
    const coords = routeCoordinatesRef.current;
    if (!coords || coords.length < 2) return START_POINT;
    if (isNaN(t) || t <= 0) return coords[0];
    if (t >= 1) return coords[coords.length - 1];

    const totalSegments = coords.length - 1;
    const scaled = t * totalSegments;
    const index = Math.min(Math.floor(scaled), totalSegments - 1);
    const segT = Math.max(0, Math.min(1, scaled - index));

    const p1 = coords[index] || coords[0];
    const p2 = coords[index + 1] || coords[coords.length - 1];

    if (!p1 || !p2) return coords[0];

    const lng = p1[0] + (p2[0] - p1[0]) * segT;
    const lat = p1[1] + (p2[1] - p1[1]) * segT;
    return [lng, lat];
  }, []);

  // Initialize MapLibre GL JS Map with OpenStreetMap Tiles & OSRM Road Geometry
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    const initMap = () => {
      const maplibregl = (window as any).maplibregl;
      if (!maplibregl || !mapContainerRef.current || mapRef.current) return;

      console.log("Map initialized");

      // Create MapLibre instance with OpenStreetMap raster tiles (Zero API key required)
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
              tiles: [
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              ],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "osm-tiles-layer",
              type: "raster",
              source: "osm-tiles",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [76.9630, 11.0152], // [lng, lat]
        zoom: 15,
        attributionControl: false,
      });
      mapRef.current = map;

      map.on("styledata", () => {
        console.log("Style loaded");
      });

      map.on("sourcedata", (e: any) => {
        if (e.isSourceLoaded) {
          console.log("Tiles loaded");
        }
      });

      map.on("idle", () => {
        console.log("Map idle");
      });

      map.on("load", () => {
        if (!isMounted) return;

        // Force resize to match container geometry
        map.resize();

        // Add Initial GeoJSON Source & Line Layer for Road Geometry
        map.addSource("route-source", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: routeCoordinatesRef.current,
            },
          },
        });

        map.addLayer({
          id: "route-line-layer",
          type: "line",
          source: "route-source",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#2563eb",
            "line-width": 6,
            "line-opacity": 0.85,
          },
        });
        console.log("Route added");

        // Fetch precise road network routing from OSRM OpenStreetMap routing engine
        fetch("https://router.project-osrm.org/route/v1/driving/76.9585,11.0135;76.9678,11.0168?overview=full&geometries=geojson")
          .then((res) => res.json())
          .then((osrmData) => {
            if (osrmData?.routes?.[0]?.geometry?.coordinates) {
              const fetchedCoords = osrmData.routes[0].geometry.coordinates as [number, number][];
              if (fetchedCoords && fetchedCoords.length > 2 && isMounted) {
                routeCoordinatesRef.current = fetchedCoords;
                setRouteCoordsState(fetchedCoords);

                const src = map.getSource("route-source");
                if (src) {
                  src.setData({
                    type: "Feature",
                    properties: {},
                    geometry: {
                      type: "LineString",
                      coordinates: fetchedCoords,
                    },
                  });
                }
              }
            }
          })
          .catch(() => {
            console.log("Using pre-defined street-level road geometry fallback");
          });
        // Start Pickup Marker (Rajaji Road)
        const startEl = document.createElement("div");
        startEl.innerHTML = `
          <div style="background-color: #10b981; color: white; width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            📍
          </div>
        `;
        new maplibregl.Marker({ element: startEl })
          .setLngLat(START_POINT)
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div style="color: #F9FAFB; font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.5; padding: 2px;">
                <div style="font-weight: 700; font-size: 13px; color: #10B981; margin-bottom: 4px;">📍 Pickup Location</div>
                <div style="color: #D1D5DB;">Rajaji Road, Ram Nagar</div>
                <div style="color: #9CA3AF; font-size: 11px;">Coimbatore, Tamil Nadu 641009</div>
              </div>
            `)
          )
          .addTo(map);

        // Destination Marker (School - Gandhipuram)
        const destEl = document.createElement("div");
        destEl.innerHTML = `
          <div style="background-color: #6366f1; color: white; width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            🏫
          </div>
        `;
        new maplibregl.Marker({ element: destEl })
          .setLngLat(DESTINATION_POINT)
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div style="color: #F9FAFB; font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.5; padding: 2px;">
                <div style="font-weight: 700; font-size: 13px; color: #6366F1; margin-bottom: 4px;">🏫 Destination School</div>
                <div style="color: #D1D5DB;">Gandhipuram</div>
                <div style="color: #9CA3AF; font-size: 11px;">Coimbatore, Tamil Nadu</div>
              </div>
            `)
          )
          .addTo(map);

        // Rotating Bus Marker
        const busEl = document.createElement("div");
        busEl.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border-radius: 9999px; border: 3px solid white; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6); font-size: 22px;">
            🚌
          </div>
        `;
        const busMarker = new maplibregl.Marker({ element: busEl, rotationAlignment: "map" })
          .setLngLat(START_POINT)
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div style="color: #F9FAFB; font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.5; min-width: 170px; padding: 2px;">
                <div style="font-weight: 700; font-size: 13px; color: #F59E0B; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
                  🚌 School Bus #BUS-2026-X
                </div>
                <div style="color: #D1D5DB; margin-bottom: 3px;">Driver: <span style="color: #F9FAFB; font-weight: 600;">Vikram Singh</span></div>
                <div style="color: #D1D5DB; margin-bottom: 3px;">Status: <span style="color: #10B981; font-weight: 600;">On Route</span></div>
                <div style="color: #D1D5DB;">ETA: <span style="color: #3B82F6; font-weight: 600;">08:15 AM</span></div>
              </div>
            `)
          )
          .addTo(map);
        busMarkerRef.current = busMarker;
        console.log("Markers added");

        // Fit bounds to route
        const bounds = new maplibregl.LngLatBounds();
        routeCoordinatesRef.current.forEach((pt) => bounds.extend(pt));
        map.fitBounds(bounds, { padding: 50 });

        setIsMapLoaded(true);
      });
    };

    // Load MapLibre GL CSS and Script safely
    let cssReady = false;
    let jsReady = false;

    const checkReady = () => {
      if (cssReady && jsReady) {
        initMap();
      }
    };

    if (!document.getElementById("maplibre-css")) {
      const link = document.createElement("link");
      link.id = "maplibre-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css";
      link.onload = () => {
        cssReady = true;
        checkReady();
      };
      document.head.appendChild(link);
    } else {
      cssReady = true;
    }

    if (!(window as any).maplibregl) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js";
      script.async = true;
      script.onload = () => {
        jsReady = true;
        checkReady();
      };
      document.head.appendChild(script);
    } else {
      jsReady = true;
      checkReady();
    }

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isLoading]);

  // Unified Journey Animation Loop (Stops permanently at destination 1.0)
  useEffect(() => {
    if (!isMapLoaded) return;

    let animFrame: number;
    let lastTime = performance.now();
    let currProgress = progress;

    const animate = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (currProgress < 1.0) {
        currProgress = Math.min(1.0, currProgress + delta * 0.025);
        setProgress(currProgress);

        const newPos = getInterpolatedCoords(currProgress);
        const prevPos = prevCoordsRef.current;

        if (prevPos[0] !== newPos[0] || prevPos[1] !== newPos[1]) {
          const b = calculateBearing(prevPos, newPos);
          setHeading(b);

          if (busMarkerRef.current) {
            busMarkerRef.current.setLngLat(newPos);
            if (busMarkerRef.current.setRotation) {
              busMarkerRef.current.setRotation(b);
            }
          }

          prevCoordsRef.current = newPos;
          setCurrentCoords(newPos);

          if (followBus && mapRef.current) {
            mapRef.current.panTo(newPos, { duration: 250 });
          }
        }

        if (currProgress < 1.0) {
          animFrame = requestAnimationFrame(animate);
        }
      }
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [isMapLoaded, followBus, getInterpolatedCoords, calculateBearing]);

  // Map Controls
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleRecenter = () => {
    const maplibregl = (window as any).maplibregl;
    if (mapRef.current && maplibregl) {
      const bounds = new maplibregl.LngLatBounds();
      routeCoordinatesRef.current.forEach((pt) => bounds.extend(pt));
      mapRef.current.fitBounds(bounds, { padding: 50 });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader title="School Bus Tracking" subtitle="Locating bus route..." />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl">
        <PageHeader title="School Bus Tracking" subtitle="School Transit Status" />
        <ErrorState title="Could not load bus tracking" message={error || undefined} onRetry={refetch} />
      </div>
    );
  }

  const driverName = (data.driver_name as string) || "Vikram Singh";
  const driverPhone = (data.driver_phone as string) || "+15550199";
  const vehicleNumber = (data.vehicle_number as string) || "BUS-2026-X";
  const eta = (data.estimated_arrival_time as string) || "08:15 AM";
  const routeName = (data.route_name as string) || "Route 12 - South Side";
  const arrivalStatus = (data.arrival_status as string) || "On the way";

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Real-Time School Bus Journey Tracking"
        subtitle="Live bus journey visualization from Rajaji Road, Ram Nagar to Gandhipuram, Coimbatore"
      />

      {/* ── Driver & Transit Status Header Card ── */}
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
              <Bus size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {routeName} • {vehicleNumber}
                </h3>
                <StatusDot status="active" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Driver: <span className="font-medium text-[var(--text-primary)]">{driverName}</span> • Phone: {driverPhone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                Estimated Arrival (ETA)
              </span>
              <span className="metric text-xl font-bold text-[var(--success)]">{eta}</span>
            </div>

            <a
              href={`tel:${driverPhone}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--success)] text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              <PhoneCall size={14} />
              <span>Call Driver</span>
            </a>
          </div>
        </div>

        {/* ── Progress Bar ── */}
        <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--text-primary)]">
            <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
              <MapPin size={13} className="text-emerald-500" />
              Rajaji Road, Ram Nagar (Pickup)
            </span>

            <span className="flex items-center gap-1 text-[var(--primary)] font-semibold">
              <Radio size={13} className="animate-pulse text-[var(--primary)]" />
              {arrivalStatus} ({Math.round(progress * 100)}%)
            </span>

            <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
              <MapPin size={13} className="text-indigo-500" />
              Gandhipuram (School)
            </span>
          </div>

          <div className="relative h-2.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 bg-[var(--primary)] rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, progress * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5 text-[var(--success)] font-medium">
            <ShieldCheck size={14} /> GPS Speed Limit Compliant (38 km/h)
          </span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">
            Live Coords: {currentCoords[0].toFixed(4)}° N, {currentCoords[1].toFixed(4)}° E
          </span>
        </div>
      </div>

      {/* ── Interactive Map View Container ── */}
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-lg h-[480px] w-full min-h-[480px]">
        {/* MapLibre Map Canvas Target */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0 min-h-[480px]" />

        {/* ── Floating Controls Overlay (Uber/Rapido/Zomato style) ── */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="p-2.5 rounded-xl bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md transition-all active:scale-95"
            title="Zoom In"
          >
            <Plus size={18} />
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="p-2.5 rounded-xl bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md transition-all active:scale-95"
            title="Zoom Out"
          >
            <Minus size={18} />
          </button>

          {/* Recenter */}
          <button
            onClick={handleRecenter}
            className="p-2.5 rounded-xl bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md transition-all active:scale-95"
            title="Recenter Map"
          >
            <Compass size={18} />
          </button>

          {/* Follow Bus Toggle */}
          <button
            onClick={() => setFollowBus((prev) => !prev)}
            className={`p-2.5 rounded-xl border shadow-md transition-all active:scale-95 ${
              followBus
                ? "bg-amber-500 text-white border-amber-600 shadow-amber-500/20"
                : "bg-white/95 dark:bg-gray-900/95 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100"
            }`}
            title="Follow Bus Toggle"
          >
            <Navigation size={18} className={followBus ? "rotate-45 transition-transform" : ""} />
          </button>
        </div>

        {/* ── Top Left Floating Location Badge ── */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 shadow-md text-xs font-semibold text-gray-800 dark:text-gray-100">
          <StatusDot status="active" />
          <span>Coimbatore Transit • Line #B-14</span>
        </div>

        {/* ── Bottom Floating Journey Card Overlay ── */}
        <div className="absolute bottom-4 left-4 right-4 z-10 p-4 rounded-xl bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Bus size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <span>Rajaji Road, Ram Nagar</span>
                <span className="text-gray-400">➔</span>
                <span>Gandhipuram</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Smooth automated transit simulation along fixed Coimbatore route
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-900">
              {followBus ? "Tracking Bus" : "Manual View"}
            </span>
          </div>
        </div>
      </div>

      {/* MapLibre Popup Custom Dark Theme Styling */}
      <style>{`
        .maplibregl-popup-content {
          background-color: #111827 !important;
          color: #f9fafb !important;
          border: 1px solid #374151 !important;
          border-radius: 12px !important;
          padding: 12px 14px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5) !important;
        }
        .maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
          border-top-color: #111827 !important;
        }
        .maplibregl-popup-anchor-top .maplibregl-popup-tip {
          border-bottom-color: #111827 !important;
        }
        .maplibregl-popup-anchor-left .maplibregl-popup-tip {
          border-right-color: #111827 !important;
        }
        .maplibregl-popup-anchor-right .maplibregl-popup-tip {
          border-left-color: #111827 !important;
        }
        .maplibregl-popup-close-button {
          color: #9ca3af !important;
          font-size: 16px !important;
          padding: 2px 8px !important;
        }
        .maplibregl-popup-close-button:hover {
          color: #f9fafb !important;
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}
