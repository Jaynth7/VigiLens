"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import IncidentCard from "./IncidentCard";
import { getUniqueCrimeTypes, getCrimeColor } from "@/lib/crimeTypes";
import { getUniqueAreas } from "@/lib/areaUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X, MapPin, Calendar, ExternalLink, Loader2 } from "lucide-react";

const SNAP_PEEK = 12;
const SNAP_HALF = 50;
const SNAP_FULL = 92;

export default function MobileBottomSheet({
    cityName,
    incidents,
    allIncidents,
    selectedIncident,
    isDetailOpen,
    onIncidentClick,
    onCloseDetail,
    filterCrimeTypes,
    onFilterChange,
    onClearFilter,
    filterArea,
    onAreaChange,
    onClearArea,
    isLoading,
    error,
}) {
    const [heightVh, setHeightVh] = useState(SNAP_PEEK);
    const [transitioning, setTransitioning] = useState(true);
    const startY = useRef(0);
    const startH = useRef(0);

    const crimeTypes = useMemo(() => getUniqueCrimeTypes(allIncidents || incidents), [allIncidents, incidents]);
    const areas = useMemo(() => getUniqueAreas(allIncidents || incidents), [allIncidents, incidents]);

    const pxToVh = (px) => (px / window.innerHeight) * 100;

    const onPointerDown = useCallback((e) => {
        e.preventDefault();
        setTransitioning(false);
        startY.current = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
        startH.current = heightVh;

        const onMove = (ev) => {
            const currentY = ev.clientY ?? ev.touches?.[0]?.clientY ?? 0;
            const deltaVh = pxToVh(startY.current - currentY);
            const next = Math.max(SNAP_PEEK, Math.min(SNAP_FULL, startH.current + deltaVh));
            setHeightVh(next);
        };

        const onUp = () => {
            setTransitioning(true);
            setHeightVh((h) => {
                const snaps = [SNAP_PEEK, SNAP_HALF, SNAP_FULL];
                return snaps.reduce((best, s) => (Math.abs(h - s) < Math.abs(h - best) ? s : best));
            });
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onUp);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", onUp);
    }, [heightVh]);

    useEffect(() => {
        if (isDetailOpen) {
            setTransitioning(true);
            setHeightVh((h) => (h < SNAP_HALF ? SNAP_HALF : h));
        }
    }, [isDetailOpen, selectedIncident]);

    return (
        <div
            className="absolute bottom-0 left-0 right-0 z-30 flex flex-col rounded-t-2xl bg-background border-t border-border shadow-2xl"
            style={{
                height: `${heightVh}vh`,
                transition: transitioning ? "height 0.35s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
        >
            {/* Drag handle */}
            <div
                className="flex-shrink-0 flex flex-col items-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
                onPointerDown={onPointerDown}
            >
                <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 pb-2">
                <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                        {cityName || "City"}
                    </p>
                    <h2 className="text-sm font-semibold text-foreground">
                        {isDetailOpen ? "Incident Detail" : "Incidents"}
                        {!isDetailOpen && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                ({incidents.length})
                            </span>
                        )}
                    </h2>
                </div>
                {isDetailOpen && (
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={onCloseDetail}
                    >
                        <X className="size-3.5" />
                    </Button>
                )}
            </div>

            <Separator />

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8 scrollbar-thin">
                {isDetailOpen && selectedIncident ? (
                    <div className="flex flex-col gap-4 py-4">
                        <h3 className="text-lg font-bold text-foreground leading-tight">
                            {selectedIncident.newsTitle}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="size-3.5 flex-shrink-0" />
                            <span>{selectedIncident.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="size-3.5 flex-shrink-0" />
                            <span>{new Date(selectedIncident.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedIncident.crimeType.map((type) => {
                                const color = getCrimeColor(type);
                                return (
                                    <Badge
                                        key={type}
                                        className="text-xs text-white"
                                        style={{ backgroundColor: color.color }}
                                    >
                                        {type}
                                    </Badge>
                                );
                            })}
                        </div>
                        <Separator />
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Summary</h4>
                            <p className="text-sm leading-relaxed text-foreground/80">{selectedIncident.summary}</p>
                        </div>
                        <Button variant="outline" asChild className="self-start gap-2">
                            <a href={selectedIncident.sources} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="size-3.5" />
                                View Sources
                            </a>
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 pt-3">
                        {/* Crime Type Filters */}
                        <div className="flex flex-wrap gap-1.5 pb-1">
                            <Badge
                                variant={filterCrimeTypes.length === 0 ? "default" : "outline"}
                                className="cursor-pointer text-[10px]"
                                onClick={onClearFilter}
                            >
                                All
                            </Badge>
                            {crimeTypes.map((type) => {
                                const color = getCrimeColor(type);
                                const isActive = filterCrimeTypes.includes(type);
                                return (
                                    <Badge
                                        key={type}
                                        variant="outline"
                                        className="cursor-pointer text-[10px] gap-1 transition-colors"
                                        onClick={() => onFilterChange(type)}
                                        style={isActive ? {
                                            backgroundColor: `${color.color}20`,
                                            borderColor: `${color.color}60`,
                                            color: color.color,
                                        } : {}}
                                    >
                                        <span
                                            className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: color.color }}
                                        />
                                        {type}
                                    </Badge>
                                );
                            })}
                        </div>

                        {/* Area Filter */}
                        <Select
                            value={filterArea || "__all__"}
                            onValueChange={(val) => {
                                if (val === "__all__") {
                                    onClearArea();
                                } else {
                                    onAreaChange(val);
                                }
                            }}
                        >
                            <SelectTrigger className="w-full h-8 text-xs">
                                <MapPin className="size-3 text-muted-foreground" />
                                <SelectValue placeholder="All Areas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">All Areas</SelectItem>
                                {areas.map((area) => (
                                    <SelectItem key={area} value={area}>
                                        {area}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                                <Loader2 className="size-6 animate-spin text-primary" />
                                <p className="text-xs text-muted-foreground">Searching crime reports…</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                                <p className="text-sm text-destructive font-medium">{error}</p>
                                <p className="text-xs text-muted-foreground">Try a different city name</p>
                            </div>
                        ) : incidents.length > 0 ? (
                            incidents.map((incident) => (
                                <IncidentCard
                                    key={incident.id}
                                    incident={incident}
                                    isSelected={selectedIncident?.id === incident.id}
                                    onClick={onIncidentClick}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <p className="text-xs text-muted-foreground">Search a city to get started</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
