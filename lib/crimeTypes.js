/**
 * Crime type → color mapping.
 * Add new entries here to scale the color coding system.
 * The key must match the crimeType values used in incident data.
 */
export const CRIME_COLORS = {
    "Sexual Assault": {
        color: "#E53E3E",
        bg: "rgba(229, 62, 62, 0.25)",
        border: "rgba(229, 62, 62, 0.6)",
        label: "Sexual Assault",
    },
    Robbery: {
        color: "#DD6B20",
        bg: "rgba(221, 107, 32, 0.25)",
        border: "rgba(221, 107, 32, 0.6)",
        label: "Robbery",
    },
    Murder: {
        color: "#9B2C2C",
        bg: "rgba(155, 44, 44, 0.25)",
        border: "rgba(155, 44, 44, 0.6)",
        label: "Murder",
    },
    Theft: {
        color: "#3182CE",
        bg: "rgba(49, 130, 206, 0.25)",
        border: "rgba(49, 130, 206, 0.6)",
        label: "Theft",
    },
    Assault: {
        color: "#D69E2E",
        bg: "rgba(214, 158, 46, 0.25)",
        border: "rgba(214, 158, 46, 0.6)",
        label: "Assault",
    },
    Kidnapping: {
        color: "#805AD5",
        bg: "rgba(128, 90, 213, 0.25)",
        border: "rgba(128, 90, 213, 0.6)",
        label: "Kidnapping",
    },
    // Fallback for any crime type not explicitly mapped
    _default: {
        color: "#718096",
        bg: "rgba(113, 128, 150, 0.25)",
        border: "rgba(113, 128, 150, 0.6)",
        label: "Other",
    },
};

/**
 * Get the color config for a given crime type.
 * Falls back to _default if not found.
 */
export function getCrimeColor(crimeType) {
    return CRIME_COLORS[crimeType] || CRIME_COLORS._default;
}

/**
 * Get all unique crime types from an array of incidents.
 */
export function getUniqueCrimeTypes(incidents) {
    const types = new Set();
    incidents.forEach((incident) => {
        incident.crimeType.forEach((type) => types.add(type));
    });
    return Array.from(types);
}
