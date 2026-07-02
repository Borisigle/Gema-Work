// ─────────────────────────────────────────────────────────────────────────────
// DANCE STUDIO – Core Data Configuration
// All teachers, groups, and schedules hardcoded here.
// ─────────────────────────────────────────────────────────────────────────────

export type DayOfWeek =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

export interface Choreo {
  id: string;
  name: string;
  /** Paths relative to /public/audio/ */
  songs: { title: string; file: string }[];
}

export interface Group {
  id: string;
  teacherId: string;
  name: string;
  days: DayOfWeek[];
  /** Choreos are hardcoded here; songs are in /public/audio/<teacherId>/<groupId>/ */
  choreos: Choreo[];
}

export interface Teacher {
  id: string;
  name: string;
  username: string;
  /** In production, passwords come from env vars — this is just for type reference */
  groupIds: string[];
  color: string; // accent color for this teacher's UI
}

// ─────────────────────────────────────────────────────────────────────────────
// TEACHERS
// ─────────────────────────────────────────────────────────────────────────────
export const TEACHERS: Teacher[] = [
  {
    id: "cami",
    name: "Cami",
    username: "cami",
    groupIds: [
      "cami-mega-crew",
      "cami-mega-kids",
      "cami-bratz",
      "cami-girly-team",
      "cami-mega-teens",
      "cami-golden",
    ],
    color: "#c084fc", // purple
  },
  {
    id: "ani",
    name: "Ani",
    username: "ani",
    groupIds: ["ani-reggaeton-femme", "ani-reggaeton"],
    color: "#f472b6", // pink
  },
  {
    id: "nasya",
    name: "Nasya",
    username: "nasya",
    groupIds: ["nasya-mix-dance", "nasya-urban-kids", "nasya-street-dance"],
    color: "#34d399", // emerald
  },
  {
    id: "lulu",
    name: "Lulu",
    username: "lulu",
    groupIds: ["lulu-jazz-conte"],
    color: "#fbbf24", // amber
  },
  {
    id: "lucas",
    name: "Lucas",
    username: "lucas",
    groupIds: ["lucas-ladys", "lucas-latino"],
    color: "#60a5fa", // blue
  },
  {
    id: "marian",
    name: "Marian",
    username: "marian",
    groupIds: ["marian-arabe-inicial", "marian-arabe-intermedio"],
    color: "#fb923c", // orange
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GROUPS
// ─────────────────────────────────────────────────────────────────────────────
export const GROUPS: Group[] = [
  // ── CAMI ──────────────────────────────────────────────────────────────────
  {
    id: "cami-mega-crew",
    teacherId: "cami",
    name: "Mega Crew",
    days: ["miercoles"],
    choreos: [
      {
        id: "cami-mega-crew-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Remix 1", file: "cami/mega-crew/remix-1.mp3" }],
      },
      {
        id: "cami-mega-crew-coreo2",
        name: "Coreo 2",
        songs: [{ title: "Vampiros", file: "https://res.cloudinary.com/drdfbjkn/video/upload/v1782940844/VAMPIROS_kqdny0.mp3" }],
      },
    ],
  },
  {
    id: "cami-mega-kids",
    teacherId: "cami",
    name: "Mega Crew Kids",
    days: ["miercoles"],
    choreos: [
      {
        id: "cami-mega-kids-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Remix 1", file: "cami/mega-kids/remix-1.mp3" }],
      },
      {
        id: "cami-mega-kids-coreo2",
        name: "Coreo 2",
        songs: [{ title: "Shine", file: "https://res.cloudinary.com/drdfbjkn/video/upload/v1782940922/51-SHINE-GEMA_COMPANY_pttrwv.mp3" }],
      },
    ],
  },
  {
    id: "cami-bratz",
    teacherId: "cami",
    name: "Bratz",
    days: ["lunes"],
    choreos: [
      {
        id: "cami-bratz-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Remix 1", file: "cami/bratz/remix-1.mp3" }],
      },
      {
        id: "cami-bratz-coreo2",
        name: "Coreo 2",
        songs: [{ title: "Remix 2", file: "cami/bratz/remix-2.mp3" }],
      },
    ],
  },
  {
    id: "cami-girly-team",
    teacherId: "cami",
    name: "Girly Team",
    days: ["lunes"],
    choreos: [
      {
        id: "cami-girly-team-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Remix 1", file: "cami/girly-team/remix-1.mp3" }],
      },
      {
        id: "cami-girly-team-coreo2",
        name: "Coreo 2",
        songs: [{ title: "Remix 2", file: "cami/girly-team/remix-2.mp3" }],
      },
    ],
  },
  {
    id: "cami-mega-teens",
    teacherId: "cami",
    name: "Mega Teens",
    days: ["viernes"],
    choreos: [
      {
        id: "cami-mega-teens-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Remix 1", file: "cami/mega-teens/remix-1.mp3" }],
      },
      {
        id: "cami-mega-teens-coreo2",
        name: "Coreo 2",
        songs: [{ title: "Remix 2", file: "cami/mega-teens/remix-2.mp3" }],
      },
    ],
  },
  {
    id: "cami-golden",
    teacherId: "cami",
    name: "Golden",
    days: ["viernes"],
    choreos: [
      {
        id: "cami-golden-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Remix 1", file: "cami/golden/remix-1.mp3" }],
      },
      {
        id: "cami-golden-coreo2",
        name: "Coreo 2",
        songs: [{ title: "Remix 2", file: "cami/golden/remix-2.mp3" }],
      },
    ],
  },

  // ── ANI ───────────────────────────────────────────────────────────────────
  {
    id: "ani-reggaeton-femme",
    teacherId: "ani",
    name: "Reggaeton Femme",
    days: ["martes", "jueves"],
    choreos: [
      {
        id: "ani-reggaeton-femme-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Remix 1", file: "ani/reggaeton-femme/remix-1.mp3" }],
      },
    ],
  },
  {
    id: "ani-reggaeton",
    teacherId: "ani",
    name: "Reggaeton",
    days: ["martes", "jueves"],
    choreos: [
      {
        id: "ani-reggaeton-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Remix 1", file: "ani/reggaeton/remix-1.mp3" }],
      },
    ],
  },

  // ── NASYA ─────────────────────────────────────────────────────────────────
  {
    id: "nasya-mix-dance",
    teacherId: "nasya",
    name: "Mix Dance",
    days: ["martes", "jueves"],
    choreos: [
      {
        id: "nasya-mix-dance-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Remix 1", file: "nasya/mix-dance/remix-1.mp3" }],
      },
    ],
  },
  {
    id: "nasya-urban-kids",
    teacherId: "nasya",
    name: "Urban Kids",
    days: ["martes", "jueves"],
    choreos: [
      {
        id: "nasya-urban-kids-coreo1",
        name: "Coreo 1",
        songs: [{ title: "No Cap", file: "https://res.cloudinary.com/drdfbjkn/video/upload/v1783015431/no_cap_urban_bwofea.mp3" }],
      },
    ],
  },
  {
    id: "nasya-street-dance",
    teacherId: "nasya",
    name: "Street Dance",
    days: ["martes", "jueves"],
    choreos: [
      {
        id: "nasya-street-dance-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Demons", file: "https://res.cloudinary.com/drdfbjkn/video/upload/v1783015435/demons_street_x2qpsf.mp3" }],
      },
    ],
  },

  // ── LULU ──────────────────────────────────────────────────────────────────
  {
    id: "lulu-jazz-conte",
    teacherId: "lulu",
    name: "Jazz Conté",
    days: ["viernes"],
    choreos: [
      {
        id: "lulu-jazz-conte-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Remix 1", file: "lulu/jazz-conte/remix-1.mp3" }],
      },
    ],
  },

  // ── LUCAS ─────────────────────────────────────────────────────────────────
  {
    id: "lucas-ladys",
    teacherId: "lucas",
    name: "Ladys",
    days: ["martes", "jueves"],
    choreos: [
      {
        id: "lucas-ladys-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Remix 1", file: "lucas/ladys/remix-1.mp3" }],
      },
    ],
  },
  {
    id: "lucas-latino",
    teacherId: "lucas",
    name: "Latino",
    days: ["martes", "jueves"],
    choreos: [
      {
        id: "lucas-latino-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Remix 1", file: "lucas/latino/remix-1.mp3" }],
      },
    ],
  },

  // ── MARIAN ────────────────────────────────────────────────────────────────
  {
    id: "marian-arabe-inicial",
    teacherId: "marian",
    name: "Árabe Inicial",
    days: ["lunes", "miercoles"],
    choreos: [
      {
        id: "marian-arabe-inicial-coreo1",
        name: "Coreo 1",
        songs: [{ title: "Remix 1", file: "marian/arabe-inicial/remix-1.mp3" }],
      },
    ],
  },
  {
    id: "marian-arabe-intermedio",
    teacherId: "marian",
    name: "Árabe Intermedio",
    days: ["lunes", "miercoles"],
    choreos: [
      {
        id: "marian-arabe-intermedio-coreo1",
        name: "Coreo 1",
        songs: [
          { title: "Remix 1", file: "marian/arabe-intermedio/remix-1.mp3" },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getTeacherById(id: string): Teacher | undefined {
  return TEACHERS.find((t) => t.id === id);
}

export function getGroupById(id: string): Group | undefined {
  return GROUPS.find((g) => g.id === id);
}

export function getGroupsByTeacher(teacherId: string, isAdmin?: boolean): Group[] {
  if (isAdmin) return GROUPS;
  return GROUPS.filter((g) => g.teacherId === teacherId);
}

export function getTeacherByUsername(username: string): Teacher | undefined {
  return TEACHERS.find((t) => t.username === username);
}

export function getDayLabel(day: DayOfWeek): string {
  const labels: Record<DayOfWeek, string> = {
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábado",
    domingo: "Domingo",
  };
  return labels[day];
}

export function getDayNumber(day: DayOfWeek): number {
  // JS Date: 0=Sunday, 1=Monday, ..., 6=Saturday
  const map: Record<DayOfWeek, number> = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
  };
  return map[day];
}

export const MONTH_NAMES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
