import type { MuseumTour, TourStop } from "@/types/museum";

/**
 * Seed museum tours (spec §62).
 * Each tour is a curated walking route through a
 * museum's floor plan, with narration per stop.
 */

function stop(
  id: string,
  order: number,
  artifactId: string,
  title: string,
  narration: string,
  durationSeconds: number,
): TourStop {
  return { id, order, artifactId, title, narration, durationSeconds };
}

export const tours: MuseumTour[] = [
  {
    id: "t-gem-tutankhamun",
    museumId: "museum-gem",
    title: "Tutankhamun: The Treasures",
    description:
      "The complete burial equipment of the boy king — mask, throne, shrine and canopic chest — in the order Carter's team uncovered them.",
    durationMinutes: 25,
    language: "en",
    accessibility: "full",
    status: "PUBLISHED",
    theme: "Royal burial",
    stops: [
      stop(
        "t-gem-ts-1",
        1,
        "a-tut-mask",
        "The Funerary Mask",
        "Gold, glass and lapis lazuli, 54 cm tall. The mask depicts Tutankhamun as Osiris and bears a protective spell from Chapter 151 of the Book of the Dead. Note the inlaid collar of semi-precious stones.",
        180,
      ),
      stop(
        "t-gem-ts-2",
        2,
        "a-tut-throne",
        "The Golden Throne",
        "Found in the antechamber. The armrests show the royal couple beneath the sun disc, with rays ending in hands — the Amarna religion in a single image.",
        150,
      ),
      stop(
        "t-gem-ts-3",
        3,
        "a-anubis-shrine",
        "Shrine of Anubis",
        "A gilded naos on a sledge, with a recumbent jackal. It guarded the entrance to the treasury — Anubis, the god of embalming, watching over the dead king.",
        150,
      ),
      stop(
        "t-gem-ts-4",
        4,
        "a-canopic-chest",
        "The Canopic Chest",
        "Translucent calcite holding the four jars that protected the king's viscera. The stoppers are shaped as the king's own face.",
        150,
      ),
    ],
  },
  {
    id: "t-bm-afterlife",
    museumId: "museum-british",
    title: "Death and the Afterlife",
    description:
      "How Egypt prepared for eternity — from a Predynastic desert burial to the weighing of the heart.",
    durationMinutes: 30,
    language: "en",
    accessibility: "full",
    status: "PUBLISHED",
    theme: "Funerary beliefs",
    stops: [
      stop(
        "t-bm-ts-1",
        1,
        "a-gebelein-man",
        "Gebelein Man",
        "A naturally mummified Predynastic burial, c. 3400 BCE — before artificial mummification existed. The hot desert sand preserved the body; CT scans in 2012 suggest he died a violent death.",
        180,
      ),
      stop(
        "t-bm-ts-2",
        2,
        "a-gayer-cat",
        "The Gayer-Anderson Cat",
        "A polished bronze Bastet, c. 600 BCE, with gold earrings and a nose ring. Cat cults flourished in the Late Period; mummified cats were offered by the thousands.",
        150,
      ),
      stop(
        "t-bm-ts-3",
        3,
        "a-hunefer-bod",
        "The Book of the Dead of Hunefer",
        "The famous scene: the heart weighed against the feather of Maat before Osiris, watched by the forty-two judges, with Ammit beside the scales. If the heart balanced, the deceased entered the Field of Reeds.",
        210,
      ),
    ],
  },
  {
    id: "t-cairo-pharaohs",
    museumId: "museum-cairo",
    title: "From Narmer to Ramesses",
    description:
      "Three millennia of Egyptian kingship in one walk — unification, the pyramid age and the empire.",
    durationMinutes: 40,
    language: "en",
    accessibility: "partial",
    status: "PUBLISHED",
    theme: "Royal history",
    stops: [
      stop(
        "t-cairo-ts-1",
        1,
        "a-narmer-palette",
        "The Narmer Palette",
        "c. 3100 BCE. One side shows the king in the White Crown smiting a captive; the other shows him in the Red Crown in procession. Often cited as evidence of unification — though scholars debate exactly what it records.",
        180,
      ),
      stop(
        "t-cairo-ts-2",
        2,
        "a-ka-aper",
        "Ka-aper, 'Sheikh el-Beled'",
        "A wooden statue of a 5th-Dynasty priest with inlaid eyes, so lifelike that excavators nicknamed it after their local foreman. Old Kingdom portraiture at its most individual.",
        150,
      ),
      stop(
        "t-cairo-ts-3",
        3,
        "a-khafre-statue",
        "Khafre Enthroned",
        "Polished diorite, c. 2550 BCE. A falcon of Horus shelters the king's head, fusing king with god. The throne is fused with the heraldic plants of the Two Lands.",
        150,
      ),
      stop(
        "t-cairo-ts-4",
        4,
        "a-ramesses-colossus",
        "Ramesses II",
        "The long-reigning 19th-Dynasty pharaoh in granite, nemes headdress and uraeus at the brow. Colossal statues projected the king's eternal presence.",
        150,
      ),
    ],
  },
  {
    id: "t-turin-middle-kingdom",
    museumId: "museum-turin",
    title: "The Middle Kingdom and the Nile",
    description:
      "Coffins, collars and shabtis — the material culture of Egypt's reunified age.",
    durationMinutes: 20,
    language: "en",
    accessibility: "full",
    status: "PUBLISHED",
    theme: "Middle Kingdom",
    stops: [
      stop(
        "t-turin-ts-1",
        1,
        "a-mk-coffin",
        "A Middle Kingdom Coffin",
        "Cedar, painted, c. 1900 BCE. Middle Kingdom coffins carry the earliest versions of the Coffin Texts — spells that would later become the Book of the Dead.",
        150,
      ),
      stop(
        "t-turin-ts-2",
        2,
        "a-usekh-collar",
        "The Broad Collar",
        "Concentric rings of faience, glass and gold. The usekh was worn by the living and the dead; its layered rows echo the plumage of the vulture goddess Nekhbet.",
        120,
      ),
      stop(
        "t-turin-ts-3",
        3,
        "a-shabti",
        "The Shabti",
        "Blue faience, c. 1200 BCE. Shabtis were substitute workers for the afterlife — when the dead were called to labour in the Field of Reeds, the shabti answered 'Here I am'.",
        120,
      ),
    ],
  },
  {
    id: "t-gem-beliefs",
    museumId: "museum-gem",
    title: "Gods, Amulets and Magic",
    description:
      "Protection in daily life — the wedjat eye, the jackal god and the royal scarab.",
    durationMinutes: 18,
    language: "en",
    accessibility: "full",
    status: "PUBLISHED",
    theme: "Religion and magic",
    stops: [
      stop(
        "t-gem-ts-5",
        1,
        "a-wadjet-amulet",
        "The Wedjat Eye",
        "The Eye of Horus: healing, protection and wholeness. Amulets of this form were among the most common objects in Egypt, placed on the body to restore the senses in the afterlife.",
        120,
      ),
      stop(
        "t-gem-ts-6",
        2,
        "a-anubis-shrine",
        "Anubis, Guardian",
        "The jackal god of embalming, shown as a gilded shrine on a sledge. Jackals haunted the desert edge where the dead were buried — so the god who watched over them took their form.",
        150,
      ),
      stop(
        "t-gem-ts-7",
        3,
        "a-amenhotep-scarab",
        "The Royal Scarab",
        "Commemorative scarabs of Amenhotep III were royal 'news bullets' — over 200 survive, publicising events such as the king's marriage to Queen Tiye.",
        120,
      ),
    ],
  },
];

export function findTour(slugOrId: string): MuseumTour | undefined {
  return tours.find(
    (t) => t.id === slugOrId || t.title === slugOrId,
  );
}

export function toursByMuseum(museumId: string): MuseumTour[] {
  return tours.filter((t) => t.museumId === museumId);
}
