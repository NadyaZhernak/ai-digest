/** A single parsed stitch group: e.g. "3dc" -> { stitch: "dc", count: 3 } */
export interface StitchGroup {
  stitch: string;
  count: number;
}

/**
 * Parse crochet/knitting shorthand into structured stitch groups.
 *
 * Examples:
 *   "3dc, ch2"         -> [{stitch:"dc", count:3}, {stitch:"ch", count:2}]
 *   "hdc"              -> [{stitch:"hdc", count:1}]
 *   "3dc, ch2, 3dc, ch1" -> [{stitch:"dc",count:3},{stitch:"ch",count:2},{stitch:"dc",count:3},{stitch:"ch",count:1}]
 */
export function parsePattern(pattern: string): StitchGroup[] {
  const groups: StitchGroup[] = [];
  const tokens = pattern.split(/,\s*/);

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^(\d+)?([a-z_]+)(\d+)?$/i);
    if (!match) {
      console.warn(`[svg-gen] Unknown pattern token: "${trimmed}"`);
      continue;
    }

    const [, prefixCount, stitch, suffixCount] = match;
    const count = parseInt(prefixCount || suffixCount || '1', 10);
    groups.push({ stitch: stitch.toLowerCase(), count });
  }

  return groups;
}

/**
 * A rendering unit: either a cluster of consecutive stitches sharing a base,
 * or an arc of chain stitches connecting two clusters.
 */
export type PatternUnit =
  | { kind: 'cluster'; stitches: string[] }
  | { kind: 'arc'; count: number };

/**
 * Split a pattern into rendering units. Consecutive non-ch stitches merge
 * into one cluster; each run of `ch` becomes an arc.
 *
 *   "3dc, ch2"               -> [cluster[dc,dc,dc], arc(2)]
 *   "3dc, ch2, 3dc, ch1"     -> [cluster[dc,dc,dc], arc(2), cluster[dc,dc,dc], arc(1)]
 *   "2dc, hdc, ch2"          -> [cluster[dc,dc,hdc], arc(2)]
 */
export function parseToUnits(pattern: string): PatternUnit[] {
  const groups = parsePattern(pattern);
  const units: PatternUnit[] = [];

  for (const g of groups) {
    if (g.stitch === 'ch') {
      units.push({ kind: 'arc', count: g.count });
      continue;
    }
    const last = units[units.length - 1];
    if (last && last.kind === 'cluster') {
      for (let i = 0; i < g.count; i++) last.stitches.push(g.stitch);
    } else {
      const stitches: string[] = [];
      for (let i = 0; i < g.count; i++) stitches.push(g.stitch);
      units.push({ kind: 'cluster', stitches });
    }
  }

  return units;
}

/**
 * Expand a pattern + repeat into a flat list of stitches.
 *
 * "3dc, ch2" with repeat=4 -> [dc,dc,dc,ch,ch, dc,dc,dc,ch,ch, ...]  (4 times)
 */
export function expandPattern(pattern: string, repeat: number): string[] {
  const groups = parsePattern(pattern);
  const segment: string[] = [];
  for (const g of groups) {
    for (let i = 0; i < g.count; i++) {
      segment.push(g.stitch);
    }
  }

  const result: string[] = [];
  for (let r = 0; r < repeat; r++) {
    result.push(...segment);
  }
  return result;
}
