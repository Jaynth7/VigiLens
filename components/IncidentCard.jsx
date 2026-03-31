"use client";

import { getCrimeColor } from "@/lib/crimeTypes";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, ChevronRight } from "lucide-react";

export default function IncidentCard({ incident, isSelected, onClick }) {
    const primaryCrimeType = incident.crimeType[0];
    const crimeColor = getCrimeColor(primaryCrimeType);

    const dateStr = new Date(incident.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    return (
        <div
            onClick={() => onClick(incident)}
            className={`
                group cursor-pointer rounded-lg border p-4 transition-all duration-200
                ${isSelected
                    ? "border-primary bg-accent shadow-sm"
                    : "border-border/50 bg-card hover:border-border hover:bg-accent/50"
                }
            `}
        >
            {/* Title row with crime color accent */}
            <div className="flex items-start gap-3">
                <div
                    className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: crimeColor.color }}
                />
                <h4 className="text-sm font-semibold text-foreground leading-snug">
                    {incident.newsTitle}
                </h4>
            </div>

            {/* Summary */}
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-[22px]">
                {incident.summary}
            </p>

            {/* Metadata */}
            <div className="mt-3 flex items-center gap-3 pl-[22px] text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {incident.location.split(",")[0]}
                </span>
                <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3" />
                    {dateStr}
                </span>
            </div>

            {/* Crime type badges */}
            <div className="mt-3 flex flex-wrap gap-1.5 pl-[22px]">
                {incident.crimeType.map((type) => {
                    const color = getCrimeColor(type);
                    return (
                        <Badge
                            key={type}
                            variant="outline"
                            className="text-[10px] py-0 px-2 border-border/60"
                            style={{
                                color: color.color,
                                borderColor: `${color.color}40`,
                            }}
                        >
                            {type}
                        </Badge>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-end">
                <ChevronRight
                    className={`size-4 transition-transform duration-200 ${isSelected ? "translate-x-0.5 text-primary" : "text-muted-foreground"
                        } group-hover:translate-x-0.5`}
                />
            </div>
        </div>
    );
}
