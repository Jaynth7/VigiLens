/**
 * Extract unique area names from incidents.
 * Takes the part before the first comma in the location field.
 */
export function getUniqueAreas(incidents) {
    const areas = new Set();
    incidents.forEach((inc) => {
        const area = inc.location.split(",")[0].trim();
        if (area) areas.add(area);
    });
    return Array.from(areas).sort();
}

/**
 * Get the area portion of a location string.
 */
export function getArea(location) {
    return location.split(",")[0].trim();
}
