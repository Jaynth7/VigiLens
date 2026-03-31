/**
 * Sample incident data for Delhi.
 * Each incident follows the standard JSON schema.
 * Coordinates are pre-filled for demo purposes (in production, these would be geocoded via Google APIs).
 */
export const sampleIncidents = [
    {
        id: 1,
        newsTitle: "Delhi Family Attacked At Home By 4 Men",
        date: "2026-02-01",
        location: "Laxmi Nagar, Delhi",
        crimeType: ["Sexual Assault"],
        sources:
            "https://www.ndtv.com/delhi-news/man-thrashed-wife-molested-and-son-stripped-by-group-of-men-in-delhi-10324001",
        summary:
            "A family in Laxmi Nagar was attacked by four men who broke into their home late at night. The assailants allegedly molested the wife and physically assaulted other family members before fleeing. Police have registered a case and launched a manhunt for the suspects.",
        // Pre-geocoded coordinates for demo
        lat: 28.6304,
        lng: 77.2777,
    },
    {
        id: 69,
        newsTitle: "Delhi Family Attacked At Home By 4 Men",
        date: "2026-02-01",
        location: "Laxmi Nagar, Delhi",
        crimeType: ["Theft"],
        sources:
            "https://www.ndtv.com/delhi-news/man-thrashed-wife-molested-and-son-stripped-by-group-of-men-in-delhi-10324001",
        summary:
            "A family in Laxmi Nagar was attacked by four men who broke into their home late at night. The assailants allegedly molested the wife and physically assaulted other family members before fleeing. Police have registered a case and launched a manhunt for the suspects.",
        // Pre-geocoded coordinates for demo
        lat: 28.6304,
        lng: 77.2777,
    },
    {
        id: 123,
        newsTitle: "Delhi Family Attacked At Home By 4 Men",
        date: "2026-02-01",
        location: "Laxmi Nagar, Delhi",
        crimeType: ["Robbery"],
        sources:
            "https://www.ndtv.com/delhi-news/man-thrashed-wife-molested-and-son-stripped-by-group-of-men-in-delhi-10324001",
        summary:
            "A family in Laxmi Nagar was attacked by four men who broke into their home late at night. The assailants allegedly molested the wife and physically assaulted other family members before fleeing. Police have registered a case and launched a manhunt for the suspects.",
        // Pre-geocoded coordinates for demo
        lat: 28.6304,
        lng: 77.2777,
    },
    {
        id: 2,
        newsTitle: "Chain Snatching Incident Near Nehru Place Metro",
        date: "2026-01-28",
        location: "Nehru Place, New Delhi",
        crimeType: ["Robbery"],
        sources: "https://www.example.com/nehru-place-chain-snatching",
        summary:
            "Two men on a motorcycle snatched a gold chain from a woman walking near Nehru Place Metro station during evening hours. The victim sustained minor injuries. CCTV footage is being reviewed by the police.",
        lat: 28.5491,
        lng: 77.2533,
    },
    {
        id: 3,
        newsTitle: "Stabbing Incident In Bhajanpura Market",
        date: "2026-01-25",
        location: "Bhajanpura, Delhi",
        crimeType: ["Murder"],
        sources: "https://www.example.com/bhajanpura-stabbing",
        summary:
            "A 32-year-old man was fatally stabbed during an altercation at a local market in Bhajanpura. The dispute reportedly began over a parking issue and escalated quickly. The accused has been arrested and the murder weapon recovered.",
        lat: 28.6892,
        lng: 77.2648,
    },
    {
        id: 4,
        newsTitle: "Woman Harassed On DTC Bus In Rohini",
        date: "2026-01-22",
        location: "Rohini, Delhi",
        crimeType: ["Sexual Assault"],
        sources: "https://www.example.com/rohini-bus-harassment",
        summary:
            "A young woman was allegedly harassed by a co-passenger on a DTC bus in Rohini Sector 7. Other passengers intervened and detained the accused until police arrived. An FIR has been filed under relevant sections.",
        lat: 28.7158,
        lng: 77.1174,
    },
    {
        id: 5,
        newsTitle: "ATM Robbery In Dwarka Sector 12",
        date: "2026-01-18",
        location: "Dwarka, Delhi",
        crimeType: ["Robbery"],
        sources: "https://www.example.com/dwarka-atm-robbery",
        summary:
            "Armed men looted cash from an ATM kiosk in Dwarka Sector 12 after threatening the security guard. The estimated loss is ₹15 lakh. Police are reviewing surveillance footage and have set up checkpoints in the area.",
        lat: 28.5921,
        lng: 77.0367,
    },
    {
        id: 6,
        newsTitle: "Multiple Thefts Reported In Sarojini Nagar Market",
        date: "2026-01-15",
        location: "Sarojini Nagar, Delhi",
        crimeType: ["Theft"],
        sources: "https://www.example.com/sarojini-nagar-thefts",
        summary:
            "Several shopkeepers in Sarojini Nagar reported thefts of merchandise and cash over the past week. Police suspect an organized gang is operating in the crowded market area. Additional patrols have been deployed.",
        lat: 28.5747,
        lng: 77.2001,
    },
    {
        id: 7,
        newsTitle: "Gang Violence Erupts In Jahangirpuri",
        date: "2026-01-12",
        location: "Jahangirpuri, Delhi",
        crimeType: ["Murder", "Robbery"],
        sources: "https://www.example.com/jahangirpuri-gang-violence",
        summary:
            "A violent clash between two rival gangs in Jahangirpuri left one person dead and three injured. The altercation involved firearms and sharp weapons. Police conducted raids and arrested five suspects. The area has been put under heavy surveillance.",
        lat: 28.7256,
        lng: 77.1699,
    },
    {
        id: 8,
        newsTitle: "Assault On Delivery Worker In Connaught Place",
        date: "2026-01-10",
        location: "Connaught Place, Delhi",
        crimeType: ["Assault"],
        sources: "https://www.example.com/cp-delivery-assault",
        summary:
            "A food delivery worker was brutally assaulted by a group of men in the inner circle of Connaught Place after a minor traffic dispute. The victim suffered head injuries and is undergoing treatment. Two accused have been apprehended.",
        lat: 28.6315,
        lng: 77.2167,
    },
    {
        id: 9,
        newsTitle: "Kidnapping Attempt Foiled In Pitampura",
        date: "2026-01-08",
        location: "Pitampura, Delhi",
        crimeType: ["Kidnapping"],
        sources: "https://www.example.com/pitampura-kidnapping-attempt",
        summary:
            "Alert neighbors foiled a kidnapping attempt when they noticed a child being forcefully taken into a car in Pitampura. The suspects fled the scene but their vehicle details have been captured on CCTV. Police are investigating.",
        lat: 28.6998,
        lng: 77.1318,
    },
    {
        id: 10,
        newsTitle: "Sexual Assault Case Reported In Shahdara",
        date: "2026-01-05",
        location: "Shahdara, Delhi",
        crimeType: ["Sexual Assault"],
        sources: "https://www.example.com/shahdara-assault",
        summary:
            "A woman reported being assaulted by her neighbor in Shahdara. The accused allegedly entered her house forcefully when she was alone. Police have arrested the accused and the victim is receiving medical and psychological support.",
        lat: 28.6737,
        lng: 77.2893,
    },
];

/**
 * Default city configuration for demo
 */
export const defaultCity = {
    name: "Delhi",
    center: { lat: 28.6139, lng: 77.209 },
    zoom: 11,
    bounds: {
        north: 28.8835,
        south: 28.4041,
        east: 77.3467,
        west: 76.8389,
    },
};
