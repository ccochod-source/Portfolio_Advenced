import type { ConstellationSkill, SkillGroup } from "./types";

export const GROUP_COLORS: Record<SkillGroup, string> = {
  ai: "#ffb04f",
  build: "#ffe4a1",
  business: "#ff8b55",
};

export const GROUP_TAILWIND: Record<SkillGroup, string> = {
  ai: "bg-sun",
  build: "bg-gold",
  business: "bg-coral",
};

const CLUSTERS: Record<SkillGroup, { center: [number, number, number]; radius: number }> = {
  ai: { center: [0, 0.1, 0], radius: 2.4 },
  build: { center: [-3.3, 0.6, -0.9], radius: 1.45 },
  business: { center: [3.1, -0.6, -1.1], radius: 1.35 },
};

export type LayoutNode = {
  skill: ConstellationSkill;
  index: number;
  position: [number, number, number];
  radius: number;
  color: string;
};

export type LayoutEdge = { a: number; b: number; projects: string[] };

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

export const nodeRadius = (weight = 3) => 0.035 + Math.min(Math.max(weight, 1), 5) * 0.009;

function fibonacciSphere(count: number, i: number): [number, number, number] {
  const y = count === 1 ? 0 : 1 - (2 * (i + 0.5)) / count;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = i * Math.PI * (3 - Math.sqrt(5));
  return [Math.cos(theta) * r, y, Math.sin(theta) * r];
}

export type LayoutOptions = { vertical?: boolean };

export function layoutSkills(skills: ConstellationSkill[], { vertical = false }: LayoutOptions = {}): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const byGroup: Record<SkillGroup, ConstellationSkill[]> = { ai: [], build: [], business: [] };
  for (const s of skills) byGroup[s.group].push(s);

  const nodes: LayoutNode[] = [];
  (Object.keys(byGroup) as SkillGroup[]).forEach((group) => {
    const list = byGroup[group];
    const { center, radius } = CLUSTERS[group];
    list.forEach((skill, i) => {
      const [x, y, z] = fibonacciSphere(list.length, i);
      const jitter = 0.65 + hash(skill.id) * 0.45;
      const px = center[0] + x * radius * jitter;
      const py = center[1] + y * radius * jitter;
      const pz = center[2] + z * radius * jitter;
      nodes.push({
        skill,
        index: skills.indexOf(skill),
        position: vertical ? [py * 1.12, px * 0.82, pz] : [px, py, pz],
        radius: nodeRadius(skill.weight),
        color: GROUP_COLORS[group],
      });
    });
  });
  nodes.sort((a, b) => a.index - b.index);

  const edges: LayoutEdge[] = [];
  for (let a = 0; a < skills.length; a++) {
    for (let b = a + 1; b < skills.length; b++) {
      const sa = new Set((skills[a].relatedProjects ?? []).map((p) => p.slug));
      const shared = (skills[b].relatedProjects ?? []).filter((p) => sa.has(p.slug)).map((p) => p.slug);
      if (shared.length) edges.push({ a, b, projects: shared });
    }
  }
  return { nodes, edges };
}

export const skillsAreLinked = (edges: LayoutEdge[], a: number, b: number) =>
  edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
