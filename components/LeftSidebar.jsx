"use client";

import { useMemo } from "react";
import IncidentCard from "./IncidentCard";
import { getUniqueCrimeTypes, getCrimeColor } from "@/lib/crimeTypes";
import { getUniqueAreas } from "@/lib/areaUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MapPin, Loader2 } from "lucide-react";

export default function LeftSidebar({
    cityName,
    incidents,
    allIncidents,
    selectedIncident,
    onIncidentClick,
    filterCrimeTypes,
    onFilterChange,
    onClearFilter,
    filterArea,
    onAreaChange,
    onClearArea,
    isLoading,
    error,
}) {
    const crimeTypes = useMemo(() => getUniqueCrimeTypes(allIncidents || incidents), [allIncidents, incidents]);
    const areas = useMemo(() => getUniqueAreas(allIncidents || incidents), [allIncidents, incidents]);

    return (
        <div className="flex h-full w-[360px] flex-shrink-0 flex-col bg-background border-r border-border">
            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-8 pb-3">
                <p className="text-4xl font-thin text-muted-foreground tracking-tight">
                    VigiLens
                </p>
                <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
                    {cityName || "—"}
                </h1>
            </div>

            <Separator className="mx-6 w-auto" />

            {/* Incidents count */}
            <div className="flex-shrink-0 px-6 pt-4 pb-2 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-foreground">Incidents</h2>
                <span className="text-xs text-muted-foreground font-medium tabular-nums">
                    {incidents.length} found
                </span>
            </div>

            {/* Crime Type Filter Pills */}
            <div className="flex-shrink-0 px-6 pb-3">
                <div className="flex flex-wrap gap-1.5">
                    <Badge
                        variant={filterCrimeTypes.length === 0 ? "default" : "outline"}
                        className="cursor-pointer text-[11px]"
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
                                className="cursor-pointer text-[11px] gap-1.5 transition-colors"
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
            </div>

            {/* Area Filter — shadcn Select */}
            <div className="flex-shrink-0 px-6 pb-4">
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
            </div>

            <Separator className="mx-6 w-auto" />

            {/* Incident Cards — scrollable */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="flex flex-col gap-3 px-5 py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                            <Loader2 className="size-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Searching crime reports…</p>
                            <p className="text-xs text-muted-foreground/60">This may take a minute</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
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
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-sm text-muted-foreground">No incidents found</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Search a city to get started</p>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => { onClearFilter(); onClearArea(); }}
                                className="mt-1 text-xs"
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
