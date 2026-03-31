"use client";

import { useState, useCallback, useMemo } from "react";
import LeftSidebar from "@/components/LeftSidebar";
import DetailPanel from "@/components/DetailPanel";
import MapView from "@/components/MapView";
import MobileBottomSheet from "@/components/MobileBottomSheet";
import { defaultCity } from "@/lib/sampleData";
import { getArea } from "@/lib/areaUtils";

const API_BASE = "http://localhost:8000";

export default function Home() {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [cityConfig, setCityConfig] = useState(defaultCity);
  const [incidents, setIncidents] = useState([]);
  const [filterCrimeTypes, setFilterCrimeTypes] = useState([]); // array for multi-select
  const [filterIncidentIds, setFilterIncidentIds] = useState(null); // IDs from polygon click
  const [filterArea, setFilterArea] = useState(null);
  const [focusCounter, setFocusCounter] = useState(0);

  // Loading & error state for API calls
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filtered incidents: crime types (AND), polygon click, and/or area
  const filteredIncidents = useMemo(() => {
    let result = incidents;

    // If polygon click filter is active (IDs set), show only those
    if (filterIncidentIds && filterCrimeTypes.length > 0) {
      result = result.filter((inc) => filterIncidentIds.includes(inc.id));
    } else if (filterCrimeTypes.length > 0) {
      // AND conjunction: incident must have ALL selected crime types
      result = result.filter((inc) =>
        filterCrimeTypes.every((type) => inc.crimeType.includes(type))
      );
    }

    // Area filter
    if (filterArea) {
      result = result.filter((inc) => getArea(inc.location) === filterArea);
    }

    return result;
  }, [incidents, filterCrimeTypes, filterIncidentIds, filterArea]);

  // Fetch incidents from the backend API
  const fetchIncidents = useCallback(async (cityName) => {
    setIsLoading(true);
    setError(null);
    // Reset filters when searching a new city
    setFilterCrimeTypes([]);
    setFilterIncidentIds(null);
    setFilterArea(null);
    setSelectedIncident(null);
    setIsDetailOpen(false);

    try {
      const resp = await fetch(
        `${API_BASE}/search?city=${encodeURIComponent(cityName)}`
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `Search failed (${resp.status})`);
      }

      const data = await resp.json();

      // Update incidents from the API response
      setIncidents(data.articles || []);

      // Update city config if the backend provided one
      if (data.cityConfig) {
        setCityConfig(data.cityConfig);
      } else {
        setCityConfig((prev) => ({ ...prev, name: cityName }));
      }
    } catch (err) {
      console.error("API fetch error:", err);
      setError(err.message);
      setIncidents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Click on an incident card → open detail + pan map
  const handleIncidentClick = useCallback(
    (incident) => {
      if (isDetailOpen && selectedIncident?.id === incident.id) {
        setIsDetailOpen(false);
        setTimeout(() => setSelectedIncident(null), 400);
      } else {
        setSelectedIncident(incident);
        setIsDetailOpen(true);
        setFocusCounter((c) => c + 1);
      }
    },
    [isDetailOpen, selectedIncident]
  );

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedIncident(null), 400);
  }, []);

  // City search triggers API fetch
  const handleCitySearch = useCallback(
    (query) => {
      fetchIncidents(query);
    },
    [fetchIncidents]
  );

  // Click on a polygon slice → filter sidebar by crime type + that specific area
  const handlePolygonFilter = useCallback((crimeType, locationIncidents) => {
    setFilterCrimeTypes((prev) => {
      const alreadyActive = prev.includes(crimeType) && filterIncidentIds;
      if (alreadyActive) {
        setFilterIncidentIds(null);
        return [];
      }
      setFilterIncidentIds(locationIncidents.map((inc) => inc.id));
      // If detail panel is open (or there are incidents), auto-select the first one
      if (locationIncidents.length > 0) {
        setSelectedIncident(locationIncidents[0]);
        setIsDetailOpen(true);
        setFocusCounter((c) => c + 1);
      }
      return [crimeType];
    });
  }, [filterIncidentIds]);

  // Crime type pill click → toggle type in multi-select array (no location restriction)
  const handleFilterChange = useCallback((type) => {
    setFilterCrimeTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setFilterIncidentIds(null); // clear location-specific filter
  }, []);

  const handleClearFilter = useCallback(() => {
    setFilterCrimeTypes([]);
    setFilterIncidentIds(null);
  }, []);

  const handleAreaChange = useCallback((area) => {
    setFilterArea(area);
  }, []);

  const handleClearArea = useCallback(() => {
    setFilterArea(null);
  }, []);

  return (
    <>
      {/* ===== DESKTOP LAYOUT (md and up) ===== */}
      <div className="hidden md:flex h-screen w-screen overflow-hidden bg-background">
        <LeftSidebar
          cityName={cityConfig.name}
          incidents={filteredIncidents}
          allIncidents={incidents}
          selectedIncident={selectedIncident}
          onIncidentClick={handleIncidentClick}
          filterCrimeTypes={filterCrimeTypes}
          onFilterChange={handleFilterChange}
          onClearFilter={handleClearFilter}
          filterArea={filterArea}
          onAreaChange={handleAreaChange}
          onClearArea={handleClearArea}
          isLoading={isLoading}
          error={error}
        />

        <div
          className={`
            h-full overflow-hidden flex-shrink-0
            transition-[width] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isDetailOpen ? "w-[420px]" : "w-0"}
          `}
        >
          {selectedIncident && (
            <DetailPanel
              incident={selectedIncident}
              onClose={handleCloseDetail}
            />
          )}
        </div>

        <MapView
          incidents={incidents}
          selectedIncident={isDetailOpen ? selectedIncident : null}
          cityConfig={cityConfig}
          onCitySearch={handleCitySearch}
          onIncidentClick={handleIncidentClick}
          onPolygonFilter={handlePolygonFilter}
          filterCrimeTypes={filterCrimeTypes}
          focusCounter={focusCounter}
        />
      </div>

      {/* ===== MOBILE LAYOUT (below md) ===== */}
      <div className="flex md:hidden h-screen w-screen flex-col overflow-hidden bg-background">
        <div className="relative flex-1">
          <MapView
            incidents={incidents}
            selectedIncident={isDetailOpen ? selectedIncident : null}
            cityConfig={cityConfig}
            onCitySearch={handleCitySearch}
            onIncidentClick={handleIncidentClick}
            onPolygonFilter={handlePolygonFilter}
            filterCrimeTypes={filterCrimeTypes}
            focusCounter={focusCounter}
          />

          <MobileBottomSheet
            cityName={cityConfig.name}
            incidents={filteredIncidents}
            allIncidents={incidents}
            selectedIncident={selectedIncident}
            isDetailOpen={isDetailOpen}
            onIncidentClick={handleIncidentClick}
            onCloseDetail={handleCloseDetail}
            filterCrimeTypes={filterCrimeTypes}
            onFilterChange={handleFilterChange}
            onClearFilter={handleClearFilter}
            filterArea={filterArea}
            onAreaChange={handleAreaChange}
            onClearArea={handleClearArea}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </>
  );
}
