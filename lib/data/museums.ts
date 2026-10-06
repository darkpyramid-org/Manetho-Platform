import type { Museum, MuseumFloor, MuseumRoom, MuseumZone } from "@/types/museum";
import { ALLEN, GARDINER, TYLDESLEY, UNICODE } from "./sources";
import { museumCover } from "./images";

/**
 * Seed museums (spec §62).
 * Coordinates use Manetho's custom 0–1000 floor-plan
 * space (spec §14), decoupled from any geo system.
 */

function room(
  id: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  category: MuseumRoom["category"] = "gallery",
  accessibility = true,
): MuseumRoom {
  return { id, name, x, y, width, height, category, accessibility };
}

function floor(
  id: string,
  name: string,
  level: number,
  rooms: MuseumRoom[],
  zones: MuseumZone[] = [],
): MuseumFloor {
  return { id, name, level, planWidth: 1000, planHeight: 1000, rooms, zones };
}

const gemRoomsGround: MuseumRoom[] = [
  room("gem-g0-entrance", "Grand Entrance Atrium", 350, 850, 300, 130, "atrium"),
  room("gem-g1", "Gallery 1 — Predynastic & Early Dynastic", 40, 560, 410, 270),
  room("gem-g2", "Gallery 2 — Old Kingdom", 550, 560, 410, 270),
  room("gem-g3", "Gallery 3 — Middle Kingdom", 40, 270, 410, 270),
  room("gem-g4", "Gallery 4 — New Kingdom", 550, 270, 410, 270),
  room("gem-g5", "Gallery 5 — Late Period & Greco-Roman", 40, 40, 920, 210),
  room("gem-g0-shop", "Museum Shop", 40, 850, 180, 130, "shop"),
  room("gem-g0-cafe", "Café", 780, 850, 180, 130, "cafe"),
];

const gemRoomsUpper: MuseumRoom[] = [
  room("gem-f1-entrance", "Upper Level Entrance", 350, 850, 300, 130, "atrium"),
  room("gem-f1-tut", "Tutankhamun Galleries", 40, 500, 440, 330),
  room("gem-f1-mummies", "Royal Mummies Hall", 520, 500, 440, 330),
  room("gem-f1-lab", "Conservation Lab", 40, 60, 440, 180, "laboratory", false),
  room("gem-f1-temp", "Temporary Exhibition", 520, 60, 440, 180),
];

const cairoRoomsGround: MuseumRoom[] = [
  room("cairo-g0-entrance", "Tahrir Entrance", 350, 850, 300, 130, "atrium"),
  room("cairo-g1", "Old Kingdom Hall", 40, 500, 440, 330),
  room("cairo-g2", "Middle Kingdom Hall", 520, 500, 440, 330),
  room("cairo-g3", "Narmer Gallery", 40, 60, 440, 180),
  room("cairo-g4", "Orientation Hall", 520, 60, 440, 180, "hall"),
];

const cairoRoomsUpper: MuseumRoom[] = [
  room("cairo-f1-entrance", "First Floor Entrance", 350, 850, 300, 130, "atrium"),
  room("cairo-f1-nk", "New Kingdom Hall", 40, 560, 440, 270),
  room("cairo-f1-amarna", "Amarna Gallery", 520, 560, 440, 270),
  room("cairo-f1-jewelry", "Royal Jewellery Gallery", 40, 60, 440, 210),
  room("cairo-f1-mummies", "Mummies Hall", 520, 60, 440, 210),
];

const turinRoomsGround: MuseumRoom[] = [
  room("turin-g0-entrance", "Main Entrance", 350, 850, 300, 130, "atrium"),
  room("turin-g1", "Predynastic Gallery", 40, 500, 440, 330),
  room("turin-g2", "Old Kingdom Gallery", 520, 500, 440, 330),
  room("turin-g3", "Nubian Gallery", 40, 60, 440, 180),
  room("turin-g4", "Hall of the Kings", 520, 60, 440, 180, "hall"),
];

const turinRoomsUpper: MuseumRoom[] = [
  room("turin-f1-entrance", "First Floor Entrance", 350, 850, 300, 130, "atrium"),
  room("turin-f1-nk", "New Kingdom Gallery", 40, 560, 440, 270),
  room("turin-f1-bod", "Book of the Dead Gallery", 520, 560, 440, 270),
  room("turin-f1-craft", "Craftsmanship Gallery", 40, 60, 440, 210),
  room("turin-f1-library", "Research Library", 520, 60, 440, 210),
];

const britishRoomsGround: MuseumRoom[] = [
  room("bm-g0-entrance", "Great Court Entrance", 350, 850, 300, 130, "atrium"),
  room("bm-g1", "Room 4 — The Rosetta Stone", 40, 560, 410, 270),
  room("bm-g2", "Egyptian Sculpture Gallery", 550, 560, 410, 270),
  room("bm-g3", "Early Egypt Gallery", 40, 270, 410, 270),
  room("bm-g4", "Late Period Gallery", 550, 270, 410, 270),
  room("bm-g5", "Sudan and Nubia Gallery", 40, 40, 920, 210),
];

const britishRoomsUpper: MuseumRoom[] = [
  room("bm-f1-entrance", "Upper Floor Entrance", 350, 850, 300, 130, "atrium"),
  room("bm-f1-bod", "Death and the Afterlife", 40, 560, 440, 270),
  room("bm-f1-mummies", "Mummies Gallery", 520, 560, 440, 270),
  room("bm-f1-nile", "Nile and Daily Life", 40, 60, 440, 210),
  room("bm-f1-study", "Study Room", 520, 60, 440, 210, "hall"),
];

const gemZones: MuseumZone[] = [
  {
    id: "gem-zone-royal",
    name: "Royal Burial Zone",
    polygon: [
      { x: 40, y: 500 },
      { x: 480, y: 500 },
      { x: 480, y: 830 },
      { x: 40, y: 830 },
    ],
    theme: "Royal burial equipment",
  },
];

export const museums: Museum[] = [
  {
    id: "museum-gem",
    name: "Grand Egyptian Museum",
    slug: "grand-egyptian-museum",
    description:
      "The Grand Egyptian Museum (GEM), near the Giza Pyramids, is one of the largest archaeological museums in the world. Its galleries present the full span of Egyptian civilisation, from the Predynastic period to the Greco-Roman era, including the complete Tutankhamun collection.",
    country: "Egypt",
    city: "Giza",
    address: "Al Haram, Giza Governorate, Egypt",
    latitude: 29.9773,
    longitude: 31.1325,
    coverImage: museumCover("grand-egyptian-museum", "Grand Egyptian Museum"),
    openingHours: "Open daily 09:00–17:00 (demo data)",
    website: "https://gem-eg.com",
    timezone: "Africa/Cairo",
    language: "en",
    status: "PUBLISHED",
    floors: [
      floor("gem-f0", "Ground Floor", 0, gemRoomsGround, gemZones),
      floor("gem-f1", "First Floor", 1, gemRoomsUpper),
    ],
    tours: [],
    arExperiences: [],
    sources: [
      {
        id: "src-gem",
        title: "Grand Egyptian Museum — official site",
        type: "MUSEUM",
        url: "https://gem-eg.com",
        citationText:
          "Grand Egyptian Museum (2026). gem-eg.com. Giza, Egypt.",
      },
      TYLDESLEY,
    ],
  },
  {
    id: "museum-cairo",
    name: "Egyptian Museum, Cairo",
    slug: "egyptian-museum-cairo",
    description:
      "The Egyptian Museum on Tahrir Square holds the world's largest collection of Pharaonic antiquities, including the Narmer Palette, the Meidum geese and the royal cache from Deir el-Bahari. Founded in 1858, it anchors the downtown Cairo museum quarter.",
    country: "Egypt",
    city: "Cairo",
    address: "Tahrir Square, Cairo, Egypt",
    latitude: 30.0478,
    longitude: 31.2336,
    coverImage: museumCover("egyptian-museum-cairo", "Egyptian Museum"),
    openingHours: "Open daily 09:00–17:00 (demo data)",
    website: "https://sca-egypt.org",
    timezone: "Africa/Cairo",
    language: "en",
    status: "PUBLISHED",
    floors: [
      floor("cairo-f0", "Ground Floor", 0, cairoRoomsGround),
      floor("cairo-f1", "First Floor", 1, cairoRoomsUpper),
    ],
    tours: [],
    arExperiences: [],
    sources: [
      {
        id: "src-cairo",
        title: "Egyptian Museum — official site",
        type: "MUSEUM",
        url: "https://sca-egypt.org",
        citationText:
          "Supreme Council of Antiquities (2026). Egyptian Museum, Tahrir Square, Cairo.",
      },
      TYLDESLEY,
    ],
  },
  {
    id: "museum-turin",
    name: "Museo Egizio",
    slug: "museo-egizio",
    description:
      "The Museo Egizio in Turin holds one of the most important collections of Egyptian antiquities outside Egypt, founded in 1824. Its holdings include the Turin King List, the Book of the Dead of Iuf'ankh and extensive Nubian material.",
    country: "Italy",
    city: "Turin",
    address: "Via Accademia delle Scienze, 6, 10123 Turin, Italy",
    latitude: 45.0724,
    longitude: 7.6866,
    coverImage: museumCover("museo-egizio", "Museo Egizio"),
    openingHours: "Open daily 09:00–18:30 (demo data)",
    website: "https://www.museoegizio.it",
    timezone: "Europe/Rome",
    language: "en",
    status: "PUBLISHED",
    floors: [
      floor("turin-f0", "Ground Floor", 0, turinRoomsGround),
      floor("turin-f1", "First Floor", 1, turinRoomsUpper),
    ],
    tours: [],
    arExperiences: [],
    sources: [
      {
        id: "src-turin",
        title: "Museo Egizio — official site",
        type: "MUSEUM",
        url: "https://www.museoegizio.it",
        citationText:
          "Museo Egizio (2026). Via Accademia delle Scienze 6, Turin, Italy.",
      },
      GARDINER,
    ],
  },
  {
    id: "museum-british",
    name: "The British Museum",
    slug: "british-museum",
    description:
      "The British Museum in London holds one of the world's great Egyptian collections, including the Rosetta Stone, the Younger Memnon bust of Ramesses II and the Book of the Dead of Hunefer. Its Egyptian galleries span from Predynastic times to the Roman period.",
    country: "United Kingdom",
    city: "London",
    address: "Great Russell Street, London WC1B 3DG, UK",
    latitude: 51.5194,
    longitude: -0.127,
    coverImage: museumCover("british-museum", "The British Museum"),
    openingHours: "Open daily 10:00–17:00 (demo data)",
    website: "https://www.britishmuseum.org",
    timezone: "Europe/London",
    language: "en",
    status: "PUBLISHED",
    floors: [
      floor("bm-f0", "Ground Floor", 0, britishRoomsGround),
      floor("bm-f1", "Upper Floor", 1, britishRoomsUpper),
    ],
    tours: [],
    arExperiences: [],
    sources: [
      {
        id: "src-bm",
        title: "The British Museum — official site",
        type: "MUSEUM",
        url: "https://www.britishmuseum.org",
        citationText:
          "British Museum (2026). Great Russell Street, London, UK.",
      },
      TYLDESLEY,
    ],
  },
];

/** Look up a museum by slug. */
export function findMuseum(
  slugOrId: string,
): Museum | undefined {
  return museums.find(
    (m) => m.slug === slugOrId || m.id === slugOrId,
  );
}

/** Find the room containing an artifact's location. */
export function findRoom(
  museum: Museum,
  roomId: string | undefined,
): MuseumRoom | undefined {
  if (!roomId) return undefined;
  for (const f of museum.floors) {
    const found = f.rooms.find((r) => r.id === roomId);
    if (found) return found;
  }
  return undefined;
}

/** The floor a room belongs to. */
export function floorForRoom(
  museum: Museum,
  roomId: string,
): MuseumFloor | undefined {
  return museum.floors.find((f) =>
    f.rooms.some((r) => r.id === roomId),
  );
}

export const scholarlySources = [ALLEN, GARDINER, UNICODE, TYLDESLEY];
