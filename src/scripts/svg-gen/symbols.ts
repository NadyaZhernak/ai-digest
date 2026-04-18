/** SVG rendering instructions for a single stitch symbol. */
export interface StitchSymbol {
  labelEn: string;
  labelRu: string;
  /** Render this stitch at (cx, cy) pointing in direction angle (radians). */
  render: (cx: number, cy: number, angle: number, color: string) => string;
}

// ── Helper: draw a dc-style stitch (vertical line + tick marks) ──

function dcStitch(cx: number, cy: number, angle: number, color: string, ticks: number): string {
  const len = 18;
  const tickLen = 5;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Main stem
  const x1 = cx - (len / 2) * cos;
  const y1 = cy - (len / 2) * sin;
  const x2 = cx + (len / 2) * cos;
  const y2 = cy + (len / 2) * sin;

  const parts = [
    `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${color}" stroke-width="1.4"/>`,
  ];

  // Tick marks at the midpoint
  for (let t = 0; t < ticks; t++) {
    const offset = (t - (ticks - 1) / 2) * 3;
    const mx = cx + offset * cos;
    const my = cy + offset * sin;
    const perpX = -sin * tickLen / 2;
    const perpY = cos * tickLen / 2;
    parts.push(
      `<line x1="${r(mx - perpX)}" y1="${r(my - perpY)}" x2="${r(mx + perpX)}" y2="${r(my + perpY)}" stroke="${color}" stroke-width="1.1"/>`,
    );
  }

  return parts.join('');
}

/** Round to 1 decimal place. */
function r(n: number): number {
  return Math.round(n * 10) / 10;
}

// ── Crochet symbols (CRA standard) ──

export const CROCHET_SYMBOLS: Record<string, StitchSymbol> = {
  ch: {
    labelEn: 'Chain (ch)',
    labelRu: 'Воздушная петля (ch)',
    render: (cx, cy, angle, color) => {
      const rx = 4, ry = 2.5;
      const deg = (angle * 180) / Math.PI;
      return `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${rx}" ry="${ry}" stroke="${color}" fill="none" stroke-width="1" transform="rotate(${r(deg)},${r(cx)},${r(cy)})"/>`;
    },
  },
  sl: {
    labelEn: 'Slip stitch (sl st)',
    labelRu: 'Соединительный столбик (sl st)',
    render: (cx, cy, _angle, color) =>
      `<circle cx="${r(cx)}" cy="${r(cy)}" r="2" fill="${color}"/>`,
  },
  sc: {
    labelEn: 'Single crochet (sc)',
    labelRu: 'Столбик без накида (сбн)',
    render: (cx, cy, angle, color) => {
      const s = 5;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const perpX = -sin * s;
      const perpY = cos * s;
      return [
        `<line x1="${r(cx - perpX)}" y1="${r(cy - perpY)}" x2="${r(cx + perpX)}" y2="${r(cy + perpY)}" stroke="${color}" stroke-width="1.4"/>`,
        `<line x1="${r(cx - s * cos)}" y1="${r(cy - s * sin)}" x2="${r(cx + s * cos)}" y2="${r(cy + s * sin)}" stroke="${color}" stroke-width="1.4"/>`,
      ].join('');
    },
  },
  hdc: {
    labelEn: 'Half double crochet (hdc)',
    labelRu: 'Полустолбик с накидом (пссн)',
    render: (cx, cy, angle, color) => dcStitch(cx, cy, angle, color, 0),
  },
  dc: {
    labelEn: 'Double crochet (dc)',
    labelRu: 'Столбик с накидом (ссн)',
    render: (cx, cy, angle, color) => dcStitch(cx, cy, angle, color, 1),
  },
  tr: {
    labelEn: 'Treble crochet (tr)',
    labelRu: 'Столбик с 2 накидами (с2н)',
    render: (cx, cy, angle, color) => dcStitch(cx, cy, angle, color, 2),
  },
  dtr: {
    labelEn: 'Double treble (dtr)',
    labelRu: 'Столбик с 3 накидами (с3н)',
    render: (cx, cy, angle, color) => dcStitch(cx, cy, angle, color, 3),
  },
  inc: {
    labelEn: 'Increase (inc)',
    labelRu: 'Прибавка (V)',
    render: (cx, cy, _angle, color) => {
      const s = 5;
      return `<path d="M${r(cx - s)},${r(cy - s)} L${r(cx)},${r(cy + s)} L${r(cx + s)},${r(cy - s)}" stroke="${color}" fill="none" stroke-width="1.4"/>`;
    },
  },
  dec: {
    labelEn: 'Decrease (dec)',
    labelRu: 'Убавка (X)',
    render: (cx, cy, _angle, color) => {
      const s = 4;
      return [
        `<line x1="${r(cx - s)}" y1="${r(cy - s)}" x2="${r(cx + s)}" y2="${r(cy + s)}" stroke="${color}" stroke-width="1.4"/>`,
        `<line x1="${r(cx + s)}" y1="${r(cy - s)}" x2="${r(cx - s)}" y2="${r(cy + s)}" stroke="${color}" stroke-width="1.4"/>`,
      ].join('');
    },
  },
};

// ── Knitting symbols ──

export const KNITTING_SYMBOLS: Record<string, StitchSymbol> = {
  knit: {
    labelEn: 'Knit',
    labelRu: 'Лицевая петля',
    render: (cx, cy, _angle, color) =>
      `<rect x="${r(cx - 10)}" y="${r(cy - 10)}" width="20" height="20" fill="none" stroke="${color}" stroke-width="0.8"/>`,
  },
  purl: {
    labelEn: 'Purl',
    labelRu: 'Изнаночная петля',
    render: (cx, cy, _angle, color) => [
      `<rect x="${r(cx - 10)}" y="${r(cy - 10)}" width="20" height="20" fill="none" stroke="${color}" stroke-width="0.8"/>`,
      `<line x1="${r(cx - 5)}" y1="${r(cy)}" x2="${r(cx + 5)}" y2="${r(cy)}" stroke="${color}" stroke-width="1.2"/>`,
    ].join(''),
  },
  yo: {
    labelEn: 'Yarn over',
    labelRu: 'Накид',
    render: (cx, cy, _angle, color) =>
      `<circle cx="${r(cx)}" cy="${r(cy)}" r="4" fill="none" stroke="${color}" stroke-width="1"/>`,
  },
};

/** Get symbol map by craft type. */
export function getSymbols(craft: 'crochet' | 'knitting'): Record<string, StitchSymbol> {
  return craft === 'crochet' ? CROCHET_SYMBOLS : KNITTING_SYMBOLS;
}

// ────────────────────────────────────────────────────
// V-silhouette rendering (for radial motif charts)
// ────────────────────────────────────────────────────

/** Tick count per stitch type for the dc-family (CRA standard). */
const TICKS: Record<string, number> = {
  hdc: 0,
  dc: 1,
  tr: 2,
  dtr: 3,
  sc: 0,
};

/** Get tick count for a stitch type. Returns 0 for unknown/non-dc stitches. */
export function stitchTicks(stitch: string): number {
  return TICKS[stitch] ?? 0;
}

/**
 * Render a single stitch stem from its base (anchored in prev round)
 * to its top (current round's cap). Tick crossbars are perpendicular
 * to the stem, evenly spaced on the upper 60% of the shaft.
 */
export function renderStitchStem(
  baseX: number, baseY: number,
  topX: number, topY: number,
  ticks: number,
  color: string,
): string {
  const dx = topX - baseX;
  const dy = topY - baseY;
  const len = Math.hypot(dx, dy);
  if (len < 0.01) return '';

  // Unit vector along stem (base -> top) and perpendicular
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;

  const tickLen = 5;
  const parts: string[] = [
    `<line x1="${r(baseX)}" y1="${r(baseY)}" x2="${r(topX)}" y2="${r(topY)}" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>`,
  ];

  // Ticks on the upper portion of the stem, starting at ~40% from base.
  for (let i = 0; i < ticks; i++) {
    const t = 0.4 + (ticks === 1 ? 0 : i * 0.18);
    const tx = baseX + ux * len * t;
    const ty = baseY + uy * len * t;
    parts.push(
      `<line x1="${r(tx - px * tickLen / 2)}" y1="${r(ty - py * tickLen / 2)}" x2="${r(tx + px * tickLen / 2)}" y2="${r(ty + py * tickLen / 2)}" stroke="${color}" stroke-width="1.1" stroke-linecap="round"/>`,
    );
  }

  return parts.join('');
}

/**
 * Render a cluster of stitches (e.g. 3dc) that all anchor at the same base
 * point and fan out at the top. Creates a V/Y-silhouette where multiple
 * stems share a base — the visual language of crochet charts.
 *
 * @param baseX,baseY  shared anchor (on previous round's edge)
 * @param topCx,topCy  center of the top caps (on this round's edge)
 * @param sideNx,sideNy unit vector along the "side" direction (stitches spread along this)
 * @param spread       total width of the top caps
 */
export function renderCluster(
  stitches: string[],
  baseX: number, baseY: number,
  topCx: number, topCy: number,
  sideNx: number, sideNy: number,
  spread: number,
  color: string,
): string {
  const n = stitches.length;
  if (n === 0) return '';
  const parts: string[] = [];
  const step = n === 1 ? 0 : spread / (n - 1);

  for (let i = 0; i < n; i++) {
    const off = n === 1 ? 0 : (i - (n - 1) / 2) * step;
    const tx = topCx + sideNx * off;
    const ty = topCy + sideNy * off;
    parts.push(renderStitchStem(baseX, baseY, tx, ty, stitchTicks(stitches[i]), color));
  }
  return parts.join('');
}

/**
 * Render a chain-stitch ellipse at (cx, cy), oriented tangent to direction `angle`.
 * The ellipse's long axis aligns with the direction of travel along the arc.
 */
export function renderChainEllipse(cx: number, cy: number, angle: number, color: string): string {
  const rx = 4, ry = 2.5;
  const deg = (angle * 180) / Math.PI;
  return `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${rx}" ry="${ry}" stroke="${color}" fill="none" stroke-width="1" transform="rotate(${r(deg)},${r(cx)},${r(cy)})"/>`;
}

/**
 * Render a chain arc: N ellipses along a quadratic Bezier from (fromX,fromY)
 * to (toX,toY). The arc bulges in direction (outX,outY) — typically the unit
 * vector pointing outward from the motif center — by `bulge` pixels at the
 * midpoint. Each ellipse is oriented tangent to the arc.
 */
export function renderChainArc(
  n: number,
  fromX: number, fromY: number,
  toX: number, toY: number,
  outX: number, outY: number,
  bulge: number,
  color: string,
): string {
  if (n <= 0) return '';

  const chord = Math.hypot(toX - fromX, toY - fromY);
  if (chord < 0.01) return '';

  const parts: string[] = [];

  // Quadratic Bezier control point: chord midpoint pushed along (outX,outY)
  const mx = (fromX + toX) / 2 + outX * bulge;
  const my = (fromY + toY) / 2 + outY * bulge;

  for (let i = 0; i < n; i++) {
    const t = (i + 1) / (n + 1); // evenly spaced, excluding endpoints
    const omt = 1 - t;
    // Point on Bezier
    const bx = omt * omt * fromX + 2 * omt * t * mx + t * t * toX;
    const by = omt * omt * fromY + 2 * omt * t * my + t * t * toY;
    // Tangent for ellipse rotation
    const tx = 2 * omt * (mx - fromX) + 2 * t * (toX - mx);
    const ty = 2 * omt * (my - fromY) + 2 * t * (toY - my);
    parts.push(renderChainEllipse(bx, by, Math.atan2(ty, tx), color));
  }

  return parts.join('');
}
