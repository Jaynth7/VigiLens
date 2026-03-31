"use client";

import { getCrimeColor } from "@/lib/crimeTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Calendar, ChevronLeft, ExternalLink } from "lucide-react";

export default function DetailPanel({ incident, onClose }) {
    if (!incident) return null;

    return (
        <div className="relative flex h-full w-[420px] flex-shrink-0 flex-col bg-background border-r border-border overflow-hidden">
            {/* Retract button — slim strip on right edge */}
            <Button
                variant="ghost"
                onClick={onClose}
                className="absolute right-0 top-0 bottom-0 z-20 w-9 h-full rounded-none border-l border-border hover:bg-accent cursor-pointer"
                aria-label="Close detail panel"
            >
                <ChevronLeft className="size-4 text-muted-foreground" />
            </Button>

            {/* Content */}
            <ScrollArea className="flex-1 pr-10">
                <div className="flex flex-col gap-5 p-6">
                    {/* Title */}
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                        {incident.newsTitle}
                    </h2>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="size-4 flex-shrink-0" />
                        <span>{incident.location}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-4 flex-shrink-0" />
                        <span>
                            {new Date(incident.date).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            })}
                        </span>
                    </div>

                    {/* Crime Type Badges */}
                    <div className="flex flex-wrap gap-2">
                        {incident.crimeType.map((type) => {
                            const crimeColor = getCrimeColor(type);
                            return (
                                <Badge
                                    key={type}
                                    className="text-xs text-white"
                                    style={{ backgroundColor: crimeColor.color }}
                                >
                                    {type}
                                </Badge>
                            );
                        })}
                    </div>

                    <Separator />

                    {/* Summary */}
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                            Summary
                        </h3>
                        <p className="text-sm leading-7 text-foreground/80">
                            {incident.summary}
                        </p>
                    </div>

                    <Separator />

                    {/* View Sources */}
                    <div>
                        <Button
                            variant="outline"
                            asChild
                            className="gap-2"
                        >
                            <a
                                href={incident.sources}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="size-4" />
                                View Sources
                            </a>
                        </Button>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
