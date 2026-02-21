import photo42cc from "../assets/42cc.png";
import maze42cc from "../assets/maze.png";
import quality1 from "../assets/quality1.webp";
import quality2 from "../assets/quality2.webp";
import ilife1 from "../assets/ilife1.jpg";
import ilife2 from "../assets/ilife2.jpg";


export function classNames(...classes: unknown[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export function setCookie(name: string, value: string, days: number = 7): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}

export type ProjectItem = {
  pinned: boolean;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  year: string;
  heroTitle?: string;
  heroDescription?: string;
  overview?: string[];
  role?: string;
  duration?: string;
  status?: string;
  banner?: string;
  gallery?: string[];
  links?: { label: string; href: string }[];
};

export const projectsList: ProjectItem[] = [
  {
    pinned: true,
    slug: "42cc",
    title: "42CC",
    description: "All the projects in the core curriculum of Ecole 42",
    tags: ["C", "Python"],
    year: "2025–2026",
    heroTitle: "42CC — Core Curriculum Platform",
    heroDescription:
      "Educational platform to structure learning paths, track progress, and deliver a modern student experience.",
    overview: [
      "42CC is a platform for organizing learning paths, tracking key milestones, and offering intuitive navigation between projects.",
      "Python and C projects are available in CC to help understand the basics of programming and learn how to learn."
    ],
    role: "Learner",
    duration: "1 year",
    status: "In progress",
    banner: photo42cc,
    gallery: [maze42cc],
    links: [{ label: "GitHub Repo", href: "https://github.com/0xS4cha" }]
  },
  {
    pinned: true,
    slug: "ldopvp",
    title: "LDOPVP",
    description: "The most avanced pvp server with lot of features",
    tags: ["Lua", "SQL", "TypeScript", "React"],
    year: "2025",
    heroTitle: "LDOPVP",
    heroDescription: "The most avanced pvp server with lot of features",
    overview: ["The most avanced pvp server with lot of features."],
    role: "Lead dev",
    duration: "4 months",
    status: "Closed",
    gallery: [],
    links: [{label: "Youtube", href: "https://youtu.be/mO9_aWqJUUg?si=N-CrKZ8Xj6YJ6Tas"}]
  },
  {
    pinned: false,
    slug: "ltd-flashfa",
    title: "LTD-FlashFA",
    description: "Company dashboard for managing employees and analyzing statistics.",
    tags: ["Laravel", "SQL"],
    year: "2024",
    heroTitle: "LTD-FlashFA",
    heroDescription: "Company dashboard for managing employees and analyzing statistics.",
    overview: ["Company dashboard for managing employees and analyzing statistics."],
    role: "Lead Developer",
    duration: "2 month",
    status: "Finish",
    gallery: [],
    links: []
  },
  {
    pinned: false,
    slug: "quality-freeroam",
    title: "Quality Freeroam",
    description: "Advanced freeroam server for FiveM with scene, 1v1 and lot of game mode.",
    tags: ["Lua", "SQL", "Typescript", "React"],
    year: "2025",
    heroTitle: "Quality Freeroam",
    heroDescription: "Advanced freeroam server for FiveM with scene, 1v1 and lot of game mode.",
    overview: ["This was the first project where I was able to learn how to integrate large systems with React for the front end and Lua for the back end."],
    role: "Developer",
    duration: "4 month",
    status: "Closed",
    gallery: [quality1, quality2],
    links: [{label: "scene sys", href: "https://www.youtube.com/watch?v=aBSwuvvjdFM"}]
  },
  {
    pinned: false,
    slug: "ylcrp",
    title: "YLC-RP",
    description: "FiveM roleplay Liberty city server focused on immersion and community.",
    tags: ["Lua", "SQL"],
    year: "2022 & 2023",
    heroTitle: "YLC-RP",
    heroDescription: "Roleplay experience built around custom systems and economy in Liberty City.",
    overview: ["Roleplay server with custom systems, economy, and community features."],
    role: "Lead Developer",
    duration: "8 months",
    status: "Finished",
    gallery: [],
    links: []
  },
  {
    pinned: true,
    slug: "iliferp",
    title: "IslandLife RP",
    description: "FiveM roleplay server with modern UI and custom gameplay.",
    tags: ["Lua", "SQL", "Typescript", "React"],
    year: "2025",
    heroTitle: "IslandLife RP",
    heroDescription: "Custom RP project with React-based UI and Lua backend.",
    overview: ["Roleplay server focused on clean UI and scalable server systems."],
    role: "Founder & Developer",
    duration: "2 months",
    status: "Finished",
    gallery: [ilife1, ilife2],
    links: [
      {label: "inventory", href: "https://www.youtube.com/watch?v=iWUSa1FmIxs"},
      {label: "clothing store", href: "https://www.youtube.com/watch?v=ldcx9GAZM6Q"},
    ]
  },
  {
    pinned: false,
    slug: "astrarp",
    title: "AstraRP",
    description: "FiveM roleplay server with lightweight custom features.",
    tags: ["Lua"],
    year: "2025",
    heroTitle: "AstraRP",
    heroDescription: "Lightweight RP experience with curated systems.",
    overview: ["Compact RP server with a focus on stability and gameplay flow."],
    role: "Player & Developer",
    duration: "2 months",
    status: "Finished",
    gallery: [],
    links: []
  },
  {
    pinned: false,
    slug: "diamondcity",
    title: "DiamondCity RP",
    description: "FiveM roleplay server with long-term support and updates.",
    tags: ["Lua"],
    year: "2024 & 2025",
    heroTitle: "DiamondCity RP",
    heroDescription: "RP server with iterative feature development and maintenance.",
    overview: ["Ongoing RP project with custom systems and content updates."],
    role: "Freelance Developer",
    duration: "6 months",
    status: "Finished",
    gallery: [],
    links: []
  },
];

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: any;
      meshLineMaterial: any;
    }
  }
}