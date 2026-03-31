"use client";

import { useEffect, useRef, useCallback } from "react";
import {
    APIProvider,
    Map,
    useMap,
} from "@vis.gl/react-google-maps";
import SearchBar from "./SearchBar";
import { getCrimeColor } from "@/lib/crimeTypes";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

/**
 * Convert a point on a circle's circumference given center, radius, and angle.
 */
function circlePoint(lat, lng, radiusMeters, angleDeg) {
    const angleRad = (angleDeg * Math.PI) / 180;
    const dLat = (radiusMeters / 111320) * Math.cos(angleRad);
    const dLng =
        (radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180))) *
        Math.sin(angleRad);
    return { lat: lat + dLat, lng: lng + dLng };
}

/**
 * Generate a pie-slice (wedge) polygon path.
 * Goes: center → arc from startAngle to endAngle → back to center.
 */
function generateSlicePath(lat, lng, radiusMeters, startAngle, endAngle, arcPoints = 24) {
    const path = [{ lat, lng }]; // center
    const span = endAngle - startAngle;
    for (let i = 0; i <= arcPoints; i++) {
        const angle = startAngle + (i / arcPoints) * span;
        path.push(circlePoint(lat, lng, radiusMeters, angle));
    }
    path.push({ lat, lng }); // back to center
    return path;
}

/**
 * Generate a full circle path (for single-type locations).
 */
function generateCirclePath(lat, lng, radiusMeters = 600, points = 48) {
    const path = [];
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * 360;
        path.push(circlePoint(lat, lng, radiusMeters, angle));
    }
    return path;
}

/**
 * Group incidents by proximity (same location = within ~50m).
 */
function groupByLocation(incidents, thresholdDeg = 0.0005) {
    const groups = [];
    const assigned = new Set();

    incidents.forEach((incident, i) => {
        if (assigned.has(i)) return;
        const group = [incident];
        assigned.add(i);

        incidents.forEach((other, j) => {
            if (assigned.has(j)) return;
            if (
                Math.abs(incident.lat - other.lat) < thresholdDeg &&
                Math.abs(incident.lng - other.lng) < thresholdDeg
            ) {
                group.push(other);
                assigned.add(j);
            }
        });

        groups.push({
            lat: group.reduce((s, g) => s + g.lat, 0) / group.length,
            lng: group.reduce((s, g) => s + g.lng, 0) / group.length,
            incidents: group,
        });
    });

    return groups;
}

/**
 * CrimePolygons — groups incidents by location and renders
 * pie-chart-style polygon slices color-coded by crime type.
 */
function CrimePolygons({ incidents, selectedIncident, onIncidentClick, onPolygonFilter, filterCrimeTypes }) {
    const map = useMap();
    const polygonsRef = useRef([]);

    useEffect(() => {
        if (!map || !incidents.length) return;

        // Clear existing
        polygonsRef.current.forEach((p) => p.setMap(null));
        polygonsRef.current = [];

        const groups = groupByLocation(incidents);

        // Compute global max count of any single crime type at any location (for density scaling)
        let globalMaxCount = 1;
        groups.forEach((group) => {
            const counts = {};
            group.incidents.forEach((inc) => {
                const type = inc.crimeType[0];
                counts[type] = (counts[type] || 0) + 1;
            });
            Object.values(counts).forEach((c) => {
                if (c > globalMaxCount) globalMaxCount = c;
            });
        });
        const RADIUS = 600;

        groups.forEach((group) => {
            const { lat, lng, incidents: groupIncidents } = group;
            const hasSelected = groupIncidents.some((inc) => selectedIncident?.id === inc.id);

            // Count crime types in this group
            const typeCounts = {};
            groupIncidents.forEach((inc) => {
                const type = inc.crimeType[0];
                if (!typeCounts[type]) {
                    typeCounts[type] = { count: 0, incidents: [] };
                }
                typeCounts[type].count++;
                typeCounts[type].incidents.push(inc);
            });

            const types = Object.keys(typeCounts);
            const total = groupIncidents.length;

            if (types.length === 1) {
                // Single crime type → full circle
                const crimeColor = getCrimeColor(types[0]);
                const path = generateCirclePath(lat, lng, RADIUS, 48);
                // Density: scale opacity by how many crimes of this type vs global max
                const density = typeCounts[types[0]].count / globalMaxCount;
                const baseOpacity = 0.2 + density * 0.5; // 0.2 → 0.7

                const polygon = new google.maps.Polygon({
                    paths: path,
                    map,
                    fillColor: crimeColor.color,
                    fillOpacity: hasSelected ? Math.min(baseOpacity + 0.15, 0.85) : baseOpacity,
                    strokeColor: crimeColor.color,
                    strokeOpacity: hasSelected ? 0.9 : 0.6,
                    strokeWeight: hasSelected ? 3 : 1.5,
                    zIndex: hasSelected ? 10 : 1,
                });

                // Click full circle → filter sidebar by this crime type
                polygon.addListener("click", () => {
                    if (onPolygonFilter) {
                        onPolygonFilter(types[0], typeCounts[types[0]].incidents);
                    }
                });

                polygonsRef.current.push(polygon);
            } else {
                // Multiple crime types → pie slices
                let currentAngle = -90; // start from top (12 o'clock)

                // Outer stroke circle — clickable:false so slice clicks pass through
                const outerPath = generateCirclePath(lat, lng, RADIUS, 48);
                const outerStroke = new google.maps.Polygon({
                    paths: outerPath,
                    map,
                    fillColor: "transparent",
                    fillOpacity: 0,
                    strokeColor: hasSelected ? "#ffffff" : "#cbd5e1",
                    strokeOpacity: hasSelected ? 0.8 : 0.35,
                    strokeWeight: hasSelected ? 2.5 : 1,
                    zIndex: hasSelected ? 11 : 2,
                    clickable: false,
                });
                polygonsRef.current.push(outerStroke);

                types.forEach((type) => {
                    const proportion = typeCounts[type].count / total;
                    const sliceAngle = proportion * 360;
                    const endAngle = currentAngle + sliceAngle;
                    const crimeColor = getCrimeColor(type);
                    // Density: scale opacity by how many crimes of this type vs global max
                    const density = typeCounts[type].count / globalMaxCount;
                    const baseOpacity = 0.2 + density * 0.5; // 0.2 → 0.7

                    // More arc points for larger slices for smoothness
                    const arcPts = Math.max(8, Math.round(proportion * 48));
                    const path = generateSlicePath(lat, lng, RADIUS, currentAngle, endAngle, arcPts);

                    const sliceHasSelected = typeCounts[type].incidents.some(
                        (inc) => selectedIncident?.id === inc.id
                    );

                    const polygon = new google.maps.Polygon({
                        paths: path,
                        map,
                        fillColor: crimeColor.color,
                        fillOpacity: sliceHasSelected ? Math.min(baseOpacity + 0.15, 0.85) : baseOpacity,
                        strokeColor: crimeColor.color,
                        strokeOpacity: 0.7,
                        strokeWeight: 1,
                        zIndex: sliceHasSelected ? 12 : 3,
                    });

                    // Click slice → filter sidebar by this crime type
                    polygon.addListener("click", () => {
                        if (onPolygonFilter) {
                            onPolygonFilter(type, typeCounts[type].incidents);
                        }
                    });

                    polygonsRef.current.push(polygon);
                    currentAngle = endAngle;
                });
            }
        });

        return () => {
            polygonsRef.current.forEach((p) => p.setMap(null));
            polygonsRef.current = [];
        };
    }, [map, incidents, selectedIncident, onIncidentClick, onPolygonFilter, filterCrimeTypes]);

    return null;
}

/**
 * SelectedIncidentFocus — pans and zooms to the selected incident.
 * Uses immediate pan + delayed retry to handle cases where the map
 * hasn't finished initializing on first page load.
 */
function SelectedIncidentFocus({ incident, focusCounter }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !incident) return;

        const target = { lat: incident.lat, lng: incident.lng };

        const doPan = () => {
            map.panTo(target);
            map.setZoom(14);
        };

        // Pan immediately
        doPan();

        // Retry after a short delay in case map wasn't fully interactive yet
        const t1 = setTimeout(doPan, 150);
        const t2 = setTimeout(doPan, 500);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [map, incident, focusCounter]);

    return null;
}

/**
 * Map placeholder when no API key is set
 */
function MapPlaceholder() {
    return (
        <div className="flex h-full w-full items-center justify-center bg-[#e8e0d4]">
            <div className="text-center p-8 max-w-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1b2a4a]/10">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#1b2a4a]"
                    >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#1b2a4a] mb-2">
                    Google Maps API Key Required
                </h3>
                <p className="text-sm text-[#1b2a4a]/60 leading-relaxed">
                    Add your API key to{" "}
                    <code className="px-1.5 py-0.5 rounded bg-[#1b2a4a]/10 text-[#1b2a4a] text-xs font-mono">
                        .env.local
                    </code>{" "}
                    as{" "}
                    <code className="px-1.5 py-0.5 rounded bg-[#1b2a4a]/10 text-[#1b2a4a] text-xs font-mono">
                        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                    </code>
                </p>
            </div>
        </div>
    );
}

export default function MapView({
    incidents,
    selectedIncident,
    cityConfig,
    onCitySearch,
    onIncidentClick,
    onPolygonFilter,
    filterCrimeTypes,
    focusCounter,
}) {
    const handleSearch = useCallback(
        (query) => {
            onCitySearch(query);
        },
        [onCitySearch]
    );

    if (!API_KEY) {
        return (
            <div className="relative flex-1 h-full">
                <SearchBar onSearch={handleSearch} />
                <MapPlaceholder />
            </div>
        );
    }

    return (
        <div className="relative flex-1 h-full">
            <SearchBar onSearch={handleSearch} />
            <APIProvider apiKey={API_KEY}>
                <Map
                    defaultCenter={cityConfig.center}
                    defaultZoom={cityConfig.zoom}
                    mapId="vigilens-main-map"
                    disableDefaultUI={false}
                    gestureHandling="greedy"
                    className="h-full w-full"
                    restriction={
                        cityConfig.bounds
                            ? {
                                latLngBounds: cityConfig.bounds,
                                strictBounds: true,
                            }
                            : undefined
                    }
                    minZoom={cityConfig.zoom - 1}
                >
                    <CrimePolygons
                        incidents={incidents}
                        selectedIncident={selectedIncident}
                        onIncidentClick={onIncidentClick}
                        onPolygonFilter={onPolygonFilter}
                        filterCrimeTypes={filterCrimeTypes}
                    />
                    <SelectedIncidentFocus incident={selectedIncident} focusCounter={focusCounter} />
                </Map>
            </APIProvider>
        </div>
    );
}
